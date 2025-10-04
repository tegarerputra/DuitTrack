// Production-ready Vite config without PWA plugin issues
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  // Optimize for fintech performance
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Let Vite handle chunking automatically
      }
    },
    // Optimize for mobile devices (key for Indonesian market)
    chunkSizeWarningLimit: 1000
  },

  // Development server optimization
  server: {
    port: 5173,
    host: true,
    cors: true,
    hmr: {
      overlay: true
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
      'date-fns'
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