import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Direct design token values — single source of truth in tokens.css
        // Tailwind classes map to the same semantic values
        bg: {
          base: '#0f172a',
          raised: '#1e293b',
          elevated: '#334155',
        },
        accent: {
          DEFAULT: '#f59e0b',
          hover: '#fbbf24',
          text: '#0f172a',
        },
        'rs-success': '#22c55e',
        'rs-error': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      spacing: {
        sidebar: '240px',
        topnav: '56px',
      },
    },
  },
  plugins: [],
}

export default config
