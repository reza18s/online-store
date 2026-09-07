/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files: ['./apps/web/index.html', './apps/web/src/**/*.{ts,tsx}', './packages/ui/src/**/*.{ts,tsx}'],
  },
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        surface: 'var(--surface)',
        'surface-soft': 'var(--surface-soft)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'accent-soft': 'var(--accent-soft)',
        accent: 'var(--accent)',
        border: 'var(--border)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        destructive: 'var(--destructive)',
        'destructive-hover': 'var(--destructive-hover)',
        info: 'var(--info)',
      },
      borderRadius: {
        control: '8px',
        panel: '12px',
        dialog: '16px',
        editorial: '4px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 8px rgb(39 34 32 / 6%)',
        float: '0 8px 24px rgb(39 34 32 / 8%)',
      },
      fontFamily: {
        display: ['Estedad', 'Vazirmatn', 'Tahoma', 'sans-serif'],
        sans: ['Vazirmatn', 'Inter', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
