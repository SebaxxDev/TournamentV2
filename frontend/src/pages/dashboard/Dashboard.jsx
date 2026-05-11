import { useNavigate } from 'react-router-dom'
import { FiTrash2, FiAward, FiUsers, FiDollarSign, FiCalendar } from 'react-icons/fi'
import useAuthStore from '../../store/auth.store'
import api from '../../services/api'

const MOCK_PROXIMOS = [
  {
    id_torneo: 1,
    nombre: 'Torneo Apertura Mayo',
    supervisor: { nombre_completo: 'Carlos Mendoza' },
    fecha_inicio: '2026-05-10T19:00:00',
    buy_in_monto: 20000,
    estado: 'REGISTRO',
  },
  {
    id_torneo: 2,
    nombre: 'Friday Night Poker',
    supervisor: { nombre_completo: 'Ana Rojas' },
    fecha_inicio: '2026-05-16T20:00:00',
    buy_in_monto: 15000,
    estado: 'BORRADOR',
  },
  {
    id_torneo: 3,
    nombre: 'Gran Premio Valdivia',
    supervisor: { nombre_completo: 'Carlos Mendoza' },
    fecha_inicio: '2026-05-24T18:30:00',
    buy_in_monto: 50000,
    estado: 'BORRADOR',
  },
]

const MOCK_RESUMEN = {
  torneosUltimoMes: 3,
  jugadoresTotales: 148,
  recaudacionMes: 850000,
  diasProximoTorneo: 7,
  nombreProximoTorneo: 'Torneo Apertura Mayo',
}

const MOCK_FINALIZADOS = [
  {
    id_torneo: 10,
    nombre: 'Torneo Marzo 2026',
    fecha_inicio: '2026-03-15T19:00:00',
    total_jugadores: 34,
    ganador: 'Roberto Soto',
    premio_primero: 280000,
  },
  {
    id_torneo: 9,
    nombre: 'Torneo Febrero 2026',
    fecha_inicio: '2026-02-20T19:00:00',
    total_jugadores: 28,
    ganador: 'Valentina Pérez',
    premio_primero: 210000,
  },
  {
    id_torneo: 8,
    nombre: 'Torneo Enero 2026',
    fecha_inicio: '2026-01-18T19:00:00',
    total_jugadores: 41,
    ganador: 'Diego Fuentes',
    premio_primero: 340000,
  },
]

const BADGES_ESTADO = {
  BORRADOR:    { texto: 'Borrador',    clase: 'bg-[#222] text-dreams-text-muted border border-dreams-border' },
  REGISTRO:    { texto: 'Registro',    clase: 'bg-blue-950 text-blue-400 border border-blue-900' },
  EN_JUEGO:    { texto: 'En Juego',    clase: 'bg-green-950 text-green-400 border border-green-900' },
  PAUSADO:     { texto: 'Pausado',     clase: 'bg-yellow-950 text-yellow-400 border border-yellow-900' },
  FINALIZADO:  { texto: 'Finalizado',  clase: 'bg-[#222] text-dreams-text-muted border border-dreams-border' },
}

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '—'
  return new Date(fechaStr).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
  const limpiarUsuario = useAuthStore((s) => s.limpiarUsuario)

  const handleEliminar = (e, idTorneo) => {
    e.stopPropagation()
    if (window.confirm('¿Confirmas que deseas eliminar este torneo? Esta accion no se puede deshacer.')) {
      console.log('Eliminar torneo', idTorneo)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-12">

      {/* Proximos torneos */}
      <section>
        <h2 className="text-xl font-semibold text-dreams-gold mb-3">
          Proximos Torneos
        </h2>

        <div className="rounded border border-dreams-border overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-dreams-surface-2 text-dreams-text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium w-10">#</th>
                <th className="text-left px-4 py-2.5 font-medium">Nombre</th>
                <th className="text-left px-4 py-2.5 font-medium">Supervisor</th>
                <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
                <th className="text-left px-4 py-2.5 font-medium">Buy-in</th>
                <th className="text-left px-4 py-2.5 font-medium">Estado</th>
                <th className="text-center px-4 py-2.5 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PROXIMOS.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-dreams-text-muted text-sm">
                    No hay torneos registrados
                  </td>
                </tr>
              ) : (
                MOCK_PROXIMOS.map((torneo, idx) => (
                  <tr
                    key={torneo.id_torneo}
                    onClick={() => navigate(`/torneos/${torneo.id_torneo}/control`)}
                    className={`
                      cursor-pointer transition-colors duration-100
                      hover:bg-dreams-surface-2 border-t border-dreams-border
                      ${idx === 0 ? 'border-t-0' : ''}
                    `}
                  >
                    <td className="px-4 py-3 text-dreams-text-muted text-xs font-bold">
                      #{torneo.id_torneo}
                    </td>
                    <td className="px-4 py-3 font-medium text-dreams-text">
                      {torneo.nombre}
                    </td>
                    <td className="px-4 py-3 text-dreams-text-muted">
                      {torneo.supervisor?.nombre_completo ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-dreams-text-muted">
                      {formatearFecha(torneo.fecha_inicio)}
                    </td>
                    <td className="px-4 py-3 text-dreams-gold font-medium">
                      {formatearMonto(torneo.buy_in_monto)}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={torneo.estado} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => handleEliminar(e, torneo.id_torneo)}
                        className="text-dreams-text-muted hover:text-red-400 transition-colors duration-100 p-1 rounded"
                        title="Eliminar torneo"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Torneos finalizados */}
      <section>
        <h2 className="text-xl font-semibold text-dreams-gold mb-3">
          Torneos Finalizados
        </h2>

        <div className="rounded border border-dreams-border overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-dreams-surface-2 text-dreams-text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">Nombre</th>
                <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
                <th className="text-left px-4 py-2.5 font-medium">Jugadores</th>
                <th className="text-left px-4 py-2.5 font-medium">Ganador</th>
                <th className="text-left px-4 py-2.5 font-medium">Premio 1°</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_FINALIZADOS.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-dreams-text-muted text-sm">
                    Sin resultados recientes
                  </td>
                </tr>
              ) : (
                MOCK_FINALIZADOS.map((torneo, idx) => (
                  <tr
                    key={torneo.id_torneo}
                    onClick={() => navigate(`/torneos/${torneo.id_torneo}/resumen`)}
                    className={`
                      cursor-pointer transition-colors duration-100
                      hover:bg-dreams-surface-2 border-t border-dreams-border
                      ${idx === 0 ? 'border-t-0' : ''}
                    `}
                  >
                    <td className="px-4 py-3 font-medium text-dreams-text">
                      {torneo.nombre}
                    </td>
                    <td className="px-4 py-3 text-dreams-text-muted">
                      {formatearFecha(torneo.fecha_inicio)}
                    </td>
                    <td className="px-4 py-3 text-dreams-text-muted">
                      {torneo.total_jugadores ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-dreams-text">
                      {torneo.ganador ?? <span className="text-dreams-text-muted">Sin registrar</span>}
                    </td>
                    <td className="px-4 py-3 text-dreams-gold font-medium">
                      {formatearMonto(torneo.premio_primero)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tarjetas de resumen */}
      <section>
        <h2 className="text-xl font-semibold text-dreams-gold mb-4">
          Resumen
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Torneos del ultimo mes */}
          <div className="bg-dreams-surface border border-dreams-border border-t-2 border-t-dreams-gold rounded-lg p-5 flex flex-col gap-4 hover:bg-dreams-surface-2 transition-colors duration-150">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-dreams-surface-2 flex items-center justify-center">
                <FiAward size={20} className="text-dreams-text-muted" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border">
                Este mes
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium mb-1">
                Torneos Realizados
              </p>
              <p className="text-3xl font-bold text-dreams-text">
                {MOCK_RESUMEN.torneosUltimoMes}
              </p>
              <p className="text-xs text-dreams-text-muted mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-dreams-gold inline-block" />
                en los ultimos 30 dias
              </p>
            </div>
          </div>

          {/* Jugadores registrados */}
          <div className="bg-dreams-surface border border-dreams-border border-t-2 border-t-dreams-gold rounded-lg p-5 flex flex-col gap-4 hover:bg-dreams-surface-2 transition-colors duration-150">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-dreams-surface-2 flex items-center justify-center">
                <FiUsers size={20} className="text-dreams-text-muted" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border">
                Total
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium mb-1">
                Jugadores Registrados
              </p>
              <p className="text-3xl font-bold text-dreams-text">
                {MOCK_RESUMEN.jugadoresTotales.toLocaleString('es-CL')}
              </p>
              <p className="text-xs text-dreams-text-muted mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-dreams-gold inline-block" />
                en el sistema
              </p>
            </div>
          </div>

          {/* Recaudacion del mes */}
          <div className="bg-dreams-surface border border-dreams-border border-t-2 border-t-dreams-gold rounded-lg p-5 flex flex-col gap-4 hover:bg-dreams-surface-2 transition-colors duration-150">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-dreams-surface-2 flex items-center justify-center">
                <FiDollarSign size={20} className="text-dreams-text-muted" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border">
                Este mes
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium mb-1">
                Recaudacion
              </p>
              <p className="text-3xl font-bold text-dreams-gold">
                {formatearMonto(MOCK_RESUMEN.recaudacionMes)}
              </p>
              <p className="text-xs text-dreams-text-muted mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-dreams-gold inline-block" />
                en buy-ins este mes
              </p>
            </div>
          </div>

          {/* Proximo torneo */}
          <div className="bg-dreams-surface border border-dreams-border border-t-2 border-t-dreams-gold rounded-lg p-5 flex flex-col gap-4 hover:bg-dreams-surface-2 transition-colors duration-150">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-dreams-surface-2 flex items-center justify-center">
                <FiCalendar size={20} className="text-dreams-text-muted" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border">
                Proximo
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium mb-1">
                Proximo Torneo
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-dreams-text">
                  {MOCK_RESUMEN.diasProximoTorneo}
                </p>
                <span className="text-sm text-dreams-text-muted">
                  {MOCK_RESUMEN.diasProximoTorneo === 1 ? 'dia' : 'dias'}
                </span>
              </div>
              <p className="text-xs text-dreams-text-muted mt-1.5 flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-dreams-gold inline-block shrink-0" />
                {MOCK_RESUMEN.nombreProximoTorneo}
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}