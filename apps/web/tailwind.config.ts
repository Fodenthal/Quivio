import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Light mode colors
        'light-background': '#ffffff',
        'light-background-secondary': '#f8fafc',
        'light-background-tertiary': '#f1f5f9',
        'light-background-elevated': '#ffffff',
        'light-background-hover': '#f1f5f9',
        'light-background-active': '#e2e8f0',
        
        'light-text-primary': '#0f172a',
        'light-text-secondary': '#475569',
        'light-text-tertiary': '#64748b',
        'light-text-muted': '#94a3b8',
        
        'light-accent-primary': '#3b82f6',
        'light-accent-secondary': '#1d4ed8',
        'light-accent-hover': '#2563eb',
        'light-accent-active': '#1e40af',
        
        'light-border-primary': '#e2e8f0',
        'light-border-secondary': '#cbd5e1',
        'light-border-hover': '#94a3b8',
        
        // Dark mode colors (Cursor.com inspired)
        'dark-background': '#0a0a0a',
        'dark-background-secondary': '#1a1a1a',
        'dark-background-tertiary': '#2a2a2a',
        'dark-background-elevated': '#1f1f1f',
        'dark-background-hover': '#2f2f2f',
        'dark-background-active': '#3a3a3a',
        
        'dark-text-primary': '#ffffff',
        'dark-text-secondary': '#a1a1aa',
        'dark-text-tertiary': '#71717a',
        'dark-text-muted': '#52525b',
        
        'dark-accent-primary': '#3b82f6',
        'dark-accent-secondary': '#1d4ed8',
        'dark-accent-hover': '#2563eb',
        'dark-accent-active': '#1e40af',
        
        'dark-border-primary': '#27272a',
        'dark-border-secondary': '#3f3f46',
        'dark-border-hover': '#52525b',
        
        // Status colors (work in both themes)
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',
      },
      spacing: {
        // Cursor uses generous spacing
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'cursor': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'cursor-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'cursor-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'cursor-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'cursor-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'light': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'light-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'theme-switch': 'themeSwitch 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        themeSwitch: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(180deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config; 