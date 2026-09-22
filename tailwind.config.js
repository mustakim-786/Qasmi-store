/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00513A',
          50: '#F0F7F4',
          100: '#DCEEE7',
          200: '#CFE9DA',
          300: '#82D7B2',
          400: '#4FAE85',
          500: '#00513A',
          600: '#004732',
          700: '#2A4036',
          800: '#142A21',
          900: '#0E1F18',
        },
        ink: '#1F1F1F',
        cream: '#FFFFFF',
        soft: '#CFE9DA',
        accent: '#82D7B2',
        muted: '#2A4036',
        deep: '#142A21',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'serif'],
        urduBody: ['"Noto Naskh Arabic"', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(20, 42, 33, 0.06)',
        card: '0 4px 24px rgba(20, 42, 33, 0.08)',
        lift: '0 8px 32px rgba(20, 42, 33, 0.12)',
      },
    },
  },
  plugins: [],
};
