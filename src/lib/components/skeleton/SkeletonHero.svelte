<script lang="ts">
  export let variant: 'dashboard' | 'expense' | 'budget' = 'dashboard';
</script>

<div class="skeleton-hero skeleton-glassmorphism">
  <div class="skeleton-glass-overlay"></div>

  <!-- Skeleton Background Elements -->
  <div class="skeleton-bg-elements">
    <div class="skeleton-circle skeleton-circle-1 skeleton-pulse"></div>
    <div class="skeleton-circle skeleton-circle-2 skeleton-pulse"></div>
    <div class="skeleton-wave skeleton-pulse"></div>
  </div>

  <!-- Skeleton Content -->
  <div class="skeleton-content">
    <!-- Title -->
    <div class="skeleton-title skeleton-shimmer"></div>

    <!-- Amount Section -->
    <div class="skeleton-amount-section">
      <div class="skeleton-label skeleton-shimmer"></div>
      <div class="skeleton-amount-large skeleton-shimmer"></div>
    </div>

    {#if variant === 'expense' || variant === 'dashboard'}
      <!-- Chart Section -->
      <div class="skeleton-chart-container">
        <div class="skeleton-chart-title skeleton-shimmer"></div>
        <div class="skeleton-chart">
          {#each Array(7) as _}
            <div class="skeleton-bar skeleton-shimmer"></div>
          {/each}
        </div>
      </div>
    {/if}

    {#if variant === 'expense'}
      <!-- Insights Section -->
      <div class="skeleton-insights">
        {#each Array(3) as _}
          <div class="skeleton-insight-item skeleton-shimmer"></div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Hero Card Base - Matching Glassmorphism */
  .skeleton-hero {
    position: relative;
    border-radius: 16px;
    padding: 36px;
    overflow: hidden;
    min-height: 320px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.35) 0%,
      rgba(30, 144, 255, 0.45) 50%,
      rgba(0, 123, 255, 0.5) 100%);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow:
      0 8px 25px rgba(0, 191, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    animation: skeleton-fade-in 0.3s ease-out;
  }

  .skeleton-glass-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 40%,
      transparent 60%,
      rgba(6, 182, 212, 0.05) 100%);
    pointer-events: none;
    z-index: 1;
  }

  /* Background Elements */
  .skeleton-bg-elements {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 1;
  }

  .skeleton-circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .skeleton-circle-1 {
    width: 140px; height: 140px;
    top: -70px; right: -70px;
  }

  .skeleton-circle-2 {
    width: 100px; height: 100px;
    bottom: -50px; left: -50px;
  }

  .skeleton-wave {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 80px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.03) 100%);
    border-radius: 50% 50% 0 0;
    backdrop-filter: blur(15px);
  }

  /* Content */
  .skeleton-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .skeleton-title {
    width: 180px;
    height: 28px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.25);
  }

  .skeleton-amount-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-label {
    width: 120px;
    height: 14px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.2);
  }

  .skeleton-amount-large {
    width: 250px;
    height: 40px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.3);
  }

  /* Chart */
  .skeleton-chart-container {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
  }

  .skeleton-chart-title {
    width: 140px;
    height: 16px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.25);
    margin-bottom: 16px;
  }

  .skeleton-chart {
    height: 120px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
  }

  .skeleton-bar {
    flex: 1;
    min-height: 20px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.3);
  }

  .skeleton-bar:nth-child(1) { height: 45%; }
  .skeleton-bar:nth-child(2) { height: 70%; }
  .skeleton-bar:nth-child(3) { height: 55%; }
  .skeleton-bar:nth-child(4) { height: 85%; }
  .skeleton-bar:nth-child(5) { height: 60%; }
  .skeleton-bar:nth-child(6) { height: 75%; }
  .skeleton-bar:nth-child(7) { height: 50%; }

  /* Insights */
  .skeleton-insights {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .skeleton-insight-item {
    height: 20px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.25);
  }

  /* Animations */
  .skeleton-shimmer {
    background: linear-gradient(90deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0.2) 100%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-pulse {
    animation: skeleton-pulse 2s ease-in-out infinite;
  }

  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @keyframes skeleton-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  @keyframes skeleton-fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .skeleton-hero {
      padding: 24px;
      min-height: 280px;
    }

    .skeleton-title {
      width: 140px;
      height: 24px;
    }

    .skeleton-amount-large {
      width: 200px;
      height: 32px;
    }

    .skeleton-chart {
      height: 70px;
    }
  }
</style>
