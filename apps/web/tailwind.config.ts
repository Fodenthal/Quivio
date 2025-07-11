import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        background: '#1a1a2e',
        'background-light': '#2a2a4e',
        primary: '#e94560',
        secondary: '#0f3460',
        accent: '#53a8b6',
        'text-main': '#ffffff',
        'text-secondary': '#a0a0c0',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'xl': '20px',
      }
    },
  },
  plugins: [],
};

export default config; 