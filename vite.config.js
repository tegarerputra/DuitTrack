import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
// import { compression } from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    sveltekit(),

    // Bundle analysis for performance monitoring
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),

    // Compression temporarily disabled due to dependency issues
    // Will be re-enabled after fixing package conflicts

    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        runtimeCaching: [
          // Google Fonts optimization for Indonesian users
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          // Firebase caching with network-first for real-time data
          {
            urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-data',
              networkTimeoutSeconds: 5, // Increased for slower Indonesian connections
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 2 // 2 hours for financial data
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-apis',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          // Chart.js and financial data assets
          {
            urlPattern: /\.(png|jpg|jpeg|svg|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'DuitTrack - Personal Finance Tracker',
        short_name: 'DuitTrack',
        description: 'Track your expenses and budget in Rupiah - Indonesian Personal Finance App',
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
        ]
      }
    })
  ],

  // Optimize for fintech performance
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Optimized chunk splitting for Indonesian mobile users
        manualChunks: (id) => {
          // Critical fintech libraries in separate chunks
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('chart.js')) return 'charts';
          if (id.includes('date-fns')) return 'date-utils';

          // Core UI libraries
          if (id.includes('svelte') || id.includes('@sveltejs')) return 'svelte-core';
          if (id.includes('lucide-svelte') || id.includes('svelte-french-toast')) return 'ui-components';

          // Large third-party libraries
          if (id.includes('node_modules')) return 'vendor';

          return undefined;
        }
      }
    },
    // Optimize for Indonesian mobile devices with slower connections
    chunkSizeWarningLimit: 800, // Reduced for mobile networks
    // Optimize asset handling for fintech security
    assetsInlineLimit: 2048, // Smaller inline limit for better caching
    cssCodeSplit: true,

    // Additional optimizations for production
    cssMinify: true,
    reportCompressedSize: true,

    // Optimize for fintech app requirements
    commonjsOptions: {
      include: [/firebase/, /chart\.js/],
    }
  },

  // Development server optimization - Fixed for port 3000 and Firebase Auth
  server: {
    port: 3000,
    host: true,
    cors: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    },
    hmr: {
      overlay: true,
      port: 24678
    }
  },

  // CSS preprocessing
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true
  },

  // Define global constants for fintech app
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __CURRENCY__: JSON.stringify('IDR'),
    __LOCALE__: JSON.stringify('id-ID')
  },

  // Resolve configuration
  resolve: {
    alias: {
      $components: './src/lib/components',
      $stores: './src/lib/stores',
      $utils: './src/lib/utils',
      $types: './src/lib/types',
      $config: './src/lib/config'
    }
  },

  // Optimizations for fintech security and performance
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
    exclude: ['@floating-ui/dom'],
    // Force optimize these for better performance
    force: true
  },

  // Performance optimizations for Indonesian users
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { runtime: `window.__toCdnUrl(${JSON.stringify(filename)})` };
      } else {
        return { relative: true };
      }
    }
  },

  // Worker optimizations for PWA
  worker: {
    format: 'es',
    plugins: () => [
      // Worker-specific optimizations
    ]
  },

  // Test configuration
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/lib/test-setup.ts']
  }
});