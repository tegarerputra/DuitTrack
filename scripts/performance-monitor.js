#!/usr/bin/env node

/**
 * Performance monitoring script for DuitTrack
 * Optimized for Indonesian fintech applications
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PERFORMANCE_THRESHOLDS = {
  // Bundle size limits for Indonesian mobile networks
  maxJsSize: 500 * 1024, // 500KB
  maxCssSize: 100 * 1024, // 100KB
  maxTotalSize: 2 * 1024 * 1024, // 2MB total

  // Performance timing limits
  maxFCP: 2000, // First Contentful Paint
  maxLCP: 3000, // Largest Contentful Paint
  maxCLS: 0.1,  // Cumulative Layout Shift
  maxTTI: 5000, // Time to Interactive

  // Fintech-specific limits
  maxAuthTime: 1000, // Authentication should be fast
  maxTransactionLoadTime: 2000, // Transaction history load time
};

function analyzeBundleSize() {
  console.log('🔍 Analyzing bundle sizes...');

  const distPath = join(projectRoot, 'dist');
  if (!existsSync(distPath)) {
    console.error('❌ Build directory not found. Run npm run build first.');
    process.exit(1);
  }

  try {
    // Get file sizes
    const result = execSync(`find ${distPath} -name "*.js" -o -name "*.css" | head -20`, {
      encoding: 'utf8'
    });

    const files = result.trim().split('\n').filter(Boolean);
    let totalJsSize = 0;
    let totalCssSize = 0;

    const fileAnalysis = files.map(file => {
      const stats = execSync(`stat -f%z "${file}" 2>/dev/null || stat -c%s "${file}"`, {
        encoding: 'utf8'
      }).trim();
      const size = parseInt(stats);

      if (file.endsWith('.js')) totalJsSize += size;
      if (file.endsWith('.css')) totalCssSize += size;

      return {
        file: file.replace(distPath, ''),
        size,
        sizeKB: Math.round(size / 1024)
      };
    });

    // Check thresholds
    const warnings = [];
    if (totalJsSize > PERFORMANCE_THRESHOLDS.maxJsSize) {
      warnings.push(`⚠️  JS bundle size (${Math.round(totalJsSize/1024)}KB) exceeds recommended limit (${PERFORMANCE_THRESHOLDS.maxJsSize/1024}KB)`);
    }

    if (totalCssSize > PERFORMANCE_THRESHOLDS.maxCssSize) {
      warnings.push(`⚠️  CSS bundle size (${Math.round(totalCssSize/1024)}KB) exceeds recommended limit (${PERFORMANCE_THRESHOLDS.maxCssSize/1024}KB)`);
    }

    console.log('📊 Bundle Analysis Results:');
    console.log(`   Total JS: ${Math.round(totalJsSize/1024)}KB`);
    console.log(`   Total CSS: ${Math.round(totalCssSize/1024)}KB`);
    console.log(`   Total Size: ${Math.round((totalJsSize + totalCssSize)/1024)}KB`);

    if (warnings.length > 0) {
      console.log('\n🚨 Performance Warnings:');
      warnings.forEach(warning => console.log(`   ${warning}`));
    } else {
      console.log('✅ All bundle sizes within recommended limits');
    }

    return {
      totalJsSize,
      totalCssSize,
      files: fileAnalysis,
      warnings
    };
  } catch (error) {
    console.error('❌ Error analyzing bundle sizes:', error.message);
    return null;
  }
}

function checkDependencySize() {
  console.log('\n📦 Analyzing dependency sizes...');

  try {
    const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});

    const largeDependencies = [
      'firebase',
      'chart.js',
      '@sveltejs/kit'
    ];

    console.log('🎯 Key fintech dependencies:');
    largeDependencies.forEach(dep => {
      if (dependencies.includes(dep)) {
        console.log(`   ✓ ${dep}`);
      }
    });

    return dependencies;
  } catch (error) {
    console.error('❌ Error analyzing dependencies:', error.message);
    return [];
  }
}

function generatePerformanceReport() {
  console.log('\n📄 Generating performance report...');

  const bundleAnalysis = analyzeBundleSize();
  const dependencies = checkDependencySize();

  const report = {
    timestamp: new Date().toISOString(),
    bundleAnalysis,
    dependencies,
    recommendations: [
      'Enable Brotli compression for better Indonesian mobile performance',
      'Implement service worker caching for offline fintech functionality',
      'Use lazy loading for non-critical chart components',
      'Optimize images with WebP format for faster loading',
      'Consider code splitting for authentication flows'
    ],
    marketSpecific: {
      indonesianOptimizations: [
        'Reduced chunk sizes for slower 3G/4G networks',
        'Extended cache times for expensive Firebase calls',
        'Optimized font loading for Indonesian language support',
        'Mobile-first responsive design for common Indonesian device sizes'
      ]
    }
  };

  const reportPath = join(projectRoot, 'dist', 'performance-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Report saved to: ${reportPath}`);

  return report;
}

function main() {
  console.log('🚀 DuitTrack Performance Monitor');
  console.log('🇮🇩 Optimized for Indonesian Fintech Applications\n');

  const report = generatePerformanceReport();

  // Exit with error code if there are critical issues
  if (report.bundleAnalysis && report.bundleAnalysis.warnings.length > 0) {
    console.log('\n⚠️  Performance issues detected. Review the warnings above.');
    process.exit(1);
  }

  console.log('\n✅ Performance analysis complete!');
  console.log('💡 Run `npm run build:analyze` to view detailed bundle visualization');
  console.log('🔍 Run `npm run performance:audit` for Lighthouse analysis');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}