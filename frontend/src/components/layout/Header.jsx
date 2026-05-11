import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  FiHome,
  FiAward,
  FiUsers,
  FiCircle,
  FiUserCheck,
  FiShield,
  FiShoppingCart,
} from 'react-icons/fi'
import useAuthStore from '../../store/auth.store'
const TITULOS_PAGINA = {
  '/dashboard':  { titulo: 'Panel Principal',        Icono: FiHome },
  '/torneos':    { titulo: 'Torneos',                Icono: FiAward },
  '/jugadores':  { titulo: 'Jugadores',              Icono: FiUsers },
  '/fichas':     { titulo: 'Fichas',                 Icono: FiCircle },
  '/staff':      { titulo: 'Gestion de Usuarios',    Icono: FiUserCheck },
  '/auditoria':  { titulo: 'Registro de Actividad',  Icono: FiShield },
  '/caja':       { titulo: 'Caja',                   Icono: FiShoppingCart },
}

const obtenerIniciales = (nombreCompleto) => {
  if (!nombreCompleto) return '--'
  const partes = nombreCompleto.trim().split(' ').filter(Boolean)
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}

export default function Header() {
  const usuario = useAuthStore((s) => s.usuario)
  const { pathname } = useLocation()
  const [hora, setHora] = useState(
    new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )

  useEffect(() => {
    const intervalo = setInterval(() => {
      setHora(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)
    return () => clearInterval(intervalo)
  }, [])

  const rutaBase = '/' + pathname.split('/')[1]
  const pagina = TITULOS_PAGINA[rutaBase] ?? { titulo: 'Tournament Manager', Icono: FiHome }
  const { titulo, Icono } = pagina

  const iniciales = obtenerIniciales(usuario?.nombre)
  const nombreMostrado = usuario?.nombre ?? '—'
  const rolMostrado = usuario?.rol ?? ''

  return (
    <header className="grid grid-cols-3 items-center h-14 px-5 bg-dreams-surface border-b border-dreams-border shrink-0">

      {/* Izquierda: nombre de la pagina */}
      <div className="flex items-center gap-2">
        <Icono size={16} className="text-dreams-text-muted shrink-0" />
        <span className="text-sm font-medium text-dreams-text">
          {titulo}
        </span>
      </div>

      {/* Centro: reloj — siempre centrado */}
      <div className="flex justify-center">
        <span className="text-3xl font-bold text-dreams-gold tracking-[4px] tabular-nums" style={{ fontFamily: 'monospace' }}>
          {hora}
        </span>
      </div>

      {/* Derecha: perfil del usuario */}
      <div className="flex items-center justify-end gap-3">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-medium text-dreams-text whitespace-nowrap">
            {nombreMostrado}
          </span>
          <span className="text-[10px] text-dreams-text-muted tracking-widest uppercase">
            {rolMostrado}
          </span>
        </div>
        <div className="w-[34px] h-[34px] rounded-full bg-[#1f1a0a] border border-dreams-gold flex items-center justify-center shrink-0">
          <span className="text-[11px] font-semibold text-dreams-gold tracking-wide">
            {iniciales}
          </span>
        </div>
      </div>

    </header>
  )
}