import argon2 from 'argon2'
import prisma from './db.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// ------------------------------------------------------------
// Datos de la plantilla "Tabla de premios principales"
// Rangos: 6-10, 11-20, 21-30, 31-45, 46-60, 61-85, 86-115, 116-145, 146-175
// Puestos 10-12 cada uno con 2.50%, 13-15 con 2.00%, 16-18 con 1.60%
// ------------------------------------------------------------
const REGLAS_PLANTILLA_PRINCIPAL = [
  // Puesto 1
  { posicion: 1, rango_min_jugadores: 6,   rango_max_jugadores: 10,  porcentaje: 60.00 },
  { posicion: 1, rango_min_jugadores: 11,  rango_max_jugadores: 20,  porcentaje: 50.00 },
  { posicion: 1, rango_min_jugadores: 21,  rango_max_jugadores: 30,  porcentaje: 40.00 },
  { posicion: 1, rango_min_jugadores: 31,  rango_max_jugadores: 45,  porcentaje: 36.00 },
  { posicion: 1, rango_min_jugadores: 46,  rango_max_jugadores: 60,  porcentaje: 32.50 },
  { posicion: 1, rango_min_jugadores: 61,  rango_max_jugadores: 85,  porcentaje: 30.00 },
  { posicion: 1, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 28.00 },
  { posicion: 1, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 26.80 },
  { posicion: 1, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 26.00 },
  // Puesto 2
  { posicion: 2, rango_min_jugadores: 6,   rango_max_jugadores: 10,  porcentaje: 40.00 },
  { posicion: 2, rango_min_jugadores: 11,  rango_max_jugadores: 20,  porcentaje: 30.00 },
  { posicion: 2, rango_min_jugadores: 21,  rango_max_jugadores: 30,  porcentaje: 28.00 },
  { posicion: 2, rango_min_jugadores: 31,  rango_max_jugadores: 45,  porcentaje: 25.00 },
  { posicion: 2, rango_min_jugadores: 46,  rango_max_jugadores: 60,  porcentaje: 22.00 },
  { posicion: 2, rango_min_jugadores: 61,  rango_max_jugadores: 85,  porcentaje: 21.00 },
  { posicion: 2, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 18.90 },
  { posicion: 2, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 17.50 },
  { posicion: 2, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 16.90 },
  // Puesto 3
  { posicion: 3, rango_min_jugadores: 11,  rango_max_jugadores: 20,  porcentaje: 20.00 },
  { posicion: 3, rango_min_jugadores: 21,  rango_max_jugadores: 30,  porcentaje: 18.00 },
  { posicion: 3, rango_min_jugadores: 31,  rango_max_jugadores: 45,  porcentaje: 16.00 },
  { posicion: 3, rango_min_jugadores: 46,  rango_max_jugadores: 60,  porcentaje: 14.00 },
  { posicion: 3, rango_min_jugadores: 61,  rango_max_jugadores: 85,  porcentaje: 13.00 },
  { posicion: 3, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 12.40 },
  { posicion: 3, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 11.70 },
  { posicion: 3, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 11.20 },
  // Puesto 4
  { posicion: 4, rango_min_jugadores: 21,  rango_max_jugadores: 30,  porcentaje: 14.00 },
  { posicion: 4, rango_min_jugadores: 31,  rango_max_jugadores: 45,  porcentaje: 13.00 },
  { posicion: 4, rango_min_jugadores: 46,  rango_max_jugadores: 60,  porcentaje: 11.00 },
  { posicion: 4, rango_min_jugadores: 61,  rango_max_jugadores: 85,  porcentaje: 10.00 },
  { posicion: 4, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 9.30  },
  { posicion: 4, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 8.70  },
  { posicion: 4, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 8.40  },
  // Puesto 5
  { posicion: 5, rango_min_jugadores: 31,  rango_max_jugadores: 45,  porcentaje: 10.00 },
  { posicion: 5, rango_min_jugadores: 46,  rango_max_jugadores: 60,  porcentaje: 8.50  },
  { posicion: 5, rango_min_jugadores: 61,  rango_max_jugadores: 85,  porcentaje: 7.50  },
  { posicion: 5, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 7.00  },
  { posicion: 5, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 6.60  },
  { posicion: 5, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 6.40  },
  // Puesto 6
  { posicion: 6, rango_min_jugadores: 46,  rango_max_jugadores: 60,  porcentaje: 6.50  },
  { posicion: 6, rango_min_jugadores: 61,  rango_max_jugadores: 85,  porcentaje: 6.00  },
  { posicion: 6, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 5.60  },
  { posicion: 6, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 5.40  },
  { posicion: 6, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 5.20  },
  // Puesto 7
  { posicion: 7, rango_min_jugadores: 46,  rango_max_jugadores: 60,  porcentaje: 5.50  },
  { posicion: 7, rango_min_jugadores: 61,  rango_max_jugadores: 85,  porcentaje: 5.00  },
  { posicion: 7, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 4.60  },
  { posicion: 7, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 4.40  },
  { posicion: 7, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 4.20  },
  // Puesto 8
  { posicion: 8, rango_min_jugadores: 61,  rango_max_jugadores: 85,  porcentaje: 4.00  },
  { posicion: 8, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 3.70  },
  { posicion: 8, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 3.50  },
  { posicion: 8, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 3.40  },
  // Puesto 9
  { posicion: 9, rango_min_jugadores: 61,  rango_max_jugadores: 85,  porcentaje: 3.50  },
  { posicion: 9, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 3.00  },
  { posicion: 9, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 2.80  },
  { posicion: 9, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 2.70  },
  // Puestos 10, 11, 12 — mismo porcentaje individual
  { posicion: 10, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 2.50 },
  { posicion: 10, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 2.20 },
  { posicion: 10, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 1.90 },
  { posicion: 11, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 2.50 },
  { posicion: 11, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 2.20 },
  { posicion: 11, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 1.90 },
  { posicion: 12, rango_min_jugadores: 86,  rango_max_jugadores: 115, porcentaje: 2.50 },
  { posicion: 12, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 2.20 },
  { posicion: 12, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 1.90 },
  // Puestos 13, 14, 15
  { posicion: 13, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 2.00 },
  { posicion: 13, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 1.70 },
  { posicion: 14, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 2.00 },
  { posicion: 14, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 1.70 },
  { posicion: 15, rango_min_jugadores: 116, rango_max_jugadores: 145, porcentaje: 2.00 },
  { posicion: 15, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 1.70 },
  // Puestos 16, 17, 18
  { posicion: 16, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 1.60 },
  { posicion: 17, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 1.60 },
  { posicion: 18, rango_min_jugadores: 146, rango_max_jugadores: 175, porcentaje: 1.60 },
]

const seed = async () => {
  // Usuario admin
  const passwordHash = await argon2.hash('admin1234')
  const admin = await prisma.staff.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password_hash: passwordHash,
      nombre_completo: 'Administrador del Sistema',
      rol: 'ADMIN',
      activo: true,
    },
  })
  console.log('Usuario admin creado:', admin.username)

  // Juego Texas Holdem
  await prisma.catalogoJuego.upsert({
    where: { id_tipo_juego: 1 },
    update: {},
    create: { nombre: 'Texas Holdem', activo: true },
  })
  console.log('Juego Texas Holdem verificado')

  // Plantilla de premios principales
  const plantillaExistente = await prisma.esquemaPremio.findFirst({
    where: { nombre: 'Tabla de premios principales' },
  })

  if (!plantillaExistente) {
    const plantilla = await prisma.esquemaPremio.create({
      data: {
        nombre: 'Tabla de premios principales',
        descripcion: 'Estructura de premios estándar de Casino Dreams',
        reglas: {
          createMany: {
            data: REGLAS_PLANTILLA_PRINCIPAL,
          },
        },
      },
    })
    console.log('Plantilla de premios creada:', plantilla.nombre)
  } else {
    console.log('Plantilla de premios ya existe, sin cambios')
  }

  await prisma.$disconnect()
}

seed()