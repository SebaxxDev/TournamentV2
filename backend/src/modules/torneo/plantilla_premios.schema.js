import { z } from 'zod';

export const crearPlantillaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50),
  descripcion: z.string().max(255).optional(),
  reglas: z
    .array(
      z.object({
        rango_min_jugadores: z.number().int().min(1),
        rango_max_jugadores: z.number().int().min(1),
        posicion: z.number().int().min(1),
        porcentaje: z.number().min(0).max(100),
      })
    )
    .min(1, 'Debe incluir al menos una regla'),
});