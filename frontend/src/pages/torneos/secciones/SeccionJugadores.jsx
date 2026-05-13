import { FiUser, FiCircle } from 'react-icons/fi'

const ESTADO_LABEL = {
  ACTIVO:    { label: 'Activo',    clase: 'text-green-400' },
  ELIMINADO: { label: 'Eliminado', clase: 'text-red-400' },
  REBUY:     { label: 'Rebuy',     clase: 'text-yellow-400' },
}

const SeccionJugadores = ({ jugadores }) => {
  const activos   = jugadores.filter((j) => j.estado === 'ACTIVO')
  const eliminados = jugadores.filter((j) => j.estado === 'ELIMINADO')

  return (
    <div>
      <h2 className="text-white text-base font-semibold mb-4">
        Jugadores inscritos
        <span className="ml-2 text-dreams-text-muted text-sm font-normal">
          ({activos.length} activos / {jugadores.length} total)
        </span>
      </h2>

      {jugadores.length === 0 ? (
        <p className="text-dreams-text-muted text-sm">No hay jugadores inscritos aún.</p>
      ) : (
        <div className="grid gap-2">
          {jugadores.map((inscripcion, i) => {
            const { jugador, estado } = inscripcion
            const info = ESTADO_LABEL[estado] ?? ESTADO_LABEL.ACTIVO
            return (
              <div
                key={inscripcion.id_inscripcion ?? i}
                className={`flex items-center gap-3 px-4 py-2.5 rounded bg-dreams-surface border border-dreams-border ${
                  estado === 'ELIMINADO' ? 'opacity-50' : ''
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-dreams-surface-2 border border-dreams-border flex items-center justify-center shrink-0">
                  <FiUser size={14} className="text-dreams-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {jugador?.nombre_completo ?? '—'}
                  </p>
                  <p className="text-dreams-text-muted text-xs">{jugador?.rut ?? '—'}</p>
                </div>
                <span className={`text-xs font-medium ${info.clase}`}>
                  {info.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SeccionJugadores
