import { useState, useMemo } from 'react'
import {
  FiSearch, FiX, FiUser, FiSlash, FiRefreshCw, FiPlus, FiFilter,
  FiChevronDown, FiAlertCircle, FiTrash2, FiPlusCircle, FiMoreVertical,
  FiRotateCcw, FiGrid
} from 'react-icons/fi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ModalAgregarJugador from '../modales/ModalAgregarJugador'
import useTorneoStore from '../../../store/torneo.store'
import api from '../../../services/api'

// ---------------------------------------------------------------------------
// Constantes de estado
// ---------------------------------------------------------------------------

const ESTADOS = {
  ACTIVO:    { label: 'Activo',    color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   borde: 'rgba(34,197,94,0.25)',  punto: '#22c55e' },
  ELIMINADO: { label: 'Eliminado', color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   borde: 'rgba(239,68,68,0.25)',  punto: '#ef4444' },
}

const FILTROS = ['Todos', 'Activos', 'Eliminados']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const obtenerIniciales = (nombre) => {
  if (!nombre) return '--'
  const partes = nombre.trim().split(' ').filter(Boolean)
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}

const contarRebuys = (historial) => {
  if (!historial) return 0
  if (Array.isArray(historial)) return historial.length
  try { return JSON.parse(historial).length } catch { return 0 }
}

// ---------------------------------------------------------------------------
// Componente: Chip de estado
// ---------------------------------------------------------------------------
function ChipEstado({ estado, ronda }) {
  const cfg = ESTADOS[estado] ?? ESTADOS.ACTIVO
  const tieneRonda = ronda && estado === 'ELIMINADO'

  return (
    <span
      className={`inline-grid items-center gap-x-1.5 rounded-full px-3 uppercase tracking-[1.5px] transition-all ${tieneRonda ? 'py-[5px]' : 'py-[3px]'}`}
      style={{ 
        color: cfg.color, 
        background: cfg.bg, 
        border: `1px solid ${cfg.borde}`,
        gridTemplateColumns: 'auto 1fr' // Columna 1 ajustada al punto, Columna 2 al texto
      }}
    >
      {/* Columna 1 / Fila 1: Punto centrado exclusivamente con la primera línea */}
      <span 
        className="w-1.5 h-1.5 rounded-full col-start-1 row-start-1" 
        style={{ background: cfg.punto, boxShadow: `0 0 5px ${cfg.punto}` }} 
      />
      
      {/* Columna 2 / Fila 1: Estado original */}
      <span className="text-[0.65rem] font-bold leading-none mt-px col-start-2 row-start-1">
        {cfg.label}
      </span>
      
      {/* Columna 2 / Fila 2: Ronda (Centrada de forma independiente bajo el texto) */}
      {tieneRonda && (
        <span className="col-start-2 row-start-2 text-[0.48rem] font-semibold opacity-75 font-mono text-center leading-none mt-1">
          {ronda.toLowerCase().includes('ronda') ? ronda : `Ronda ${ronda}`}
        </span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Componente: Avatar del jugador
// ---------------------------------------------------------------------------
function Avatar({ nombre, eliminado }) {
  const iniciales = obtenerIniciales(nombre)
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-[11px] tracking-[0.5px] transition-all duration-200"
      style={eliminado
        ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }
        : { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }
      }
    >
      {iniciales}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente: Modal asignar mesa
// ---------------------------------------------------------------------------
function ModalAsignarMesa({ jugador, mesas, cargando, error, onAsignar, onCancelar }) {
  const [mesaSel,    setMesaSel]    = useState(null)
  const [asientoSel, setAsientoSel] = useState(null)

  // Todos los asientos de la mesa seleccionada, ordenados
  const todosAsientos = useMemo(() => {
    if (!mesaSel) return []
    return [...(mesaSel.asientos ?? [])].sort((a, b) => a.numero_asiento - b.numero_asiento)
  }, [mesaSel])

  const sinMesas = mesas.length === 0

  const handleMesa = (m) => {
    setMesaSel(m)
    setAsientoSel(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onCancelar}
    >
      <div
        className="w-[480px] rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #161616 0%, #111 100%)',
          border: '1px solid #2a2a2a',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e1e]">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[2px] text-[#555]">Asignar Mesa</p>
            <p className="text-white text-sm font-semibold leading-tight mt-0.5">{jugador?.nombre_completo}</p>
          </div>
          <button onClick={onCancelar} style={{ color: '#444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
            onMouseOver={e => e.currentTarget.style.color = '#aaa'}
            onMouseOut={e  => e.currentTarget.style.color = '#444'}
          >×</button>
        </div>

        {sinMesas ? (
          <div className="px-5 py-8 text-center text-[#555] text-sm">No hay mesas creadas en este torneo.</div>
        ) : (
          /* Dos columnas */
          <div className="flex" style={{ minHeight: '220px' }}>

            {/* Columna izquierda: lista de mesas */}
            <div className="flex flex-col border-r border-[#1e1e1e]" style={{ width: '160px', flexShrink: 0 }}>
              <p className="px-4 pt-3 pb-2 text-[0.58rem] font-bold uppercase tracking-[2px] text-[#444]">Mesa</p>
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#252525 transparent' }}>
                {mesas.map(m => {
                  const libres = (m.asientos ?? []).filter(a => !a.id_inscripcion).length
                  const sel    = mesaSel?.id_mesa === m.id_mesa
                  return (
                    <button
                      key={m.id_mesa}
                      onClick={() => handleMesa(m)}
                      className="w-full flex items-center justify-between px-4 py-2.5 transition-all duration-100 cursor-pointer"
                      style={{
                        background: sel ? 'rgba(212,175,55,0.08)' : 'transparent',
                        borderLeft: sel ? '2px solid #D4AF37' : '2px solid transparent',
                        color:      sel ? '#D4AF37' : '#888',
                      }}
                      onMouseOver={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseOut={e  => { if (!sel) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span className="text-sm font-bold">Mesa {m.numero_mesa}</span>
                      <span style={{ fontSize: '0.6rem', color: sel ? '#7a6a2a' : '#333' }}>
                        {libres > 0 ? `${libres} libre${libres !== 1 ? 's' : ''}` : 'llena'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Columna derecha: todos los asientos de la mesa elegida */}
            <div className="flex flex-col flex-1">
              <p className="px-4 pt-3 pb-2 text-[0.58rem] font-bold uppercase tracking-[2px] text-[#444]">Asiento</p>

              {!mesaSel ? (
                <div className="flex-1 flex items-center justify-center text-[#333] text-xs">
                  Selecciona una mesa
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 px-4 pt-1 pb-4 content-start overflow-y-auto"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#252525 transparent' }}>
                  {todosAsientos.map(a => {
                    const ocupado  = !!a.id_inscripcion
                    const sel      = asientoSel?.id_asiento === a.id_asiento
                    const nombre   = a.nombre_jugador ?? null

                    return (
                      <div key={a.id_asiento} className="relative group/asiento">
                        <button
                          onClick={() => { if (!ocupado) setAsientoSel(a) }}
                          disabled={ocupado}
                          title={ocupado && nombre ? nombre : undefined}
                          style={{
                            width:          '44px',
                            height:         '44px',
                            borderRadius:   '50%',
                            background:     ocupado
                              ? 'rgba(255,255,255,0.02)'
                              : sel
                              ? '#D4AF37'
                              : 'rgba(255,255,255,0.05)',
                            border:         ocupado
                              ? '2px solid #1e1e1e'
                              : sel
                              ? '2px solid #D4AF37'
                              : '2px solid #2e2e2e',
                            color:          ocupado ? '#2e2e2e' : sel ? '#000' : '#888',
                            fontWeight:     700,
                            fontSize:       '0.9rem',
                            cursor:         ocupado ? 'not-allowed' : 'pointer',
                            transition:     'all 0.15s',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            position:       'relative',
                          }}
                          onMouseOver={e => {
                            if (!ocupado && !sel) {
                              e.currentTarget.style.borderColor = '#555'
                              e.currentTarget.style.color       = '#ccc'
                            }
                          }}
                          onMouseOut={e => {
                            if (!ocupado && !sel) {
                              e.currentTarget.style.borderColor = '#2e2e2e'
                              e.currentTarget.style.color       = '#888'
                            }
                          }}
                        >
                          {a.numero_asiento}
                        </button>

                        {/* Tooltip del jugador que ocupa el asiento */}
                        {ocupado && nombre && (
                          <div
                            className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-[0.6rem] font-semibold opacity-0 group-hover/asiento:opacity-100 transition-opacity duration-150 z-10"
                            style={{
                              background: '#1a1a1a',
                              border:     '1px solid #333',
                              color:      '#888',
                              maxWidth:   '120px',
                              overflow:   'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {nombre}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e1e1e]">
          {error ? (
            <span className="text-[0.7rem] text-red-400 flex items-center gap-1.5">
              <FiAlertCircle size={12} /> {error}
            </span>
          ) : (
            <span className="text-[0.7rem] text-[#333]">
              {asientoSel ? `Mesa ${mesaSel.numero_mesa} · Asiento ${asientoSel.numero_asiento}` : 'Ninguno seleccionado'}
            </span>
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancelar}
              disabled={cargando}
              className="rounded px-4 py-2 text-xs font-bold uppercase tracking-[1px] cursor-pointer disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', color: '#666' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#aaa' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#666' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => asientoSel && onAsignar(asientoSel.id_asiento)}
              disabled={cargando || !asientoSel}
              className="rounded px-4 py-2 text-xs font-bold uppercase tracking-[1px] cursor-pointer disabled:opacity-40"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: 'rgba(34,197,94,0.75)' }}
              onMouseEnter={e => { if (!cargando && asientoSel) { e.currentTarget.style.background = 'rgba(34,197,94,0.14)'; e.currentTarget.style.color = '#22c55e' } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; e.currentTarget.style.color = 'rgba(34,197,94,0.75)' }}
            >
              {cargando ? 'Asignando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente: Modal de confirmacion de Bust Out
// ---------------------------------------------------------------------------
function ModalBustOut({ jugador, posicion, ronda, cargando, error, onSetPosicion, onSetRonda, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-[420px] rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #161616 0%, #111 100%)',
          border: '1px solid rgba(239,68,68,0.3)',
          boxShadow: '0 0 60px rgba(239,68,68,0.15), 0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(239,68,68,0.2)]"
          style={{ background: 'rgba(239,68,68,0.05)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <FiAlertCircle size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[2px] text-red-400">Bust Out</p>
            <p className="text-white text-sm font-semibold leading-tight">{jugador?.nombre_completo}</p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Ronda actual */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.68rem] font-semibold uppercase tracking-[1.5px] text-[#555]">
              Ronda actual
            </label>
            <input
              type="text"
              placeholder="Ej: Nivel 5, Final Table..."
              value={ronda}
              onChange={e => onSetRonda(e.target.value)}
              autoFocus
              className="rounded px-3 py-2 text-sm text-white outline-none placeholder:text-[#333]"
              style={{ background: '#1a1a1a', border: '1px solid #333', transition: 'border-color 0.15s' }}
              onFocus={e => e.currentTarget.style.borderColor = '#D4AF37'}
              onBlur={e => e.currentTarget.style.borderColor = '#333'}
            />
          </div>

          {/* Posicion */}
          <div className="flex items-center gap-3">
            <label className="text-[0.68rem] font-semibold uppercase tracking-[1.5px] text-[#555] whitespace-nowrap">
              Posicion final
            </label>
            <input
              type="number"
              min={1}
              value={posicion}
              onChange={e => onSetPosicion(Number(e.target.value))}
              className="rounded px-3 py-2 text-sm font-bold text-white text-center outline-none"
              style={{ background: '#1a1a1a', border: '1px solid #333', width: '90px', transition: 'border-color 0.15s' }}
              onFocus={e => e.currentTarget.style.borderColor = '#D4AF37'}
              onBlur={e => e.currentTarget.style.borderColor = '#333'}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <FiAlertCircle size={12} className="text-red-400 shrink-0" />
              <p className="text-[0.72rem] text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancelar}
              disabled={cargando}
              className="flex-1 rounded py-2.5 text-xs font-bold uppercase tracking-[1.5px] transition-all duration-150 cursor-pointer disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', color: '#666' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#aaa' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#666' }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={cargando}
              className="flex-1 rounded py-2.5 text-xs font-bold uppercase tracking-[1.5px] text-white transition-all duration-150 cursor-pointer disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #8B0000, #c62828)',
                border: '1px solid rgba(239,68,68,0.4)',
                boxShadow: '0 2px 12px rgba(239,68,68,0.25)',
              }}
              onMouseEnter={e => { if (!cargando) e.currentTarget.style.boxShadow = '0 4px 20px rgba(239,68,68,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(239,68,68,0.25)' }}
            >
              {cargando ? 'Registrando...' : 'Confirmar Bust Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente: Modal confirmar eliminacion del torneo
// ---------------------------------------------------------------------------
function ModalConfirmarEliminar({ jugador, cargando, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-[380px] rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #161616 0%, #111 100%)',
          border: '1px solid #252525',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div className="px-5 py-5 flex flex-col gap-4">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[2px] text-[#555] mb-1">Eliminar del torneo</p>
            <p className="text-white text-sm font-semibold">{jugador?.jugador?.nombre_completo}</p>
          </div>
          <p className="text-[#555] text-[0.8rem]">
            Se eliminara el registro de inscripcion. Esta accion no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancelar}
              disabled={cargando}
              className="flex-1 rounded py-2.5 text-xs font-bold uppercase tracking-[1.5px] transition-all duration-150 cursor-pointer disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', color: '#666' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#aaa' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#666' }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={cargando}
              className="flex-1 rounded py-2.5 text-xs font-bold uppercase tracking-[1.5px] transition-all duration-150 cursor-pointer disabled:opacity-60"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
              onMouseEnter={e => { if (!cargando) { e.currentTarget.style.background = 'rgba(239,68,68,0.18)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
            >
              {cargando ? 'Eliminando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
const SeccionJugadores = ({ jugadores = [], torneo }) => {
  const poker = torneo?.poker ?? {}
  const rebuyPermitido  = poker.rebuy_permitido  ?? false
  const addonPermitido  = poker.addon_permitido  ?? false
  const freeChipPermitido = poker.free_chip_permitido ?? false
  const idTorneo = torneo?.id_torneo

  const queryClient    = useQueryClient()
  const agregarJugador = useTorneoStore(s => s.agregarJugador)
  const [modalAgregar, setModalAgregar] = useState(false)

  // Grid dinamico segun opciones activas del torneo
  const columnaGrid = useMemo(() => {
    // N° | Nombre | Mesa | Asiento | [Rebuys] | [Add-On] | [Free Chip] | Estado | Acciones
    const cols = ['40px', '1fr', '90px', '80px']
    if (rebuyPermitido)    cols.push('80px')
    if (addonPermitido)    cols.push('80px')
    if (freeChipPermitido) cols.push('90px')
    cols.push('160px', '70px') // Reducido un poco el ancho de acciones porque ahora es solo 1 boton
    return cols.join(' ')
  }, [rebuyPermitido, addonPermitido, freeChipPermitido])

  const [busqueda, setBusqueda]         = useState('')
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [mostrarFiltro, setMostrarFiltro] = useState(false)

  // Estado modificado para guardar coordenadas y la data del jugador clickeado
  const [menuActivo, setMenuActivo] = useState(null)

  // Modal bust out
  const [modalBust, setModalBust]         = useState(null)
  const [posicionBust, setPosicionBust]   = useState(1)
  const [rondaBust, setRondaBust]         = useState('')
  const [cargandoBust, setCargandoBust]   = useState(false)
  const [errorBust, setErrorBust]         = useState(null)

  // Modal confirmar eliminar
  const [modalEliminar, setModalEliminar] = useState(null)
  const [cargandoElim, setCargandoElim]   = useState(false)

  // Modal asignar mesa
  const [modalAsignarMesa, setModalAsignarMesa] = useState(null) // inscripcion activa
  const [cargandoAsignar, setCargandoAsignar]   = useState(false)
  const [errorAsignar, setErrorAsignar]         = useState(null)

  // Acciones en curso (por id_inscripcion) para deshabilitar botones mientras cargan
  const [enCurso, setEnCurso]             = useState({})

  const actualizarJugador = useTorneoStore(s => s.actualizarJugador)
  const quitarJugador     = useTorneoStore(s => s.quitarJugador)

  // Query mesas (solo se activa cuando el modal de asignar está abierto)
  const { data: mesasDisponibles = [] } = useQuery({
    queryKey: ['mesas', idTorneo],
    queryFn:  () => api.get(`/mesas/torneo/${idTorneo}`).then(r => r.data.datos),
    enabled:  !!modalAsignarMesa && !!idTorneo,
    staleTime: 0,
  })

  // Stats rapidos
  const activos    = useMemo(() => jugadores.filter(j => j.estado === 'ACTIVO').length, [jugadores])
  const eliminados = useMemo(() => jugadores.filter(j => j.estado === 'ELIMINADO').length, [jugadores])

  // Filtrado
  const jugadoresFiltrados = useMemo(() => {
    let lista = [...jugadores]
    if (filtroEstado === 'Activos')    lista = lista.filter(j => j.estado === 'ACTIVO')
    if (filtroEstado === 'Eliminados') lista = lista.filter(j => j.estado === 'ELIMINADO')
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      lista = lista.filter(j =>
        j.jugador?.nombre_completo?.toLowerCase().includes(q) ||
        j.jugador?.rut?.toLowerCase().includes(q)
      )
    }
    return lista
  }, [jugadores, filtroEstado, busqueda])

  const marcarEnCurso = (id, valor) =>
    setEnCurso(prev => ({ ...prev, [id]: valor }))

  // --- Bust Out ---
  const abrirBustOut = (insc) => {
    setPosicionBust(activos)
    setRondaBust('')
    setErrorBust(null)
    setModalBust(insc)
  }

  const confirmarBustOut = async () => {
    if (!rondaBust.trim()) { setErrorBust('Ingresa la ronda actual.'); return }
    setCargandoBust(true)
    setErrorBust(null)
    try {
      const res = await api.patch(`/inscripciones/${modalBust.id_inscripcion}/bust-out`, {
        ronda: rondaBust.trim(),
        pos_final: posicionBust,
      })
      actualizarJugador(modalBust.jugador?.rut, res.data.datos.inscripcion)
      setModalBust(null)
    } catch (err) {
      setErrorBust(err.response?.data?.mensaje ?? 'Error al registrar bust out.')
    } finally {
      setCargandoBust(false)
    }
  }

  // --- Rebuy ---
  const registrarRebuy = async (insc) => {
    marcarEnCurso(insc.id_inscripcion, 'rebuy')
    try {
      const res = await api.patch(`/inscripciones/${insc.id_inscripcion}/rebuy`)
      actualizarJugador(insc.jugador?.rut, res.data.datos.inscripcion)
    } catch (err) {
      console.error('Error rebuy:', err.response?.data?.mensaje)
    } finally {
      marcarEnCurso(insc.id_inscripcion, null)
    }
  }

  // --- Add-on ---
  const registrarAddon = async (insc) => {
    marcarEnCurso(insc.id_inscripcion, 'addon')
    try {
      const res = await api.patch(`/inscripciones/${insc.id_inscripcion}/addon`)
      actualizarJugador(insc.jugador?.rut, res.data.datos.inscripcion)
    } catch (err) {
      console.error('Error addon:', err.response?.data?.mensaje)
    } finally {
      marcarEnCurso(insc.id_inscripcion, null)
    }
  }

  // --- Free Chip ---
  const registrarFreeChip = async (insc) => {
    marcarEnCurso(insc.id_inscripcion, 'freechip')
    try {
      const res = await api.patch(`/inscripciones/${insc.id_inscripcion}/free-chip`)
      actualizarJugador(insc.jugador?.rut, res.data.datos.inscripcion)
    } catch (err) {
      console.error('Error free chip:', err.response?.data?.mensaje)
    } finally {
      marcarEnCurso(insc.id_inscripcion, null)
    }
  }

  // --- Anular Bust Out ---
  const anularBustOut = async (insc) => {
    marcarEnCurso(insc.id_inscripcion, 'anular-bust')
    try {
      const res = await api.patch(`/inscripciones/${insc.id_inscripcion}/anular-bust-out`)
      actualizarJugador(insc.jugador?.rut, res.data.datos.inscripcion)
    } catch (err) {
      console.error('Error anular bust out:', err.response?.data?.mensaje)
    } finally {
      marcarEnCurso(insc.id_inscripcion, null)
    }
  }

  // --- Anular Rebuy ---
  const anularRebuy = async (insc) => {
    marcarEnCurso(insc.id_inscripcion, 'anular-rebuy')
    try {
      const res = await api.patch(`/inscripciones/${insc.id_inscripcion}/anular-rebuy`)
      actualizarJugador(insc.jugador?.rut, res.data.datos.inscripcion)
    } catch (err) {
      console.error('Error anular rebuy:', err.response?.data?.mensaje)
    } finally {
      marcarEnCurso(insc.id_inscripcion, null)
    }
  }

  // --- Anular Add-On ---
  const anularAddon = async (insc) => {
    marcarEnCurso(insc.id_inscripcion, 'anular-addon')
    try {
      const res = await api.patch(`/inscripciones/${insc.id_inscripcion}/anular-addon`)
      actualizarJugador(insc.jugador?.rut, res.data.datos.inscripcion)
    } catch (err) {
      console.error('Error anular addon:', err.response?.data?.mensaje)
    } finally {
      marcarEnCurso(insc.id_inscripcion, null)
    }
  }

  // --- Anular Free Chip ---
  const anularFreeChip = async (insc) => {
    marcarEnCurso(insc.id_inscripcion, 'anular-freechip')
    try {
      const res = await api.patch(`/inscripciones/${insc.id_inscripcion}/anular-free-chip`)
      actualizarJugador(insc.jugador?.rut, res.data.datos.inscripcion)
    } catch (err) {
      console.error('Error anular free chip:', err.response?.data?.mensaje)
    } finally {
      marcarEnCurso(insc.id_inscripcion, null)
    }
  }

  // --- Asignar mesa ---
  const confirmarAsignarMesa = async (idAsientoDestino) => {
    if (!modalAsignarMesa) return
    setCargandoAsignar(true)
    setErrorAsignar(null)
    try {
      await api.put('/mesas/asignar-jugador', {
        id_inscripcion:     modalAsignarMesa.id_inscripcion,
        id_asiento_destino: idAsientoDestino,
      })
      // Refrescar mesas (SeccionMesas) y control-torneo (columnas Mesa/Asiento de la tabla)
      queryClient.invalidateQueries({ queryKey: ['mesas', idTorneo] })
      queryClient.invalidateQueries({ queryKey: ['control-torneo', idTorneo] })
      setModalAsignarMesa(null)
    } catch (err) {
      setErrorAsignar(err.response?.data?.mensaje ?? 'Error al asignar el asiento.')
    } finally {
      setCargandoAsignar(false)
    }
  }

  // --- Eliminar inscripcion ---
  const confirmarEliminar = async () => {
    setCargandoElim(true)
    try {
      await api.delete(`/inscripciones/${modalEliminar.id_inscripcion}`)
      quitarJugador(modalEliminar.id_inscripcion)
      setModalEliminar(null)
    } catch (err) {
      console.error('Error eliminar:', err.response?.data?.mensaje)
    } finally {
      setCargandoElim(false)
    }
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* CONTENEDOR PRINCIPAL                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col flex-1 min-h-0 gap-0 relative">

        {/* HEADER: subtitulo + acciones a la derecha */}
        <div className="flex items-center gap-3 pb-3 mb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <h2
            className="text-[1.1rem] font-black uppercase tracking-[4px] shrink-0"
            style={{ color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.35)' }}
          >
            Jugadores
          </h2>
          <div className="flex-1" />
          {/* Buscador expandible unificado */}
          <div className="relative flex items-center">
            <div
              className="flex items-center rounded overflow-visible transition-all duration-250"
              style={{
                width: busquedaAbierta ? '220px' : '26px',
                background: busquedaAbierta ? 'rgba(255,255,255,0.025)' : 'transparent',
                border: busquedaAbierta ? '1px solid #252525' : '1px solid transparent',
                transition: 'width 0.25s ease, background 0.2s ease, border-color 0.2s ease',
              }}
            >
              <button
                onClick={() => {
                  setBusquedaAbierta(v => !v)
                  if (busquedaAbierta) { setBusqueda(''); setMostrarFiltro(false) }
                }}
                className="w-6 h-6 flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer rounded"
                title={busquedaAbierta ? 'Cerrar busqueda' : 'Buscar jugador'}
                style={{
                  color: busquedaAbierta ? '#D4AF37' : '#3a3a3a',
                  background: !busquedaAbierta ? 'transparent' : 'transparent',
                  border: !busquedaAbierta ? '1px solid #252525' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!busquedaAbierta) { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                onMouseLeave={e => { if (!busquedaAbierta) { e.currentTarget.style.color = '#3a3a3a'; e.currentTarget.style.background = 'transparent' } }}
              >
                <FiSearch size={12} />
              </button>
              <div
                className="overflow-hidden"
                style={{
                  width: busquedaAbierta ? '100%' : '0px',
                  opacity: busquedaAbierta ? 1 : 0,
                  transition: 'width 0.25s ease, opacity 0.15s ease',
                }}
              >
                <input
                  type="text"
                  placeholder="Nombre o RUT..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  autoFocus={busquedaAbierta}
                  className="w-full py-1 text-[0.68rem] text-[#aaa] outline-none placeholder:text-[#2e2e2e] bg-transparent"
                  style={{ minWidth: 0 }}
                />
              </div>
              {busquedaAbierta && busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="shrink-0 w-5 flex items-center justify-center transition-colors cursor-pointer"
                  style={{ color: '#444' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#888' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                >
                  <FiX size={10} />
                </button>
              )}
              {busquedaAbierta && (
                <>
                  <div className="w-px h-3.5 bg-[#2e2e2e] shrink-0 mx-0.5" />
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setMostrarFiltro(!mostrarFiltro)}
                      className="w-6 h-6 flex items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer rounded"
                      style={{
                        color: filtroEstado !== 'Todos' ? '#D4AF37' : (mostrarFiltro ? '#D4AF37' : '#444'),
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#888' }}
                      onMouseLeave={e => { e.currentTarget.style.color = filtroEstado !== 'Todos' ? '#D4AF37' : (mostrarFiltro ? '#D4AF37' : '#444') }}
                    >
                      <FiFilter size={10} />
                      <FiChevronDown size={8} style={{ transform: mostrarFiltro ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                    </button>
                    {mostrarFiltro && (
                      <div
                        className="absolute top-[calc(100%+4px)] right-0 z-30 rounded-lg overflow-hidden min-w-[110px]"
                        style={{ background: '#141414', border: '1px solid #252525', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}
                      >
                        {FILTROS.map(f => (
                          <button
                            key={f}
                            onClick={() => { setFiltroEstado(f); setMostrarFiltro(false) }}
                            className="w-full text-left px-3 py-2 text-[0.7rem] font-medium transition-colors duration-100 cursor-pointer"
                            style={{
                              color: filtroEstado === f ? '#D4AF37' : '#555',
                              background: filtroEstado === f ? 'rgba(212,175,55,0.05)' : 'transparent',
                            }}
                            onMouseEnter={e => { if (filtroEstado !== f) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#999' } }}
                            onMouseLeave={e => { if (filtroEstado !== f) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' } }}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="w-px h-4 bg-[#242424] shrink-0" />
          <button
            className="flex items-center gap-1 rounded px-2 py-1 text-[0.66rem] font-medium transition-all duration-150 cursor-pointer shrink-0"
            style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
              color: 'rgba(34,197,94,0.75)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.14)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; e.currentTarget.style.color = '#22c55e' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.25)'; e.currentTarget.style.color = 'rgba(34,197,94,0.75)' }}
            onClick={() => setModalAgregar(true)}
          >
            + Jugador
          </button>
        </div>

        {/* TABLA */}
        <div
          className="flex-1 rounded-xl overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(180deg, #0e0e0e 0%, #0a0a0a 100%)',
            border: '1px solid #1a1a1a',
            boxShadow: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02)',
          }}
        >
          {/* Cabecera tabla */}
          <div
            className="grid shrink-0 px-4 py-3"
            style={{
              gridTemplateColumns: columnaGrid,
              borderBottom: '1px solid #181818',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            {[
              { label: 'N°',       align: 'left'   },
              { label: 'Nombre',   align: 'left'   },
              { label: 'Mesa',     align: 'center' },
              { label: 'Asiento',  align: 'center' },
              { label: 'Rebuys',   align: 'center', oculto: !rebuyPermitido },
              { label: 'Add-On',   align: 'center', oculto: !addonPermitido },
              { label: 'Free Chip',align: 'center', oculto: !freeChipPermitido },
              { label: 'Estado',   align: 'center' },
              { label: 'Acciones', align: 'center' },
            ].filter(c => !c.oculto).map(({ label, align }) => (
              <span
                key={label}
                className={`text-[0.6rem] font-bold uppercase tracking-[2px] text-[#D4AF37] text-${align}`}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Filas */}
          <div className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#252525 transparent' }}
          >
            {jugadoresFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e1e' }}>
                  <FiUser size={18} className="text-[#2a2a2a]" />
                </div>
                <p className="text-[0.75rem] text-[#2a2a2a] uppercase tracking-[2px]">
                  {jugadores.length === 0 ? 'Sin jugadores inscritos' : 'Sin resultados'}
                </p>
              </div>
            ) : (
              jugadoresFiltrados.map((insc, i) => {
                const { jugador, estado, tiene_free_chip, historial_rebuys, tiene_addon } = insc
                const eliminado  = estado === 'ELIMINADO'
                const nRebuys    = contarRebuys(historial_rebuys)
                const asientoAsig = insc.asientos?.[0] ?? null
                const mesaNum     = asientoAsig?.mesa?.numero_mesa ?? null
                const asientoNum  = asientoAsig?.numero_asiento ?? null

                return (
                  <div
                    key={insc.id_inscripcion ?? i}
                    className="group grid items-center px-4 py-2.5 transition-all duration-150 relative"
                    style={{
                      gridTemplateColumns: columnaGrid,
                      borderBottom: '1px solid rgba(255,255,255,0.025)',
                      opacity: eliminado ? 0.45 : 1,
                      background: 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!eliminado) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* N° */}
                    <span className="text-[0.8rem] font-bold text-[#333] font-mono">
                      {i + 1}
                    </span>

                    {/* Nombre */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar nombre={jugador?.nombre_completo} eliminado={eliminado} />
                      <div className="min-w-0">
                        <p className={`text-[0.85rem] font-semibold truncate leading-tight ${eliminado ? 'text-[#555] line-through' : 'text-white'}`}>
                          {jugador?.nombre_completo ?? '—'}
                        </p>
                        <p className="text-[0.65rem] text-[#383838] font-mono tracking-wide">
                          {jugador?.rut ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* Mesa */}
                    <div className="text-center">
                      {mesaNum != null
                        ? <span className="text-[0.85rem] font-bold text-white">{mesaNum}</span>
                        : <span className="text-[#2a2a2a] text-lg font-light">—</span>
                      }
                    </div>

                    {/* Asiento */}
                    <div className="text-center">
                      {asientoNum != null
                        ? <span className="text-[0.85rem] font-bold text-white">{asientoNum}</span>
                        : <span className="text-[#2a2a2a] text-lg font-light">—</span>
                      }
                    </div>

                    {/* Rebuys */}
                    {rebuyPermitido && (
                      <div className="text-center">
                        <span
                          className="text-[0.85rem] font-bold"
                          style={{ color: nRebuys > 0 ? '#D4AF37' : '#2a2a2a' }}
                        >
                          {nRebuys}
                        </span>
                      </div>
                    )}

                    {/* Add-On */}
                    {addonPermitido && (
                      <div className="flex items-center justify-center">
                        {tiene_addon ? (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#D4AF37' }} />
                        ) : (
                          <div className="w-3.5 h-[2px] rounded-full" style={{ background: '#D4AF37' }} />
                        )}
                      </div>
                    )}

                    {/* Free Chip */}
                    {freeChipPermitido && (
                      <div className="flex items-center justify-center">
                        {tiene_free_chip ? (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#D4AF37' }} />
                        ) : (
                          <div className="w-3.5 h-[2px] rounded-full" style={{ background: '#D4AF37' }} />
                        )}
                      </div>
                    )}

                    {/* Estado */}
                    <div className="flex justify-center">
                      {mesaNum == null && !eliminado
                        ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-[3px] text-[0.62rem] font-bold uppercase tracking-[1px]"
                            style={{ color: '#555', background: 'rgba(255,255,255,0.03)', border: '1px solid #252525' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#333]" />
                            Esp. Mesa
                          </span>
                        )
                        : <ChipEstado estado={estado} ronda={insc.ronda_eliminacion} />
                      }
                    </div>

                    {/* Botón Acciones (Abre Menú Global) */}
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (menuActivo?.id === insc.id_inscripcion) {
                            setMenuActivo(null)
                          } else {
                            // Calculamos posición exacta del botón relativo a la ventana
                            const rect = e.currentTarget.getBoundingClientRect()
                            setMenuActivo({
                              id: insc.id_inscripcion,
                              insc,
                              // El bottom del menú será: alto de la pantalla - (top del botón) + espaciado
                              bottom: window.innerHeight - rect.top + 8,
                              // El right del menú será: ancho de pantalla - (right del botón)
                              right: window.innerWidth - rect.right
                            })
                          }
                        }}
                        className="w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
                      >
                        <FiMoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pie de tabla */}
          {jugadoresFiltrados.length > 0 && (
            <div
              className="shrink-0 flex items-center justify-between px-4 py-2.5"
              style={{
                borderTop: '1px solid #181818',
                background: 'rgba(255,255,255,0.01)',
              }}
            >
              <span className="text-[0.65rem] text-[#2a2a2a] uppercase tracking-[2px]">
                Mostrando {jugadoresFiltrados.length} de {jugadores.length}
              </span>
              {eliminados > 0 && (
                <span className="text-[0.65rem] text-[#3a2a2a] uppercase tracking-[1.5px]">
                  {eliminados} jugador{eliminados !== 1 ? 'es' : ''} eliminado{eliminados !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MENÚ DESPLEGABLE GLOBAL (Renderizado fuera del overflow)           */}
      {/* ------------------------------------------------------------------ */}
      {menuActivo && (() => {
        const inscMenu = menuActivo.insc
        const eliminado     = inscMenu.estado === 'ELIMINADO'
        const tiene_addon     = inscMenu.tiene_addon
        const tiene_free_chip = inscMenu.tiene_free_chip
        const nRebuys         = contarRebuys(inscMenu.historial_rebuys)
        const ocupado         = !!enCurso[inscMenu.id_inscripcion]

        // Estilos reutilizables
        const estiloNormal   = 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-white transition-all duration-150 hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-30 disabled:cursor-not-allowed group'
        const estiloAnular   = 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed group'

        return (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => { e.stopPropagation(); setMenuActivo(null) }}
              onWheel={() => setMenuActivo(null)}
            />
            <div
              className="fixed z-50 w-[190px] rounded-xl flex flex-col p-1.5 shadow-2xl transition-all duration-150"
              style={{
                bottom: menuActivo.bottom,
                right: menuActivo.right,
                background: 'linear-gradient(145deg, #1e1e1e 0%, #111 100%)',
                border: '1px solid #333',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
              }}
            >
              {/* Bust Out / Anular Bust Out */}
              {eliminado ? (
                <button
                  onClick={() => { anularBustOut(inscMenu); setMenuActivo(null) }}
                  disabled={ocupado}
                  className={estiloAnular}
                  style={{ color: '#f87171' }}
                  onMouseEnter={e => { if (!ocupado) e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <FiRotateCcw size={14} style={{ opacity: 0.8 }} />
                  Anular Bust Out
                </button>
              ) : (
                <button
                  onClick={() => { abrirBustOut(inscMenu); setMenuActivo(null) }}
                  disabled={ocupado}
                  className={estiloNormal}
                >
                  <FiSlash size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                  Bust Out
                </button>
              )}

              {/* Rebuy / Anular Rebuy */}
              {rebuyPermitido && (
                nRebuys > 0 && !eliminado ? (
                  <button
                    onClick={() => { anularRebuy(inscMenu); setMenuActivo(null) }}
                    disabled={ocupado}
                    className={estiloAnular}
                    style={{ color: '#f87171' }}
                    onMouseEnter={e => { if (!ocupado) e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <FiRotateCcw size={14} style={{ opacity: 0.8 }} />
                    Anular Rebuy
                  </button>
                ) : (
                  <button
                    onClick={() => { registrarRebuy(inscMenu); setMenuActivo(null) }}
                    disabled={!eliminado || ocupado}
                    className={estiloNormal}
                  >
                    <FiRefreshCw size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                    Registrar Rebuy
                  </button>
                )
              )}

              {/* Add-On / Anular Add-On */}
              {addonPermitido && (
                tiene_addon ? (
                  <button
                    onClick={() => { anularAddon(inscMenu); setMenuActivo(null) }}
                    disabled={ocupado}
                    className={estiloAnular}
                    style={{ color: '#f87171' }}
                    onMouseEnter={e => { if (!ocupado) e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <FiRotateCcw size={14} style={{ opacity: 0.8 }} />
                    Anular Add-On
                  </button>
                ) : (
                  <button
                    onClick={() => { registrarAddon(inscMenu); setMenuActivo(null) }}
                    disabled={eliminado || ocupado}
                    className={estiloNormal}
                  >
                    <FiPlus size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                    Registrar Add-On
                  </button>
                )
              )}

              {/* Free Chip / Anular Free Chip */}
              {freeChipPermitido && (
                tiene_free_chip ? (
                  <button
                    onClick={() => { anularFreeChip(inscMenu); setMenuActivo(null) }}
                    disabled={ocupado}
                    className={estiloAnular}
                    style={{ color: '#f87171' }}
                    onMouseEnter={e => { if (!ocupado) e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <FiRotateCcw size={14} style={{ opacity: 0.8 }} />
                    Anular Free Chip
                  </button>
                ) : (
                  <button
                    onClick={() => { registrarFreeChip(inscMenu); setMenuActivo(null) }}
                    disabled={eliminado || ocupado}
                    className={estiloNormal}
                  >
                    <FiPlusCircle size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                    Asignar Free Chip
                  </button>
                )
              )}

              {/* Asignar Mesa */}
              {!eliminado && (
                <button
                  onClick={() => {
                    setErrorAsignar(null)
                    setModalAsignarMesa(inscMenu)
                    setMenuActivo(null)
                  }}
                  disabled={ocupado}
                  className={estiloNormal}
                >
                  <FiGrid size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                  Asignar Mesa
                </button>
              )}

              {/* Separador */}
              <div className="w-full h-px bg-[#2a2a2a] my-1" />

              {/* Eliminar */}
              <button
                onClick={() => { setModalEliminar(inscMenu); setMenuActivo(null) }}
                disabled={ocupado}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-white transition-all duration-150 hover:bg-[rgba(239,68,68,0.15)] hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <FiTrash2 size={14} className="opacity-70 group-hover:opacity-100 transition-opacity group-hover:text-red-400" />
                Eliminar
              </button>
            </div>
          </>
        )
      })()}

      {/* MODALES */}
      {modalAgregar && (
        <ModalAgregarJugador
          idTorneo={torneo?.id_torneo}
          torneo={torneo}
          onConfirmar={(inscripcion) => {
            agregarJugador(inscripcion)
            setModalAgregar(false)
          }}
          onCerrar={() => setModalAgregar(false)}
        />
      )}
      {modalBust && (
        <ModalBustOut
          jugador={modalBust.jugador}
          posicion={posicionBust}
          ronda={rondaBust}
          cargando={cargandoBust}
          error={errorBust}
          onSetPosicion={setPosicionBust}
          onSetRonda={setRondaBust}
          onConfirmar={confirmarBustOut}
          onCancelar={() => { setModalBust(null); setErrorBust(null) }}
        />
      )}
      {modalEliminar && (
        <ModalConfirmarEliminar
          jugador={modalEliminar}
          cargando={cargandoElim}
          onConfirmar={confirmarEliminar}
          onCancelar={() => setModalEliminar(null)}
        />
      )}
      {modalAsignarMesa && (
        <ModalAsignarMesa
          jugador={modalAsignarMesa.jugador}
          mesas={mesasDisponibles}
          cargando={cargandoAsignar}
          error={errorAsignar}
          onAsignar={confirmarAsignarMesa}
          onCancelar={() => { setModalAsignarMesa(null); setErrorAsignar(null) }}
        />
      )}
    </>
  )
}

export default SeccionJugadores