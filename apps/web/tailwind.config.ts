/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: 'var(--panel)',
        'surface-soft': 'var(--panel-soft)',
        'surface-hover': 'var(--panel-hover)',

        border: {
          soft: 'var(--border-soft)',
          muted: 'var(--border-muted)',
        },

        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },

        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
        },

        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)',
          foreground: 'var(--danger-foreground)',
        },

        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
          foreground: 'var(--success-foreground)',
        },

        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
          foreground: 'var(--warning-foreground)',
        },

        overlay: 'var(--overlay)',
      },
    },
  },
  plugins: [],
}
