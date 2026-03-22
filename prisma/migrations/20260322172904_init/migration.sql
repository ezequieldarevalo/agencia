-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "area" TEXT NOT NULL DEFAULT 'VENTAS',
    "dni" TEXT,
    "province" TEXT,
    "city" TEXT,
    "street" TEXT,
    "streetNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personType" TEXT NOT NULL DEFAULT 'FISICA',
    "clientType" TEXT NOT NULL DEFAULT 'CLIENTE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dni" TEXT,
    "cuit" TEXT,
    "cuil" TEXT,
    "sex" TEXT,
    "province" TEXT,
    "city" TEXT,
    "street" TEXT,
    "streetNumber" TEXT,
    "observations" TEXT,
    "lastContact" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personType" TEXT NOT NULL DEFAULT 'FISICA',
    "supplierType" TEXT NOT NULL DEFAULT 'VEHICULOS',
    "supplierSubtype" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dni" TEXT,
    "cuit" TEXT,
    "cuil" TEXT,
    "sex" TEXT,
    "province" TEXT,
    "city" TEXT,
    "street" TEXT,
    "streetNumber" TEXT,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "category" TEXT NOT NULL DEFAULT 'AUTOS_Y_CAMIONETAS',
    "kilometers" INTEGER,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "version" TEXT,
    "priceARS" REAL,
    "priceUSD" REAL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "exchangeRate" REAL,
    "fuel" TEXT,
    "color" TEXT,
    "doors" INTEGER,
    "bodyType" TEXT,
    "transmission" TEXT,
    "engine" TEXT,
    "domain" TEXT,
    "engineNumber" TEXT,
    "chassisNumber" TEXT,
    "description" TEXT,
    "locationProvince" TEXT,
    "locationCity" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "supplierId" TEXT,
    "buyerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Vehicle_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "vehicleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "identifier" TEXT,
    "initialBalance" REAL NOT NULL DEFAULT 0,
    "currentBalance" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "category" TEXT,
    "amountARS" REAL NOT NULL DEFAULT 0,
    "amountUSD" REAL NOT NULL DEFAULT 0,
    "exchangeRate" REAL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "cashAccountId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CashMovement_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL DEFAULT 'VENTA',
    "paymentMethod" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "totalAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "nextPayment" DATETIME,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "concept" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Debt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Debt_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebtPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debtId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DebtPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'CONSULTA_ABIERTA',
    "origin" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "searchCategory" TEXT,
    "searchInterest" TEXT,
    "searchBodyType" TEXT,
    "searchCurrency" TEXT,
    "searchPriceMin" REAL,
    "searchPriceMax" REAL,
    "searchYearMin" INTEGER,
    "searchYearMax" INTEGER,
    "searchColor" TEXT,
    "budgetAmount" REAL,
    "budgetCurrency" TEXT,
    "budgetExchangeRate" REAL,
    "budgetTransferCharged" BOOLEAN NOT NULL DEFAULT false,
    "budgetFullPayment" BOOLEAN NOT NULL DEFAULT false,
    "saleCompleted" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Interaction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dealership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "cuit" TEXT,
    "phone" TEXT,
    "province" TEXT,
    "city" TEXT,
    "street" TEXT,
    "streetNumber" TEXT,
    "logoUrl" TEXT,
    "schedule" TEXT,
    "videoUrl" TEXT,
    "description" TEXT,
    "saleContract" TEXT,
    "depositReceipt" TEXT,
    "consignmentContract" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'V12_PREMIUM',
    "metaIntegration" BOOLEAN NOT NULL DEFAULT false,
    "whatsappIntegration" BOOLEAN NOT NULL DEFAULT false,
    "mlIntegration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");
