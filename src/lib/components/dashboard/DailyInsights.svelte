<script lang="ts">
  import { formatRupiah } from '$utils/index';

  export let velocity: any = null;
  export let totalBudget: number = 0;
  export let totalSpent: number = 0;
  export let daysRemaining: number = 0;
  export let loading: boolean = false;

  // Calculate insights
  $: dailyAvg = velocity?.dailyBurnRate || 0;
  $: dailyTarget = velocity?.dailyTarget || 0;
  $: projected = velocity?.projectedTotal || 0;
  $: remainingBudget = Math.max(0, totalBudget - totalSpent);
  $: dailyAllowance = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

  // Calculate savings or overspend
  $: projectedSavings = totalBudget - projected;
  $: isSaving = projectedSavings > 0;
  $: savingsPercentage = totalBudget > 0 ? (Math.abs(projectedSavings) / totalBudget) * 100 : 0;

  function formatCompactRupiah(amount: number): string {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    } else if (amount >= 1000) {
      return `Rp ${Math.round(amount / 1000)}k`;
    }
    return formatRupiah(amount);
  }
</script>

{#if !loading && velocity}
  <div class="daily-insights-card">
    <!-- Enhanced Background Elements (matching hero card) -->
    <div class="insights-bg-elements">
      <div class="insights-circle insights-circle-1"></div>
      <div class="insights-circle insights-circle-2"></div>
      <div class="insights-wave"></div>
    </div>

    <div class="insights-header">
      <h3 class="insights-title">
        <span class="insights-icon">💰</span>
        Daily Insights
      </h3>
    </div>

    <div class="insights-content">
      <!-- Daily Stats (Side by Side) -->
      <div class="insights-grid">
        <!-- Daily Average -->
        <div class="insight-item">
          <span class="insight-icon">📊</span>
          <div class="insight-info">
            <span class="insight-label">Rata-rata:</span>
            <span class="insight-value">{formatCompactRupiah(dailyAvg)}/hari</span>
          </div>
        </div>

        <!-- Daily Allowance -->
        <div class="insight-item">
          <span class="insight-icon">🎯</span>
          <div class="insight-info">
            <span class="insight-label">Sisa budget bisa dipakai:</span>
            <span class="insight-value">{formatCompactRupiah(dailyAllowance)}/hari</span>
          </div>
        </div>
      </div>

      <!-- Projection (Full Width) -->
      <div class="insight-item insight-highlight">
        <span class="insight-icon">{isSaving ? '✨' : '⚠️'}</span>
        <div class="insight-info">
          <span class="insight-label">Estimasi akhir bulan:</span>
          <span class="insight-value" class:saving={isSaving} class:overspend={!isSaving}>
            {#if isSaving}
              Hemat {formatCompactRupiah(projectedSavings)}! 🎉
            {:else}
              Over {formatCompactRupiah(Math.abs(projectedSavings))} 😰
            {/if}
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .daily-insights-card {
    position: relative;
    border-radius: 12px;
    padding: 20px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .daily-insights-card:hover {
    transform: translateY(-4px);
    box-shadow:
      0 20px 40px rgba(0, 191, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 191, 255, 0.2);
  }

  /* Background Elements (matching hero card) */
  .insights-bg-elements {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 0;
  }

  .insights-circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.08) 0%,
      rgba(0, 191, 255, 0.02) 100%);
    backdrop-filter: blur(10px);
  }

  .insights-circle-1 {
    width: 100px;
    height: 100px;
    top: -50px;
    right: -30px;
  }

  .insights-circle-2 {
    width: 80px;
    height: 80px;
    bottom: -40px;
    left: -30px;
  }

  .insights-wave {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.05) 0%,
      rgba(0, 191, 255, 0.02) 100%);
    border-radius: 50% 50% 0 0;
  }

  /* Header */
  .insights-header {
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
  }

  .insights-title {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .insights-icon {
    font-size: 18px;
  }

  /* Content */
  .insights-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    z-index: 1;
  }

  /* Grid for side-by-side items */
  .insights-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .insight-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 10px;
    border: 1px solid rgba(0, 191, 255, 0.1);
    transition: all 0.2s ease;
  }

  .insight-item:hover {
    background: rgba(255, 255, 255, 0.6);
    border-color: rgba(0, 191, 255, 0.2);
    transform: translateX(4px);
  }

  .insight-highlight {
    background: linear-gradient(135deg,
      rgba(16, 185, 129, 0.15) 0%,
      rgba(5, 150, 105, 0.1) 100%);
    border-color: rgba(16, 185, 129, 0.2);
  }

  .insight-highlight:hover {
    background: linear-gradient(135deg,
      rgba(16, 185, 129, 0.2) 0%,
      rgba(5, 150, 105, 0.15) 100%);
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
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
  }

  .insight-value {
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
  }

  .insight-value.saving {
    color: #059669;
  }

  .insight-value.overspend {
    color: #dc2626;
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .daily-insights-card {
      padding: 16px;
    }

    .insights-title {
      font-size: 15px;
    }

    .insights-icon {
      font-size: 16px;
    }

    .insights-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .insight-item {
      padding: 8px 10px;
    }

    .insight-icon {
      font-size: 16px;
    }

    .insight-label {
      font-size: 10px;
    }

    .insight-value {
      font-size: 13px;
    }

    .insights-circle-1 {
      width: 80px;
      height: 80px;
    }

    .insights-circle-2 {
      width: 60px;
      height: 60px;
    }
  }
</style>
