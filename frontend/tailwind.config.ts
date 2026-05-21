import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        brand: {
          DEFAULT: '#00A896',
          dark: '#007A6E',
          tint: '#E6F7F5',
          tint2: '#F0FBF9',
        },
        amber500: '#F5A623',
        danger: '#E53E3E',
        success: '#38A169',
        ink: {
          900: '#1A1A2E',
          600: '#6B7280',
          400: '#9CA3AF',
          200: '#E5E7EB',
          100: '#EFF1F4',
          50: '#F9FAFB',
        },
      },
      boxShadow: {
        card: '0 4px 16px rgba(0,0,0,0.10)',
        modal: '0 8px 32px rgba(0,0,0,0.18)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
} satisfies Config
