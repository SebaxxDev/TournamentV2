import { z } from 'zod';

export const crearPlantillaFichaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  detalles: z
    .array(
      z.object({
        id_ficha_catalogo: z.number().int().min(1),
        valor: z.number().int().min(1),
        cantidad_por_jugador: z.number().int().min(1),
      })
    )
    .min(1, 'Debe incluir al menos una ficha'),
});
