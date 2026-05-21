import prisma from '../../config/db.js';

// Mapa: idTorneo → { intervalo, segundosRestantes, nivelIndex, segundosTorneo, niveles, setters }
const relojesActivos = new Map();

// Persiste el estado del reloj en la DB cada 5 segundos
const INTERVALO_PERSISTENCIA = 5;

const persistirEstado = async (idTorneo, segundosCiega, nivelIndex, segundosTorneo) => {
  try {
    await prisma.torneo.update({
      where: { id_torneo: idTorneo },
      data: {
        reloj_segundos_ciega:  segundosCiega,
        reloj_nivel_index:     nivelIndex,
        reloj_segundos_torneo: segundosTorneo,
      },
    });
  } catch (err) {
    console.error(`[reloj] Error al persistir estado torneo ${idTorneo}:`, err.message);
  }
};

export const registrarEventosReloj = (socket, io) => {

  // Iniciar reloj — solo ADMIN, DIRECTOR, SUPERVISOR
  socket.on('reloj:iniciar', async ({ idTorneo }) => {
    const { rol } = socket.usuario;
    if (!['ADMIN', 'DIRECTOR', 'SUPERVISOR'].includes(rol)) return;

    const id = Number(idTorneo);
    if (relojesActivos.has(id)) return; // ya está corriendo

    try {
      const torneo = await prisma.torneo.findUnique({
        where: { id_torneo: id },
        include: {
          poker: { include: { niveles: { orderBy: { orden: 'asc' } } } },
        },
      });

      if (!torneo || !torneo.poker) return;

      const niveles = torneo.poker.niveles;
      if (!niveles.length) return;

      let nivelIndex = torneo.reloj_nivel_index ?? 0;
      if (nivelIndex >= niveles.length) nivelIndex = 0;

      const nivelActual = niveles[nivelIndex];
      let segundosRestantes =
        torneo.reloj_segundos_ciega > 0
          ? torneo.reloj_segundos_ciega
          : nivelActual.tiempo_segundos;

      // Restaurar tiempo acumulado del torneo desde la DB
      let segundosTorneo = torneo.reloj_segundos_torneo ?? 0;

      let ticksPersistencia = 0;

      const room = `torneo:${id}`;

      // Cambiar estado a EN_JUEGO si está en BORRADOR o REGISTRO
      if (['BORRADOR', 'REGISTRO'].includes(torneo.estado)) {
        await prisma.$transaction([
          prisma.torneo.update({
            where: { id_torneo: id },
            data: { estado: 'EN_JUEGO' },
          }),
          prisma.historialEstadoTorneo.create({
            data: {
              id_torneo: id,
              id_staff: socket.usuario.id,
              estado_anterior: torneo.estado,
              estado_nuevo: 'EN_JUEGO',
              motivo: 'Torneo iniciado desde panel de control',
            },
          }),
        ]);
        io.to(room).emit('torneo:estado', { estado: 'EN_JUEGO' });
      }

      const intervalo = setInterval(async () => {
        segundosRestantes--;
        segundosTorneo++;
        ticksPersistencia++;

        // Emitir tick a todos en el room
        io.to(room).emit('reloj:tick', {
          segundosRestantes,
          nivelIndex,
          total: niveles[nivelIndex]?.tiempo_segundos ?? 0,
        });

        // Persistir cada INTERVALO_PERSISTENCIA segundos
        if (ticksPersistencia >= INTERVALO_PERSISTENCIA) {
          ticksPersistencia = 0;
          await persistirEstado(id, segundosRestantes, nivelIndex, segundosTorneo);
        }

        // Fin del nivel — avanzar automáticamente
        if (segundosRestantes <= 0) {
          nivelIndex++;

          if (nivelIndex >= niveles.length) {
            // Terminaron todos los niveles — detener reloj
            clearInterval(intervalo);
            relojesActivos.delete(id);
            await persistirEstado(id, 0, nivelIndex - 1, segundosTorneo);
            io.to(room).emit('reloj:fin_niveles');
            return;
          }

          const siguienteNivel = niveles[nivelIndex];
          segundosRestantes = siguienteNivel.tiempo_segundos;
          ticksPersistencia = 0;

          await persistirEstado(id, segundosRestantes, nivelIndex, segundosTorneo);

          io.to(room).emit('reloj:cambio_nivel', {
            nivelIndex,
            nivel: siguienteNivel,
            segundosRestantes,
          });
        }
      }, 1000);

      relojesActivos.set(id, {
        intervalo,
        get nivelIndex()         { return nivelIndex; },
        get segundosRestantes()  { return segundosRestantes; },
        get segundosTorneo()     { return segundosTorneo; },
        niveles,
        // Exponer setters para que control.js pueda modificar estado
        setNivelIndex:        (v) => { nivelIndex = v; },
        setSegundosRestantes: (v) => { segundosRestantes = v; },
      });

      // Emitir estado inicial a quien lo inició
      io.to(room).emit('reloj:iniciado', {
        nivelIndex,
        segundosRestantes,
        nivel: nivelActual,
        total: nivelActual.tiempo_segundos,
        segundosTorneo,
      });

    } catch (err) {
      console.error('[reloj:iniciar]', err.message);
      socket.emit('reloj:error', { mensaje: 'Error al iniciar el reloj' });
    }
  });

  // Pausar reloj
  socket.on('reloj:pausar', async ({ idTorneo }) => {
    const { rol } = socket.usuario;
    if (!['ADMIN', 'DIRECTOR', 'SUPERVISOR'].includes(rol)) return;

    const id = Number(idTorneo);
    const estado = relojesActivos.get(id);
    if (!estado) return;

    clearInterval(estado.intervalo);
    relojesActivos.delete(id);

    await persistirEstado(id, estado.segundosRestantes, estado.nivelIndex, estado.segundosTorneo);

    await prisma.$transaction([
      prisma.torneo.update({
        where: { id_torneo: id },
        data: { estado: 'PAUSADO' },
      }),
      prisma.historialEstadoTorneo.create({
        data: {
          id_torneo: id,
          id_staff: socket.usuario.id,
          estado_anterior: 'EN_JUEGO',
          estado_nuevo: 'PAUSADO',
          motivo: 'Torneo pausado desde panel de control',
        },
      }),
    ]);

    io.to(`torneo:${id}`).emit('reloj:pausado', {
      segundosRestantes: estado.segundosRestantes,
      nivelIndex: estado.nivelIndex,
    });
    io.to(`torneo:${id}`).emit('torneo:estado', { estado: 'PAUSADO' });
  });

  // Reanudar reloj — usa el mismo evento iniciar con el estado persistido
  socket.on('reloj:reanudar', async ({ idTorneo }) => {
    const { rol } = socket.usuario;
    if (!['ADMIN', 'DIRECTOR', 'SUPERVISOR'].includes(rol)) return;
    // Reanudar es igual a iniciar — el estado persistido en DB se usa automáticamente
    socket.emit('reloj:iniciar_confirmado'); // señal al frontend para emitir reloj:iniciar
  });
};

// Llamado desde control.js para avanzar/retroceder nivel manualmente
export const modificarNivelReloj = (idTorneo, delta) => {
  const estado = relojesActivos.get(idTorneo);
  if (!estado) return null;

  const nuevoIndex = estado.nivelIndex + delta;
  if (nuevoIndex < 0 || nuevoIndex >= estado.niveles.length) return null;

  estado.setNivelIndex(nuevoIndex);
  const nivel = estado.niveles[nuevoIndex];
  estado.setSegundosRestantes(nivel.tiempo_segundos);

  return { nivelIndex: nuevoIndex, nivel, segundosRestantes: nivel.tiempo_segundos };
};

// Limpia el reloj si el socket owner se desconecta (opcional — el reloj sigue en otro socket)
export const limpiarReloj = (idTorneo, socketId) => {
  // No se detiene el reloj al desconectarse — persiste para otros clientes
};

export const obtenerEstadoReloj = (idTorneo) => {
  return relojesActivos.get(Number(idTorneo)) ?? null;
};
