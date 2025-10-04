<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore, authLoadingStore } from '$stores/auth';
  import { goto } from '$app/navigation';
  import AuthGuard from '$components/auth/AuthGuard.svelte';
  import GoogleSignInButton from '$components/auth/GoogleSignInButton.svelte';

  // FIXED: Accept route params to prevent unknown prop warnings
  export let params: Record<string, string> = {};

  let loading = true;
  let heroVisible = false;

  onMount(() => {
    if (browser) {
      // Set timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        loading = false;
        // Trigger hero animation after loading
        setTimeout(() => {
          heroVisible = true;
        }, 200);
      }, 1500);

      // Check auth state and redirect accordingly
      const unsubscribeAuth = authStore.subscribe(async (isAuthenticated) => {
        if (isAuthenticated) {
          // User is authenticated, redirect to dashboard
          await goto('/dashboard');
        }
      });

      const unsubscribeLoading = authLoadingStore.subscribe((authLoading) => {
        if (!authLoading) {
          clearTimeout(timeout);
          loading = false;
          // Trigger hero animation after auth loading
          setTimeout(() => {
            heroVisible = true;
          }, 200);
        }
      });

      return () => {
        clearTimeout(timeout);
        unsubscribeAuth();
        unsubscribeLoading();
      };
    } else {
      loading = false;
      heroVisible = true;
    }
  });

  const handleSignInSuccess = async (event: CustomEvent) => {
    console.log('Sign in successful:', event.detail);
    // Navigation will be handled by Firebase auth state change
  };

  const handleSignInError = (event: CustomEvent) => {
    console.error('Sign in error:', event.detail);
    // Error display is handled by AuthErrorDisplay component in layout
  };

  // Features data
  const features = [
    {
      icon: '💰',
      title: 'Budget Management',
      description: 'Atur budget bulanan per kategori dengan mudah',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      icon: '📊',
      title: 'Expense Tracking',
      description: 'Catat dan kategorikan pengeluaran harian Anda',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      icon: '📈',
      title: 'Smart Analytics',
      description: 'Insights keuangan dan tren spending yang cerdas',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      icon: '🔒',
      title: 'Bank-Grade Security',
      description: 'Keamanan tingkat perbankan untuk data Anda',
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      icon: '🇮🇩',
      title: 'Rupiah Native',
      description: 'Format mata uang Rupiah yang akurat dan lokal',
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      icon: '📱',
      title: 'Mobile First',
      description: 'Didesain khusus untuk penggunaan mobile Indonesia',
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];
</script>

<svelte:head>
  <title>DuitTrack - Personal Finance Tracker Indonesia</title>
  <meta name="description" content="Kelola keuangan pribadi dengan mudah. Budget, track pengeluaran, dan analisis keuangan dalam Rupiah." />
</svelte:head>

{#if loading}
  <!-- Enhanced Loading Screen -->
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="relative">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto mb-6"></div>
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">DuitTrack</h2>
      <p class="text-gray-300 font-medium animate-pulse">Memuat aplikasi keuangan Anda...</p>
    </div>
  </div>
{:else}
  <!-- Modern Fintech Landing Page -->
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div class="text-center">
          <!-- Main Hero Content -->
          <div class="glass-card p-8 lg:p-12 mb-12 mx-auto max-w-4xl transform transition-all duration-1000 {heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
            <!-- Logo and Brand -->
            <div class="mb-8">
              <h1 class="text-5xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
                Duit<span class="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Track</span>
              </h1>
              <div class="flex items-center justify-center gap-2 mb-6">
                <span class="text-2xl">🇮🇩</span>
                <p class="text-xl lg:text-2xl text-gray-200 font-medium">
                  Personal Finance Tracker untuk Indonesia
                </p>
              </div>
            </div>

            <!-- Value Proposition -->
            <div class="mb-8">
              <h2 class="text-2xl lg:text-3xl font-semibold text-white mb-4">
                Kelola Keuangan Pribadi dengan Cerdas
              </h2>
              <p class="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Platform all-in-one untuk budget management, expense tracking, dan financial insights.
                Didesain khusus untuk kebutuhan keuangan masyarakat Indonesia dengan format Rupiah yang akurat.
              </p>
            </div>

            <!-- Key Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="text-center">
                <div class="text-3xl font-bold text-green-400 mb-2">100%</div>
                <div class="text-sm text-gray-300">Secure & Private</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-blue-400 mb-2">24/7</div>
                <div class="text-sm text-gray-300">Access Anywhere</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-purple-400 mb-2">Free</div>
                <div class="text-sm text-gray-300">No Hidden Fees</div>
              </div>
            </div>

            <!-- CTA Button -->
            <div class="mb-6">
              <GoogleSignInButton
                variant="primary"
                size="xl"
                on:success={handleSignInSuccess}
                on:error={handleSignInError}
              />
            </div>


            <!-- Security Notice -->
            <p class="text-xs text-gray-400 max-w-md mx-auto">
              🔒 Data Anda dienkripsi dengan standar keamanan bank. Tidak ada biaya tersembunyi.
              <br>Mulai kelola keuangan Anda hari ini!
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 lg:py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="text-center mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">
            Fitur Lengkap untuk Keuangan Anda
          </h2>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            Semua yang Anda butuhkan untuk mengelola keuangan pribadi dalam satu aplikasi
          </p>
        </div>

        <!-- Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {#each features as feature, index}
            <div
              class="glass-card p-6 text-center card-hover transform transition-all duration-500"
              style="animation-delay: {index * 100}ms"
            >
              <!-- Feature Icon -->
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br {feature.color} flex items-center justify-center text-2xl shadow-lg">
                {feature.icon}
              </div>

              <!-- Feature Content -->
              <h3 class="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p class="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- Trust & Security Section -->
    <section class="py-16 lg:py-24 bg-black/20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <div class="glass-card p-8 lg:p-12 max-w-4xl mx-auto">
            <h2 class="text-3xl lg:text-4xl font-bold text-white mb-6">
              Keamanan Tingkat Bank untuk Data Anda
            </h2>

            <!-- Security Features -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div class="text-center">
                <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                  🔐
                </div>
                <h4 class="font-semibold text-white mb-2">End-to-End Encryption</h4>
                <p class="text-sm text-gray-300">Data terenkripsi penuh</p>
              </div>

              <div class="text-center">
                <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                  🛡️
                </div>
                <h4 class="font-semibold text-white mb-2">Firebase Security</h4>
                <p class="text-sm text-gray-300">Infrastruktur Google Cloud</p>
              </div>

              <div class="text-center">
                <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                  🔒
                </div>
                <h4 class="font-semibold text-white mb-2">HTTPS Only</h4>
                <p class="text-sm text-gray-300">Koneksi selalu aman</p>
              </div>

              <div class="text-center">
                <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                  👤
                </div>
                <h4 class="font-semibold text-white mb-2">Privacy First</h4>
                <p class="text-sm text-gray-300">Data tidak dibagikan</p>
              </div>
            </div>

            <!-- Call to Action -->
            <div class="border-t border-gray-600 pt-8">
              <h3 class="text-xl font-semibold text-white mb-4">
                Siap Mulai Kelola Keuangan Anda?
              </h3>
              <GoogleSignInButton
                variant="secondary"
                size="lg"
                on:success={handleSignInSuccess}
                on:error={handleSignInError}
              />
              <p class="mt-4 text-sm text-gray-400">
                Gratis selamanya • Tidak ada iklan • Tidak ada biaya tersembunyi
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 border-t border-gray-600/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <div class="mb-6">
            <h3 class="text-2xl font-bold text-white mb-2">DuitTrack</h3>
            <p class="text-gray-300">Financial empowerment untuk semua orang Indonesia</p>
          </div>

          <!-- Made with love -->
          <div class="glass-card p-4 max-w-md mx-auto">
            <p class="text-sm text-gray-300 flex items-center justify-center gap-2">
              Made with <span class="text-red-400 animate-pulse">❤️</span> for Indonesian personal finance management
            </p>
            <p class="text-xs text-gray-400 mt-2">
              © 2025 DuitTrack. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
{/if}

<style>
  /* Landing page specific animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes bounceIn {
    0%, 20%, 40%, 60%, 80% {
      transform: scale(1);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Enhanced glass card hover effects */
  .card-hover:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  }

  /* Gradient text animation */
  .gradient-text {
    background: linear-gradient(-45deg, #fbbf24, #f59e0b, #d97706, #92400e);
    background-size: 400% 400%;
    animation: gradientShift 3s ease infinite;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  /* Floating animation for icons */
  .float-animation {
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  /* Pulse animation for CTA buttons */
  .pulse-animation {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
      line-height: 1.1;
    }

    .hero-subtitle {
      font-size: 1.1rem;
    }

    .glass-card {
      margin: 0 1rem;
    }

    /* Touch-friendly spacing */
    .mobile-spacing {
      padding: 1rem;
    }
  }

  /* Loading animation enhancements */
  .loading-dots::after {
    content: '';
    animation: dots 1.5s steps(5, end) infinite;
  }

  @keyframes dots {
    0%, 20% {
      color: rgba(0,0,0,0);
      text-shadow:
        .25em 0 0 rgba(0,0,0,0),
        .5em 0 0 rgba(0,0,0,0);
    }
    40% {
      color: white;
      text-shadow:
        .25em 0 0 rgba(0,0,0,0),
        .5em 0 0 rgba(0,0,0,0);
    }
    60% {
      text-shadow:
        .25em 0 0 white,
        .5em 0 0 rgba(0,0,0,0);
    }
    80%, 100% {
      text-shadow:
        .25em 0 0 white,
        .5em 0 0 white;
    }
  }

  /* Security badges styling */
  .security-badge {
    transition: all 0.3s ease;
  }

  .security-badge:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 0.1);
  }

  /* Indonesian flag colors */
  .indonesia-red {
    background: linear-gradient(135deg, #ff4757, #ff3742);
  }

  .indonesia-white {
    background: linear-gradient(135deg, #ffffff, #f1f2f6);
  }

  /* Fintech trust indicators */
  .trust-indicator {
    position: relative;
    overflow: hidden;
  }

  .trust-indicator::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  .trust-indicator:hover::before {
    left: 100%;
  }
</style>