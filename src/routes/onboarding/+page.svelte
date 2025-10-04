<script lang="ts">
  import AuthGuard from '$components/auth/AuthGuard.svelte';
  import UserProfileComponent from '$components/auth/UserProfile.svelte';
  import { goto } from '$app/navigation';
  import { authService } from '$lib/services/authService';
  import { userProfileStore } from '$stores/auth';
  import { generatePeriods, formatPeriodDisplay, getResetDatePresets, type PeriodGeneratorConfig } from '$lib/utils/periodHelpers';
  import { fade, fly } from 'svelte/transition';
  import toast from 'svelte-french-toast';

  let step = 1; // 1: Welcome, 2: Reset Date
  let step2State: 'tracking-setup' | 'budget-choice' = 'tracking-setup'; // Sub-state for Step 2
  let selectedResetDate = 25; // Default to 25 (most common in Indonesia)
  let resetType: 'fixed' | 'last-day-of-month' = 'fixed';
  let isCompleting = false;
  let showCustomInput = false;
  let nickname = ''; // Custom nickname
  let nicknameError = '';

  const presetOptions = getResetDatePresets();

  // Default preferences for new users
  const defaultPreferences = {
    theme: 'system' as const,
    notifications: {
      email: false,
      push: false,
      budgetAlerts: true,
      weeklyReports: false,
      monthlyReports: false
    },
    budgetWarnings: true,
    monthlyReports: false,
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY'
  };

  // Helper function to clean profile data before sending to Firebase
  function cleanProfileData(data: any): any {
    const cleaned: any = {};
    Object.entries(data).forEach(([key, value]) => {
      // Only include fields that are not undefined or null
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }

  // Preview period calculation
  $: periodPreview = (() => {
    const config: PeriodGeneratorConfig = {
      resetDate: resetType === 'last-day-of-month' ? -1 : selectedResetDate,
      resetType
    };
    const periods = generatePeriods(config, 3);
    return periods;
  })();

  $: currentPeriod = periodPreview.find(p => p.isActive);

  // Validate nickname
  function validateNickname(value: string): boolean {
    nicknameError = '';

    if (value.trim() === '') {
      return true; // Empty is okay, will use default
    }

    if (value.trim().length < 2) {
      nicknameError = 'Nickname minimal 2 karakter';
      return false;
    }

    if (value.length > 20) {
      nicknameError = 'Nickname maksimal 20 karakter';
      return false;
    }

    return true;
  }

  // Character counter reactive
  $: nicknameLength = nickname.length;
  $: isNicknameValid = validateNickname(nickname);

  function proceedToStep2() {
    if (!validateNickname(nickname)) {
      return;
    }
    step = 2;
  }


  // Shared function to save tracking period data
  async function saveTrackingPeriod() {
    const profileData = {
      onboardingComplete: true,
      ...(nickname.trim() && { nickname: nickname.trim() }), // Only add if not empty
      currency: 'IDR',
      locale: 'id-ID',
      budgetResetDate: resetType === 'last-day-of-month' ? -1 : selectedResetDate,
      budgetResetType: resetType,
      hasBudgetSetup: false,
      preferences: defaultPreferences
    };

    const cleanData = cleanProfileData(profileData);
    return await authService.completeOnboarding(cleanData);
  }

  // Handler when user completes Step 2a - Save data then slide to budget choice
  async function onTrackingPeriodComplete() {
    isCompleting = true;

    try {
      const result = await saveTrackingPeriod();

      if (result.success) {
        console.log('Tracking period saved successfully');
        // Slide to budget choice screen
        step2State = 'budget-choice';
      } else {
        toast.error('Gagal menyimpan. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error saving tracking period:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      isCompleting = false;
    }
  }

  // Handler to go back to tracking setup
  function backToTrackingSetup() {
    step2State = 'tracking-setup';
  }

  // Handler: User chooses to setup budget now (instant redirect, data already saved)
  function setupBudgetNow() {
    // Show success toast
    toast.success('Oke! Mari setup budget kamu 🎯', {
      duration: 1500,
      position: 'top-center',
    });

    // Quick redirect (data already saved in step 2a)
    setTimeout(() => {
      goto('/budget?fromOnboarding=true&setupTracking=true');
    }, 300);
  }

  // Handler: User chooses to skip to dashboard (instant redirect, data already saved)
  function skipToDashboard() {
    // Show reminder toast
    toast.success('Akun siap! Setup budget nanti ya 😊', {
      duration: 1500,
      position: 'top-center',
    });

    // Quick redirect (data already saved in step 2a)
    setTimeout(() => {
      goto('/dashboard');
    }, 300);
  }

  function handlePresetSelect(value: number) {
    selectedResetDate = value;
    resetType = 'fixed';
    showCustomInput = false;
  }

  function handleLastDaySelect() {
    resetType = 'last-day-of-month';
    showCustomInput = false;
  }

  function handleCustomInput() {
    showCustomInput = true;
    resetType = 'fixed';
  }

  async function handleSignOut() {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('$lib/config/firebase');
      await signOut(auth);
      goto('/');
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Gagal keluar. Silakan coba lagi.');
    }
  }
</script>

<svelte:head>
  <title>Onboarding - DuitTrack</title>
  <meta name="description" content="Setup your DuitTrack account - configure budget categories and preferences." />
</svelte:head>

<AuthGuard requireAuth={true} redirectTo="/" let:user let:isAuthenticated>
  <div class="onboarding-container">
    <div class="max-w-2xl mx-auto px-4 py-8">

      <!-- Progress Steps Indicator -->
      <div class="progress-steps" in:fade={{ duration: 300 }}>
        <div class="step {step === 1 ? 'active' : step > 1 ? 'completed' : ''}">
          <div class="step-number">{step > 1 ? '✓' : '1'}</div>
          <div class="step-label">Welcome</div>
        </div>
        <div class="step-line {step > 1 ? 'completed' : ''}"></div>
        <div class="step {step === 2 && step2State === 'tracking-setup' ? 'active' : step === 2 && step2State === 'budget-choice' ? 'completed' : ''}">
          <div class="step-number">{step === 2 && step2State === 'budget-choice' ? '✓' : '2'}</div>
          <div class="step-label">Setup</div>
        </div>
      </div>

      <!-- Step 1: Welcome -->
      {#if step === 1}
        <div class="content-card" in:fly={{ y: 20, duration: 400 }} out:fly={{ y: -20, duration: 300 }}>

          <!-- Trust Badge -->
          <div class="trust-badge">
            <span class="trust-icon">🔒</span>
            <span class="trust-text">Data aman & private</span>
            <span class="trust-divider">•</span>
            <span class="trust-text">Setup 30 detik</span>
          </div>

          <!-- User Avatar Hero -->
          <div class="user-hero">
            <UserProfileComponent
              showEmail={true}
              showName={false}
              showSignOut={false}
              avatarSize="xl"
              layout="vertical"
              on:reset-account={() => goto('/reset-account')}
            />
          </div>

          <div class="text-center mb-6">
            <h1 class="welcome-title">
              Welcome to DuitTrack! 👋
            </h1>
            <p class="welcome-subtitle greeting-intro">
              Aku personal finance tracker yang akan bantu kamu kelola keuangan dengan lebih mudah dan teratur
            </p>
          </div>

          <!-- Nickname Input Section -->
          <div class="nickname-section">
            <label for="nickname-input" class="nickname-label">
              Mau dipanggil apa nih? ✨
            </label>
            <div class="nickname-input-wrapper">
              <input
                id="nickname-input"
                type="text"
                bind:value={nickname}
                placeholder={user?.displayName?.split(' ')[0] || 'Masukkan nickname'}
                class="nickname-input {nicknameError ? 'error' : ''}"
                maxlength="20"
                on:input={() => validateNickname(nickname)}
              />
              <span class="char-counter {nicknameLength > 20 ? 'error' : ''}">
                {nicknameLength}/20
              </span>
            </div>
            {#if nicknameError}
              <p class="nickname-error" transition:fly={{ y: -5, duration: 200 }}>
                ⚠️ {nicknameError}
              </p>
            {:else}
              <p class="nickname-hint">
                💡 Kosongkan jika ingin pakai nama Google
              </p>
            {/if}
          </div>

          <button
            on:click={proceedToStep2}
            class="primary-button w-full mb-4"
            disabled={!isNicknameValid}
          >
            <span class="button-content">
              <span class="button-text">Yuk Mulai!</span>
              <span class="button-icon">✨</span>
            </span>
            <div class="button-glow"></div>
          </button>

          <button
            on:click={handleSignOut}
            class="secondary-button w-full"
          >
            Sign Out
          </button>
        </div>
      {/if}

      <!-- Step 2: Reset Date Selection -->
      {#if step === 2}
        <!-- Step 2a: Tracking Period Setup -->
        {#if step2State === 'tracking-setup'}
          <div class="content-card" in:fly={{ x: -20, duration: 400 }} out:fly={{ x: -20, duration: 300 }}>
            <div class="text-center mb-6">
              <div class="step-icon">📅</div>
              <h2 class="step-title">
                Kapan Periode Tracking Kamu Dimulai?
              </h2>
              <p class="step-subtitle">
                Pilih tanggal sesuai jadwal gajian untuk tracking yang lebih akurat
              </p>
            </div>

          <!-- Preset Options - Simplified -->
          <div class="space-y-3 mb-4">
            {#each presetOptions as option}
              <button
                class="preset-btn {selectedResetDate === option.value && resetType === 'fixed' ? 'active' : ''}"
                on:click={() => handlePresetSelect(option.value)}
              >
                <div class="preset-icon">📅</div>
                <div class="flex-1 text-left">
                  <div class="preset-label">{option.label}</div>
                  <div class="preset-description">{option.description}</div>
                </div>
                {#if option.popular}
                  <span class="badge-popular">Populer ⭐</span>
                {/if}
              </button>
            {/each}

            <!-- Last Day Option -->
            <button
              class="preset-btn {resetType === 'last-day-of-month' ? 'active' : ''}"
              on:click={handleLastDaySelect}
            >
              <div class="preset-icon">📅</div>
              <div class="flex-1 text-left">
                <div class="preset-label">Akhir bulan</div>
                <div class="preset-description">Reset otomatis tiap akhir bulan</div>
              </div>
            </button>

            <!-- Custom Input -->
            <button
              class="preset-btn {showCustomInput ? 'active' : ''}"
              on:click={handleCustomInput}
            >
              <div class="preset-icon">✏️</div>
              <div class="flex-1 text-left">
                <div class="preset-label">Custom tanggal</div>
                <div class="preset-description">Tentukan tanggal sendiri (1-31)</div>
              </div>
            </button>

            {#if showCustomInput}
              <div class="custom-input-box" transition:fly={{ y: -10, duration: 200 }}>
                <label for="custom-date-input" class="custom-input-label">Pilih tanggal (1-31):</label>
                <input
                  id="custom-date-input"
                  type="number"
                  min="1"
                  max="31"
                  bind:value={selectedResetDate}
                  class="custom-input"
                  placeholder="Masukkan tanggal"
                />
              </div>
            {/if}
          </div>

          <!-- Preview - Always Visible, Simplified -->
          {#if currentPeriod}
            <div class="preview-info" transition:fly={{ y: -10, duration: 300 }}>
              <div class="preview-title">Periode Mendatang:</div>
              <ul class="preview-list">
                {#each periodPreview.slice(0, 2) as period, i}
                  <li class="preview-item">
                    <span class="preview-bullet">•</span>
                    <span class="preview-text">
                      Periode {i + 1}: {formatPeriodDisplay(period.startDate, period.endDate)}
                      {#if period.isActive}
                        <span class="preview-badge">Current ✓</span>
                      {/if}
                    </span>
                  </li>
                {/each}
              </ul>
              <div class="preview-reset">
                <span class="preview-reset-icon">🔄</span>
                <span class="preview-reset-text">
                  Reset setiap:
                  {#if resetType === 'last-day-of-month'}
                    Akhir bulan
                  {:else}
                    Tanggal {selectedResetDate}
                  {/if}
                </span>
              </div>
            </div>
          {/if}

            <!-- Actions -->
            <div class="flex gap-3 mt-6">
              <button
                class="secondary-button flex-1"
                on:click={() => step = 1}
                disabled={isCompleting}
              >
                Kembali
              </button>
              <button
                class="primary-button flex-1"
                on:click={onTrackingPeriodComplete}
                disabled={isCompleting}
              >
                <span class="button-content">
                  {#if isCompleting}
                    <div class="loading-spinner"></div>
                    <span class="button-text">Menyimpan...</span>
                  {:else}
                    <span class="button-text">Lanjut</span>
                    <span class="button-icon">→</span>
                  {/if}
                </span>
                <div class="button-glow"></div>
              </button>
            </div>
          </div>
        {/if}

        <!-- Step 2b: Budget Choice -->
        {#if step2State === 'budget-choice'}
          <div class="content-card" in:fly={{ x: 20, duration: 400 }} out:fly={{ x: 20, duration: 300 }}>
            <!-- Animated Success Icon -->
            <div class="choice-success-icon-wrapper">
              <div class="success-glow"></div>
              <div class="choice-success-icon">
                <svg viewBox="0 0 52 52" class="checkmark">
                  <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                  <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
            </div>
            <h3 class="choice-title">Periode Tracking Tersimpan!</h3>
            <p class="choice-info">
              Reset setiap:
              {#if resetType === 'last-day-of-month'}
                Akhir bulan
              {:else}
                Tanggal {selectedResetDate}
              {/if}
            </p>

            {#if currentPeriod}
              <p class="choice-period">
                Periode saat ini: {formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate)}
              </p>
            {/if}

            <div class="choice-divider"></div>

            <!-- Budget Setup Prompt -->
            <h4 class="choice-question">Mau lanjut setup budget sekarang?</h4>
            <p class="choice-subtitle">
              Dengan setup budget, kamu bisa kontrol pengeluaran lebih baik
            </p>

            <!-- Action Buttons - Instant Navigation (no loading state needed) -->
            <button
              class="primary-button w-full mb-3"
              on:click={setupBudgetNow}
            >
              <span class="button-content">
                <span class="button-icon">🎯</span>
                <span class="button-text">Setup Budget Sekarang</span>
              </span>
              <div class="button-glow"></div>
            </button>

            <button
              class="secondary-button w-full mb-3"
              on:click={skipToDashboard}
            >
              <span class="button-content">
                <span class="button-icon">⏭️</span>
                <span class="button-text">Nanti aja, ke Dashboard</span>
              </span>
            </button>

            <button
              class="secondary-button w-full"
              on:click={backToTrackingSetup}
            >
              Kembali
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</AuthGuard>

<style>
  /* ============================================
     LIGHT & GLASSY THEME - Onboarding
     Matching Dashboard Design Pattern
     ============================================ */

  /* Container - Light gradient background */
  .onboarding-container {
    min-height: 100vh;
    background:
      radial-gradient(circle at 20% 80%, rgba(0, 191, 255, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(30, 144, 255, 0.07) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(0, 123, 255, 0.06) 0%, transparent 40%),
      linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    position: relative;
    overflow: hidden;
  }

  /* Floating background accents - Enhanced */
  .onboarding-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.12) 0%, transparent 35%),
      radial-gradient(circle at 75% 75%, rgba(30, 144, 255, 0.1) 0%, transparent 35%),
      radial-gradient(circle at 50% 10%, rgba(0, 123, 255, 0.08) 0%, transparent 30%);
    animation: float-accent 20s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  /* Additional accent shapes */
  .onboarding-container::after {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
    animation: float-shape 15s ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes float-accent {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    33% {
      transform: translateY(-15px) rotate(120deg);
    }
    66% {
      transform: translateY(10px) rotate(240deg);
    }
  }

  @keyframes float-shape {
    0% {
      transform: translate(0, 0) scale(1);
      opacity: 0.6;
    }
    100% {
      transform: translate(-50px, 50px) scale(1.1);
      opacity: 0.8;
    }
  }

  /* Progress Steps Indicator */
  .progress-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 32px;
    position: relative;
    z-index: 1;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }

  .step-number {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
    background: rgba(255, 255, 255, 0.5);
    border: 2px solid rgba(6, 182, 212, 0.2);
    color: #6b7280;
    backdrop-filter: blur(15px);
    transition: all 0.3s ease;
  }

  .step.active .step-number {
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.25) 0%,
      rgba(30, 144, 255, 0.2) 100%);
    border-color: rgba(6, 182, 212, 0.5);
    color: #0891B2;
    box-shadow: 0 4px 16px rgba(6, 182, 212, 0.2);
  }

  .step.completed .step-number {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: #10b981;
    color: white;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  }

  .step-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .step.active .step-label {
    color: #0891B2;
  }

  .step.completed .step-label {
    color: #10b981;
  }

  .step-line {
    width: 80px;
    height: 2px;
    background: rgba(6, 182, 212, 0.15);
    transition: all 0.3s ease;
  }

  .step-line.completed {
    background: linear-gradient(90deg, #10b981, #059669);
  }

  /* Content Card - Light Glassmorphism */
  .content-card {
    position: relative;
    padding: 40px;
    border-radius: 16px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .content-card:hover {
    box-shadow:
      0 20px 60px rgba(0, 191, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 191, 255, 0.15);
  }

  /* Trust Badge */
  .trust-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    margin-bottom: 24px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 24px;
    backdrop-filter: blur(10px);
  }

  .trust-icon {
    font-size: 14px;
  }

  .trust-text {
    font-size: 13px;
    font-weight: 600;
    color: #059669;
  }

  .trust-divider {
    color: #6b7280;
    opacity: 0.5;
  }

  /* User Hero Section */
  .user-hero {
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
  }

  .user-hero :global(.user-profile) {
    transform: scale(1.1);
  }

  .user-hero :global(.user-name) {
    font-size: 17px;
    font-weight: 600;
    color: #1f2937 !important;
  }

  .user-hero :global(.user-email) {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280 !important;
  }

  .welcome-title {
    font-size: 28px;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .welcome-subtitle {
    font-size: 16px;
    color: #6b7280;
    line-height: 1.5;
  }

  .greeting-intro {
    margin-bottom: 8px;
    font-size: 15px;
  }


  /* Step 2 Specific */
  .step-icon {
    font-size: 56px;
    margin-bottom: 12px;
  }

  .step-title {
    font-size: 24px;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }

  .step-subtitle {
    font-size: 15px;
    color: #6b7280;
    line-height: 1.5;
  }

  /* Preset Buttons - Enhanced Interactive Cards */
  .preset-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 12px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 100%);
    backdrop-filter: blur(20px) saturate(1.5);
    -webkit-backdrop-filter: blur(20px) saturate(1.5);
    border: 1px solid rgba(6, 182, 212, 0.15);
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.04);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .preset-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.1), transparent);
    transition: left 0.5s ease;
  }

  .preset-btn:hover::before {
    left: 100%;
  }

  .preset-btn:hover {
    transform: translateY(-4px) scale(1.02);
    border-color: rgba(6, 182, 212, 0.3);
    box-shadow: 0 12px 32px rgba(0, 191, 255, 0.1);
    background: linear-gradient(135deg,
      rgba(240, 248, 255, 0.7) 0%,
      rgba(248, 252, 255, 0.5) 100%);
  }

  .preset-btn.active {
    border: 2px solid rgba(6, 182, 212, 0.5);
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.15) 0%,
      rgba(240, 248, 255, 0.6) 100%);
    box-shadow: 0 8px 24px rgba(6, 182, 212, 0.15);
    transform: translateY(-2px) scale(1.01);
  }

  .preset-icon {
    font-size: 28px;
    flex-shrink: 0;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
  }

  .preset-label {
    font-weight: 700;
    color: #1f2937;
    font-size: 16px;
    margin-bottom: 4px;
  }

  .preset-description {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.4;
  }

  .badge-popular {
    background: linear-gradient(135deg, #f59e0b, #f97316);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  }

  /* Custom Input Box */
  .custom-input-box {
    padding: 20px;
    background: rgba(6, 182, 212, 0.05);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  .custom-input-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 12px;
  }

  .custom-input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
  }

  .custom-input:focus {
    outline: none;
    border-color: rgba(6, 182, 212, 0.5);
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
  }

  .custom-input::placeholder {
    color: #9ca3af;
  }

  /* Preview Info - Simplified Minimal Style */
  .preview-info {
    padding: 16px 20px;
    margin-top: 16px;
    margin-bottom: 12px;
    border-radius: 10px;
    background: rgba(6, 182, 212, 0.04);
    border: none;
    backdrop-filter: none;
  }

  .preview-title {
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .preview-list {
    list-style: none;
    padding: 0;
    margin: 0 0 12px 0;
  }

  .preview-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 0;
    font-size: 14px;
    line-height: 1.5;
  }

  .preview-bullet {
    color: #0891B2;
    font-size: 16px;
    line-height: 1.5;
    flex-shrink: 0;
  }

  .preview-text {
    color: #4b5563;
    font-weight: 500;
    flex: 1;
  }

  .preview-badge {
    display: inline-block;
    margin-left: 6px;
    padding: 2px 8px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 700;
    vertical-align: middle;
  }

  .preview-reset {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 8px;
    margin-top: 8px;
    border-top: 1px solid rgba(6, 182, 212, 0.1);
  }

  .preview-reset-icon {
    font-size: 14px;
  }

  .preview-reset-text {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  /* Buttons - Enhanced with Pulse Animation */
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 8px 32px rgba(0, 191, 255, 0.15),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5);
    }
    50% {
      box-shadow: 0 8px 32px rgba(0, 191, 255, 0.25),
                  0 0 20px rgba(0, 191, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5);
    }
  }

  .primary-button {
    position: relative;
    padding: 16px 24px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.55) 0%,
      rgba(30, 144, 255, 0.65) 100%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    color: white;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    overflow: hidden;
  }

  .primary-button:hover:not(.loading):not(:disabled) {
    transform: translateY(-3px);
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    box-shadow:
      0 12px 40px rgba(0, 191, 255, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(255, 255, 255, 0.6);
    animation: pulse 2s infinite;
  }

  .primary-button:active:not(.loading):not(:disabled) {
    transform: translateY(-1px);
  }

  .primary-button.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .button-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .button-text {
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .button-icon {
    font-size: 18px;
    transition: transform 0.3s ease;
  }

  .primary-button:hover .button-icon {
    transform: translateX(4px);
  }

  .button-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
    border-radius: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .primary-button:hover .button-glow {
    opacity: 1;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .secondary-button {
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 12px;
    color: #4b5563;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    backdrop-filter: blur(15px);
    transition: all 0.3s ease;
  }

  .secondary-button:hover {
    background: rgba(255, 255, 255, 0.6);
    border-color: rgba(6, 182, 212, 0.4);
    color: #1f2937;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(6, 182, 212, 0.1);
  }

  .skip-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 8px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .skip-button:hover:not(:disabled) {
    color: #0891B2;
    background: rgba(6, 182, 212, 0.08);
    border-color: rgba(6, 182, 212, 0.2);
    transform: translateY(-1px);
  }

  .skip-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .skip-icon {
    font-size: 14px;
  }

  /* Nickname Input Section */
  .nickname-section {
    margin: 24px 0 32px;
    padding: 20px;
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.05) 0%,
      rgba(240, 248, 255, 0.5) 100%);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  .nickname-label {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 12px;
    text-align: center;
  }

  .nickname-input-wrapper {
    position: relative;
  }

  .nickname-input {
    width: 100%;
    padding: 14px 50px 14px 16px;
    background: rgba(255, 255, 255, 0.8);
    border: 2px solid rgba(6, 182, 212, 0.2);
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    text-align: center;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .nickname-input:focus {
    outline: none;
    border-color: rgba(6, 182, 212, 0.5);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.15),
                0 0 20px rgba(6, 182, 212, 0.1);
    transform: translateY(-2px);
  }

  .nickname-input.error {
    border-color: #ef4444;
    background: rgba(254, 226, 226, 0.5);
  }

  .nickname-input::placeholder {
    color: #9ca3af;
    font-weight: 500;
  }

  .char-counter {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 6px;
    pointer-events: none;
  }

  .char-counter.error {
    color: #ef4444;
  }

  .nickname-hint {
    margin-top: 8px;
    font-size: 13px;
    color: #6b7280;
    text-align: center;
    font-weight: 500;
  }

  .nickname-error {
    margin-top: 8px;
    font-size: 13px;
    color: #ef4444;
    text-align: center;
    font-weight: 600;
  }

  /* Disabled button state */
  .primary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  .primary-button:disabled:hover {
    transform: none !important;
    box-shadow: 0 8px 32px rgba(0, 191, 255, 0.15);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .content-card {
      padding: 24px;
    }

    .welcome-title {
      font-size: 24px;
    }

    .step-title {
      font-size: 20px;
    }

    .preset-btn {
      padding: 14px;
    }

    .preset-icon {
      font-size: 24px;
    }

    .preset-label {
      font-size: 15px;
    }

    .progress-steps {
      margin-bottom: 24px;
    }

    .step-number {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }

    .step-line {
      width: 60px;
    }
  }

  @media (max-width: 430px) {
    .trust-badge {
      flex-wrap: wrap;
      padding: 6px 12px;
    }

    .trust-text {
      font-size: 11px;
    }
  }

  /* ============================================
     BUDGET CHOICE SCREEN (Step 2b) - Success Celebration
     ============================================ */

  /* Success Icon Wrapper with Glow */
  .choice-success-icon-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 32px 0 24px;
  }

  .success-glow {
    position: absolute;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    animation: glow-pulse 2s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  .choice-success-icon {
    position: relative;
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
    animation: icon-scale-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  @keyframes icon-scale-in {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Animated Checkmark SVG */
  .checkmark {
    width: 50px;
    height: 50px;
  }

  .checkmark-circle {
    stroke: white;
    stroke-width: 2;
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    animation: stroke-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    animation-delay: 0.1s;
  }

  @keyframes stroke-circle {
    100% {
      stroke-dashoffset: 0;
    }
  }

  .checkmark-check {
    stroke: white;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: stroke-check 0.3s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    animation-delay: 0.4s;
  }

  @keyframes stroke-check {
    100% {
      stroke-dashoffset: 0;
    }
  }

  .choice-title {
    font-size: 24px;
    font-weight: 800;
    color: #1f2937;
    text-align: center;
    margin-bottom: 8px;
  }

  .choice-info {
    font-size: 15px;
    font-weight: 600;
    color: #0891B2;
    text-align: center;
    margin-bottom: 4px;
  }

  .choice-period {
    font-size: 14px;
    color: #6b7280;
    text-align: center;
    margin-bottom: 20px;
  }

  .choice-divider {
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(6, 182, 212, 0.2),
      transparent);
    margin: 20px 0;
  }

  .choice-question {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    text-align: center;
    margin-bottom: 8px;
  }

  .choice-subtitle {
    font-size: 14px;
    color: #6b7280;
    text-align: center;
    line-height: 1.5;
    margin-bottom: 24px;
  }

  /* Utility classes */
  .w-full {
    width: 100%;
  }

  .mb-3 {
    margin-bottom: 12px;
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .choice-success-icon {
      font-size: 48px;
    }

    .choice-title {
      font-size: 20px;
    }

    .choice-question {
      font-size: 16px;
    }
  }
</style>