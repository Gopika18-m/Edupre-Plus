/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3ccff',
          300: '#82a9ff',
          400: '#5480ff',
          500: '#3159f5',
          600: '#2440d1',
          700: '#1d33a8',
          800: '#1c2d84',
          900: '#1b296a',
        },
        risk: {
          low: '#16a34a',
          moderate: '#d97706',
          high: '#dc2626',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
