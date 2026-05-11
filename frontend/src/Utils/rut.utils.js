// Limpia el RUT dejando solo caracteres validos (numeros y k/K)
export const limpiarRut = (valor) => {
  return valor.replace(/[^0-9kK]/g, '')
}

// Calcula el digito verificador esperado para un cuerpo de RUT
export const calcularDv = (cuerpo) => {
  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'k'
  return String(resto)
}

// Formatea un RUT limpio al formato 18.721.585-4
export const formatearRut = (rutLimpio) => {
  if (!rutLimpio) return ''

  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)

  if (!cuerpo) return dv

  const cuerpoFormateado = cuerpo
    .split('')
    .reverse()
    .join('')
    .replace(/(\d{3})(?=\d)/g, '$1.')
    .split('')
    .reverse()
    .join('')

  return `${cuerpoFormateado}-${dv}`
}

// Valida que el RUT tenga DV correcto — recibe el RUT limpio (sin puntos ni guion)
export const validarDvRut = (rutLimpio) => {
  if (rutLimpio.length < 2) return false

  const cuerpo = rutLimpio.slice(0, -1)
  const dvIngresado = rutLimpio.slice(-1).toLowerCase()
  const dvEsperado = calcularDv(cuerpo)

  return dvIngresado === dvEsperado
}

// Convierte el RUT formateado al formato que espera la BD: 12345678-9
export const rutParaBd = (rutFormateado) => {
  const limpio = limpiarRut(rutFormateado)
  if (limpio.length < 2) return ''
  return `${limpio.slice(0, -1)}-${limpio.slice(-1).toLowerCase()}`
}