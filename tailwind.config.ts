import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
          950: 'var(--color-brand-950)',
        },
        neutral: {
          0:   'var(--color-neutral-0)',
          50:  'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
          950: 'var(--color-neutral-950)',
        },
        success: {
          light: 'var(--color-success-light)',
          DEFAULT: 'var(--color-success-base)',
          dark: 'var(--color-success-dark)',
        },
        warning: {
          light: 'var(--color-warning-light)',
          DEFAULT: 'var(--color-warning-base)',
          dark: 'var(--color-warning-dark)',
        },
        danger: {
          light: 'var(--color-danger-light)',
          DEFAULT: 'var(--color-danger-base)',
          dark: 'var(--color-danger-dark)',
        },
        info: {
          light: 'var(--color-info-light)',
          DEFAULT: 'var(--color-info-base)',
          dark: 'var(--color-info-dark)',
        },
        // Semantic surface tokens
        surface: {
          app:     'var(--surface-app)',
          base:    'var(--surface-base)',
          raised:  'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
          sunken:  'var(--surface-sunken)',
          sidebar: 'var(--surface-sidebar)',
        },
        // Semantic text tokens
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary:  'var(--text-tertiary)',
          disabled:  'var(--text-disabled)',
          inverse:   'var(--text-inverse)',
          brand:     'var(--text-brand)',
          'on-brand': 'var(--text-on-brand)',
        },
        // Semantic border tokens
        border: {
          subtle:  'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong:  'var(--border-strong)',
          brand:   'var(--border-brand)',
          danger:  'var(--border-danger)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem',     { lineHeight: '1.5rem' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',  { lineHeight: '2rem' }],
        '3xl': ['1.875rem',{ lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        none: '0px',
        sm:   'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs:    'var(--shadow-xs)',
        sm:    'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md:    'var(--shadow-md)',
        lg:    'var(--shadow-lg)',
        xl:    'var(--shadow-xl)',
        inner: 'var(--shadow-inner)',
        none:  'none',
      },
      transitionDuration: {
        fast: '100ms',
        base: '150ms',
        slow: '300ms',
      },
      spacing: {
        sidebar:   'var(--sidebar-width)',
        topnav:    'var(--topnav-height)',
      },
      width: {
        sidebar:   'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
      },
      height: {
        topnav: 'var(--topnav-height)',
      },
      zIndex: {
        dropdown: '100',
        sticky:   '200',
        overlay:  '300',
        modal:    '400',
        toast:    '500',
      },
    },
  },
  plugins: [],
}

export default config
