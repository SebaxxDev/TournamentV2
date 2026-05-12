import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiX, FiTrash2, FiPlus, FiAlertCircle, FiLock, FiArrowRight,
  FiSave, FiBookmark, FiChevronDown,
} from 'react-icons/fi';
import api from '../../../services/api.js';

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const formatearNumero = (n) => Number(n || 0).toLocaleString('es-CL');

const COLORES_FICHA = {
  rojo: '#ef4444', azul: '#3b82f6', verde: '#22c55e', negro: '#374151',
  blanco: '#f9fafb', amarillo: '#eab308', naranja: '#f97316', morado: '#a855f7',
  rosado: '#ec4899', cafe: '#92400e', gris: '#6b7280', turquesa: '#06b6d4',
};

const urlImagen = (imgPath) => {
  if (!imgPath) return null;
  const path = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
  return `http://localhost:3000/${path}`;
};

const colorHex = (nombre) => {
  if (!nombre) return '#6b7280';
  return COLORES_FICHA[nombre.toLowerCase().trim()] ?? '#6b7280';
};

// ID helper
let contadorFilaId = 1;
const nuevaFilaId = () => `fila-${contadorFilaId++}`;
const crearFila = () => ({
  id: nuevaFilaId(), id_ficha_catalogo: null,
  valor: '', cantidad_por_jugador: '', cantidad_total: '',
});

// Convierte fichas guardadas a filas del modal
const fichasAFilas = (fichas) => {
  if (!fichas || fichas.length === 0) return [crearFila()];
  return fichas.map((f) => ({
    id: nuevaFilaId(),
    id_ficha_catalogo: f.id_ficha_catalogo,
    valor: String(f.valor),
    cantidad_por_jugador: String(f.cantidad_por_jugador),
    cantidad_total: String(f.cantidad_total || ''),
  }));
};

// Convierte una plantilla del backend a filas del modal
const plantillaAFilas = (plantilla) => {
  if (!plantilla?.detalles || plantilla.detalles.length === 0) return [crearFila()];
  return plantilla.detalles.map((d) => ({
    id: nuevaFilaId(),
    id_ficha_catalogo: d.id_ficha_catalogo,
    valor: String(d.valor),
    cantidad_por_jugador: String(d.cantidad_por_jugador),
    cantidad_total: '',
  }));
};

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
          placeholder="Ej: Stack Dreams 50K"
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
// Fila de ficha en pestaña Stack
// ------------------------------------------------------------
const FilaFicha = ({ fila, fichasCatalogo, fichasUsadas, capacidadMaxima, onCambiar, onEliminar }) => {
  const fichaSeleccionada = fichasCatalogo.find((f) => f.id_ficha === fila.id_ficha_catalogo);
  const valorXJugador  = (Number(fila.valor) || 0) * (Number(fila.cantidad_por_jugador) || 0);
  const fichasTotales  = (Number(fila.cantidad_por_jugador) || 0) * (Number(capacidadMaxima) || 0);
  const valorTotalFich = valorXJugador * (Number(capacidadMaxima) || 0);

  const inputClase = `
    w-full bg-dreams-surface border border-dreams-border rounded px-2 py-1.5 text-sm text-dreams-text
    outline-none focus:border-dreams-gold/60 transition-all text-center
    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
  `;

  return (
    <tr className="border-b border-dreams-border/40 hover:bg-dreams-surface-2/40 transition-colors group">
      <td className="px-3 py-2 w-44">
        <select
          value={fila.id_ficha_catalogo ?? ''}
          onChange={(e) => onCambiar(fila.id, 'id_ficha_catalogo', Number(e.target.value) || null)}
          className="w-full bg-dreams-surface border border-dreams-border rounded px-2 py-1.5 text-sm text-dreams-text outline-none focus:border-dreams-gold/60 transition-all appearance-none cursor-pointer"
        >
          <option value="">Seleccionar...</option>
          {fichasCatalogo.map((f) => {
            const yaUsada = fichasUsadas.has(f.id_ficha) && f.id_ficha !== fila.id_ficha_catalogo;
            return (
              <option key={f.id_ficha} value={f.id_ficha} disabled={yaUsada}>
                {f.nombre}{yaUsada ? ' (ya agregada)' : ''}
              </option>
            );
          })}
        </select>
      </td>
      <td className="px-3 py-2 w-16 text-center">
        {fichaSeleccionada?.img_path ? (
          <img src={urlImagen(fichaSeleccionada.img_path)} alt={fichaSeleccionada.nombre}
            className="w-9 h-9 object-contain mx-auto" />
        ) : (
          <div className="w-9 h-9 rounded-full mx-auto border-2 border-dreams-border"
            style={{ backgroundColor: fichaSeleccionada ? colorHex(fichaSeleccionada.color) : '#1a1a1a' }} />
        )}
      </td>
      <td className="px-3 py-2 w-36">
        <div className="flex items-center gap-1.5">
          {fichaSeleccionada && (
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: colorHex(fichaSeleccionada.color) }} />
          )}
          <span className="text-sm text-dreams-text truncate">
            {fichaSeleccionada?.nombre ?? <span className="text-dreams-text-muted/30 italic text-xs">—</span>}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 w-28">
        <input type="number" className={inputClase} placeholder="0"
          value={fila.valor} onChange={(e) => onCambiar(fila.id, 'valor', e.target.value)} />
      </td>
      <td className="px-3 py-2 w-28">
        <input type="number" className={inputClase} placeholder="0"
          value={fila.cantidad_por_jugador}
          onChange={(e) => onCambiar(fila.id, 'cantidad_por_jugador', e.target.value)} />
      </td>
      <td className="px-3 py-2 w-32 text-center">
        <span className="text-sm text-dreams-text font-medium">{formatearNumero(valorXJugador)}</span>
      </td>
      <td className="px-3 py-2 w-28 text-center">
        <span className="text-sm text-dreams-text-muted">
          {capacidadMaxima ? formatearNumero(fichasTotales) : <span className="text-xs opacity-40">sin cap.</span>}
        </span>
      </td>
      <td className="px-3 py-2 w-36 text-center">
        <span className="text-sm text-dreams-gold font-medium">
          {capacidadMaxima ? formatearNumero(valorTotalFich) : <span className="text-xs opacity-40">—</span>}
        </span>
      </td>
      <td className="px-3 py-2 w-10 text-center">
        <button type="button" onClick={() => onEliminar(fila.id)}
          className="text-dreams-text-muted/30 hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover:opacity-100">
          <FiTrash2 size={14} />
        </button>
      </td>
    </tr>
  );
};

// ------------------------------------------------------------
// Pestaña 2 — Fichas Totales
// ------------------------------------------------------------
const PestanaFichasTotales = ({ filas, fichasCatalogo, capacidadMaxima, onCambiarTotal }) => {
  const fichasConDatos = filas.filter((f) => f.id_ficha_catalogo && f.valor && f.cantidad_por_jugador);

  if (fichasConDatos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-dreams-text-muted gap-2">
        <FiAlertCircle size={24} className="opacity-40" />
        <p className="text-sm">Define primero las fichas en la pestaña Stack Inicial.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-dreams-surface z-10">
          <tr className="border-b border-dreams-border">
            <th className="px-4 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-left w-16">Imagen</th>
            <th className="px-4 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-left">Ficha</th>
            <th className="px-4 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-28">Valor Unit</th>
            <th className="px-4 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-40">Min. Recomendado</th>
            <th className="px-4 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-36">Cantidad a usar</th>
            <th className="px-4 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-36">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          {fichasConDatos.map((fila) => {
            const fichaInfo = fichasCatalogo.find((f) => f.id_ficha === fila.id_ficha_catalogo);
            const minRecomendado = (Number(fila.cantidad_por_jugador) || 0) * (Number(capacidadMaxima) || 0);
            const cantidadUsada = Number(fila.cantidad_total) || 0;
            const cantidadFinal = cantidadUsada || minRecomendado;
            const valorTotal = cantidadFinal * (Number(fila.valor) || 0);
            const bajominimo = capacidadMaxima && cantidadUsada > 0 && cantidadUsada < minRecomendado;

            return (
              <tr key={fila.id} className="border-b border-dreams-border/40 hover:bg-dreams-surface-2/40 transition-colors">
                <td className="px-4 py-2.5 text-center">
                  {fichaInfo?.img_path ? (
                    <img src={urlImagen(fichaInfo.img_path)} alt={fichaInfo.nombre}
                      className="w-9 h-9 object-contain mx-auto" />
                  ) : (
                    <div className="w-9 h-9 rounded-full mx-auto border-2 border-dreams-border"
                      style={{ backgroundColor: fichaInfo ? colorHex(fichaInfo.color) : '#1a1a1a' }} />
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: fichaInfo ? colorHex(fichaInfo.color) : '#374151' }} />
                    <span className="text-sm text-dreams-text">{fichaInfo?.nombre ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="text-sm text-dreams-text-muted">{formatearNumero(fila.valor)}</span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="text-sm text-amber-400/80 font-medium">
                    {capacidadMaxima ? formatearNumero(minRecomendado) : <span className="text-xs opacity-40">sin cap.</span>}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="relative">
                    <input
                      type="number"
                      value={fila.cantidad_total || ''}
                      placeholder={String(minRecomendado || 0)}
                      onChange={(e) => onCambiarTotal(fila.id, e.target.value)}
                      className={`
                        w-full border rounded px-2 py-1.5 text-sm outline-none transition-all text-center
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        ${bajominimo
                          ? 'border-red-500/60 bg-red-950/20 text-red-300 focus:border-red-500'
                          : 'bg-dreams-surface border-dreams-border text-dreams-text focus:border-dreams-gold/60'
                        }
                      `}
                    />
                    {bajominimo && (
                      <div className="absolute -top-5 left-0 right-0 text-center">
                        <span className="text-[9px] text-red-400 font-medium">por debajo del mínimo</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`text-sm font-medium ${bajominimo ? 'text-red-400' : 'text-dreams-gold'}`}>
                    {formatearNumero(valorTotal)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ------------------------------------------------------------
// Modal principal
// ------------------------------------------------------------
export default function ModalFichasStack({ capacidadMaxima, fichasIniciales, onGuardar, onCerrar }) {
  const queryClient = useQueryClient();
  const [pestana, setPestana] = useState('stack');
  const [filas, setFilas] = useState(() => fichasAFilas(fichasIniciales));
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [modalNombreAbierto, setModalNombreAbierto] = useState(false);

  const { data: fichasCatalogo = [] } = useQuery({
    queryKey: ['fichas-catalogo'],
    queryFn: async () => {
      const res = await api.get('/fichas');
      return res.data.datos.filter((f) => f.activo);
    },
  });

  const { data: plantillas = [], isLoading: cargandoPlantillas } = useQuery({
    queryKey: ['plantillas-fichas'],
    queryFn: async () => {
      const res = await api.get('/plantillas-fichas');
      return res.data.datos;
    },
  });

  const mutacionCrearPlantilla = useMutation({
    mutationFn: ({ nombre, detalles }) => api.post('/plantillas-fichas', { nombre, detalles }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-fichas'] });
      setPlantillaSeleccionada(res.data.datos.id_plantilla);
    },
  });

  const mutacionEliminarPlantilla = useMutation({
    mutationFn: (id) => api.delete(`/plantillas-fichas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas-fichas'] });
      setPlantillaSeleccionada(null);
    },
  });

  const fichasUsadas = useMemo(
    () => new Set(filas.map((f) => f.id_ficha_catalogo).filter(Boolean)),
    [filas]
  );

  const agregarFila = () => setFilas((prev) => [...prev, crearFila()]);
  const eliminarFila = (id) => setFilas((prev) => prev.filter((f) => f.id !== id));
  const cambiarCampo = (id, campo, valor) =>
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  const cambiarTotal = (id, valor) =>
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, cantidad_total: valor } : f)));

  const resumen = useMemo(() => {
    const validas = filas.filter((f) => f.id_ficha_catalogo && f.valor && f.cantidad_por_jugador);
    const stackInicial = validas.reduce(
      (acc, f) => acc + (Number(f.valor) || 0) * (Number(f.cantidad_por_jugador) || 0), 0
    );
    const fichasPorJugador = validas.reduce((acc, f) => acc + (Number(f.cantidad_por_jugador) || 0), 0);
    const totalFichasFisicas = validas.reduce((acc, f) => {
      const cant = Number(f.cantidad_total) || (Number(f.cantidad_por_jugador) || 0) * (Number(capacidadMaxima) || 0);
      return acc + cant;
    }, 0);
    const valorTotalTorneo = validas.reduce((acc, f) => {
      const cant = Number(f.cantidad_total) || (Number(f.cantidad_por_jugador) || 0) * (Number(capacidadMaxima) || 0);
      return acc + cant * (Number(f.valor) || 0);
    }, 0);
    return { stackInicial, fichasPorJugador, totalFichasFisicas, valorTotalTorneo };
  }, [filas, capacidadMaxima]);

  const stackDefinido = filas.some((f) => f.id_ficha_catalogo && f.valor && f.cantidad_por_jugador);

  // ----------------------------------------------------------
  // Plantillas
  // ----------------------------------------------------------
  const cargarPlantilla = (plantilla) => {
    setFilas(plantillaAFilas(plantilla));
    setPlantillaSeleccionada(plantilla.id_plantilla);
    setDropdownAbierto(false);
  };

  const confirmarGuardarPlantilla = (nombre) => {
    const detalles = filas
      .filter((f) => f.id_ficha_catalogo && f.valor && f.cantidad_por_jugador)
      .map((f) => ({
        id_ficha_catalogo: f.id_ficha_catalogo,
        valor: Number(f.valor),
        cantidad_por_jugador: Number(f.cantidad_por_jugador),
      }));
    mutacionCrearPlantilla.mutate({ nombre, detalles });
    setModalNombreAbierto(false);
  };

  const plantillaActual = plantillas.find((p) => p.id_plantilla === plantillaSeleccionada);

  // ----------------------------------------------------------
  // Acciones principales
  // ----------------------------------------------------------
  const handleConfirmarStack = () => setPestana('totales');

  const handleGuardar = () => {
    const fichasValidas = filas
      .filter((f) => f.id_ficha_catalogo && f.valor && f.cantidad_por_jugador)
      .map((f) => {
        const info = fichasCatalogo.find((c) => c.id_ficha === f.id_ficha_catalogo);
        return {
          id_ficha_catalogo: f.id_ficha_catalogo,
          nombre: info?.nombre ?? '',
          color: info?.color ?? null,
          img_path: info?.img_path ?? null,
          valor: Number(f.valor),
          cantidad_por_jugador: Number(f.cantidad_por_jugador),
          cantidad_total: Number(f.cantidad_total) || (Number(f.cantidad_por_jugador) * (Number(capacidadMaxima) || 0)),
        };
      });
    onGuardar({ fichas: fichasValidas, stack_inicial_valor: resumen.stackInicial });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onCerrar} />

        <div className="relative bg-dreams-surface border border-dreams-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-dreams-border flex-shrink-0">

            {/* Fila 1: título + plantillas + cerrar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 flex items-center gap-3 min-w-0 flex-wrap">
                <h2 className="text-xl font-bold text-dreams-gold tracking-wide whitespace-nowrap">
                  Fichas y Stack
                </h2>

                <div className="w-px h-5 bg-dreams-border flex-shrink-0" />

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
                    style={{ minWidth: '175px' }}
                  >
                    <FiBookmark size={12} className="flex-shrink-0" />
                    <span className="truncate flex-1 text-left text-sm" style={{ maxWidth: '120px' }}>
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

                {/* Guardar como plantilla */}
                <button
                  type="button"
                  onClick={() => stackDefinido && setModalNombreAbierto(true)}
                  disabled={!stackDefinido || mutacionCrearPlantilla.isPending}
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
              <button type="button" onClick={onCerrar}
                className="text-dreams-text-muted hover:text-dreams-text hover:bg-dreams-surface-2 transition-all p-2 rounded-lg flex-shrink-0">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="text-xs text-dreams-text-muted max-w-2xl">
                Ingresa cada Ficha, su valor y la cantidad por jugador para este torneo
              </p>
              <div className="flex justify-center sm:justify-end flex-shrink-0">
                <div className="inline-flex bg-dreams-surface-2 border border-dreams-border rounded-lg p-0.5 gap-0.5 shadow-sm">
                  {[
                    { key: 'stack',   label: 'Stack Inicial',  bloqueado: false },
                    { key: 'totales', label: 'Fichas Totales', bloqueado: !stackDefinido },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => !tab.bloqueado && setPestana(tab.key)}
                      title={tab.bloqueado ? 'Define primero el stack inicial' : ''}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150
                        ${tab.bloqueado ? 'opacity-35 cursor-not-allowed text-dreams-text-muted' : ''}
                        ${pestana === tab.key && !tab.bloqueado
                          ? 'bg-dreams-gold text-dreams-dark'
                          : !tab.bloqueado ? 'text-dreams-text-muted hover:text-dreams-text' : ''
                        }
                      `}
                    >
                      {tab.bloqueado && <FiLock size={10} />}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {pestana === 'stack' ? (
              <div className="flex-1 overflow-y-auto min-h-0">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-dreams-surface z-10">
                    <tr className="border-b border-dreams-border">
                      <th className="px-3 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-left w-44">Ficha</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-16">Imagen</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-left w-36">Nombre</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-28">Valor Unit</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-28">Cant x Jugador</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-32">Valor x Jugador</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-28">Fichas Totales</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center w-36">Valor Total</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila) => (
                      <FilaFicha
                        key={fila.id}
                        fila={fila}
                        fichasCatalogo={fichasCatalogo}
                        fichasUsadas={fichasUsadas}
                        capacidadMaxima={capacidadMaxima}
                        onCambiar={cambiarCampo}
                        onEliminar={eliminarFila}
                      />
                    ))}
                    <tr>
                      <td colSpan={9} className="px-3 py-2">
                        <button type="button" onClick={agregarFila}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dreams-gold/40 text-dreams-gold text-sm font-semibold hover:bg-dreams-gold/10 hover:border-dreams-gold/70 active:scale-[0.99] transition-all duration-150">
                          <FiPlus size={15} />
                          Agregar Ficha
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <PestanaFichasTotales
                filas={filas}
                fichasCatalogo={fichasCatalogo}
                capacidadMaxima={capacidadMaxima}
                onCambiarTotal={cambiarTotal}
              />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-dreams-border flex-shrink-0">
            <div className="flex items-stretch">

              {/* Panel resumen dorado */}
              <div className="m-3 border border-dreams-gold/30 bg-dreams-gold/5 rounded-xl px-5 py-3 flex gap-8 items-center">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-[10px] text-dreams-gold/50 uppercase tracking-wider">Total fichas físicas</span>
                    <span className="text-xs font-semibold text-dreams-text/70">{formatearNumero(resumen.totalFichasFisicas)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-[10px] text-dreams-gold/50 uppercase tracking-wider">Valor total torneo</span>
                    <span className="text-xs font-semibold text-dreams-text/70">{formatearNumero(resumen.valorTotalTorneo)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-[10px] text-dreams-gold/50 uppercase tracking-wider">Fichas por jugador</span>
                    <span className="text-xs font-semibold text-dreams-text/70">{formatearNumero(resumen.fichasPorJugador)}</span>
                  </div>
                </div>
                <div className="w-px self-stretch bg-dreams-gold/20" />
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-dreams-gold/60 uppercase tracking-widest mb-0.5">Stack Inicial</span>
                  <span className="text-4xl font-black text-dreams-gold tabular-nums leading-none">
                    {formatearNumero(resumen.stackInicial)}
                  </span>
                  <span className="text-[10px] text-dreams-gold/40 mt-1">puntos por jugador</span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center gap-3 px-5 ml-auto">
                <button type="button" onClick={onCerrar}
                  className="px-6 py-3 rounded-xl border border-dreams-border text-sm font-semibold text-dreams-text-muted hover:text-dreams-text hover:border-dreams-gold/40 hover:bg-dreams-surface-2 active:scale-[0.98] transition-all duration-150">
                  Cancelar
                </button>

                {pestana === 'stack' && (
                  <button type="button" onClick={handleConfirmarStack} disabled={!stackDefinido}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-wide bg-dreams-gold text-dreams-dark hover:bg-dreams-gold-light hover:shadow-lg hover:shadow-dreams-gold/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none">
                    Confirmar Stack Inicial
                    <FiArrowRight size={15} />
                  </button>
                )}

                {pestana === 'totales' && (
                  <button type="button" onClick={handleGuardar}
                    className="px-8 py-3 rounded-xl text-sm font-bold tracking-wide bg-dreams-gold text-dreams-dark hover:bg-dreams-gold-light hover:shadow-lg hover:shadow-dreams-gold/20 active:scale-[0.98] transition-all duration-150">
                    Guardar Fichas
                  </button>
                )}
              </div>
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
