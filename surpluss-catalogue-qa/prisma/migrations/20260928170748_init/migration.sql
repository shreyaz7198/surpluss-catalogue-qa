-- DropForeignKey
ALTER TABLE "attribute_definitions" DROP CONSTRAINT "attribute_definitions_catalogue_id_fkey";

-- DropForeignKey
ALTER TABLE "attribute_definitions" DROP CONSTRAINT "attribute_definitions_template_id_fkey";

-- DropForeignKey
ALTER TABLE "catalogue_listings" DROP CONSTRAINT "catalogue_listings_catalogue_id_fkey";

-- DropForeignKey
ALTER TABLE "catalogue_listings" DROP CONSTRAINT "catalogue_listings_product_id_fkey";

-- DropForeignKey
ALTER TABLE "enquiries" DROP CONSTRAINT "enquiries_catalogue_id_fkey";

-- DropForeignKey
ALTER TABLE "enquiry_items" DROP CONSTRAINT "enquiry_items_enquiry_id_fkey";

-- DropForeignKey
ALTER TABLE "product_stocks" DROP CONSTRAINT "product_stocks_city_id_fkey";

-- DropForeignKey
ALTER TABLE "product_stocks" DROP CONSTRAINT "product_stocks_product_id_fkey";

-- DropIndex
DROP INDEX "enquiries_catalogue_idx";

-- DropIndex
DROP INDEX "enquiries_status_created_idx";

-- AlterTable
ALTER TABLE "attribute_definitions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "attribute_templates" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "badge_presets" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "catalogue_listings" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "catalogues" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cities" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "enquiries" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "enquiry_items" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "import_jobs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_stocks" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "enquiries_status_created_at_idx" ON "enquiries"("status", "created_at");

-- CreateIndex
CREATE INDEX "enquiries_catalogue_id_created_at_idx" ON "enquiries"("catalogue_id", "created_at");

-- AddForeignKey
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue_listings" ADD CONSTRAINT "catalogue_listings_catalogue_id_fkey" FOREIGN KEY ("catalogue_id") REFERENCES "catalogues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue_listings" ADD CONSTRAINT "catalogue_listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "attribute_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_catalogue_id_fkey" FOREIGN KEY ("catalogue_id") REFERENCES "catalogues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_catalogue_id_fkey" FOREIGN KEY ("catalogue_id") REFERENCES "catalogues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_items" ADD CONSTRAINT "enquiry_items_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "catalogue_listings_catalogue_idx" RENAME TO "catalogue_listings_catalogue_id_display_order_idx";

-- RenameIndex
ALTER INDEX "enquiry_items_enquiry_listing_key" RENAME TO "enquiry_items_enquiry_id_catalogue_listing_id_key";
