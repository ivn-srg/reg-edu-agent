/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#3B82F6',
        },
        background: '#F9FAFB',
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
        },
        bubble: {
          agent: '#E5E7EB',
          user: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

