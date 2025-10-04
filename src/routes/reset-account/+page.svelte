<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { authStore, userStore, userProfileStore, authActions } from '$stores/auth';
  import { FirebaseUtils } from '$lib/config/firebase';
  import AuthGuard from '$components/auth/AuthGuard.svelte';
  import UserProfileComponent from '$components/auth/UserProfile.svelte';
  import type { User as FirebaseUser } from 'firebase/auth';

  let isLoading = false;
  let showConfirmation = false;
  let confirmationText = '';
  let message = '';
  let isSuccess = false;
  let step = 1; // 1: Info, 2: Confirmation, 3: Final Warning

  const CONFIRMATION_TEXT = 'RESET AKUN SAYA';

  async function resetAllUserData(user: FirebaseUser) {
    try {
      if (!user || !browser) {
        throw new Error('User tidak tersedia');
      }

      // Get Firebase collections
      const expensesRef = FirebaseUtils.getUserExpensesRef(user.uid);
      const budgetsRef = FirebaseUtils.getUserBudgetsRef(user.uid);
      const userProfileRef = FirebaseUtils.getUserProfileRef(user.uid);

      // Import Firebase functions
      const { getDocs, deleteDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');

      // Delete all expenses
      const expensesSnapshot = await getDocs(expensesRef);
      const expenseDeletePromises = expensesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(expenseDeletePromises);

      // Delete all budgets
      const budgetsSnapshot = await getDocs(budgetsRef);
      const budgetDeletePromises = budgetsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(budgetDeletePromises);

      // Reset user profile to initial state
      await updateDoc(userProfileRef, {
        onboardingComplete: false,
        currency: 'IDR',
        locale: 'id-ID',
        budgetResetDate: 1,
        updatedAt: serverTimestamp()
      });

      console.log('All user data has been reset successfully');
      return { success: true };

    } catch (error) {
      console.error('Error resetting user data:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleResetAccount(user: FirebaseUser) {
    if (isLoading) return;

    isLoading = true;
    message = '';

    try {
      const result = await resetAllUserData(user);

      if (result.success) {
        message = 'Akun berhasil direset! Data keuangan Anda telah dihapus.';
        isSuccess = true;

        // Clear local stores
        authActions.clearAuth();

        // Sign out and redirect
        setTimeout(async () => {
          try {
            const { signOut } = await import('firebase/auth');
            const { auth } = await import('$lib/config/firebase');
            if (auth) {
              await signOut(auth);
            }
          } catch (error) {
            console.error('Error signing out:', error);
          }
          goto('/');
        }, 3000);

      } else {
        message = result.error || 'Terjadi kesalahan saat mereset akun';
        isSuccess = false;
      }

    } catch (error) {
      console.error('Reset account error:', error);
      message = 'Terjadi kesalahan sistem. Silakan coba lagi.';
      isSuccess = false;
    } finally {
      isLoading = false;
    }
  }

  function handleNextStep() {
    if (step < 3) {
      step++;
    } else {
      showConfirmation = true;
    }
  }

  function handlePrevStep() {
    if (step > 1) {
      step--;
    } else {
      goto('/dashboard');
    }
  }

  function resetConfirmation() {
    showConfirmation = false;
    confirmationText = '';
    step = 1;
  }

  $: isConfirmationValid = confirmationText.trim().toUpperCase() === CONFIRMATION_TEXT;
</script>

<svelte:head>
  <title>Reset Akun - DuitTrack</title>
  <meta name="description" content="Reset semua data akun DuitTrack Anda - hapus semua budget, expense, dan kembalikan ke pengaturan awal." />
</svelte:head>

<AuthGuard requireAuth={true} redirectTo="/" let:user let:isAuthenticated>
  <div class="min-h-screen fintech-background">
    <div class="max-w-2xl mx-auto px-4 py-8">

      <!-- Header -->
      <div class="glass-card p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-white mb-2">Reset Akun DuitTrack</h1>
            <p class="text-gray-300 text-sm">
              Kelola data akun keuangan Anda
            </p>
          </div>
          <UserProfileComponent
            showEmail={false}
            showSignOut={true}
            avatarSize="md"
            layout="horizontal"
            on:signout-success={() => goto('/')}
          />
        </div>
      </div>

      {#if message}
        <!-- Success/Error Message -->
        <div class="glass-card p-6 mb-6">
          <div class="flex items-center space-x-3 {isSuccess ? 'text-green-300' : 'text-red-300'}">
            <div class="text-2xl">
              {isSuccess ? '✅' : '❌'}
            </div>
            <div>
              <p class="font-medium">{message}</p>
              {#if isSuccess}
                <p class="text-sm text-gray-400 mt-1">
                  Anda akan diarahkan ke halaman utama dalam beberapa detik...
                </p>
              {/if}
            </div>
          </div>
        </div>
      {:else}

        <!-- Step Progress -->
        <div class="glass-card p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            {#each [1, 2, 3] as stepNum}
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                           {step >= stepNum ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-300'}">
                  {stepNum}
                </div>
                {#if stepNum < 3}
                  <div class="w-16 h-0.5 mx-2 {step > stepNum ? 'bg-red-500' : 'bg-gray-600'}"></div>
                {/if}
              </div>
            {/each}
          </div>
          <p class="text-gray-300 text-sm text-center">
            {#if step === 1}Informasi Reset Akun
            {:else if step === 2}Peringatan & Konsekuensi
            {:else}Konfirmasi Akhir
            {/if}
          </p>
        </div>

        <!-- Step Content -->
        <div class="glass-card p-8">

          {#if step === 1}
            <!-- Step 1: Information -->
            <div class="text-center space-y-6">
              <div class="text-6xl">⚠️</div>
              <div>
                <h2 class="text-xl font-bold text-white mb-4">Reset Akun DuitTrack</h2>
                <p class="text-gray-300 mb-6">
                  Fitur ini akan menghapus SEMUA data keuangan Anda dan mengembalikan akun ke kondisi awal.
                </p>
              </div>

              <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-left">
                <h3 class="font-semibold text-red-300 mb-3">Yang akan dihapus:</h3>
                <ul class="space-y-2 text-sm text-gray-300">
                  <li>• Semua catatan pengeluaran (expenses)</li>
                  <li>• Semua data budget per kategori</li>
                  <li>• History transaksi dan analytics</li>
                  <li>• Pengaturan onboarding (akan diminta setup ulang)</li>
                </ul>
              </div>

              <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-left">
                <h3 class="font-semibold text-green-300 mb-3">Yang TIDAK akan dihapus:</h3>
                <ul class="space-y-2 text-sm text-gray-300">
                  <li>• Akun Google Anda</li>
                  <li>• Profil email dan nama</li>
                  <li>• Akses login ke aplikasi</li>
                </ul>
              </div>
            </div>

          {:else if step === 2}
            <!-- Step 2: Warning -->
            <div class="text-center space-y-6">
              <div class="text-6xl">🚨</div>
              <div>
                <h2 class="text-xl font-bold text-red-300 mb-4">PERINGATAN PENTING</h2>
                <p class="text-gray-300 mb-6">
                  Tindakan ini TIDAK DAPAT DIBATALKAN setelah dikonfirmasi!
                </p>
              </div>

              <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-left">
                <h3 class="font-bold text-red-200 mb-4 text-center">⚠️ KONSEKUENSI RESET AKUN ⚠️</h3>
                <ul class="space-y-3 text-sm text-gray-300">
                  <li class="flex items-start space-x-2">
                    <span class="text-red-400 font-bold">•</span>
                    <span>Semua data keuangan akan hilang PERMANEN</span>
                  </li>
                  <li class="flex items-start space-x-2">
                    <span class="text-red-400 font-bold">•</span>
                    <span>Tidak ada backup atau cara mengembalikan data</span>
                  </li>
                  <li class="flex items-start space-x-2">
                    <span class="text-red-400 font-bold">•</span>
                    <span>Anda harus mulai dari awal (onboarding ulang)</span>
                  </li>
                  <li class="flex items-start space-x-2">
                    <span class="text-red-400 font-bold">•</span>
                    <span>Semua progress tracking akan hilang</span>
                  </li>
                </ul>
              </div>

              <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p class="text-yellow-300 text-sm">
                  💡 <strong>Alternatif:</strong> Jika Anda hanya ingin membersihkan data tertentu,
                  pertimbangkan untuk menghapus expense atau budget secara manual dari dashboard.
                </p>
              </div>
            </div>

          {:else if step === 3}
            <!-- Step 3: Final Confirmation -->
            <div class="text-center space-y-6">
              <div class="text-6xl">🔥</div>
              <div>
                <h2 class="text-xl font-bold text-red-200 mb-4">KONFIRMASI TERAKHIR</h2>
                <p class="text-gray-300 mb-6">
                  Ketik "<strong class="text-red-300">{CONFIRMATION_TEXT}</strong>" untuk mengkonfirmasi reset akun
                </p>
              </div>

              <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <div class="text-left mb-4">
                  <label for="confirmation" class="block text-sm font-medium text-red-300 mb-2">
                    Konfirmasi Reset (case-insensitive):
                  </label>
                  <input
                    id="confirmation"
                    type="text"
                    bind:value={confirmationText}
                    placeholder="Ketik: {CONFIRMATION_TEXT}"
                    class="w-full px-4 py-3 bg-white/10 border border-red-500/50 rounded-lg
                           text-white placeholder-gray-400 focus:outline-none focus:ring-2
                           focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                  />
                </div>

                {#if confirmationText && !isConfirmationValid}
                  <p class="text-red-400 text-sm">
                    ❌ Teks konfirmasi tidak sesuai
                  </p>
                {:else if isConfirmationValid}
                  <p class="text-green-400 text-sm">
                    ✅ Konfirmasi valid
                  </p>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              on:click={handlePrevStep}
              disabled={isLoading}
              class="flex-1 px-6 py-3 bg-gray-600/20 hover:bg-gray-600/40 text-white
                     font-medium rounded-lg border border-gray-500/30 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 1 ? '← Kembali ke Dashboard' : '← Kembali'}
            </button>

            {#if step < 3}
              <button
                on:click={handleNextStep}
                disabled={isLoading}
                class="flex-1 px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white
                       font-medium rounded-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lanjut →
              </button>
            {:else}
              <button
                on:click={() => handleResetAccount(user)}
                disabled={isLoading || !isConfirmationValid}
                class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white
                       font-bold rounded-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isLoading}
                  <div class="flex items-center justify-center space-x-2">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Mereset Akun...</span>
                  </div>
                {:else}
                  🔥 RESET AKUN SEKARANG
                {/if}
              </button>
            {/if}
          </div>

          {#if step === 3}
            <div class="mt-4 text-center">
              <button
                on:click={resetConfirmation}
                class="text-gray-400 hover:text-gray-300 text-sm underline"
              >
                Batalkan reset
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</AuthGuard>

<style>
  /* Fintech background styling */
  .fintech-background {
    background: #0D1117;
    position: relative;
    overflow-x: hidden;
  }

  .fintech-background::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(circle at 20% 50%, rgba(184, 134, 11, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(218, 165, 32, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(184, 134, 11, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }

  /* Input focus animation */
  input:focus {
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.1);
  }

  /* Button hover animations */
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
</style>