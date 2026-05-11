import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiX } from 'react-icons/fi'
import { limpiarRut, formatearRut, validarDvRut, rutParaBd } from '../../utils/rut.utils'

const schemaCrear = z.object({
  rut: z
    .string({ required_error: 'El RUT es requerido.' })
    .min(1, 'El RUT es requerido.'),
  nombre_completo: z
    .string({ required_error: 'El nombre es requerido.' })
    .min(3, 'Minimo 3 caracteres.')
    .max(100, 'Maximo 100 caracteres.'),
  email: z.string().email('Email invalido.').optional().or(z.literal('')),
  telefono: z.string().max(20).optional().or(z.literal('')),
  nacionalidad: z.string().max(50).optional().or(z.literal('')),
  profesion: z.string().max(100).optional().or(z.literal('')),
  genero: z.enum(['MASCULINO', 'FEMENINO', 'OTRO', '']).optional(),
  domicilio: z.string().max(255).optional().or(z.literal('')),
  fecha_nacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
})

const schemaEditar = schemaCrear.omit({ rut: true })

const VALORES_VACIOS = {
  rut: '',
  nombre_completo: '',
  email: '',
  telefono: '',
  nacionalidad: '',
  profesion: '',
  genero: '',
  domicilio: '',
  fecha_nacimiento: '',
}

const claseInput = `
  w-full bg-dreams-dark border border-dreams-border rounded px-3 py-2 text-sm
  text-dreams-text placeholder-dreams-text-muted
  focus:outline-none focus:border-dreams-gold transition-colors duration-150
`
const claseInputError = `
  w-full bg-dreams-dark border border-red-500 rounded px-3 py-2 text-sm
  text-dreams-text placeholder-dreams-text-muted
  focus:outline-none focus:border-red-400 transition-colors duration-150
`
const claseInputOk = `
  w-full bg-dreams-dark border border-green-600 rounded px-3 py-2 text-sm
  text-dreams-text placeholder-dreams-text-muted
  focus:outline-none focus:border-green-500 transition-colors duration-150
`
const claseLabel = 'block text-xs uppercase tracking-wider text-dreams-text-muted font-medium mb-1'
const claseError = 'text-xs text-red-400 mt-1'

export default function ModalJugador({ jugadorEditar, onGuardar, onCerrar, cargando }) {
  const esEdicion = !!jugadorEditar

  // Estado del input de RUT separado del formulario para manejar formateo
  const [rutDisplay, setRutDisplay] = useState('')
  const [rutValido, setRutValido] = useState(null) // null=sin evaluar, true=ok, false=error

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esEdicion ? schemaEditar : schemaCrear),
    defaultValues: VALORES_VACIOS,
  })

  useEffect(() => {
    if (jugadorEditar) {
      reset({
        nombre_completo: jugadorEditar.nombre_completo ?? '',
        email: jugadorEditar.email ?? '',
        telefono: jugadorEditar.telefono ?? '',
        nacionalidad: jugadorEditar.nacionalidad ?? '',
        profesion: jugadorEditar.profesion ?? '',
        genero: jugadorEditar.genero ?? '',
        domicilio: jugadorEditar.domicilio ?? '',
        fecha_nacimiento: jugadorEditar.fecha_nacimiento
          ? jugadorEditar.fecha_nacimiento.substring(0, 10)
          : '',
      })
    } else {
      reset(VALORES_VACIOS)
      setRutDisplay('')
      setRutValido(null)
    }
  }, [jugadorEditar, reset])

  const handleRutChange = (e) => {
    const limpio = limpiarRut(e.target.value)

    if (limpio.length === 0) {
      setRutDisplay('')
      setRutValido(null)
      setValue('rut', '')
      return
    }

    // Formatear para mostrar al usuario
    const formateado = formatearRut(limpio)
    setRutDisplay(formateado)

    // Validar solo cuando el RUT tiene al menos 7 caracteres limpios (minimo 6 numeros + DV)
    if (limpio.length >= 7) {
      const esValido = validarDvRut(limpio)
      setRutValido(esValido)

      if (esValido) {
        // Guardar en el formato que espera la BD: 12345678-9
        setValue('rut', rutParaBd(limpio), { shouldValidate: true })
      } else {
        setValue('rut', '', { shouldValidate: false })
      }
    } else {
      setRutValido(null)
      setValue('rut', '')
    }
  }

  const onSubmit = (datos) => {
    const payload = { ...datos }
    const camposOpcionales = ['email', 'telefono', 'nacionalidad', 'profesion', 'domicilio', 'fecha_nacimiento', 'genero']
    camposOpcionales.forEach((campo) => {
      if (payload[campo] === '') payload[campo] = null
    })
    onGuardar(payload)
  }

  // Clase del input RUT segun estado de validacion
  const claseRut =
    rutValido === null ? claseInput :
    rutValido ? claseInputOk :
    claseInputError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 overflow-y-auto py-6">
      <div className="bg-dreams-surface border border-dreams-border rounded-lg w-full max-w-xl mx-4 shadow-xl">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dreams-border">
          <h2 className="text-base font-semibold text-dreams-text">
            {esEdicion ? 'Editar Jugador' : 'Registrar Jugador'}
          </h2>
          <button onClick={onCerrar} className="text-dreams-text-muted hover:text-dreams-text transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">

          {/* RUT — solo en creacion */}
          {!esEdicion && (
            <div>
              <label className={claseLabel}>RUT</label>
              <input
                type="text"
                value={rutDisplay}
                onChange={handleRutChange}
                placeholder="ej: 18.721.585-4"
                className={claseRut}
                autoComplete="off"
                maxLength={12}
              />
              {/* Mensajes de estado del RUT */}
              {rutValido === false && (
                <p className={claseError}>El digito verificador no es correcto.</p>
              )}
              {rutValido === true && (
                <p className="text-xs text-green-400 mt-1">RUT valido.</p>
              )}
              {errors.rut && rutValido !== false && (
                <p className={claseError}>{errors.rut.message}</p>
              )}
            </div>
          )}

          {/* Nombre completo */}
          <div>
            <label className={claseLabel}>Nombre Completo</label>
            <input
              {...register('nombre_completo')}
              placeholder="ej: Juan Andres Perez"
              className={claseInput}
            />
            {errors.nombre_completo && <p className={claseError}>{errors.nombre_completo.message}</p>}
          </div>

          {/* Fila: Email + Telefono */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={claseLabel}>
                Email <span className="normal-case tracking-normal text-dreams-text-muted">(opcional)</span>
              </label>
              <input {...register('email')} placeholder="juan@correo.cl" className={claseInput} autoComplete="off" />
              {errors.email && <p className={claseError}>{errors.email.message}</p>}
            </div>
            <div>
              <label className={claseLabel}>
                Telefono <span className="normal-case tracking-normal text-dreams-text-muted">(opcional)</span>
              </label>
              <input {...register('telefono')} placeholder="+56 9 1234 5678" className={claseInput} />
            </div>
          </div>

          {/* Fila: Fecha nacimiento + Genero */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={claseLabel}>
                Fecha Nacimiento <span className="normal-case tracking-normal text-dreams-text-muted">(opcional)</span>
              </label>
              <input {...register('fecha_nacimiento')} type="date" className={claseInput} />
              {errors.fecha_nacimiento && <p className={claseError}>{errors.fecha_nacimiento.message}</p>}
            </div>
            <div>
              <label className={claseLabel}>
                Genero <span className="normal-case tracking-normal text-dreams-text-muted">(opcional)</span>
              </label>
              <select {...register('genero')} className={claseInput}>
                <option value="">Sin especificar</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          {/* Fila: Nacionalidad + Profesion */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={claseLabel}>
                Nacionalidad <span className="normal-case tracking-normal text-dreams-text-muted">(opcional)</span>
              </label>
              <input {...register('nacionalidad')} placeholder="ej: Chilena" className={claseInput} />
            </div>
            <div>
              <label className={claseLabel}>
                Profesion <span className="normal-case tracking-normal text-dreams-text-muted">(opcional)</span>
              </label>
              <input {...register('profesion')} placeholder="ej: Ingeniero" className={claseInput} />
            </div>
          </div>

          {/* Domicilio */}
          <div>
            <label className={claseLabel}>
              Domicilio <span className="normal-case tracking-normal text-dreams-text-muted">(opcional)</span>
            </label>
            <input {...register('domicilio')} placeholder="ej: Av. Ramon Picarte 123, Valdivia" className={claseInput} />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2 border-t border-dreams-border mt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-sm text-dreams-text-muted hover:text-dreams-text border border-dreams-border rounded transition-colors duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-4 py-2 text-sm font-medium bg-dreams-gold text-dreams-dark rounded hover:bg-dreams-gold-light transition-colors duration-150 disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Registrar Jugador'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}