import prisma from '../../config/db.js';

export const crearTorneo = async (req, res) => {
  const datos = req.body;
  const idStaff = req.usuario.id;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Calcular rake_monto estimado basado en el buy-in y el porcentaje de inscripción
      // El valor real se actualiza cuando el torneo finaliza con las transacciones reales
      const rakeMonto = Math.round(
        (datos.buy_in_monto * datos.rake_pct_inscripcion) / 100
      );

      // 1. Crear el torneo base
      const torneo = await tx.torneo.create({
        data: {
          id_supervisor: idStaff,
          id_tipo_juego: datos.id_tipo_juego,
          nombre: datos.nombre,
          fecha_inicio: new Date(datos.fecha_inicio),
          estado: 'BORRADOR',
          buy_in_monto: datos.buy_in_monto,
          rake_monto: rakeMonto,
          rake_pct_inscripcion: datos.rake_pct_inscripcion,
          rake_pct_rebuy: datos.rake_pct_rebuy ?? 0,
          rake_pct_addon: datos.rake_pct_addon ?? 0,
          capacidad_maxima: datos.capacidad_maxima ?? null,
          minimo_inicio: datos.minimo_inicio ?? null,
        },
      });

      // 2. Crear la configuración poker
      await tx.poker.create({
        data: {
          id_torneo: torneo.id_torneo,
          id_plantilla_origen: datos.id_plantilla_circuito ?? null,
          ultimo_nivel_registro: datos.ultimo_nivel_registro ?? 0,
          stack_inicial_valor: datos.stack_inicial_valor ?? 0,

          rebuy_permitido: datos.rebuy_permitido,
          rebuy_nivel_inicio: datos.rebuy_nivel_inicio ?? 0,
          rebuy_nivel_final: datos.rebuy_nivel_final ?? 0,
          rebuy_precio: datos.rebuy_precio ?? 0,
          rebuy_fichas: datos.rebuy_fichas ?? 0,

          addon_permitido: datos.addon_permitido,
          addon_nivel_inicio: datos.addon_nivel_inicio ?? 0,
          addon_nivel_final: datos.addon_nivel_final ?? 0,
          addon_precio: datos.addon_precio ?? 0,
          addon_fichas: datos.addon_fichas ?? 0,

          free_chip_permitido: datos.free_chip_permitido,
          free_chip_fichas: datos.free_chip_fichas ?? 0,
          free_chip_nivel_inicio: datos.free_chip_nivel_inicio ?? 0,
          free_chip_nivel_final: datos.free_chip_nivel_final ?? 0,

          timebank_permitido: datos.timebank_permitido,
          timebank_n_tarjetas: datos.timebank_n_tarjetas ?? 0,
          timebank_tiempo: datos.timebank_tiempo ?? 0,

          puntos_circuito: datos.puntos_circuito,
        },
      });

      // 3. Crear niveles de ciegas
      if (datos.niveles && datos.niveles.length > 0) {
        const poker = await tx.poker.findUnique({
          where: { id_torneo: torneo.id_torneo },
        });

        await tx.pokerNivel.createMany({
          data: datos.niveles.map((nivel) => ({
            id_poker: poker.id_poker,
            numero_nivel: nivel.numero_nivel,
            tipo: nivel.tipo,
            sb: nivel.sb ?? 0,
            bb: nivel.bb ?? 0,
            ante: nivel.ante ?? 0,
            tiempo_segundos: nivel.tiempo_segundos,
          })),
        });
      }

      // 4. Crear fichas del torneo
      if (datos.fichas && datos.fichas.length > 0) {
        await tx.torneoFicha.createMany({
          data: datos.fichas.map((ficha) => ({
            id_torneo: torneo.id_torneo,
            nombre: ficha.nombre,
            color: ficha.color ?? null,
            img_path: ficha.img_path ?? null,
            valor: ficha.valor,
            cantidad_por_jugador: ficha.cantidad_por_jugador,
          })),
        });
      }

      // 5. Registrar en historial de estados
      await tx.historialEstadoTorneo.create({
        data: {
          id_torneo: torneo.id_torneo,
          id_staff: idStaff,
          estado_anterior: null,
          estado_nuevo: 'BORRADOR',
          motivo: 'Torneo creado',
        },
      });

      return torneo;
    });

    return res.status(201).json({ ok: true, datos: resultado });
  } catch (error) {
    console.error('Error al crear torneo:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_CREAR_TORNEO',
      mensaje: 'Ocurrió un error al crear el torneo.',
    });
  }
};

export const listarTorneos = async (req, res) => {
  try {
    const torneos = await prisma.torneo.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        tipo_juego: { select: { nombre: true } },
        supervisor: { select: { nombre_completo: true } },
        _count: { select: { inscripciones: true } },
      },
    });

    return res.json({ ok: true, datos: torneos });
  } catch (error) {
    console.error('Error al listar torneos:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al obtener los torneos.',
    });
  }
};

export const obtenerTorneo = async (req, res) => {
  const { id } = req.params;

  try {
    const torneo = await prisma.torneo.findUnique({
      where: { id_torneo: Number(id) },
      include: {
        tipo_juego: true,
        supervisor: { select: { nombre_completo: true, rol: true } },
        poker: { include: { niveles: { orderBy: { numero_nivel: 'asc' } } } },
        fichas: true,
      },
    });

    if (!torneo) {
      return res.status(404).json({
        ok: false,
        codigo: 'TORNEO_NO_ENCONTRADO',
        mensaje: 'El torneo solicitado no existe.',
      });
    }

    return res.json({ ok: true, datos: torneo });
  } catch (error) {
    console.error('Error al obtener torneo:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al obtener el torneo.',
    });
  }
};

export const publicarTorneo = async (req, res) => {
  const { id } = req.params;
  const idStaff = req.usuario.id;

  try {
    const torneo = await prisma.torneo.findUnique({
      where: { id_torneo: Number(id) },
    });

    if (!torneo) {
      return res.status(404).json({
        ok: false,
        codigo: 'TORNEO_NO_ENCONTRADO',
        mensaje: 'El torneo solicitado no existe.',
      });
    }

    if (torneo.estado !== 'BORRADOR') {
      return res.status(400).json({
        ok: false,
        codigo: 'ESTADO_INVALIDO',
        mensaje: 'Solo se pueden publicar torneos en estado BORRADOR.',
      });
    }

    const actualizado = await prisma.$transaction(async (tx) => {
      const torneoActualizado = await tx.torneo.update({
        where: { id_torneo: Number(id) },
        data: { estado: 'REGISTRO' },
      });

      await tx.historialEstadoTorneo.create({
        data: {
          id_torneo: Number(id),
          id_staff: idStaff,
          estado_anterior: 'BORRADOR',
          estado_nuevo: 'REGISTRO',
          motivo: 'Torneo publicado manualmente',
        },
      });

      return torneoActualizado;
    });

    return res.json({ ok: true, datos: actualizado });
  } catch (error) {
    console.error('Error al publicar torneo:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al publicar el torneo.',
    });
  }
};