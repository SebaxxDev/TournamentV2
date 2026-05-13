import { FiAward } from 'react-icons/fi'

const formatearMoneda = (valor) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor ?? 0)

const SeccionPremios = ({ torneo, jugadores }) => {
  const esquema = torneo.esquema_premio
  const pozoTotal = 0 // El pozo real viene del store — aquí solo se muestra estructura

  if (!esquema) {
    return (
      <div>
        <h2 className="text-white text-base font-semibold mb-4">Tabla de premios</h2>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <FiAward size={36} className="text-dreams-border" />
          <p className="text-dreams-text-muted text-sm">
            Este torneo no tiene tabla de premios configurada.
          </p>
        </div>
      </div>
    )
  }

  const reglas = esquema.reglas ?? []

  return (
    <div>
      <h2 className="text-white text-base font-semibold mb-1">Tabla de premios</h2>
      <p className="text-dreams-text-muted text-xs mb-4">{esquema.nombre}</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-dreams-text-muted border-b border-dreams-border">
              <th className="text-left pb-2 pr-4 font-medium">Posición</th>
              <th className="text-left pb-2 pr-4 font-medium">Jugadores</th>
              <th className="text-left pb-2 pr-4 font-medium">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {reglas.map((regla, i) => (
              <tr key={regla.id_regla ?? i} className="border-b border-dreams-border/50 hover:bg-dreams-surface">
                <td className="py-2 pr-4 text-dreams-gold font-medium">
                  {regla.posicion}
                </td>
                <td className="py-2 pr-4 text-dreams-text-muted text-xs">
                  {regla.rango_min_jugadores && regla.rango_max_jugadores
                    ? `${regla.rango_min_jugadores}–${regla.rango_max_jugadores} jugadores`
                    : '—'}
                </td>
                <td className="py-2 pr-4 text-white">
                  {regla.porcentaje}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SeccionPremios
