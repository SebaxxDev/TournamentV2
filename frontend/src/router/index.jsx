import { Routes, Route, Navigate } from 'react-router-dom'
import RutaProtegida from './ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'
import Login from '../pages/login/Login'
import Dashboard from '../pages/dashboard/Dashboard'
import Staff from '../pages/staff/Staff'
import Jugadores from '../pages/jugadores/Jugadores'
import Fichas from '../pages/fichas/Fichas'
import CrearTorneo from '../pages/torneos/CrearTorneo'


const ROLES_PANEL = ['ADMIN', 'DIRECTOR', 'SUPERVISOR']

const Router = () => {
  return (
    <Routes>
      {/* Ruta publica */}
      <Route path="/login" element={<Login />} />

      {/* Rutas con layout principal (Sidebar + Header) */}
      <Route element={<RutaProtegida rolesPermitidos={ROLES_PANEL} />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Torneos */}
          <Route
            path="/torneos/crear"
            element={
              <RutaProtegida rolesPermitidos={['ADMIN', 'DIRECTOR']}>
                <CrearTorneo />
              </RutaProtegida>
            }
          />
          {/* <Route path="/torneos" element={<Torneos />} /> */}
          {/* <Route path="/torneos/:id/control" element={<ControlTorneo />} /> */}

          <Route path="/jugadores" element={<Jugadores />} />
          <Route path="/fichas" element={<Fichas />} />
          <Route path="/staff" element={<Staff />} />
          {/* <Route path="/auditoria" element={<Auditoria />} /> */}
        </Route>
      </Route>

      {/* Rutas sin layout (pantallas independientes) */}
      {/* <Route element={<RutaProtegida rolesPermitidos={['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO']} />}> */}
      {/*   <Route path="/caja" element={<Caja />} /> */}
      {/* </Route> */}

      {/* Redireccion raiz */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default Router