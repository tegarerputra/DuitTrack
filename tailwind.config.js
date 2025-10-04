/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // DuitTrack Brand Colors
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#667eea',
          600: '#5145cd',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Fintech specific colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Indonesian-inspired accent colors
        rupiah: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Liquid Glass System - iOS 26 inspired
        liquid: {
          glass: {
            light: 'rgba(255, 255, 255, 0.25)',
            medium: 'rgba(255, 255, 255, 0.15)',
            dark: 'rgba(255, 255, 255, 0.1)',
            strong: 'rgba(255, 255, 255, 0.35)',
            subtle: 'rgba(255, 255, 255, 0.08)',
          },
          bg: {
            primary: 'rgba(102, 126, 234, 0.1)',
            secondary: 'rgba(20, 184, 166, 0.1)',
            accent: 'rgba(249, 115, 22, 0.1)',
            success: 'rgba(34, 197, 94, 0.1)',
            warning: 'rgba(245, 158, 11, 0.1)',
            danger: 'rgba(239, 68, 68, 0.1)',
          },
          text: {
            vital: 'rgba(255, 255, 255, 1)',      // 100% - Main content
            primary: 'rgba(255, 255, 255, 0.9)',  // 90% - Important text
            supporting: 'rgba(255, 255, 255, 0.7)', // 70% - Secondary text
            decorative: 'rgba(255, 255, 255, 0.4)',   // 40% - Decorative
            atmospheric: 'rgba(255, 255, 255, 0.2)', // 20% - Atmospheric
          },
          border: {
            light: 'rgba(255, 255, 255, 0.18)',
            medium: 'rgba(255, 255, 255, 0.25)',
            strong: 'rgba(255, 255, 255, 0.35)',
            subtle: 'rgba(255, 255, 255, 0.1)',
          }
        },
        // Legacy glass for backward compatibility
        glass: {
          light: 'rgba(255, 255, 255, 0.25)',
          dark: 'rgba(255, 255, 255, 0.1)',
          backdrop: 'rgba(255, 255, 255, 0.8)',
          border: 'rgba(255, 255, 255, 0.18)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
        'glass': '1rem',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'fintech': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'fintech-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(102, 126, 234, 0.4)',
        'glow-lg': '0 0 40px rgba(102, 126, 234, 0.3)',
      },
      animation: {
        // Legacy animations
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        // Liquid Glass animations
        'liquid-float': 'liquidFloat 6s ease-in-out infinite',
        'liquid-pulse': 'liquidPulse 4s ease-in-out infinite',
        'liquid-shimmer': 'liquidShimmer 3s linear infinite',
        'liquid-bounce': 'liquidBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'liquid-glow': 'liquidGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
          '40%, 43%': { transform: 'translateY(-8px)' },
          '70%': { transform: 'translateY(-4px)' },
          '90%': { transform: 'translateY(-2px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(102, 126, 234, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(102, 126, 234, 0.8)' },
        },
        // Liquid Glass keyframes
        liquidFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' },
        },
        liquidPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(102, 126, 234, 0.4)',
            transform: 'scale(1)'
          },
          '50%': {
            boxShadow: '0 0 40px rgba(102, 126, 234, 0.8)',
            transform: 'scale(1.02)'
          },
        },
        liquidShimmer: {
          '0%': { transform: 'translateX(-100%) rotate(45deg)' },
          '100%': { transform: 'translateX(300%) rotate(45deg)' },
        },
        liquidBounce: {
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        liquidGlow: {
          '0%, 100%': {
            filter: 'brightness(1) saturate(1)',
            boxShadow: '0 0 20px rgba(102, 126, 234, 0.3)'
          },
          '50%': {
            filter: 'brightness(1.1) saturate(1.2)',
            boxShadow: '0 0 40px rgba(102, 126, 234, 0.6)'
          },
        },
      },
      screens: {
        'xs': '475px',
        'mobile': '430px', // Indonesian mobile optimization
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  plugins: [
    // Enhanced Liquid Glass Plugin - iOS 26 inspired
    function({ addUtilities, addComponents }) {
      // Core liquid glass utilities
      const liquidUtilities = {
        // Base liquid glass layers
        '.liquid-glass-bg': {
          background: 'rgba(255, 255, 255, 0.25)',
          'backdrop-filter': 'blur(20px) saturate(1.2)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(1.2)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        },
        '.liquid-glass-strong': {
          background: 'rgba(255, 255, 255, 0.35)',
          'backdrop-filter': 'blur(25px) saturate(1.3)',
          '-webkit-backdrop-filter': 'blur(25px) saturate(1.3)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
        },
        '.liquid-glass-subtle': {
          background: 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(15px) saturate(1.1)',
          '-webkit-backdrop-filter': 'blur(15px) saturate(1.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.liquid-glass-medium': {
          background: 'rgba(255, 255, 255, 0.15)',
          'backdrop-filter': 'blur(18px) saturate(1.15)',
          '-webkit-backdrop-filter': 'blur(18px) saturate(1.15)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        },

        // Dynamic adaptation classes
        '.liquid-adaptive': {
          transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          '&:hover': {
            'backdrop-filter': 'blur(30px) saturate(1.4)',
            '-webkit-backdrop-filter': 'blur(30px) saturate(1.4)',
            transform: 'translateY(-2px)',
          }
        },

        // Playful interaction states
        '.liquid-interactive': {
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            'box-shadow': '0 20px 60px rgba(0, 0, 0, 0.15)',
          },
          '&:active': {
            transform: 'translateY(-1px) scale(0.99)',
            transition: 'all 0.1s ease',
          }
        },

        // Enhanced text system for better contrast
        '.text-vital': { color: 'rgba(17, 24, 39, 1)' }, // Dark text for light backgrounds
        '.text-primary-glass': { color: 'rgba(17, 24, 39, 0.9)' },
        '.text-supporting-glass': { color: 'rgba(17, 24, 39, 0.7)' },
        '.text-decorative-glass': { color: 'rgba(17, 24, 39, 0.5)' },
        '.text-atmospheric': { color: 'rgba(17, 24, 39, 0.4)' },

        // Legacy glass classes (backward compatibility)
        '.glass': {
          background: 'rgba(255, 255, 255, 0.25)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
        '.glass-dark': {
          background: 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          'box-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        },
        '.mobile-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.mobile-safe-top': {
          'padding-top': 'env(safe-area-inset-top)',
        }
      }

      addUtilities(liquidUtilities)

      // Liquid Glass Components
      const liquidComponents = {
        '.liquid-card': {
          position: 'relative',
          'border-radius': '1.25rem',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.8)', // More opaque for better readability
          'backdrop-filter': 'blur(20px) saturate(1.2)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(1.2)',
          border: '1px solid rgba(255, 255, 255, 0.4)', // Stronger border
          transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',

          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '50%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
            'pointer-events': 'none',
            'border-radius': '1.25rem 1.25rem 0 0',
          },

          '&:hover': {
            transform: 'translateY(-4px) scale(1.01)',
            background: 'rgba(255, 255, 255, 0.9)', // Even more opaque on hover
            'backdrop-filter': 'blur(25px) saturate(1.3)',
            '-webkit-backdrop-filter': 'blur(25px) saturate(1.3)',
            'box-shadow': '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 40px rgba(102, 126, 234, 0.3)',
          }
        },

        '.liquid-nav': {
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.7)', // More opaque navbar
          'backdrop-filter': 'blur(20px) saturate(1.2)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(1.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)', // Stronger border
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
            'pointer-events': 'none',
          }
        }
      }

      addComponents(liquidComponents)
    }
  ],
}