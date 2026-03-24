const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

interface GeminiResponse {
  candidates?: { content: { parts: { text: string }[] } }[];
  error?: { message: string };
}

async function geminiGenerate(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY no configurada");

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const noMarkdownRule = "\n\nIMPORTANTE: Respondé SOLO en texto plano. NO uses markdown. NO uses asteriscos (*), almohadillas (#), guiones bajos (_), backticks (`), ni ningún formato especial. Solo texto puro.";

  if (systemInstruction) {
    body.system_instruction = { parts: [{ text: systemInstruction + noMarkdownRule }] };
  }

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data: GeminiResponse = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Respuesta vacía de Gemini");
  }

  return stripMarkdown(data.candidates[0].content.parts[0].text);
}

// Strip markdown formatting from Gemini response
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")        // Remove # headers
    .replace(/\*\*(.+?)\*\*/g, "$1")     // **bold** -> bold
    .replace(/\*(.+?)\*/g, "$1")         // *italic* -> italic
    .replace(/__(.+?)__/g, "$1")         // __bold__ -> bold
    .replace(/_(.+?)_/g, "$1")           // _italic_ -> italic
    .replace(/`(.+?)`/g, "$1")           // `code` -> code
    .replace(/^>\s?/gm, "")             // > blockquote -> plain
    .replace(/^---$/gm, "───────────────────────────────")  // horizontal rules
    .replace(/^\*\s+/gm, "• ");          // * list items -> bullet
}

// ─── Publication Generators ─────────────────────────────────

interface VehicleData {
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
  color?: string | null;
  doors?: number | null;
  engine?: string | null;
  bodyType?: string | null;
  description?: string | null;
  locationCity?: string | null;
  locationProvince?: string | null;
}

interface DealershipData {
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
}

function vehicleContext(vehicle: VehicleData): string {
  const lines: string[] = [];
  lines.push(`Vehículo: ${vehicle.name}`);
  if (vehicle.brand) lines.push(`Marca: ${vehicle.brand}`);
  if (vehicle.model) lines.push(`Modelo: ${vehicle.model}`);
  if (vehicle.version) lines.push(`Versión: ${vehicle.version}`);
  if (vehicle.year) lines.push(`Año: ${vehicle.year}`);
  if (vehicle.kilometers != null) lines.push(`Kilómetros: ${vehicle.kilometers}`);
  if (vehicle.fuel) lines.push(`Combustible: ${vehicle.fuel}`);
  if (vehicle.transmission) lines.push(`Transmisión: ${vehicle.transmission}`);
  if (vehicle.engine) lines.push(`Motor: ${vehicle.engine}`);
  if (vehicle.color) lines.push(`Color: ${vehicle.color}`);
  if (vehicle.doors) lines.push(`Puertas: ${vehicle.doors}`);
  if (vehicle.bodyType) lines.push(`Carrocería: ${vehicle.bodyType}`);
  if (vehicle.priceARS) lines.push(`Precio ARS: $${vehicle.priceARS}`);
  if (vehicle.priceUSD) lines.push(`Precio USD: $${vehicle.priceUSD}`);
  if (vehicle.locationCity) lines.push(`Ciudad: ${vehicle.locationCity}`);
  if (vehicle.locationProvince) lines.push(`Provincia: ${vehicle.locationProvince}`);
  if (vehicle.description) lines.push(`Descripción del vendedor: ${vehicle.description}`);
  return lines.join("\n");
}

export async function generateMlTitle(vehicle: VehicleData): Promise<string> {
  const prompt = `Generá un título de publicación de MercadoLibre para este vehículo.

${vehicleContext(vehicle)}

REGLAS ESTRICTAS:
- Máximo 60 caracteres
- Incluí: Marca, Modelo, Versión (si cabe), Año
- Si hay espacio, incluí kilómetros abreviados (ej: "50mil km")
- Usá palabras que la gente busca en MercadoLibre Argentina
- NO uses emojis, símbolos, ni signos de exclamación
- NO incluyas precio
- Respondé SOLO con el título, nada más`;

  const result = await geminiGenerate(prompt, "Sos un experto en publicaciones de MercadoLibre Argentina para el rubro automotriz. Tu objetivo es maximizar la visibilidad en búsquedas.");
  return result.trim().replace(/^["']|["']$/g, "").slice(0, 60);
}

export async function generateMlDescription(vehicle: VehicleData, dealership: DealershipData): Promise<string> {
  const prompt = `Generá una descripción profesional para MercadoLibre Argentina para este vehículo.

${vehicleContext(vehicle)}

Agencia: ${dealership.name || "Agencia"}
Ubicación: ${[dealership.city, dealership.province].filter(Boolean).join(", ")}
Teléfono: ${dealership.phone || "No disponible"}

REGLAS:
- Usá texto plano (MercadoLibre no soporta markdown ni HTML)
- Estructura con secciones claras usando líneas de separación (═══ o ───)
- Incluí TODAS las especificaciones técnicas disponibles
- Agregá una sección de BENEFICIOS (financiación, permuta, garantía, gestión de transferencia)
- Incluí ubicación y contacto de la agencia al final
- Tono profesional pero cercano, lenguaje argentino
- NO inventes datos que no te proporcioné
- NO incluyas precio (ya aparece en el campo de precio de ML)
- Escribí entre 800 y 1500 caracteres`;

  return (await geminiGenerate(prompt, "Sos un copywriter experto en ventas de autos usados en Argentina. Escribís descripciones que convierten visitas en consultas.")).trim();
}

export async function generateFacebookPost(vehicle: VehicleData, dealership: DealershipData): Promise<string> {
  const prompt = `Generá un post de Facebook para publicar este vehículo en la página de una agencia de autos.

${vehicleContext(vehicle)}

Agencia: ${dealership.name || "Agencia"}
Ciudad: ${[dealership.city, dealership.province].filter(Boolean).join(", ")}
Teléfono: ${dealership.phone || ""}

REGLAS para el ALGORITMO de FACEBOOK:
- Usá emojis estratégicamente (no excesivo, 1 por línea máximo)
- Empezá con un "hook" que detenga el scroll (ej: 🔥 NUEVA UNIDAD, ⚡ OPORTUNIDAD)
- Largo ideal: 150-300 palabras (FB penaliza posts muy cortos o muy largos)
- Incluí las especificaciones clave en formato scannable (con emojis de viñeta)
- Incluí precio si está disponible
- Mencioná beneficios: financiación, permuta, garantía
- Terminá con un CTA que genere COMENTARIOS (FB prioriza posts con comentarios)
- Incluí ubicación y teléfono
- Tono profesional pero amigable, lenguaje argentino
- NO uses hashtags (en Facebook no sirven para posicionar)
- NO inventes datos que no te proporcioné`;

  return (await geminiGenerate(prompt, "Sos un social media manager experto en Facebook para el rubro automotriz argentino. Tu objetivo es maximizar el alcance orgánico y generar consultas.")).trim();
}

export async function generateInstagramCaption(vehicle: VehicleData, dealership: DealershipData): Promise<string> {
  const city = vehicle.locationCity || dealership.city || "";
  const province = vehicle.locationProvince || dealership.province || "";

  const prompt = `Generá un caption de Instagram para publicar este vehículo.

${vehicleContext(vehicle)}

Agencia: ${dealership.name || "Agencia"}
Ciudad: ${city}
Provincia: ${province}

REGLAS para el ALGORTIMO de INSTAGRAM:
- Primera línea: hook llamativo con emoji (es lo que se ve antes de "...más")
- Especificaciones en formato visual con emojis
- Incluí precio si está disponible
- Mencioná beneficios brevemente (financiación, permuta, garantía)
- CTA que pida: guardar el post (📌), etiquetar amigos, enviar DM
- Largo del texto: 100-200 palabras (sin contar hashtags)
- Al final, dejá una línea en blanco y agregá 20-25 hashtags relevantes
- Hashtags: mezclá alta popularidad (#autos #autosusados) + nicho (#${vehicle.brand?.toLowerCase() || "auto"} #${vehicle.model?.toLowerCase() || "vehiculo"}) + ubicación (#autos${city.toLowerCase().replace(/\s+/g, "")} #${province.toLowerCase().replace(/\s+/g, "")})
- Tono cercano y profesional, lenguaje argentino
- NO inventes datos que no te proporcioné`;

  return (await geminiGenerate(prompt, "Sos un social media manager experto en Instagram para el rubro automotriz argentino. Tu objetivo es maximizar alcance, guardados y consultas por DM.")).trim();
}

// ─── Document Generators ─────────────────────────────────

interface ClientData {
  firstName: string;
  lastName: string;
  dni?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface DocumentVehicleData extends VehicleData {
  domain?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
}

export async function generateBoleto(
  vehicle: DocumentVehicleData,
  client: ClientData,
  dealership: DealershipData & { cuit?: string | null; street?: string | null; streetNumber?: string | null },
  saleDetails: { price: number; currency: string; paymentMethod?: string; date?: string }
): Promise<string> {
  const today = saleDetails.date || new Date().toLocaleDateString("es-AR");
  const currencySymbol = saleDetails.currency === "USD" ? "USD" : "$";

  const prompt = `Generá un Boleto de Compra-Venta de automotor para Argentina.

VENDEDOR (Agencia):
- Razón Social: ${dealership.name || "AGENCIA"}
- CUIT: ${dealership.cuit || "_______________"}
- Domicilio: ${[dealership.street, dealership.streetNumber, dealership.city, dealership.province].filter(Boolean).join(", ") || "_______________"}
- Teléfono: ${dealership.phone || "_______________"}

COMPRADOR:
- Nombre: ${client.firstName} ${client.lastName}
- DNI: ${client.dni || "_______________"}
- Domicilio: ${client.address || "_______________"}
- Teléfono: ${client.phone || "_______________"}

VEHÍCULO:
- Descripción: ${vehicle.name}
- Marca: ${vehicle.brand || "___"}
- Modelo: ${vehicle.model || "___"}
- Año: ${vehicle.year || "___"}
- Dominio (Patente): ${vehicle.domain || "_______________"}
- N° Motor: ${vehicle.engineNumber || "_______________"}
- N° Chasis: ${vehicle.chassisNumber || "_______________"}
- Kilometraje: ${vehicle.kilometers || "___"}
- Color: ${vehicle.color || "___"}

OPERACIÓN:
- Precio: ${currencySymbol}${saleDetails.price.toLocaleString("es-AR")}
- Forma de pago: ${saleDetails.paymentMethod || "Contado"}
- Fecha: ${today}

REGLAS:
- Formato de documento legal argentino estándar
- Incluí cláusulas habituales: entrega del vehículo, estado actual, transferencia, vicios ocultos
- Incluí espacios para firma del comprador y vendedor al final
- Usá texto plano con formato claro (no markdown)
- Dejá líneas "_______________" donde corresponda para datos faltantes
- Escribí "BOLETO DE COMPRA-VENTA DE AUTOMOTOR" como título
- Numerá las cláusulas`;

  return (await geminiGenerate(prompt, "Sos un asesor legal especializado en compra-venta de automotores en Argentina. Generás documentos legales profesionales y completos.")).trim();
}

export async function generatePresupuesto(
  vehicle: DocumentVehicleData,
  client: ClientData,
  dealership: DealershipData & { cuit?: string | null; street?: string | null; streetNumber?: string | null },
  details: { price: number; currency: string; includesTransfer?: boolean; exchangeRate?: number; validDays?: number; notes?: string }
): Promise<string> {
  const today = new Date().toLocaleDateString("es-AR");
  const currencySymbol = details.currency === "USD" ? "USD" : "$";
  const validUntil = new Date(Date.now() + (details.validDays || 7) * 86400000).toLocaleDateString("es-AR");

  const prompt = `Generá un Presupuesto profesional de venta de automotor.

AGENCIA:
- Razón Social: ${dealership.name || "AGENCIA"}
- CUIT: ${dealership.cuit || "_______________"}
- Domicilio: ${[dealership.street, dealership.streetNumber, dealership.city, dealership.province].filter(Boolean).join(", ") || "_______________"}
- Teléfono: ${dealership.phone || "_______________"}

CLIENTE:
- Nombre: ${client.firstName} ${client.lastName}
- DNI: ${client.dni || "_______________"}
- Teléfono: ${client.phone || "_______________"}

VEHÍCULO:
- Descripción: ${vehicle.name}
- Marca: ${vehicle.brand || "___"}
- Modelo: ${vehicle.model || "___"}
- Año: ${vehicle.year || "___"}
- Kilómetros: ${vehicle.kilometers || "___"}
- Dominio: ${vehicle.domain || "_______________"}

PRESUPUESTO:
- Precio del vehículo: ${currencySymbol}${details.price.toLocaleString("es-AR")}
- Incluye transferencia: ${details.includesTransfer ? "Sí" : "No"}
${details.exchangeRate ? `- Tipo de cambio: $${details.exchangeRate}` : ""}
- Fecha de emisión: ${today}
- Validez: hasta ${validUntil} (${details.validDays || 7} días)
${details.notes ? `- Observaciones: ${details.notes}` : ""}

REGLAS:
- Formato profesional de presupuesto/cotización argentino
- Incluí desglose: precio del vehículo, transferencia (si corresponde), sellados
- Incluí formas de pago aceptadas: efectivo, transferencia bancaria, financiación, permuta
- Incluí condiciones y validez del presupuesto
- Incluí espacio para firma
- Usá texto plano con formato claro
- Título: "PRESUPUESTO DE VENTA - N° [dejar en blanco]"`;

  return (await geminiGenerate(prompt, "Sos un asesor comercial de agencia de autos en Argentina. Generás presupuestos profesionales y claros que facilitan el cierre de venta.")).trim();
}

export async function generateContratoVenta(
  vehicle: DocumentVehicleData,
  client: ClientData,
  dealership: DealershipData & { cuit?: string | null; street?: string | null; streetNumber?: string | null },
  saleDetails: { price: number; currency: string; paymentMethod?: string; date?: string; depositAmount?: number }
): Promise<string> {
  const today = saleDetails.date || new Date().toLocaleDateString("es-AR");
  const currencySymbol = saleDetails.currency === "USD" ? "USD" : "$";

  const prompt = `Generá un Contrato de Venta de Automotor profesional para Argentina.

VENDEDOR (Agencia):
- Razón Social: ${dealership.name || "AGENCIA"}
- CUIT: ${dealership.cuit || "_______________"}
- Domicilio: ${[dealership.street, dealership.streetNumber, dealership.city, dealership.province].filter(Boolean).join(", ") || "_______________"}
- Teléfono: ${dealership.phone || "_______________"}

COMPRADOR:
- Nombre: ${client.firstName} ${client.lastName}
- DNI: ${client.dni || "_______________"}
- Domicilio: ${client.address || "_______________"}
- Teléfono: ${client.phone || "_______________"}
- Email: ${client.email || "_______________"}

VEHÍCULO:
- Descripción completa: ${vehicle.name}
- Marca: ${vehicle.brand || "___"}
- Modelo: ${vehicle.model || "___"}
- Versión: ${vehicle.version || "___"}
- Año: ${vehicle.year || "___"}
- Dominio (Patente): ${vehicle.domain || "_______________"}
- N° Motor: ${vehicle.engineNumber || "_______________"}
- N° Chasis: ${vehicle.chassisNumber || "_______________"}
- Kilometraje: ${vehicle.kilometers || "___"} km
- Color: ${vehicle.color || "___"}
- Combustible: ${vehicle.fuel || "___"}

CONDICIONES DE VENTA:
- Precio total: ${currencySymbol}${saleDetails.price.toLocaleString("es-AR")}
${saleDetails.depositAmount ? `- Seña entregada: ${currencySymbol}${saleDetails.depositAmount.toLocaleString("es-AR")}` : ""}
${saleDetails.depositAmount ? `- Saldo restante: ${currencySymbol}${(saleDetails.price - saleDetails.depositAmount).toLocaleString("es-AR")}` : ""}
- Forma de pago: ${saleDetails.paymentMethod || "Contado"}
- Fecha: ${today}

REGLAS:
- Contrato formal argentino con cláusulas numeradas
- Incluí: objeto del contrato, precio y forma de pago, entrega, transferencia de dominio, estado del vehículo, garantía, obligaciones de ambas partes, resolución de conflictos, jurisdicción
- Si hay seña, incluí cláusula de seña/arras
- Dejá espacio al final para: lugar y fecha, firma comprador, firma vendedor, aclaración y DNI de ambos
- Usá texto plano con formato claro
- Título: "CONTRATO DE COMPRA-VENTA DE AUTOMOTOR"`;

  return (await geminiGenerate(prompt, "Sos un asesor legal especializado en compra-venta de automotores en Argentina. Generás contratos completos, profesionales y legalmente sólidos.")).trim();
}
