import { useEffect } from 'react'
import Router from './router/index'
import useAuthStore from './store/auth.store'
import api from './services/api'

const App = () => {
  const { setUsuario, limpiarUsuario } = useAuthStore()

  useEffect(() => {
    api.get('/auth/sesion')
      .then((res) => setUsuario(res.data.datos))
      .catch(() => limpiarUsuario())
  }, [])

  return <Router />
}

export default App