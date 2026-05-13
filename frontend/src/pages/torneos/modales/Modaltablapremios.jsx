import { useState, useMemo } from 'react';
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

const plantillaAEstado = (plantilla) => {
  const { reglas } = plantilla;
  const rangoMap = new Map();
  for (const r of reglas) {
    const key = `${r.rango_min_jugadores}-${r.rango_max_jugadores}`;
    if (!rangoMap.has(key)) {
      rangoMap.set(key, {
        id: nuevoId('col'),
        label: key,
        min: r.rango_min_jugadores,
        max: r.rango_max_jugadores,
      });
    }
  }
  const columnas = Array.from(rangoMap.values()).sort((a, b) => a.min - b.min);
  const puestosUnicos = [...new Set(reglas.map((r) => r.posicion))].sort((a, b) => a - b);
  const filas = puestosUnicos.map((puesto) => {
    const celdas = {};
    for (const col of columnas) {
      const regla = reglas.find(
        (r) =>
          r.posicion === puesto &&
          r.rango_min_jugadores === col.min &&
          r.rango_max_jugadores === col.max
      );
      celdas[col.id] = regla ? String(Number(regla.porcentaje)) : '';
    }
    return { id: nuevoId('fila'), puesto, celdas };
  });
  return { columnas, filas };
};

const estadoAReglas = (columnas, filas) => {
  const reglas = [];
  for (const fila of filas) {
    for (const col of columnas) {
      const val = fila.celdas[col.id];
      if (val !== '' && val !== undefined) {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
          reglas.push({
            posicion: fila.puesto,
            rango_min_jugadores: col.min,
            rango_max_jugadores: col.max,
            porcentaje: num,
          });
        }
      }
    }
  }
  return reglas;
};

const COLUMNAS_PREDETERMINADAS = [
  { id: 'col-d1', label: '6-10',    min: 6,   max: 10  },
  { id: 'col-d2', label: '11-20',   min: 11,  max: 20  },
  { id: 'col-d3', label: '21-30',   min: 21,  max: 30  },
  { id: 'col-d4', label: '31-45',   min: 31,  max: 45  },
  { id: 'col-d5', label: '46-60',   min: 46,  max: 60  },
  { id: 'col-d6', label: '61-85',   min: 61,  max: 85  },
  { id: 'col-d7', label: '86-115',  min: 86,  max: 115 },
  { id: 'col-d8', label: '116-145', min: 116, max: 145 },
  { id: 'col-d9', label: '146-175', min: 146, max: 175 },
];

const crearColumna = (minSugerido) => ({
  id: nuevoId('col'),
  label: `${minSugerido}-${minSugerido + 24}`,
  min: minSugerido,
  max: minSugerido + 24,
});

const crearFila = (puesto, columnas) => ({
  id: nuevoId('fila'),
  puesto,
  celdas: Object.fromEntries(columnas.map((c) => [c.id, ''])),
});

const construirEstadoInicial = (premiosIniciales) => {
  if (premiosIniciales?.columnas && premiosIniciales?.filas) {
    return { columnas: premiosIniciales.columnas, filas: premiosIniciales.filas };
  }
  const columnas = COLUMNAS_PREDETERMINADAS;
  const filas = Array.from({ length: 9 }, (_, i) => crearFila(i + 1, columnas));
  return { columnas, filas };
};

// Color de fondo de la columna sticky según índice de fila (para que coincida con rayas alternas)
const BG_PAR   = '#1a1a1a'; // dreams-surface
const BG_IMPAR = '#1f1f1f'; // dreams-surface-2/20 aprox
const BG_HOVER = 'rgba(212,175,55,0.05)'; // dreams-gold/5

// ------------------------------------------------------------
// Sub-modal nombrar plantilla
// ------------------------------------------------------------
const ModalNombrePlantilla = ({ onConfirmar, onCancelar }) => {
  const [nombre, setNombre] = useState('');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-dreams-surface border border-dreams-border rounded-2xl p-6 w-[340px] shadow-2xl flex flex-col gap-4">
        <div>
          <p className="text-base font-bold text-dreams-text">Nueva plantilla</p>
          <p className="text-xs text-dreams-text-muted mt-0.5">Asigna un nombre para identificarla</p>
        </div>
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && nombre.trim() && onConfirmar(nombre.trim())}
          placeholder="Ej: Tabla mensual Dreams"
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
// premiosIniciales puede ser:
//   null                          → tabla nueva sin datos
//   { id_esquema, columnas, filas } → reabriendo el modal con datos ya guardados
// onGuardar recibe: (id_esquema: number) — el ID del EsquemaPremio en la DB
// ------------------------------------------------------------
export default function ModalTablaPremios({ premiosIniciales, onGuardar, onCerrar }) {
  const queryClient = useQueryClient();
  const [{ columnas, filas }, setEstado] = useState(() => construirEstadoInicial(premiosIniciales));
  // Si venimos de un guardado previo, pre-seleccionar la plantilla
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(
    premiosIniciales?.id_esquema ?? null
  );
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [modalNombreAbierto, setModalNombreAbierto] = useState(false);
  // Para manejar el hover de la fila y que el sticky cambie de color correctamente
  const [filaHover, setFilaHover] = useState(null);

  const { data: plantillas = [], isLoading: cargandoPlantillas } = useQuery({
    queryKey: ['plantillas-premios'],
    queryFn: async () => {
      const res = await api.get('/plantillas-premios');
      return res.data.datos;
    },
  });

  const mutacionCrearPlantilla = useMutation({
    mutationFn: ({ nombre, reglas }) => api.post('/plantillas-premios', { nombre, reglas }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-premios'] });
      const idEsquema = res.data.datos.id_esquema;
      setPlantillaSeleccionada(idEsquema);
      setModalNombreAbierto(false);
      onGuardar(idEsquema);
    },
  });

  const mutacionEliminarPlantilla = useMutation({
    mutationFn: (id) => api.delete(`/plantillas-premios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-premios'] });
      setPlantillaSeleccionada(null);
    },
  });

  // ----------------------------------------------------------
  // Cálculos
  // ----------------------------------------------------------
  const sumasPorColumna = useMemo(() => {
    const sumas = {};
    for (const col of columnas) {
      let total = 0;
      for (const fila of filas) {
        const val = parseFloat(fila.celdas[col.id] || '0');
        if (!isNaN(val)) total += val;
      }
      sumas[col.id] = Math.round(total * 100) / 100;
    }
    return sumas;
  }, [columnas, filas]);

  const columnasActivas = useMemo(
    () => columnas.filter((c) => filas.some((f) => f.celdas[c.id] !== '')),
    [columnas, filas]
  );

  const columnasConError = useMemo(
    () => columnasActivas.filter((c) => sumasPorColumna[c.id] !== 100),
    [columnasActivas, sumasPorColumna]
  );

  const puedeGuardar = columnasConError.length === 0 && columnasActivas.length > 0;

  // ----------------------------------------------------------
  // Plantillas
  // ----------------------------------------------------------
  const cargarPlantilla = (plantilla) => {
    setEstado(plantillaAEstado(plantilla));
    setPlantillaSeleccionada(plantilla.id_esquema);
    setDropdownAbierto(false);
  };

  const confirmarGuardarPlantilla = (nombre) => {
    mutacionCrearPlantilla.mutate({ nombre, reglas: estadoAReglas(columnas, filas) });
    // onGuardar se llama en onSuccess de mutacionCrearPlantilla
  };

  // ----------------------------------------------------------
  // Celdas
  // ----------------------------------------------------------
  const handleCeldaCambio = (filaId, colId, valor) => {
    if (valor !== '' && !/^\d{0,3}([.,]\d{0,2})?$/.test(valor)) return;
    setEstado((prev) => ({
      ...prev,
      filas: prev.filas.map((f) =>
        f.id === filaId ? { ...f, celdas: { ...f.celdas, [colId]: valor.replace(',', '.') } } : f
      ),
    }));
  };

  // ----------------------------------------------------------
  // Filas
  // ----------------------------------------------------------
  const agregarFila = () =>
    setEstado((prev) => ({
      ...prev,
      filas: [...prev.filas, crearFila(prev.filas.length + 1, prev.columnas)],
    }));

  const eliminarUltimaFila = () =>
    setEstado((prev) => {
      if (prev.filas.length <= 1) return prev;
      return { ...prev, filas: prev.filas.slice(0, -1) };
    });

  const eliminarFila = (filaId) =>
    setEstado((prev) => {
      if (prev.filas.length <= 1) return prev;
      return {
        ...prev,
        filas: prev.filas
          .filter((f) => f.id !== filaId)
          .map((f, i) => ({ ...f, puesto: i + 1 })),
      };
    });

  // ----------------------------------------------------------
  // Columnas
  // ----------------------------------------------------------
  const agregarColumna = () =>
    setEstado((prev) => {
      const ultima = prev.columnas[prev.columnas.length - 1];
      const nuevaCol = crearColumna(ultima ? ultima.max + 1 : 1);
      return {
        columnas: [...prev.columnas, nuevaCol],
        filas: prev.filas.map((f) => ({ ...f, celdas: { ...f.celdas, [nuevaCol.id]: '' } })),
      };
    });

  const eliminarUltimaColumna = () =>
    setEstado((prev) => {
      if (prev.columnas.length <= 1) return prev;
      const ultima = prev.columnas[prev.columnas.length - 1];
      return {
        columnas: prev.columnas.slice(0, -1),
        filas: prev.filas.map((f) => {
          const { [ultima.id]: _, ...resto } = f.celdas;
          return { ...f, celdas: resto };
        }),
      };
    });

  const eliminarColumna = (colId) =>
    setEstado((prev) => {
      if (prev.columnas.length <= 1) return prev;
      return {
        columnas: prev.columnas.filter((c) => c.id !== colId),
        filas: prev.filas.map((f) => {
          const { [colId]: _, ...resto } = f.celdas;
          return { ...f, celdas: resto };
        }),
      };
    });

  const handleLabelColumna = (colId, valor) =>
    setEstado((prev) => ({
      ...prev,
      columnas: prev.columnas.map((c) => (c.id === colId ? { ...c, label: valor } : c)),
    }));

  // Guardar tabla para el torneo:
  // - Si hay una plantilla seleccionada y cargada → reutilizar ese ID sin crear otra
  // - Si no hay plantilla → pedir nombre y crear una nueva en la DB
  const handleGuardar = () => {
    if (!puedeGuardar) return;
    if (plantillaSeleccionada) {
      onGuardar(plantillaSeleccionada);
    } else {
      setModalNombreAbierto(true);
    }
  };

  const plantillaActual = plantillas.find((p) => p.id_esquema === plantillaSeleccionada);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div
          className="bg-dreams-surface border border-dreams-border rounded-2xl flex flex-col shadow-2xl"
          style={{ width: 'min(96vw, 1200px)', maxHeight: '92vh' }}
        >

          {/* ================================================
              HEADER
          ================================================ */}
          <div className="px-7 pt-6 pb-5 border-b border-dreams-border flex-shrink-0">

            {/* Fila 1: título + controles plantilla + cerrar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 flex items-center gap-3 min-w-0 flex-wrap">
                <h2 className="text-2xl font-bold text-dreams-gold tracking-wide whitespace-nowrap">
                  Tabla de Premios
                </h2>

                <div className="w-px h-6 bg-dreams-border flex-shrink-0" />

                {/* Selector plantilla */}
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
                          <div className="py-1">
                            {plantillas.map((p) => (
                              <button
                                key={p.id_esquema}
                                type="button"
                                onClick={() => cargarPlantilla(p)}
                                className={`
                                  w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2
                                  ${p.id_esquema === plantillaSeleccionada
                                    ? 'bg-dreams-gold/10 text-dreams-gold font-semibold'
                                    : 'text-dreams-text hover:bg-dreams-surface-2'
                                  }
                                `}
                              >
                                {p.id_esquema === plantillaSeleccionada
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

                {/* Guardar como plantilla */}
                <button
                  type="button"
                  onClick={() => puedeGuardar && setModalNombreAbierto(true)}
                  disabled={!puedeGuardar || mutacionCrearPlantilla.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 hover:border-emerald-500/70 active:scale-95 transition-all disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <FiSave size={12} />
                  Guardar como plantilla
                </button>

                {/* Eliminar plantilla */}
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

              {/* Cerrar */}
              <button
                type="button"
                onClick={onCerrar}
                className="text-dreams-text-muted hover:text-dreams-text hover:bg-dreams-surface-2 transition-all p-2 rounded-lg flex-shrink-0"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Fila 2: descripción + botones filas/columnas */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-dreams-text-muted">
                Ingresa el porcentaje del premio para cada puesto según el rango de jugadores inscriptos
              </p>

              <div className="flex items-center gap-2 flex-shrink-0 ml-6">
                {/* Filas */}
                <div className="flex items-center rounded-lg border border-dashed border-dreams-border overflow-hidden">
                  <button type="button" onClick={agregarFila}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-dreams-text-muted hover:text-dreams-gold hover:bg-dreams-gold/5 transition-all text-xs border-r border-dashed border-dreams-border">
                    <FiPlus size={11} /> Fila
                  </button>
                  {filas.length > 1 && (
                    <button type="button" onClick={eliminarUltimaFila}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-dreams-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all text-xs">
                      <FiMinus size={11} /> Fila
                    </button>
                  )}
                </div>

                {/* Columnas */}
                <div className="flex items-center rounded-lg border border-dashed border-dreams-border overflow-hidden">
                  <button type="button" onClick={agregarColumna}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-dreams-text-muted hover:text-dreams-gold hover:bg-dreams-gold/5 transition-all text-xs border-r border-dashed border-dreams-border">
                    <FiPlus size={11} /> Columna
                  </button>
                  {columnas.length > 1 && (
                    <button type="button" onClick={eliminarUltimaColumna}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-dreams-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all text-xs">
                      <FiMinus size={11} /> Columna
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================================================
              TABLA
          ================================================ */}
          <div className="flex-1 overflow-auto min-h-0 px-7 py-4">
            <table className="border-collapse" style={{ tableLayout: 'fixed', width: '100%', minWidth: `${56 + columnas.length * 80}px` }}>
              <colgroup>
                {/* Columna posición fija */}
                <col style={{ width: '56px' }} />
                {/* Columnas de datos — ancho fijo y compacto */}
                {columnas.map((col) => (
                  <col key={col.id} style={{ width: '80px' }} />
                ))}
              </colgroup>

              <thead>
                <tr>
                  <th className="pb-3 pr-2 text-left" style={{ position: 'sticky', left: 0, zIndex: 10, background: '#1a1a1a' }}>
                    <span className="text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase">Pos.</span>
                  </th>

                  {columnas.map((col) => {
                    const suma = sumasPorColumna[col.id];
                    const activa = columnasActivas.some((c) => c.id === col.id);
                    const conError = activa && suma !== 100;
                    const ok = activa && suma === 100;
                    return (
                      <th key={col.id} className="pb-3 px-1">
                        <div className="flex flex-col items-center gap-1">
                          <div className="relative group flex items-center justify-center w-full">
                            <input
                              value={col.label}
                              onChange={(e) => handleLabelColumna(col.id, e.target.value)}
                              className={`
                                w-full text-center text-xs font-bold tracking-wide bg-transparent
                                border-b-2 outline-none transition-all pb-0.5
                                ${conError
                                  ? 'text-red-400 border-red-500/60'
                                  : ok
                                    ? 'text-emerald-400 border-emerald-500/40'
                                    : 'text-dreams-gold border-dreams-gold/20 focus:border-dreams-gold/60'
                                }
                              `}
                            />
                            {columnas.length > 1 && (
                              <button
                                type="button"
                                onClick={() => eliminarColumna(col.id)}
                                className="opacity-0 group-hover:opacity-100 absolute -right-1 -top-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-all"
                              >
                                <FiX size={8} />
                              </button>
                            )}
                          </div>
                          <div className={`
                            h-4 flex items-center justify-center px-1.5 rounded-full text-[9px] font-bold tabular-nums transition-all
                            ${conError ? 'bg-red-500/15 text-red-400' : ok ? 'bg-emerald-500/15 text-emerald-400' : 'opacity-0 pointer-events-none'}
                          `}>
                            {activa ? `${suma}%` : '0%'}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filas.map((fila, idx) => {
                  const esHover = filaHover === fila.id;
                  const bgBase = idx % 2 === 0 ? BG_PAR : BG_IMPAR;
                  const bgSticky = esHover ? BG_HOVER : bgBase;
                  return (
                    <tr
                      key={fila.id}
                      onMouseEnter={() => setFilaHover(fila.id)}
                      onMouseLeave={() => setFilaHover(null)}
                      style={{ background: esHover ? BG_HOVER : (idx % 2 !== 0 ? BG_IMPAR : 'transparent') }}
                      className="transition-colors"
                    >
                      {/* Celda sticky posición — fondo sólido siempre */}
                      <td
                        className="py-1 pr-2"
                        style={{ position: 'sticky', left: 0, zIndex: 10, background: bgSticky }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold tabular-nums w-5 text-right flex-shrink-0 ${idx < 3 ? 'text-dreams-gold' : 'text-dreams-text-muted'}`}>
                            {fila.puesto}°
                          </span>
                          {filas.length > 1 && (
                            <button
                              type="button"
                              onClick={() => eliminarFila(fila.id)}
                              className={`w-4 h-4 flex items-center justify-center rounded text-dreams-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0 ${esHover ? 'opacity-100' : 'opacity-0'}`}
                            >
                              <FiX size={10} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Celdas de datos */}
                      {columnas.map((col) => {
                        const valor = fila.celdas[col.id] ?? '';
                        const activa = columnasActivas.some((c) => c.id === col.id);
                        const conError = activa && sumasPorColumna[col.id] !== 100;
                        const tieneValor = valor !== '';
                        return (
                          <td key={col.id} className="px-1 py-1">
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={valor}
                                onChange={(e) => handleCeldaCambio(fila.id, col.id, e.target.value)}
                                placeholder="—"
                                className={`
                                  w-full text-center text-xs rounded
                                  px-1 py-1.5 outline-none transition-all tabular-nums
                                  placeholder:text-dreams-border/40
                                  [appearance:textfield]
                                  [&::-webkit-outer-spin-button]:appearance-none
                                  [&::-webkit-inner-spin-button]:appearance-none
                                  ${tieneValor && conError
                                    ? 'bg-red-500/10 border border-red-500/40 text-red-300 focus:border-red-500/70'
                                    : tieneValor
                                      ? 'bg-dreams-surface border border-dreams-gold/30 text-dreams-gold focus:border-dreams-gold/60'
                                      : 'bg-dreams-surface-2 border border-dreams-border/50 text-dreams-text-muted focus:border-dreams-gold/30'
                                  }
                                `}
                              />
                              {tieneValor && (
                                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-dreams-text-muted/60 pointer-events-none select-none">
                                  %
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Separador visual */}
                <tr><td colSpan={columnas.length + 1} className="pt-1" /></tr>

                {/* Fila totales */}
                <tr className="border-t-2 border-dreams-border/60">
                  <td className="py-2 pr-2" style={{ position: 'sticky', left: 0, zIndex: 10, background: '#1a1a1a' }}>
                    <span className="text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase">Total</span>
                  </td>
                  {columnas.map((col) => {
                    const suma = sumasPorColumna[col.id];
                    const activa = columnasActivas.some((c) => c.id === col.id);
                    const ok = activa && suma === 100;
                    const conError = activa && suma !== 100;
                    return (
                      <td key={col.id} className="px-1 py-2 text-center">
                        {activa ? (
                          <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                            {suma}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-dreams-border">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* ================================================
              FOOTER
          ================================================ */}
          <div className="flex items-center justify-between px-7 py-4 border-t border-dreams-border flex-shrink-0">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-dreams-text-muted">
                {filas.length} puestos · {columnas.length} rangos de jugadores
                {columnasActivas.length > 0 && (
                  <span className="ml-2 text-dreams-text-muted/60">· {columnasActivas.length} con datos</span>
                )}
              </p>
              {columnasConError.length > 0 && (
                <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                  <FiAlertCircle size={11} />
                  No suman 100%: <span className="font-semibold ml-1">{columnasConError.map((c) => c.label).join(', ')}</span>
                </p>
              )}
              {mutacionCrearPlantilla.isError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                  <FiAlertCircle size={11} />
                  {mutacionCrearPlantilla.error?.response?.data?.mensaje ?? 'Error al guardar la tabla.'}
                </p>
              )}
              {!plantillaSeleccionada && puedeGuardar && (
                <p className="text-[10px] text-dreams-text-muted/60 italic">
                  Se te pedirá un nombre para guardar esta tabla en la base de datos.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onCerrar}
                className="px-5 py-2.5 rounded-xl border border-dreams-border text-sm text-dreams-text-muted hover:text-dreams-text hover:border-dreams-gold/40 transition-all">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={!puedeGuardar || mutacionCrearPlantilla.isPending}
                className="px-6 py-2.5 rounded-xl bg-dreams-gold text-dreams-dark text-sm font-bold hover:bg-dreams-gold-light active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mutacionCrearPlantilla.isPending ? 'Guardando...' : 'Guardar Tabla'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {modalNombreAbierto && (
        <ModalNombrePlantilla
          onConfirmar={confirmarGuardarPlantilla}
          onCancelar={() => setModalNombreAbierto(false)}
        />
      )}
    </>
  );
}