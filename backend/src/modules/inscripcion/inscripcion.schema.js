import { z } from 'zod'

export const schemaCrearInscripcion = z.object({
  id_torneo: z
    .number({ required_error: 'El id_torneo es requerido.' })
    .int()
    .positive(),

  rut_jugador: z
    .string({ required_error: 'El RUT del jugador es requerido.' })
    .regex(/^\d{7,8}-[\dkK]$/, 'El RUT debe tener el formato 12345678-9.'),

  tiene_free_chip: z.boolean().optional().default(false),
})

export const schemaBustOut = z.object({
  ronda: z
    .string({ required_error: 'La ronda es requerida.' })
    .max(50, 'La ronda no puede superar 50 caracteres.'),

  pos_final: z
    .number({ required_error: 'La posicion final es requerida.' })
    .int()
    .positive(),
})
