import { z } from 'zod'

const rutChileno = z
  .string({ required_error: 'El RUT es requerido.' })
  .regex(/^\d{7,8}-[\dkK]$/, 'El RUT debe tener el formato 12345678-9.')

export const schemaCrearJugador = z.object({
  rut: rutChileno,

  nombre_completo: z
    .string({ required_error: 'El nombre es requerido.' })
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(100, 'El nombre no puede superar 100 caracteres.'),

  email: z
    .string()
    .email('El email no es valido.')
    .max(100)
    .optional()
    .nullable(),

  telefono: z
    .string()
    .max(20, 'El telefono no puede superar 20 caracteres.')
    .optional()
    .nullable(),

  nacionalidad: z
    .string()
    .max(50, 'La nacionalidad no puede superar 50 caracteres.')
    .optional()
    .nullable(),

  profesion: z
    .string()
    .max(100, 'La profesion no puede superar 100 caracteres.')
    .optional()
    .nullable(),

  genero: z
    .enum(['MASCULINO', 'FEMENINO', 'OTRO'])
    .optional()
    .nullable(),

  domicilio: z
    .string()
    .max(255, 'El domicilio no puede superar 255 caracteres.')
    .optional()
    .nullable(),

  fecha_nacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD.')
    .optional()
    .nullable(),
})

export const schemaEditarJugador = schemaCrearJugador.omit({ rut: true })

export const schemaEstadoJugador = z.object({
  activo: z.boolean({ required_error: 'El estado es requerido.' }),
})

export const schemaListaNegra = z.object({
  lista_negra: z.boolean({ required_error: 'El valor es requerido.' }),
  motivo: z
    .string()
    .max(500, 'El motivo no puede superar 500 caracteres.')
    .optional()
    .nullable(),
})