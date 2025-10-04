<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import { authErrorStore } from '$stores/auth';

  const dispatch = createEventDispatcher();

  export let loading = false;
  export let disabled = false;
  export let variant: 'primary' | 'secondary' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';

  let isLoading = false;

  const handleGoogleSignIn = async () => {
    if (!browser || isLoading || disabled) return;

    isLoading = true;
    authErrorStore.set(null);

    try {
      const { signInWithPopup, signInWithRedirect, GoogleAuthProvider } = await import('firebase/auth');
      const { auth, googleProvider } = await import('$lib/config/firebase');

      // Try popup first, fallback to redirect if unauthorized domain
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupError: any) {
        if (popupError.code === 'auth/unauthorized-domain') {
          console.log('Popup failed due to unauthorized domain, trying redirect...');
          // Use redirect method as fallback
          await signInWithRedirect(auth, googleProvider);
          return; // Redirect will handle the rest
        }
        throw popupError; // Re-throw other popup errors
      }

      // Dispatch success event
      dispatch('success', {
        user: result.user,
        credential: GoogleAuthProvider.credentialFromResult(result)
      });

    } catch (error: any) {
      console.error('Google Sign In failed:', error);

      let errorMessage = 'Failed to sign in with Google';

      // Handle specific Firebase Auth errors
      switch (error.code) {
        case 'auth/unauthorized-domain':
          errorMessage = 'Domain tidak diautoritas untuk Google Auth. Menggunakan alternative sign-in...';
          // Try alternative auth method if needed
          setTimeout(() => {
            window.location.href = `https://duittrack.firebaseapp.com/?redirect=${encodeURIComponent(window.location.href)}`;
          }, 2000);
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup diblokir. Silakan izinkan popup untuk login.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Login dibatalkan. Silakan coba lagi.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Koneksi internet bermasalah. Silakan coba lagi.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Akun telah dinonaktifkan. Hubungi support.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google Sign-In tidak diaktifkan. Hubungi administrator.';
          break;
        default:
          if (error.message) {
            errorMessage = error.message;
          }
      }

      authErrorStore.set(errorMessage);

      // Dispatch error event
      dispatch('error', {
        error,
        message: errorMessage
      });
    } finally {
      isLoading = false;
    }
  };

  // Reactive loading state
  $: buttonLoading = loading || isLoading;

  // Button sizing classes
  $: sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }[size];

  // Button variant classes
  $: variantClasses = variant === 'primary'
    ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
    : 'bg-white/10 text-white hover:bg-white/20 border-white/20';
</script>

<button
  type="button"
  on:click={handleGoogleSignIn}
  disabled={buttonLoading || disabled}
  class="w-full flex items-center justify-center {sizeClasses} {variantClasses} border rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {#if buttonLoading}
    <div class="animate-spin rounded-full h-5 w-5 border-b-2 {variant === 'primary' ? 'border-gray-700' : 'border-white'} mr-3"></div>
    <span>Memproses...</span>
  {:else}
    <!-- Google Logo SVG -->
    <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    <span>Masuk dengan Google</span>
  {/if}
</button>