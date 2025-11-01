<script lang="ts">
  import { formatRupiah } from '$utils/index';
  import { goto } from '$app/navigation';
  import { getDaysRemainingInPeriod, getTotalDaysInPeriod } from '$lib/utils/periodHelpers';
  import { calculateSpendingVelocity } from '$lib/utils/insightCalculators';

  // Props with defaults
  export let budgetData: any = null;
  export let expenses: any[] = [];
  export let currentPeriodId: string = '';
  export let currentPeriod: any = null;
  export let loading: boolean = false;

  // Computed values with safe defaults
  $: hasBudget = budgetData?.totalBudget > 0;
  $: totalBudget = budgetData?.totalBudget || 0;
  $: totalSpent = budgetData?.totalSpent || 0;
  $: percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Period calculations
  $: daysRemaining = currentPeriod ? getDaysRemainingInPeriod(currentPeriod) : 0;
  $: totalDays = currentPeriod ? getTotalDaysInPeriod(currentPeriod) : 30;
  $: daysPassed = totalDays - daysRemaining;
  $: timeProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

  // Velocity calculation
  $: velocity = hasBudget && currentPeriod
    ? calculateSpendingVelocity(totalBudget, totalSpent, currentPeriod.startDate, currentPeriod.endDate)
    : null;

  // Daily Insights calculations
  $: remainingBudget = Math.max(0, totalBudget - totalSpent);
  $: dailyAllowance = daysRemaining > 0 ? Math.round(remainingBudget / daysRemaining) : 0;
  $: dailyAvg = velocity?.dailyBurnRate || 0;
  $: projected = velocity?.projectedTotal || 0;
  $: projectedSavings = totalBudget - projected;
  $: isSaving = projectedSavings > 0;

  // Format end date for display
  $: endDateFormatted = currentPeriod ? formatEndDate(currentPeriod.endDate) : '';

  function formatEndDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
    return `${day} ${month}`;
  }

  function formatShortRupiah(amount: number): string {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    } else if (amount >= 1000) {
      return `Rp ${Math.round(amount / 1000)}k`;
    }
    return formatRupiah(amount);
  }

  function getGradient() {
    if (percentage >= 90) return 'linear-gradient(135deg, rgba(239, 68, 68, 0.55), rgba(220, 38, 38, 0.65))';
    if (percentage >= 75) return 'linear-gradient(135deg, rgba(251, 191, 36, 0.55), rgba(245, 158, 11, 0.65))';
    return 'linear-gradient(135deg, rgba(0, 191, 255, 0.55), rgba(30, 144, 255, 0.65))';
  }
</script>

{#if loading}
  <div class="hero-card loading-card">
    <div class="loading-shimmer"></div>
  </div>
{:else if !hasBudget}
  <!-- Simple Mode -->
  <div class="hero-card simple-card" style="background: {getGradient()}">
    <!-- Enhanced Background Elements -->
    <div class="hero-bg-elements">
      <div class="hero-circle hero-circle-1 animate-liquid-float"></div>
      <div class="hero-circle hero-circle-2 animate-liquid-float"></div>
      <div class="hero-wave animate-liquid-flow"></div>
      <div class="hero-glass-particle hero-particle-1"></div>
      <div class="hero-glass-particle hero-particle-2"></div>
      <div class="hero-glass-particle hero-particle-3"></div>
    </div>

    <h2 class="title">Total Pengeluaran 💸</h2>
    <div class="amount-big">{formatRupiah(totalSpent)}</div>

    <div class="cta-box">
      <div class="cta-text">
        <div class="cta-title">💡 Mau tracking lebih detail?</div>
        <div class="cta-sub">Setup budget untuk track per kategori!</div>
      </div>
      <button class="cta-btn" on:click={() => goto('/budget')}>
        Setup Budget →
      </button>
    </div>
  </div>
{:else}
  <!-- Full Mode -->
  <div class="hero-card full-card">
    <!-- Enhanced Background Elements with MORE PARTICLES -->
    <div class="hero-bg-elements">
      <div class="hero-circle hero-circle-1"></div>
      <div class="hero-circle hero-circle-2"></div>
      <div class="hero-wave"></div>

      <!-- Subtle Glass Particles (6 particles for natural glassmorphism) -->
      <div class="hero-glass-particle hero-particle-1"></div>
      <div class="hero-glass-particle hero-particle-2"></div>
      <div class="hero-glass-particle hero-particle-3"></div>
      <div class="hero-glass-particle hero-particle-4"></div>
      <div class="hero-glass-particle hero-particle-5"></div>
      <div class="hero-glass-particle hero-particle-6"></div>
    </div>

    <div class="hero-header">
      <h2 class="title">💰 Financial Pulse</h2>
    </div>

    <!-- Spending Velocity Section - REDESIGNED -->
    {#if velocity}
      <div class="velocity-section-new">
        <div class="velocity-header-new">
          <span class="velocity-title-new">🎯 Spending Velocity</span>
          <div class="velocity-status-badge-new" class:on-track={velocity.status === 'on-track'} class:slow={velocity.status === 'slow'} class:too-fast={velocity.status === 'too-fast'}>
            {#if velocity.status === 'too-fast'}
              TERLALU CEPAT
            {:else if velocity.status === 'slow'}
              SESUAI TARGET (Hemat!)
            {:else}
              SESUAI TARGET
            {/if}
          </div>
        </div>

        <!-- BIG Progress Bar - Prominent -->
        <div class="big-progress-track">
          <!-- Time fill (background layer) -->
          <div class="big-progress-time" style="width: {Math.min(100, timeProgress)}%"></div>

          <!-- Spending fill (foreground layer) -->
          <div
            class="big-progress-spending"
            class:too-fast={velocity.status === 'too-fast'}
            class:on-track={velocity.status === 'on-track'}
            class:slow={velocity.status === 'slow'}
            style="width: {Math.min(100, velocity.spentProgress * 100)}%"
          ></div>

          <!-- Inline indicators -->
          <div class="big-progress-indicators">
            <div class="big-indicator big-indicator-spending">
              <span class="big-indicator-emoji">💸</span>
              <span class="big-indicator-value">{(velocity.spentProgress * 100).toFixed(0)}%</span>
            </div>
            <div class="big-indicator big-indicator-time">
              <span class="big-indicator-emoji">⏰</span>
              <span class="big-indicator-value">{timeProgress.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <!-- Clean Legend - No Boxes, Just Text -->
        <div class="clean-legend">
          <div class="legend-item">
            <span class="legend-emoji">💸</span>
            <span class="legend-text">Spending: <strong>{formatRupiah(totalSpent)}</strong> dari {formatRupiah(totalBudget)}</span>
          </div>
          <div class="legend-item">
            <span class="legend-emoji">⏰</span>
            <span class="legend-text">Time: <strong>{daysPassed} / {totalDays}</strong> days • Ends {endDateFormatted}</span>
          </div>
        </div>

      </div>
    {/if}

    <!-- Daily Insights Section -->
    <div class="daily-insights-section">
      <h3 class="insights-title">
        <span class="insights-icon">💰</span>
        Daily Insights
      </h3>

      <div class="insights-grid">
        <!-- Daily Average -->
        <div class="insight-box">
          <span class="insight-icon">📊</span>
          <div class="insight-info">
            <span class="insight-label">Expense rata-rata:</span>
            <span class="insight-value">{formatShortRupiah(dailyAvg)}/hari</span>
          </div>
        </div>

        <!-- Daily Allowance -->
        <div class="insight-box">
          <span class="insight-icon">🎯</span>
          <div class="insight-info">
            <span class="insight-label">Max. Pengeluaran:</span>
            <span class="insight-value">{formatShortRupiah(dailyAllowance)}/hari</span>
          </div>
        </div>
      </div>

      <!-- Projection (Full Width) -->
      <div class="insight-box insight-highlight">
        <span class="insight-icon">{isSaving ? '✨' : '⚠️'}</span>
        <div class="insight-info">
          <span class="insight-label">Estimasi akhir bulan:</span>
          <span class="insight-value" class:saving={isSaving} class:overspend={!isSaving}>
            {#if isSaving}
              Hemat {formatRupiah(projectedSavings)}! 🎉
            {:else}
              Over {formatRupiah(Math.abs(projectedSavings))} 😰
            {/if}
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ===== HERO GLASSMORPHISM - MATCHING EXPENSES & BUDGET PAGES ===== */
  .hero-card {
    position: relative;
    border-radius: 16px;
    padding: 36px;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    cursor: pointer;
    min-height: 320px;
    /* Hero glassmorphism from design system */
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.55) 0%,
      rgba(30, 144, 255, 0.65) 50%,
      rgba(0, 123, 255, 0.7) 100%);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow:
      0 8px 25px rgba(0, 191, 255, 0.08),
      0 4px 12px rgba(0, 191, 255, 0.12),
      0 2px 6px rgba(30, 144, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  .hero-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      transparent 40%,
      transparent 60%,
      rgba(6, 182, 212, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
    z-index: 0;
  }

  .hero-card > * {
    position: relative;
    z-index: 2;
  }

  .hero-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(0, 191, 255, 0.12),
      0 10px 20px rgba(0, 191, 255, 0.15),
      0 4px 8px rgba(30, 144, 255, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(40px) saturate(2.2);
    -webkit-backdrop-filter: blur(40px) saturate(2.2);
  }

  .hero-card:hover::before {
    opacity: 1;
  }

  /* Enhanced Hero Background Elements */
  .hero-bg-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
  }

  .hero-circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .hero-circle-1 {
    width: 180px;
    height: 180px;
    top: -90px;
    right: -90px;
    animation: circle-float-1 20s ease-in-out infinite;
  }

  .hero-circle-2 {
    width: 140px;
    height: 140px;
    bottom: -70px;
    left: -70px;
    animation: circle-float-2 25s ease-in-out infinite;
  }

  @keyframes circle-float-1 {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(-20px, 20px) scale(1.1);
    }
  }

  @keyframes circle-float-2 {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(20px, -20px) scale(1.15);
    }
  }

  .hero-wave {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    border-radius: 50% 50% 0 0;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    animation: wave-motion 15s ease-in-out infinite;
  }

  @keyframes wave-motion {
    0%, 100% {
      transform: translateY(0) scaleY(1);
    }
    50% {
      transform: translateY(-10px) scaleY(1.05);
    }
  }

  /* Natural Glass Particles - SUBTLE */
  .hero-glass-particle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: radial-gradient(circle,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(255, 255, 255, 0.25) 50%,
      transparent 100%);
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.2);
    animation: particle-float 8s ease-in-out infinite;
  }

  .hero-particle-1 {
    top: 20%;
    left: 15%;
    animation-delay: 0s;
  }

  .hero-particle-2 {
    top: 50%;
    right: 20%;
    width: 10px;
    height: 10px;
    animation-delay: -3s;
  }

  .hero-particle-3 {
    bottom: 35%;
    left: 55%;
    width: 6px;
    height: 6px;
    animation-delay: -6s;
  }

  .hero-particle-4 {
    top: 40%;
    left: 30%;
    width: 7px;
    height: 7px;
    animation-delay: -1s;
  }

  .hero-particle-5 {
    top: 65%;
    right: 40%;
    width: 5px;
    height: 5px;
    animation-delay: -4s;
  }

  .hero-particle-6 {
    top: 30%;
    right: 35%;
    width: 9px;
    height: 9px;
    animation-delay: -2s;
  }

  .hero-particle-7 {
    bottom: 50%;
    left: 25%;
    width: 6px;
    height: 6px;
    animation-delay: -5s;
  }

  .hero-particle-8 {
    bottom: 20%;
    right: 15%;
    width: 8px;
    height: 8px;
    animation-delay: -7s;
  }

  .hero-particle-9 {
    top: 15%;
    left: 45%;
    width: 5px;
    height: 5px;
    animation-delay: -3.5s;
  }

  .hero-particle-10 {
    top: 55%;
    left: 70%;
    width: 7px;
    height: 7px;
    animation-delay: -4.5s;
  }

  .hero-particle-11 {
    bottom: 40%;
    right: 30%;
    width: 6px;
    height: 6px;
    animation-delay: -2.5s;
  }

  .hero-particle-12 {
    top: 75%;
    left: 40%;
    width: 8px;
    height: 8px;
    animation-delay: -5.5s;
  }

  @keyframes particle-float {
    0%, 100% {
      transform: translate(0, 0) scale(1);
      opacity: 0.7;
    }
    25% {
      transform: translate(10px, -20px) scale(1.3);
      opacity: 1;
    }
    50% {
      transform: translate(-5px, -30px) scale(0.9);
      opacity: 0.5;
    }
    75% {
      transform: translate(15px, -10px) scale(1.1);
      opacity: 0.8;
    }
  }

  .loading-card {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-shimmer {
    width: 100%;
    height: 200px;
    background: linear-gradient(90deg, rgba(6, 182, 212, 0.05), rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05));
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .simple-card {
    color: white;
  }

  .simple-card .title,
  .simple-card .period {
    color: white;
  }

  .full-card {
    /* Full mode has blue gradient background */
    color: white;
  }

  .title {
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 8px 0;
    letter-spacing: -0.02em;
  }

  /* White text for cards with blue gradient background */
  .simple-card .title,
  .full-card .title {
    color: white;
    background: none;
    -webkit-text-fill-color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .amount-big {
    font-size: 42px;
    font-weight: 800;
    color: white;
    margin: 24px 0;
  }

  .cta-box {
    margin-top: 24px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .cta-text {
    margin-bottom: 16px;
  }

  .cta-title {
    font-size: 16px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
  }

  .cta-sub {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }

  .cta-btn {
    width: 100%;
    padding: 12px 20px;
    background: white;
    color: #0891B2;
    font-weight: 700;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }

  .metric-box {
    padding: 20px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .metric-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .metric-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }

  .metric-value {
    font-size: 24px;
    font-weight: 800;
    color: white;
    line-height: 1.1;
    margin-bottom: 8px;
  }

  .metric-sub {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .hero-header {
    margin-bottom: 24px;
  }

  /* ===== NEW VELOCITY SECTION - CONCEPT A ===== */
  .velocity-section-new {
    margin-bottom: 24px;
  }

  .velocity-header-new {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .velocity-title-new {
    font-size: 16px;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .velocity-status-badge-new {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .velocity-status-badge-new.on-track,
  .velocity-status-badge-new.slow {
    background: rgba(255, 255, 255, 0.25);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.35);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    box-shadow: 0 2px 6px rgba(255, 255, 255, 0.1);
  }

  .velocity-status-badge-new.too-fast {
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border: 1px solid rgba(220, 38, 38, 0.4);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    animation: pulse-danger 2s ease-in-out infinite;
  }

  @keyframes pulse-danger {
    0%, 100% {
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
    }
    50% {
      box-shadow: 0 2px 12px rgba(239, 68, 68, 0.35);
    }
  }

  /* BIG Progress Bar - FOCAL POINT */
  .big-progress-track {
    position: relative;
    height: 64px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.25);
  }

  /* Time fill (background layer) */
  .big-progress-time {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.25) 100%);
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 16px;
  }

  /* Spending fill (foreground layer) - Monotone white dengan opacity 80% */
  .big-progress-spending {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 16px;
    z-index: 2;
    animation: fill-slide 1.2s ease-out;
    /* Monotone white dengan opacity 80% */
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  @keyframes fill-slide {
    0% {
      width: 0 !important;
      opacity: 0.6;
    }
    100% {
      opacity: 1;
    }
  }

  /* Status classes tidak mengubah warna bar, hanya untuk consistency */
  .big-progress-spending.on-track,
  .big-progress-spending.slow,
  .big-progress-spending.too-fast {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Inline indicators */
  .big-progress-indicators {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    pointer-events: none;
    z-index: 3;
  }

  .big-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
    color: #0891B2;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .big-indicator-emoji {
    font-size: 20px;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
  }

  .big-indicator-value {
    font-size: 18px;
    font-weight: 800;
    color: #0369a1;
  }

  /* Clean Legend - No Boxes */
  .clean-legend {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
  }

  .legend-emoji {
    font-size: 18px;
    flex-shrink: 0;
  }

  .legend-text {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.5;
  }

  .legend-text strong {
    font-weight: 700;
    color: white;
  }

  /* Daily Insights Section */
  .daily-insights-section {
    padding: 20px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .insights-title {
    font-size: 14px;
    font-weight: 700;
    color: white;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .insights-icon {
    font-size: 16px;
  }

  .insights-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .insight-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;
  }

  .insight-box:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateX(2px);
  }

  .insight-highlight {
    grid-column: 1 / -1;
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .insight-highlight:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .insight-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .insight-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .insight-label {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
  }

  .insight-value {
    font-size: 13px;
    font-weight: 700;
    color: white;
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .hero-card {
      padding: 24px;
      min-height: 280px;
    }

    .title {
      font-size: 20px;
    }

    .metrics {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }

    .metric-box {
      padding: 16px 14px;
    }

    .metric-label {
      font-size: 11px;
      margin-bottom: 6px;
    }

    .metric-value {
      font-size: 20px;
      margin-bottom: 6px;
    }

    .metric-sub {
      font-size: 11px;
    }

    .amount-big {
      font-size: 36px;
      margin: 20px 0;
    }

    .velocity-section-new {
      margin-bottom: 20px;
    }

    .velocity-header-new {
      margin-bottom: 16px;
      gap: 10px;
    }

    .velocity-title-new {
      font-size: 14px;
    }

    .velocity-status-badge-new {
      padding: 6px 14px;
      font-size: 11px;
    }

    .big-progress-track {
      height: 56px;
      margin-bottom: 16px;
    }

    .big-indicator {
      font-size: 13px;
    }

    .big-indicator-emoji {
      font-size: 18px;
    }

    .big-indicator-value {
      font-size: 16px;
    }

    .clean-legend {
      gap: 8px;
    }

    .legend-emoji {
      font-size: 16px;
    }

    .legend-text {
      font-size: 12px;
    }

    .daily-insights-section {
      padding: 16px;
    }

    .insights-title {
      font-size: 13px;
      margin-bottom: 12px;
    }

    .insights-icon {
      font-size: 15px;
    }

    .insights-grid {
      gap: 10px;
    }

    .insight-box {
      padding: 10px;
    }

    .insight-icon {
      font-size: 16px;
    }

    .insight-label {
      font-size: 9px;
    }

    .insight-value {
      font-size: 12px;
    }

    .hero-circle-1 {
      width: 100px;
      height: 100px;
      top: -50px;
      right: -50px;
    }

    .hero-circle-2 {
      width: 80px;
      height: 80px;
      bottom: -40px;
      left: -40px;
    }

    .hero-wave {
      height: 60px;
    }
  }

  @media (max-width: 430px) {
    .hero-card {
      padding: 20px;
      min-height: 260px;
    }

    .title {
      font-size: 18px;
    }

    .metrics {
      gap: 8px;
    }

    .metric-box {
      padding: 12px 10px;
    }

    .metric-value {
      font-size: 18px;
    }

    .amount-big {
      font-size: 32px;
    }
  }
</style>
