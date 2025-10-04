module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
        chromeFlags: '--no-sandbox --disable-dev-shm-usage'
      }
    },
    assert: {
      // Performance thresholds optimized for Indonesian mobile users
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],

        // Critical fintech metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Bundle size constraints for Indonesian networks
        'unused-javascript': ['warn', { maxNumericValue: 50000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],

        // Security and best practices for fintech
        'uses-https': 'error',
        'is-on-https': 'error',
        'csp-xss': 'warn',
        'external-anchors-use-rel-noopener': 'error'
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './dist/lighthouse-reports'
    }
  }
};