import { z } from 'zod';

// Schema de un nivel de ciegas o break
const nivelSchema = z.object({
  numero_nivel: z.number().int().positive(),
  tipo: z.enum(['NIVEL', 'BREAK', 'REGISTRO', 'COLOR_UP']),
  sb: z.number().int().min(0).default(0),
  bb: z.number().int().min(0).default(0),
  ante: z.number().int().min(0).default(0),
  tiempo_segundos: z.number().int().positive(),
});

// Schema de una ficha del torneo
const fichaSchema = z.object({
  id_ficha_catalogo: z.number().int().positive(),
  nombre: z.string().min(1),
  color: z.string().optional().nullable(),
  img_path: z.string().optional().nullable(),
  valor: z.number().int().positive(),
  cantidad_por_jugador: z.number().int().min(0),
});

// Schema completo de creación de torneo
export const crearTorneoSchema = z.object({
  // Datos generales
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  fecha_inicio: z.string().datetime({ message: 'Fecha de inicio inválida' }),
  id_tipo_juego: z.number().int().positive(),
  buy_in_monto: z.number().int().positive('El buy-in debe ser mayor a 0'),
  capacidad_maxima: z.number().int().positive().optional().nullable(),
  minimo_inicio: z.number().int().positive().optional().nullable(),

  // Rake
  rake_pct_inscripcion: z.number().min(0).max(100),
  rake_pct_rebuy: z.number().min(0).max(100).default(0),
  rake_pct_addon: z.number().min(0).max(100).default(0),

  // Configuración poker
  ultimo_nivel_registro: z.number().int().min(0).default(0),
  stack_inicial_valor: z.number().int().min(0).default(0),

  // Re-buy
  rebuy_permitido: z.boolean().default(false),
  rebuy_nivel_inicio: z.number().int().min(0).default(0),
  rebuy_nivel_final: z.number().int().min(0).default(0),
  rebuy_precio: z.number().min(0).default(0),
  rebuy_fichas: z.number().int().min(0).default(0),

  // Add-on
  addon_permitido: z.boolean().default(false),
  addon_nivel_inicio: z.number().int().min(0).default(0),
  addon_nivel_final: z.number().int().min(0).default(0),
  addon_precio: z.number().min(0).default(0),
  addon_fichas: z.number().int().min(0).default(0),

  // Free chip
  free_chip_permitido: z.boolean().default(false),
  free_chip_fichas: z.number().int().min(0).default(0),
  free_chip_nivel_inicio: z.number().int().min(0).default(0),
  free_chip_nivel_final: z.number().int().min(0).default(0),

  // Time bank
  timebank_permitido: z.boolean().default(false),
  timebank_n_tarjetas: z.number().int().min(0).default(0),
  timebank_tiempo: z.number().int().min(0).default(0),

  // Puntos circuito
  puntos_circuito: z.boolean().default(false),
  id_plantilla_circuito: z.number().int().positive().optional().nullable(),

  // Relaciones
  niveles: z.array(nivelSchema).min(1, 'Debes definir al menos un nivel'),
  fichas: z.array(fichaSchema).min(1, 'Debes seleccionar al menos una ficha'),
});