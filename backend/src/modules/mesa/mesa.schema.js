import { z } from 'zod'

export const schemaMoverJugador = z.object({
  id_inscripcion:      z.number().int().positive(),
  id_asiento_origen:   z.number().int().positive(),
  id_asiento_destino:  z.number().int().positive(),
})

export const schemaAsignarJugador = z.object({
  id_inscripcion:      z.number().int().positive(),
  id_asiento_destino:  z.number().int().positive(),
})
