import { FiGrid } from 'react-icons/fi'

const SeccionMesas = ({ torneo, jugadores }) => {
  const jugadoresActivos = jugadores.filter((j) => j.estado !== 'ELIMINADO').length

  return (
    <div>
      <h2 className="text-white text-base font-semibold mb-4">Mesas</h2>

      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <FiGrid size={36} className="text-dreams-border" />
        <p className="text-dreams-text-muted text-sm">
          La distribución de mesas estará disponible cuando se implemente el módulo de mesas.
        </p>
        <p className="text-dreams-text-muted text-xs">
          {jugadoresActivos} jugador(es) activo(s) sin asignación de mesa.
        </p>
      </div>
    </div>
  )
}

export default SeccionMesas
