// Enhanced production configuration for DuitTrack
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    sveltekit(),

    // Bundle analysis for performance monitoring
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    }),

    // Multi-format compression for optimal delivery
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),

    // Enhanced PWA configuration for fintech security
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          // Critical financial data - always fresh
          {
            urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*\/(transactions|budgets|accounts).*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'critical-financial-data'
            }
          },
          // User authentication - network first with short cache
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*auth.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'auth-data',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5 // 5 minutes only
              }
            }
          },
          // General Firebase data - stale while revalidate
          {
            urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-data',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 30 // 30 minutes
              }
            }
          },
          // Static assets - cache first
          {
            urlPattern: /\.(png|jpg|jpeg|svg|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // Fonts - cache first with long expiration
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'DuitTrack - Personal Finance Tracker',
        short_name: 'DuitTrack',
        description: 'Secure Indonesian Personal Finance App - Track Rupiah expenses and budget',
        theme_color: '#667eea',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['finance', 'productivity', 'business'],
        lang: 'id-ID',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        // Fintech-specific manifest properties
        prefer_related_applications: false,
        shortcuts: [
          {
            name: "Add Expense",
            short_name: "Add Expense",
            description: "Quickly add a new expense",
            url: "/expenses?action=add",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "View Budget",
            short_name: "Budget",
            description: "Check your budget status",
            url: "/budget",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      }
    })
  ],

  // Production build optimizations
  build: {
    target: ['es2020', 'chrome80', 'safari14'],
    minify: 'terser',
    sourcemap: false,

    // Terser options for better security
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },

    rollupOptions: {
      output: {
        // Advanced chunk splitting for optimal loading
        manualChunks: (id) => {
          // Critical authentication chunk - loaded first
          if (id.includes('firebase/auth') || id.includes('authService')) {
            return 'auth';
          }

          // Firebase core - separate from auth
          if (id.includes('firebase')) {
            return 'firebase-core';
          }

          // Charts and visualization
          if (id.includes('chart.js') || id.includes('chartjs-adapter')) {
            return 'charts';
          }

          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-utils';
          }

          // Svelte core
          if (id.includes('svelte') || id.includes('@sveltejs')) {
            return 'svelte-runtime';
          }

          // UI components
          if (id.includes('lucide-svelte') || id.includes('svelte-french-toast')) {
            return 'ui-components';
          }

          // Vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          return undefined;
        },

        // File naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.svelte', '')
            : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Optimizations for Indonesian mobile networks
    chunkSizeWarningLimit: 600, // Very conservative for mobile
    assetsInlineLimit: 1024, // 1KB limit for inline assets
    cssCodeSplit: true,
    cssMinify: 'esbuild',
    reportCompressedSize: true,

    // Security enhancements
    commonjsOptions: {
      include: [/firebase/, /chart\.js/],
      transformMixedEsModules: true
    }
  },

  // Security headers for development preview
  preview: {
    port: 4173,
    host: true,
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },

  // Global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __CURRENCY__: JSON.stringify('IDR'),
    __LOCALE__: JSON.stringify('id-ID'),
    __ENVIRONMENT__: JSON.stringify('production')
  },

  // Alias configuration
  resolve: {
    alias: {
      $components: './src/lib/components',
      $stores: './src/lib/stores',
      $utils: './src/lib/utils',
      $types: './src/lib/types',
      $config: './src/lib/config'
    }
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'chart.js',
      'chartjs-adapter-date-fns',
      'date-fns',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'lucide-svelte',
      'svelte-french-toast'
    ],
    exclude: ['@floating-ui/dom']
  },

  // Test configuration
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/lib/test-setup.ts']
  }
});