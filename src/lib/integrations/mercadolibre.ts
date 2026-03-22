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

// Publish a vehicle to MercadoLibre
export async function publishListing(vehicleId: string, overrides?: { title?: string; price?: number; listingType?: string }) {
  const token = await getValidToken();
  const d = await getDealership();
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { photos: { orderBy: { order: "asc" } } },
  });
  if (!vehicle) throw new Error("Vehículo no encontrado");

  const title = overrides?.title || `${vehicle.brand} ${vehicle.model} ${vehicle.version || ""} ${vehicle.year || ""}`.trim();
  const price = overrides?.price || vehicle.priceARS || 0;
  const listingType = overrides?.listingType || "gold_special";

  const itemData = {
    title: title.slice(0, 60), // ML max 60 chars
    category_id: "MLA1744", // Autos y Camionetas
    price,
    currency_id: "ARS",
    available_quantity: 1,
    buying_mode: "classified",
    listing_type_id: listingType,
    condition: "used",
    description: { plain_text: buildMlDescription(vehicle) },
    pictures: vehicle.photos.map((p) => ({ source: p.url })),
    location: {
      city: { name: vehicle.locationCity || d.city || "" },
      state: { name: vehicle.locationProvince || d.province || "" },
    },
    attributes: buildMlAttributes(vehicle),
  };

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
      currency: "ARS",
      categoryId: "MLA1744",
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

// Helper: build MercadoLibre description
function buildMlDescription(vehicle: {
  name: string;
  year?: number | null;
  kilometers?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  color?: string | null;
  doors?: number | null;
  engine?: string | null;
  description?: string | null;
  domain?: string | null;
}) {
  const lines: string[] = [];
  lines.push(vehicle.name);
  lines.push("");
  if (vehicle.year) lines.push(`Año: ${vehicle.year}`);
  if (vehicle.kilometers) lines.push(`Kilómetros: ${vehicle.kilometers.toLocaleString("es-AR")}`);
  if (vehicle.fuel) lines.push(`Combustible: ${vehicle.fuel}`);
  if (vehicle.transmission) lines.push(`Transmisión: ${vehicle.transmission}`);
  if (vehicle.color) lines.push(`Color: ${vehicle.color}`);
  if (vehicle.doors) lines.push(`Puertas: ${vehicle.doors}`);
  if (vehicle.engine) lines.push(`Motor: ${vehicle.engine}`);
  if (vehicle.description) {
    lines.push("");
    lines.push(vehicle.description);
  }
  lines.push("");
  lines.push("Financiación disponible. Aceptamos vehículo como parte de pago.");
  lines.push("Visítenos en nuestra agencia.");
  return lines.join("\n");
}

// Helper: build ML attributes
function buildMlAttributes(vehicle: {
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  kilometers?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  color?: string | null;
  doors?: number | null;
  engine?: string | null;
  bodyType?: string | null;
}) {
  const attrs: { id: string; value_name: string }[] = [];
  if (vehicle.brand) attrs.push({ id: "BRAND", value_name: vehicle.brand });
  if (vehicle.model) attrs.push({ id: "MODEL", value_name: vehicle.model });
  if (vehicle.year) attrs.push({ id: "VEHICLE_YEAR", value_name: String(vehicle.year) });
  if (vehicle.kilometers) attrs.push({ id: "KILOMETERS", value_name: String(vehicle.kilometers) });
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
  return attrs;
}
