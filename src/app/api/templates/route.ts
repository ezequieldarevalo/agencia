import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_TEMPLATES = [
  {
    name: "Boleto de Compra-Venta",
    type: "BOLETO",
    isDefault: true,
    content: `<h2 style="text-align:center;letter-spacing:0.05em;">BOLETO DE COMPRA-VENTA DE AUTOMOTOR</h2>

<p>En la ciudad de {{agencia_domicilio|_________}}, a los {{fecha_larga}}, entre:</p>

<table style="width:100%;border-collapse:collapse;margin:12px 0;">
<tr>
<td style="border:1px solid #ccc;padding:8px;width:50%;vertical-align:top;">
<strong>VENDEDOR</strong><br/>
{{agencia_nombre}}<br/>
CUIT: {{agencia_cuit}}<br/>
Domicilio: {{agencia_domicilio}}<br/>
Tel: {{agencia_telefono}}
</td>
<td style="border:1px solid #ccc;padding:8px;width:50%;vertical-align:top;">
<strong>COMPRADOR</strong><br/>
{{cliente_nombre}}<br/>
DNI/CUIT: {{cliente_dni|_________}}<br/>
Domicilio: {{cliente_domicilio}}<br/>
Tel: {{cliente_telefono}}
</td>
</tr>
</table>

<p>Se conviene celebrar el presente <strong>BOLETO DE COMPRA-VENTA</strong> sujeto a las siguientes cláusulas:</p>

<p><strong>PRIMERA:</strong> El VENDEDOR transfiere al COMPRADOR el siguiente vehículo:</p>
<table style="width:100%;border-collapse:collapse;margin:8px 0;">
<tr><td style="border:1px solid #ccc;padding:6px;width:40%;background:#f9f9f9;"><strong>Descripción</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_nombre}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Marca / Modelo / Año</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_marca}} {{vehiculo_modelo}} {{vehiculo_anio}}</td></tr>
{{#if vehiculo_version}}<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Versión</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_version}}</td></tr>{{/if}}
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Dominio</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_dominio}}</td></tr>
{{#if vehiculo_motor}}<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Nº Motor</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_motor}}</td></tr>{{/if}}
{{#if vehiculo_chasis}}<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Nº Chasis</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_chasis}}</td></tr>{{/if}}
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Kilometraje</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_km}} km</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Color</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_color}}</td></tr>
</table>

<p><strong>SEGUNDA:</strong> El precio total de la operación se fija en <strong>\${{operacion_monto}} ({{operacion_moneda}})</strong>.</p>
{{#if operacion_sena}}<p>Se ha recibido en concepto de seña la suma de \${{operacion_sena}}.</p>{{/if}}

<p><strong>TERCERA:</strong> El comprador recibe el vehículo en el estado en que se encuentra, habiendo sido inspeccionado previamente y encontrándose conforme con su estado.</p>

<p><strong>CUARTA:</strong> El vendedor se compromete a entregar la documentación necesaria para la transferencia del vehículo, incluyendo título de propiedad, verificación policial y formularios correspondientes.</p>

<p><strong>QUINTA:</strong> Los gastos de transferencia serán a cargo del comprador, salvo acuerdo en contrario expresado por escrito.</p>

<p><strong>SEXTA:</strong> Ante cualquier divergencia que surgiera del presente, las partes se someten a la jurisdicción de los tribunales ordinarios correspondientes.</p>

<p>En prueba de conformidad, se firman dos ejemplares de un mismo tenor y a un solo efecto.</p>

<br/><br/><br/>
<table style="width:100%;border:none;">
<tr>
<td style="text-align:center;border:none;padding:0 20px;">
<div style="border-bottom:1px solid #333;min-width:200px;margin-bottom:4px;">&nbsp;</div>
<strong>VENDEDOR</strong><br/>{{agencia_nombre}}
</td>
<td style="text-align:center;border:none;padding:0 20px;">
<div style="border-bottom:1px solid #333;min-width:200px;margin-bottom:4px;">&nbsp;</div>
<strong>COMPRADOR</strong><br/>{{cliente_nombre}}
</td>
</tr>
</table>`,
  },
  {
    name: "Recibo de Seña",
    type: "RECIBO_SENA",
    isDefault: true,
    content: `<h2 style="text-align:center;">RECIBO DE SEÑA</h2>

<table style="width:100%;border:none;margin-bottom:16px;">
<tr>
<td style="border:none;"><strong>Fecha:</strong> {{fecha_larga}}</td>
<td style="border:none;text-align:right;"><strong>Nº de Recibo:</strong> ____________</td>
</tr>
</table>

<p><strong>{{agencia_nombre}}</strong><br/>
{{agencia_domicilio}}<br/>
CUIT: {{agencia_cuit}}</p>

<hr/>

<p>RECIBO de <strong>{{cliente_nombre}}</strong>, DNI <strong>{{cliente_dni|_________}}</strong>, la suma de:</p>

<p style="text-align:center;font-size:18px;margin:16px 0;"><strong>\${{operacion_sena|_________}} ({{operacion_moneda}})</strong></p>

<p>En concepto de <strong>SEÑA</strong> por el siguiente vehículo:</p>

<table style="width:100%;border-collapse:collapse;margin:8px 0;">
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Vehículo</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_nombre}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Dominio</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_dominio}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Año / Color</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_anio}} | {{vehiculo_color}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Kilometraje</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_km}} km</td></tr>
</table>

<p><strong>Precio total pactado:</strong> \${{operacion_monto}} ({{operacion_moneda}})<br/>
<strong>Saldo restante:</strong> a cancelar al momento de la entrega del vehículo.</p>

<p style="font-size:12px;color:#555;margin-top:16px;">La presente seña tiene carácter de reserva. En caso de arrepentimiento del comprador, la seña quedará en poder del vendedor. En caso de arrepentimiento del vendedor, deberá devolver el doble de la seña recibida, conforme art. 1059 del Código Civil y Comercial.</p>

<p><strong>Forma de pago de la seña:</strong> {{operacion_metodo_pago|Efectivo}}</p>

<br/><br/><br/>
<table style="width:100%;border:none;">
<tr>
<td style="text-align:center;border:none;padding:0 20px;">
<div style="border-bottom:1px solid #333;min-width:200px;margin-bottom:4px;">&nbsp;</div>
<strong>VENDEDOR</strong><br/>{{agencia_nombre}}
</td>
<td style="text-align:center;border:none;padding:0 20px;">
<div style="border-bottom:1px solid #333;min-width:200px;margin-bottom:4px;">&nbsp;</div>
<strong>COMPRADOR</strong><br/>{{cliente_nombre}}
</td>
</tr>
</table>`,
  },
  {
    name: "Contrato de Consignación",
    type: "CONSIGNACION",
    isDefault: true,
    content: `<h2 style="text-align:center;letter-spacing:0.05em;">CONTRATO DE CONSIGNACIÓN DE AUTOMOTOR</h2>

<p>En la ciudad de {{agencia_domicilio|_________}}, a los {{fecha_larga}}, entre:</p>

<table style="width:100%;border-collapse:collapse;margin:12px 0;">
<tr>
<td style="border:1px solid #ccc;padding:8px;width:50%;vertical-align:top;">
<strong>CONSIGNATARIO</strong><br/>
{{agencia_nombre}}<br/>
CUIT: {{agencia_cuit}}<br/>
Domicilio: {{agencia_domicilio}}
</td>
<td style="border:1px solid #ccc;padding:8px;width:50%;vertical-align:top;">
<strong>CONSIGNANTE</strong><br/>
{{cliente_nombre}}<br/>
DNI/CUIT: {{cliente_dni|_________}}<br/>
Domicilio: {{cliente_domicilio}}<br/>
Tel: {{cliente_telefono}}
</td>
</tr>
</table>

<p>Se celebra el presente contrato de <strong>CONSIGNACIÓN</strong> sujeto a las siguientes cláusulas:</p>

<p><strong>PRIMERA — OBJETO:</strong> El CONSIGNANTE entrega en consignación al CONSIGNATARIO el siguiente vehículo:</p>
<table style="width:100%;border-collapse:collapse;margin:8px 0;">
<tr><td style="border:1px solid #ccc;padding:6px;width:40%;background:#f9f9f9;"><strong>Descripción</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_nombre}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Marca / Modelo / Año</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_marca}} {{vehiculo_modelo}} {{vehiculo_anio}}</td></tr>
{{#if vehiculo_version}}<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Versión</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_version}}</td></tr>{{/if}}
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Dominio</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_dominio}}</td></tr>
{{#if vehiculo_motor}}<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Nº Motor</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_motor}}</td></tr>{{/if}}
{{#if vehiculo_chasis}}<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Nº Chasis</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_chasis}}</td></tr>{{/if}}
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Kilometraje</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_km}} km</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Color</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_color}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Combustible</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_combustible}}</td></tr>
</table>

<p><strong>SEGUNDA — PRECIO:</strong> El precio mínimo de venta se fija en <strong>\${{operacion_monto}} ({{operacion_moneda}})</strong>. El CONSIGNATARIO podrá ofertar por encima de dicho mínimo, correspondiendo la diferencia como comisión.</p>

<p><strong>TERCERA — PLAZO:</strong> El presente contrato tendrá una vigencia de 60 (sesenta) días corridos a partir de la fecha de firma, renovable de común acuerdo.</p>

<p><strong>CUARTA — COMISIÓN:</strong> La comisión del CONSIGNATARIO será del ___% sobre el precio final de venta, o la diferencia entre el precio mínimo y el precio efectivamente obtenido, lo que resulte mayor.</p>

<p><strong>QUINTA — OBLIGACIONES DEL CONSIGNATARIO:</strong></p>
<ol style="margin:4px 0;">
<li>Exhibir el vehículo en condiciones adecuadas</li>
<li>Gestionar la venta de buena fe</li>
<li>Informar al CONSIGNANTE sobre ofertas recibidas</li>
<li>Liquidar el precio dentro de las 48 hs. hábiles de concretada la venta</li>
</ol>

<p><strong>SEXTA — OBLIGACIONES DEL CONSIGNANTE:</strong></p>
<ol style="margin:4px 0;">
<li>Entregar el vehículo en condiciones de funcionamiento</li>
<li>Proveer toda la documentación necesaria para la transferencia</li>
<li>No vender ni comprometer el vehículo por su cuenta durante la vigencia del contrato</li>
</ol>

<p><strong>SÉPTIMA — RESCISIÓN:</strong> Cualquiera de las partes podrá rescindir el presente contrato con un preaviso de 5 (cinco) días hábiles.</p>

<p><strong>OCTAVA — JURISDICCIÓN:</strong> Para cualquier conflicto derivado del presente, las partes se someten a la jurisdicción ordinaria de la ciudad de {{agencia_domicilio|_________}}.</p>

<br/><br/><br/>
<table style="width:100%;border:none;">
<tr>
<td style="text-align:center;border:none;padding:0 20px;">
<div style="border-bottom:1px solid #333;min-width:200px;margin-bottom:4px;">&nbsp;</div>
<strong>CONSIGNATARIO</strong><br/>{{agencia_nombre}}
</td>
<td style="text-align:center;border:none;padding:0 20px;">
<div style="border-bottom:1px solid #333;min-width:200px;margin-bottom:4px;">&nbsp;</div>
<strong>CONSIGNANTE</strong><br/>{{cliente_nombre}}
</td>
</tr>
</table>`,
  },
  {
    name: "Presupuesto de Venta",
    type: "PRESUPUESTO",
    isDefault: true,
    content: `<p style="text-align:right;color:#888;font-size:12px;">Fecha: {{fecha_larga}}</p>

<h2 style="text-align:center;margin-bottom:4px;">PRESUPUESTO</h2>
<p style="text-align:center;color:#555;">{{agencia_nombre}}</p>

<hr/>

<p>Dirigido a: <strong>{{cliente_nombre}}</strong></p>
{{#if cliente_telefono}}<p>Tel: {{cliente_telefono}}</p>{{/if}}
{{#if cliente_email}}<p>Email: {{cliente_email}}</p>{{/if}}

<h3 style="margin-top:20px;">Vehículo</h3>

{{#if vehiculo_foto}}
<div style="text-align:center;margin:12px 0;">
{{vehiculo_foto}}
</div>
{{/if}}

<table style="width:100%;border-collapse:collapse;margin:8px 0;">
<tr><td style="border:1px solid #ccc;padding:6px;width:40%;background:#f9f9f9;"><strong>Descripción</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_nombre}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Marca</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_marca}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Modelo</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_modelo}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Año</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_anio}}</td></tr>
{{#if vehiculo_version}}<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Versión</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_version}}</td></tr>{{/if}}
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Dominio</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_dominio}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Kilometraje</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_km}} km</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Combustible</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_combustible}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Transmisión</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_transmision}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;background:#f9f9f9;"><strong>Color</strong></td><td style="border:1px solid #ccc;padding:6px;">{{vehiculo_color}}</td></tr>
</table>

<div style="background:#f0f7ff;border:2px solid #3b82f6;border-radius:8px;padding:16px;text-align:center;margin:20px 0;">
<p style="font-size:12px;color:#555;margin:0;">PRECIO</p>
<p style="font-size:24px;font-weight:bold;margin:4px 0;">\${{operacion_monto|A convenir}} <span style="font-size:14px;color:#555;">{{operacion_moneda|ARS}}</span></p>
{{#if operacion_metodo_pago}}<p style="font-size:12px;color:#555;margin:0;">Forma de pago: {{operacion_metodo_pago}}</p>{{/if}}
</div>

<h3>Condiciones</h3>
<ul>
<li>El presente presupuesto tiene una validez de 5 (cinco) días hábiles.</li>
<li>Los precios pueden variar sin previo aviso.</li>
<li>No incluye gastos de transferencia ni trámites registrales.</li>
<li>El vehículo se entrega en el estado en que se encuentra.</li>
<li>Sujeto a disponibilidad al momento de la operación.</li>
</ul>

<p style="margin-top:24px;">Quedamos a disposición para cualquier consulta.<br/>Atentamente,</p>
<p><strong>{{agencia_nombre}}</strong><br/>
Tel: {{agencia_telefono}} | {{agencia_email}}</p>`,
  },
  {
    name: "Recibo de Pago",
    type: "CONTRATO",
    isDefault: true,
    content: `<h2 style="text-align:center;">RECIBO DE PAGO</h2>

<table style="width:100%;border:none;margin-bottom:16px;">
<tr>
<td style="border:none;"><strong>Fecha:</strong> {{fecha_larga}}</td>
<td style="border:none;text-align:right;"><strong>Nº:</strong> ____________</td>
</tr>
</table>

<p><strong>{{agencia_nombre}}</strong><br/>
CUIT: {{agencia_cuit}}<br/>
{{agencia_domicilio}}</p>

<hr/>

<p>RECIBÍ de <strong>{{cliente_nombre}}</strong>, DNI <strong>{{cliente_dni|_________}}</strong>, domiciliado/a en {{cliente_domicilio}}, la suma de:</p>

<p style="text-align:center;font-size:20px;margin:16px 0;"><strong>\${{operacion_monto}} ({{operacion_moneda}})</strong></p>

<p>En concepto de: <strong>{{operacion_tipo|Pago}}</strong> — {{vehiculo_nombre}}<br/>
Dominio: {{vehiculo_dominio}}</p>

<p>Forma de pago: <strong>{{operacion_metodo_pago|Efectivo}}</strong></p>

<p style="font-size:12px;color:#555;margin-top:16px;">El presente recibo se extiende como constancia de pago.</p>

<br/><br/><br/>
<div style="text-align:center;">
<div style="display:inline-block;border-bottom:1px solid #333;min-width:200px;margin-bottom:4px;">&nbsp;</div><br/>
<strong>{{agencia_nombre}}</strong><br/>
<span style="font-size:12px;color:#555;">Firma y sello</span>
</div>`,
  },
];

async function ensureDefaultTemplates() {
  const count = await prisma.documentTemplate.count();
  if (count === 0) {
    await prisma.documentTemplate.createMany({ data: DEFAULT_TEMPLATES });
  } else {
    // Update existing default templates that are still in plain text (not HTML)
    for (const dt of DEFAULT_TEMPLATES) {
      const existing = await prisma.documentTemplate.findFirst({
        where: { type: dt.type, isDefault: true },
      });
      if (existing && !existing.content.trim().startsWith("<")) {
        await prisma.documentTemplate.update({
          where: { id: existing.id },
          data: { content: dt.content },
        });
      }
    }
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  await ensureDefaultTemplates();

  const where: Record<string, string> = {};
  if (type) where.type = type;

  const templates = await prisma.documentTemplate.findMany({
    where,
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.name || !body.type || !body.content) {
    return NextResponse.json({ error: "Nombre, tipo y contenido son requeridos" }, { status: 400 });
  }

  // If setting as default, unset others of same type
  if (body.isDefault) {
    await prisma.documentTemplate.updateMany({
      where: { type: body.type, isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.documentTemplate.create({
    data: {
      name: body.name,
      type: body.type,
      content: body.content,
      isDefault: body.isDefault || false,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
