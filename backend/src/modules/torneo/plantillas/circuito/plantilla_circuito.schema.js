import { z } from 'zod';

const detalleSchema = z.object({
  posicion: z.number().int().min(1),
  puntos_puesto: z.number().min(0),
  porcentaje_extra: z.number().min(0).max(100),
});

export const crearPlantillaCircuitoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  puntos_participacion: z.number().min(0),
  top_bonus_cantidad: z.number().int().min(0).optional(),
  detalles: z.array(detalleSchema).min(1, 'Debe haber al menos una fila de ranking'),
});
