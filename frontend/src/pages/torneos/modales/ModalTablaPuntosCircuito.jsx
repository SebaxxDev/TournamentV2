import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiX, FiPlus, FiAlertCircle, FiSave, FiBookmark, FiChevronDown, FiMinus,
} from 'react-icons/fi';
import api from '../../../services/api.js';

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
let _seq = 0;
const nuevoId = (prefijo) => `${prefijo}-${Date.now()}-${_seq++}`;

const redondear2 = (n) => Math.round(Number(n) * 100) / 100;

const parseNum = (v) => {
  if (v === '' || v === undefined || v === null) return NaN;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

const formatCL = (n) =>
  redondear2(n).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Puntos extra = (% × puntos puesto) / 100 — misma lógica que tablas tipo Sun Dreams */
const puntosExtraDesdePct = (porcentajeExtra, puntosPuesto) =>
  redondear2((parseNum(porcentajeExtra) / 100) * parseNum(puntosPuesto));

/** Evita generar cientos de miles de filas DOM (p. ej. typo en capacidad). */
const LIMITE_FILAS_TABLA = 1000;

const BG_PAR = '#1a1a1a';
const BG_IMPAR = '#1f1f1f';
const BG_HOVER = 'rgba(212,175,55,0.05)';

// ------------------------------------------------------------
// Sub-modal nombre
// ------------------------------------------------------------
const ModalNombrePlantilla = ({ titulo, subtitulo, onConfirmar, onCancelar }) => {
  const [nombre, setNombre] = useState('');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-dreams-surface border border-dreams-border rounded-2xl p-6 w-[340px] shadow-2xl flex flex-col gap-4">
        <div>
          <p className="text-base font-bold text-dreams-text">{titulo}</p>
          {subtitulo && (
            <p className="text-xs text-dreams-text-muted mt-0.5">{subtitulo}</p>
          )}
        </div>
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && nombre.trim() && onConfirmar(nombre.trim())}
          placeholder="Ej: Ranking Local Sun Dreams"
          className="w-full bg-dreams-surface-2 border border-dreams-border rounded-lg px-3 py-2.5 text-sm text-dreams-text outline-none focus:border-dreams-gold/60 transition-all"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancelar}
            className="px-4 py-2 rounded-lg border border-dreams-border text-sm text-dreams-text-muted hover:text-dreams-text hover:border-dreams-gold/30 transition-all">
            Cancelar
          </button>
          <button type="button" disabled={!nombre.trim()} onClick={() => onConfirmar(nombre.trim())}
            className="px-4 py-2 rounded-lg bg-dreams-gold text-dreams-dark text-sm font-bold hover:bg-dreams-gold-light transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------
export default function ModalTablaPuntosCircuito({
  idPlantillaInicial,
  inscripcionesReferencia,
  onGuardar,
  onCerrar,
}) {
  const queryClient = useQueryClient();
  const [puntosParticipacion, setPuntosParticipacion] = useState('50');
  const [filas, setFilas] = useState(() => []);

  const capacidadMaxInscripciones = useMemo(() => {
    const v = inscripcionesReferencia;
    if (v === '' || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [inscripcionesReferencia]);

  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [modalNombreAbierto, setModalNombreAbierto] = useState(false);
  const [modalNombreModo, setModalNombreModo] = useState('torneo');
  const [filaHover, setFilaHover] = useState(null);
  const [listoParaMostrar, setListoParaMostrar] = useState(!idPlantillaInicial);
  // Detecta si el usuario modificó la plantilla cargada para decidir si crear una nueva o reutilizar
  const [plantillaModificada, setPlantillaModificada] = useState(false);

  const { data: plantillaCargada, isLoading: cargandoPlantilla } = useQuery({
    queryKey: ['plantilla-circuito', idPlantillaInicial],
    queryFn: async () => {
      const res = await api.get(`/plantillas-circuito/${idPlantillaInicial}`);
      return res.data.datos;
    },
    enabled: Boolean(idPlantillaInicial),
  });

  useEffect(() => {
    if (!idPlantillaInicial) {
      setListoParaMostrar(true);
      return;
    }
    if (plantillaCargada) {
      setPuntosParticipacion(String(Number(plantillaCargada.puntos_participacion)));
      setFilas(
        plantillaCargada.detalles.map((d) => ({
          id: nuevoId('fila'),
          posicion: d.posicion,
          puntos_puesto: String(Number(d.puntos_puesto)),
          porcentaje_extra: String(Number(d.porcentaje_extra)),
        }))
      );
      setPlantillaSeleccionada(plantillaCargada.id_plantilla);
      setPlantillaModificada(false);
      setListoParaMostrar(true);
    }
  }, [idPlantillaInicial, plantillaCargada]);

  const { data: plantillas = [], isLoading: cargandoPlantillas } = useQuery({
    queryKey: ['plantillas-circuito'],
    queryFn: async () => {
      const res = await api.get('/plantillas-circuito');
      return res.data.datos;
    },
  });

  const mutacionCrearPlantilla = useMutation({
    mutationFn: (body) => api.post('/plantillas-circuito', body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-circuito'] });
      setPlantillaSeleccionada(res.data.datos.id_plantilla);
    },
  });

  const mutacionEliminarPlantilla = useMutation({
    mutationFn: (id) => api.delete(`/plantillas-circuito/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-circuito'] });
      setPlantillaSeleccionada(null);
      setPuntosParticipacion('50');
      setFilas([]);
    },
  });

  const plantillaActual = plantillas.find((p) => p.id_plantilla === plantillaSeleccionada);

  const filasConCalculos = useMemo(
    () =>
      filas.map((f) => {
        const pp = parseNum(f.puntos_puesto);
        const pct = parseNum(f.porcentaje_extra);
        const part = parseNum(puntosParticipacion);
        const extra =
          Number.isFinite(pp) && Number.isFinite(pct) ? puntosExtraDesdePct(pct, pp) : NaN;
        const total =
          Number.isFinite(part) && Number.isFinite(pp) && Number.isFinite(extra)
            ? redondear2(part + pp + extra)
            : NaN;
        return { ...f, extra, total };
      }),
    [filas, puntosParticipacion]
  );

  const erroresValidacion = useMemo(() => {
    const errs = [];
    const part = parseNum(puntosParticipacion);
    if (!Number.isFinite(part) || part < 0) errs.push('Puntos por participar inválidos');
    if (filas.length < 1) errs.push('Debe haber al menos un puesto');
    for (const f of filas) {
      const pp = parseNum(f.puntos_puesto);
      const pct = parseNum(f.porcentaje_extra);
      if (!Number.isFinite(pp) || pp < 0) errs.push(`Puesto ${f.posicion}: puntos inválidos`);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        errs.push(`Puesto ${f.posicion}: % extra debe estar entre 0 y 100`);
      }
    }
    return errs;
  }, [filas, puntosParticipacion]);

  const puedeGuardar = erroresValidacion.length === 0;

  const cargarPlantilla = (plantilla) => {
    setPuntosParticipacion(String(Number(plantilla.puntos_participacion)));
    setFilas(
      plantilla.detalles.map((d) => ({
        id: nuevoId('fila'),
        posicion: d.posicion,
        puntos_puesto: String(Number(d.puntos_puesto)),
        porcentaje_extra: String(Number(d.porcentaje_extra)),
      }))
    );
    setPlantillaSeleccionada(plantilla.id_plantilla);
    setPlantillaModificada(false);
    setDropdownAbierto(false);
  };

  const construirBodyApi = (nombre) => {
    const part = parseNum(puntosParticipacion);
    return {
      nombre,
      puntos_participacion: part,
      top_bonus_cantidad: filas.length,
      detalles: filas.map((f) => ({
        posicion: f.posicion,
        puntos_puesto: parseNum(f.puntos_puesto),
        porcentaje_extra: parseNum(f.porcentaje_extra),
      })),
    };
  };

  const confirmarNombreModal = (nombre) => {
    mutacionCrearPlantilla.mutate(construirBodyApi(nombre), {
      onSuccess: (res) => {
        setModalNombreAbierto(false);
        if (modalNombreModo === 'torneo') {
          onGuardar(res.data.datos.id_plantilla);
        }
      },
    });
  };

  const handleGuardarTabla = () => {
    if (!puedeGuardar) return;
    // Si hay plantilla seleccionada y no fue modificada → reutilizar sin crear otra
    if (plantillaSeleccionada && !plantillaModificada) {
      onGuardar(plantillaSeleccionada);
      return;
    }
    // Si es nueva o fue modificada → pedir nombre y crear en la DB
    setModalNombreModo('torneo');
    setModalNombreAbierto(true);
  };

  const handleGuardarComoPlantilla = () => {
    if (!puedeGuardar) return;
    setModalNombreModo('biblioteca');
    setModalNombreAbierto(true);
  };

  const actualizarFila = (filaId, campo, valorRaw) => {
    if (campo !== 'puntos_puesto' && campo !== 'porcentaje_extra') return;
    const valor = String(valorRaw).replace(',', '.');
    if (valor !== '' && !/^\d{0,6}\.?\d{0,2}$/.test(valor)) return;
    setFilas((prev) =>
      prev.map((f) => (f.id === filaId ? { ...f, [campo]: valor } : f))
    );
    if (plantillaSeleccionada) setPlantillaModificada(true);
  };

  const topeFilas = capacidadMaxInscripciones != null
    ? Math.min(Math.floor(capacidadMaxInscripciones), LIMITE_FILAS_TABLA)
    : LIMITE_FILAS_TABLA;

  const agregarFila = () => {
    if (plantillaSeleccionada) setPlantillaModificada(true);
    setFilas((prev) => {
      if (capacidadMaxInscripciones != null && prev.length >= topeFilas) return prev;
      const p = prev.length + 1;
      return [
        ...prev,
        {
          id: nuevoId('fila'),
          posicion: p,
          puntos_puesto: '',
          porcentaje_extra: '',
        },
      ];
    });
  };

  const eliminarUltimaFila = () => {
    if (plantillaSeleccionada) setPlantillaModificada(true);
    setFilas((prev) => {
      if (prev.length === 0) return prev;
      if (prev.length === 1) return [];
      return prev.slice(0, -1).map((f, i) => ({ ...f, posicion: i + 1 }));
    });
  };

  const eliminarFila = (filaId) => {
    if (plantillaSeleccionada) setPlantillaModificada(true);
    setFilas((prev) =>
      prev.filter((f) => f.id !== filaId).map((f, i) => ({ ...f, posicion: i + 1 }))
    );
  };

  const mostrarCargando = idPlantillaInicial && (cargandoPlantilla || !listoParaMostrar);
  const tablaTruncada =
    capacidadMaxInscripciones != null && capacidadMaxInscripciones > LIMITE_FILAS_TABLA;
  const noPuedeAnadirFila = filas.length >= topeFilas;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div
          className="bg-dreams-surface border border-dreams-border rounded-2xl flex flex-col shadow-2xl"
          style={{ width: 'min(98vw, 1100px)', maxHeight: '92vh' }}
        >
          {/* Header (misma lógica visual que Tabla de Premios) */}
          <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-5 border-b border-dreams-border flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 flex items-center gap-3 min-w-0 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-dreams-gold tracking-wide whitespace-nowrap">
                  Tabla de puntos circuito
                </h2>

                <div className="w-px h-6 bg-dreams-border flex-shrink-0" />

                <div className="relative z-20 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setDropdownAbierto((v) => !v)}
                    className={`
                      flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-lg border text-sm transition-all
                      ${plantillaActual
                        ? 'border-dreams-gold/30 bg-dreams-gold/5 text-dreams-gold'
                        : 'border-dreams-border bg-dreams-surface-2 text-dreams-text-muted hover:border-dreams-gold/30 hover:text-dreams-text'
                      }
                    `}
                    style={{ minWidth: '180px' }}
                  >
                    <FiBookmark size={12} className="flex-shrink-0" />
                    <span className="truncate flex-1 text-left text-sm" style={{ maxWidth: '130px' }}>
                      {plantillaActual ? plantillaActual.nombre : 'Plantilla...'}
                    </span>
                    <FiChevronDown size={12} className={`flex-shrink-0 transition-transform ${dropdownAbierto ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownAbierto && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownAbierto(false)} />
                      <div className="absolute top-full left-0 mt-1.5 z-20 bg-dreams-surface border border-dreams-border rounded-xl shadow-2xl overflow-hidden" style={{ minWidth: '220px' }}>
                        <div className="px-3 py-2 border-b border-dreams-border">
                          <p className="text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase">Plantillas guardadas</p>
                        </div>
                        {cargandoPlantillas ? (
                          <div className="px-4 py-3 text-xs text-dreams-text-muted">Cargando...</div>
                        ) : plantillas.length === 0 ? (
                          <div className="px-4 py-4 text-xs text-dreams-text-muted text-center">Sin plantillas guardadas</div>
                        ) : (
                          <div className="py-1 max-h-56 overflow-y-auto">
                            {plantillas.map((p) => (
                              <button
                                key={p.id_plantilla}
                                type="button"
                                onClick={() => cargarPlantilla(p)}
                                className={`
                                  w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2
                                  ${p.id_plantilla === plantillaSeleccionada
                                    ? 'bg-dreams-gold/10 text-dreams-gold font-semibold'
                                    : 'text-dreams-text hover:bg-dreams-surface-2'
                                  }
                                `}
                              >
                                {p.id_plantilla === plantillaSeleccionada
                                  ? <span className="w-1.5 h-1.5 rounded-full bg-dreams-gold flex-shrink-0" />
                                  : <span className="w-1.5 h-1.5 flex-shrink-0" />
                                }
                                {p.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGuardarComoPlantilla}
                  disabled={!puedeGuardar || mutacionCrearPlantilla.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 hover:border-emerald-500/70 active:scale-95 transition-all disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <FiSave size={12} />
                  Guardar como plantilla
                </button>

                {plantillaSeleccionada && (
                  <button
                    type="button"
                    onClick={() => mutacionEliminarPlantilla.mutate(plantillaSeleccionada)}
                    disabled={mutacionEliminarPlantilla.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 hover:border-red-500/70 active:scale-95 transition-all disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <FiX size={12} />
                    Eliminar plantilla
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onCerrar}
                className="text-dreams-text-muted hover:text-dreams-text hover:bg-dreams-surface-2 transition-all p-2 rounded-lg flex-shrink-0"
                aria-label="Cerrar"
              >
                <FiX size={18} />
              </button>
            </div>

            <p className="text-xs text-dreams-text-muted max-w-md leading-relaxed">
              Define cómo se reparten los puntos del circuito según el lugar obtenido en el torneo.
              <br />
              <br />
              Los valores de cada puesto se guardan en la plantilla.
            </p>
          </div>

          {/* Capacidad torneo + puntos participar + filas (misma altura, botones a la derecha) */}
          <div className="px-5 sm:px-7 pt-3 flex flex-wrap items-end justify-between gap-4 border-b border-dreams-border/50 pb-3">
            <div className="flex flex-wrap items-end gap-4 min-w-0">
              <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase">
                Inscripciones máx. (torneo)
              </span>
              <div
                className="flex items-center gap-2 rounded-lg border border-dreams-border/80 bg-dreams-surface-2/50 px-3 py-2 text-sm tabular-nums text-dreams-text"
                title="Viene del campo «Jugadores máximos» del formulario de crear torneo"
              >
                <span className="text-dreams-text-muted text-xs font-medium">Nº máx.</span>
                <span className="font-semibold text-white tabular-nums">
                  {capacidadMaxInscripciones ?? '—'}
                </span>
                {capacidadMaxInscripciones == null && (
                  <span className="text-[10px] text-dreams-text-muted font-normal">
                    (defínela en el formulario)
                  </span>
                )}
              </div>
              {tablaTruncada && (
                <p className="text-[10px] text-amber-400/90 mt-1 max-w-md leading-snug">
                  La tabla muestra hasta {LIMITE_FILAS_TABLA} filas por rendimiento. Capacidad del torneo:{' '}
                  {capacidadMaxInscripciones}.
                </p>
              )}
              </div>
              <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[10px] font-bold tracking-widest text-dreams-gold uppercase">
                Puntos participar (todos)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={puntosParticipacion}
                onChange={(e) => {
                  const v = e.target.value.replace(',', '.');
                  if (v === '' || /^\d{0,6}\.?\d{0,2}$/.test(v)) {
                    setPuntosParticipacion(v);
                    if (plantillaSeleccionada) setPlantillaModificada(true);
                  }
                }}
                className="bg-dreams-surface-2 border border-dreams-border rounded-lg px-3 py-2 text-sm text-dreams-text outline-none focus:border-dreams-gold/60 tabular-nums"
              />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              <div className="flex items-center rounded-lg border border-dashed border-dreams-border overflow-hidden">
                <button
                  type="button"
                  onClick={agregarFila}
                  disabled={noPuedeAnadirFila}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-dreams-text-muted hover:text-dreams-gold hover:bg-dreams-gold/5 transition-all text-sm font-medium border-r border-dashed border-dreams-border disabled:opacity-35 disabled:pointer-events-none"
                >
                  <FiPlus size={14} /> Fila
                </button>
                {filas.length > 0 && (
                  <button
                    type="button"
                    onClick={eliminarUltimaFila}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 text-dreams-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-medium"
                  >
                    <FiMinus size={14} /> Fila
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="flex-1 overflow-auto min-h-0 px-3 sm:px-7 py-4">
            {mostrarCargando ? (
              <div className="flex items-center justify-center py-20 text-dreams-text-muted text-sm">
                Cargando plantilla…
              </div>
            ) : (
              <div
                className="rounded-xl border border-dreams-border/90 bg-gradient-to-b from-dreams-surface via-dreams-surface to-dreams-surface-2/25
                  shadow-[0_12px_40px_-16px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(212,175,55,0.12)] overflow-hidden ring-1 ring-black/30"
              >
                <div className="overflow-x-auto">
                  <table
                    className="border-collapse w-full"
                    style={{ tableLayout: 'fixed', minWidth: '640px' }}
                  >
                    <thead>
                      <tr className="bg-gradient-to-b from-dreams-surface-2 to-dreams-surface border-b-2 border-dreams-gold/30">
                        <th
                          className="py-3 pr-2 pl-3 text-left text-[10px] font-bold tracking-widest text-dreams-gold/90 uppercase"
                          style={{ position: 'sticky', left: 0, zIndex: 11, background: 'linear-gradient(180deg, #222 0%, #1a1a1a 100%)', width: '76px' }}
                        >
                          Lugar
                        </th>
                        <th className="py-3 px-2 text-center text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase w-[100px] border-l border-dreams-border/40">
                          Pts. part.
                        </th>
                        <th className="py-3 px-2 text-center text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase w-[100px] border-l border-dreams-border/40">
                          Pts. puesto
                        </th>
                        <th className="py-3 px-2 text-center text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase w-[88px] border-l border-dreams-border/40">
                          % extra
                        </th>
                        <th className="py-3 px-2 text-center text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase w-[100px] border-l border-dreams-border/40">
                          Pts. extra
                        </th>
                        <th className="py-3 px-3 text-center text-[10px] font-bold tracking-widest text-dreams-gold/80 uppercase w-[104px] border-l border-dreams-gold/20 bg-dreams-gold/[0.06]">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-14 px-4 text-center text-sm text-dreams-text-muted border-t border-dreams-border/35"
                          >
                            No hay filas aún. Usa <span className="text-dreams-gold/90 font-medium">+ Fila</span> para
                            agregar puestos o carga una plantilla guardada.
                          </td>
                        </tr>
                      )}
                      {filasConCalculos.map((fila, idx) => {
                        const esHover = filaHover === fila.id;
                        const bgSticky = esHover ? BG_HOVER : idx % 2 === 0 ? BG_PAR : BG_IMPAR;
                        const partVal = parseNum(puntosParticipacion);
                        const partDisp = Number.isFinite(partVal) ? formatCL(partVal) : '—';
                        const filaBg = esHover
                          ? BG_HOVER
                          : idx % 2 === 0
                            ? 'rgba(26,26,26,0.55)'
                            : 'rgba(31,31,31,0.65)';
                        return (
                          <tr
                            key={fila.id}
                            onMouseEnter={() => setFilaHover(fila.id)}
                            onMouseLeave={() => setFilaHover(null)}
                            className="border-t border-dreams-border/35 transition-colors duration-150"
                            style={{ background: filaBg }}
                          >
                            <td
                              className="py-2 pr-2 pl-3"
                              style={{ position: 'sticky', left: 0, zIndex: 10, background: bgSticky, width: '76px' }}
                            >
                              <div className="flex items-center gap-1">
                                <span
                                  className={`
                                    inline-flex min-w-[1.75rem] justify-end rounded-md px-1 py-0.5 text-xs font-bold tabular-nums
                                    ${idx === 0 ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/35' : ''}
                                    ${idx === 1 ? 'bg-slate-400/15 text-slate-200 ring-1 ring-slate-400/30' : ''}
                                    ${idx === 2 ? 'bg-amber-800/25 text-amber-100/90 ring-1 ring-amber-700/25' : ''}
                                    ${idx > 2 ? 'text-dreams-text-muted' : ''}
                                  `}
                                >
                                  {fila.posicion}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => eliminarFila(fila.id)}
                                  className={`
                                    ml-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-transparent
                                    text-dreams-text-muted transition-all duration-200
                                    hover:border-red-500/35 hover:bg-red-500/15 hover:text-red-300 hover:scale-105 active:scale-95
                                    ${esHover ? 'opacity-100' : 'opacity-0'}
                                  `}
                                  title="Eliminar fila"
                                >
                                  <FiX size={12} />
                                </button>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-xs tabular-nums text-dreams-text-muted/90 border-l border-dreams-border/25">
                              {partDisp}
                            </td>
                            <td className="px-2 py-1.5 border-l border-dreams-border/25">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={fila.puntos_puesto}
                                onChange={(e) => actualizarFila(fila.id, 'puntos_puesto', e.target.value)}
                                className="w-full text-center text-xs rounded-lg px-2 py-2 outline-none transition-all tabular-nums
                                  bg-black/25 border border-dreams-border/60 text-dreams-text shadow-inner shadow-black/20
                                  focus:border-dreams-gold/50 focus:ring-1 focus:ring-dreams-gold/25"
                              />
                            </td>
                            <td className="px-2 py-1.5 border-l border-dreams-border/25">
                              <div className="relative">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={fila.porcentaje_extra}
                                  onChange={(e) => actualizarFila(fila.id, 'porcentaje_extra', e.target.value)}
                                  className="w-full text-center text-xs rounded-lg px-2 py-2 pr-5 outline-none transition-all tabular-nums
                                    bg-black/25 border border-dreams-border/60 text-dreams-text shadow-inner shadow-black/20
                                    focus:border-dreams-gold/50 focus:ring-1 focus:ring-dreams-gold/25"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-medium text-dreams-text-muted/80 pointer-events-none">%</span>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-xs tabular-nums text-dreams-gold/95 border-l border-dreams-border/25">
                              {Number.isFinite(fila.extra) ? formatCL(fila.extra) : '—'}
                            </td>
                            <td className="px-2 py-2 text-center text-xs font-bold tabular-nums text-dreams-text border-l border-dreams-gold/15 bg-dreams-gold/[0.04]">
                              {Number.isFinite(fila.total) ? formatCL(fila.total) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 px-5 sm:px-7 py-4 border-t border-dreams-border flex-shrink-0">
            <div
              className="rounded-lg border border-dreams-border/70 bg-dreams-surface-2/40 px-3 py-2.5 text-[11px] leading-relaxed text-dreams-text-muted
                shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
            >
              <span className="font-semibold text-dreams-text/90">Cálculo: </span>
              puntos extra = (% extra × puntos puesto) ÷ 100 · total = puntos participar + puntos puesto + puntos extra.
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-dreams-text-muted">
                  {filas.length} puestos · bonus sobre los primeros {filas.length} lugares
                </p>
                {erroresValidacion.length > 0 && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                    <FiAlertCircle size={11} />
                    {erroresValidacion[0]}
                  </p>
                )}
                {mutacionCrearPlantilla.isError && (
                  <p className="text-[11px] text-red-400">
                    {mutacionCrearPlantilla.error?.response?.data?.mensaje ?? 'Error al guardar.'}
                  </p>
                )}
              </div>
              <div className="flex gap-3 flex-wrap justify-end">
                <button type="button" onClick={onCerrar}
                  className="px-5 py-2.5 rounded-xl border border-dreams-border text-sm text-dreams-text-muted hover:text-dreams-text hover:border-dreams-gold/40 transition-all">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarTabla}
                  disabled={!puedeGuardar || mutacionCrearPlantilla.isPending}
                  className="px-6 py-2.5 rounded-xl bg-dreams-gold text-dreams-dark text-sm font-bold hover:bg-dreams-gold-light active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Guardar tabla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalNombreAbierto && (
        <ModalNombrePlantilla
          titulo={modalNombreModo === 'torneo' ? 'Nombre de la plantilla' : 'Guardar como plantilla'}
          subtitulo={
            modalNombreModo === 'torneo'
              ? 'Se creará la plantilla en el servidor y se vinculará a este torneo.'
              : 'La plantilla quedará disponible en el menú desplegable.'
          }
          onConfirmar={confirmarNombreModal}
          onCancelar={() => setModalNombreAbierto(false)}
        />
      )}
    </>
  );
}
