import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiTrash2, FiMonitor, FiXCircle } from 'react-icons/fi'
import api from '../../../services/api'

// ---------------------------------------------------------------------------
// Layouts de posicion de asientos alrededor de la mesa
// Las coordenadas son relativas al centro del contenedor (0,0 = centro)
// ---------------------------------------------------------------------------
const LAYOUTS = {
  10: [
    { x: 105, y: -80 }, { x: 175, y: -30 }, { x: 175, y: 35 },
    { x: 110, y: 90 },  { x: 38,  y: 95 },  { x: -38, y: 95 },
    { x: -110, y: 90 }, { x: -175, y: 35 }, { x: -175, y: -30 },
    { x: -105, y: -80 },
  ],
  9: [
    { x: 105, y: -80 }, { x: 175, y: -30 }, { x: 175, y: 35 },
    { x: 110, y: 90 },  { x: 38,  y: 95 },  { x: -38, y: 95 },
    { x: -110, y: 90 }, { x: -175, y: 35 }, { x: -175, y: -30 },
  ],
  8: [
    { x: 175, y: -30 }, { x: 175, y: 35 },
    { x: 110, y: 90 },  { x: 38,  y: 95 },  { x: -38, y: 95 },
    { x: -110, y: 90 }, { x: -175, y: 35 }, { x: -175, y: -30 },
  ],
  7: [
    { x: 175, y: 0 }, { x: 150, y: 65 }, { x: 80, y: 95 },
    { x: 0, y: 95 }, { x: -80, y: 95 }, { x: -150, y: 65 }, { x: -175, y: 0 },
  ],
  6: [
    { x: 180, y: 35 }, { x: 110, y: 90 }, { x: 38, y: 95 },
    { x: -38, y: 95 }, { x: -110, y: 90 }, { x: -180, y: 35 },
  ],
  5: [
    { x: 165, y: 50 }, { x: 85, y: 95 }, { x: 0, y: 95 },
    { x: -85, y: 95 }, { x: -165, y: 50 },
  ],
  4: [
    { x: 145, y: 70 }, { x: 45, y: 95 },
    { x: -45, y: 95 }, { x: -145, y: 70 },
  ],
  3: [{ x: 120, y: 85 }, { x: 0, y: 95 }, { x: -120, y: 85 }],
  2: [{ x: 60, y: 95 }, { x: -60, y: 95 }],
  1: [{ x: 0, y: 95 }],
}

// ---------------------------------------------------------------------------
// Componente individual de asiento
// ---------------------------------------------------------------------------
const Asiento = ({ asiento, index, total, esHover, isActive, onDragStart, onDragOver, onDragLeave, onDrop, onClick }) => {
  const posiciones = LAYOUTS[total] || LAYOUTS[10]
  const pos = posiciones[index]
  const ocupado = !!asiento.id_inscripcion

  return (
    <div
      draggable={ocupado}
      onDragStart={(e) => ocupado && onDragStart(e, asiento.id_inscripcion, asiento.id_asiento)}
      onDragOver={(e) => onDragOver(e, ocupado, asiento.id_asiento)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, asiento.id_asiento, ocupado)}
      onClick={(e) => { if (ocupado) { e.stopPropagation(); onClick(asiento.id_asiento) } }}
      title={asiento.nombre_jugador ?? undefined}
      style={{
        position:    'absolute',
        left:        `calc(50% + ${pos.x}px)`,
        top:         `calc(50% + ${pos.y}px)`,
        transform:   esHover ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%)',
        width:       '38px',
        height:      '38px',
        borderRadius:'50%',
        background:  ocupado ? '#D4AF37' : '#1A1A1A',
        border:      esHover
          ? '3px dashed #D4AF37'
          : ocupado
          ? '2px solid #fff'
          : '2px solid #333',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          ocupado ? 'black' : '#ddd',
        fontSize:       '0.9rem',
        fontWeight:     'bold',
        boxShadow:      ocupado ? '0 6px 12px rgba(0,0,0,0.8)' : 'none',
        zIndex:         isActive || esHover ? 30 : (ocupado ? 20 : 10),
        transition:     'all 0.2s ease-out',
        cursor:         ocupado ? 'pointer' : 'default',
      }}
    >
      {asiento.numero_asiento}

      {isActive && asiento.nombre_jugador && (
        <div style={{
          position:        'absolute',
          bottom:          '130%',
          left:            '50%',
          transform:       'translateX(-50%)',
          background:      '#222',
          border:          '1px solid #D4AF37',
          color:           'white',
          padding:         '4px 10px',
          borderRadius:    '4px',
          fontSize:        '0.85rem',
          fontWeight:      '600',
          whiteSpace:      'nowrap',
          boxShadow:       '0 4px 8px rgba(0,0,0,0.5)',
          pointerEvents:   'none',
          zIndex:          100,
        }}>
          {asiento.nombre_jugador}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente tarjeta de mesa
// ---------------------------------------------------------------------------
const TarjetaMesa = ({
  mesa,
  asientoActivo,
  asientoHover,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onClickAsiento,
  onAgregarAsiento,
  onQuitarAsiento,
  onEliminarMesa,
}) => {
  const total = mesa.asientos.length

  return (
    <div
      style={{
        padding:         '16px',
        position:        'relative',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        background:      'linear-gradient(145deg, #1c1c1c 0%, #161616 100%)',
        border:          '1px solid #2e2e2e',
        borderRadius:    '12px',
        boxShadow:       '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Cabecera tarjeta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '18px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.95rem', letterSpacing: '2px', color: '#D4AF37' }}>
          MESA {mesa.numero_mesa}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.65rem', color: '#444', marginRight: '2px', letterSpacing: '1px' }}>ASIENTOS:</span>

          <button
            onClick={() => onQuitarAsiento(mesa.id_mesa)}
            disabled={total <= 1}
            style={{
              background:   'rgba(255,255,255,0.04)',
              border:       '1px solid #333',
              color:        '#aaa',
              width:        '22px',
              height:       '22px',
              borderRadius: '4px',
              cursor:       total <= 1 ? 'not-allowed' : 'pointer',
              opacity:      total <= 1 ? 0.3 : 1,
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     '0.85rem',
              lineHeight:   1,
            }}
          >
            −
          </button>

          <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>{total}</span>

          <button
            onClick={() => onAgregarAsiento(mesa.id_mesa)}
            disabled={total >= 10}
            style={{
              background:   'rgba(255,255,255,0.04)',
              border:       '1px solid #333',
              color:        '#aaa',
              width:        '22px',
              height:       '22px',
              borderRadius: '4px',
              cursor:       total >= 10 ? 'not-allowed' : 'pointer',
              opacity:      total >= 10 ? 0.3 : 1,
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     '0.85rem',
              lineHeight:   1,
            }}
          >
            +
          </button>

          <div style={{ width: '1px', height: '14px', background: '#2e2e2e', margin: '0 3px' }} />

          <button
            onClick={() => onEliminarMesa(mesa.id_mesa, mesa.numero_mesa, mesa.asientos)}
            title="Eliminar mesa"
            style={{
              background:   'none',
              border:       'none',
              cursor:       'pointer',
              color:        '#3a3a3a',
              padding:      '2px 3px',
              display:      'flex',
              alignItems:   'center',
              transition:   'color 0.15s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#ff5252' }}
            onMouseOut={(e)  => { e.currentTarget.style.color = '#3a3a3a' }}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* Mesa visual — reducida */}
      <div style={{ position: 'relative', width: '320px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Superficie oval */}
        <div style={{
          width:        '230px',
          height:       '100px',
          background:   'linear-gradient(145deg, #0d3a1e 0%, #0a2e17 100%)',
          border:       '4px solid #9a7d35',
          borderRadius: '50px',
          position:     'relative',
          boxShadow:    'inset 0 0 25px rgba(0,0,0,0.9), 0 8px 20px rgba(0,0,0,0.6)',
        }}>
          {/* Etiqueta croupier */}
          <div style={{
            position:     'absolute',
            top:          '-11px',
            left:         '50%',
            transform:    'translateX(-50%)',
            background:   '#9a7d35',
            color:        '#000',
            padding:      '2px 12px',
            borderRadius: '3px',
            fontSize:     '0.65rem',
            fontWeight:   'bold',
            zIndex:       20,
            letterSpacing: '1.5px',
            boxShadow:    '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            CROUPIER
          </div>
        </div>

        {/* Asientos — escala reducida aplicada a las posiciones via transform */}
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.83)', transformOrigin: 'center center' }}>
          {mesa.asientos.map((asiento, index) => (
            <Asiento
              key={asiento.id_asiento}
              asiento={asiento}
              index={index}
              total={total}
              esHover={asientoHover === asiento.id_asiento}
              isActive={asientoActivo === asiento.id_asiento}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={onClickAsiento}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal selector de pantalla
// ---------------------------------------------------------------------------
const ModalSelectorPantalla = ({ pantallas, cargando, onSeleccionar, onCerrar }) => (
  <div
    onClick={onCerrar}
    style={{
      position:        'fixed',
      inset:           0,
      background:      'rgba(0,0,0,0.75)',
      backdropFilter:  'blur(4px)',
      zIndex:          2000,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background:    '#1a1a1a',
        border:        '1px solid #333',
        borderRadius:  '12px',
        padding:       '30px',
        width:         '380px',
        boxShadow:     '0 20px 60px rgba(0,0,0,0.8)',
      }}
    >
      <h3 style={{ color: '#D4AF37', margin: '0 0 6px 0', fontSize: '1.1rem' }}>
        En que pantalla mostrar
      </h3>
      <p style={{ color: '#666', fontSize: '0.8rem', margin: '0 0 22px 0' }}>
        Selecciona la pantalla donde quieres abrir la vista de jugadores.
      </p>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#555' }}>Detectando pantallas...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pantallas.map((p, i) => (
            <button
              key={i}
              onClick={() => onSeleccionar(p)}
              style={{
                background:     '#222',
                border:         '1px solid #333',
                borderRadius:   '8px',
                padding:        '14px 18px',
                color:          'white',
                cursor:         'pointer',
                textAlign:      'left',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                transition:     'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.background = '#2a2a2a' }}
              onMouseOut={(e)  => { e.currentTarget.style.borderColor = '#333';    e.currentTarget.style.background = '#222' }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>{p.width} x {p.height} px</div>
              </div>
              {p.isPrimary && (
                <span style={{ fontSize: '0.65rem', color: '#D4AF37', border: '1px solid #D4AF37', padding: '2px 8px', borderRadius: '4px' }}>
                  Principal
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onCerrar}
        style={{
          marginTop:    '20px',
          width:        '100%',
          background:   'transparent',
          border:       '1px solid #333',
          color:        '#666',
          padding:      '10px',
          borderRadius: '6px',
          cursor:       'pointer',
          fontSize:     '0.85rem',
        }}
      >
        Cancelar
      </button>
    </div>
  </div>
)

// ---------------------------------------------------------------------------
// Componente principal SeccionMesas
// ---------------------------------------------------------------------------
const SeccionMesas = ({ idTorneo, jugadores }) => {
  const queryClient = useQueryClient()

  // Estado local UI
  const [asientoActivo,         setAsientoActivo]         = useState(null)
  const [asientoHover,          setAsientoHover]          = useState(null)
  const [mostrarSelector,       setMostrarSelector]       = useState(false)
  const [pantallas,             setPantallas]             = useState([])
  const [cargandoPantallas,     setCargandoPantallas]     = useState(false)
  const [visualAbierta,         setVisualAbierta]         = useState(false)
  const ventanaVisual = useRef(null)

  const jugadoresActivos = (jugadores ?? []).filter((j) => j.estado !== 'ELIMINADO').length

  // ── Query principal ───────────────────────────────────────────────────────
  const { data: mesas = [], isLoading, isError } = useQuery({
    queryKey: ['mesas', idTorneo],
    queryFn:  () => api.get(`/mesas/torneo/${idTorneo}`).then((r) => r.data.datos),
    staleTime: 5_000,
    refetchInterval: 10_000,
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['mesas', idTorneo] })
    queryClient.invalidateQueries({ queryKey: ['control-torneo', idTorneo] })
  }

  // ── Mutaciones ────────────────────────────────────────────────────────────
  const mutCrear = useMutation({
    mutationFn: () => api.post('/mesas', { idTorneo }),
    onSuccess:  invalidar,
  })

  const mutEliminar = useMutation({
    mutationFn: (idMesa) => api.delete(`/mesas/${idMesa}`),
    onSuccess:  invalidar,
    onError:    (err) => alert(err.response?.data?.mensaje ?? 'Error al eliminar la mesa'),
  })

  const mutAgregarAsiento = useMutation({
    mutationFn: (idMesa) => api.post(`/mesas/${idMesa}/asiento`),
    onSuccess:  invalidar,
  })

  const mutQuitarAsiento = useMutation({
    mutationFn: (idMesa) => api.delete(`/mesas/${idMesa}/asiento`),
    onSuccess:  invalidar,
    onError:    (err) => alert(err.response?.data?.mensaje ?? 'Error al quitar asiento'),
  })

  const mutMover = useMutation({
    mutationFn: (body) => api.put('/mesas/mover-jugador', body),
    onSuccess:  invalidar,
    onError:    (err) => alert(err.response?.data?.mensaje ?? 'Error al mover jugador'),
  })

  // ── Handlers de mesa ─────────────────────────────────────────────────────
  const handleEliminarMesa = (idMesa, numeroMesa, asientos) => {
    const ocupados = asientos.filter((a) => a.id_inscripcion).length
    if (ocupados > 0) {
      alert(`La MESA ${numeroMesa} tiene ${ocupados} jugador(es) sentado(s). Muevelos antes de eliminar.`)
      return
    }
    if (!window.confirm(`Eliminar la MESA ${numeroMesa}?`)) return
    mutEliminar.mutate(idMesa)
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragStart = (e, idInscripcion, idAsientoOrigen) => {
    setAsientoActivo(null)
    e.dataTransfer.setData('idInscripcion', String(idInscripcion))
    e.dataTransfer.setData('idAsientoOrigen', String(idAsientoOrigen))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, asientoOcupado, idAsiento) => {
    e.preventDefault()
    if (!asientoOcupado) {
      e.dataTransfer.dropEffect = 'move'
      setAsientoHover(idAsiento)
    }
  }

  const handleDragLeave = () => setAsientoHover(null)

  const handleDrop = (e, idAsientoDestino, asientoOcupado) => {
    e.preventDefault()
    setAsientoHover(null)
    if (asientoOcupado) return

    const idInscripcion   = Number(e.dataTransfer.getData('idInscripcion'))
    const idAsientoOrigen = Number(e.dataTransfer.getData('idAsientoOrigen'))

    if (!idInscripcion || idAsientoOrigen === idAsientoDestino) return

    mutMover.mutate({
      id_inscripcion:     idInscripcion,
      id_asiento_origen:  idAsientoOrigen,
      id_asiento_destino: idAsientoDestino,
    })
  }

  const handleClickAsiento = (idAsiento) => {
    setAsientoActivo((prev) => (prev === idAsiento ? null : idAsiento))
  }

  // ── Pantalla visual ───────────────────────────────────────────────────────
  const abrirSelectorPantalla = async () => {
    setCargandoPantallas(true)
    setMostrarSelector(true)

    try {
      if ('getScreenDetails' in window) {
        const details = await window.getScreenDetails()
        setPantallas(details.screens.map((s, i) => ({
          label:     s.label || `Pantalla ${i + 1}`,
          left:      s.left,
          top:       s.top,
          width:     s.width,
          height:    s.height,
          isPrimary: s.isPrimary,
        })))
      } else {
        setPantallas([{
          label:     'Pantalla principal',
          left:      window.screen.availLeft || 0,
          top:       window.screen.availTop  || 0,
          width:     window.screen.width,
          height:    window.screen.height,
          isPrimary: true,
        }])
      }
    } catch {
      setPantallas([{
        label:     'Pantalla principal',
        left:      0,
        top:       0,
        width:     window.screen.width,
        height:    window.screen.height,
        isPrimary: true,
      }])
    }

    setCargandoPantallas(false)
  }

  const abrirEnPantalla = (pantalla) => {
    const url      = `/visual/${idTorneo}`
    const features = [
      `left=${pantalla.left}`,
      `top=${pantalla.top}`,
      `width=${pantalla.width}`,
      `height=${pantalla.height}`,
      'toolbar=no',
      'menubar=no',
      'scrollbars=no',
      'resizable=yes',
    ].join(',')

    const win = window.open(url, `visual_torneo_${idTorneo}`, features)
    ventanaVisual.current = win
    setVisualAbierta(true)
    setMostrarSelector(false)

    const check = setInterval(() => {
      if (win && win.closed) {
        setVisualAbierta(false)
        ventanaVisual.current = null
        clearInterval(check)
      }
    }, 1_000)
  }

  const cerrarVisual = () => {
    if (ventanaVisual.current && !ventanaVisual.current.closed) {
      ventanaVisual.current.close()
    }
    ventanaVisual.current = null
    setVisualAbierta(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      onClick={() => setAsientoActivo(null)}
    >
      {/* Modal selector de pantalla */}
      {mostrarSelector && (
        <ModalSelectorPantalla
          pantallas={pantallas}
          cargando={cargandoPantallas}
          onSeleccionar={abrirEnPantalla}
          onCerrar={() => setMostrarSelector(false)}
        />
      )}

      {/* Cabecera seccion */}
      <div
        className="flex items-center justify-between pb-3 mb-4 shrink-0"
        style={{ borderBottom: '1px solid #1e1e1e' }}
      >
        {/* Titulo */}
        <h2
          className="text-[1.1rem] font-black uppercase tracking-[4px]"
          style={{ color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.35)', margin: 0 }}
        >
          Mesas
          <span style={{ color: '#555', fontSize: '0.9rem', marginLeft: '10px', fontWeight: 400 }}>
            ({mesas.length})
          </span>
        </h2>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2">
          {/* Boton nueva mesa */}
          <button
            onClick={(e) => { e.stopPropagation(); mutCrear.mutate() }}
            disabled={mutCrear.isPending}
            className="flex items-center gap-1"
            style={{
              background:    mutCrear.isPending ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.08)',
              border:        `1px solid ${mutCrear.isPending ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.25)'}`,
              color:         mutCrear.isPending ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.75)',
              padding:       '4px 10px',
              borderRadius:  '6px',
              fontSize:      '0.66rem',
              fontWeight:    '500',
              cursor:        mutCrear.isPending ? 'not-allowed' : 'pointer',
              transition:    'all 0.15s',
            }}
            onMouseOver={(e) => {
              if (!mutCrear.isPending) {
                e.currentTarget.style.background  = 'rgba(34,197,94,0.14)'
                e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'
                e.currentTarget.style.color       = '#22c55e'
              }
            }}
            onMouseOut={(e) => {
              if (!mutCrear.isPending) {
                e.currentTarget.style.background  = 'rgba(34,197,94,0.08)'
                e.currentTarget.style.borderColor = 'rgba(34,197,94,0.25)'
                e.currentTarget.style.color       = 'rgba(34,197,94,0.75)'
              }
            }}
          >
            {mutCrear.isPending ? 'Creando...' : '+ Mesa'}
          </button>

          {/* Divisor */}
          <div style={{ width: '1px', height: '18px', background: '#252525' }} />

          {/* Boton mostrar/cerrar pantalla visual */}
          <button
            onClick={(e) => { e.stopPropagation(); visualAbierta ? cerrarVisual() : abrirSelectorPantalla() }}
            style={{
              background:    visualAbierta ? 'rgba(255,82,82,0.08)' : 'transparent',
              border:        `1px solid ${visualAbierta ? '#ff5252' : '#333'}`,
              color:         visualAbierta ? '#ff5252' : '#666',
              padding:       '5px 12px',
              borderRadius:  '5px',
              fontSize:      '0.72rem',
              fontWeight:    '500',
              cursor:        'pointer',
              letterSpacing: '0.5px',
              display:       'flex',
              alignItems:    'center',
              gap:           '6px',
              transition:    'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = visualAbierta ? '#ff7070' : '#555'
              e.currentTarget.style.color       = visualAbierta ? '#ff7070' : '#aaa'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = visualAbierta ? '#ff5252' : '#333'
              e.currentTarget.style.color       = visualAbierta ? '#ff5252' : '#666'
            }}
          >
            {visualAbierta ? <FiXCircle size={12} /> : <FiMonitor size={12} />}
            {visualAbierta ? 'Cerrar Muestra' : 'Mostrar'}
          </button>
        </div>
      </div>

      {/* Contenido */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center text-dreams-text-muted text-sm">
          Cargando mesas...
        </div>
      )}

      {isError && (
        <div className="flex flex-1 items-center justify-center text-red-400 text-sm">
          Error al cargar las mesas.
        </div>
      )}

      {!isLoading && !isError && mesas.length === 0 && (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
          style={{ border: '1px dashed #2a2a2a', borderRadius: '10px', padding: '60px' }}
        >
          <p className="text-dreams-text-muted text-sm">
            No hay mesas creadas. Presiona <strong style={{ color: '#D4AF37' }}>Nueva Mesa</strong> para abrir la primera.
          </p>
          {jugadoresActivos > 0 && (
            <p className="text-dreams-text-muted text-xs">
              {jugadoresActivos} jugador(es) activo(s) sin asignacion de mesa.
            </p>
          )}
        </div>
      )}

      {!isLoading && !isError && mesas.length > 0 && (
        <div
          className="flex-1 overflow-y-auto"
          style={{ paddingRight: '6px' }}
        >
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap:                 '24px',
              paddingBottom:       '24px',
            }}
          >
            {mesas.map((mesa) => (
              <TarjetaMesa
                key={mesa.id_mesa}
                mesa={mesa}
                asientoActivo={asientoActivo}
                asientoHover={asientoHover}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClickAsiento={handleClickAsiento}
                onAgregarAsiento={(id) => mutAgregarAsiento.mutate(id)}
                onQuitarAsiento={(id) => mutQuitarAsiento.mutate(id)}
                onEliminarMesa={handleEliminarMesa}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SeccionMesas
