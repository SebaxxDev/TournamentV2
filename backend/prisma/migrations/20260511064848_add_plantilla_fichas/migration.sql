-- CreateTable
CREATE TABLE "plantilla_ficha" (
    "id_plantilla" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantilla_ficha_pkey" PRIMARY KEY ("id_plantilla")
);

-- CreateTable
CREATE TABLE "plantilla_ficha_detalle" (
    "id_detalle" SERIAL NOT NULL,
    "id_plantilla" INTEGER NOT NULL,
    "id_ficha_catalogo" INTEGER NOT NULL,
    "valor" INTEGER NOT NULL,
    "cantidad_por_jugador" INTEGER NOT NULL,

    CONSTRAINT "plantilla_ficha_detalle_pkey" PRIMARY KEY ("id_detalle")
);

-- AddForeignKey
ALTER TABLE "plantilla_ficha_detalle" ADD CONSTRAINT "plantilla_ficha_detalle_id_plantilla_fkey" FOREIGN KEY ("id_plantilla") REFERENCES "plantilla_ficha"("id_plantilla") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla_ficha_detalle" ADD CONSTRAINT "plantilla_ficha_detalle_id_ficha_catalogo_fkey" FOREIGN KEY ("id_ficha_catalogo") REFERENCES "catalogo_ficha"("id_ficha") ON DELETE RESTRICT ON UPDATE CASCADE;
