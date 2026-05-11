import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiAlertCircle,
  FiLock,
} from 'react-icons/fi';
import api from '../../services/api.js';
import ModalEstructuraCiegas from './modales/ModalEstructuraCiegas.jsx';
import ModalFichasStack from './modales/ModalFichasStack.jsx';
import ModalTablaPremios from './modales/ModalTablaPremios.jsx';
import ModalTablaPuntosCircuito from './modales/ModalTablaPuntosCircuito.jsx';

// ------------------------------------------------------------
// Esquema de validación
// ------------------------------------------------------------
const esquemaFormulario = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  id_tipo_juego: z.coerce.number().int().positive('Selecciona un tipo de juego'),
  fecha: z.string().min(1, 'Requerido'),
  hora: z.string().min(1, 'Requerido'),
  buy_in_monto: z.coerce.number().int().positive('Debe ser mayor a 0'),
  capacidad_maxima: z.coerce.number().int().positive().optional().or(z.literal('')),
  minimo_inicio: z.coerce.number().int().positive().optional().or(z.literal('')),
  ultimo_nivel_registro: z.coerce.number().int().min(0).optional().or(z.literal('')),
  rake_pct_inscripcion: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  rake_pct_rebuy: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  rake_pct_addon: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  rebuy_nivel_inicio: z.coerce.number().int().min(0).optional().or(z.literal('')),
  rebuy_nivel_final: z.coerce.number().int().min(0).optional().or(z.literal('')),
  rebuy_precio: z.coerce.number().min(0).optional().or(z.literal('')),
  rebuy_fichas: z.coerce.number().int().min(0).optional().or(z.literal('')),
  addon_nivel_inicio: z.coerce.number().int().min(0).optional().or(z.literal('')),
  addon_nivel_final: z.coerce.number().int().min(0).optional().or(z.literal('')),
  addon_precio: z.coerce.number().min(0).optional().or(z.literal('')),
  addon_fichas: z.coerce.number().int().min(0).optional().or(z.literal('')),
  free_chip_fichas: z.coerce.number().int().min(0).optional().or(z.literal('')),
  free_chip_nivel_inicio: z.coerce.number().int().min(0).optional().or(z.literal('')),
  free_chip_nivel_final: z.coerce.number().int().min(0).optional().or(z.literal('')),
  timebank_n_tarjetas: z.coerce.number().int().min(0).optional().or(z.literal('')),
  timebank_tiempo: z.coerce.number().int().min(0).optional().or(z.literal('')),
});

const OPCIONES_TORNEO = [
  { key: 'puntos_circuito',     label: 'Puntos Circuito' },
  { key: 'rebuy_permitido',     label: 'Re-buy Permitido' },
  { key: 'addon_permitido',     label: 'Add-on Disponible' },
  { key: 'free_chip_permitido', label: 'Free Chip' },
  { key: 'timebank_permitido',  label: 'Time Bank' },
];

// ------------------------------------------------------------
// Componentes reutilizables
// ------------------------------------------------------------
const CampoInput = ({
  label, nombre, placeholder, tipo = 'text',
  register, error, prefijo, sufijo, nota, className = '',
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && (
      <label className="text-[10px] font-bold tracking-widest text-dreams-gold uppercase">
        {label}
      </label>
    )}
    <div className="relative flex items-center">
      {prefijo && (
        <span className="absolute left-3 text-dreams-text-muted text-sm select-none pointer-events-none">
          {prefijo}
        </span>
      )}
      <input
        type={tipo}
        placeholder={placeholder}
        {...register(nombre)}
        className={`
          w-full bg-dreams-surface-2 border rounded-lg px-3 py-2 text-sm text-dreams-text
          placeholder:text-dreams-text-muted/40 outline-none transition-all
          ${prefijo ? 'pl-7' : ''}
          ${sufijo ? 'pr-10' : ''}
          ${error
            ? 'border-red-500/60 focus:border-red-500'
            : 'border-dreams-border focus:border-dreams-gold/60'
          }
        `}
      />
      {sufijo && (
        <span className="absolute right-3 text-dreams-text-muted text-xs select-none pointer-events-none">
          {sufijo}
        </span>
      )}
    </div>
    {nota && !error && <p className="text-[10px] text-dreams-text-muted">{nota}</p>}
    {error && (
      <span className="flex items-center gap-1 text-red-400 text-[11px]">
        <FiAlertCircle size={11} /> {error.message}
      </span>
    )}
  </div>
);

const SubtituloSeccion = ({ label }) => (
  <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
    <span className="text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-dreams-border" />
  </div>
);

const BotonModal = ({ label, completado, onClick, deshabilitado = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={deshabilitado}
    className={`
      flex items-center justify-between gap-3 w-full px-4 py-3 rounded-lg border
      text-sm font-medium transition-all duration-150
      ${deshabilitado
        ? 'opacity-40 cursor-not-allowed border-dreams-border text-dreams-text-muted'
        : completado
          ? 'border-dreams-gold/40 text-dreams-gold bg-dreams-gold/5 hover:bg-dreams-gold/10'
          : 'border-dreams-border text-dreams-text-muted hover:border-dreams-gold/40 hover:text-dreams-text'
      }
    `}
  >
    <span>{label}</span>
    <span className={`
      w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-all
      ${completado ? 'bg-dreams-gold border-dreams-gold' : 'border-dreams-border'}
    `}>
      {completado && <FiCheck size={11} className="text-dreams-dark" />}
    </span>
  </button>
);

// ------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------
export default function CrearTorneo() {
  const navigate = useNavigate();

  const [opciones, setOpciones] = useState({
    puntos_circuito: false,
    rebuy_permitido: false,
    addon_permitido: false,
    free_chip_permitido: false,
    timebank_permitido: false,
  });

  const [rakeExpandido, setRakeExpandido] = useState(false);
  const [modalCiegasAbierto, setModalCiegasAbierto] = useState(false);
  const [modalFichasAbierto, setModalFichasAbierto] = useState(false);
  const [modalPremiosAbierto, setModalPremiosAbierto] = useState(false);
  const [modalCircuitoAbierto, setModalCircuitoAbierto] = useState(false);

  const [extrasNiveles, setExtrasNiveles] = useState({});

  const [modalesCompletados, setModalesCompletados] = useState({
    ciegas: false,
    fichas: false,
    premios: false,
    circuito: false,
  });

  const [datosModales, setDatosModales] = useState({
    niveles: [],
    fichas: [],
    premios: null,
    circuito: null,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(esquemaFormulario),
    defaultValues: {
      nombre: '', id_tipo_juego: '', fecha: '', hora: '',
      buy_in_monto: '', capacidad_maxima: '', minimo_inicio: '',
      ultimo_nivel_registro: '', rake_pct_inscripcion: '',
      rake_pct_rebuy: '', rake_pct_addon: '',
      rebuy_nivel_inicio: '', rebuy_nivel_final: '',
      rebuy_precio: '', rebuy_fichas: '',
      addon_nivel_inicio: '', addon_nivel_final: '',
      addon_precio: '', addon_fichas: '',
      free_chip_fichas: '', free_chip_nivel_inicio: '', free_chip_nivel_final: '',
      timebank_n_tarjetas: '', timebank_tiempo: '',
    },
  });

  const { data: dataJuegos } = useQuery({
    queryKey: ['catalogo-juegos'],
    queryFn: async () => {
      const res = await api.get('/catalogo/juegos');
      return res.data.datos;
    },
  });

  const mutacionCrear = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/torneos', payload);
      return res.data.datos;
    },
    onSuccess: (torneo) => {
      navigate(`/torneos/${torneo.id_torneo}`);
    },
  });

  const toggleOpcion = (key) => setOpciones((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!opciones.puntos_circuito) {
      setModalesCompletados((prev) => ({ ...prev, circuito: false }));
      setDatosModales((prev) => ({ ...prev, circuito: null }));
    }
  }, [opciones.puntos_circuito]);

  const valoresBase = watch(['nombre', 'id_tipo_juego', 'fecha', 'hora', 'buy_in_monto']);
  const formularioBaseCompleto = valoresBase.every((v) => v !== '' && v !== undefined && v !== null);

  const variablesCompletas = (
    (!opciones.rebuy_permitido || (watch('rebuy_precio') && watch('rebuy_fichas'))) &&
    (!opciones.addon_permitido || (watch('addon_precio') && watch('addon_fichas'))) &&
    (!opciones.free_chip_permitido || watch('free_chip_fichas')) &&
    (!opciones.timebank_permitido || (watch('timebank_n_tarjetas') && watch('timebank_tiempo')))
  );

  const rakeCompleto = (
    !!watch('rake_pct_inscripcion') &&
    (!opciones.rebuy_permitido || !!watch('rake_pct_rebuy')) &&
    (!opciones.addon_permitido  || !!watch('rake_pct_addon'))
  );

  const formularioCompleto = formularioBaseCompleto && variablesCompletas && rakeCompleto;

  const puedeCrear =
    formularioCompleto &&
    modalesCompletados.ciegas &&
    modalesCompletados.fichas &&
    (!opciones.puntos_circuito || modalesCompletados.circuito) &&
    !isSubmitting;

  const onSubmit = (valores) => {
    const fechaInicio = new Date(`${valores.fecha}T${valores.hora}:00`);
    const payload = {
      nombre: valores.nombre,
      id_tipo_juego: Number(valores.id_tipo_juego),
      fecha_inicio: fechaInicio.toISOString(),
      buy_in_monto: Number(valores.buy_in_monto),
      capacidad_maxima: valores.capacidad_maxima ? Number(valores.capacidad_maxima) : null,
      minimo_inicio: valores.minimo_inicio ? Number(valores.minimo_inicio) : null,
      ultimo_nivel_registro: valores.ultimo_nivel_registro ? Number(valores.ultimo_nivel_registro) : 0,
      rake_pct_inscripcion: valores.rake_pct_inscripcion ? Number(valores.rake_pct_inscripcion) : 0,
      rake_pct_rebuy: opciones.rebuy_permitido && valores.rake_pct_rebuy ? Number(valores.rake_pct_rebuy) : 0,
      rake_pct_addon: opciones.addon_permitido && valores.rake_pct_addon ? Number(valores.rake_pct_addon) : 0,
      ...opciones,
      rebuy_nivel_inicio: opciones.rebuy_permitido ? Number(valores.rebuy_nivel_inicio) || 0 : 0,
      rebuy_nivel_final: opciones.rebuy_permitido ? Number(valores.rebuy_nivel_final) || 0 : 0,
      rebuy_precio: opciones.rebuy_permitido ? Number(valores.rebuy_precio) || 0 : 0,
      rebuy_fichas: opciones.rebuy_permitido ? Number(valores.rebuy_fichas) || 0 : 0,
      addon_nivel_inicio: opciones.addon_permitido ? Number(valores.addon_nivel_inicio) || 0 : 0,
      addon_nivel_final: opciones.addon_permitido ? Number(valores.addon_nivel_final) || 0 : 0,
      addon_precio: opciones.addon_permitido ? Number(valores.addon_precio) || 0 : 0,
      addon_fichas: opciones.addon_permitido ? Number(valores.addon_fichas) || 0 : 0,
      free_chip_fichas: opciones.free_chip_permitido ? Number(valores.free_chip_fichas) || 0 : 0,
      free_chip_nivel_inicio: opciones.free_chip_permitido ? Number(valores.free_chip_nivel_inicio) || 0 : 0,
      free_chip_nivel_final: opciones.free_chip_permitido ? Number(valores.free_chip_nivel_final) || 0 : 0,
      timebank_n_tarjetas: opciones.timebank_permitido ? Number(valores.timebank_n_tarjetas) || 0 : 0,
      timebank_tiempo: opciones.timebank_permitido ? Number(valores.timebank_tiempo) || 0 : 0,
      stack_inicial_valor: datosModales.fichas.reduce((acc, f) => acc + f.valor * f.cantidad_por_jugador, 0),
      id_plantilla_circuito: opciones.puntos_circuito ? datosModales.circuito ?? null : null,
      niveles: datosModales.niveles,
      fichas: datosModales.fichas,
      premios: datosModales.premios,
      ...extrasNiveles,
    };
    mutacionCrear.mutate(payload);
  };

  return (
    <div className="p-6 pb-10">

      {/* Encabezado */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-dreams-text">Crear nuevo Torneo</h1>
        <p className="text-xs text-dreams-text-muted mt-0.5">
          Configura todos los parámetros antes de crear el torneo.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ====================================================
            Layout dos columnas: izquierda fija + derecha flex
        ==================================================== */}
        <div className="flex gap-5 items-start">

          {/* ==================================================
              COLUMNA IZQUIERDA — 320px fija
          ================================================== */}
          <div className="w-[320px] flex-shrink-0 flex flex-col gap-4">

            {/* Panel información general */}
            <div className="bg-dreams-surface border border-dreams-border rounded-xl p-5">
              <p className="text-xs font-bold text-dreams-gold text-center tracking-wider mb-4">
                Información General
              </p>

              <div className="flex flex-col gap-3">
                <CampoInput
                  label="Nombre del Torneo"
                  nombre="nombre"
                  placeholder="Ej: Dreams Poker Enero"
                  register={register}
                  error={errors.nombre}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold tracking-widest text-dreams-gold uppercase">
                    Tipo de Juego
                  </label>
                  <select
                    {...register('id_tipo_juego')}
                    className={`
                      w-full bg-dreams-surface-2 border rounded-lg px-3 py-2 text-sm text-dreams-text
                      outline-none transition-all appearance-none cursor-pointer
                      ${errors.id_tipo_juego ? 'border-red-500/60' : 'border-dreams-border focus:border-dreams-gold/60'}
                    `}
                  >
                    <option value="" disabled hidden>Seleccionar...</option>
                    {dataJuegos?.map((j) => (
                      <option key={j.id_tipo_juego} value={j.id_tipo_juego}>{j.nombre}</option>
                    ))}
                  </select>
                  {errors.id_tipo_juego && (
                    <span className="flex items-center gap-1 text-red-400 text-[11px]">
                      <FiAlertCircle size={11} /> {errors.id_tipo_juego.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <CampoInput label="Fecha" nombre="fecha" tipo="date"
                    register={register} error={errors.fecha} />
                  <CampoInput label="Hora" nombre="hora" tipo="time"
                    register={register} error={errors.hora} />
                </div>

                <CampoInput
                  label="Buy-in (CLP)"
                  nombre="buy_in_monto"
                  tipo="number"
                  placeholder="Ej: 50000"
                  prefijo="$"
                  register={register}
                  error={errors.buy_in_monto}
                />

                {/* Rake */}
                <div>
                  <button
                    type="button"
                    onClick={() => setRakeExpandido((v) => !v)}
                    className="w-full flex items-center justify-between bg-dreams-gold text-dreams-dark text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <span>Definir Rake</span>
                    {rakeExpandido ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                  </button>

                  {rakeExpandido && (
                    <div className="mt-2 flex flex-col gap-2 bg-dreams-surface-2 border border-dreams-border rounded-lg p-3">
                      <CampoInput label="Rake Inscripción" nombre="rake_pct_inscripcion"
                        tipo="number" placeholder="Ej: 10" sufijo="%" register={register}
                        error={errors.rake_pct_inscripcion} />
                      {opciones.rebuy_permitido && (
                        <CampoInput label="Rake Re-buy" nombre="rake_pct_rebuy"
                          tipo="number" placeholder="Ej: 10" sufijo="%" register={register}
                          error={errors.rake_pct_rebuy} />
                      )}
                      {opciones.addon_permitido && (
                        <CampoInput label="Rake Add-on" nombre="rake_pct_addon"
                          tipo="number" placeholder="Ej: 5" sufijo="%" register={register}
                          error={errors.rake_pct_addon} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel opciones */}
            <div className="bg-dreams-surface border border-dreams-border rounded-xl p-5">
              <p className="text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase mb-3">
                Opciones del Torneo
              </p>
              <div className="flex flex-col gap-2">
                {OPCIONES_TORNEO.map((opcion) => (
                  <label
                    key={opcion.key}
                    onClick={() => toggleOpcion(opcion.key)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer
                      transition-all duration-150 select-none
                      ${opciones[opcion.key]
                        ? 'border-dreams-gold/40 bg-dreams-gold/5'
                        : 'border-dreams-border hover:border-dreams-gold/30'
                      }
                    `}
                  >
                    <div className={`
                      w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-all
                      ${opciones[opcion.key]
                        ? 'bg-dreams-gold border-dreams-gold'
                        : 'bg-dreams-surface-2 border-dreams-border'
                      }
                    `}>
                      {opciones[opcion.key] && <FiCheck size={10} className="text-dreams-dark" />}
                    </div>
                    <span className={`text-xs font-medium transition-colors ${
                      opciones[opcion.key] ? 'text-dreams-gold' : 'text-dreams-text-muted'
                    }`}>
                      {opcion.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ==================================================
              COLUMNA DERECHA — flex-1, campos en grilla interna
          ================================================== */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Panel configuración principal */}
            <div className="bg-dreams-surface border border-dreams-border rounded-xl p-5">

              {/* Capacidad */}
              <SubtituloSeccion label="Capacidad" />
              <div className="grid grid-cols-2 gap-4">
                <CampoInput label="Jugadores Mínimos" nombre="minimo_inicio" tipo="number"
                  placeholder="Ej: 12" register={register} error={errors.minimo_inicio}
                  nota="Mínimo para iniciar" />
                <CampoInput label="Jugadores Máximos" nombre="capacidad_maxima" tipo="number"
                  placeholder="Ej: 100" register={register} error={errors.capacidad_maxima} />
              </div>

              {/* Re-buy */}
              {opciones.rebuy_permitido && (
                <>
                  <SubtituloSeccion label="Re-buy" />
                  <div className="grid grid-cols-2 gap-4">
                    <CampoInput label="Costo ($)" nombre="rebuy_precio" tipo="number"
                      placeholder="Ej: 50000" prefijo="$" register={register} error={errors.rebuy_precio} />
                    <CampoInput label="Fichas que entrega" nombre="rebuy_fichas" tipo="number"
                      placeholder="Ej: 20000" register={register} error={errors.rebuy_fichas} />
                  </div>
                </>
              )}

              {/* Add-on */}
              {opciones.addon_permitido && (
                <>
                  <SubtituloSeccion label="Add-on" />
                  <div className="grid grid-cols-2 gap-4">
                    <CampoInput label="Costo ($)" nombre="addon_precio" tipo="number"
                      placeholder="Ej: 50000" prefijo="$" register={register} error={errors.addon_precio} />
                    <CampoInput label="Fichas que entrega" nombre="addon_fichas" tipo="number"
                      placeholder="Ej: 20000" register={register} error={errors.addon_fichas} />
                  </div>
                </>
              )}

              {/* Free chip */}
              {opciones.free_chip_permitido && (
                <>
                  <SubtituloSeccion label="Free Chip" />
                  <div className="grid grid-cols-2 gap-4">
                    <CampoInput label="Cantidad en Fichas" nombre="free_chip_fichas" tipo="number"
                      placeholder="Ej: 10000" register={register} error={errors.free_chip_fichas} />
                  </div>
                </>
              )}

              {/* Time bank */}
              {opciones.timebank_permitido && (
                <>
                  <SubtituloSeccion label="Time Bank" />
                  <div className="grid grid-cols-2 gap-4">
                    <CampoInput label="N° de tarjetas" nombre="timebank_n_tarjetas" tipo="number"
                      placeholder="Ej: 3" register={register} error={errors.timebank_n_tarjetas}
                      nota="Tarjetas entregadas por jugador" />
                    <CampoInput label="Tiempo por tarjeta" nombre="timebank_tiempo" tipo="number"
                      placeholder="Ej: 30" sufijo="seg" register={register} error={errors.timebank_tiempo}
                      nota="Segundos extra por tarjeta" />
                  </div>
                </>
              )}
            </div>

            {/* Panel configuración avanzada */}
            <div className="bg-dreams-surface border border-dreams-border rounded-xl p-5">
              <p className="text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase mb-3">
                Configuración Avanzada
              </p>
              <div className={`grid gap-3 ${opciones.puntos_circuito ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <BotonModal
                  label="Definir Estructura Ciegas"
                  completado={modalesCompletados.ciegas}
                  deshabilitado={!formularioCompleto}
                  onClick={() => setModalCiegasAbierto(true)}
                />
                <BotonModal
                  label="Definir Fichas y Stack"
                  completado={modalesCompletados.fichas}
                  deshabilitado={!formularioCompleto}
                  onClick={() => setModalFichasAbierto(true)}
                />
                <BotonModal
                  label="Ajustar Tabla de Premios"
                  completado={modalesCompletados.premios}
                  deshabilitado={!formularioCompleto}
                  onClick={() => setModalPremiosAbierto(true)}
                />
                {opciones.puntos_circuito && (
                  <BotonModal
                    label="Definir Puntos Circuito"
                    completado={modalesCompletados.circuito}
                    deshabilitado={!formularioCompleto}
                    onClick={() => setModalCircuitoAbierto(true)}
                  />
                )}
              </div>

              {!formularioCompleto && (
                <div className="mt-3 flex items-start gap-2 text-[11px] text-dreams-text-muted bg-dreams-surface-2 border border-dreams-border rounded-lg px-3 py-2">
                  <FiLock size={12} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Falta completar:{' '}
                    <span className="text-dreams-text font-medium">
                      {[
                        !formularioBaseCompleto && 'datos generales',
                        !rakeCompleto && 'rake',
                        !variablesCompletas && 'parámetros de opciones activas',
                      ].filter(Boolean).join(', ')}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Botón crear */}
            <button
              type="submit"
              disabled={!puedeCrear || mutacionCrear.isPending}
              className={`
                w-full py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase
                transition-all duration-200
                ${puedeCrear && !mutacionCrear.isPending
                  ? 'bg-dreams-gold text-dreams-dark hover:bg-dreams-gold-light cursor-pointer'
                  : 'bg-dreams-surface text-dreams-text-muted cursor-not-allowed border border-dreams-border'
                }
              `}
            >
              {mutacionCrear.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-dreams-dark/30 border-t-dreams-dark rounded-full animate-spin" />
                  Creando torneo...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {!puedeCrear && <FiLock size={13} />}
                  Crear Torneo
                </span>
              )}
            </button>

            {mutacionCrear.isError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <FiAlertCircle size={15} />
                <span>
                  {mutacionCrear.error?.response?.data?.mensaje ?? 'Error al crear el torneo. Intenta nuevamente.'}
                </span>
              </div>
            )}
          </div>

        </div>
      </form>

      {/* Modal estructura de ciegas */}
      {modalCiegasAbierto && (
        <ModalEstructuraCiegas
          opciones={opciones}
          nivelesIniciales={datosModales.niveles}
          onGuardar={(datos) => {
            const { niveles, ...extras } = datos;
            setDatosModales((prev) => ({ ...prev, niveles }));
            setExtrasNiveles(extras);
            setModalesCompletados((prev) => ({ ...prev, ciegas: true }));
            setModalCiegasAbierto(false);
          }}
          onCerrar={() => setModalCiegasAbierto(false)}
        />
      )}

      {/* Modal fichas y stack */}
      {modalFichasAbierto && (
        <ModalFichasStack
          capacidadMaxima={watch('capacidad_maxima') || null}
          fichasIniciales={datosModales.fichas}
          onGuardar={(datos) => {
            setDatosModales((prev) => ({
              ...prev,
              fichas: datos.fichas,
              stack_inicial_valor: datos.stack_inicial_valor,
            }));
            setModalesCompletados((prev) => ({ ...prev, fichas: true }));
            setModalFichasAbierto(false);
          }}
          onCerrar={() => setModalFichasAbierto(false)}
        />
      )}

      {/* Modal tabla de premios */}
      {modalPremiosAbierto && (
        <ModalTablaPremios
          premiosIniciales={datosModales.premios}
          onGuardar={(datos) => {
            setDatosModales((prev) => ({ ...prev, premios: datos }));
            setModalesCompletados((prev) => ({ ...prev, premios: true }));
            setModalPremiosAbierto(false);
          }}
          onCerrar={() => setModalPremiosAbierto(false)}
        />
      )}

      {modalCircuitoAbierto && (
        <ModalTablaPuntosCircuito
          key={datosModales.circuito ?? 'nuevo'}
          idPlantillaInicial={datosModales.circuito}
          inscripcionesReferencia={watch('capacidad_maxima')}
          onGuardar={(idPlantilla) => {
            setDatosModales((prev) => ({ ...prev, circuito: idPlantilla }));
            setModalesCompletados((prev) => ({ ...prev, circuito: true }));
            setModalCircuitoAbierto(false);
          }}
          onCerrar={() => setModalCircuitoAbierto(false)}
        />
      )}
    </div>
  );
}