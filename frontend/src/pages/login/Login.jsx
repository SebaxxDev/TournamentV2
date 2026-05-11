import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff, FiUser, FiLock, FiAlertCircle } from 'react-icons/fi'
import api from '../../services/api'
import useAuthStore from '../../store/auth.store'
import logoDreams from '../../assets/logo.png'

const schemaLogin = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres.'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres.'),
})

const Login = () => {
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()
  const setUsuario = useAuthStore((s) => s.setUsuario)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemaLogin),
  })

  const onSubmit = async (datos) => {
    setError(null)
    setCargando(true)
    try {
      const respuesta = await api.post('/auth/login', datos)
      const usuario = respuesta.data.datos
      setUsuario(usuario)
      const rol = usuario.rol.toUpperCase()
      if (['ADMIN', 'DIRECTOR', 'SUPERVISOR'].includes(rol)) {
        navigate('/dashboard')
      } else if (rol === 'CAJERO') {
        navigate('/caja')
      } else {
        setError('Rol de usuario no reconocido.')
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error de conexion con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-dreams-dark">

      <div className="flex-1 flex items-center justify-center px-4">
        <div
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1f1f1f 0%, #141414 100%)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.15)',
          }}
        >
          <div
            className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, #E8C84A, #D4AF37, transparent)' }}
          />

          <div className="px-10 py-10">

            <div className="flex flex-col items-center mb-8">
              <img src={logoDreams} alt="Dreams Logo" className="w-36 mb-6" />
              <h2
                className="text-white font-bold tracking-wide"
                style={{ fontSize: '1.6rem', letterSpacing: '0.04em' }}
              >
                Iniciar Sesion
              </h2>
              <div className="mt-3 h-px w-12 opacity-40" style={{ backgroundColor: '#D4AF37' }} />
            </div>

            {error && (
              <div
                className="flex items-center gap-3 text-sm text-red-400 rounded-lg px-4 py-3 mb-5 border border-red-900"
                style={{ backgroundColor: 'rgba(127,29,29,0.25)' }}
              >
                <FiAlertCircle className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-dreams-gold pointer-events-none" style={{ fontSize: '1rem' }} />
                  <input
                    {...register('username')}
                    type="text"
                    placeholder="Usuario"
                    autoComplete="username"
                    autoFocus
                    className="w-full bg-dreams-surface-2 border border-dreams-border text-dreams-text placeholder-dreams-text-muted rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-dreams-gold transition-colors duration-200"
                    style={{ fontSize: '0.95rem' }}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dreams-gold pointer-events-none" style={{ fontSize: '1rem' }} />
                  <input
                    {...register('password')}
                    type={mostrarPassword ? 'text' : 'password'}
                    placeholder="Contrasena"
                    autoComplete="current-password"
                    className="w-full bg-dreams-surface-2 border border-dreams-border text-dreams-text placeholder-dreams-text-muted rounded-xl pl-11 pr-11 py-3.5 focus:outline-none focus:border-dreams-gold transition-colors duration-200"
                    style={{ fontSize: '0.95rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-dreams-text-muted hover:text-dreams-gold transition-colors"
                  >
                    {mostrarPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.password.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-3.5 rounded-xl font-bold uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(90deg, #c9a227, #D4AF37, #E8C84A, #D4AF37, #c9a227)',
                    color: '#0f0f0f',
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 20px rgba(212,175,55,0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 30px rgba(212,175,55,0.5)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,175,55,0.25)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {cargando ? 'Ingresando...' : 'Acceder'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center">
        <p className="text-dreams-text-muted text-xs">
          &copy; 2026 Dreams Poker Manager — creado por Sebastian Pangue. Todos los derechos reservados.
        </p>
      </footer>

    </div>
  )
}

export default Login