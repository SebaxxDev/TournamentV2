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
  socket.on('reloj:estado', ({ idTorneo }) => {
    const id = Number(idTorneo);
    const estado = obtenerEstadoReloj(id);

    if (!estado) {
      socket.emit('reloj:estado_respuesta', { activo: false });
      return;
    }

    socket.emit('reloj:estado_respuesta', {
      activo: true,
      nivelIndex: estado.nivelIndex,
      segundosRestantes: estado.segundosRestantes,
      nivel: estado.niveles[estado.nivelIndex] ?? null,
      total: estado.niveles[estado.nivelIndex]?.tiempo_segundos ?? 0,
    });
  });
};
