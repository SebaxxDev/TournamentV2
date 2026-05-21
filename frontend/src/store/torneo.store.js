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
    segundosTorneo: 0,
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

  // Tick recibido del backend cada 1s — aqui se incrementa el tiempo del torneo
  aplicarTick: ({ segundosRestantes, nivelIndex, total }) => {
    set((s) => ({
      reloj: { ...s.reloj, activo: true, segundosRestantes, nivelIndex, total },
      segundosTorneo: s.segundosTorneo + 1,
    }))
  },

  // Reloj iniciado (estado inicial al arrancar)
  aplicarRelojIniciado: ({ nivelIndex, segundosRestantes, nivel, total, segundosTorneo }, niveles) => {
    set((s) => ({
      reloj: { activo: true, nivelIndex, segundosRestantes, total },
      nivelActual: nivel,
      siguienteNivel: niveles?.[nivelIndex + 1] ?? null,
      // Solo sobreescribir si viene un valor explicito del backend
      segundosTorneo: segundosTorneo ?? s.segundosTorneo,
    }))
  },

  // Cambio de nivel (automatico o manual) — no toca segundosTorneo
  aplicarCambioNivel: ({ nivelIndex, nivel, segundosRestantes }, niveles) => {
    set((s) => ({
      reloj: { ...s.reloj, nivelIndex, segundosRestantes, total: nivel?.tiempo_segundos ?? 0 },
      nivelActual: nivel,
      siguienteNivel: niveles?.[nivelIndex + 1] ?? null,
    }))
  },

  // Reloj pausado — no toca segundosTorneo
  aplicarRelojPausado: ({ segundosRestantes, nivelIndex }) => {
    set((s) => ({
      reloj: { ...s.reloj, activo: false, segundosRestantes, nivelIndex },
    }))
  },

  // ─── Tiempo total del torneo (contador independiente, solo sube con tick) ──
  segundosTorneo: 0,
  setSegundosTorneo: (s) => set({ segundosTorneo: s }),

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
  quitarJugador: (id_inscripcion) => set((s) => ({
    jugadores: s.jugadores.filter((j) => j.id_inscripcion !== id_inscripcion),
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

  // ─── Seccion activa del sidebar ───────────────────────────────────────────
  seccionActiva: 'jugadores',
  setSeccionActiva: (seccion) => set({ seccionActiva: seccion }),
}))

export default useTorneoStore
