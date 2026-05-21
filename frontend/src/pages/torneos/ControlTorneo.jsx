import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiPlay, FiPause, FiSkipForward, FiUsers, FiGrid, FiList, FiAward, FiShield, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import api from '../../services/api'
import { conectarSocket, obtenerSocket } from '../../services/socket'
import useTorneoStore from '../../store/torneo.store'
import useAuthStore from '../../store/auth.store'
import SeccionJugadores from './secciones/SeccionJugadores'
import SeccionMesas from './secciones/SeccionMesas'
import SeccionEstructura from './secciones/SeccionEstructura'
import SeccionPremios from './secciones/SeccionPremios'
import SeccionStaff from './secciones/SeccionStaff'
import logo from '../../assets/logo.png'

const pad = (n) => String(Math.max(0, n)).padStart(2, '0')

const obtenerIniciales = (nombreCompleto) => {
  if (!nombreCompleto) return '--'
  const partes = nombreCompleto.trim().split(' ').filter(Boolean)
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}
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
            className="font-mono font-black leading-none text-[42px] text-dreams-gold tracking-[0.12em]"
            style={{ textShadow: '0 0 40px rgba(212,175,55,0.5), 0 0 80px rgba(212,175,55,0.2)' }}
          >
            {parte}
          </span>
          {i < partes.length - 1 && (
            <span className="font-black text-[30px] leading-none text-[#4a3e18] mx-0.5">:</span>
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
  const [colapsado, setColapsado] = useState(false)

  const usuario        = useAuthStore(s => s.usuario)
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
  const segundosTorneo = useTorneoStore(s => s.segundosTorneo)

  const setTorneoActivo      = useTorneoStore(s => s.setTorneoActivo)
  const setEstadoTorneo      = useTorneoStore(s => s.setEstadoTorneo)
  const setJugadores         = useTorneoStore(s => s.setJugadores)
  const setContadores        = useTorneoStore(s => s.setContadores)
  const setSeccionActiva     = useTorneoStore(s => s.setSeccionActiva)
  const setSegundosTorneo    = useTorneoStore(s => s.setSegundosTorneo)
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

  useEffect(() => {
    if (!datosControl) return
    const { torneo, pozo_total, contador_rebuy, contador_addon, reloj: relojInicial } = datosControl
    const nivelesRaw = torneo.poker?.niveles ?? []
    const niveles = [...nivelesRaw].sort((a, b) => {
      const oa = a.orden ?? a.id_nivel
      const ob = b.orden ?? b.id_nivel
      return oa - ob
    })
    nivelesRef.current = niveles
    setTorneoActivo(torneo)
    setEstadoTorneo(torneo.estado)
    setJugadores(torneo.inscripciones ?? [])
    setContadores({ pozoTotal: pozo_total, contadorRebuy: contador_rebuy, contadorAddon: contador_addon })
    const nivel = niveles[relojInicial.nivelIndex] ?? null

    const sinIniciarAun = ['BORRADOR', 'REGISTRO'].includes(torneo.estado)

    aplicarRelojIniciado(
      {
        nivelIndex: relojInicial.nivelIndex,
        segundosRestantes: relojInicial.segundosRestantes,
        nivel,
        total: nivel?.tiempo_segundos ?? 0,
        // El backend calcula y devuelve segundosTorneo; si el torneo no inicio aun, vale 0
        segundosTorneo: sinIniciarAun ? 0 : (relojInicial.segundosTorneo ?? 0),
      },
      niveles
    )
  }, [datosControl])

  useEffect(() => {
    const socket = conectarSocket()
    socket.emit('unirse:torneo', idTorneo)
    socket.emit('reloj:estado', { idTorneo })
    socket.on('reloj:estado_respuesta', ({ activo, nivelIndex, segundosRestantes, nivel, total, segundosTorneo }) => {
      if (activo) {
        aplicarRelojIniciado({ nivelIndex, segundosRestantes, nivel, total, segundosTorneo }, nivelesRef.current)
        setEstadoTorneo('EN_JUEGO')
      } else if (segundosTorneo != null) {
        // Torneo pausado: restaurar el tiempo acumulado que manda el backend
        setSegundosTorneo(segundosTorneo)
      }
    })
    socket.on('reloj:tick',         (d) => aplicarTick(d))
    socket.on('reloj:iniciado',     (d) => { aplicarRelojIniciado(d, nivelesRef.current); setEstadoTorneo('EN_JUEGO') })
    socket.on('reloj:cambio_nivel', (d) => aplicarCambioNivel(d, nivelesRef.current))
    socket.on('reloj:pausado',      (d) => { aplicarRelojPausado(d); setEstadoTorneo('PAUSADO') })
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

  // Ordenar por campo orden (si existe) y luego por id_nivel como tiebreaker
  const nivelesRaw = torneoActivo.poker?.niveles ?? []
  const niveles = [...nivelesRaw].sort((a, b) => {
    const oa = a.orden ?? a.id_nivel
    const ob = b.orden ?? b.id_nivel
    return oa - ob
  })
  const jugadoresActivos = jugadores.filter(j => j.estado !== 'ELIMINADO').length
  const enJuego    = estadoTorneo === 'EN_JUEGO'
  const pausado    = estadoTorneo === 'PAUSADO'
  const sinIniciar = ['BORRADOR', 'REGISTRO'].includes(estadoTorneo)
  // Calcular cuantos segundos faltan para el proximo break:
  // segundos restantes del nivel actual + suma de duraciones de los niveles intermedios
  const idxActual = reloj.nivelIndex ?? 0
  const nivelesPostActual = niveles.slice(idxActual + 1)
  const idxBreakRelativo = nivelesPostActual.findIndex(n => n.tipo === 'BREAK')
  const proximoBreak = idxBreakRelativo >= 0 ? nivelesPostActual[idxBreakRelativo] : null
  const segundosHastaBreak = proximoBreak
    ? (sinIniciar ? 0 : reloj.segundosRestantes) +
      nivelesPostActual.slice(0, idxBreakRelativo).reduce((acc, n) => acc + (n.tiempo_segundos ?? 0), 0)
    : null

  const segundosAcumulados = sinIniciar ? 0 : segundosTorneo

  const ComponenteSeccion = {
    jugadores:  SeccionJugadores,
    mesas:      SeccionMesas,
    estructura: SeccionEstructura,
    premios:    SeccionPremios,
    staff:      SeccionStaff,
  }[seccionActiva] ?? SeccionJugadores

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0a0a0a] font-sans">

      {/* SIDEBAR */}
      <aside
        className="relative shrink-0 flex flex-col transition-all duration-[250ms]"
        style={{
          width: colapsado ? '64px' : '240px',
          background: 'linear-gradient(180deg, #111111 0%, #0d0d0d 100%)',
          borderRight: '1px solid #252525',
          boxShadow: '2px 0 16px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div className="flex min-h-[80px] items-center justify-center px-4 py-5 border-b border-[#222]">
          <img
            src={logo}
            alt="Casino Dreams"
            className="object-contain transition-all duration-[250ms]"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.3))',
              height: colapsado ? '36px' : '72px',
              width: colapsado ? '36px' : '160px',
            }}
          />
        </div>

        {/* Navegacion */}
        <nav className="flex-1 py-2">
          {SECCIONES.map(({ id: secId, label, Icono }, i) => {
            const activo = seccionActiva === secId
            return (
              <div key={secId}>
                <button
                  onClick={() => setSeccionActiva(secId)}
                  title={colapsado ? label : undefined}
                  className="relative w-full flex items-center justify-center transition-all duration-150"
                  style={{
                    flexDirection: colapsado ? 'row' : 'column',
                    gap: colapsado ? 0 : '8px',
                    padding: colapsado ? '18px 0' : '16px 8px',
                    ...(activo
                      ? { background: 'linear-gradient(90deg, rgba(212,175,55,0.08) 0%, transparent 100%)', borderLeft: '2px solid #D4AF37', color: '#D4AF37' }
                      : { borderLeft: '2px solid transparent', color: '#555' })
                  }}
                  onMouseEnter={e => { if (!activo) { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' } }}
                  onMouseLeave={e => { if (!activo) { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent' } }}
                >
                  <Icono size={20} className="shrink-0" />
                  {!colapsado && (
                    <span className="text-[0.7rem] uppercase tracking-[1px] font-semibold">{label}</span>
                  )}
                  {activo && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-l bg-[rgba(212,175,55,0.3)]" />
                  )}
                </button>
                {i < SECCIONES.length - 1 && (
                  <div className="mx-3 h-px bg-[rgba(255,255,255,0.03)]" />
                )}
              </div>
            )
          })}
        </nav>

        {/* Botones inferiores */}
        <div className={`flex flex-col gap-2 border-t border-[#222] ${colapsado ? 'p-2' : 'p-3'}`}>
          <button
            onClick={() => { if (window.confirm('Finalizar el torneo definitivamente?')) console.log('finalizar') }}
            title="Finalizar Torneo"
            className="w-full flex items-center justify-center gap-2 rounded text-xs font-bold uppercase tracking-[1px] transition-all duration-150 cursor-pointer border border-[#b71c1c] text-white py-[10px] px-2"
            style={{ background: 'linear-gradient(135deg, #8B0000, #b71c1c)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #b71c1c, #c62828)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #8B0000, #b71c1c)' }}
          >
            {!colapsado ? 'Finalizar Torneo' : <FiShield size={16} />}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            title="Salir al Panel"
            className="w-full flex items-center justify-center gap-2 rounded text-xs font-bold uppercase tracking-[1px] transition-all duration-150 cursor-pointer border border-[#2a2a2a] text-[#555] bg-white/[0.03] py-[10px] px-2"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#888' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#555' }}
          >
            {!colapsado ? 'Salir al Panel' : <FiChevronRight size={16} />}
          </button>
        </div>
      </aside>

      {/* Boton toggle sidebar */}
      <button
        onClick={() => setColapsado(!colapsado)}
        className="absolute top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-[#444] bg-[#1a1a1a] text-[#888] cursor-pointer transition-[left] duration-[250ms]"
        style={{ left: colapsado ? '52px' : '228px' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.borderColor = '#D4AF37' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#444' }}
        title={colapsado ? 'Expandir' : 'Colapsar'}
      >
        {colapsado ? <FiChevronRight size={13} /> : <FiChevronLeft size={13} />}
      </button>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* HEADER */}
        <header
          className="relative shrink-0 flex items-center justify-between px-6 py-[10px] border-b border-[#1e1e1e]"
          style={{ background: 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)' }}
        >
          <span className="z-[2] font-mono text-[1.2rem] tracking-[1px] text-dreams-gold">
            <HoraActual />
          </span>
          <h1 className="absolute left-1/2 -translate-x-1/2 m-0 text-[1.4rem] font-normal tracking-[3px] uppercase text-[#d0d0d0]">
            Control de Torneo <span className="text-dreams-gold">•</span> {torneoActivo.nombre}
          </h1>
          <div className="z-[2] flex items-center gap-3">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-sm font-medium text-[#cccccc] whitespace-nowrap">{usuario?.nombre ?? '—'}</span>
              <span className="text-[0.625rem] uppercase tracking-[2px] text-[#888888]">{usuario?.rol ?? ''}</span>
            </div>
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-dreams-gold bg-[#1f1a0a]">
              <span className="text-[11px] font-semibold tracking-[1px] text-dreams-gold">
                {obtenerIniciales(usuario?.nombre)}
              </span>
            </div>
          </div>
        </header>

        {/* TARJETAS SUPERIORES */}
        <div
          className="flex shrink-0 gap-3 px-4 py-3 border-b border-[#1a1a1a]"
          style={{ height: '155px', minHeight: '155px', background: 'linear-gradient(180deg, #0a0a0a 0%, #070707 100%)' }}
        >
          {/* Pozo Total */}
          <div
            className="flex w-[220px] shrink-0 flex-col items-center justify-center rounded-lg px-6 py-4 border border-[rgba(212,175,55,0.18)]"
            style={{
              background: 'linear-gradient(145deg, #131308 0%, #0e0e07 100%)',
              boxShadow: '0 0 20px rgba(212,175,55,0.05), inset 0 1px 0 rgba(212,175,55,0.07)',
            }}
          >
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[2px] text-[#7a6a2a]">Pozo Total</p>
            <p
              className="text-[2rem] font-black leading-none text-dreams-gold"
              style={{ textShadow: '0 0 24px rgba(212,175,55,0.5)' }}
            >
              {formatearMoneda(pozoTotal)}
            </p>
          </div>

          {/* Reloj central */}
          <div
            className="relative flex flex-1 flex-col items-center justify-center rounded-lg px-6 py-4 border border-[#1e1e1e]"
            style={{
              background: 'linear-gradient(145deg, #080808 0%, #050505 100%)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.02)',
            }}
          >
            {/* Boton control */}
            <div className="absolute top-3 right-3">
              {sinIniciar && (
                <button
                  onClick={() => emitir('reloj:iniciar', { idTorneo })}
                  className="flex items-center gap-1.5 rounded px-[18px] py-2 text-xs font-bold uppercase tracking-[1px] text-white border border-[#4caf50] transition-all duration-150"
                  style={{ background: 'linear-gradient(135deg, #2e7d32, #4caf50)', boxShadow: '0 2px 10px rgba(22,163,74,0.4)' }}
                >
                  <FiPlay size={11} className="mr-1" /> Iniciar Reloj
                </button>
              )}
              {enJuego && (
                <button
                  onClick={() => emitir('reloj:pausar', { idTorneo })}
                  className="flex items-center gap-1.5 rounded px-[18px] py-2 text-xs font-bold uppercase tracking-[1px] text-[#fca5a5] border border-[#b71c1c] transition-all duration-150 bg-[rgba(139,0,0,0.5)]"
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(183,28,28,0.7)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,0,0,0.5)' }}
                >
                  <FiPause size={11} className="mr-1" /> Pausar Reloj
                </button>
              )}
              {pausado && (
                <button
                  onClick={() => emitir('reloj:reanudar', { idTorneo })}
                  className="flex items-center gap-1.5 rounded px-[18px] py-2 text-xs font-bold uppercase tracking-[1px] text-white border border-[#4caf50] transition-all duration-150"
                  style={{ background: 'linear-gradient(135deg, #2e7d32, #4caf50)', boxShadow: '0 2px 10px rgba(22,163,74,0.4)' }}
                >
                  <FiPlay size={11} className="mr-1" /> Reanudar Reloj
                </button>
              )}
            </div>
            <p className="mb-[10px] text-[0.7rem] font-semibold uppercase tracking-[3px] text-[#3a3a3a]">Tiempo Torneo</p>
            <RelojDigital segundos={segundosAcumulados} />
          </div>

          {/* Restante Ciega */}
          <div
            className="flex w-[220px] shrink-0 flex-col items-center justify-center rounded-lg px-6 py-4 border border-[#1e1e1e]"
            style={{
              background: 'linear-gradient(145deg, #0c0c0c 0%, #090909 100%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)',
            }}
          >
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[2px] text-[#484848]">
              Restante {nivelActual?.tipo === 'BREAK' ? '(BREAK)' : '(CIEGA)'}
            </p>
            <p
              className={`font-mono text-[2.2rem] font-black leading-none tracking-[0.06em] ${nivelActual?.tipo === 'BREAK' ? 'text-[#ff5252]' : 'text-[#e8e8e8]'}`}
            >
              {formatearCiega(sinIniciar
                ? (nivelActual?.tiempo_segundos ?? reloj.segundosRestantes)
                : reloj.segundosRestantes
              )}
            </p>
            <div className="mt-[10px] w-full h-1 overflow-hidden rounded-sm bg-[#181818]">
              <div
                className="h-full rounded-sm transition-[width] duration-1000 ease-linear"
                style={{
                  width: sinIniciar ? '100%' : `${reloj.total > 0 ? Math.min(100, (reloj.segundosRestantes / reloj.total) * 100) : 0}%`,
                  background: nivelActual?.tipo === 'BREAK' ? '#ff5252' : 'linear-gradient(90deg, #D4AF37, #FDD835)',
                  boxShadow: '0 0 6px rgba(212,175,55,0.6)',
                }}
              />
            </div>
            <div className="mt-2 flex w-full items-center justify-between">
              <span className="text-[0.8rem] text-[#555]">
                {nivelActual?.tipo === 'BREAK' ? 'BREAK' : nivelActual ? `NIVEL ${nivelActual.numero_nivel}` : '—'}
              </span>
              {!sinIniciar && (
                <button
                  onClick={() => emitir('nivel:avanzar', { idTorneo })}
                  className="flex items-center gap-1 rounded border border-[#252525] bg-white/[0.03] px-[10px] py-[3px] text-[0.8rem] font-semibold text-[#555] transition-all duration-150 cursor-pointer"
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.background = 'rgba(212,175,55,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#252525'; e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                >
                  Siguiente <FiSkipForward size={10} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FILA STATS */}
        <div
          className="flex shrink-0 gap-3 px-4 py-[10px] border-b border-[#161616] bg-[#060606]"
          style={{ height: '108px', minHeight: '108px' }}
        >
          {/* Re Buy / Add On */}
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-white/[0.02] px-3 py-[14px] h-full">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[2px] text-[#404040]">Re Buy / Add On</p>
            <p className="text-[1.6rem] font-bold leading-none text-white">
              {contadorRebuy} <span className="text-[#333]">/</span> {contadorAddon}
            </p>
          </div>

          {/* Jugadores */}
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-white/[0.02] px-3 py-[14px] h-full">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[2px] text-[#404040]">Jugadores</p>
            <p className="text-[1.6rem] font-bold leading-none text-white">
              {jugadoresActivos} <span className="text-[#333]">/</span> {torneoActivo.capacidad_maxima ?? jugadores.length}
            </p>
          </div>

          {/* Nivel Actual */}
          <div
            className="flex flex-1 flex-col items-center justify-center rounded-lg border border-[rgba(212,175,55,0.2)] px-3 py-[14px] h-full"
            style={{ background: 'linear-gradient(145deg, #131308 0%, #0e0e07 100%)', boxShadow: '0 0 20px rgba(212,175,55,0.05)' }}
          >
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[2px] text-[#5a4a18]">Nivel Actual</p>
            {nivelActual?.tipo === 'NIVEL' ? (
              <div className="text-center">
                <p className="text-[1.6rem] font-bold leading-none text-dreams-gold">
                  {nivelActual.sb.toLocaleString()} / {nivelActual.bb.toLocaleString()}
                </p>
                <p className="mt-1 text-[0.8rem] text-[#666]">
                  ANTE: <span className="text-[1.2rem] font-bold text-dreams-gold">{nivelActual.ante}</span>
                </p>
              </div>
            ) : nivelActual?.tipo === 'BREAK' ? (
              <p className="text-[1.6rem] font-bold text-[#f87171]">EN PAUSA</p>
            ) : (
              <p className="text-[2.2rem] font-bold text-[#2a2a2a]">&mdash;</p>
            )}
          </div>

          {/* Proximo Nivel */}
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-white/[0.02] px-3 py-[14px] h-full">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[2px] text-[#404040]">Proximo Nivel</p>
            {siguienteNivel?.tipo === 'NIVEL' ? (
              <div className="text-center">
                <p className="text-[1.6rem] font-bold leading-none text-white">
                  {siguienteNivel.sb.toLocaleString()} / {siguienteNivel.bb.toLocaleString()}
                </p>
                <p className="mt-1 text-[0.8rem] text-[#666]">
                  ANTE: <span className="text-[1.2rem] font-bold text-white">{siguienteNivel.ante}</span>
                </p>
              </div>
            ) : siguienteNivel?.tipo === 'BREAK' ? (
              <p className="text-[1.6rem] font-bold text-[#f87171]">BREAK</p>
            ) : (
              <p className="text-[2.2rem] font-bold text-[#2a2a2a]">&mdash;</p>
            )}
          </div>

          {/* Proximo Break */}
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-[#1e1e1e] bg-white/[0.02] px-3 py-[14px] h-full">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[2px] text-[#404040]">Proximo Break</p>
            {segundosHastaBreak != null ? (
              <p className="font-mono text-[1.6rem] font-bold leading-none text-white">
                {formatearCiega(segundosHastaBreak)}
              </p>
            ) : (
              <p className="text-[2.2rem] font-bold text-[#2a2a2a]">&mdash;</p>
            )}
          </div>
        </div>

        {/* AREA CONTENIDO */}
        <main className="flex flex-col flex-1 overflow-y-auto bg-[#111] p-4">
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