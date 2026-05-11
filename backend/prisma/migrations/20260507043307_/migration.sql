-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "eliminado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eliminado_at" TIMESTAMP(3);
