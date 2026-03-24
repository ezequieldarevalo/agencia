import { prisma } from "@/lib/prisma";

const META_API_BASE = "https://graph.facebook.com/v19.0";

async function getDealership() {
  const d = await prisma.dealership.findFirst();
  if (!d || !d.metaAccessToken) throw new Error("Meta no está conectado");
  return d;
}

function metaFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
}

// Connect: save access token & fetch page info
export async function connectMeta(accessToken: string) {
  // Get pages for this token
  const res = await metaFetch(
    `${META_API_BASE}/me/accounts?access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const page = data.data?.[0];
  if (!page) throw new Error("No se encontró ninguna página de Facebook");

  // Get Instagram business account linked to the page
  const igRes = await metaFetch(
    `${META_API_BASE}/${page.id}?fields=instagram_business_account{id,username}&access_token=${page.access_token}`
  );
  const igData = await igRes.json();

  const dealership = await prisma.dealership.findFirst();
  await prisma.dealership.update({
    where: { id: dealership!.id },
    data: {
      metaIntegration: true,
      metaAccessToken: page.access_token, // Use page token (long-lived)
      metaPageId: page.id,
      metaPageName: page.name,
      metaIgAccountId: igData.instagram_business_account?.id || null,
      metaIgUsername: igData.instagram_business_account?.username || null,
      metaConnectedAt: new Date(),
    },
  });

  return {
    pageName: page.name,
    igUsername: igData.instagram_business_account?.username,
  };
}

export async function disconnectMeta() {
  const dealership = await prisma.dealership.findFirst();
  await prisma.dealership.update({
    where: { id: dealership!.id },
    data: {
      metaIntegration: false,
      metaAccessToken: null,
      metaPageId: null,
      metaPageName: null,
      metaIgAccountId: null,
      metaIgUsername: null,
      metaConnectedAt: null,
    },
  });
}

// Publish a vehicle to Facebook page
// Algorithm optimization: Post with photo gets 10x more reach than text-only
export async function publishToFacebook(vehicleId: string, message?: string) {
  const d = await getDealership();
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { photos: { orderBy: { order: "asc" }, take: 10 } },
  });
  if (!vehicle) throw new Error("Vehículo no encontrado");

  const postMessage =
    message ||
    buildFacebookMessage(vehicle, d);

  let postId: string | null = null;
  try {
    if (vehicle.photos.length > 0) {
      // Strategy: Upload photo + message for maximum engagement
      // Facebook algorithm heavily favors native photo posts over text-only
      const photoUrl = vehicle.photos[0].url;
      const res = await metaFetch(`${META_API_BASE}/${d.metaPageId}/photos`, {
        method: "POST",
        body: JSON.stringify({
          url: photoUrl,
          message: postMessage,
          access_token: d.metaAccessToken,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      postId = data.post_id || data.id;
    } else {
      // Fallback to text post only if no photos
      const res = await metaFetch(`${META_API_BASE}/${d.metaPageId}/feed`, {
        method: "POST",
        body: JSON.stringify({
          message: postMessage,
          access_token: d.metaAccessToken,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      postId = data.id;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido";
    await prisma.metaPublication.create({
      data: {
        vehicleId,
        platform: "FACEBOOK",
        status: "FAILED",
        message: postMessage,
        errorMessage: errorMsg,
      },
    });
    throw err;
  }

  return prisma.metaPublication.create({
    data: {
      vehicleId,
      platform: "FACEBOOK",
      status: "PUBLISHED",
      postId,
      message: postMessage,
      publishedAt: new Date(),
    },
  });
}

// Publish to Instagram - supports CAROUSEL (up to 10 images) for max engagement
// IG algorithm rewards carousel posts with 3x more reach than single image
export async function publishToInstagram(vehicleId: string, message?: string) {
  const d = await getDealership();
  if (!d.metaIgAccountId) throw new Error("Instagram no está vinculado");

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { photos: { orderBy: { order: "asc" }, take: 10 } },
  });
  if (!vehicle) throw new Error("Vehículo no encontrado");

  const caption = message || buildInstagramCaption(vehicle, d);

  if (!vehicle.photos.length) throw new Error("El vehículo necesita al menos una foto para publicar en Instagram");

  let postId: string | null = null;
  try {
    if (vehicle.photos.length >= 2) {
      // CAROUSEL post - IG algorithm strongly favors carousels
      // Step 1: Create individual media containers for each photo
      const childContainerIds: string[] = [];
      for (const photo of vehicle.photos) {
        const containerRes = await metaFetch(
          `${META_API_BASE}/${d.metaIgAccountId}/media`,
          {
            method: "POST",
            body: JSON.stringify({
              image_url: photo.url,
              is_carousel_item: true,
              access_token: d.metaAccessToken,
            }),
          }
        );
        const container = await containerRes.json();
        if (container.error) throw new Error(container.error.message);
        childContainerIds.push(container.id);
      }

      // Step 2: Create carousel container
      const carouselRes = await metaFetch(
        `${META_API_BASE}/${d.metaIgAccountId}/media`,
        {
          method: "POST",
          body: JSON.stringify({
            media_type: "CAROUSEL",
            caption,
            children: childContainerIds,
            access_token: d.metaAccessToken,
          }),
        }
      );
      const carousel = await carouselRes.json();
      if (carousel.error) throw new Error(carousel.error.message);

      // Step 3: Publish the carousel
      const publishRes = await metaFetch(
        `${META_API_BASE}/${d.metaIgAccountId}/media_publish`,
        {
          method: "POST",
          body: JSON.stringify({
            creation_id: carousel.id,
            access_token: d.metaAccessToken,
          }),
        }
      );
      const published = await publishRes.json();
      if (published.error) throw new Error(published.error.message);
      postId = published.id;
    } else {
      // Single image post (fallback when only 1 photo)
      const containerRes = await metaFetch(
        `${META_API_BASE}/${d.metaIgAccountId}/media`,
        {
          method: "POST",
          body: JSON.stringify({
            image_url: vehicle.photos[0].url,
            caption,
            access_token: d.metaAccessToken,
          }),
        }
      );
      const container = await containerRes.json();
      if (container.error) throw new Error(container.error.message);

      const publishRes = await metaFetch(
        `${META_API_BASE}/${d.metaIgAccountId}/media_publish`,
        {
          method: "POST",
          body: JSON.stringify({
            creation_id: container.id,
            access_token: d.metaAccessToken,
          }),
        }
      );
      const published = await publishRes.json();
      if (published.error) throw new Error(published.error.message);
      postId = published.id;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido";
    await prisma.metaPublication.create({
      data: {
        vehicleId,
        platform: "INSTAGRAM",
        status: "FAILED",
        message: caption,
        errorMessage: errorMsg,
      },
    });
    throw err;
  }

  return prisma.metaPublication.create({
    data: {
      vehicleId,
      platform: "INSTAGRAM",
      status: "PUBLISHED",
      postId,
      message: caption,
      publishedAt: new Date(),
    },
  });
}

// Remove a publication
export async function removeMetaPublication(publicationId: string) {
  const pub = await prisma.metaPublication.findUnique({ where: { id: publicationId } });
  if (!pub || !pub.postId) throw new Error("Publicación no encontrada");

  const d = await getDealership();
  try {
    await metaFetch(`${META_API_BASE}/${pub.postId}`, {
      method: "DELETE",
      body: JSON.stringify({ access_token: d.metaAccessToken }),
    });
  } catch {
    // Best effort removal
  }

  return prisma.metaPublication.update({
    where: { id: publicationId },
    data: { status: "REMOVED" },
  });
}

// Get publications with stats
export async function getMetaPublications(vehicleId?: string) {
  return prisma.metaPublication.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });
}

// Get Meta connection info
export async function getMetaStatus() {
  const d = await prisma.dealership.findFirst();
  if (!d) return { connected: false };
  return {
    connected: d.metaIntegration,
    pageName: d.metaPageName,
    igUsername: d.metaIgUsername,
    connectedAt: d.metaConnectedAt,
  };
}

// Facebook message: Optimized for engagement and FB algorithm
// FB rewards: emojis, line breaks, questions/CTAs, and moderate length (150-300 chars ideal)
function buildFacebookMessage(vehicle: {
  name: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  version?: string | null;
  kilometers?: number | null;
  priceARS?: number | null;
  priceUSD?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  locationCity?: string | null;
  locationProvince?: string | null;
  domain?: string | null;
  description?: string | null;
}, dealership: {
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
}) {
  const lines: string[] = [];

  // Hook line - FB algorithm rewards posts that stop the scroll
  lines.push(`🔥 NUEVA UNIDAD DISPONIBLE 🔥`);
  lines.push("");
  lines.push(`🚗 ${vehicle.name}`);
  lines.push("");

  // Specs in a clear, scannable format
  if (vehicle.year) lines.push(`📅 Año: ${vehicle.year}`);
  if (vehicle.kilometers != null) lines.push(`🛣️ ${vehicle.kilometers.toLocaleString("es-AR")} km`);
  if (vehicle.fuel) {
    const fuelMap: Record<string, string> = {
      NAFTA: "Nafta", DIESEL: "Diésel", GNC: "GNC", ELECTRICO: "Eléctrico", HIBRIDO: "Híbrido",
    };
    lines.push(`⛽ ${fuelMap[vehicle.fuel] || vehicle.fuel}`);
  }
  if (vehicle.transmission) {
    lines.push(`⚙️ ${vehicle.transmission === "MANUAL" ? "Manual" : "Automática"}`);
  }
  lines.push("");

  // Price - prominent
  if (vehicle.priceARS) lines.push(`💰 $${vehicle.priceARS.toLocaleString("es-AR")}`);
  if (vehicle.priceUSD) lines.push(`💵 USD ${vehicle.priceUSD.toLocaleString("en-US")}`);
  lines.push("");

  // Benefits - triggers engagement
  lines.push(`✅ Financiación disponible`);
  lines.push(`✅ Aceptamos tu usado`);
  lines.push(`✅ Garantía mecánica`);
  lines.push("");

  // Location
  const city = vehicle.locationCity || dealership.city;
  const province = vehicle.locationProvince || dealership.province;
  if (city || province) {
    lines.push(`📍 ${[city, province].filter(Boolean).join(", ")}`);
  }
  if (dealership.phone) lines.push(`📞 ${dealership.phone}`);
  lines.push("");

  // CTA - FB algorithm rewards posts that generate comments
  lines.push(`💬 ¡Consultá por privado o dejá tu comentario!`);

  return lines.join("\n");
}

// Instagram caption: Optimized for IG algorithm (hashtags, engagement, discoverability)
// IG rewards: hashtags (20-25 is ideal), CTA that drives saves & shares, carousel posts
function buildInstagramCaption(vehicle: {
  name: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  version?: string | null;
  kilometers?: number | null;
  priceARS?: number | null;
  priceUSD?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  locationCity?: string | null;
  locationProvince?: string | null;
  domain?: string | null;
  description?: string | null;
}, dealership: {
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
}) {
  const lines: string[] = [];

  // Hook line - first line is what shows in feed before "más..."
  lines.push(`🚗 ${vehicle.name} ${vehicle.year ? `| ${vehicle.year}` : ""}`);
  lines.push("");

  // Clean, visual specs
  const specs: string[] = [];
  if (vehicle.year) specs.push(`📅 ${vehicle.year}`);
  if (vehicle.kilometers != null) specs.push(`🛣️ ${vehicle.kilometers.toLocaleString("es-AR")} km`);
  if (vehicle.fuel) {
    const fuelMap: Record<string, string> = {
      NAFTA: "Nafta", DIESEL: "Diésel", GNC: "GNC", ELECTRICO: "Eléctrico", HIBRIDO: "Híbrido",
    };
    specs.push(`⛽ ${fuelMap[vehicle.fuel] || vehicle.fuel}`);
  }
  if (vehicle.transmission) {
    specs.push(`⚙️ ${vehicle.transmission === "MANUAL" ? "Manual" : "Automática"}`);
  }
  lines.push(specs.join("\n"));
  lines.push("");

  if (vehicle.priceARS) lines.push(`💰 $${vehicle.priceARS.toLocaleString("es-AR")}`);
  if (vehicle.priceUSD) lines.push(`💵 USD ${vehicle.priceUSD.toLocaleString("en-US")}`);
  lines.push("");

  lines.push(`✅ Financiación | ✅ Permuta | ✅ Garantía`);
  lines.push("");

  const city = vehicle.locationCity || dealership.city;
  const province = vehicle.locationProvince || dealership.province;
  if (city || province) lines.push(`📍 ${[city, province].filter(Boolean).join(", ")}`);
  if (dealership.phone) lines.push(`📲 ${dealership.phone}`);
  lines.push("");

  // CTA - IG algorithm rewards saves (guardados) and shares
  lines.push(`💬 Consultá por DM`);
  lines.push(`📌 Guardá este post para no perderlo`);
  lines.push(`👥 Etiquetá a quien le pueda interesar`);
  lines.push("");

  // HASHTAGS - critical for IG discoverability
  // Mix of high-volume (reach) + mid-volume (niche) + location-based
  const hashtags: string[] = [];

  // High volume - auto market Argentina
  hashtags.push("#autos", "#autosusados", "#ventadeautos", "#agenciadeautos");
  hashtags.push("#autosargentina", "#comprayventa", "#vehiculos");

  // Brand-specific (high search volume on IG)
  if (vehicle.brand) {
    const brandTag = vehicle.brand.toLowerCase().replace(/\s+/g, "");
    hashtags.push(`#${brandTag}`);
    if (vehicle.model) {
      const modelTag = vehicle.model.toLowerCase().replace(/\s+/g, "");
      hashtags.push(`#${brandTag}${modelTag}`);
      hashtags.push(`#${modelTag}`);
    }
  }

  // Year-based
  if (vehicle.year) hashtags.push(`#autos${vehicle.year}`);

  // Fuel type
  if (vehicle.fuel) {
    const fuelTags: Record<string, string[]> = {
      NAFTA: ["#nafta", "#naftero"],
      DIESEL: ["#diesel", "#turbodiesel"],
      GNC: ["#gnc", "#gnv"],
      ELECTRICO: ["#autoelectrico", "#electrico"],
      HIBRIDO: ["#hibrido", "#hybrid"],
    };
    if (fuelTags[vehicle.fuel]) hashtags.push(...fuelTags[vehicle.fuel]);
  }

  // Body type
  if (vehicle.version) {
    const versionTag = vehicle.version.toLowerCase().replace(/\s+/g, "");
    hashtags.push(`#${versionTag}`);
  }

  // Location-based hashtags (crucial for local discovery)
  if (city) {
    const cityTag = city.toLowerCase().replace(/\s+/g, "");
    hashtags.push(`#autos${cityTag}`, `#${cityTag}`);
  }
  if (province) {
    const provTag = province.toLowerCase().replace(/\s+/g, "");
    hashtags.push(`#autos${provTag}`);
  }

  // General engagement hashtags
  hashtags.push("#financiacion", "#permuta", "#oportunidad");

  // IG allows 30 max, sweet spot is 20-25
  const uniqueHashtags = Array.from(new Set(hashtags)).slice(0, 25);
  lines.push(uniqueHashtags.join(" "));

  return lines.join("\n");
}
