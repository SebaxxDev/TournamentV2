-- AlterTable
ALTER TABLE "torneo" ADD COLUMN     "rake_pct_addon" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rake_pct_inscripcion" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rake_pct_rebuy" DECIMAL(5,2) NOT NULL DEFAULT 0;
