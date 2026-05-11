import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiPackage } from 'react-icons/fi'
import api from '../../services/api.js'
import ModalFicha from './ModalFicha.jsx'

const MAPA_COLORES = {
  amarilla: '#FFD700',
  roja: '#E53E3E',
  azul: '#3182CE',
  celeste: '#63B3ED',
  negra: '#718096',
  verde: '#38A169',
  blanca: '#FFFFFF',
  morada: '#805AD5',
  naranja: '#ED8936',
  rosada: '#ED64A6',
  gris: '#A0AEC0',
  cafe: '#975A16',
}

function obtenerColorHex(color) {
  return MAPA_COLORES[color?.toLowerCase()] ?? '#cccccc'
}

async function obtenerFichas() {
  const res = await api.get('/fichas')
  return res.data.datos
}

export default function Fichas() {
  const queryClient = useQueryClient()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null)

  const { data: fichas = [], isLoading } = useQuery({
    queryKey: ['fichas'],
    queryFn: obtenerFichas,
  })

  const mutacionEstado = useMutation({
    mutationFn: (id_ficha) => api.patch(`/fichas/${id_ficha}/estado`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fichas'] }),
  })

  const mutacionEliminar = useMutation({
    mutationFn: (id_ficha) => api.delete(`/fichas/${id_ficha}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fichas'] }),
  })

  function abrirCrear() {
    setFichaSeleccionada(null)
    setModalAbierto(true)
  }

  function abrirEditar(ficha) {
    setFichaSeleccionada(ficha)
    setModalAbierto(true)
  }

  function confirmarEliminar(ficha) {
    if (confirm(`¿Eliminar la ficha "${ficha.nombre}"? Esta accion eliminara la imagen y no se puede deshacer.`)) {
      mutacionEliminar.mutate(ficha.id_ficha)
    }
  }

  return (
    <div className="p-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Catalogo de Fichas</h1>
          <p className="text-dreams-text-muted text-sm mt-1">
            Administra las fichas disponibles para los torneos
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-dreams-gold hover:bg-dreams-gold-light text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <FiPlus size={16} />
          Nueva Ficha
        </button>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <p className="text-dreams-text-muted text-sm">Cargando fichas...</p>
        </div>
      ) : fichas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-dreams-text-muted gap-3">
          <FiPackage size={40} className="opacity-30" />
          <p className="text-base">No hay fichas registradas</p>
          <p className="text-sm opacity-60">Crea la primera ficha para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {fichas.map((ficha) => (
            <TarjetaFicha
              key={ficha.id_ficha}
              ficha={ficha}
              onEditar={() => abrirEditar(ficha)}
              onEliminar={() => confirmarEliminar(ficha)}
              onToggleEstado={() => mutacionEstado.mutate(ficha.id_ficha)}
              cargandoEstado={mutacionEstado.isPending}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <ModalFicha
          ficha={fichaSeleccionada}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}

function TarjetaFicha({ ficha, onEditar, onEliminar, onToggleEstado, cargandoEstado }) {
  return (
    <div
      className={`
        bg-dreams-surface border border-dreams-border rounded-xl p-4
        flex flex-col items-center gap-3 transition-opacity duration-200
        ${!ficha.activo ? 'opacity-50' : ''}
      `}
    >
      {/* Nombre */}
      <p className="text-white font-semibold text-sm text-center leading-tight">
        {ficha.nombre}
      </p>

      {/* Imagen */}
      <div className="w-24 h-24 flex items-center justify-center">
        <img
          src={`http://localhost:3000${ficha.img_path}`}
          alt={ficha.nombre}
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>

      {/* Badge color */}
      <span
        className="bg-dreams-surface-2 border border-dreams-border text-xs px-3 py-1 rounded-full font-medium"
        style={{ color: obtenerColorHex(ficha.color) }}
      >
        {ficha.color}
      </span>

      {/* Acciones */}
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={onEditar}
          className="flex-1 flex items-center justify-center gap-1.5 border border-dreams-gold text-dreams-gold hover:bg-dreams-gold hover:text-black text-xs font-medium py-1.5 rounded-lg transition-colors"
        >
          <FiEdit2 size={12} />
          Editar
        </button>
        <button
          onClick={onEliminar}
          className="flex-1 flex items-center justify-center gap-1.5 border border-red-800 text-red-500 hover:bg-red-800 hover:text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
        >
          <FiTrash2 size={12} />
          Eliminar
        </button>
      </div>

      {/* Toggle estado */}
      <button
        onClick={onToggleEstado}
        disabled={cargandoEstado}
        className={`
          flex items-center gap-1.5 text-xs w-full justify-center py-1 rounded transition-colors disabled:opacity-40
          ${ficha.activo ? 'text-green-400 hover:text-green-300' : 'text-dreams-text-muted hover:text-white'}
        `}
      >
        {ficha.activo
          ? <FiToggleRight size={15} />
          : <FiToggleLeft size={15} />
        }
        {ficha.activo ? 'Activa' : 'Inactiva'}
      </button>
    </div>
  )
}