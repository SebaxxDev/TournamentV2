import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiUsers, FiGrid, FiList, FiAward, FiShield } from 'react-icons/fi'
import api from '../../services/api'
import { conectarSocket, desconectarSocket, obtenerSocket } from '../../services/socket'
import useTorneoStore from '../../store/torneo.store'
import SeccionJugadores from './secciones/SeccionJugadores'
import SeccionMesas from './secciones/SeccionMesas'
import SeccionEstructura from './secciones/SeccionEstructura'
import SeccionPremios from './secciones/SeccionPremios'
import SeccionStaff from './secciones/SeccionStaff'

const pad = (n) => String(Math.max(0, n)).padStart(2, '0')
const formatearTiempo = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
const formatearCiega = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
const formatearMoneda = (v) => '$' + Math.round(v ?? 0).toLocaleString('es-CL')

const SECCIONES = [
  { id: 'jugadores',  label: 'Jugadores',  Icono: FiUsers },
  { id: 'mesas',      label: 'Mesas',      Icono: FiGrid },
  { id: 'estructura', label: 'Estructura', Icono: FiList },
  { id: 'premios',    label: 'Premios',    Icono: FiAward },
  { id: 'staff',      label: 'Staff',      Icono: FiShield },
]

function HoraActual() {
  const [hora, setHora] = useState(() => new Date().toLocaleTimeString('es-CL'))
  useEffect(() => {
    const t = setInterval(() => setHora(new Date().toLocaleTimeString('es-CL')), 1000)
    return () => clearInterval(t)
  }, [])
  return hora
}

function RelojDigital({ segundos }) {
  const partes = formatearTiempo(segundos).split(':')
  return (
    <div className="flex items-center justify-center gap-3">
      {partes.map((parte, i) => (
        <span key={i} className="flex items-center gap-3">
          <span
            className="text-white font-mono font-black leading-none"
            style={{ fontSize: '72px', textShadow: '0 0 30px rgba(212,175,55,0.3)' }}
          >
            {parte}
          </span>
          {i < partes.length - 1 && (
            <span className="text-dreams-gold font-black" style={{ fontSize: '60px', lineHeight: 1 }}>:</span>
          )}
        </span>
      ))}
    </div>
  )
}

export default function ControlTorneo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const idTorneo = Number(id)
  const nivelesRef = useRef([])

  const torneoActivo   = useTorneoStore(s => s.torneoActivo)
  const estadoTorneo   = useTorneoStore(s => s.estadoTorneo)
  const reloj          = useTorneoStore(s => s.reloj)
  const nivelActual    = useTorneoStore(s => s.nivelActual)
  const siguienteNivel = useTorneoStore(s => s.siguienteNivel)
  const jugadores      = useTorneoStore(s => s.jugadores)
  const pozoTotal      = useTorneoStore(s => s.pozoTotal)
  const contadorRebuy  = useTorneoStore(s => s.contadorRebuy)
  const contadorAddon  = useTorneoStore(s => s.contadorAddon)
  const seccionActiva  = useTorneoStore(s => s.seccionActiva)

  const setTorneoActivo      = useTorneoStore(s => s.setTorneoActivo)
  const setEstadoTorneo      = useTorneoStore(s => s.setEstadoTorneo)
  const setJugadores         = useTorneoStore(s => s.setJugadores)
  const setContadores        = useTorneoStore(s => s.setContadores)
  const setSeccionActiva     = useTorneoStore(s => s.setSeccionActiva)
  const aplicarTick          = useTorneoStore(s => s.aplicarTick)
  const aplicarRelojIniciado = useTorneoStore(s => s.aplicarRelojIniciado)
  const aplicarCambioNivel   = useTorneoStore(s => s.aplicarCambioNivel)
  const aplicarRelojPausado  = useTorneoStore(s => s.aplicarRelojPausado)
  const limpiarTorneo        = useTorneoStore(s => s.limpiarTorneo)

  const { data: datosControl, isLoading, isError } = useQuery({
    queryKey: ['control-torneo', idTorneo],
    queryFn: () => api.get(`/torneos/${idTorneo}/control`).then(r => r.data.datos),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  // Hidratar el store cuando llegan los datos del query
  useEffect(() => {
    if (!datosControl) return
    const { torneo, pozo_total, contador_rebuy, contador_addon, reloj: relojInicial } = datosControl
    const niveles = torneo.poker?.niveles ?? []
    nivelesRef.current = niveles
    setTorneoActivo(torneo)
    setEstadoTorneo(torneo.estado)
    setJugadores(torneo.inscripciones ?? [])
    setContadores({ pozoTotal: pozo_total, contadorRebuy: contador_rebuy, contadorAddon: contador_addon })
    const nivel = niveles[relojInicial.nivelIndex] ?? null
    aplicarRelojIniciado(
      { nivelIndex: relojInicial.nivelIndex, segundosRestantes: relojInicial.segundosRestantes, nivel, total: nivel?.tiempo_segundos ?? 0 },
      niveles
    )
  }, [datosControl])

  // Conectar socket
  useEffect(() => {
    const socket = conectarSocket()
    socket.emit('unirse:torneo', idTorneo)
    socket.emit('reloj:estado', { idTorneo })

    socket.on('reloj:estado_respuesta', ({ activo, nivelIndex, segundosRestantes, nivel, total }) => {
      if (activo) {
        aplicarRelojIniciado({ nivelIndex, segundosRestantes, nivel, total }, nivelesRef.current)
        setEstadoTorneo('EN_JUEGO')
      }
    })
    socket.on('reloj:tick',         (d) => aplicarTick(d))
    socket.on('reloj:iniciado',     (d) => aplicarRelojIniciado(d, nivelesRef.current))
    socket.on('reloj:cambio_nivel', (d) => aplicarCambioNivel(d, nivelesRef.current))
    socket.on('reloj:pausado',      (d) => aplicarRelojPausado(d))
    socket.on('torneo:estado',      ({ estado }) => setEstadoTorneo(estado))
    socket.on('reloj:fin_niveles',  () => setEstadoTorneo('FINALIZADO'))
    socket.on('reloj:iniciar_confirmado', () => socket.emit('reloj:iniciar', { idTorneo }))

    return () => {
      socket.emit('salir:torneo', idTorneo)
      ;['reloj:estado_respuesta','reloj:tick','reloj:iniciado','reloj:cambio_nivel',
        'reloj:pausado','torneo:estado','reloj:fin_niveles','reloj:iniciar_confirmado'
       ].forEach(e => socket.off(e))
      limpiarTorneo()
    }
  }, [idTorneo])

  const emitir = (evento, payload) => obtenerSocket().emit(evento, payload)

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-dreams-dark text-dreams-text-muted text-sm">
      Cargando torneo...
    </div>
  )
  if (isError || (!isLoading && !datosControl)) return (
    <div className="flex flex-col items-center justify-center h-screen bg-dreams-dark gap-3">
      <p className="text-red-400 text-sm">No se pudo cargar el torneo.</p>
      <button onClick={() => navigate('/dashboard')} className="text-dreams-gold text-sm underline">
        Volver al dashboard
      </button>
    </div>
  )

  if (!torneoActivo) return null

  const niveles = torneoActivo.poker?.niveles ?? []
  const jugadoresActivos = jugadores.filter(j => j.estado !== 'ELIMINADO').length
  const enJuego  = estadoTorneo === 'EN_JUEGO'
  const pausado  = estadoTorneo === 'PAUSADO'
  const sinIniciar = ['BORRADOR', 'REGISTRO'].includes(estadoTorneo)
  const proximoBreak = niveles.slice((reloj.nivelIndex ?? 0) + 1).find(n => n.tipo === 'BREAK')

  const ComponenteSeccion = {
    jugadores:  SeccionJugadores,
    mesas:      SeccionMesas,
    estructura: SeccionEstructura,
    premios:    SeccionPremios,
    staff:      SeccionStaff,
  }[seccionActiva] ?? SeccionJugadores

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* SIDEBAR IZQUIERDO */}
      <aside className="w-36 shrink-0 bg-[#111] border-r border-[#2a2a2a] flex flex-col">
        <div className="px-4 py-5 border-b border-[#2a2a2a]">
          <p className="text-dreams-gold font-bold text-sm tracking-widest text-center">DREAMS</p>
        </div>

        <nav className="flex-1 py-3">
          {SECCIONES.map(({ id: secId, label, Icono }) => (
            <button
              key={secId}
              onClick={() => setSeccionActiva(secId)}
              className={`w-full flex flex-col items-center gap-1.5 py-3 px-2 text-center transition-colors ${
                seccionActiva === secId
                  ? 'bg-[#1a1a1a] text-dreams-gold border-l-2 border-l-dreams-gold'
                  : 'text-[#666] hover:text-[#999] hover:bg-[#1a1a1a]'
              }`}
            >
              <Icono size={18} />
              <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 flex flex-col gap-2 border-t border-[#2a2a2a]">
          <button
            onClick={() => { if (window.confirm('Finalizar el torneo definitivamente?')) console.log('finalizar') }}
            className="w-full py-2 px-1 bg-red-900 hover:bg-red-800 text-red-200 text-[9px] font-bold uppercase tracking-wider rounded transition-colors"
          >
            Finalizar Torneo
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2 px-1 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-[#888] text-[9px] font-bold uppercase tracking-wider rounded transition-colors"
          >
            Salir al Panel
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="shrink-0 bg-[#0d0d0d] border-b border-[#2a2a2a] px-6 py-2 flex items-center justify-between">
          <span className="text-dreams-gold font-mono text-sm">
            <HoraActual />
          </span>
          <h1 className="text-white font-bold tracking-widest uppercase text-sm">
            Control de Torneo &bull; {torneoActivo.nombre}
          </h1>
          <span className="text-[#444] text-xs">{estadoTorneo}</span>
        </header>

        {/* FILA 1: POZO | RELOJ CENTRAL | RESTANTE CIEGA */}
        <div className="shrink-0 grid border-b border-[#2a2a2a]" style={{ gridTemplateColumns: '220px 1fr 260px' }}>

          {/* Pozo total */}
          <div className="border-r border-[#2a2a2a] flex flex-col items-center justify-center py-5 gap-1">
            <p className="text-[10px] uppercase tracking-[2px] text-[#666] font-medium">Pozo Total</p>
            <p className="text-dreams-gold font-black text-3xl">{formatearMoneda(pozoTotal)}</p>
          </div>

          {/* Reloj principal */}
          <div className="flex flex-col items-center justify-center py-4 bg-[#080808]">
            <p className="text-[10px] uppercase tracking-[3px] text-[#555] mb-2 font-medium">Tiempo Torneo</p>
            <RelojDigital segundos={reloj.segundosRestantes} />
            <div className="flex items-center gap-3 mt-3">
              {sinIniciar && (
                <button
                  onClick={() => emitir('reloj:iniciar', { idTorneo })}
                  className="flex items-center gap-2 px-5 py-1.5 rounded bg-green-700 hover:bg-green-600 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <FiPlay size={12} /> Iniciar Reloj
                </button>
              )}
              {enJuego && (
                <button
                  onClick={() => emitir('reloj:pausar', { idTorneo })}
                  className="flex items-center gap-2 px-4 py-1.5 rounded bg-[#222] border border-[#444] hover:border-dreams-gold text-[#aaa] hover:text-dreams-gold text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <FiPause size={12} /> Pausar
                </button>
              )}
              {pausado && (
                <button
                  onClick={() => emitir('reloj:reanudar', { idTorneo })}
                  className="flex items-center gap-2 px-5 py-1.5 rounded bg-green-700 hover:bg-green-600 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <FiPlay size={12} /> Reanudar
                </button>
              )}
              <button
                onClick={() => emitir('nivel:retroceder', { idTorneo })}
                disabled={sinIniciar}
                className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-[#666] hover:text-white hover:border-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Nivel anterior"
              >
                <FiSkipBack size={14} />
              </button>
              <button
                onClick={() => emitir('nivel:avanzar', { idTorneo })}
                disabled={sinIniciar}
                className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-[#666] hover:text-white hover:border-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Siguiente nivel"
              >
                <FiSkipForward size={14} />
              </button>
            </div>
          </div>

          {/* Restante ciega */}
          <div className="border-l border-[#2a2a2a] flex flex-col items-center justify-center py-5 gap-1 px-4">
            <p className="text-[10px] uppercase tracking-[2px] text-[#666] font-medium">Restante (Ciega)</p>
            <p className="text-white font-black" style={{ fontSize: '44px', fontFamily: 'monospace', lineHeight: 1 }}>
              {formatearCiega(reloj.total > 0 ? reloj.segundosRestantes % reloj.total || reloj.segundosRestantes : reloj.segundosRestantes)}
            </p>
            <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-dreams-gold transition-all duration-1000"
                style={{ width: `${reloj.total > 0 ? Math.min(100, (reloj.segundosRestantes / reloj.total) * 100) : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between w-full mt-1">
              <span className="text-[10px] text-[#555] uppercase tracking-wider">
                {nivelActual?.tipo === 'BREAK' ? 'Break' : nivelActual ? `Nivel ${nivelActual.numero_nivel}` : '—'}
              </span>
              {siguienteNivel && (
                <span className="text-[10px] text-dreams-gold uppercase tracking-wider">
                  Siguiente &rsaquo;
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FILA 2: STATS BAR */}
        <div className="shrink-0 grid grid-cols-5 border-b border-[#2a2a2a]">

          <div className="border-r border-[#2a2a2a] flex flex-col items-center justify-center py-3">
            <p className="text-[9px] uppercase tracking-[2px] text-[#555] mb-1">Re Buy / Add On</p>
            <p className="text-white font-bold text-xl">{contadorRebuy} / {contadorAddon}</p>
          </div>

          <div className="border-r border-[#2a2a2a] flex flex-col items-center justify-center py-3">
            <p className="text-[9px] uppercase tracking-[2px] text-[#555] mb-1">Jugadores</p>
            <p className="text-white font-bold text-xl">
              {jugadoresActivos} / {torneoActivo.capacidad_maxima ?? jugadores.length}
            </p>
          </div>

          <div className="border-r border-[#2a2a2a] flex flex-col items-center justify-center py-3">
            <p className="text-[9px] uppercase tracking-[2px] text-[#555] mb-1">Nivel Actual</p>
            {nivelActual?.tipo === 'NIVEL' ? (
              <div className="text-center">
                <p className="text-dreams-gold font-bold text-xl">
                  {nivelActual.sb.toLocaleString()} / {nivelActual.bb.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#555]">ANTE: <span className="text-white">{nivelActual.ante}</span></p>
              </div>
            ) : nivelActual?.tipo === 'BREAK' ? (
              <p className="text-red-400 font-bold text-lg">BREAK</p>
            ) : (
              <p className="text-[#444] font-bold text-xl">—</p>
            )}
          </div>

          <div className="border-r border-[#2a2a2a] flex flex-col items-center justify-center py-3">
            <p className="text-[9px] uppercase tracking-[2px] text-[#555] mb-1">Proximo Nivel</p>
            {siguienteNivel?.tipo === 'NIVEL' ? (
              <div className="text-center">
                <p className="text-white font-bold text-xl">
                  {siguienteNivel.sb.toLocaleString()} / {siguienteNivel.bb.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#555]">ANTE: <span className="text-white">{siguienteNivel.ante}</span></p>
              </div>
            ) : siguienteNivel?.tipo === 'BREAK' ? (
              <p className="text-red-400 font-bold text-lg">BREAK</p>
            ) : (
              <p className="text-[#444] font-bold text-xl">—</p>
            )}
          </div>

          <div className="flex flex-col items-center justify-center py-3">
            <p className="text-[9px] uppercase tracking-[2px] text-[#555] mb-1">Proximo Break</p>
            {proximoBreak ? (
              <p className="text-white font-bold text-xl font-mono">
                {formatearCiega(proximoBreak.tiempo_segundos)}
              </p>
            ) : (
              <p className="text-[#444] font-bold text-xl">—</p>
            )}
          </div>

        </div>

        {/* AREA DE CONTENIDO */}
        <main className="flex-1 overflow-y-auto bg-[#0d0d0d] p-5">
          <ComponenteSeccion
            torneo={torneoActivo}
            jugadores={jugadores}
            niveles={niveles}
            nivelActual={nivelActual}
            idTorneo={idTorneo}
          />
        </main>

      </div>
    </div>
  )
}
