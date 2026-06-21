-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "shopifyDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "receiveProductInsightsEmails" BOOLEAN NOT NULL DEFAULT true,
    "receiveStockAlertEmails" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiddenProduct" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "hiddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInsightLog" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "variantId" TEXT,
    "variantTitle" TEXT,
    "currentInventory" INTEGER NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductInsightLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLevel" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLevel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopifyDomain_key" ON "Shop"("shopifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "HiddenProduct_shopId_productId_variantId_key" ON "HiddenProduct"("shopId", "productId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInsightLog_shopId_productId_variantId_key" ON "ProductInsightLog"("shopId", "productId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLevel_shopId_inventoryItemId_locationId_key" ON "InventoryLevel"("shopId", "inventoryItemId", "locationId");

-- AddForeignKey
ALTER TABLE "HiddenProduct" ADD CONSTRAINT "HiddenProduct_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInsightLog" ADD CONSTRAINT "ProductInsightLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLevel" ADD CONSTRAINT "InventoryLevel_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
