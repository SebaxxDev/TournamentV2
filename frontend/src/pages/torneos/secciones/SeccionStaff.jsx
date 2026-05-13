import { FiShield, FiCalendar, FiUser } from 'react-icons/fi'

const ESTADO_COLOR = {
  EN_JUEGO:   'text-green-400',
  PAUSADO:    'text-yellow-400',
  REGISTRO:   'text-blue-400',
  BORRADOR:   'text-dreams-text-muted',
  FINALIZADO: 'text-red-400',
}

const SeccionStaff = ({ torneo }) => {
  const supervisor = torneo.supervisor
  const fechaInicio = torneo.fecha_inicio
    ? new Date(torneo.fecha_inicio).toLocaleString('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

  return (
    <div>
      <h2 className="text-white text-base font-semibold mb-4">Información del torneo</h2>

      <div className="grid gap-3 max-w-lg">
        {/* Estado */}
        <div className="flex items-start gap-3 px-4 py-3 rounded bg-dreams-surface border border-dreams-border">
          <FiShield size={16} className="text-dreams-text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-dreams-text-muted text-xs mb-0.5">Estado</p>
            <p className={`text-sm font-semibold ${ESTADO_COLOR[torneo.estado] ?? 'text-white'}`}>
              {torneo.estado}
            </p>
          </div>
        </div>

        {/* Supervisor */}
        <div className="flex items-start gap-3 px-4 py-3 rounded bg-dreams-surface border border-dreams-border">
          <FiUser size={16} className="text-dreams-text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-dreams-text-muted text-xs mb-0.5">Responsable</p>
            <p className="text-white text-sm">{supervisor?.nombre_completo ?? '—'}</p>
            <p className="text-dreams-text-muted text-xs">{supervisor?.rol ?? '—'}</p>
          </div>
        </div>

        {/* Fecha */}
        <div className="flex items-start gap-3 px-4 py-3 rounded bg-dreams-surface border border-dreams-border">
          <FiCalendar size={16} className="text-dreams-text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-dreams-text-muted text-xs mb-0.5">Fecha de inicio</p>
            <p className="text-white text-sm">{fechaInicio}</p>
          </div>
        </div>

        {/* Buy-in */}
        <div className="flex items-start gap-3 px-4 py-3 rounded bg-dreams-surface border border-dreams-border">
          <div className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center">
            <span className="text-dreams-text-muted text-xs font-bold">$</span>
          </div>
          <div>
            <p className="text-dreams-text-muted text-xs mb-0.5">Buy-in</p>
            <p className="text-white text-sm">
              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
                .format(torneo.buy_in_monto ?? 0)}
            </p>
            <p className="text-dreams-text-muted text-xs">
              Rake inscripción: {torneo.rake_pct_inscripcion}%
            </p>
          </div>
        </div>

        {/* Capacidad */}
        {(torneo.capacidad_maxima || torneo.minimo_inicio) && (
          <div className="flex items-start gap-3 px-4 py-3 rounded bg-dreams-surface border border-dreams-border">
            <FiUser size={16} className="text-dreams-text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-dreams-text-muted text-xs mb-0.5">Capacidad</p>
              {torneo.minimo_inicio && (
                <p className="text-white text-sm">Mínimo para iniciar: {torneo.minimo_inicio}</p>
              )}
              {torneo.capacidad_maxima && (
                <p className="text-white text-sm">Máximo: {torneo.capacidad_maxima}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SeccionStaff
