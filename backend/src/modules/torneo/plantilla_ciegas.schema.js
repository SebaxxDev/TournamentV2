import { z } from 'zod';

const tipoNivel = z.enum(['NIVEL', 'BREAK', 'REGISTRO', 'COLOR_UP']);

export const crearPlantillaCiegasSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  detalles: z
    .array(
      z.object({
        orden: z.number().int().min(1),
        tipo: tipoNivel,
        sb: z.number().int().min(0),
        bb: z.number().int().min(0),
        ante: z.number().int().min(0),
        tiempo_segundos: z.number().int().min(0),
        marcadores: z.array(z.string()),
      })
    )
    .min(1, 'Debe incluir al menos un nivel o break'),
});
