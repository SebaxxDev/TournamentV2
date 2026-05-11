import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esRutaSesion = error.config?.url?.includes('/auth/sesion')
    const es401 = error.response?.status === 401

    if (es401 && !esRutaSesion) {
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api