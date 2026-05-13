import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { registrarEventosReloj, limpiarReloj } from './eventos/reloj.js';
import { registrarEventosControl } from './eventos/control.js';

let io = null;

export const inicializarSocket = (servidor) => {
  const origenesPermitidos = process.env.ALLOWED_ORIGINS?.split(',') || [];

  io = new Server(servidor, {
    cors: {
      origin: origenesPermitidos,
      credentials: true,
    },
  });

  // Middleware de autenticación: valida el JWT de la cookie HttpOnly
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map((c) => {
          const [k, ...v] = c.trim().split('=');
          return [k, decodeURIComponent(v.join('='))];
        })
      );

      const token = cookies['token'];
      if (!token) return next(new Error('Sin token de autenticación'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.usuario = payload;
      next();
    } catch {
      next(new Error('Token inválido o expirado'));
    }
  });

  io.on('connection', (socket) => {
    const { id: idStaff, rol } = socket.usuario;

    // El cliente se une al room del torneo específico
    socket.on('unirse:torneo', (idTorneo) => {
      const room = `torneo:${idTorneo}`;
      socket.join(room);
      socket.idTorneoActual = Number(idTorneo);
    });

    socket.on('salir:torneo', (idTorneo) => {
      socket.leave(`torneo:${idTorneo}`);
      socket.idTorneoActual = null;
    });

    registrarEventosReloj(socket, io);
    registrarEventosControl(socket, io);

    socket.on('disconnect', () => {
      if (socket.idTorneoActual) {
        limpiarReloj(socket.idTorneoActual, socket.id);
      }
    });
  });

  return io;
};

export const obtenerIo = () => {
  if (!io) throw new Error('Socket.io no inicializado');
  return io;
};
