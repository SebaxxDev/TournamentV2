import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiX } from 'react-icons/fi'

const schemaCrear = z.object({
  username: z
    .string({ required_error: 'El username es requerido.' })
    .min(3, 'Minimo 3 caracteres.')
    .max(50, 'Maximo 50 caracteres.')
    .regex(/^[a-z0-9_]+$/, 'Solo letras minusculas, numeros y guion bajo.'),
  password: z
    .string({ required_error: 'La contrasena es requerida.' })
    .min(8, 'Minimo 8 caracteres.'),
  nombre_completo: z
    .string({ required_error: 'El nombre es requerido.' })
    .min(3, 'Minimo 3 caracteres.')
    .max(100, 'Maximo 100 caracteres.'),
  rol: z.enum(['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO', 'CROUPIER'], {
    required_error: 'El rol es requerido.',
  }),
  email: z.string().email('Email invalido.').optional().or(z.literal('')),
})

const schemaEditar = z.object({
  nombre_completo: z
    .string({ required_error: 'El nombre es requerido.' })
    .min(3, 'Minimo 3 caracteres.')
    .max(100, 'Maximo 100 caracteres.'),
  rol: z.enum(['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO', 'CROUPIER'], {
    required_error: 'El rol es requerido.',
  }),
  email: z.string().email('Email invalido.').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Minimo 8 caracteres.')
    .optional()
    .or(z.literal('')),
})

const ROLES = ['ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO', 'CROUPIER']

const claseInput = `
  w-full bg-dreams-dark border border-dreams-border rounded px-3 py-2 text-sm
  text-dreams-text placeholder-dreams-text-muted
  focus:outline-none focus:border-dreams-gold transition-colors duration-150
`

const claseLabel = 'block text-xs uppercase tracking-wider text-dreams-text-muted font-medium mb-1'

const claseError = 'text-xs text-red-400 mt-1'

export default function ModalStaff({ staffEditar, onGuardar, onCerrar, cargando }) {
  const esEdicion = !!staffEditar

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esEdicion ? schemaEditar : schemaCrear),
    defaultValues: {
      username: '',
      password: '',
      nombre_completo: '',
      rol: 'SUPERVISOR',
      email: '',
    },
  })

  useEffect(() => {
    if (staffEditar) {
      reset({
        nombre_completo: staffEditar.nombre_completo,
        rol: staffEditar.rol,
        email: staffEditar.email ?? '',
        password: '',
      })
    } else {
      reset({
        username: '',
        password: '',
        nombre_completo: '',
        rol: 'SUPERVISOR',
        email: '',
      })
    }
  }, [staffEditar, reset])

  const onSubmit = (datos) => {
    const payload = { ...datos }
    if (esEdicion && !payload.password) delete payload.password
    if (payload.email === '') payload.email = null
    onGuardar(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-dreams-surface border border-dreams-border rounded-lg w-full max-w-md mx-4 shadow-xl">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dreams-border">
          <h2 className="text-base font-semibold text-dreams-text">
            {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button
            onClick={onCerrar}
            className="text-dreams-text-muted hover:text-dreams-text transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">

          {/* Username — solo en creacion */}
          {!esEdicion && (
            <div>
              <label className={claseLabel}>Username</label>
              <input
                {...register('username')}
                placeholder="ej: supervisor1"
                className={claseInput}
                autoComplete="off"
              />
              {errors.username && <p className={claseError}>{errors.username.message}</p>}
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

          {/* Rol */}
          <div>
            <label className={claseLabel}>Rol</label>
            <select {...register('rol')} className={claseInput}>
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
            {errors.rol && <p className={claseError}>{errors.rol.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className={claseLabel}>
              Email <span className="text-dreams-text-muted normal-case tracking-normal">(opcional)</span>
            </label>
            <input
              {...register('email')}
              placeholder="ej: juan@casino.cl"
              className={claseInput}
              autoComplete="off"
            />
            {errors.email && <p className={claseError}>{errors.email.message}</p>}
          </div>

          {/* Contrasena */}
          <div>
            <label className={claseLabel}>
              Contrasena
              {esEdicion && (
                <span className="text-dreams-text-muted normal-case tracking-normal ml-1">(dejar vacio para no cambiar)</span>
              )}
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder={esEdicion ? 'Nueva contrasena...' : 'Minimo 8 caracteres'}
              className={claseInput}
              autoComplete="new-password"
            />
            {errors.password && <p className={claseError}>{errors.password.message}</p>}
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
              {cargando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}