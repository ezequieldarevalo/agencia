import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create dealership first (so users can be linked)
  const dealership = await prisma.dealership.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Autogestor Agencia",
      email: "info@autogestor.com.ar",
      cuit: "30-71234567-8",
      phone: "351-4000000",
      province: "Córdoba",
      city: "Córdoba",
      street: "Av. Colón",
      streetNumber: "1234",
      plan: "V12_PREMIUM",
      schedule: "Lunes a Viernes: 9:00 - 18:00\nSábados: 9:00 - 13:00",
      description: "Agencia de autos multimarca. Compra, venta y consignación de vehículos usados y 0km.",
    },
  });

  // Create super admin user
  const superAdminPassword = await bcrypt.hash("super123", 10);
  await prisma.user.upsert({
    where: { email: "super@autogestor.com.ar" },
    update: {},
    create: {
      email: "super@autogestor.com.ar",
      password: superAdminPassword,
      name: "Super Admin",
      role: "SUPERADMIN",
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@autogestor.com.ar" },
    update: {},
    create: {
      email: "admin@autogestor.com.ar",
      password: adminPassword,
      name: "Administrador",
      role: "ADMIN",
      dealershipId: dealership.id,
    },
  });

  // Create admin employee
  await prisma.employee.upsert({
    where: { email: "admin@autogestor.com.ar" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "Principal",
      email: "admin@autogestor.com.ar",
      phone: "351-1234567",
      area: "ADMIN",
      dni: "30000000",
      province: "Córdoba",
      city: "Córdoba",
      userId: admin.id,
    },
  });

  // Create sales employee
  const salesPassword = await bcrypt.hash("ventas123", 10);
  const salesUser = await prisma.user.upsert({
    where: { email: "ventas@autogestor.com.ar" },
    update: {},
    create: {
      email: "ventas@autogestor.com.ar",
      password: salesPassword,
      name: "Juan Vendedor",
      role: "USER",
      dealershipId: dealership.id,
    },
  });

  await prisma.employee.upsert({
    where: { email: "ventas@autogestor.com.ar" },
    update: {},
    create: {
      firstName: "Juan",
      lastName: "Vendedor",
      email: "ventas@autogestor.com.ar",
      phone: "351-7654321",
      area: "VENTAS",
      userId: salesUser.id,
    },
  });

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        firstName: "Carlos", lastName: "García", email: "carlos@email.com",
        phone: "351-1111111", clientType: "CLIENTE", dni: "25000001",
        province: "Córdoba", city: "Córdoba",
      },
    }),
    prisma.client.create({
      data: {
        firstName: "María", lastName: "López", email: "maria@email.com",
        phone: "351-2222222", clientType: "CLIENTE", dni: "28000002",
        province: "Buenos Aires", city: "La Plata",
      },
    }),
    prisma.client.create({
      data: {
        firstName: "Pedro", lastName: "Martínez", email: "pedro@email.com",
        phone: "351-3333333", clientType: "PROSPECTO", dni: "32000003",
        province: "Santa Fe", city: "Rosario",
      },
    }),
    prisma.client.create({
      data: {
        firstName: "Ana", lastName: "Rodríguez", email: "ana@email.com",
        phone: "351-4444444", clientType: "PROSPECTO",
        province: "Córdoba", city: "Villa Carlos Paz",
      },
    }),
  ]);

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        firstName: "Roberto", lastName: "Fernández", email: "roberto@proveedor.com",
        phone: "351-5555555", supplierType: "VEHICULOS", dni: "22000004",
        province: "Córdoba", city: "Córdoba",
      },
    }),
    prisma.supplier.create({
      data: {
        firstName: "Laura", lastName: "Gómez", email: "laura@servicios.com",
        phone: "351-6666666", supplierType: "SERVICIOS",
        province: "Buenos Aires", city: "CABA",
      },
    }),
  ]);

  // Create vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        name: "Toyota Corolla XEI 2022", status: "DISPONIBLE", category: "AUTOS_Y_CAMIONETAS",
        brand: "Toyota", model: "Corolla", year: 2022, version: "XEI CVT",
        kilometers: 35000, priceARS: 28500000, priceUSD: 24000, currency: "ARS",
        exchangeRate: 1187.5, fuel: "NAFTA", color: "Gris Plata", doors: 4,
        bodyType: "SEDAN", transmission: "CVT", domain: "AB123CD",
        published: true, supplierId: suppliers[0].id,
        locationProvince: "Córdoba", locationCity: "Córdoba",
      },
    }),
    prisma.vehicle.create({
      data: {
        name: "VW Gol Trend 2019", status: "DISPONIBLE", category: "AUTOS_Y_CAMIONETAS",
        brand: "Volkswagen", model: "Gol Trend", year: 2019, version: "Trendline",
        kilometers: 68000, priceARS: 12800000, priceUSD: 10800, currency: "ARS",
        exchangeRate: 1185, fuel: "NAFTA", color: "Blanco", doors: 5,
        bodyType: "HATCHBACK", transmission: "MANUAL", domain: "AC456DE",
        published: true, supplierId: suppliers[0].id,
      },
    }),
    prisma.vehicle.create({
      data: {
        name: "Ford Ranger XLT 2021", status: "RESERVADO", category: "AUTOS_Y_CAMIONETAS",
        brand: "Ford", model: "Ranger", year: 2021, version: "XLT 3.2",
        kilometers: 52000, priceARS: 42000000, priceUSD: 35500, currency: "ARS",
        fuel: "DIESEL", color: "Negro", doors: 4, bodyType: "PICKUP",
        transmission: "AUTOMATICA", domain: "AD789FG",
        published: true, supplierId: suppliers[0].id, buyerId: clients[0].id,
      },
    }),
    prisma.vehicle.create({
      data: {
        name: "Chevrolet Cruze LTZ 2023", status: "DISPONIBLE", category: "AUTOS_Y_CAMIONETAS",
        brand: "Chevrolet", model: "Cruze", year: 2023, version: "LTZ AT",
        kilometers: 15000, priceARS: 32000000, priceUSD: 27000, currency: "ARS",
        fuel: "NAFTA", color: "Rojo", doors: 4, bodyType: "SEDAN",
        transmission: "AUTOMATICA", domain: "AE012HI",
        published: false,
      },
    }),
    prisma.vehicle.create({
      data: {
        name: "Fiat Cronos Drive 2020", status: "VENDIDO", category: "AUTOS_Y_CAMIONETAS",
        brand: "Fiat", model: "Cronos", year: 2020, version: "Drive 1.3",
        kilometers: 45000, priceARS: 14500000, currency: "ARS",
        fuel: "NAFTA", color: "Gris Oscuro", doors: 4, bodyType: "SEDAN",
        domain: "AF345JK", buyerId: clients[1].id,
      },
    }),
  ]);

  // Create cash accounts
  const cashAccounts = await Promise.all([
    prisma.cashAccount.create({
      data: { name: "Caja Principal", type: "EFECTIVO", currency: "ARS", initialBalance: 5000000, currentBalance: 5000000 },
    }),
    prisma.cashAccount.create({
      data: { name: "Cuenta Banco", type: "BANCO", currency: "ARS", initialBalance: 15000000, currentBalance: 15000000 },
    }),
    prisma.cashAccount.create({
      data: { name: "Caja USD", type: "EFECTIVO", currency: "USD", initialBalance: 5000, currentBalance: 5000 },
    }),
  ]);

  // Create movements
  const now = new Date();
  await Promise.all([
    prisma.cashMovement.create({
      data: {
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        type: "INGRESO", concept: "Venta Fiat Cronos", category: "VENTA",
        amountARS: 14500000, currency: "ARS", cashAccountId: cashAccounts[0].id,
        vehicleId: vehicles[4].id,
      },
    }),
    prisma.cashMovement.create({
      data: {
        date: new Date(now.getFullYear(), now.getMonth(), 3),
        type: "EGRESO", concept: "Compra Toyota Corolla", category: "COMPRA",
        amountARS: 25000000, currency: "ARS", cashAccountId: cashAccounts[1].id,
        vehicleId: vehicles[0].id,
      },
    }),
    prisma.cashMovement.create({
      data: {
        date: new Date(now.getFullYear(), now.getMonth(), 5),
        type: "EGRESO", concept: "Service y revisión", category: "SERVICIO",
        amountARS: 350000, currency: "ARS", cashAccountId: cashAccounts[0].id,
      },
    }),
    prisma.cashMovement.create({
      data: {
        date: new Date(now.getFullYear(), now.getMonth(), 8),
        type: "INGRESO", concept: "Seña Ford Ranger", category: "SEÑA",
        amountARS: 5000000, currency: "ARS", cashAccountId: cashAccounts[0].id,
        vehicleId: vehicles[2].id,
      },
    }),
    prisma.cashMovement.create({
      data: {
        date: now,
        type: "INGRESO", concept: "Ingreso USD consultoría", category: "OTRO",
        amountUSD: 500, currency: "USD", cashAccountId: cashAccounts[2].id,
      },
    }),
  ]);

  // Create debts
  await Promise.all([
    prisma.debt.create({
      data: {
        category: "VENTA", paymentMethod: "FINANCIAMIENTO",
        totalAmount: 42000000, paidAmount: 5000000, currency: "ARS",
        status: "PENDIENTE", nextPayment: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        clientId: clients[0].id, vehicleId: vehicles[2].id,
      },
    }),
    prisma.debt.create({
      data: {
        category: "VENTA", paymentMethod: "EFECTIVO",
        totalAmount: 14500000, paidAmount: 14500000, currency: "ARS",
        status: "PAGADA", clientId: clients[1].id, vehicleId: vehicles[4].id,
      },
    }),
  ]);

  // Create default document templates
  const templateExists = await prisma.documentTemplate.findFirst();
  if (!templateExists) {
    await Promise.all([
      prisma.documentTemplate.create({
        data: {
          name: "Boleto de Compra-Venta",
          type: "BOLETO",
          isDefault: true,
          content: `BOLETO DE COMPRA-VENTA DE AUTOMOTOR

En la ciudad de {{agencia_domicilio|_________}}, a los {{fecha_larga}}, entre:

VENDEDOR: {{agencia_nombre}}
CUIT: {{agencia_cuit}}
Domicilio: {{agencia_domicilio}}
Teléfono: {{agencia_telefono}}

COMPRADOR: {{cliente_nombre}}
DNI/CUIT: {{cliente_dni|_________}}
Domicilio: {{cliente_domicilio}}
Teléfono: {{cliente_telefono}}

Se conviene celebrar el presente BOLETO DE COMPRA-VENTA sujeto a las siguientes cláusulas:

PRIMERA: El VENDEDOR transfiere al COMPRADOR el siguiente vehículo:
- Descripción: {{vehiculo_nombre}}
- Marca: {{vehiculo_marca}} | Modelo: {{vehiculo_modelo}} | Año: {{vehiculo_anio}}
{{#if vehiculo_version}}- Versión: {{vehiculo_version}}{{/if}}
- Dominio: {{vehiculo_dominio}}
{{#if vehiculo_motor}}- Nº Motor: {{vehiculo_motor}}{{/if}}
{{#if vehiculo_chasis}}- Nº Chasis: {{vehiculo_chasis}}{{/if}}
- Kilometraje: {{vehiculo_km}} km
- Color: {{vehiculo_color}}

SEGUNDA: El precio total de la operación se fija en \${{operacion_monto}} ({{operacion_moneda}}).
{{#if operacion_sena}}Se ha recibido en concepto de seña la suma de \${{operacion_sena}}.{{/if}}

TERCERA: El comprador recibe el vehículo en el estado en que se encuentra, habiendo sido inspeccionado previamente y encontrándose conforme con su estado.

CUARTA: El vendedor se compromete a entregar la documentación necesaria para la transferencia del vehículo, incluyendo título de propiedad, verificación policial y formularios correspondientes.

QUINTA: Los gastos de transferencia serán a cargo del comprador, salvo acuerdo en contrario expresado por escrito.

SEXTA: Ante cualquier divergencia que surgiera del presente, las partes se someten a la jurisdicción de los tribunales ordinarios correspondientes.

En prueba de conformidad, se firman dos ejemplares de un mismo tenor y a un solo efecto.


_________________________          _________________________
       VENDEDOR                           COMPRADOR
   {{agencia_nombre}}               {{cliente_nombre}}`,
        },
      }),
      prisma.documentTemplate.create({
        data: {
          name: "Recibo de Seña",
          type: "RECIBO_SENA",
          isDefault: true,
          content: `RECIBO DE SEÑA

Fecha: {{fecha_larga}}
Nº de Recibo: ____________

{{agencia_nombre}}
{{agencia_domicilio}}
CUIT: {{agencia_cuit}}

RECIBO de {{cliente_nombre}}, DNI {{cliente_dni|_________}}, la suma de:

    \${{operacion_sena|_________}} ({{operacion_moneda}})

En concepto de SEÑA por el siguiente vehículo:

    {{vehiculo_nombre}}
    Dominio: {{vehiculo_dominio}}
    Año: {{vehiculo_anio}} | Color: {{vehiculo_color}}
    Kilometraje: {{vehiculo_km}} km

Precio total pactado: \${{operacion_monto}} ({{operacion_moneda}})
Saldo restante: a cancelar al momento de la entrega del vehículo.

La presente seña tiene carácter de reserva. En caso de arrepentimiento del comprador, la seña quedará en poder del vendedor. En caso de arrepentimiento del vendedor, deberá devolver el doble de la seña recibida, conforme art. 1059 del Código Civil y Comercial.

Forma de pago de la seña: {{operacion_metodo_pago|Efectivo}}


_________________________          _________________________
       VENDEDOR                           COMPRADOR
   {{agencia_nombre}}               {{cliente_nombre}}`,
        },
      }),
      prisma.documentTemplate.create({
        data: {
          name: "Contrato de Consignación",
          type: "CONSIGNACION",
          isDefault: true,
          content: `CONTRATO DE CONSIGNACIÓN DE AUTOMOTOR

En la ciudad de {{agencia_domicilio|_________}}, a los {{fecha_larga}}, entre:

CONSIGNATARIO: {{agencia_nombre}}
CUIT: {{agencia_cuit}}
Domicilio: {{agencia_domicilio}}

CONSIGNANTE: {{cliente_nombre}}
DNI/CUIT: {{cliente_dni|_________}}
Domicilio: {{cliente_domicilio}}
Teléfono: {{cliente_telefono}}

Se celebra el presente contrato de CONSIGNACIÓN sujeto a las siguientes cláusulas:

PRIMERA — OBJETO: El CONSIGNANTE entrega en consignación al CONSIGNATARIO el siguiente vehículo:
- Descripción: {{vehiculo_nombre}}
- Marca: {{vehiculo_marca}} | Modelo: {{vehiculo_modelo}} | Año: {{vehiculo_anio}}
{{#if vehiculo_version}}- Versión: {{vehiculo_version}}{{/if}}
- Dominio: {{vehiculo_dominio}}
{{#if vehiculo_motor}}- Nº Motor: {{vehiculo_motor}}{{/if}}
{{#if vehiculo_chasis}}- Nº Chasis: {{vehiculo_chasis}}{{/if}}
- Kilometraje: {{vehiculo_km}} km
- Color: {{vehiculo_color}}
- Combustible: {{vehiculo_combustible}}

SEGUNDA — PRECIO: El precio mínimo de venta se fija en \${{operacion_monto}} ({{operacion_moneda}}). El CONSIGNATARIO podrá ofertar por encima de dicho mínimo, correspondiendo la diferencia como comisión.

TERCERA — PLAZO: El presente contrato tendrá una vigencia de 60 (sesenta) días corridos a partir de la fecha de firma, renovable de común acuerdo.

CUARTA — COMISIÓN: La comisión del CONSIGNATARIO será del ___% sobre el precio final de venta, o la diferencia entre el precio mínimo y el precio efectivamente obtenido, lo que resulte mayor.

QUINTA — OBLIGACIONES DEL CONSIGNATARIO:
a) Exhibir el vehículo en condiciones adecuadas
b) Gestionar la venta de buena fe
c) Informar al CONSIGNANTE sobre ofertas recibidas
d) Liquidar el precio dentro de las 48 hs. hábiles de concretada la venta

SEXTA — OBLIGACIONES DEL CONSIGNANTE:
a) Entregar el vehículo en condiciones de funcionamiento
b) Proveer toda la documentación necesaria para la transferencia
c) No vender ni comprometer el vehículo por su cuenta durante la vigencia del contrato

SÉPTIMA — RESCISIÓN: Cualquiera de las partes podrá rescindir el presente contrato con un preaviso de 5 (cinco) días hábiles.

OCTAVA — JURISDICCIÓN: Para cualquier conflicto derivado del presente, las partes se someten a la jurisdicción ordinaria de la ciudad de {{agencia_domicilio|_________}}.


_________________________          _________________________
     CONSIGNATARIO                      CONSIGNANTE
   {{agencia_nombre}}               {{cliente_nombre}}`,
        },
      }),
      prisma.documentTemplate.create({
        data: {
          name: "Presupuesto de Venta",
          type: "PRESUPUESTO",
          isDefault: true,
          content: `PRESUPUESTO

{{agencia_nombre}}
{{agencia_domicilio}}
Tel: {{agencia_telefono}} | Email: {{agencia_email}}
CUIT: {{agencia_cuit}}

Fecha: {{fecha_larga}}
Dirigido a: {{cliente_nombre}}
{{#if cliente_telefono}}Tel: {{cliente_telefono}}{{/if}}
{{#if cliente_email}}Email: {{cliente_email}}{{/if}}

─────────────────────────────────────────

VEHÍCULO:
  {{vehiculo_nombre}}
  Marca: {{vehiculo_marca}}
  Modelo: {{vehiculo_modelo}}
  Año: {{vehiculo_anio}}
{{#if vehiculo_version}}  Versión: {{vehiculo_version}}{{/if}}
  Dominio: {{vehiculo_dominio}}
  Kilometraje: {{vehiculo_km}} km
  Combustible: {{vehiculo_combustible}}
  Transmisión: {{vehiculo_transmision}}
  Color: {{vehiculo_color}}

─────────────────────────────────────────

PRECIO: \${{operacion_monto|A convenir}} ({{operacion_moneda|ARS}})

{{#if operacion_metodo_pago}}Forma de pago: {{operacion_metodo_pago}}{{/if}}

─────────────────────────────────────────

CONDICIONES:
• El presente presupuesto tiene una validez de 5 (cinco) días hábiles.
• Los precios pueden variar sin previo aviso.
• No incluye gastos de transferencia ni trámites registrales.
• El vehículo se entrega en el estado en que se encuentra.
• Sujeto a disponibilidad al momento de la operación.

Quedamos a disposición para cualquier consulta.
Atentamente,

{{agencia_nombre}}`,
        },
      }),
      prisma.documentTemplate.create({
        data: {
          name: "Recibo de Pago",
          type: "CONTRATO",
          isDefault: true,
          content: `RECIBO DE PAGO

Fecha: {{fecha_larga}}
Nº: ____________

{{agencia_nombre}}
CUIT: {{agencia_cuit}}
{{agencia_domicilio}}

RECIBÍ de {{cliente_nombre}}, DNI {{cliente_dni|_________}}, domiciliado/a en {{cliente_domicilio}}, la suma de:

    \${{operacion_monto}} ({{operacion_moneda}})

En concepto de: {{operacion_tipo|Pago}} — {{vehiculo_nombre}}
Dominio: {{vehiculo_dominio}}

Forma de pago: {{operacion_metodo_pago|Efectivo}}

El presente recibo se extiende como constancia de pago.


_________________________
{{agencia_nombre}}
Firma y sello`,
        },
      }),
    ]);
    console.log("📄 Default document templates created");
  }

  // Create interactions
  await Promise.all([
    prisma.interaction.create({
      data: {
        status: "VENTA_CERRADA", origin: "LOCAL", score: 9,
        saleCompleted: true, clientId: clients[1].id, vehicleId: vehicles[4].id,
        notes: "Compró de contado sin problemas",
      },
    }),
    prisma.interaction.create({
      data: {
        status: "CONSULTA_ABIERTA", origin: "INSTAGRAM", score: 6,
        clientId: clients[2].id, searchInterest: "SUV mediano",
        searchCategory: "AUTOS_Y_CAMIONETAS", searchBodyType: "SUV",
        searchCurrency: "ARS", searchPriceMin: 20000000, searchPriceMax: 35000000,
        notes: "Busca SUV para familia, flexible con marca",
      },
    }),
    prisma.interaction.create({
      data: {
        status: "PRESUPUESTADO", origin: "MERCADOLIBRE", score: 7,
        clientId: clients[3].id, vehicleId: vehicles[0].id,
        searchInterest: "Toyota Corolla", searchCategory: "AUTOS_Y_CAMIONETAS",
        notes: "Pidió presupuesto por ML, muy interesada",
      },
    }),
    prisma.interaction.create({
      data: {
        status: "NO_INTERESADO", origin: "WHATSAPP", score: 2,
        clientId: clients[2].id, searchInterest: "Pick-up usada",
        notes: "Consultó pero no le cerraron los precios",
      },
    }),
  ]);

  console.log("✅ Seed completed!");
  console.log("📧 Super Admin: super@autogestor.com.ar / super123");
  console.log("📧 Admin: admin@autogestor.com.ar / admin123");
  console.log("📧 Ventas: ventas@autogestor.com.ar / ventas123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
