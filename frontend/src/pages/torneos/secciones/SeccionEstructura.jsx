import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiClock, FiPlus, FiTrash2, FiCheck, FiX, FiEdit2, FiChevronRight, FiChevronLeft } from 'react-icons/fi'
import api from '../../../services/api'

// ─── Formateadores ────────────────────────────────────────────────────────────
const formatearDuracion = (segundos) => {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  if (s === 0) return `${m}m`
  return `${m}:${String(s).padStart(2, '0')}`
}

// ─── Busca en el array de niveles el numero_nivel real del nivel que porta un marcador ──
// Los marcadores son strings almacenados en nivel.marcadores (array JSON).
// Cuando el marcador cayó en un break, ese nivel tiene numero_nivel = 0.
// En ese caso devolvemos el numero_nivel del nivel NIVEL más cercano (anterior o posterior).
const buscarRondaPorMarcador = (claveMarcador, niveles) => {
  if (!niveles?.length) return '?'
  const idx = niveles.findIndex((n) => Array.isArray(n.marcadores) && n.marcadores.includes(claveMarcador))
  if (idx === -1) return '?'
  const nivel = niveles[idx]
  // Si es un nivel real con numero_nivel válido, usarlo directamente
  if (nivel.tipo === 'NIVEL' && nivel.numero_nivel > 0) return String(nivel.numero_nivel)
  // Es un break (numero_nivel = 0): buscar el nivel real más próximo
  // Primero buscar hacia atrás, luego hacia adelante
  for (let i = idx - 1; i >= 0; i--) {
    if (niveles[i].tipo === 'NIVEL' && niveles[i].numero_nivel > 0) return String(niveles[i].numero_nivel)
  }
  for (let i = idx + 1; i < niveles.length; i++) {
    if (niveles[i].tipo === 'NIVEL' && niveles[i].numero_nivel > 0) return String(niveles[i].numero_nivel)
  }
  return '?'
}

// ─── Input inline reutilizable ────────────────────────────────────────────────
const InputInline = ({ value, onChange, placeholder = '0', ancho = 'w-16' }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    onClick={(e) => e.stopPropagation()}
    className={`
      ${ancho} bg-[#1a1a1a] border border-dreams-gold/40 rounded px-1.5 py-0.5
      text-xs text-center text-white font-mono outline-none
      focus:border-dreams-gold transition-colors
      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
    `}
  />
)

// ─── Componente principal ─────────────────────────────────────────────────────
const SeccionEstructura = ({ torneo, niveles, nivelActual, idTorneo }) => {
  const filaActualRef = useRef(null)
  const queryClient   = useQueryClient()

  const [editandoId, setEditandoId] = useState(null)
  const [borrador, setBorrador]     = useState({})
  const [panelVisible, setPanelVisible] = useState(true)

  const nivelIndexActual = nivelActual
    ? niveles.findIndex((n) => n.id_nivel === nivelActual.id_nivel)
    : -1

  // Scroll automático al nivel activo
  useEffect(() => {
    if (filaActualRef.current) {
      filaActualRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [nivelIndexActual])

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['control-torneo', idTorneo] })

  // ─── Mutaciones ──────────────────────────────────────────────────────────────
  const mutAgregar = useMutation({
    mutationFn: (tipo) => api.post(`/torneos/${idTorneo}/niveles`, {
      tipo,
      sb: 0, bb: 0, ante: 0,
      tiempo_segundos: tipo === 'BREAK' ? 900 : 1200,
    }),
    onSuccess: invalidar,
  })

  const mutEditar = useMutation({
    mutationFn: ({ idNivel, datos }) => api.patch(`/torneos/${idTorneo}/niveles/${idNivel}`, datos),
    onSuccess: () => { invalidar(); setEditandoId(null) },
  })

  const mutEliminar = useMutation({
    mutationFn: (idNivel) => api.delete(`/torneos/${idTorneo}/niveles/${idNivel}`),
    onSuccess: invalidar,
  })

  // ─── Lógica de edición inline ─────────────────────────────────────────────
  const abrirEdicion = (nivel) => {
    setEditandoId(nivel.id_nivel)
    setBorrador({
      sb:              String(nivel.sb ?? 0),
      bb:              String(nivel.bb ?? 0),
      ante:            String(nivel.ante ?? 0),
      tiempo_segundos: String(Math.round((nivel.tiempo_segundos ?? 0) / 60)),
    })
  }

  const cancelarEdicion = () => { setEditandoId(null); setBorrador({}) }

  const guardarEdicion = (idNivel) => {
    mutEditar.mutate({
      idNivel,
      datos: {
        sb:              Number(borrador.sb)               || 0,
        bb:              Number(borrador.bb)               || 0,
        ante:            Number(borrador.ante)             || 0,
        tiempo_segundos: (Number(borrador.tiempo_segundos) || 0) * 60,
      },
    })
  }

  // ─── Panel de variables ───────────────────────────────────────────────────
  // Estrategia dual: primero intenta leer los marcadores directamente desde
  // nivel.marcadores (más preciso). Si todos dan '?', cae al campo guardado
  // en poker (que puede ser 0 en torneos viejos creados antes del fix).
  const poker = torneo?.poker ?? {}

  const resolverVariable = (claveMarcador, campoPoker) => {
    const desdeNiveles = buscarRondaPorMarcador(claveMarcador, niveles)
    if (desdeNiveles !== '?') return desdeNiveles
    const v = campoPoker ?? 0
    return v > 0 ? String(v) : '?'
  }

  // Construye el rango de texto para una variable con inicio y fin.
  // Si alguno de los valores es '?', intenta construir algo parcialmente útil.
  // Si ambos son '?', omite la variable del panel.
  const rangoTexto = (ini, fin) => {
    if (ini !== '?' && fin !== '?') return `N${ini} → N${fin}`
    if (ini !== '?' && fin === '?') return `desde N${ini}`
    if (ini === '?' && fin !== '?') return `hasta N${fin}`
    return null // ambos desconocidos — no mostrar
  }

  const variables = []
  if (poker.rebuy_permitido) {
    const ini = resolverVariable('rebuy_inicio', poker.rebuy_nivel_inicio)
    const fin = resolverVariable('rebuy_fin',    poker.rebuy_nivel_final)
    const rango = rangoTexto(ini, fin)
    if (rango) variables.push({ label: 'Re-buy', rango, color: 'text-blue-400' })
  }
  if (poker.addon_permitido) {
    const ini = resolverVariable('addon_inicio', poker.addon_nivel_inicio)
    const fin = resolverVariable('addon_fin',    poker.addon_nivel_final)
    const rango = rangoTexto(ini, fin)
    if (rango) variables.push({ label: 'Add-on', rango, color: 'text-purple-400' })
  }
  if (poker.free_chip_permitido) {
    const fin = resolverVariable('freechip_fin', poker.free_chip_nivel_final)
    if (fin !== '?') variables.push({ label: 'Free Chip', rango: `hasta N${fin}`, color: 'text-green-400' })
  }
  if (poker.ultimo_nivel_registro) {
    const n = resolverVariable('fin_registro', poker.ultimo_nivel_registro)
    if (n !== '?') variables.push({ label: 'Fin Registro', rango: `N${n}`, color: 'text-amber-400' })
  }

  // Duración total
  const totalSeg = niveles.reduce((acc, n) => acc + (n.tiempo_segundos ?? 0), 0)
  const totalH   = Math.floor(totalSeg / 3600)
  const totalM   = Math.floor((totalSeg % 3600) / 60)
  const durLabel = totalH > 0
    ? `${totalH}h${totalM > 0 ? ` ${totalM}m` : ''}`
    : `${totalM}m`

  const cantNiveles = niveles.filter((n) => n.tipo === 'NIVEL').length
  const cantBreaks  = niveles.filter((n) => n.tipo === 'BREAK').length
  const hayVariables = variables.length > 0

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between pb-3 mb-3 shrink-0"
        style={{ borderBottom: '1px solid #1e1e1e' }}
      >
        <h2
          className="text-[1.1rem] font-black uppercase tracking-[4px]"
          style={{ color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.35)' }}
        >
          Estructura de Ciegas
        </h2>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-dreams-text-muted bg-[#111] border border-dreams-border/50 px-2.5 py-1 rounded-full">
            <FiClock size={11} />
            {durLabel} · {cantNiveles} niveles · {cantBreaks} breaks
          </span>

          <button
            onClick={() => mutAgregar.mutate('NIVEL')}
            disabled={mutAgregar.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dreams-gold/30 bg-dreams-surface-2 text-dreams-gold text-xs font-semibold hover:bg-dreams-gold hover:text-dreams-dark transition-all disabled:opacity-40"
          >
            <FiPlus size={12} />
            Agregar Ronda
          </button>

          <button
            onClick={() => mutAgregar.mutate('BREAK')}
            disabled={mutAgregar.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-dreams-surface-2 text-red-400 text-xs font-semibold hover:bg-red-950 hover:border-red-500/60 transition-all disabled:opacity-40"
          >
            <FiPlus size={12} />
            Agregar Break
          </button>
        </div>
      </div>

      {/* ─── Cuerpo ──────────────────────────────────────────────────────────── */}
      {niveles.length === 0 ? (
        <p className="text-dreams-text-muted text-sm">Sin niveles configurados.</p>
      ) : (
        <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">

          {/* ── Tabla ──────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10" style={{ background: '#111' }}>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  <th className="w-12 py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">#</th>
                  <th className="py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">SB</th>
                  <th className="py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">BB</th>
                  <th className="py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">Ante</th>
                  <th className="py-2.5 text-[10px] font-bold tracking-widest text-dreams-text-muted uppercase text-center">Duración</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {niveles.map((nivel, i) => {
                  const esActual  = i === nivelIndexActual
                  const esPasado  = i < nivelIndexActual
                  const esBreak   = nivel.tipo === 'BREAK'
                  // Solo se puede editar niveles futuros (ni el actual ni los pasados)
                  const editable  = !esActual && !esPasado
                  const editando  = editandoId === nivel.id_nivel
                  const guardando = mutEditar.isPending && editandoId === nivel.id_nivel

                  return (
                    <tr
                      key={nivel.id_nivel ?? i}
                      ref={esActual ? filaActualRef : null}
                      style={{
                        borderBottom: esBreak ? '1px solid rgba(127,29,29,0.3)' : '1px solid #1a1a1a',
                        ...(esActual
                          ? { background: 'rgba(212,175,55,0.07)', borderLeft: '2px solid #D4AF37' }
                          : esBreak
                            ? { background: esPasado ? 'rgba(127,29,29,0.06)' : 'rgba(127,29,29,0.14)' }
                            : esPasado
                              ? { background: 'rgba(255,255,255,0.01)', opacity: 0.4 }
                              : {}),
                      }}
                      className={`transition-colors ${editable ? 'group' : ''}`}
                    >
                      {/* # */}
                      <td className="py-2 text-center w-12">
                        {esBreak ? (
                          <span className={`text-[10px] font-black tracking-widest ${esPasado ? 'text-red-900' : 'text-red-500/70'}`}>
                            BRK
                          </span>
                        ) : (
                          <span className={`text-xs font-bold ${
                            esActual ? 'text-dreams-gold' : esPasado ? 'text-[#333]' : 'text-dreams-text-muted'
                          }`}>
                            {nivel.numero_nivel}
                          </span>
                        )}
                      </td>

                      {/* SB */}
                      <td className="py-1.5 text-center">
                        {esBreak ? (
                          <span className="text-red-900/40 text-xs">—</span>
                        ) : editando ? (
                          <InputInline value={borrador.sb} onChange={(v) => setBorrador(b => ({ ...b, sb: v }))} />
                        ) : (
                          <span className={`font-mono text-xs ${esActual ? 'text-white font-semibold' : esPasado ? 'text-[#2a2a2a]' : 'text-dreams-text'}`}>
                            {nivel.sb?.toLocaleString('es-CL')}
                          </span>
                        )}
                      </td>

                      {/* BB */}
                      <td className="py-1.5 text-center">
                        {esBreak ? (
                          <span className="text-red-900/40 text-xs">—</span>
                        ) : editando ? (
                          <InputInline value={borrador.bb} onChange={(v) => setBorrador(b => ({ ...b, bb: v }))} />
                        ) : (
                          <span className={`font-mono text-xs ${esActual ? 'text-white font-semibold' : esPasado ? 'text-[#2a2a2a]' : 'text-dreams-text'}`}>
                            {nivel.bb?.toLocaleString('es-CL')}
                          </span>
                        )}
                      </td>

                      {/* Ante */}
                      <td className="py-1.5 text-center">
                        {esBreak ? (
                          <span className="text-red-900/40 text-xs">—</span>
                        ) : editando ? (
                          <InputInline value={borrador.ante} onChange={(v) => setBorrador(b => ({ ...b, ante: v }))} />
                        ) : (
                          <span className={`font-mono text-xs ${
                            nivel.ante > 0
                              ? esActual ? 'text-dreams-gold-light font-semibold' : esPasado ? 'text-[#2a2a2a]' : 'text-dreams-text-muted'
                              : 'text-[#252525]'
                          }`}>
                            {nivel.ante > 0 ? nivel.ante.toLocaleString('es-CL') : '—'}
                          </span>
                        )}
                      </td>

                      {/* Duración */}
                      <td className="py-1.5 text-center">
                        {editando ? (
                          <div className="flex items-center justify-center gap-1">
                            <InputInline
                              value={borrador.tiempo_segundos}
                              onChange={(v) => setBorrador(b => ({ ...b, tiempo_segundos: v }))}
                              placeholder="min"
                              ancho="w-14"
                            />
                            <span className="text-[10px] text-dreams-text-muted">min</span>
                          </div>
                        ) : (
                          <span className={`font-mono text-xs flex items-center justify-center gap-1 ${
                            esBreak
                              ? esPasado ? 'text-red-900/50' : 'text-red-400/80'
                              : esPasado ? 'text-[#2a2a2a]' : 'text-dreams-text-muted'
                          }`}>
                            <FiClock size={10} />
                            {formatearDuracion(nivel.tiempo_segundos ?? 0)}
                          </span>
                        )}
                      </td>

                      {/* Acciones — solo visibles para niveles futuros */}
                      <td className="py-1.5 pr-2 w-16">
                        {editando ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => guardarEdicion(nivel.id_nivel)}
                              disabled={guardando}
                              title="Guardar"
                              className="p-1 rounded text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-40"
                            >
                              <FiCheck size={13} />
                            </button>
                            <button
                              onClick={cancelarEdicion}
                              title="Cancelar"
                              className="p-1 rounded text-dreams-text-muted hover:text-dreams-text hover:bg-white/5 transition-colors"
                            >
                              <FiX size={13} />
                            </button>
                          </div>
                        ) : editable ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => abrirEdicion(nivel)}
                              title="Editar"
                              className="p-1 rounded text-dreams-text-muted hover:text-dreams-gold hover:bg-dreams-gold/10 transition-colors"
                            >
                              <FiEdit2 size={12} />
                            </button>
                            <button
                              onClick={() => mutEliminar.mutate(nivel.id_nivel)}
                              disabled={mutEliminar.isPending}
                              title="Eliminar"
                              className="p-1 rounded text-dreams-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Panel lateral de variables ──────────────────────────────────── */}
          {hayVariables && (
            <>
              {/* Botón oreja — flota sobre la tabla, anclado al borde derecho */}
              <div className="relative w-0 shrink-0 flex items-center">
                <button
                  onClick={() => setPanelVisible((v) => !v)}
                  title={panelVisible ? 'Ocultar variables' : 'Mostrar variables'}
                  className="absolute right-0 translate-x-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#333] bg-[#1a1a1a] text-[#666] transition-colors hover:border-dreams-gold hover:text-dreams-gold"
                >
                  {panelVisible ? <FiChevronRight size={11} /> : <FiChevronLeft size={11} />}
                </button>
              </div>

              {/* Contenido — se monta/desmonta completamente */}
              {panelVisible && (
                <div
                  className="shrink-0 overflow-y-auto pl-5 pr-1 pt-1 pb-2 flex flex-col gap-2"
                  style={{ width: '148px', borderLeft: '1px solid #1e1e1e' }}
                >
                  <p className="text-[10px] font-bold tracking-[2px] uppercase text-dreams-text-muted mb-0.5 shrink-0">
                    Variables
                  </p>
                  {variables.map((v, i) => (
                    <div key={i} className="flex flex-col gap-0.5 px-2 py-2 rounded-lg border border-dreams-border/50 bg-[#0e0e0e]">
                      <span className="text-[10px] uppercase tracking-[1.5px] font-semibold text-dreams-text-muted">
                        {v.label}
                      </span>
                      <span className={`text-sm font-bold font-mono ${v.color}`}>
                        {v.rango}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      )}
    </div>
  )
}

export default SeccionEstructura
