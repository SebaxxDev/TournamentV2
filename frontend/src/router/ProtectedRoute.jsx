import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/auth.store'

const RutaProtegida = ({ children, rolesPermitidos }) => {
  const { usuario, cargando } = useAuthStore()

  if (cargando) {
    return (
      <div className="min-h-screen bg-dreams-dark flex items-center justify-center">
        <p className="text-dreams-text-muted">Cargando...</p>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return children ?? <Outlet />
}

export default RutaProtegida