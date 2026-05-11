import { z } from 'zod'

export const schemaCrearStaff = z.object({
  username: z
    .string({ required_error: 'El username es requerido.' })
    .min(3, 'El username debe tener al menos 3 caracteres.')
    .max(50, 'El username no puede superar 50 caracteres.')
    .regex(/^[a-z0-9_]+$/, 'El username solo puede contener letras minusculas, numeros y guion bajo.'),

  password: z
    .string({ required_error: 'La contrasena es requerida.' })
    .min(8, 'La contrasena debe tener al menos 8 caracteres.')
    .max(100, 'La contrasena no puede superar 100 caracteres.'),

  nombre_completo: z
    .string({ required_error: 'El nombre completo es requerido.' })
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(100, 'El nombre no puede superar 100 caracteres.'),

  rol: z.enum(['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO', 'CROUPIER'], {
    required_error: 'El rol es requerido.',
    invalid_type_error: 'El rol no es valido.',
  }),

  email: z
    .string()
    .email('El email no es valido.')
    .max(100, 'El email no puede superar 100 caracteres.')
    .optional()
    .nullable(),
})

export const schemaEditarStaff = z.object({
  nombre_completo: z
    .string({ required_error: 'El nombre completo es requerido.' })
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(100, 'El nombre no puede superar 100 caracteres.'),

  rol: z.enum(['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO', 'CROUPIER'], {
    required_error: 'El rol es requerido.',
    invalid_type_error: 'El rol no es valido.',
  }),

  email: z
    .string()
    .email('El email no es valido.')
    .max(100, 'El email no puede superar 100 caracteres.')
    .optional()
    .nullable(),

  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres.')
    .max(100, 'La contrasena no puede superar 100 caracteres.')
    .optional()
    .nullable(),
})

export const schemaEstadoStaff = z.object({
  activo: z.boolean({ required_error: 'El estado es requerido.' }),
})