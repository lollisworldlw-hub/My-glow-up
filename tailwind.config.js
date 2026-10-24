/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', ink: 'var(--ink)', muted: 'var(--muted)',
        rose: 'var(--rose)', deep: 'var(--rose-deep)', petal: 'var(--petal)', blush: 'var(--blush)',
        line: 'var(--line)', sage: 'var(--sage)', sagedeep: 'var(--sage-deep)', gold: 'var(--gold)'
      },
      fontFamily: {
        serif: ['Geist', 'system-ui', 'sans-serif'],
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: { '2xl': '14px', '3xl': '18px' },
      boxShadow: { soft: '0 6px 24px -10px rgba(20, 25, 22, 0.08)' }
    }
  },
  plugins: []
};
