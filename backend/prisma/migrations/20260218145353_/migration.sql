/*
  Warnings:

  - You are about to drop the column `assignedAt` on the `vendor_inventory_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `closedAt` on the `vendor_inventory_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `vendor_inventory_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `quantityAssigned` on the `vendor_inventory_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `quantityReturned` on the `vendor_inventory_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `quantitySold` on the `vendor_inventory_assignments` table. All the data in the column will be lost.
  - Added the required column `quantityCurrent` to the `vendor_inventory_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantityStart` to the `vendor_inventory_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `vendor_inventory_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `vendor_sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `vendor_sales` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "vendor_sales" DROP CONSTRAINT "vendor_sales_vendorId_fkey";

-- AlterTable
ALTER TABLE "rental_items" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vendor_inventory_assignments" DROP COLUMN "assignedAt",
DROP COLUMN "closedAt",
DROP COLUMN "isActive",
DROP COLUMN "quantityAssigned",
DROP COLUMN "quantityReturned",
DROP COLUMN "quantitySold",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "quantityCurrent" INTEGER NOT NULL,
ADD COLUMN     "quantityStart" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "vendor_sale_items" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "vendor_sales" ADD COLUMN     "saleTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "currentShiftStart" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "VendorStatus";

-- AddForeignKey
ALTER TABLE "vendor_sales" ADD CONSTRAINT "vendor_sales_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
