import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiX, FiImage } from 'react-icons/fi'
import api from '../../services/api.js'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(50, 'Maximo 50 caracteres'),
  color: z.string().min(1, 'El color es obligatorio').max(30),
})

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

function extraerColor(nombre) {
  if (!nombre || nombre.trim() === '') return ''
  const palabras = nombre.trim().split(/\s+/)
  return palabras[palabras.length - 1]
}

async function removerFondo(archivo) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(archivo)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const datos = imageData.data
      const ancho = canvas.width
      const alto = canvas.height

      const fondoR = datos[0]
      const fondoG = datos[1]
      const fondoB = datos[2]
      const tolerancia = 35

      const visitado = new Uint8Array(ancho * alto)

      function esSimilarAlFondo(indice) {
        const r = datos[indice]
        const g = datos[indice + 1]
        const b = datos[indice + 2]
        const diferencia = Math.sqrt(
          Math.pow(r - fondoR, 2) +
          Math.pow(g - fondoG, 2) +
          Math.pow(b - fondoB, 2)
        )
        return diferencia < tolerancia
      }

      function floodFill(xInicio, yInicio) {
        const pila = [[xInicio, yInicio]]

        while (pila.length > 0) {
          const [x, y] = pila.pop()

          if (x < 0 || x >= ancho || y < 0 || y >= alto) continue

          const pos = y * ancho + x
          if (visitado[pos]) continue

          const indice = pos * 4
          if (!esSimilarAlFondo(indice)) continue

          visitado[pos] = 1
          datos[indice + 3] = 0

          pila.push([x + 1, y])
          pila.push([x - 1, y])
          pila.push([x, y + 1])
          pila.push([x, y - 1])
        }
      }

      floodFill(0, 0)
      floodFill(ancho - 1, 0)
      floodFill(0, alto - 1)
      floodFill(ancho - 1, alto - 1)

      ctx.putImageData(imageData, 0, 0)

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        const archivoPng = new File([blob], 'ficha.png', { type: 'image/png' })
        resolve(archivoPng)
      }, 'image/png')
    }

    img.src = url
  })
}

export default function ModalFicha({ ficha, onCerrar }) {
  const queryClient = useQueryClient()
  const esEdicion = !!ficha

  const [previstaImagen, setPrevistaImagen] = useState(
    ficha?.img_path ? `http://localhost:3000${ficha.img_path}` : null
  )
  const [archivoImagen, setArchivoImagen] = useState(null)
  const [errorImagen, setErrorImagen] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [colorVisible, setColorVisible] = useState(ficha?.color || '')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: ficha?.nombre || '',
      color: ficha?.color || '',
    },
  })

  function manejarBlurNombre(e) {
    const colorExtraido = extraerColor(e.target.value)
    setValue('color', colorExtraido)
    setColorVisible(colorExtraido)
  }

  async function manejarImagen(e) {
    const archivo = e.target.files[0]
    if (!archivo) return

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']
    if (!tiposPermitidos.includes(archivo.type)) {
      setErrorImagen('Solo se permiten imagenes JPG, PNG o WebP')
      return
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setErrorImagen('La imagen no puede superar los 5MB')
      return
    }

    setErrorImagen('')
    setProcesando(true)

    const archivoProcesado = await removerFondo(archivo)
    setArchivoImagen(archivoProcesado)
    setPrevistaImagen(URL.createObjectURL(archivoProcesado))
    setProcesando(false)
  }

  const mutacion = useMutation({
    mutationFn: async (datos) => {
      const formData = new FormData()
      formData.append('nombre', datos.nombre)
      formData.append('color', datos.color)
      if (archivoImagen) {
        formData.append('imagen', archivoImagen)
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } }

      if (esEdicion) {
        return api.put(`/fichas/${ficha.id_ficha}`, formData, config)
      } else {
        return api.post('/fichas', formData, config)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fichas'] })
      onCerrar()
    },
  })

  function onSubmit(datos) {
    if (!esEdicion && !archivoImagen) {
      setErrorImagen('La imagen es obligatoria')
      return
    }
    mutacion.mutate(datos)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-dreams-surface border border-dreams-border rounded-xl w-full max-w-md mx-4 shadow-2xl">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dreams-border">
          <h2 className="text-white font-semibold text-lg">
            {esEdicion ? 'Editar Ficha' : 'Nueva Ficha'}
          </h2>
          <button
            onClick={onCerrar}
            className="text-dreams-text-muted hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-dreams-text text-sm font-medium">
              Nombre
            </label>
            <input
              {...register('nombre')}
              placeholder="Ej: Ficha Amarilla"
              onBlur={manejarBlurNombre}
              className="bg-dreams-surface-2 border border-dreams-border text-white placeholder-dreams-text-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-dreams-gold transition-colors"
            />
            {errors.nombre && (
              <p className="text-red-400 text-xs">{errors.nombre.message}</p>
            )}
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-dreams-text text-sm font-medium">
              Color
              <span className="text-dreams-text-muted font-normal ml-1 text-xs">
                (se extrae automaticamente del nombre)
              </span>
            </label>
            <input
              {...register('color')}
              readOnly
              className="bg-dreams-surface-2 border border-dreams-border rounded-lg px-3 py-2 text-sm cursor-default focus:outline-none font-medium"
              style={{ color: obtenerColorHex(colorVisible) }}
            />
            {errors.color && (
              <p className="text-red-400 text-xs">{errors.color.message}</p>
            )}
          </div>

          {/* Imagen */}
          <div className="flex flex-col gap-1.5">
            <label className="text-dreams-text text-sm font-medium">
              Imagen
              <span className="text-dreams-text-muted font-normal ml-1 text-xs">
                (JPG, PNG o WebP — max 5MB)
              </span>
            </label>

            <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-dreams-border hover:border-dreams-gold rounded-xl p-5 transition-colors group min-h-[120px]">
              {procesando ? (
                <p className="text-dreams-text-muted text-xs">Procesando imagen...</p>
              ) : previstaImagen ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={previstaImagen}
                    alt="Vista previa"
                    className="h-24 object-contain drop-shadow-lg"
                  />
                  <p className="text-dreams-text-muted text-xs group-hover:text-dreams-text transition-colors">
                    Clic para cambiar imagen
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FiImage
                    size={32}
                    className="text-dreams-text-muted group-hover:text-dreams-gold transition-colors"
                  />
                  <p className="text-dreams-text-muted text-xs group-hover:text-dreams-text transition-colors text-center">
                    Clic para seleccionar una imagen
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={manejarImagen}
              />
            </label>

            {errorImagen && (
              <p className="text-red-400 text-xs">{errorImagen}</p>
            )}
          </div>

          {/* Error de mutacion */}
          {mutacion.isError && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-lg py-2">
              Ocurrio un error al guardar. Intenta nuevamente.
            </p>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 border border-dreams-border text-dreams-text hover:bg-dreams-surface-2 py-2 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutacion.isPending || procesando}
              className="flex-1 bg-dreams-gold hover:bg-dreams-gold-light disabled:opacity-50 text-black font-semibold py-2 rounded-lg text-sm transition-colors"
            >
              {mutacion.isPending
                ? 'Guardando...'
                : esEdicion ? 'Guardar Cambios' : 'Crear Ficha'
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}