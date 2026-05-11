import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiClock,
} from 'react-icons/fi';

// ------------------------------------------------------------
// Constantes
// ------------------------------------------------------------
const MARCADORES_CONFIG = [
  { key: 'rebuy_inicio',  label: 'Re-buy Inicio',  color: 'bg-blue-500',   texto: 'text-blue-400',   borde: 'border-blue-500/50',   requiere: 'rebuy_permitido' },
  { key: 'rebuy_fin',     label: 'Re-buy Fin',      color: 'bg-blue-700',   texto: 'text-blue-300',   borde: 'border-blue-700/50',   requiere: 'rebuy_permitido' },
  { key: 'addon_inicio',  label: 'Add-on Inicio',   color: 'bg-purple-500', texto: 'text-purple-400', borde: 'border-purple-500/50', requiere: 'addon_permitido' },
  { key: 'addon_fin',     label: 'Add-on Fin',      color: 'bg-purple-700', texto: 'text-purple-300', borde: 'border-purple-700/50', requiere: 'addon_permitido' },
  { key: 'freechip_fin',  label: 'Free Chip Fin',   color: 'bg-green-600',  texto: 'text-green-400',  borde: 'border-green-600/50',  requiere: 'free_chip_permitido' },
  { key: 'fin_registro',  label: 'Fin Registro',    color: 'bg-amber-500',  texto: 'text-amber-400',  borde: 'border-amber-500/50',  requiere: null },
];

let contadorId = 1;
const nuevoId = () => `nivel-${contadorId++}`;

const crearNivel = () => ({
  id: nuevoId(), tipo: 'NIVEL', sb: '', bb: '', ante: '', duracion: '', marcadores: [],
});
const crearBreak = () => ({
  id: nuevoId(), tipo: 'BREAK', sb: '', bb: '', ante: '', duracion: '', marcadores: [],
});

// ------------------------------------------------------------
// Badge de marcador (dentro de fila)
// ------------------------------------------------------------
const BadgeMarcador = ({ marcador, onEliminar }) => {
  const config = MARCADORES_CONFIG.find((m) => m.key === marcador);
  if (!config) return null;
  return (
    <span className={`
      inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold
      uppercase tracking-wider border ${config.texto} ${config.borde} bg-dreams-dark/80
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.color} flex-shrink-0`} />
      {config.label}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEliminar(marcador); }}
        className="ml-0.5 opacity-60 hover:opacity-100 hover:text-red-400 transition-all"
      >
        <FiX size={8} />
      </button>
    </span>
  );
};

// ------------------------------------------------------------
// Zona droppable de marcadores en cada fila
// ------------------------------------------------------------
const ZonaDropMarcador = ({ id, marcadores, onEliminar, esBreak }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-wrap gap-1 min-h-[26px] min-w-[60px] rounded-md px-1.5 py-1
        transition-all duration-150
        ${isOver ? 'bg-dreams-gold/10 outline outline-1 outline-dreams-gold/40' : ''}
      `}
    >
      {marcadores.map((m) => (
        <BadgeMarcador key={m} marcador={m} onEliminar={onEliminar} />
      ))}
    </div>
  );
};

// ------------------------------------------------------------
// Fila sortable
// ------------------------------------------------------------
const FilaNivel = ({ nivel, numero, onChange, onSeleccionar, seleccionada, onEliminarMarcador, onDuplicar }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: nivel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  const esBreak = nivel.tipo === 'BREAK';

  const inputClase = `
    w-full bg-transparent border-0 outline-none text-sm text-center
    placeholder:text-dreams-text-muted/25 focus:bg-white/5 focus:rounded px-1 py-0.5
    transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
  `;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={() => onSeleccionar(nivel.id)}
      className={`
        border-b transition-colors select-none group
        ${esBreak
          ? `border-red-900/40 ${seleccionada ? 'bg-red-950/40' : 'bg-red-950/20 hover:bg-red-950/30'}`
          : `border-dreams-border/40 ${seleccionada ? 'bg-dreams-gold/5' : 'hover:bg-dreams-surface-2/60'}`
        }
      `}
    >
      {/* Handle drag */}
      <td className="w-8 pl-2">
        <span
          {...listeners}
          className={`
            flex items-center justify-center p-1 rounded cursor-grab active:cursor-grabbing transition-colors
            ${esBreak ? 'text-red-800/60 hover:text-red-500' : 'text-dreams-text-muted/20 hover:text-dreams-text-muted/60'}
          `}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
          </svg>
        </span>
      </td>

      {/* Número + botón duplicar */}
      <td className="w-14 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className={`text-xs font-bold ${esBreak ? 'text-red-500/70' : 'text-dreams-text-muted'}`}>
            {esBreak ? <span className="text-red-400/60 font-black text-[10px] tracking-widest">BRK</span> : numero}
          </span>
          <button
            type="button"
            title="Duplicar fila"
            onClick={(e) => { e.stopPropagation(); onDuplicar(nivel.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`
              opacity-0 group-hover:opacity-100 transition-opacity duration-150
              p-0.5 rounded hover:scale-110 transition-transform
              ${esBreak ? 'text-red-700 hover:text-red-400' : 'text-dreams-text-muted/50 hover:text-dreams-gold'}
            `}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      </td>

      {/* SB */}
      <td className="w-24">
        {esBreak
          ? <span className="block text-center text-red-900/60 text-sm font-bold">—</span>
          : <input type="number" className={`${inputClase} text-dreams-text`} placeholder="0"
              value={nivel.sb}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => onChange(nivel.id, 'sb', e.target.value)} />
        }
      </td>

      {/* BB */}
      <td className="w-24">
        {esBreak
          ? <span className="block text-center text-red-900/60 text-sm font-bold">—</span>
          : <input type="number" className={`${inputClase} text-dreams-text`} placeholder="0"
              value={nivel.bb}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => onChange(nivel.id, 'bb', e.target.value)} />
        }
      </td>

      {/* Ante */}
      <td className="w-24">
        {esBreak
          ? <span className="block text-center text-red-900/60 text-sm font-bold">—</span>
          : <input type="number" className={`${inputClase} text-dreams-text`} placeholder="0"
              value={nivel.ante}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => onChange(nivel.id, 'ante', e.target.value)} />
        }
      </td>

      {/* Duración */}
      <td className="w-24 pr-2">
        <input
          type="number"
          className={`${inputClase} ${esBreak ? 'text-red-300' : 'text-dreams-text'}`}
          placeholder="20"
          value={nivel.duracion}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onChange(nivel.id, 'duracion', e.target.value)}
        />
      </td>

      {/* Separador vertical */}
      <td className="w-px px-0 py-1">
        <div className="w-px h-6 bg-dreams-border/60" />
      </td>

      {/* Marcadores */}
      <td
        className="px-2 py-1"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ZonaDropMarcador
          id={`drop-${nivel.id}`}
          marcadores={nivel.marcadores}
          onEliminar={(m) => onEliminarMarcador(nivel.id, m)}
          esBreak={esBreak}
        />
      </td>
    </tr>
  );
};

// ------------------------------------------------------------
// Tarjeta de marcador draggable (panel lateral)
// ------------------------------------------------------------
const TarjetaMarcador = ({ marcador, enUso }) => {
  const { attributes, listeners, setNodeRef, isDragging } =
    useSortable({ id: `marcador-${marcador.key}` });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-2.5 px-3 py-2.5 rounded-lg border
        cursor-grab active:cursor-grabbing transition-all duration-150 select-none
        ${isDragging ? 'opacity-20' : ''}
        ${enUso
          ? `border-dashed ${marcador.borde} opacity-40`
          : `${marcador.borde} bg-dreams-surface-2/50 hover:bg-dreams-surface-2`
        }
      `}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${marcador.color}`} />
      <span className={`text-xs font-medium ${marcador.texto}`}>{marcador.label}</span>
      {enUso && (
        <span className="ml-auto text-[9px] text-dreams-text-muted/40 italic">colocado</span>
      )}
    </div>
  );
};

// ------------------------------------------------------------
// Modal principal
// ------------------------------------------------------------
export default function ModalEstructuraCiegas({ opciones, nivelesIniciales, onGuardar, onCerrar }) {
  const [niveles, setNiveles] = useState(() => {
    if (nivelesIniciales && nivelesIniciales.length > 0) {
      return nivelesIniciales.map((n) => ({
        id: nuevoId(),
        tipo: n.tipo,
        sb: n.sb ? String(n.sb) : '',
        bb: n.bb ? String(n.bb) : '',
        ante: n.ante ? String(n.ante) : '',
        duracion: n.tiempo_segundos ? String(Math.round(n.tiempo_segundos / 60)) : '',
        marcadores: n.marcadores ?? [],
      }));
    }
    return [crearNivel()];
  });
  const [seleccionada, setSeleccionada] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Solo mostrar marcadores de opciones activas
  const marcadoresDisponibles = MARCADORES_CONFIG.filter(
    (m) => m.requiere === null || opciones[m.requiere]
  );

  const marcadoresEnUso = new Set(niveles.flatMap((n) => n.marcadores));

  // Validar que todos los marcadores disponibles estén colocados
  const todosLosMarcadoresColocados = marcadoresDisponibles.every(
    (m) => marcadoresEnUso.has(m.key)
  );
  const marcadoresFaltantes = marcadoresDisponibles.filter(
    (m) => !marcadoresEnUso.has(m.key)
  );

  const agregarNivel = () => {
    const nuevo = crearNivel();
    setNiveles((prev) => [...prev, nuevo]);
    setSeleccionada(nuevo.id);
  };

  const agregarBreak = () => {
    const nuevo = crearBreak();
    setNiveles((prev) => {
      if (!seleccionada) return [...prev, nuevo];
      const idx = prev.findIndex((n) => n.id === seleccionada);
      const copia = [...prev];
      copia.splice(idx + 1, 0, nuevo);
      return copia;
    });
    setSeleccionada(nuevo.id);
  };

  const eliminarSeleccionada = () => {
    if (!seleccionada) return;
    setNiveles((prev) => prev.filter((n) => n.id !== seleccionada));
    setSeleccionada(null);
  };

  const duplicarNivel = (id) => {
    setNiveles((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      const copia = {
        ...original,
        id: nuevoId(),
        marcadores: [], // los marcadores no se duplican
      };
      const resultado = [...prev];
      resultado.splice(idx + 1, 0, copia);
      return resultado;
    });
  };

  const cambiarCampo = (id, campo, valor) => {
    setNiveles((prev) => prev.map((n) => (n.id === id ? { ...n, [campo]: valor } : n)));
  };

  const eliminarMarcadorDeFila = (idNivel, marcador) => {
    setNiveles((prev) =>
      prev.map((n) =>
        n.id === idNivel ? { ...n, marcadores: n.marcadores.filter((m) => m !== marcador) } : n
      )
    );
  };

  const handleDragStart = ({ active }) => setActiveDragId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;

    const esMarcador = String(active.id).startsWith('marcador-');
    const esDropZona = String(over.id).startsWith('drop-');

    if (esMarcador && esDropZona) {
      const marcadorKey = String(active.id).replace('marcador-', '');
      const nivelId = String(over.id).replace('drop-', '');
      setNiveles((prev) =>
        prev.map((n) => {
          if (n.id !== nivelId) return n;
          if (n.marcadores.includes(marcadorKey)) return n;
          return { ...n, marcadores: [...n.marcadores, marcadorKey] };
        })
      );
      return;
    }

    if (!esMarcador && active.id !== over.id) {
      setNiveles((prev) => {
        const oldIdx = prev.findIndex((n) => n.id === active.id);
        const newIdx = prev.findIndex((n) => n.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const duracionTotal = niveles.reduce((acc, n) => acc + (Number(n.duracion) || 0), 0);
  const horas = Math.floor(duracionTotal / 60);
  const minutos = duracionTotal % 60;

  const handleGuardar = () => {
    const nivelesSerializados = niveles.map((n, i) => ({
      numero_nivel: i + 1,
      tipo: n.tipo,
      sb: Number(n.sb) || 0,
      bb: Number(n.bb) || 0,
      ante: Number(n.ante) || 0,
      tiempo_segundos: (Number(n.duracion) || 0) * 60,
      marcadores: n.marcadores,
    }));

    const extras = {};
    nivelesSerializados.forEach((n) => {
      if (n.marcadores.includes('rebuy_inicio'))  extras.rebuy_nivel_inicio      = n.numero_nivel;
      if (n.marcadores.includes('rebuy_fin'))     extras.rebuy_nivel_final       = n.numero_nivel;
      if (n.marcadores.includes('addon_inicio'))  extras.addon_nivel_inicio      = n.numero_nivel;
      if (n.marcadores.includes('addon_fin'))     extras.addon_nivel_final       = n.numero_nivel;
      if (n.marcadores.includes('freechip_fin'))  extras.free_chip_nivel_final   = n.numero_nivel;
      if (n.marcadores.includes('fin_registro'))  extras.ultimo_nivel_registro   = n.numero_nivel;
    });

    onGuardar({ niveles: nivelesSerializados, ...extras });
  };

  const activeMarcador = activeDragId
    ? MARCADORES_CONFIG.find((m) => `marcador-${m.key}` === activeDragId)
    : null;

  const activeNivel = activeDragId && !String(activeDragId).startsWith('marcador-')
    ? niveles.find((n) => n.id === activeDragId)
    : null;

  const idsNiveles = niveles.map((n) => n.id);
  const idsMarcadores = marcadoresDisponibles.map((m) => `marcador-${m.key}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onCerrar} />

      <div className="relative bg-dreams-surface border border-dreams-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dreams-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-dreams-text">Estructura de Ciegas</h2>
            {duracionTotal > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-dreams-text-muted bg-dreams-surface-2 border border-dreams-border px-2.5 py-1 rounded-full">
                <FiClock size={11} />
                {horas > 0 ? `${horas}h ` : ''}{minutos > 0 ? `${minutos}min` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Agregar Ronda */}
            <button
              type="button"
              onClick={agregarNivel}
              className="
                group relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold
                bg-dreams-surface-2 border border-dreams-gold/30 text-dreams-gold
                hover:bg-dreams-gold hover:text-dreams-dark hover:border-dreams-gold
                transition-all duration-200 overflow-hidden
              "
            >
              <FiPlus size={13} className="transition-transform group-hover:rotate-90 duration-200" />
              Agregar Ronda
            </button>

            {/* Agregar Break */}
            <button
              type="button"
              onClick={agregarBreak}
              className="
                group relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold
                bg-dreams-surface-2 border border-red-500/30 text-red-400
                hover:bg-red-950 hover:border-red-500/60
                transition-all duration-200
              "
            >
              <FiPlus size={13} className="transition-transform group-hover:rotate-90 duration-200" />
              Agregar Break
            </button>

            {/* Eliminar Ronda */}
            <button
              type="button"
              onClick={eliminarSeleccionada}
              disabled={!seleccionada}
              className="
                group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold
                bg-dreams-surface-2 border border-dreams-border text-dreams-text-muted
                hover:border-red-500/40 hover:text-red-400 hover:bg-red-950/30
                transition-all duration-200
                disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-dreams-surface-2
                disabled:hover:border-dreams-border disabled:hover:text-dreams-text-muted
              "
            >
              <FiTrash2 size={13} />
              Eliminar Ronda
            </button>

            <div className="w-px h-5 bg-dreams-border mx-1" />

            <button
              type="button"
              onClick={onCerrar}
              className="p-1.5 rounded-lg text-dreams-text-muted hover:text-dreams-text hover:bg-dreams-surface-2 transition-all"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex flex-1 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Tabla */}
            <div className="flex-1 overflow-y-auto">
              {niveles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-dreams-text-muted gap-1">
                  <p className="text-sm">No hay niveles definidos.</p>
                  <p className="text-xs opacity-50">Usa los botones del header para agregar rondas.</p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-dreams-surface z-10">
                    <tr className="border-b border-dreams-border">
                      <th className="w-8" />
                      <th className="w-14 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">#</th>
                      <th className="w-24 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">SB</th>
                      <th className="w-24 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">BB</th>
                      <th className="w-24 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">Ante</th>
                      <th className="w-24 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">Duración</th>
                      <th className="w-px" />
                      <th className="py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase px-3">Marcadores</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext items={idsNiveles} strategy={verticalListSortingStrategy}>
                      {(() => {
                        let contadorRonda = 0;
                        return niveles.map((nivel) => {
                          if (nivel.tipo !== 'BREAK') contadorRonda++;
                          return (
                            <FilaNivel
                              key={nivel.id}
                              nivel={nivel}
                              numero={contadorRonda}
                              onChange={cambiarCampo}
                              onSeleccionar={setSeleccionada}
                              seleccionada={seleccionada === nivel.id}
                              onEliminarMarcador={eliminarMarcadorDeFila}
                              onDuplicar={duplicarNivel}
                            />
                          );
                        });
                      })()}
                    </SortableContext>
                  </tbody>
                </table>
              )}
            </div>

            {/* Panel lateral — solo si hay marcadores disponibles */}
            {marcadoresDisponibles.length > 0 && (
              <div className="w-48 flex-shrink-0 border-l border-dreams-border flex flex-col">
                <div className="px-4 py-3 border-b border-dreams-border">
                  <p className="text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase">
                    Marcadores
                  </p>
                  <p className="text-[10px] text-dreams-text-muted/40 mt-0.5">
                    Arrastra sobre una ronda
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                  <SortableContext items={idsMarcadores} strategy={verticalListSortingStrategy}>
                    {marcadoresDisponibles.map((marcador) => {
                      const enUso = marcadoresEnUso.has(marcador.key);
                      return (
                        <TarjetaMarcador
                          key={marcador.key}
                          marcador={marcador}
                          enUso={enUso}
                        />
                      );
                    })}
                  </SortableContext>
                </div>
              </div>
            )}

            {/* Drag overlay */}
            <DragOverlay>
              {activeMarcador && (
                <div className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border shadow-xl
                  ${activeMarcador.borde} bg-dreams-surface cursor-grabbing
                `}>
                  <span className={`w-2 h-2 rounded-full ${activeMarcador.color}`} />
                  <span className={`text-xs font-semibold ${activeMarcador.texto}`}>
                    {activeMarcador.label}
                  </span>
                </div>
              )}
              {activeNivel && (
                <div className="bg-dreams-surface-2 border border-dreams-gold/30 rounded-lg px-4 py-2 shadow-xl text-sm text-dreams-text cursor-grabbing">
                  {activeNivel.tipo === 'BREAK'
                    ? `Break — ${activeNivel.duracion || '?'} min`
                    : `Nivel — SB ${activeNivel.sb || '?'} / BB ${activeNivel.bb || '?'}`
                  }
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-dreams-border flex-shrink-0">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-dreams-text-muted">
              {niveles.filter((n) => n.tipo === 'NIVEL').length} rondas ·{' '}
              {niveles.filter((n) => n.tipo === 'BREAK').length} breaks
            </p>
            {!todosLosMarcadoresColocados && niveles.length > 0 && (
              <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                Falta colocar: {marcadoresFaltantes.map((m) => m.label).join(', ')}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 rounded-lg border border-dreams-border text-sm text-dreams-text-muted hover:text-dreams-text hover:border-dreams-gold/40 transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={niveles.length === 0 || !todosLosMarcadoresColocados}
              className="px-5 py-2 rounded-lg bg-dreams-gold text-dreams-dark text-sm font-bold hover:bg-dreams-gold-light transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Guardar Estructura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}