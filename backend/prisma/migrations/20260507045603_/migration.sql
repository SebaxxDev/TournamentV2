/*
  Warnings:

  - You are about to drop the column `nombre_color` on the `catalogo_ficha` table. All the data in the column will be lost.
  - Made the column `color` on table `catalogo_ficha` required. This step will fail if there are existing NULL values in that column.
  - Made the column `img_path` on table `catalogo_ficha` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "catalogo_ficha" DROP COLUMN "nombre_color",
ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "img_path" SET NOT NULL;
