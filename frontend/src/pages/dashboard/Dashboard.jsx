import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FiTrash2, FiAward, FiUsers, FiDollarSign, FiCalendar, FiLoader } from 'react-icons/fi'
import api from '../../services/api'

const BADGES_ESTADO = {
  BORRADOR:    { texto: 'Borrador',   clase: 'bg-[#222] text-dreams-text-muted border border-dreams-border' },
  REGISTRO:    { texto: 'Registro',   clase: 'bg-blue-950 text-blue-400 border border-blue-900' },
  EN_JUEGO:    { texto: 'En Juego',   clase: 'bg-green-950 text-green-400 border border-green-900' },
  PAUSADO:     { texto: 'Pausado',    clase: 'bg-yellow-950 text-yellow-400 border border-yellow-900' },
  FINALIZADO:  { texto: 'Finalizado', clase: 'bg-[#222] text-dreams-text-muted border border-dreams-border' },
}

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '—'
  return new Date(fechaStr).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatearMonto = (monto) => {
  if (!monto && monto !== 0) return '—'
  return '$' + Math.round(monto).toLocaleString('es-CL')
}

const BadgeEstado = ({ estado }) => {
  const config = BADGES_ESTADO[estado] ?? BADGES_ESTADO.BORRADOR
  return (
    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded tracking-wide uppercase ${config.clase}`}>
      {config.texto}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-estadisticas'],
    queryFn: () => api.get('/torneos/dashboard/estadisticas').then(r => r.data.datos),
    refetchInterval: 30000,
  })

  const proximos = data?.proximos ?? []
  const finalizados = data?.finalizados ?? []
  const resumen = data?.resumen ?? {}
  const promedioBuyIn = resumen.promedioBuyInMes ?? 0

  const handleEliminar = async (e, idTorneo, estado) => {
    e.stopPropagation()
    const enCurso = ['EN_JUEGO', 'PAUSADO'].includes(estado)
    const confirmMsg = enCurso
      ? 'Este torneo esta en curso.\n\n¿Seguro que quieres eliminarlo? Esta accion no se puede deshacer.'
      : '¿Confirmas eliminar este torneo?'
    if (!window.confirm(confirmMsg)) return
    if (enCurso && !window.confirm('Confirmacion final: se eliminaran todos los datos del torneo. ¿Continuar?')) return
    try {
      await api.delete(`/torneos/${idTorneo}`)
      queryClient.invalidateQueries({ queryKey: ['dashboard-estadisticas'] })
    } catch (err) {
      const mensaje = err.response?.data?.mensaje ?? 'No se pudo eliminar el torneo'
      alert(mensaje)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-8">

      {/* Tarjetas de resumen */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <div className="bg-dreams-surface border border-dreams-border border-t-2 border-t-dreams-gold rounded-lg p-5 flex flex-col gap-4 hover:bg-dreams-surface-2 transition-colors">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-dreams-surface-2 flex items-center justify-center">
                <FiAward size={20} className="text-dreams-text-muted" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border">Este mes</span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium mb-1">Torneos Realizados</p>
              <p className="text-3xl font-bold text-dreams-text">{isLoading ? '—' : (resumen.torneosEsteMes ?? 0)}</p>
              <p className="text-xs text-dreams-text-muted mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-dreams-gold inline-block" />en los ultimos 30 dias
              </p>
            </div>
          </div>

          <div className="bg-dreams-surface border border-dreams-border border-t-2 border-t-dreams-gold rounded-lg p-5 flex flex-col gap-4 hover:bg-dreams-surface-2 transition-colors">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-dreams-surface-2 flex items-center justify-center">
                <FiUsers size={20} className="text-dreams-text-muted" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border">Total</span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium mb-1">Jugadores Registrados</p>
              <p className="text-3xl font-bold text-dreams-text">{isLoading ? '—' : (resumen.totalJugadores ?? 0).toLocaleString('es-CL')}</p>
              <p className="text-xs text-dreams-text-muted mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-dreams-gold inline-block" />en el sistema
              </p>
            </div>
          </div>

          <div className="bg-dreams-surface border border-dreams-border border-t-2 border-t-dreams-gold rounded-lg p-5 flex flex-col gap-4 hover:bg-dreams-surface-2 transition-colors">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-dreams-surface-2 flex items-center justify-center">
                <FiDollarSign size={20} className="text-dreams-text-muted" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border">Este mes</span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium mb-1">Promedio Buy-in</p>
              <p className="text-3xl font-bold text-dreams-gold">{isLoading ? '—' : formatearMonto(promedioBuyIn)}</p>
              <p className="text-xs text-dreams-text-muted mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-dreams-gold inline-block" />promedio por torneo este mes
              </p>
            </div>
          </div>

          <div className="bg-dreams-surface border border-dreams-border border-t-2 border-t-dreams-gold rounded-lg p-5 flex flex-col gap-4 hover:bg-dreams-surface-2 transition-colors">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-dreams-surface-2 flex items-center justify-center">
                <FiCalendar size={20} className="text-dreams-text-muted" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border">Proximo</span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium mb-1">Proximo Torneo</p>
              {resumen.proximoTorneo ? (
                <>
                  <div className="flex items-baseline gap-2">
                    {resumen.proximoTorneo.dias === 0 ? (
                      <p className="text-3xl font-bold text-dreams-gold">Hoy</p>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-dreams-text">{resumen.proximoTorneo.dias}</p>
                        <span className="text-sm text-dreams-text-muted">{resumen.proximoTorneo.dias === 1 ? 'dia' : 'dias'}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-dreams-text-muted mt-1.5 flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-dreams-gold inline-block shrink-0" />{resumen.proximoTorneo.nombre}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-dreams-text-muted">—</p>
                  <p className="text-xs text-dreams-text-muted mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-dreams-border inline-block" />sin torneos proximos
                  </p>
                </>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Proximos torneos */}
      <section>
        <h2 className="text-xl font-semibold text-dreams-gold mb-3">Proximos Torneos</h2>
        <div className="rounded border border-dreams-border overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-dreams-surface-2 text-dreams-text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium w-10">#</th>
                <th className="text-left px-4 py-2.5 font-medium">Nombre</th>
                <th className="text-left px-4 py-2.5 font-medium">Supervisor</th>
                <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
                <th className="text-left px-4 py-2.5 font-medium">Buy-in</th>
                <th className="text-left px-4 py-2.5 font-medium">Inscritos</th>
                <th className="text-left px-4 py-2.5 font-medium">Estado</th>
                <th className="text-center px-4 py-2.5 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-dreams-text-muted text-sm">Cargando...</td></tr>
              ) : proximos.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-dreams-text-muted text-sm">No hay torneos registrados</td></tr>
              ) : proximos.map((torneo, idx) => (
                <tr key={torneo.id_torneo} onClick={() => navigate(`/torneos/${torneo.id_torneo}`)}
                  className={`cursor-pointer transition-colors hover:bg-dreams-surface-2 border-t border-dreams-border ${idx === 0 ? 'border-t-0' : ''}`}>
                  <td className="px-4 py-3 text-dreams-text-muted text-xs font-bold">#{torneo.id_torneo}</td>
                  <td className="px-4 py-3 font-medium text-dreams-text">{torneo.nombre}</td>
                  <td className="px-4 py-3 text-dreams-text-muted">{torneo.supervisor?.nombre_completo ?? '—'}</td>
                  <td className="px-4 py-3 text-dreams-text-muted">{formatearFecha(torneo.fecha_inicio)}</td>
                  <td className="px-4 py-3 text-dreams-gold font-medium">{formatearMonto(torneo.buy_in_monto)}</td>
                  <td className="px-4 py-3 text-dreams-text-muted">{torneo._count?.inscripciones ?? 0}</td>
                  <td className="px-4 py-3"><BadgeEstado estado={torneo.estado} /></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={(e) => handleEliminar(e, torneo.id_torneo, torneo.estado)}
                      className="text-dreams-text-muted hover:text-red-400 transition-colors p-1 rounded" title="Eliminar">
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Torneos finalizados */}
      <section>
        <h2 className="text-xl font-semibold text-dreams-gold mb-3">Torneos Finalizados</h2>
        <div className="rounded border border-dreams-border overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-dreams-surface-2 text-dreams-text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">Nombre</th>
                <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
                <th className="text-left px-4 py-2.5 font-medium">Jugadores</th>
                <th className="text-left px-4 py-2.5 font-medium">Ganador</th>
                <th className="text-left px-4 py-2.5 font-medium">Premio 1</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-dreams-text-muted text-sm">Cargando...</td></tr>
              ) : finalizados.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-dreams-text-muted text-sm">Sin torneos finalizados</td></tr>
              ) : finalizados.map((torneo, idx) => (
                <tr key={torneo.id_torneo}
                  className={`border-t border-dreams-border ${idx === 0 ? 'border-t-0' : ''}`}>
                  <td className="px-4 py-3 font-medium text-dreams-text">{torneo.nombre}</td>
                  <td className="px-4 py-3 text-dreams-text-muted">{formatearFecha(torneo.fecha_inicio)}</td>
                  <td className="px-4 py-3 text-dreams-text-muted">{torneo._count?.inscripciones ?? '—'}</td>
                  <td className="px-4 py-3 text-dreams-text-muted">Sin registrar</td>
                  <td className="px-4 py-3 text-dreams-gold font-medium">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
