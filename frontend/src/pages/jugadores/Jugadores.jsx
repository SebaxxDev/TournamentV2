import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiSearch, FiX, FiUserPlus, FiSlash, FiCheck, FiTrash2 } from 'react-icons/fi'
import api from '../../services/api'
import useAuthStore from '../../store/auth.store'
import ModalJugador from './ModalJugador'

const ROLES_ADMIN = ['ADMIN', 'DIRECTOR']

const BadgeEstado = ({ activo }) => (
  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide uppercase ${
    activo
      ? 'bg-green-950 text-green-400 border border-green-900'
      : 'bg-red-950 text-red-400 border border-red-900'
  }`}>
    {activo ? 'Activo' : 'Inactivo'}
  </span>
)

const BadgeListaNegra = () => (
  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide uppercase bg-red-950 text-red-400 border border-red-900">
    Lista Negra
  </span>
)

export default function Jugadores() {
  const queryClient = useQueryClient()
  const usuario = useAuthStore((s) => s.usuario)
  const esAdmin = ROLES_ADMIN.includes(usuario?.rol)

  const [busqueda, setBusqueda] = useState('')
  const [busquedaActiva, setBusquedaActiva] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [jugadorEditar, setJugadorEditar] = useState(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['jugadores', busquedaActiva, pagina],
    queryFn: () =>
      api
        .get('/jugadores', { params: { busqueda: busquedaActiva, pagina, limite: 20 } })
        .then((r) => r.data.datos),
    keepPreviousData: true,
  })

  const jugadores = data?.jugadores ?? []
  const paginacion = data?.paginacion ?? { total: 0, totalPaginas: 1 }

  const mutacionCrear = useMutation({
    mutationFn: (datos) => api.post('/jugadores', datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jugadores'] })
      cerrarModal()
    },
  })

  const mutacionEditar = useMutation({
    mutationFn: ({ rut, datos }) => api.put(`/jugadores/${rut}`, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jugadores'] })
      cerrarModal()
    },
  })

  const mutacionListaNegra = useMutation({
    mutationFn: ({ rut, lista_negra, motivo }) =>
      api.patch(`/jugadores/${rut}/lista-negra`, { lista_negra, motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jugadores'] })
    },
  })

  const mutacionEliminar = useMutation({
    mutationFn: (rut) => api.delete(`/jugadores/${rut}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jugadores'] })
    },
    onError: (error) => {
      const mensaje = error.response?.data?.mensaje ?? 'No se pudo eliminar el jugador.'
      alert(mensaje)
    },
  })

  const handleEliminar = (jugador) => {
    if (!window.confirm(`¿Confirmas que deseas eliminar permanentemente a ${jugador.nombre_completo}? Esta accion no se puede deshacer.`)) return
    mutacionEliminar.mutate(jugador.rut)
  }

  const abrirCrear = () => { setJugadorEditar(null); setModalAbierto(true) }
  const abrirEditar = (jugador) => { setJugadorEditar(jugador); setModalAbierto(true) }
  const cerrarModal = () => { setModalAbierto(false); setJugadorEditar(null) }

  const handleGuardar = (datos) => {
    if (jugadorEditar) {
      mutacionEditar.mutate({ rut: jugadorEditar.rut, datos })
    } else {
      mutacionCrear.mutate(datos)
    }
  }

  const handleToggleListaNegra = (jugador) => {
    const accion = jugador.lista_negra ? false : true
    const motivo = accion
      ? window.prompt('Ingresa el motivo para agregar a lista negra:')
      : null
    if (accion && motivo === null) return
    mutacionListaNegra.mutate({ rut: jugador.rut, lista_negra: accion, motivo })
  }

  const handleBuscar = useCallback((e) => {
    e.preventDefault()
    setBusquedaActiva(busqueda.trim())
    setPagina(1)
  }, [busqueda])

  const limpiarBusqueda = () => {
    setBusqueda('')
    setBusquedaActiva('')
    setPagina(1)
  }

  const errorMutacion =
    mutacionCrear.error?.response?.data?.mensaje ||
    mutacionEditar.error?.response?.data?.mensaje ||
    null

  const cargandoMutacion = mutacionCrear.isPending || mutacionEditar.isPending

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Barra de busqueda y accion */}
      <form onSubmit={handleBuscar} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
              <FiSearch size={16} className="text-dreams-text-muted" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o RUT..."
              className="w-80 bg-dreams-surface border border-dreams-border rounded px-3 py-2 pl-9 pr-9 text-sm text-dreams-text placeholder-dreams-text-muted focus:outline-none focus:border-dreams-gold transition-colors duration-150"
            />
            {busqueda && (
              <button
                type="button"
                onClick={limpiarBusqueda}
                className="absolute right-3 inset-y-0 flex items-center text-dreams-text-muted hover:text-dreams-text transition-colors"
              >
                <FiX size={15} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-dreams-surface border border-dreams-border text-dreams-text rounded hover:border-dreams-gold hover:text-dreams-gold transition-colors duration-150"
          >
            Buscar
          </button>
        </div>
        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 bg-dreams-gold text-dreams-dark text-sm font-medium rounded hover:bg-dreams-gold-light transition-colors duration-150 whitespace-nowrap"
        >
          <FiUserPlus size={15} />
          Nuevo Jugador
        </button>
      </form>

      {/* Tabla */}
      <div className="rounded border border-dreams-border overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-dreams-surface-2 text-dreams-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-medium">Nombre</th>
              <th className="text-left px-4 py-2.5 font-medium">RUT</th>
              <th className="text-left px-4 py-2.5 font-medium">Email</th>
              <th className="text-left px-4 py-2.5 font-medium">Telefono</th>
              <th className="text-left px-4 py-2.5 font-medium">Estado</th>
              <th className="text-left px-4 py-2.5 font-medium">Lista Negra</th>
              <th className="text-center px-4 py-2.5 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-dreams-text-muted text-sm">
                  Cargando...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-red-400 text-sm">
                  Error al cargar los jugadores
                </td>
              </tr>
            ) : jugadores.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-dreams-text-muted text-sm">
                  {busquedaActiva ? 'No se encontraron jugadores con ese criterio' : 'No hay jugadores registrados'}
                </td>
              </tr>
            ) : (
              jugadores.map((jugador, idx) => (
                <tr
                  key={jugador.rut}
                  className={`border-t border-dreams-border transition-colors duration-100 hover:bg-dreams-surface-2 ${
                    jugador.lista_negra ? 'bg-red-950/20' : ''
                  } ${idx === 0 ? 'border-t-0' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-dreams-text">
                    {jugador.nombre_completo}
                  </td>
                  <td className="px-4 py-3 text-dreams-text-muted font-mono text-xs">
                    {jugador.rut}
                  </td>
                  <td className="px-4 py-3 text-dreams-text-muted text-xs">
                    {jugador.email ?? <span className="text-dreams-border">—</span>}
                  </td>
                  <td className="px-4 py-3 text-dreams-text-muted text-xs">
                    {jugador.telefono ?? <span className="text-dreams-border">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <BadgeEstado activo={jugador.activo} />
                  </td>
                  <td className="px-4 py-3">
                    {jugador.lista_negra ? <BadgeListaNegra /> : <span className="text-dreams-border text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => abrirEditar(jugador)}
                        className="text-dreams-text-muted hover:text-dreams-gold transition-colors duration-100"
                        title="Editar jugador"
                      >
                        <FiEdit2 size={15} />
                      </button>
                      {esAdmin && (
                        <button
                          onClick={() => handleToggleListaNegra(jugador)}
                          disabled={mutacionListaNegra.isPending}
                          className={`transition-colors duration-100 disabled:opacity-30 ${
                            jugador.lista_negra
                              ? 'text-green-400 hover:text-green-300'
                              : 'text-dreams-text-muted hover:text-red-400'
                          }`}
                          title={jugador.lista_negra ? 'Quitar de lista negra' : 'Agregar a lista negra'}
                        >
                          {jugador.lista_negra ? <FiCheck size={15} /> : <FiSlash size={15} />}
                        </button>
                      )}
                      {usuario?.rol === 'ADMIN' && (
                        <button
                          onClick={() => handleEliminar(jugador)}
                          disabled={mutacionEliminar.isPending}
                          className="text-dreams-text-muted hover:text-red-400 transition-colors duration-100 disabled:opacity-30"
                          title="Eliminar jugador permanentemente"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginacion */}
      {paginacion.totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-dreams-text-muted text-xs">
            {paginacion.total} jugadores en total
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-3 py-1.5 text-xs border border-dreams-border rounded text-dreams-text-muted hover:border-dreams-gold hover:text-dreams-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-dreams-text-muted text-xs px-2">
              {pagina} / {paginacion.totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(paginacion.totalPaginas, p + 1))}
              disabled={pagina === paginacion.totalPaginas}
              className="px-3 py-1.5 text-xs border border-dreams-border rounded text-dreams-text-muted hover:border-dreams-gold hover:text-dreams-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Error de mutacion */}
      {errorMutacion && (
        <p className="text-sm text-red-400 text-center">{errorMutacion}</p>
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalJugador
          jugadorEditar={jugadorEditar}
          onGuardar={handleGuardar}
          onCerrar={cerrarModal}
          cargando={cargandoMutacion}
        />
      )}

    </div>
  )
}