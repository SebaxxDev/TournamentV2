import { FiClock } from 'react-icons/fi'

const formatearTiempo = (segundos) => {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const SeccionEstructura = ({ niveles, nivelActual }) => {
  const nivelIndexActual = nivelActual
    ? niveles.findIndex((n) => n.id_nivel === nivelActual.id_nivel)
    : -1

  return (
    <div>
      <h2 className="text-white text-base font-semibold mb-4">Estructura de ciegas</h2>

      {niveles.length === 0 ? (
        <p className="text-dreams-text-muted text-sm">Sin niveles configurados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dreams-text-muted border-b border-dreams-border">
                <th className="text-left pb-2 pr-4 font-medium">#</th>
                <th className="text-left pb-2 pr-4 font-medium">SB</th>
                <th className="text-left pb-2 pr-4 font-medium">BB</th>
                <th className="text-left pb-2 pr-4 font-medium">Ante</th>
                <th className="text-left pb-2 pr-4 font-medium">Duración</th>
              </tr>
            </thead>
            <tbody>
              {niveles.map((nivel, i) => {
                const esActual = i === nivelIndexActual
                const esBreak  = nivel.tipo === 'BREAK'

                return (
                  <tr
                    key={nivel.id_nivel ?? i}
                    className={`border-b border-dreams-border/50 transition-colors ${
                      esActual
                        ? 'bg-dreams-gold/10 border-l-2 border-l-dreams-gold'
                        : 'hover:bg-dreams-surface'
                    } ${esBreak ? 'opacity-70' : ''}`}
                  >
                    <td className="py-2 pr-4">
                      {esBreak ? (
                        <span className="text-red-400 text-xs font-medium">Break</span>
                      ) : (
                        <span className={`font-medium ${esActual ? 'text-dreams-gold' : 'text-white'}`}>
                          {nivel.numero_nivel}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-dreams-text">
                      {esBreak ? '—' : nivel.sb.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-dreams-text">
                      {esBreak ? '—' : nivel.bb.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-dreams-text">
                      {esBreak ? '—' : (nivel.ante > 0 ? nivel.ante.toLocaleString() : '—')}
                    </td>
                    <td className="py-2 pr-4 text-dreams-text-muted flex items-center gap-1">
                      <FiClock size={12} />
                      {formatearTiempo(nivel.tiempo_segundos)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SeccionEstructura
