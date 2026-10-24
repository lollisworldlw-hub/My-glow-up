/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', ink: 'var(--ink)', muted: 'var(--muted)',
        rose: 'var(--rose)', deep: 'var(--rose-deep)', petal: 'var(--petal)', blush: 'var(--blush)',
        line: 'var(--line)', sage: 'var(--sage)', sagedeep: 'var(--sage-deep)'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: { soft: '0 6px 24px -10px rgba(30, 40, 35, 0.16)' }
    }
  },
  plugins: []
};
