import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiPlusCircle,
  FiAward,
  FiUsers,
  FiCircle,
  FiUserCheck,
  FiShield,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import useAuthStore from '../../store/auth.store';
import api from '../../services/api';
import logo from '../../assets/logo.png';

const ROLES_ADMIN = ['ADMIN', 'DIRECTOR'];

export default function Sidebar() {
  const [colapsado, setColapsado] = useState(false);
  const usuario = useAuthStore((s) => s.usuario);
  const limpiarUsuario = useAuthStore((s) => s.limpiarUsuario);
  const navigate = useNavigate();

  const rol = usuario?.rol ?? '';
  const esAdmin = ROLES_ADMIN.includes(rol);

  const cerrarSesion = async () => {
    await api.post('/auth/logout');
    limpiarUsuario();
    navigate('/login');
  };

  const claseBase =
    'flex items-center gap-3 px-3 py-2 text-sm rounded-none border-l-2 border-transparent transition-all duration-150 whitespace-nowrap overflow-hidden';
  const claseActivo =
    'bg-[#1f1a0a] text-dreams-gold border-l-dreams-gold';
  const claseInactivo =
    'text-dreams-text-muted hover:bg-dreams-surface-2 hover:text-dreams-text border-l-transparent';

  return (
    <aside
      className="relative flex flex-col bg-dreams-surface border-r border-dreams-border transition-all duration-250 shrink-0"
      style={{ width: colapsado ? '64px' : '240px' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-dreams-border min-h-[80px]">
        <img
          src={logo}
          alt="Casino Dreams"
          className="object-contain transition-all duration-250"
          style={{ height: colapsado ? '44px' : '88px', width: colapsado ? '44px' : '100%' }}
        />
      </div>

      {/* Navegacion */}
      <nav className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-2 gap-0.5">

        {/* Boton crear torneo */}
        <button
          onClick={() => navigate('/torneos/crear')}
          title="Crear Torneo"
          className={`
            mx-2 my-1 flex items-center gap-3 px-3 py-2.5 rounded
            bg-dreams-gold text-dreams-dark text-sm font-medium
            hover:bg-dreams-gold-light transition-colors duration-150 whitespace-nowrap overflow-hidden
            ${colapsado ? 'justify-center' : ''}
          `}
        >
          <FiPlusCircle size={16} className="shrink-0" />
          {!colapsado && <span>Crear Torneo</span>}
        </button>

        {/* Panel principal */}
        <NavLink
          to="/dashboard"
          title="Panel Principal"
          className={({ isActive }) =>
            `${claseBase} ${colapsado ? 'justify-center px-0' : ''} ${isActive ? claseActivo : claseInactivo}`
          }
        >
          <FiHome size={16} className="shrink-0" />
          {!colapsado && <span>Panel Principal</span>}
        </NavLink>

        {/* Torneos */}
        <NavLink
          to="/torneos"
          title="Torneos"
          className={({ isActive }) =>
            `${claseBase} ${colapsado ? 'justify-center px-0' : ''} ${isActive ? claseActivo : claseInactivo}`
          }
        >
          <FiAward size={16} className="shrink-0" />
          {!colapsado && <span>Torneos</span>}
        </NavLink>

        {/* Jugadores */}
        <NavLink
          to="/jugadores"
          title="Jugadores"
          className={({ isActive }) =>
            `${claseBase} ${colapsado ? 'justify-center px-0' : ''} ${isActive ? claseActivo : claseInactivo}`
          }
        >
          <FiUsers size={16} className="shrink-0" />
          {!colapsado && <span>Jugadores</span>}
        </NavLink>

        {/* Separador - Administracion */}
        <div className="mt-3 mb-1 border-t border-dreams-border" />
        {!colapsado && (
          <p className="px-3 py-1 text-[10px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium">
            Administracion
          </p>
        )}

        {/* Fichas */}
        <NavLink
          to="/fichas"
          title="Fichas"
          className={({ isActive }) =>
            `${claseBase} ${colapsado ? 'justify-center px-0' : ''} ${isActive ? claseActivo : claseInactivo}`
          }
        >
          <FiCircle size={16} className="shrink-0" />
          {!colapsado && <span>Fichas</span>}
        </NavLink>

        {/* Gestion de usuarios - solo ADMIN y DIRECTOR */}
        {esAdmin && (
          <NavLink
            to="/staff"
            title="Gestion de Usuarios"
            className={({ isActive }) =>
              `${claseBase} ${colapsado ? 'justify-center px-0' : ''} ${isActive ? claseActivo : claseInactivo}`
            }
          >
            <FiUserCheck size={16} className="shrink-0" />
            {!colapsado && <span>Gestion de Usuarios</span>}
          </NavLink>
        )}

        {/* Separador - Sistema (solo ADMIN y DIRECTOR) */}
        {esAdmin && (
          <>
            <div className="mt-3 mb-1 border-t border-dreams-border" />
            {!colapsado && (
              <p className="px-3 py-1 text-[10px] uppercase tracking-[1.5px] text-dreams-text-muted font-medium">
                Sistema
              </p>
            )}
            <NavLink
              to="/auditoria"
              title="Registro de Actividad"
              className={({ isActive }) =>
                `${claseBase} ${colapsado ? 'justify-center px-0' : ''} ${isActive ? claseActivo : claseInactivo}`
              }
            >
              <FiShield size={16} className="shrink-0" />
              {!colapsado && <span>Registro de Actividad</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* Cerrar sesion */}
      <div className="border-t border-dreams-border">
        <button
          onClick={cerrarSesion}
          title="Cerrar Sesion"
          className={`
            w-full flex items-center gap-3 px-3 py-3 text-sm
            text-red-500 hover:text-red-300 hover:bg-red-950 transition-colors duration-150 whitespace-nowrap overflow-hidden
            ${colapsado ? 'justify-center' : ''}
          `}
        >
          <FiLogOut size={16} className="shrink-0" />
          {!colapsado && <span>Cerrar Sesion</span>}
        </button>
      </div>

      {/* Boton toggle */}
      <button
        onClick={() => setColapsado(!colapsado)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center
          bg-dreams-surface-2 border border-dreams-border rounded-full
          text-dreams-text-muted hover:text-dreams-text hover:bg-dreams-border transition-all duration-150 z-10"
        title={colapsado ? 'Expandir' : 'Colapsar'}
      >
        {colapsado ? <FiChevronRight size={12} /> : <FiChevronLeft size={12} />}
      </button>
    </aside>
  );
}