import { z } from 'zod';

export const schemaCrearFicha = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(50),
  color: z.string().min(1, 'El color es obligatorio').max(30),
});

export const schemaEditarFicha = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(50).optional(),
  color: z.string().min(1, 'El color es obligatorio').max(30).optional(),
});