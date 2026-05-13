import { create } from 'zustand'

// Estado en memoria del torneo activo y su reloj en tiempo real.
// La UI de ControlTorneo lee desde aqui — TanStack Query maneja el fetch REST inicial,
// pero las actualizaciones en vivo vienen por Socket.io y se persisten aqui.

const useTorneoStore = create((set, get) => ({
  // ─── Torneo activo (datos base cargados al entrar a /torneos/:id) ─────────
  torneoActivo: null,
  setTorneoActivo: (torneo) => set({ torneoActivo: torneo }),
  limpiarTorneo: () => set({
    torneoActivo: null,
    estadoTorneo: null,
    reloj: { activo: false, nivelIndex: 0, segundosRestantes: 0, total: 0 },
    nivelActual: null,
    siguienteNivel: null,
    jugadores: [],
    pozoTotal: 0,
    contadorRebuy: 0,
    contadorAddon: 0,
  }),

  // ─── Estado general del torneo ────────────────────────────────────────────
  estadoTorneo: null,  // 'BORRADOR' | 'REGISTRO' | 'EN_JUEGO' | 'PAUSADO' | 'FINALIZADO'
  setEstadoTorneo: (estado) => set({ estadoTorneo: estado }),

  // ─── Reloj (sincronizado con Socket.io) ───────────────────────────────────
  reloj: {
    activo: false,
    nivelIndex: 0,
    segundosRestantes: 0,
    total: 0,           // duracion total del nivel actual en segundos
  },

  // Tick recibido del backend cada 1s
  aplicarTick: ({ segundosRestantes, nivelIndex, total }) => {
    set((s) => ({
      reloj: { ...s.reloj, activo: true, segundosRestantes, nivelIndex, total },
    }))
  },

  // Reloj iniciado (estado inicial al arrancar)
  aplicarRelojIniciado: ({ nivelIndex, segundosRestantes, nivel, total }, niveles) => {
    set((s) => ({
      reloj: { activo: true, nivelIndex, segundosRestantes, total },
      nivelActual: nivel,
      siguienteNivel: niveles?.[nivelIndex + 1] ?? null,
    }))
  },

  // Cambio de nivel (automático o manual)
  aplicarCambioNivel: ({ nivelIndex, nivel, segundosRestantes }, niveles) => {
    set((s) => ({
      reloj: { ...s.reloj, nivelIndex, segundosRestantes, total: nivel?.tiempo_segundos ?? 0 },
      nivelActual: nivel,
      siguienteNivel: niveles?.[nivelIndex + 1] ?? null,
    }))
  },

  // Reloj pausado
  aplicarRelojPausado: ({ segundosRestantes, nivelIndex }) => {
    set((s) => ({
      reloj: { ...s.reloj, activo: false, segundosRestantes, nivelIndex },
    }))
  },

  // ─── Nivel actual y siguiente ─────────────────────────────────────────────
  nivelActual: null,
  siguienteNivel: null,
  setNiveles: (nivelActual, siguienteNivel) => set({ nivelActual, siguienteNivel }),

  // ─── Jugadores inscritos ──────────────────────────────────────────────────
  jugadores: [],
  setJugadores: (jugadores) => set({ jugadores }),
  agregarJugador: (jugador) => set((s) => ({ jugadores: [...s.jugadores, jugador] })),
  actualizarJugador: (rut, cambios) => set((s) => ({
    jugadores: s.jugadores.map((j) => j.jugador?.rut === rut ? { ...j, ...cambios } : j),
  })),

  // ─── Pozo y contadores ────────────────────────────────────────────────────
  pozoTotal: 0,
  contadorRebuy: 0,
  contadorAddon: 0,
  setPozoTotal: (monto) => set({ pozoTotal: monto }),
  incrementarPozo: (monto) => set((s) => ({ pozoTotal: s.pozoTotal + monto })),
  incrementarRebuy: () => set((s) => ({ contadorRebuy: s.contadorRebuy + 1 })),
  incrementarAddon: () => set((s) => ({ contadorAddon: s.contadorAddon + 1 })),
  setContadores: ({ pozoTotal, contadorRebuy, contadorAddon }) =>
    set({ pozoTotal, contadorRebuy, contadorAddon }),

  // ─── Sección activa del sidebar ───────────────────────────────────────────
  seccionActiva: 'jugadores',
  setSeccionActiva: (seccion) => set({ seccionActiva: seccion }),
}))

export default useTorneoStore
