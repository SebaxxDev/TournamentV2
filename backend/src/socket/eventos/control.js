import prisma from '../../config/db.js';
import { modificarNivelReloj, obtenerEstadoReloj } from './reloj.js';

export const registrarEventosControl = (socket, io) => {

  // Avanzar al siguiente nivel manualmente
  socket.on('nivel:avanzar', async ({ idTorneo }) => {
    const { rol } = socket.usuario;
    if (!['ADMIN', 'DIRECTOR', 'SUPERVISOR'].includes(rol)) return;

    const id = Number(idTorneo);
    const resultado = modificarNivelReloj(id, +1);

    if (!resultado) {
      socket.emit('control:error', { mensaje: 'No se puede avanzar mas alla del ultimo nivel' });
      return;
    }

    const room = `torneo:${id}`;
    io.to(room).emit('reloj:cambio_nivel', {
      nivelIndex: resultado.nivelIndex,
      nivel: resultado.nivel,
      segundosRestantes: resultado.segundosRestantes,
    });
  });

  // Retroceder al nivel anterior manualmente
  socket.on('nivel:retroceder', async ({ idTorneo }) => {
    const { rol } = socket.usuario;
    if (!['ADMIN', 'DIRECTOR', 'SUPERVISOR'].includes(rol)) return;

    const id = Number(idTorneo);
    const resultado = modificarNivelReloj(id, -1);

    if (!resultado) {
      socket.emit('control:error', { mensaje: 'Ya se encuentra en el primer nivel' });
      return;
    }

    const room = `torneo:${id}`;
    io.to(room).emit('reloj:cambio_nivel', {
      nivelIndex: resultado.nivelIndex,
      nivel: resultado.nivel,
      segundosRestantes: resultado.segundosRestantes,
    });
  });

  // Obtener estado actual del reloj (para reconexión o carga inicial)
  socket.on('reloj:estado', async ({ idTorneo }) => {
    const id = Number(idTorneo);
    const estado = obtenerEstadoReloj(id);

    if (!estado) {
      // Reloj no está en memoria (backend reiniciado o torneo pausado).
      // Leemos reloj_segundos_torneo directamente desde la DB — ese campo se persiste en cada ciclo.
      try {
        const torneo = await prisma.torneo.findUnique({
          where: { id_torneo: id },
          select: { reloj_segundos_torneo: true },
        });
        socket.emit('reloj:estado_respuesta', {
          activo: false,
          segundosTorneo: torneo?.reloj_segundos_torneo ?? 0,
        });
      } catch (err) {
        console.error('[reloj:estado] Error al leer segundosTorneo desde DB:', err.message);
        socket.emit('reloj:estado_respuesta', { activo: false, segundosTorneo: 0 });
      }
      return;
    }

    // Reloj activo en memoria — usar el valor que ya lleva el contador en vivo
    const nivelActual = estado.niveles[estado.nivelIndex] ?? null;
    socket.emit('reloj:estado_respuesta', {
      activo: true,
      nivelIndex: estado.nivelIndex,
      segundosRestantes: estado.segundosRestantes,
      nivel: nivelActual,
      total: nivelActual?.tiempo_segundos ?? 0,
      segundosTorneo: estado.segundosTorneo,
    });
  });
};
