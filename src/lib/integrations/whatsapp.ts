import { prisma } from "@/lib/prisma";

const WA_API_BASE = "https://graph.facebook.com/v19.0";

async function getDealership() {
  const d = await prisma.dealership.findFirst();
  if (!d || !d.waAccessToken) throw new Error("WhatsApp no está conectado");
  return d;
}

function waFetch(url: string, token: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// Connect WhatsApp Business
export async function connectWhatsApp(data: {
  phoneNumberId: string;
  businessId: string;
  accessToken: string;
  phoneDisplay: string;
}) {
  // Verify the credentials by fetching phone number info
  const res = await waFetch(
    `${WA_API_BASE}/${data.phoneNumberId}`,
    data.accessToken
  );
  const phoneData = await res.json();
  if (phoneData.error) throw new Error(phoneData.error.message);

  const dealership = await prisma.dealership.findFirst();
  await prisma.dealership.update({
    where: { id: dealership!.id },
    data: {
      whatsappIntegration: true,
      waPhoneNumberId: data.phoneNumberId,
      waBusinessId: data.businessId,
      waAccessToken: data.accessToken,
      waPhoneDisplay: data.phoneDisplay || phoneData.display_phone_number,
      waConnectedAt: new Date(),
    },
  });

  // Create default templates
  await seedDefaultTemplates();

  return { phoneDisplay: data.phoneDisplay || phoneData.display_phone_number };
}

export async function disconnectWhatsApp() {
  const dealership = await prisma.dealership.findFirst();
  await prisma.dealership.update({
    where: { id: dealership!.id },
    data: {
      whatsappIntegration: false,
      waPhoneNumberId: null,
      waBusinessId: null,
      waAccessToken: null,
      waPhoneDisplay: null,
      waConnectedAt: null,
    },
  });
}

// Send a text message
export async function sendTextMessage(phone: string, text: string, clientId?: string, vehicleId?: string) {
  const d = await getDealership();
  const normalizedPhone = normalizePhone(phone);

  let waMessageId: string | null = null;
  let status = "SENT";
  let errorMessage: string | null = null;

  try {
    const res = await waFetch(
      `${WA_API_BASE}/${d.waPhoneNumberId}/messages`,
      d.waAccessToken!,
      {
        method: "POST",
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizedPhone,
          type: "text",
          text: { body: text },
        }),
      }
    );
    const data = await res.json();
    if (data.error) {
      status = "FAILED";
      errorMessage = data.error.message;
    } else {
      waMessageId = data.messages?.[0]?.id;
    }
  } catch (err: unknown) {
    status = "FAILED";
    errorMessage = err instanceof Error ? err.message : "Error desconocido";
  }

  return prisma.waMessage.create({
    data: {
      direction: "OUTBOUND",
      phone: normalizedPhone,
      clientId,
      vehicleId,
      messageType: "TEXT",
      content: text,
      waMessageId,
      status,
      errorMessage,
    },
  });
}

// Send vehicle info card
export async function sendVehicleCard(phone: string, vehicleId: string, clientId?: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { photos: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!vehicle) throw new Error("Vehículo no encontrado");

  const message = buildVehicleWhatsAppMessage(vehicle);
  return sendTextMessage(phone, message, clientId, vehicleId);
}

// Send template message
export async function sendTemplateMessage(
  phone: string,
  templateSlug: string,
  variables: Record<string, string>,
  clientId?: string,
  vehicleId?: string
) {
  const template = await prisma.waTemplate.findUnique({ where: { slug: templateSlug } });
  if (!template) throw new Error(`Template "${templateSlug}" no encontrado`);

  // Replace variables in template body
  let body = template.body;
  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  return sendTextMessage(phone, body, clientId, vehicleId);
}

// Send payment reminder
export async function sendPaymentReminder(debtId: string) {
  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
    include: { client: true, vehicle: true },
  });
  if (!debt) throw new Error("Deuda no encontrada");
  if (!debt.client.phone) throw new Error("El cliente no tiene teléfono registrado");

  const remaining = debt.totalAmount - debt.paidAmount;
  const currencySymbol = debt.currency === "USD" ? "USD " : "$";

  const message = `Hola ${debt.client.firstName}! 👋\n\nTe recordamos que tenés un saldo pendiente de ${currencySymbol}${remaining.toLocaleString("es-AR")}${debt.vehicle ? ` por tu ${debt.vehicle.name}` : ""}.\n\nPodés acercarte a la agencia o consultar por las opciones de pago.\n\n¡Gracias! 🙏`;

  return sendTextMessage(debt.client.phone, message, debt.clientId, debt.vehicleId || undefined);
}

// Get conversation history for a phone/client
export async function getConversation(params: { phone?: string; clientId?: string; limit?: number }) {
  const where: Record<string, unknown> = {};
  if (params.phone) where.phone = normalizePhone(params.phone);
  if (params.clientId) where.clientId = params.clientId;

  return prisma.waMessage.findMany({
    where,
    include: { client: true, vehicle: true },
    orderBy: { createdAt: "desc" },
    take: params.limit || 50,
  });
}

// Get all conversations (grouped by phone)
export async function getConversations() {
  const messages = await prisma.waMessage.findMany({
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  // Group by phone number
  const grouped = new Map<string, typeof messages>();
  for (const msg of messages) {
    const key = msg.phone;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(msg);
  }

  return Array.from(grouped.entries()).map(([phone, msgs]) => ({
    phone,
    clientName: msgs[0].client
      ? `${msgs[0].client.firstName} ${msgs[0].client.lastName}`
      : null,
    clientId: msgs[0].clientId,
    lastMessage: msgs[0].content,
    lastMessageAt: msgs[0].createdAt,
    messageCount: msgs.length,
    unread: msgs.filter((m) => m.direction === "INBOUND" && m.status === "SENT").length,
  }));
}

// Get WhatsApp connection info
export async function getWhatsAppStatus() {
  const d = await prisma.dealership.findFirst();
  if (!d) return { connected: false };
  return {
    connected: d.whatsappIntegration,
    phoneDisplay: d.waPhoneDisplay,
    connectedAt: d.waConnectedAt,
  };
}

// Templates CRUD
export async function getTemplates() {
  return prisma.waTemplate.findMany({ orderBy: { name: "asc" } });
}

export async function createTemplate(data: { name: string; slug: string; category: string; body: string }) {
  return prisma.waTemplate.create({ data });
}

export async function updateTemplate(id: string, data: { name?: string; body?: string; category?: string; active?: boolean }) {
  return prisma.waTemplate.update({ where: { id }, data });
}

export async function deleteTemplate(id: string) {
  return prisma.waTemplate.delete({ where: { id } });
}

// Process incoming webhook message
export async function processInboundMessage(payload: {
  from: string;
  text: string;
  waMessageId: string;
  timestamp: string;
}) {
  // Try to find client by phone
  const client = await prisma.client.findFirst({
    where: { phone: { contains: payload.from.slice(-8) } },
  });

  return prisma.waMessage.create({
    data: {
      direction: "INBOUND",
      phone: payload.from,
      clientId: client?.id,
      messageType: "TEXT",
      content: payload.text,
      waMessageId: payload.waMessageId,
      status: "SENT",
    },
  });
}

// Helper functions
function normalizePhone(phone: string): string {
  // Remove all non-numeric chars
  let clean = phone.replace(/\D/g, "");
  // Add Argentina country code if needed
  if (clean.startsWith("0")) clean = "54" + clean.slice(1);
  if (!clean.startsWith("54") && clean.length <= 10) clean = "54" + clean;
  // Remove leading 15 for mobile
  clean = clean.replace(/^(549?)15/, "$1");
  return clean;
}

function buildVehicleWhatsAppMessage(vehicle: {
  name: string;
  year?: number | null;
  kilometers?: number | null;
  priceARS?: number | null;
  priceUSD?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  locationCity?: string | null;
  description?: string | null;
}) {
  const lines: string[] = [];
  lines.push(`🚗 *${vehicle.name}*`);
  lines.push("");
  if (vehicle.year) lines.push(`📅 Año: ${vehicle.year}`);
  if (vehicle.kilometers) lines.push(`🛣️ Km: ${vehicle.kilometers.toLocaleString("es-AR")}`);
  if (vehicle.fuel) lines.push(`⛽ Combustible: ${vehicle.fuel}`);
  if (vehicle.transmission) lines.push(`⚙️ Transmisión: ${vehicle.transmission}`);
  if (vehicle.priceARS) lines.push(`💰 *Precio: $${vehicle.priceARS.toLocaleString("es-AR")}*`);
  if (vehicle.priceUSD) lines.push(`💵 USD: $${vehicle.priceUSD.toLocaleString("en-US")}`);
  if (vehicle.locationCity) lines.push(`📍 ${vehicle.locationCity}`);
  if (vehicle.description) lines.push(`\n${vehicle.description}`);
  lines.push("\n📩 ¿Te interesa? ¡Respondé este mensaje!");
  return lines.join("\n");
}

async function seedDefaultTemplates() {
  const defaults = [
    {
      name: "Bienvenida",
      slug: "bienvenida",
      category: "MARKETING",
      body: "¡Hola {{nombre}}! 👋 Gracias por contactarte con nuestra agencia. ¿En qué podemos ayudarte?",
    },
    {
      name: "Info Vehículo",
      slug: "info-vehiculo",
      category: "MARKETING",
      body: "¡Hola {{nombre}}! Te paso la info del {{vehiculo}} que consultaste:\n\n📅 Año: {{año}}\n🛣️ Km: {{km}}\n💰 Precio: {{precio}}\n\n¿Querés coordinar una visita para verlo?",
    },
    {
      name: "Recordatorio de Pago",
      slug: "recordatorio-pago",
      category: "UTILITY",
      body: "Hola {{nombre}} 👋\n\nTe recordamos que tenés un pago pendiente de {{monto}} con vencimiento {{fecha}}.\n\nPodés acercarte a la agencia o consultar por las opciones de pago.\n\n¡Gracias! 🙏",
    },
    {
      name: "Vehículo Disponible",
      slug: "vehiculo-disponible",
      category: "MARKETING",
      body: "¡Hola {{nombre}}! Te avisamos que llegó un {{vehiculo}} que puede interesarte.\n\n💰 {{precio}}\n📅 Año: {{año}}\n🛣️ {{km}} km\n\n¿Te gustaría verlo? ¡Coordinamos!",
    },
    {
      name: "Seguimiento",
      slug: "seguimiento",
      category: "MARKETING",
      body: "¡Hola {{nombre}}! 👋\n\n¿Cómo andás? Quería saber si seguís interesado/a en el {{vehiculo}} que viste.\n\n¡Quedamos a disposición!",
    },
  ];

  for (const tpl of defaults) {
    await prisma.waTemplate.upsert({
      where: { slug: tpl.slug },
      update: {},
      create: tpl,
    });
  }
}
