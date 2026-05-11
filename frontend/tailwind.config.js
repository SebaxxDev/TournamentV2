/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dreams-gold':        '#D4AF37',
        'dreams-gold-light':  '#E8C84A',
        'dreams-dark':        '#0f0f0f',
        'dreams-surface':     '#1a1a1a',
        'dreams-surface-2':   '#2a2a2a',
        'dreams-border':      '#333333',
        'dreams-text':        '#cccccc',
        'dreams-text-muted':  '#888888',
      }
    }
  },
  plugins: [],
}