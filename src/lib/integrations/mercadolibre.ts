import { prisma } from "@/lib/prisma";

const ML_API_BASE = "https://api.mercadolibre.com";
const ML_AUTH_URL = "https://auth.mercadolibre.com.ar";
const ML_APP_ID = process.env.ML_APP_ID || "";
const ML_SECRET = process.env.ML_CLIENT_SECRET || "";
const ML_REDIRECT_URI = process.env.ML_REDIRECT_URI || "http://localhost:3000/api/integrations/mercadolibre/callback";

async function getDealership() {
  const d = await prisma.dealership.findFirst();
  if (!d || !d.mlAccessToken) throw new Error("MercadoLibre no está conectado");
  return d;
}

async function mlFetch(path: string, token: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${ML_API_BASE}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// Get OAuth authorization URL
export function getAuthUrl() {
  return `${ML_AUTH_URL}/authorization?response_type=code&client_id=${ML_APP_ID}&redirect_uri=${encodeURIComponent(ML_REDIRECT_URI)}`;
}

// Exchange code for tokens
export async function connectWithCode(code: string) {
  const res = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: ML_APP_ID,
      client_secret: ML_SECRET,
      code,
      redirect_uri: ML_REDIRECT_URI,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.message || data.error);

  // Get user info
  const userRes = await mlFetch("/users/me", data.access_token);
  const userData = await userRes.json();

  const dealership = await prisma.dealership.findFirst();
  await prisma.dealership.update({
    where: { id: dealership!.id },
    data: {
      mlIntegration: true,
      mlAccessToken: data.access_token,
      mlRefreshToken: data.refresh_token,
      mlUserId: String(userData.id),
      mlNickname: userData.nickname,
      mlConnectedAt: new Date(),
      mlTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return { nickname: userData.nickname, userId: userData.id };
}

// Connect with manual token (for testing)
export async function connectManual(accessToken: string) {
  const userRes = await mlFetch("/users/me", accessToken);
  const userData = await userRes.json();
  if (userData.error) throw new Error(userData.message || "Token inválido");

  const dealership = await prisma.dealership.findFirst();
  await prisma.dealership.update({
    where: { id: dealership!.id },
    data: {
      mlIntegration: true,
      mlAccessToken: accessToken,
      mlUserId: String(userData.id),
      mlNickname: userData.nickname,
      mlConnectedAt: new Date(),
    },
  });

  return { nickname: userData.nickname, userId: userData.id };
}

export async function disconnectMercadoLibre() {
  const dealership = await prisma.dealership.findFirst();
  await prisma.dealership.update({
    where: { id: dealership!.id },
    data: {
      mlIntegration: false,
      mlAccessToken: null,
      mlRefreshToken: null,
      mlUserId: null,
      mlNickname: null,
      mlConnectedAt: null,
      mlTokenExpiresAt: null,
    },
  });
}

// Refresh access token
async function refreshToken() {
  const d = await prisma.dealership.findFirst();
  if (!d?.mlRefreshToken) throw new Error("No hay refresh token disponible");

  const res = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: ML_APP_ID,
      client_secret: ML_SECRET,
      refresh_token: d.mlRefreshToken,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error("Error renovando token: " + data.message);

  await prisma.dealership.update({
    where: { id: d.id },
    data: {
      mlAccessToken: data.access_token,
      mlRefreshToken: data.refresh_token,
      mlTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

async function getValidToken() {
  const d = await getDealership();
  if (d.mlTokenExpiresAt && d.mlTokenExpiresAt < new Date()) {
    return refreshToken();
  }
  return d.mlAccessToken!;
}

// Build an optimized title for ML search algorithm
// ML favors: Brand Model Version Year - Key specs (max 60 chars)
function buildOptimizedTitle(vehicle: {
  brand?: string | null;
  model?: string | null;
  version?: string | null;
  year?: number | null;
  kilometers?: number | null;
  fuel?: string | null;
}) {
  const parts: string[] = [];
  if (vehicle.brand) parts.push(vehicle.brand);
  if (vehicle.model) parts.push(vehicle.model);
  if (vehicle.version) parts.push(vehicle.version);
  if (vehicle.year) parts.push(String(vehicle.year));

  // Add km range as a search-friendly suffix (e.g., "50mil Km")
  if (vehicle.kilometers) {
    const kmK = Math.round(vehicle.kilometers / 1000);
    if (kmK > 0) parts.push(`${kmK}mil Km`);
  }

  let title = parts.join(" ");

  // If still room, add fuel type (common ML search filter term)
  if (vehicle.fuel && title.length + vehicle.fuel.length + 3 <= 60) {
    const fuelShort: Record<string, string> = {
      NAFTA: "Nafta", DIESEL: "Diesel", GNC: "GNC",
      ELECTRICO: "Eléctrico", HIBRIDO: "Híbrido",
    };
    title += ` ${fuelShort[vehicle.fuel] || vehicle.fuel}`;
  }

  return title.slice(0, 60);
}

// Map vehicle category to ML category ID
function getMlCategoryId(category?: string | null, bodyType?: string | null): string {
  // MercadoLibre Argentina categories for vehicles
  const categoryMap: Record<string, string> = {
    AUTOS_Y_CAMIONETAS: "MLA1744",
    MOTOS: "MLA1763",
    CAMIONES: "MLA1743",
    MAQUINARIA: "MLA407134",
    NAUTICA: "MLA1748",
  };
  if (category && categoryMap[category]) return categoryMap[category];

  // Fallback by body type
  if (bodyType) {
    const bodyMap: Record<string, string> = {
      PICKUP: "MLA1744", CAMIONETA: "MLA1744", SUV: "MLA1744",
      SEDAN: "MLA1744", HATCHBACK: "MLA1744", COUPE: "MLA1744",
    };
    if (bodyMap[bodyType]) return bodyMap[bodyType];
  }

  return "MLA1744"; // Default: Autos y Camionetas
}

// Determine if vehicle is 0km or used
function getMlCondition(kilometers?: number | null, status?: string | null): string {
  if (kilometers === 0 || status === "0KM") return "new";
  return "used";
}

// Publish a vehicle to MercadoLibre
export async function publishListing(vehicleId: string, overrides?: { title?: string; price?: number; listingType?: string; currency?: string }) {
  const token = await getValidToken();
  const d = await getDealership();
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { photos: { orderBy: { order: "asc" }, take: 12 } },
  });
  if (!vehicle) throw new Error("Vehículo no encontrado");

  const title = overrides?.title || buildOptimizedTitle(vehicle);
  const currencyId = overrides?.currency || (vehicle.currency === "USD" ? "USD" : "ARS");
  const price = overrides?.price || (currencyId === "USD" ? vehicle.priceUSD : vehicle.priceARS) || 0;
  const listingType = overrides?.listingType || "gold_special";
  const categoryId = getMlCategoryId(vehicle.category, vehicle.bodyType);
  const condition = getMlCondition(vehicle.kilometers, vehicle.status);

  const itemData: Record<string, unknown> = {
    title,
    category_id: categoryId,
    price,
    currency_id: currencyId,
    available_quantity: 1,
    buying_mode: "classified",
    listing_type_id: listingType,
    condition,
    description: { plain_text: buildMlDescription(vehicle, d) },
    pictures: vehicle.photos.map((p) => ({ source: p.url })),
    location: {
      city: { name: vehicle.locationCity || d.city || "" },
      state: { name: vehicle.locationProvince || d.province || "" },
    },
    attributes: buildMlAttributes(vehicle),
  };

  // Add seller contact for better visibility
  if (d.phone || vehicle.contactPhone) {
    itemData.seller_contact = {
      phone: vehicle.contactPhone || d.phone || "",
    };
  }

  let mlItemId: string | null = null;
  let permalink: string | null = null;
  let status = "ACTIVE";
  let errorMessage: string | null = null;

  try {
    const res = await mlFetch("/items", token, {
      method: "POST",
      body: JSON.stringify(itemData),
    });
    const data = await res.json();
    if (data.error) {
      status = "DRAFT";
      errorMessage = data.message || JSON.stringify(data.cause);
    } else {
      mlItemId = data.id;
      permalink = data.permalink;
    }
  } catch (err: unknown) {
    status = "DRAFT";
    errorMessage = err instanceof Error ? err.message : "Error desconocido";
  }

  return prisma.mlListing.create({
    data: {
      vehicleId,
      mlItemId,
      status,
      title,
      price,
      currency: currencyId,
      categoryId,
      listingType,
      permalink,
      publishedAt: status === "ACTIVE" ? new Date() : null,
      errorMessage,
    },
  });
}

// Update listing status (pause, activate, close)
export async function updateListingStatus(listingId: string, newStatus: "active" | "paused" | "closed") {
  const listing = await prisma.mlListing.findUnique({ where: { id: listingId } });
  if (!listing || !listing.mlItemId) throw new Error("Publicación no encontrada");

  const token = await getValidToken();
  const res = await mlFetch(`/items/${listing.mlItemId}`, token, {
    method: "PUT",
    body: JSON.stringify({ status: newStatus }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.message);

  const statusMap: Record<string, string> = { active: "ACTIVE", paused: "PAUSED", closed: "CLOSED" };
  return prisma.mlListing.update({
    where: { id: listingId },
    data: { status: statusMap[newStatus] },
  });
}

// Update listing price
export async function updateListingPrice(listingId: string, price: number) {
  const listing = await prisma.mlListing.findUnique({ where: { id: listingId } });
  if (!listing || !listing.mlItemId) throw new Error("Publicación no encontrada");

  const token = await getValidToken();
  const res = await mlFetch(`/items/${listing.mlItemId}`, token, {
    method: "PUT",
    body: JSON.stringify({ price }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.message);

  return prisma.mlListing.update({
    where: { id: listingId },
    data: { price },
  });
}

// Sync listing stats from MercadoLibre
export async function syncListingStats(listingId: string) {
  const listing = await prisma.mlListing.findUnique({ where: { id: listingId } });
  if (!listing || !listing.mlItemId) throw new Error("Publicación no encontrada");

  const token = await getValidToken();

  // Get item visits
  const visitsRes = await mlFetch(`/items/${listing.mlItemId}/visits`, token);
  const visitsData = await visitsRes.json();

  // Get questions count
  const questionsRes = await mlFetch(
    `/questions/search?item=${listing.mlItemId}&status=UNANSWERED`,
    token
  );
  const questionsData = await questionsRes.json();

  return prisma.mlListing.update({
    where: { id: listingId },
    data: {
      views: typeof visitsData === "number" ? visitsData : visitsData.total_visits || listing.views,
      questions: questionsData.total || listing.questions,
    },
  });
}

// Sync all questions for a listing
export async function syncQuestions(listingId: string) {
  const listing = await prisma.mlListing.findUnique({ where: { id: listingId } });
  if (!listing || !listing.mlItemId) throw new Error("Publicación no encontrada");

  const token = await getValidToken();
  const res = await mlFetch(`/questions/search?item=${listing.mlItemId}`, token);
  const data = await res.json();

  if (data.questions) {
    for (const q of data.questions) {
      await prisma.mlQuestion.upsert({
        where: { mlQuestionId: String(q.id) },
        update: {
          answer: q.answer?.text || null,
          status: q.status,
          answeredAt: q.answer?.date_created ? new Date(q.answer.date_created) : null,
        },
        create: {
          listingId,
          mlQuestionId: String(q.id),
          buyerNickname: q.from?.nickname || "Anónimo",
          question: q.text,
          answer: q.answer?.text || null,
          status: q.status,
          answeredAt: q.answer?.date_created ? new Date(q.answer.date_created) : null,
        },
      });
    }
  }

  return prisma.mlQuestion.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });
}

// Answer a question
export async function answerQuestion(questionId: string, answer: string) {
  const question = await prisma.mlQuestion.findUnique({
    where: { id: questionId },
    include: { listing: true },
  });
  if (!question || !question.mlQuestionId) throw new Error("Pregunta no encontrada");

  const token = await getValidToken();
  const res = await mlFetch(`/answers`, token, {
    method: "POST",
    body: JSON.stringify({
      question_id: Number(question.mlQuestionId),
      text: answer,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.message);

  return prisma.mlQuestion.update({
    where: { id: questionId },
    data: {
      answer,
      status: "ANSWERED",
      answeredAt: new Date(),
    },
  });
}

// Get all listings
export async function getListings(vehicleId?: string) {
  return prisma.mlListing.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: { vehicle: true, mlQuestions: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });
}

// Get MercadoLibre connection info
export async function getMlStatus() {
  const d = await prisma.dealership.findFirst();
  if (!d) return { connected: false };
  return {
    connected: d.mlIntegration,
    nickname: d.mlNickname,
    userId: d.mlUserId,
    connectedAt: d.mlConnectedAt,
    tokenExpires: d.mlTokenExpiresAt,
  };
}

// Get unanswered questions across all listings
export async function getUnansweredQuestions() {
  return prisma.mlQuestion.findMany({
    where: { status: "UNANSWERED" },
    include: { listing: { include: { vehicle: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllQuestions() {
  return prisma.mlQuestion.findMany({
    include: { listing: { include: { vehicle: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Helper: build MercadoLibre description optimized for search & conversions
// ML algorithm favors: structured info, complete specs, keywords, clear sections
function buildMlDescription(vehicle: {
  name: string;
  brand?: string | null;
  model?: string | null;
  version?: string | null;
  year?: number | null;
  kilometers?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  color?: string | null;
  doors?: number | null;
  engine?: string | null;
  bodyType?: string | null;
  description?: string | null;
  domain?: string | null;
  locationCity?: string | null;
  locationProvince?: string | null;
}, dealership: {
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  schedule?: string | null;
}) {
  const lines: string[] = [];

  // Header with full vehicle name (ML indexes this heavily)
  lines.push(`═══════════════════════════════════`);
  lines.push(vehicle.name.toUpperCase());
  lines.push(`═══════════════════════════════════`);
  lines.push("");

  // FICHA TÉCNICA section - structured data ML can parse
  lines.push("▸ FICHA TÉCNICA");
  lines.push("─────────────────────────────");
  if (vehicle.brand) lines.push(`• Marca: ${vehicle.brand}`);
  if (vehicle.model) lines.push(`• Modelo: ${vehicle.model}`);
  if (vehicle.version) lines.push(`• Versión: ${vehicle.version}`);
  if (vehicle.year) lines.push(`• Año: ${vehicle.year}`);
  if (vehicle.kilometers != null) lines.push(`• Kilómetros: ${vehicle.kilometers.toLocaleString("es-AR")} km`);
  if (vehicle.fuel) {
    const fuelMap: Record<string, string> = {
      NAFTA: "Nafta", DIESEL: "Diésel", GNC: "GNC", ELECTRICO: "Eléctrico", HIBRIDO: "Híbrido",
    };
    lines.push(`• Combustible: ${fuelMap[vehicle.fuel] || vehicle.fuel}`);
  }
  if (vehicle.transmission) {
    lines.push(`• Transmisión: ${vehicle.transmission === "MANUAL" ? "Manual" : "Automática"}`);
  }
  if (vehicle.engine) lines.push(`• Motor: ${vehicle.engine}`);
  if (vehicle.color) lines.push(`• Color: ${vehicle.color}`);
  if (vehicle.doors) lines.push(`• Puertas: ${vehicle.doors}`);
  if (vehicle.bodyType) lines.push(`• Tipo de carrocería: ${vehicle.bodyType}`);
  lines.push("");

  // Custom description from the user
  if (vehicle.description) {
    lines.push("▸ DESCRIPCIÓN");
    lines.push("─────────────────────────────");
    lines.push(vehicle.description);
    lines.push("");
  }

  // SERVICIOS section - ML rewards complete listings
  lines.push("▸ BENEFICIOS DE COMPRAR CON NOSOTROS");
  lines.push("─────────────────────────────");
  lines.push("✔ Financiación disponible");
  lines.push("✔ Aceptamos tu vehículo como parte de pago");
  lines.push("✔ Garantía mecánica");
  lines.push("✔ Gestión de transferencia incluida");
  lines.push("✔ Verificación técnica aprobada");
  lines.push("");

  // UBICACIÓN - ML uses location for local search ranking
  const locationParts: string[] = [];
  if (dealership.street && dealership.streetNumber) locationParts.push(`${dealership.street} ${dealership.streetNumber}`);
  const city = vehicle.locationCity || dealership.city;
  const province = vehicle.locationProvince || dealership.province;
  if (city) locationParts.push(city);
  if (province) locationParts.push(province);

  if (locationParts.length > 0 || dealership.phone || dealership.schedule) {
    lines.push("▸ UBICACIÓN Y CONTACTO");
    lines.push("─────────────────────────────");
    if (dealership.name) lines.push(`${dealership.name}`);
    if (locationParts.length > 0) lines.push(`📍 ${locationParts.join(", ")}`);
    if (dealership.phone) lines.push(`📞 ${dealership.phone}`);
    if (dealership.schedule) lines.push(`🕐 ${dealership.schedule}`);
    lines.push("");
  }

  lines.push("─────────────────────────────");
  lines.push("¡Consultá sin compromiso!");
  return lines.join("\n");
}

// Helper: build ML attributes - Complete attributes improve search visibility
// ML uses these for filters, search ranking, and item quality score
function buildMlAttributes(vehicle: {
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  version?: string | null;
  kilometers?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  color?: string | null;
  doors?: number | null;
  engine?: string | null;
  bodyType?: string | null;
}) {
  const attrs: { id: string; value_name: string }[] = [];

  // Required/high-impact attributes for ML ranking
  if (vehicle.brand) attrs.push({ id: "BRAND", value_name: vehicle.brand });
  if (vehicle.model) attrs.push({ id: "MODEL", value_name: vehicle.model });
  if (vehicle.year) attrs.push({ id: "VEHICLE_YEAR", value_name: String(vehicle.year) });
  if (vehicle.version) attrs.push({ id: "TRIM", value_name: vehicle.version });
  if (vehicle.kilometers != null) attrs.push({ id: "KILOMETERS", value_name: String(vehicle.kilometers) });

  if (vehicle.fuel) {
    const fuelMap: Record<string, string> = {
      NAFTA: "Nafta", DIESEL: "Diésel", GNC: "GNC", ELECTRICO: "Eléctrico", HIBRIDO: "Híbrido",
    };
    attrs.push({ id: "FUEL_TYPE", value_name: fuelMap[vehicle.fuel] || vehicle.fuel });
  }

  if (vehicle.transmission) {
    attrs.push({ id: "TRANSMISSION", value_name: vehicle.transmission === "MANUAL" ? "Manual" : "Automática" });
  }

  if (vehicle.color) attrs.push({ id: "COLOR", value_name: vehicle.color });
  if (vehicle.doors) attrs.push({ id: "DOORS", value_name: String(vehicle.doors) });

  // Body type - important filter in ML
  if (vehicle.bodyType) {
    const bodyMap: Record<string, string> = {
      SEDAN: "Sedán", HATCHBACK: "Hatchback", SUV: "SUV",
      PICKUP: "Pick-Up", COUPE: "Coupé", CAMIONETA: "Camioneta",
      MINIVAN: "Minivan", CONVERTIBLE: "Convertible", FURGON: "Furgón",
    };
    attrs.push({ id: "VEHICLE_BODY_TYPE", value_name: bodyMap[vehicle.bodyType] || vehicle.bodyType });
  }

  // Engine displacement (e.g. "1.6", "2.0 TSI")
  if (vehicle.engine) {
    attrs.push({ id: "ENGINE_DISPLACEMENT", value_name: vehicle.engine });
  }

  // ML flags that improve quality score and appear in filters
  attrs.push({ id: "ITEM_CONDITION", value_name: vehicle.kilometers === 0 ? "Nuevo" : "Usado" });

  return attrs;
}
