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

  // Calculate daily spending recommendation
  $: dailyRecommendation = calculateDailyRecommendation();

  function calculateDailyRecommendation(): number {
    if (!hasBudget || daysRemaining <= 0) return 0;

    const remainingBudget = totalBudget - totalSpent;
    if (remainingBudget <= 0) return 0;

    return Math.round(remainingBudget / daysRemaining);
  }

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
  .hero-card {
    position: relative;
    padding: 32px 28px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(240, 248, 255, 0.5));
    backdrop-filter: blur(30px) saturate(1.8);
    -webkit-backdrop-filter: blur(30px) saturate(1.8);
    border: 2px solid rgba(255, 255, 255, 0.4);
    box-shadow:
      0 8px 25px rgba(0, 191, 255, 0.08),
      0 4px 12px rgba(0, 191, 255, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    min-height: 280px;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    overflow: hidden;
  }

  .hero-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.03) 0%,
      rgba(30, 144, 255, 0.02) 50%,
      rgba(0, 123, 255, 0.025) 100%);
    border-radius: 16px;
    pointer-events: none;
    z-index: 0;
  }

  .hero-card > * {
    position: relative;
    z-index: 1;
  }

  .hero-card:hover {
    transform: translateY(-4px);
    box-shadow:
      0 12px 35px rgba(0, 191, 255, 0.12),
      0 6px 16px rgba(0, 191, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(0, 191, 255, 0.3);
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

  .title {
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, #1f2937 0%, #0891B2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 4px rgba(8, 145, 178, 0.1));
  }

  .period {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 24px;
  }

  .simple-card .period {
    color: rgba(255, 255, 255, 0.7);
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
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(240, 248, 255, 0.6));
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.04);
    transition: all 0.3s ease;
  }

  .metric-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 191, 255, 0.08);
    background: linear-gradient(135deg, rgba(240, 248, 255, 0.7), rgba(248, 252, 255, 0.8));
  }

  .metric-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 8px;
  }

  .metric-value {
    font-size: 24px;
    font-weight: 800;
    color: #0891B2;
    line-height: 1.1;
    margin-bottom: 8px;
  }

  .metric-sub {
    font-size: 12px;
    color: #6b7280;
  }

  .hero-header {
    margin-bottom: 20px;
  }

  .velocity-section {
    padding: 20px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(240, 248, 255, 0.5));
    backdrop-filter: blur(15px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.04);
    margin-bottom: 16px;
  }

  .velocity-icon { font-size: 18px; }
  .velocity-title { font-size: 14px; font-weight: 700; color: #1f2937; }

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
    color: #6b7280;
  }

  .progress-percent {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: #1f2937;
  }

  .days-info {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    background: rgba(6, 182, 212, 0.08);
    padding: 2px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .spending-info {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    background: rgba(6, 182, 212, 0.08);
    padding: 2px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .percent-value {
    font-size: 12px;
    font-weight: 700;
    color: #1f2937;
  }

  .progress-track {
    height: 8px;
    background: rgba(6, 182, 212, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill-time {
    height: 100%;
    background: linear-gradient(90deg, #9ca3af, #6b7280);
    transition: width 0.8s ease;
  }

  .progress-fill-spending {
    height: 100%;
    transition: width 0.8s ease, background 0.3s ease;
  }

  .progress-fill-spending.on-track {
    background: linear-gradient(90deg, #10b981, #059669);
  }

  .progress-fill-spending.slow {
    background: linear-gradient(90deg, #06B6D4, #0891B2);
  }

  .progress-fill-spending.too-fast {
    background: linear-gradient(90deg, #ef4444, #dc2626);
  }

  .velocity-metrics {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(6, 182, 212, 0.1);
  }

  .velocity-metric {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #1f2937;
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
  @media (max-width: 640px) {
    .hero-card {
      padding: 24px 20px;
      min-height: 240px;
    }

    .title {
      font-size: 20px;
    }

    .metrics {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .metric-box {
      padding: 14px 12px;
    }

    .metric-label {
      font-size: 11px;
      margin-bottom: 6px;
    }

    .metric-value {
      font-size: 18px;
      margin-bottom: 6px;
    }

    .metric-sub {
      font-size: 11px;
    }

    .amount-big {
      font-size: 36px;
    }

    .velocity-section {
      padding: 16px;
    }
  }
</style>
