import { create } from 'zustand'

const useTorneoStore = create((set) => ({
  torneoActivo: null,

  setTorneoActivo: (torneo) => set({ torneoActivo: torneo }),
  limpiarTorneo: () => set({ torneoActivo: null }),
}))

export default useTorneoStore