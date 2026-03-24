import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const blank = "____________";

function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return blank;
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount);
}

function buildAddress(entity: { street?: string | null; streetNumber?: string | null; city?: string | null; province?: string | null }): string {
  const parts = [];
  if (entity.street) parts.push(entity.street + (entity.streetNumber ? ` ${entity.streetNumber}` : ""));
  if (entity.city) parts.push(entity.city);
  if (entity.province) parts.push(entity.province);
  return parts.join(", ") || blank;
}

/** Process conditional blocks: {{#if var}}...{{/if}} and {{#unless var}}...{{/unless}} */
function processConditionals(content: string, vars: Record<string, string>): string {
  // {{#if var}}...{{/if}}
  let result = content.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, varName: string, block: string) => {
    const key = `{{${varName}}}`;
    const value = vars[key];
    const hasValue = value && value !== blank;
    return hasValue ? block : "";
  });

  // {{#unless var}}...{{/unless}}
  result = result.replace(/\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_match, varName: string, block: string) => {
    const key = `{{${varName}}}`;
    const value = vars[key];
    const hasValue = value && value !== blank;
    return hasValue ? "" : block;
  });

  return result;
}

/** Process fallback values: {{var|fallback text}} */
function processFallbacks(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\|([^}]+)\}\}/g, (_match, varName: string, fallback: string) => {
    const key = `{{${varName}}}`;
    const value = vars[key];
    return (value && value !== blank) ? value : fallback.trim();
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { templateId, vehicleId, clientId, supplierId, operationId, customAmount, customCurrency } = body;

  if (!templateId) {
    return NextResponse.json({ error: "templateId es requerido" }, { status: 400 });
  }

  const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
  if (!template) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
  }

  // Load entities
  const [vehicle, client, supplier, dealership, operation] = await Promise.all([
    vehicleId ? prisma.vehicle.findUnique({ where: { id: vehicleId }, include: { photos: { orderBy: { order: "asc" }, take: 1 } } }) : null,
    clientId ? prisma.client.findUnique({ where: { id: clientId } }) : null,
    supplierId ? prisma.supplier.findUnique({ where: { id: supplierId } }) : null,
    prisma.dealership.findFirst(),
    operationId ? prisma.operation.findUnique({ where: { id: operationId } }) : null,
  ]);

  const now = new Date();

  const currency = customCurrency || operation?.currency || "ARS";
  const amount = customAmount || operation?.totalAmount || (currency === "USD" ? vehicle?.priceUSD : vehicle?.priceARS) || vehicle?.priceARS;

  const FUEL_MAP: Record<string, string> = { NAFTA: "Nafta", DIESEL: "Diésel", GNC: "GNC", ELECTRICO: "Eléctrico", HIBRIDO: "Híbrido" };
  const TRANS_MAP: Record<string, string> = { MANUAL: "Manual", AUTOMATICA: "Automática" };
  const TYPE_MAP: Record<string, string> = { COMPRA: "Compra", VENTA: "Venta", COMPRA_VENTA: "Compra-Venta", CONSIGNACION: "Consignación" };

  // Build replacement map
  const vars: Record<string, string> = {
    // Vehicle
    "{{vehiculo_nombre}}": vehicle?.name || blank,
    "{{vehiculo_marca}}": vehicle?.brand || blank,
    "{{vehiculo_modelo}}": vehicle?.model || blank,
    "{{vehiculo_anio}}": vehicle?.year?.toString() || blank,
    "{{vehiculo_version}}": vehicle?.version || blank,
    "{{vehiculo_dominio}}": vehicle?.domain || blank,
    "{{vehiculo_motor}}": vehicle?.engineNumber || blank,
    "{{vehiculo_chasis}}": vehicle?.chassisNumber || blank,
    "{{vehiculo_km}}": vehicle?.kilometers?.toString() || blank,
    "{{vehiculo_combustible}}": vehicle?.fuel ? (FUEL_MAP[vehicle.fuel] || vehicle.fuel) : blank,
    "{{vehiculo_color}}": vehicle?.color || blank,
    "{{vehiculo_transmision}}": vehicle?.transmission ? (TRANS_MAP[vehicle.transmission] || vehicle.transmission) : blank,
    "{{vehiculo_precio_ars}}": formatCurrency(vehicle?.priceARS),
    "{{vehiculo_precio_usd}}": formatCurrency(vehicle?.priceUSD),
    "{{vehiculo_foto}}": vehicle?.photos?.[0]?.url ? `<img src="${vehicle.photos[0].url}" alt="${vehicle?.name || "Vehículo"}" style="max-width:100%;height:auto;border-radius:8px;" />` : "",
    // Client
    "{{cliente_nombre}}": client ? `${client.firstName} ${client.lastName}` : blank,
    "{{cliente_nombre_pila}}": client?.firstName || blank,
    "{{cliente_apellido}}": client?.lastName || blank,
    "{{cliente_dni}}": client?.dni || blank,
    "{{cliente_cuit}}": client?.cuit || blank,
    "{{cliente_cuil}}": client?.cuil || blank,
    "{{cliente_telefono}}": client?.phone || blank,
    "{{cliente_email}}": client?.email || blank,
    "{{cliente_domicilio}}": client ? buildAddress(client) : blank,
    "{{cliente_provincia}}": client?.province || blank,
    "{{cliente_ciudad}}": client?.city || blank,
    // Supplier
    "{{proveedor_nombre}}": supplier ? `${supplier.firstName} ${supplier.lastName}` : blank,
    "{{proveedor_dni}}": supplier?.dni || blank,
    "{{proveedor_cuit}}": supplier?.cuit || blank,
    "{{proveedor_telefono}}": supplier?.phone || blank,
    // Dealership
    "{{agencia_nombre}}": dealership?.name || blank,
    "{{agencia_cuit}}": dealership?.cuit || blank,
    "{{agencia_telefono}}": dealership?.phone || blank,
    "{{agencia_domicilio}}": dealership ? buildAddress(dealership) : blank,
    "{{agencia_email}}": dealership?.email || blank,
    // Operation
    "{{operacion_monto}}": formatCurrency(amount),
    "{{operacion_moneda}}": currency,
    "{{operacion_tipo}}": operation?.type ? (TYPE_MAP[operation.type] || operation.type) : blank,
    "{{operacion_sena}}": operation?.depositAmount ? formatCurrency(operation.depositAmount) : blank,
    "{{operacion_metodo_pago}}": operation?.paymentMethod || blank,
    // Date
    "{{fecha}}": now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    "{{fecha_larga}}": now.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
  };

  // 1. Process conditionals first (before variable substitution)
  let content = processConditionals(template.content, vars);
  // 2. Process fallback syntax: {{var|fallback}}
  content = processFallbacks(content, vars);
  // 3. Replace standard variables
  for (const [key, value] of Object.entries(vars)) {
    content = content.replaceAll(key, value);
  }
  // 4. Clean up empty lines from removed conditionals
  content = content.replace(/\n{3,}/g, "\n\n");

  return NextResponse.json({ content, templateName: template.name });
}
