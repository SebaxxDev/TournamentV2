import { create } from 'zustand'

const useAuthStore = create((set) => ({
  usuario: null,
  cargando: true,

  setUsuario: (usuario) => set({ usuario, cargando: false }),
  limpiarUsuario: () => set({ usuario: null, cargando: false }),
  setCargando: (cargando) => set({ cargando }),
}))

export default useAuthStore