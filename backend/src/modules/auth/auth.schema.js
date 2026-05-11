import { z } from 'zod'

export const schemaLogin = z.object({
  username: z
    .string({ required_error: 'El usuario es requerido.' })
    .min(3, 'El usuario debe tener al menos 3 caracteres.')
    .max(50, 'El usuario no puede superar 50 caracteres.'),
  password: z
    .string({ required_error: 'La contrasena es requerida.' })
    .min(6, 'La contrasena debe tener al menos 6 caracteres.'),
})