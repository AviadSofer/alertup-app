-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "defaultThreshold" INTEGER;

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scopeType" TEXT NOT NULL,
    "scopeValue" TEXT,
    "scopeLabel" TEXT,
    "threshold" INTEGER NOT NULL,
    "maxStockLevel" INTEGER,
    "locationId" TEXT,
    "locationName" TEXT,
    "deliveryMode" TEXT NOT NULL,
    "schedule" TEXT,
    "scheduleDayOfWeek" INTEGER,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRecipient" (
    "id" TEXT NOT NULL,
    "alertRuleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "AlertRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "alertRuleId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT,
    "sku" TEXT,
    "currentStock" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "reorderQty" INTEGER,
    "recipientEmails" TEXT NOT NULL,
    "deliveryMode" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertRule_shopId_enabled_idx" ON "AlertRule"("shopId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "AlertRecipient_alertRuleId_email_key" ON "AlertRecipient"("alertRuleId", "email");

-- CreateIndex
CREATE INDEX "AlertLog_shopId_sentAt_idx" ON "AlertLog"("shopId", "sentAt");

-- CreateIndex
CREATE INDEX "AlertLog_alertRuleId_sentAt_idx" ON "AlertLog"("alertRuleId", "sentAt");

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRecipient" ADD CONSTRAINT "AlertRecipient_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "AlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "AlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
