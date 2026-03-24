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
export async function publishToFacebook(vehicleId: string, message?: string) {
  const d = await getDealership();
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { photos: { orderBy: { order: "asc" } } },
  });
  if (!vehicle) throw new Error("Vehículo no encontrado");

  const postMessage =
    message ||
    buildVehicleMessage(vehicle);

  let postId: string | null = null;
  try {
    // Post to Facebook page
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

// Publish to Instagram (requires image URL)
export async function publishToInstagram(vehicleId: string, message?: string) {
  const d = await getDealership();
  if (!d.metaIgAccountId) throw new Error("Instagram no está vinculado");

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { photos: { orderBy: { order: "asc" } } },
  });
  if (!vehicle) throw new Error("Vehículo no encontrado");

  const caption = message || buildVehicleMessage(vehicle);
  const imageUrl = vehicle.photos[0]?.url;

  if (!imageUrl) throw new Error("El vehículo necesita al menos una foto para publicar en Instagram");

  let postId: string | null = null;
  try {
    // Step 1: Create media container
    const containerRes = await metaFetch(
      `${META_API_BASE}/${d.metaIgAccountId}/media`,
      {
        method: "POST",
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: d.metaAccessToken,
        }),
      }
    );
    const container = await containerRes.json();
    if (container.error) throw new Error(container.error.message);

    // Step 2: Publish the container
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

function buildVehicleMessage(vehicle: {
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
}) {
  const lines: string[] = [];
  lines.push(`🚗 ${vehicle.name}`);
  if (vehicle.year) lines.push(`📅 Año: ${vehicle.year}`);
  if (vehicle.kilometers) lines.push(`🛣️ Km: ${vehicle.kilometers.toLocaleString("es-AR")}`);
  if (vehicle.fuel) lines.push(`⛽ Combustible: ${vehicle.fuel}`);
  if (vehicle.transmission) lines.push(`⚙️ Transmisión: ${vehicle.transmission}`);
  if (vehicle.priceARS) lines.push(`💰 Precio: $${vehicle.priceARS.toLocaleString("es-AR")}`);
  if (vehicle.priceUSD) lines.push(`💵 USD: $${vehicle.priceUSD.toLocaleString("en-US")}`);
  if (vehicle.locationCity && vehicle.locationProvince) {
    lines.push(`📍 ${vehicle.locationCity}, ${vehicle.locationProvince}`);
  }
  if (vehicle.description) lines.push(`\n${vehicle.description}`);
  lines.push("\n📩 Consultá por privado o WhatsApp");
  return lines.join("\n");
}
