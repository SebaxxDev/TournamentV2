-- CreateTable
CREATE TABLE "plantilla_ciega" (
    "id_plantilla" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantilla_ciega_pkey" PRIMARY KEY ("id_plantilla")
);

-- CreateTable
CREATE TABLE "plantilla_ciega_detalle" (
    "id_detalle" SERIAL NOT NULL,
    "id_plantilla" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" "TipoNivel" NOT NULL DEFAULT 'NIVEL',
    "sb" INTEGER NOT NULL DEFAULT 0,
    "bb" INTEGER NOT NULL DEFAULT 0,
    "ante" INTEGER NOT NULL DEFAULT 0,
    "tiempo_segundos" INTEGER NOT NULL,
    "marcadores" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "plantilla_ciega_detalle_pkey" PRIMARY KEY ("id_detalle")
);

-- AddForeignKey
ALTER TABLE "plantilla_ciega_detalle" ADD CONSTRAINT "plantilla_ciega_detalle_id_plantilla_fkey" FOREIGN KEY ("id_plantilla") REFERENCES "plantilla_ciega"("id_plantilla") ON DELETE CASCADE ON UPDATE CASCADE;
