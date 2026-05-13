import { io } from 'socket.io-client'

// Singleton de la conexion Socket.io — una sola instancia para toda la app
let socketInstancia = null

export const obtenerSocket = () => {
  if (!socketInstancia) {
    socketInstancia = io('http://localhost:3000', {
      withCredentials: true,   // enviar cookie HttpOnly con el JWT
      autoConnect: false,      // conectar manualmente al entrar a ControlTorneo
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    })
  }
  return socketInstancia
}

export const conectarSocket = () => {
  const socket = obtenerSocket()
  if (!socket.connected) socket.connect()
  return socket
}

export const desconectarSocket = () => {
  if (socketInstancia?.connected) {
    socketInstancia.disconnect()
  }
}
