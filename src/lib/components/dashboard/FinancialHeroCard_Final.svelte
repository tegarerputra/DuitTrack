<script lang="ts">
  import { formatRupiah } from '$utils/index';
  import { goto } from '$app/navigation';
  import { getDaysRemainingInPeriod, getTotalDaysInPeriod, formatPeriodDisplay } from '$lib/utils/periodHelpers';
  import { calculateSpendingVelocity, calculateBudgetStatus } from '$lib/utils/insightCalculators';

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
  $: periodDisplay = currentPeriod
    ? formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate)
    : currentPeriodId;

  // Velocity calculation
  $: velocity = hasBudget ? calculateSpendingVelocity(totalBudget, totalSpent) : null;
  $: velocityStatus = velocity ? getVelocityStatus(velocity) : null;

  // Budget status for Month section
  $: budgetStatus = hasBudget ? calculateBudgetStatus(totalBudget, totalSpent) : null;

  // Today's spending
  $: todaySpending = expenses.filter(e => {
    try {
      const expDate = new Date(e.date);
      const today = new Date();
      return expDate.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }).reduce((sum, e) => sum + (e.amount || 0), 0);

  $: todayCount = expenses.filter(e => {
    try {
      const expDate = new Date(e.date);
      const today = new Date();
      return expDate.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }).length;

  // Calculate daily spending recommendation - made fully reactive
  $: dailyRecommendation = (() => {
    console.log('💡 Calculating daily recommendation:', {
      hasBudget,
      daysRemaining,
      totalBudget,
      totalSpent,
      currentPeriod: currentPeriod ? {
        start: currentPeriod.startDate,
        end: currentPeriod.endDate
      } : null
    });

    if (!hasBudget || daysRemaining <= 0) {
      console.log('❌ Cannot calculate: hasBudget=', hasBudget, 'daysRemaining=', daysRemaining);
      return 0;
    }

    const remainingBudget = totalBudget - totalSpent;
    if (remainingBudget <= 0) {
      console.log('❌ No remaining budget:', remainingBudget);
      return 0;
    }

    const recommendation = Math.round(remainingBudget / daysRemaining);
    console.log('✅ Daily recommendation:', recommendation);
    return recommendation;
  })();

  function formatShortRupiah(amount: number): string {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    } else if (amount >= 1000) {
      return `Rp ${Math.round(amount / 1000)}k`;
    }
    return formatRupiah(amount);
  }

  function formatCompactRupiah(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}jt`;
    } else if (amount >= 1000) {
      return `${Math.round(amount / 1000)}k`;
    }
    return `${Math.round(amount)}`;
  }

  function getGradient() {
    if (percentage >= 90) return 'linear-gradient(135deg, rgba(239, 68, 68, 0.55), rgba(220, 38, 38, 0.65))';
    if (percentage >= 75) return 'linear-gradient(135deg, rgba(251, 191, 36, 0.55), rgba(245, 158, 11, 0.65))';
    return 'linear-gradient(135deg, rgba(0, 191, 255, 0.55), rgba(30, 144, 255, 0.65))';
  }

  function getVelocityStatus(vel: any) {
    if (vel.status === 'too-fast') {
      const percentageDiff = (vel.spentProgress - vel.timeProgress) * 100;
      return { message: `${percentageDiff.toFixed(1)}% TOO FAST`, icon: '🚨', severity: 'danger' };
    } else if (vel.status === 'slow') {
      return { message: 'ON TRACK (Hemat!)', icon: '🎉', severity: 'success' };
    } else {
      return { message: 'ON TRACK', icon: '✅', severity: 'safe' };
    }
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
    <div class="period">{periodDisplay}</div>
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
    <!-- Enhanced Background Elements -->
    <div class="hero-bg-elements">
      <div class="hero-circle hero-circle-1 animate-liquid-float"></div>
      <div class="hero-circle hero-circle-2 animate-liquid-float"></div>
      <div class="hero-wave animate-liquid-flow"></div>
      <div class="hero-glass-particle hero-particle-1"></div>
      <div class="hero-glass-particle hero-particle-2"></div>
      <div class="hero-glass-particle hero-particle-3"></div>
    </div>

    <div class="hero-header">
      <h2 class="title">💰 Financial Pulse</h2>
      <div class="period">{periodDisplay}</div>
    </div>

    <!-- Metrics Grid -->
    <div class="metrics">
      <div class="metric-box">
        <div class="metric-label">📅 Today</div>
        <div class="metric-value">{formatRupiah(todaySpending)}</div>
        <div class="metric-sub">Aim: {formatShortRupiah(dailyRecommendation)}</div>
      </div>

      <div class="metric-box">
        <div class="metric-label">📊 Month</div>
        <div class="metric-value">{formatRupiah(totalSpent)}</div>
        {#if budgetStatus}
          <div class="metric-sub">{budgetStatus.icon} {budgetStatus.label}</div>
        {:else}
          <div class="metric-sub">{percentage.toFixed(0)}% budget</div>
        {/if}
      </div>
    </div>

    <!-- Spending Velocity Section -->
    {#if velocity}
      <div class="velocity-section">
        <div class="velocity-header">
          <span class="velocity-icon">🎯</span>
          <span class="velocity-title">Spending Velocity</span>
        </div>

        <!-- Dual Progress Bars -->
        <div class="progress-compare">
          <div class="progress-item">
            <div class="progress-item-header">
              <span class="progress-label">Time</span>
              <span class="progress-percent">
                <span class="days-info">{daysPassed}/{totalDays} days</span>
                <span class="percent-value">{timeProgress.toFixed(0)}%</span>
              </span>
            </div>
            <div class="progress-track">
              <div class="progress-fill-time" style="width: {Math.min(100, timeProgress)}%"></div>
            </div>
          </div>

          <div class="progress-item">
            <div class="progress-item-header">
              <span class="progress-label">Spending</span>
              <span class="progress-percent">
                <span class="spending-info">{formatCompactRupiah(totalSpent)}/{formatCompactRupiah(totalBudget)}</span>
                <span class="percent-value">{(velocity.spentProgress * 100).toFixed(0)}%</span>
              </span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill-spending"
                class:too-fast={velocity.status === 'too-fast'}
                class:on-track={velocity.status === 'on-track'}
                class:slow={velocity.status === 'slow'}
                style="width: {Math.min(100, velocity.spentProgress * 100)}%"
              ></div>
            </div>
          </div>
        </div>

        <!-- Velocity Metrics -->
        {#if velocity.dailyBurnRate && velocity.dailyTarget}
          <div class="velocity-metrics">
            <div class="velocity-metric">
              <span class="metric-icon">⚡</span>
              <span class="metric-text">{formatRupiah(velocity.dailyBurnRate)}/day avg (Target: {formatRupiah(velocity.dailyTarget)}/day)</span>
            </div>
            <div class="velocity-metric">
              <span class="metric-icon">📈</span>
              <span class="metric-text">Projected: {formatRupiah(velocity.projectedTotal)} ({((velocity.projectedTotal / totalBudget) * 100).toFixed(0)}% of budget)</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}
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
  }

  .hero-circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .hero-circle-1 {
    width: 140px;
    height: 140px;
    top: -70px;
    right: -70px;
  }

  .hero-circle-2 {
    width: 100px;
    height: 100px;
    bottom: -50px;
    left: -50px;
  }

  .hero-wave {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    border-radius: 50% 50% 0 0;
    backdrop-filter: blur(15px);
  }

  .hero-glass-particle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: radial-gradient(circle,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(6, 182, 212, 0.4) 50%,
      transparent 100%);
    border-radius: 50%;
    animation: particle-float 8s ease-in-out infinite;
  }

  .hero-particle-1 {
    top: 25%;
    left: 20%;
    animation-delay: 0s;
  }

  .hero-particle-2 {
    top: 60%;
    right: 25%;
    animation-delay: -3s;
  }

  .hero-particle-3 {
    bottom: 30%;
    left: 60%;
    animation-delay: -6s;
  }

  @keyframes particle-float {
    0%, 100% {
      transform: translateY(0px) scale(1);
      opacity: 0.6;
    }
    33% {
      transform: translateY(-15px) scale(1.2);
      opacity: 1;
    }
    66% {
      transform: translateY(10px) scale(0.8);
      opacity: 0.4;
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

  .period {
    font-size: 14px;
    margin-bottom: 24px;
  }

  .simple-card .period,
  .full-card .period {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
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
    margin-bottom: 20px;
  }

  .velocity-section {
    padding: 20px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
  }

  .velocity-icon { font-size: 18px; }
  .velocity-title { font-size: 14px; font-weight: 700; color: white; }

  .progress-compare {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .progress-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .progress-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .progress-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.7);
  }

  .progress-percent {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: white;
  }

  .days-info {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.15);
    padding: 2px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .spending-info {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.15);
    padding: 2px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .percent-value {
    font-size: 12px;
    font-weight: 700;
    color: white;
  }

  .progress-track {
    height: 8px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill-time {
    height: 100%;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
    transition: width 0.8s ease;
  }

  .progress-fill-spending {
    height: 100%;
    transition: width 0.8s ease, background 0.3s ease;
  }

  .progress-fill-spending.on-track {
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.8));
  }

  .progress-fill-spending.slow {
    background: linear-gradient(90deg, rgba(6, 182, 212, 0.9), rgba(8, 145, 178, 0.8));
  }

  .progress-fill-spending.too-fast {
    background: linear-gradient(90deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.8));
  }

  .velocity-metrics {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .velocity-metric {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.9);
  }

  .velocity-metric .metric-icon {
    font-size: 14px;
  }

  .velocity-metric .metric-text {
    font-weight: 600;
    line-height: 1.4;
  }

  .velocity-box {
    padding: 20px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(240, 248, 255, 0.5));
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.04);
  }

  .velocity-header {
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 12px;
  }

  .status {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 700;
    text-align: center;
  }

  .status.safe {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1));
    color: #059669;
  }

  .status.warning {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1));
    color: #D97706;
  }

  .status.danger {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1));
    color: #DC2626;
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

    .period {
      font-size: 13px;
      margin-bottom: 20px;
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

    .velocity-section {
      padding: 16px;
    }

    .velocity-title {
      font-size: 13px;
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

    .period {
      font-size: 12px;
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
