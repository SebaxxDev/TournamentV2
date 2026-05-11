-- CreateEnum
CREATE TYPE "RolStaff" AS ENUM ('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO', 'CROUPIER');

-- CreateEnum
CREATE TYPE "EstadoTorneo" AS ENUM ('BORRADOR', 'REGISTRO', 'EN_JUEGO', 'PAUSADO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "EstadoMesa" AS ENUM ('ACTIVA', 'PAUSADA', 'CERRADA', 'MESA_FINAL');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('ACTIVO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('BUY_IN', 'RE_BUY', 'ADD_ON', 'PROPINA', 'PAYOUT', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "TipoNivel" AS ENUM ('NIVEL', 'BREAK', 'REGISTRO', 'COLOR_UP');

-- CreateTable
CREATE TABLE "staff" (
    "id_staff" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(100) NOT NULL,
    "rol" "RolStaff" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "email" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id_staff")
);

-- CreateTable
CREATE TABLE "sesion_staff" (
    "id_sesion" SERIAL NOT NULL,
    "id_staff" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "ip_origen" VARCHAR(45),
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sesion_staff_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "jugador" (
    "rut" VARCHAR(12) NOT NULL,
    "nombre_completo" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "telefono" VARCHAR(20),
    "nacionalidad" VARCHAR(50),
    "profesion" VARCHAR(100),
    "genero" VARCHAR(20),
    "domicilio" VARCHAR(255),
    "fecha_nacimiento" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lista_negra" BOOLEAN NOT NULL DEFAULT false,
    "motivo_lista_negra" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jugador_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "catalogo_juego" (
    "id_tipo_juego" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "catalogo_juego_pkey" PRIMARY KEY ("id_tipo_juego")
);

-- CreateTable
CREATE TABLE "catalogo_ficha" (
    "id_ficha" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "color" VARCHAR(30),
    "nombre_color" VARCHAR(30),
    "img_path" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalogo_ficha_pkey" PRIMARY KEY ("id_ficha")
);

-- CreateTable
CREATE TABLE "esquema_premio" (
    "id_esquema" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esquema_premio_pkey" PRIMARY KEY ("id_esquema")
);

-- CreateTable
CREATE TABLE "regla_premio" (
    "id_regla" SERIAL NOT NULL,
    "id_esquema" INTEGER NOT NULL,
    "rango_min_jugadores" INTEGER NOT NULL,
    "rango_max_jugadores" INTEGER NOT NULL,
    "posicion" INTEGER NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "regla_premio_pkey" PRIMARY KEY ("id_regla")
);

-- CreateTable
CREATE TABLE "torneo" (
    "id_torneo" SERIAL NOT NULL,
    "id_supervisor" INTEGER NOT NULL,
    "id_tipo_juego" INTEGER NOT NULL,
    "id_esquema_premio" INTEGER,
    "nombre" VARCHAR(100) NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoTorneo" NOT NULL DEFAULT 'BORRADOR',
    "buy_in_monto" INTEGER NOT NULL,
    "rake_monto" INTEGER NOT NULL,
    "capacidad_maxima" INTEGER,
    "minimo_inicio" INTEGER,
    "tabla_pagos" JSONB,
    "reloj_segundos_torneo" INTEGER NOT NULL DEFAULT 0,
    "reloj_segundos_ciega" INTEGER NOT NULL DEFAULT 0,
    "reloj_nivel_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "torneo_pkey" PRIMARY KEY ("id_torneo")
);

-- CreateTable
CREATE TABLE "historial_estado_torneo" (
    "id_historial" SERIAL NOT NULL,
    "id_torneo" INTEGER NOT NULL,
    "id_staff" INTEGER,
    "estado_anterior" "EstadoTorneo",
    "estado_nuevo" "EstadoTorneo" NOT NULL,
    "motivo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_estado_torneo_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "torneo_staff" (
    "id_asignacion" SERIAL NOT NULL,
    "id_torneo" INTEGER NOT NULL,
    "id_staff" INTEGER NOT NULL,
    "rol_asignado" "RolStaff" NOT NULL,
    "id_mesa" INTEGER,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    "hora_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "torneo_staff_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateTable
CREATE TABLE "torneo_ficha" (
    "id_ficha" SERIAL NOT NULL,
    "id_torneo" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "color" VARCHAR(30),
    "nombre_color" VARCHAR(30),
    "valor" INTEGER NOT NULL,
    "cantidad_por_jugador" INTEGER NOT NULL DEFAULT 0,
    "cantidad_total" INTEGER NOT NULL DEFAULT 0,
    "img_path" VARCHAR(500),

    CONSTRAINT "torneo_ficha_pkey" PRIMARY KEY ("id_ficha")
);

-- CreateTable
CREATE TABLE "mesa" (
    "id_mesa" SERIAL NOT NULL,
    "id_torneo" INTEGER NOT NULL,
    "numero_mesa" INTEGER NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 10,
    "estado" "EstadoMesa" NOT NULL DEFAULT 'ACTIVA',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesa_pkey" PRIMARY KEY ("id_mesa")
);

-- CreateTable
CREATE TABLE "asiento" (
    "id_asiento" SERIAL NOT NULL,
    "id_mesa" INTEGER NOT NULL,
    "numero_asiento" INTEGER NOT NULL,
    "id_inscripcion" INTEGER,

    CONSTRAINT "asiento_pkey" PRIMARY KEY ("id_asiento")
);

-- CreateTable
CREATE TABLE "inscripcion" (
    "id_inscripcion" SERIAL NOT NULL,
    "id_torneo" INTEGER NOT NULL,
    "rut_jugador" VARCHAR(12) NOT NULL,
    "folio" INTEGER,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'ACTIVO',
    "pos_final" INTEGER,
    "gano_premio" BOOLEAN NOT NULL DEFAULT false,
    "monto_premio" INTEGER NOT NULL DEFAULT 0,
    "ronda_eliminacion" VARCHAR(50),
    "tiene_free_chip" BOOLEAN NOT NULL DEFAULT false,
    "historial_rebuys" JSONB NOT NULL DEFAULT '[]',
    "fecha_eliminacion" TIMESTAMP(3),
    "id_staff_eliminacion" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscripcion_pkey" PRIMARY KEY ("id_inscripcion")
);

-- CreateTable
CREATE TABLE "transaccion" (
    "id_transaccion" SERIAL NOT NULL,
    "id_inscripcion" INTEGER NOT NULL,
    "id_staff" INTEGER NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "monto" INTEGER NOT NULL,
    "medio_pago" "MedioPago" NOT NULL,
    "anulada" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "anulada_por" INTEGER,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaccion_pkey" PRIMARY KEY ("id_transaccion")
);

-- CreateTable
CREATE TABLE "pago_premio" (
    "id_pago_premio" SERIAL NOT NULL,
    "id_inscripcion" INTEGER NOT NULL,
    "id_torneo" INTEGER NOT NULL,
    "id_staff_autoriza" INTEGER NOT NULL,
    "id_staff_entrega" INTEGER NOT NULL,
    "monto" INTEGER NOT NULL,
    "medio_pago" "MedioPago" NOT NULL,
    "observacion" TEXT,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_premio_pkey" PRIMARY KEY ("id_pago_premio")
);

-- CreateTable
CREATE TABLE "poker" (
    "id_poker" SERIAL NOT NULL,
    "id_torneo" INTEGER NOT NULL,
    "id_plantilla_origen" INTEGER,
    "ultimo_nivel_registro" INTEGER NOT NULL DEFAULT 0,
    "stack_inicial_valor" INTEGER NOT NULL DEFAULT 0,
    "rebuy_permitido" BOOLEAN NOT NULL DEFAULT false,
    "rebuy_nivel_inicio" INTEGER NOT NULL DEFAULT 0,
    "rebuy_nivel_final" INTEGER NOT NULL DEFAULT 0,
    "rebuy_precio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rebuy_fichas" INTEGER NOT NULL DEFAULT 0,
    "addon_permitido" BOOLEAN NOT NULL DEFAULT false,
    "addon_nivel_inicio" INTEGER NOT NULL DEFAULT 0,
    "addon_nivel_final" INTEGER NOT NULL DEFAULT 0,
    "addon_precio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "addon_fichas" INTEGER NOT NULL DEFAULT 0,
    "free_chip_permitido" BOOLEAN NOT NULL DEFAULT false,
    "free_chip_fichas" INTEGER NOT NULL DEFAULT 0,
    "free_chip_nivel_inicio" INTEGER NOT NULL DEFAULT 0,
    "free_chip_nivel_final" INTEGER NOT NULL DEFAULT 0,
    "timebank_permitido" BOOLEAN NOT NULL DEFAULT false,
    "timebank_n_tarjetas" INTEGER NOT NULL DEFAULT 0,
    "timebank_tiempo" INTEGER NOT NULL DEFAULT 0,
    "puntos_circuito" BOOLEAN NOT NULL DEFAULT false,
    "puntos_multiplicador" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "puntos_snapshot" JSONB,

    CONSTRAINT "poker_pkey" PRIMARY KEY ("id_poker")
);

-- CreateTable
CREATE TABLE "poker_nivel" (
    "id_nivel" SERIAL NOT NULL,
    "id_poker" INTEGER NOT NULL,
    "numero_nivel" INTEGER NOT NULL,
    "tipo" "TipoNivel" NOT NULL DEFAULT 'NIVEL',
    "sb" INTEGER NOT NULL DEFAULT 0,
    "bb" INTEGER NOT NULL DEFAULT 0,
    "ante" INTEGER NOT NULL DEFAULT 0,
    "tiempo_segundos" INTEGER NOT NULL,

    CONSTRAINT "poker_nivel_pkey" PRIMARY KEY ("id_nivel")
);

-- CreateTable
CREATE TABLE "circuito_plantilla" (
    "id_plantilla" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "puntos_participacion" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "top_bonus_cantidad" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circuito_plantilla_pkey" PRIMARY KEY ("id_plantilla")
);

-- CreateTable
CREATE TABLE "circuito_plantilla_detalle" (
    "id_detalle" SERIAL NOT NULL,
    "id_plantilla" INTEGER NOT NULL,
    "posicion" INTEGER NOT NULL,
    "puntos_puesto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "porcentaje_extra" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "circuito_plantilla_detalle_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "circuito_puntos_jugador" (
    "id_registro" SERIAL NOT NULL,
    "rut_jugador" VARCHAR(12) NOT NULL,
    "id_inscripcion" INTEGER NOT NULL,
    "posicion_final" INTEGER NOT NULL,
    "puntos_ganados" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circuito_puntos_jugador_pkey" PRIMARY KEY ("id_registro")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id_auditoria" SERIAL NOT NULL,
    "id_staff" INTEGER,
    "accion" VARCHAR(100) NOT NULL,
    "tabla_afectada" VARCHAR(50),
    "id_registro" INTEGER,
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB,
    "ip_origen" VARCHAR(45),
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_username_key" ON "staff"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pago_premio_id_inscripcion_key" ON "pago_premio"("id_inscripcion");

-- CreateIndex
CREATE UNIQUE INDEX "poker_id_torneo_key" ON "poker"("id_torneo");

-- AddForeignKey
ALTER TABLE "sesion_staff" ADD CONSTRAINT "sesion_staff_id_staff_fkey" FOREIGN KEY ("id_staff") REFERENCES "staff"("id_staff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_premio" ADD CONSTRAINT "regla_premio_id_esquema_fkey" FOREIGN KEY ("id_esquema") REFERENCES "esquema_premio"("id_esquema") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneo" ADD CONSTRAINT "torneo_id_supervisor_fkey" FOREIGN KEY ("id_supervisor") REFERENCES "staff"("id_staff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneo" ADD CONSTRAINT "torneo_id_tipo_juego_fkey" FOREIGN KEY ("id_tipo_juego") REFERENCES "catalogo_juego"("id_tipo_juego") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneo" ADD CONSTRAINT "torneo_id_esquema_premio_fkey" FOREIGN KEY ("id_esquema_premio") REFERENCES "esquema_premio"("id_esquema") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado_torneo" ADD CONSTRAINT "historial_estado_torneo_id_torneo_fkey" FOREIGN KEY ("id_torneo") REFERENCES "torneo"("id_torneo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado_torneo" ADD CONSTRAINT "historial_estado_torneo_id_staff_fkey" FOREIGN KEY ("id_staff") REFERENCES "staff"("id_staff") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneo_staff" ADD CONSTRAINT "torneo_staff_id_torneo_fkey" FOREIGN KEY ("id_torneo") REFERENCES "torneo"("id_torneo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneo_staff" ADD CONSTRAINT "torneo_staff_id_staff_fkey" FOREIGN KEY ("id_staff") REFERENCES "staff"("id_staff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneo_staff" ADD CONSTRAINT "torneo_staff_id_mesa_fkey" FOREIGN KEY ("id_mesa") REFERENCES "mesa"("id_mesa") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "torneo_ficha" ADD CONSTRAINT "torneo_ficha_id_torneo_fkey" FOREIGN KEY ("id_torneo") REFERENCES "torneo"("id_torneo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesa" ADD CONSTRAINT "mesa_id_torneo_fkey" FOREIGN KEY ("id_torneo") REFERENCES "torneo"("id_torneo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento" ADD CONSTRAINT "asiento_id_mesa_fkey" FOREIGN KEY ("id_mesa") REFERENCES "mesa"("id_mesa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento" ADD CONSTRAINT "asiento_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripcion"("id_inscripcion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion" ADD CONSTRAINT "inscripcion_id_torneo_fkey" FOREIGN KEY ("id_torneo") REFERENCES "torneo"("id_torneo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion" ADD CONSTRAINT "inscripcion_rut_jugador_fkey" FOREIGN KEY ("rut_jugador") REFERENCES "jugador"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion" ADD CONSTRAINT "inscripcion_id_staff_eliminacion_fkey" FOREIGN KEY ("id_staff_eliminacion") REFERENCES "staff"("id_staff") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaccion" ADD CONSTRAINT "transaccion_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripcion"("id_inscripcion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaccion" ADD CONSTRAINT "transaccion_id_staff_fkey" FOREIGN KEY ("id_staff") REFERENCES "staff"("id_staff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaccion" ADD CONSTRAINT "transaccion_anulada_por_fkey" FOREIGN KEY ("anulada_por") REFERENCES "staff"("id_staff") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_premio" ADD CONSTRAINT "pago_premio_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripcion"("id_inscripcion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_premio" ADD CONSTRAINT "pago_premio_id_torneo_fkey" FOREIGN KEY ("id_torneo") REFERENCES "torneo"("id_torneo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_premio" ADD CONSTRAINT "pago_premio_id_staff_autoriza_fkey" FOREIGN KEY ("id_staff_autoriza") REFERENCES "staff"("id_staff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_premio" ADD CONSTRAINT "pago_premio_id_staff_entrega_fkey" FOREIGN KEY ("id_staff_entrega") REFERENCES "staff"("id_staff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poker" ADD CONSTRAINT "poker_id_torneo_fkey" FOREIGN KEY ("id_torneo") REFERENCES "torneo"("id_torneo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poker" ADD CONSTRAINT "poker_id_plantilla_origen_fkey" FOREIGN KEY ("id_plantilla_origen") REFERENCES "circuito_plantilla"("id_plantilla") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poker_nivel" ADD CONSTRAINT "poker_nivel_id_poker_fkey" FOREIGN KEY ("id_poker") REFERENCES "poker"("id_poker") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circuito_plantilla_detalle" ADD CONSTRAINT "circuito_plantilla_detalle_id_plantilla_fkey" FOREIGN KEY ("id_plantilla") REFERENCES "circuito_plantilla"("id_plantilla") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circuito_puntos_jugador" ADD CONSTRAINT "circuito_puntos_jugador_rut_jugador_fkey" FOREIGN KEY ("rut_jugador") REFERENCES "jugador"("rut") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circuito_puntos_jugador" ADD CONSTRAINT "circuito_puntos_jugador_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripcion"("id_inscripcion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_id_staff_fkey" FOREIGN KEY ("id_staff") REFERENCES "staff"("id_staff") ON DELETE SET NULL ON UPDATE CASCADE;
