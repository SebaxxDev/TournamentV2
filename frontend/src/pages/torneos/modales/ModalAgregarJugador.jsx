import { useState, useEffect, useRef } from 'react'
import { FiX, FiSearch, FiUser, FiUserPlus, FiAlertCircle, FiCheck } from 'react-icons/fi'
import api from '../../../services/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const obtenerIniciales = (nombre) => {
  if (!nombre) return '--'
  const partes = nombre.trim().split(' ').filter(Boolean)
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// ModalAgregarJugador
// Props:
//   idTorneo         — id del torneo activo
//   torneo           — objeto torneo con poker para saber opciones disponibles
//   onConfirmar      — callback(inscripcion) llamado al inscribir exitosamente
//   onCerrar         — callback para cerrar el modal
// ---------------------------------------------------------------------------
const ModalAgregarJugador = ({ idTorneo, torneo, onConfirmar, onCerrar }) => {
  const poker            = torneo?.poker ?? {}
  const freeChipPermitido = poker.free_chip_permitido ?? false

  const [busqueda, setBusqueda]         = useState('')
  const [resultados, setResultados]     = useState([])
  const [cargando, setCargando]         = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)  // jugador elegido
  const [conFreeChip, setConFreeChip]   = useState(false)
  const [inscribiendo, setInscribiendo] = useState(false)
  const [error, setError]               = useState(null)

  const inputRef    = useRef(null)
  const debounceRef = useRef(null)

  // Foco al abrir
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCerrar])

  // Busqueda con debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!busqueda.trim() || busqueda.trim().length < 2) {
      setResultados([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setCargando(true)
      setError(null)
      try {
        const res = await api.get('/jugadores', {
          params: { busqueda: busqueda.trim(), limite: 8 },
        })
        setResultados(res.data.datos.jugadores ?? [])
      } catch {
        setResultados([])
      } finally {
        setCargando(false)
      }
    }, 300)
  }, [busqueda])

  const seleccionar = (jugador) => {
    setSeleccionado(jugador)
    setError(null)
  }

  const limpiarSeleccion = () => {
    setSeleccionado(null)
    setConFreeChip(false)
    setBusqueda('')
    setResultados([])
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const confirmar = async () => {
    if (!seleccionado) return
    setInscribiendo(true)
    setError(null)
    try {
      const res = await api.post('/inscripciones', {
        id_torneo: idTorneo,
        rut_jugador: seleccionado.rut,
        tiene_free_chip: freeChipPermitido ? conFreeChip : false,
      })
      onConfirmar(res.data.datos.inscripcion)
    } catch (err) {
      const mensaje = err.response?.data?.mensaje ?? 'Error al inscribir al jugador.'
      setError(mensaje)
      setInscribiendo(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div
        className="w-[440px] rounded-xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #161616 0%, #111 100%)',
          border: '1px solid #252525',
          boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1e1e1e', background: 'rgba(255,255,255,0.01)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <FiUserPlus size={13} style={{ color: 'rgba(34,197,94,0.8)' }} />
            </div>
            <p className="text-white text-[0.88rem] font-bold">Agregar Jugador</p>
          </div>
          <button
            onClick={onCerrar}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer"
            style={{ color: '#444', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
          >
            <FiX size={14} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex flex-col gap-4 px-5 py-5 flex-1 min-h-0">

          {/* Si ya hay jugador seleccionado — mostrar confirmacion */}
          {seleccionado ? (
            <div className="flex flex-col gap-4">
              <p className="text-[0.7rem] text-[#444] uppercase tracking-[1.5px] font-semibold">
                Jugador seleccionado
              </p>
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-[11px]"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}
                >
                  {obtenerIniciales(seleccionado.nombre_completo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[0.88rem] font-semibold truncate">{seleccionado.nombre_completo}</p>
                  <p className="text-[#444] text-[0.68rem] font-mono">{seleccionado.rut}</p>
                </div>
                <button
                  onClick={limpiarSeleccion}
                  className="shrink-0 transition-colors cursor-pointer"
                  style={{ color: '#333' }}
                  title="Cambiar jugador"
                  onMouseEnter={e => { e.currentTarget.style.color = '#666' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#333' }}
                >
                  <FiX size={13} />
                </button>
              </div>

              {/* Opciones del torneo — Free Chip */}
              {freeChipPermitido && (
                <button
                  onClick={() => setConFreeChip(v => !v)}
                  className="flex items-center justify-between rounded-lg px-4 py-3 w-full transition-all duration-150 cursor-pointer"
                  style={{
                    background: conFreeChip ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                    border: conFreeChip ? '1px solid rgba(34,197,94,0.25)' : '1px solid #252525',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Punto indicador */}
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200"
                      style={{ background: conFreeChip ? '#22c55e' : '#2a2a2a', boxShadow: conFreeChip ? '0 0 6px rgba(34,197,94,0.5)' : 'none' }}
                    />
                    <span
                      className="text-[0.8rem] font-semibold tracking-wide transition-colors duration-150"
                      style={{ color: conFreeChip ? '#22c55e' : '#555' }}
                    >
                      Free Chip
                    </span>
                  </div>
                  {/* Toggle visual */}
                  <div
                    className="w-8 h-4 rounded-full relative shrink-0 transition-all duration-200"
                    style={{ background: conFreeChip ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)', border: conFreeChip ? '1px solid rgba(34,197,94,0.4)' : '1px solid #2a2a2a' }}
                  >
                    <div
                      className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200"
                      style={{ background: conFreeChip ? '#22c55e' : '#333', left: conFreeChip ? 'calc(100% - 14px)' : '1px' }}
                    />
                  </div>
                </button>
              )}

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <FiAlertCircle size={13} className="text-red-400 shrink-0" />
                  <p className="text-[0.72rem] text-red-400">{error}</p>
                </div>
              )}
            </div>
          ) : (
            /* Buscador */
            <div className="flex flex-col gap-3">
              <p className="text-[0.7rem] text-[#444] uppercase tracking-[1.5px] font-semibold">
                Buscar por nombre o RUT
              </p>
              <div className="relative">
                <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#333' }} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Nombre o RUT del jugador..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full rounded-lg pl-9 pr-4 py-2.5 text-[0.82rem] text-[#ccc] outline-none placeholder:text-[#2a2a2a]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #252525', transition: 'border-color 0.15s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#252525' }}
                />
                {busqueda && (
                  <button
                    onClick={() => { setBusqueda(''); setResultados([]) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                    style={{ color: '#333' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#666' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#333' }}
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>

              {/* Resultados */}
              <div
                className="flex flex-col rounded-lg overflow-hidden"
                style={{ border: resultados.length > 0 || cargando ? '1px solid #1e1e1e' : 'none', minHeight: resultados.length > 0 ? '0' : undefined }}
              >
                {cargando && (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#333', borderTopColor: 'transparent' }} />
                  </div>
                )}

                {!cargando && resultados.length === 0 && busqueda.trim().length >= 2 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <FiUser size={20} style={{ color: '#252525' }} />
                    <p className="text-[0.72rem] text-[#2a2a2a] uppercase tracking-[2px]">Sin resultados</p>
                  </div>
                )}

                {!cargando && resultados.map((jugador, i) => (
                  <button
                    key={jugador.rut}
                    onClick={() => seleccionar(jugador)}
                    className="flex items-center gap-3 px-4 py-2.5 text-left w-full transition-all duration-100 cursor-pointer"
                    style={{
                      borderTop: i > 0 ? '1px solid #191919' : 'none',
                      background: 'transparent',
                      opacity: jugador.lista_negra ? 0.4 : 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]"
                      style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', color: '#D4AF37' }}
                    >
                      {obtenerIniciales(jugador.nombre_completo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.82rem] text-[#ccc] font-medium truncate leading-tight">{jugador.nombre_completo}</p>
                      <p className="text-[0.65rem] text-[#383838] font-mono">{jugador.rut}</p>
                    </div>
                    {jugador.lista_negra && (
                      <span className="text-[0.6rem] text-red-500 uppercase tracking-[1px] shrink-0">Lista negra</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid #1a1a1a', background: 'rgba(255,255,255,0.01)' }}
        >
          <button
            onClick={onCerrar}
            className="rounded-lg px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[1px] transition-all duration-150 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #252525', color: '#555' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#888' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#555' }}
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!seleccionado || inscribiendo}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[1px] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: 'rgba(34,197,94,0.85)',
            }}
            onMouseEnter={e => { if (seleccionado && !inscribiendo) { e.currentTarget.style.background = 'rgba(34,197,94,0.2)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'; e.currentTarget.style.color = '#22c55e' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; e.currentTarget.style.color = 'rgba(34,197,94,0.85)' }}
          >
            {inscribiendo ? (
              <>
                <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: 'rgba(34,197,94,0.5)', borderTopColor: 'transparent' }} />
                Inscribiendo...
              </>
            ) : (
              <>
                <FiCheck size={12} />
                Confirmar Inscripcion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalAgregarJugador
