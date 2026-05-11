import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiToggleLeft, FiToggleRight, FiUserPlus, FiSearch, FiX, FiTrash2 } from 'react-icons/fi'
import api from '../../services/api'
import ModalStaff from './ModalStaff'
import useAuthStore from '../../store/auth.store'

const ORDEN_ROLES = ['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO', 'CROUPIER']

const COLORES_ROL = {
  ADMIN:      'bg-[#1f1a0a] text-dreams-gold border border-dreams-gold/30',
  DIRECTOR:   'bg-blue-950 text-blue-400 border border-blue-900',
  SUPERVISOR: 'bg-green-950 text-green-400 border border-green-900',
  CAJERO:     'bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border',
  CROUPIER:   'bg-dreams-surface-2 text-dreams-text-muted border border-dreams-border',
}

const COLORES_SECCION = {
  ADMIN:      'text-dreams-gold border-dreams-gold/30',
  DIRECTOR:   'text-blue-400 border-blue-900',
  SUPERVISOR: 'text-green-400 border-green-900',
  CAJERO:     'text-dreams-text-muted border-dreams-border',
  CROUPIER:   'text-dreams-text-muted border-dreams-border',
}

const BadgeRol = ({ rol }) => (
  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide uppercase ${COLORES_ROL[rol] ?? COLORES_ROL.CAJERO}`}>
    {rol}
  </span>
)

const BadgeEstado = ({ activo }) => (
  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide uppercase ${
    activo
      ? 'bg-green-950 text-green-400 border border-green-900'
      : 'bg-red-950 text-red-400 border border-red-900'
  }`}>
    {activo ? 'Activo' : 'Inactivo'}
  </span>
)

const FilaStaff = ({ miembro, idx, onEditar, onToggle, desactivando, onEliminar, esAdmin }) => (
  <tr className={`border-t border-dreams-border hover:bg-dreams-surface-2 transition-colors duration-100 ${idx === 0 ? 'border-t-0' : ''}`}>
      <td className="px-4 py-3 font-medium text-dreams-text">
      {miembro.nombre_completo}
    </td>
    <td className="px-4 py-3 text-dreams-text-muted font-mono text-xs">
      {miembro.username}
    </td>
    <td className="px-4 py-3 text-dreams-text-muted text-xs">
      {miembro.email ?? <span className="text-dreams-border">—</span>}
    </td>
    <td className="px-4 py-3">
      <BadgeEstado activo={miembro.activo} />
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => onEditar(miembro)}
          className="text-dreams-text-muted hover:text-dreams-gold transition-colors duration-100"
          title="Editar usuario"
        >
          <FiEdit2 size={15} />
        </button>
        <button
          onClick={() => onToggle(miembro)}
          disabled={miembro.rol === 'ADMIN' || desactivando}
          className={`transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed ${
            miembro.activo
              ? 'text-green-400 hover:text-red-400'
              : 'text-red-400 hover:text-green-400'
          }`}
          title={miembro.activo ? 'Desactivar usuario' : 'Activar usuario'}
        >
          {miembro.activo ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
        </button>
        {esAdmin && miembro.rol !== 'ADMIN' && (
          <button
            onClick={() => onEliminar(miembro)}
            className="text-dreams-text-muted hover:text-red-400 transition-colors duration-100"
            title="Eliminar usuario"
          >
            <FiTrash2 size={15} />
          </button>
        )}
      </div>
    </td>
  </tr>
)

export default function Staff() {
  const queryClient = useQueryClient()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [staffEditar, setStaffEditar] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const { data: staff = [], isLoading, isError } = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get('/staff').then((r) => r.data.datos),
  })

  const mutacionCrear = useMutation({
    mutationFn: (datos) => api.post('/staff', datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      cerrarModal()
    },
  })

  const mutacionEditar = useMutation({
    mutationFn: ({ id, datos }) => api.put(`/staff/${id}`, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      cerrarModal()
    },
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, activo }) => api.patch(`/staff/${id}/estado`, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  const usuario = useAuthStore((s) => s.usuario)

  const mutacionEliminar = useMutation({
    mutationFn: (id) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error) => {
      const mensaje = error.response?.data?.mensaje ?? 'No se pudo eliminar el usuario.'
      alert(mensaje)
    },
  })

  const handleEliminar = (miembro) => {
    if (!window.confirm(`¿Confirmas que deseas eliminar a ${miembro.nombre_completo}? Esta accion no se puede deshacer.`)) return
    mutacionEliminar.mutate(miembro.id_staff)
  }

  const abrirCrear = () => { setStaffEditar(null); setModalAbierto(true) }
  const abrirEditar = (miembro) => { setStaffEditar(miembro); setModalAbierto(true) }
  const cerrarModal = () => { setModalAbierto(false); setStaffEditar(null) }

  const handleGuardar = (datos) => {
    if (staffEditar) {
      mutacionEditar.mutate({ id: staffEditar.id_staff, datos })
    } else {
      mutacionCrear.mutate(datos)
    }
  }

  const handleToggleEstado = (miembro) => {
    if (miembro.rol === 'ADMIN') return
    mutacionEstado.mutate({ id: miembro.id_staff, activo: !miembro.activo })
  }

  const errorMutacion =
    mutacionCrear.error?.response?.data?.mensaje ||
    mutacionEditar.error?.response?.data?.mensaje ||
    null

  const cargandoMutacion = mutacionCrear.isPending || mutacionEditar.isPending

  // Filtrar por busqueda
  const staffFiltrado = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return staff
    return staff.filter(
      (m) =>
        m.nombre_completo.toLowerCase().includes(termino) ||
        m.username.toLowerCase().includes(termino)
    )
  }, [staff, busqueda])

  // Agrupar staff por rol respetando el orden definido
  const staffPorRol = ORDEN_ROLES.reduce((acc, rol) => {
    const grupo = staffFiltrado.filter((m) => m.rol === rol)
    if (grupo.length > 0) acc[rol] = grupo
    return acc
  }, {})

  const columnas = (
    <tr className="bg-dreams-surface-2 text-dreams-text-muted text-xs uppercase tracking-wider">
      <th className="text-left px-4 py-2.5 font-medium">Nombre</th>
      <th className="text-left px-4 py-2.5 font-medium">Username</th>
      <th className="text-left px-4 py-2.5 font-medium">Email</th>
      <th className="text-left px-4 py-2.5 font-medium">Estado</th>
      <th className="text-center px-4 py-2.5 font-medium">Acciones</th>
    </tr>
  )

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Barra de busqueda y accion */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
              <FiSearch size={16} className="text-dreams-text-muted" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o username..."
              className="w-80 bg-dreams-surface border border-dreams-border rounded px-3 py-2 pl-9 pr-9 text-sm text-dreams-text placeholder-dreams-text-muted focus:outline-none focus:border-dreams-gold transition-colors duration-150"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 inset-y-0 flex items-center text-dreams-text-muted hover:text-dreams-text transition-colors"
              >
                <FiX size={15} />
              </button>
            )}
          </div>
          <button
            onClick={() => {}}
            className="px-4 py-2 text-sm font-medium bg-dreams-surface border border-dreams-border text-dreams-text rounded hover:border-dreams-gold hover:text-dreams-gold transition-colors duration-150"
          >
            Buscar
          </button>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 bg-dreams-gold text-dreams-dark text-sm font-medium rounded hover:bg-dreams-gold-light transition-colors duration-150 whitespace-nowrap"
        >
          <FiUserPlus size={15} />
          Nuevo Usuario
        </button>
      </div>

      {/* Estado de carga / error */}
      {isLoading && (
        <p className="text-center text-dreams-text-muted text-sm py-10">Cargando...</p>
      )}
      {isError && (
        <p className="text-center text-red-400 text-sm py-10">Error al cargar los usuarios</p>
      )}

      {/* Tablas agrupadas por rol */}
      {!isLoading && !isError && (
        <div className="flex flex-col gap-8">
          {Object.entries(staffPorRol).map(([rol, miembros]) => (
            <section key={rol}>

              {/* Encabezado de seccion */}
              <div className={`flex items-center gap-3 mb-3 pb-2 border-b ${COLORES_SECCION[rol]}`}>
                <h2 className={`text-xs font-semibold uppercase tracking-[2px] ${COLORES_SECCION[rol].split(' ')[0]}`}>
                  {rol}
                </h2>

              </div>

              {/* Tabla del grupo */}
              <div className="rounded border border-dreams-border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>{columnas}</thead>
                  <tbody>
                    {miembros.map((miembro, idx) => (
                      <FilaStaff
                        key={miembro.id_staff}
                        miembro={miembro}
                        idx={idx}
                        onEditar={abrirEditar}
                        onToggle={handleToggleEstado}
                        desactivando={mutacionEstado.isPending}
                        onEliminar={handleEliminar}
                        esAdmin={usuario?.rol === 'ADMIN'}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

            </section>
          ))}

          {staff.length === 0 && (
            <p className="text-center text-dreams-text-muted text-sm py-10">
              {busqueda ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
            </p>
          )}
        </div>
      )}

      {/* Error de mutacion */}
      {errorMutacion && (
        <p className="text-sm text-red-400 text-center">{errorMutacion}</p>
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalStaff
          staffEditar={staffEditar}
          onGuardar={handleGuardar}
          onCerrar={cerrarModal}
          cargando={cargandoMutacion}
        />
      )}

    </div>
  )
}