import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@autosoft.com" },
    update: {},
    create: {
      email: "admin@autosoft.com",
      password: adminPassword,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  // Create admin employee
  await prisma.employee.upsert({
    where: { email: "admin@autosoft.com" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "Principal",
      email: "admin@autosoft.com",
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
    where: { email: "ventas@autosoft.com" },
    update: {},
    create: {
      email: "ventas@autosoft.com",
      password: salesPassword,
      name: "Juan Vendedor",
      role: "USER",
    },
  });

  await prisma.employee.upsert({
    where: { email: "ventas@autosoft.com" },
    update: {},
    create: {
      firstName: "Juan",
      lastName: "Vendedor",
      email: "ventas@autosoft.com",
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

  // Create dealership
  await prisma.dealership.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "AutoSoft Agencia",
      email: "info@autosoft.com.ar",
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

  console.log("✅ Seed completed!");
  console.log("📧 Admin: admin@autosoft.com / admin123");
  console.log("📧 Ventas: ventas@autosoft.com / ventas123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
