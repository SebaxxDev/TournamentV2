import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './modules/auth/auth.routes.js'
import staffRoutes from './modules/staff/staff.routes.js'
import jugadorRoutes from './modules/jugador/jugador.routes.js'
import fichaRoutes from './modules/fichas/ficha.routes.js'
import catalogoRoutes from './modules/catalogo/catalogo.routes.js'
import torneoRoutes from './modules/torneo/torneo.routes.js'
import plantillaPremiosRoutes from './modules/torneo/plantilla_premios.routes.js'
import plantillaCircuitoRoutes from './modules/torneo/plantilla_circuito.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const app = express()
const servidor = http.createServer(app)

// Seguridad de cabeceras HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// Control de origenes permitidos
const origenesPermitidos = process.env.ALLOWED_ORIGINS?.split(',') || []

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origenesPermitidos.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Origen no permitido por CORS'))
    }
  },
  credentials: true,
}))

// Parseo de body y cookies
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env.COOKIE_SECRET))

// Logging de requests en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Archivos estaticos para imagenes de fichas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/jugadores', jugadorRoutes)
app.use('/api/fichas', fichaRoutes)
app.use('/api/catalogo', catalogoRoutes)
app.use('/api/torneos', torneoRoutes)
app.use('/api/plantillas-premios', plantillaPremiosRoutes)
app.use('/api/plantillas-circuito', plantillaCircuitoRoutes)

// Ruta de salud del servidor
app.get('/api/salud', (req, res) => {
  res.json({ ok: true, datos: { mensaje: 'Servidor funcionando correctamente' } })
})

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ ok: false, codigo: 'RUTA_NO_ENCONTRADA', mensaje: 'El recurso solicitado no existe' })
})

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor' })
})

const PUERTO = process.env.PORT || 3000

servidor.listen(PUERTO, () => {
  console.log(`Servidor corriendo en puerto ${PUERTO}`)
})

export { servidor }