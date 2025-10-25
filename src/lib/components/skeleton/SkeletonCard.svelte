<script lang="ts">
  export let title: string = '';
  export let variant: 'default' | 'form' | 'filters' = 'default';
  export let rows: number = 3;
</script>

<div class="skeleton-card skeleton-glassmorphism">
  {#if title}
    <div class="skeleton-card-header">
      <div class="skeleton-card-title skeleton-shimmer"></div>
    </div>
  {/if}

  <div class="skeleton-card-content">
    {#if variant === 'filters'}
      <!-- Search Bar -->
      <div class="skeleton-search skeleton-shimmer"></div>

      <!-- Category Chips -->
      <div class="skeleton-chips">
        {#each Array(6) as _}
          <div class="skeleton-chip skeleton-shimmer"></div>
        {/each}
      </div>
    {:else if variant === 'form'}
      <!-- Form Fields -->
      {#each Array(rows) as _}
        <div class="skeleton-form-group">
          <div class="skeleton-form-label skeleton-shimmer"></div>
          <div class="skeleton-form-input skeleton-shimmer"></div>
        </div>
      {/each}
    {:else}
      <!-- Generic Rows -->
      {#each Array(rows) as _, i}
        <div class="skeleton-row skeleton-shimmer" class:short={i % 3 === 0}></div>
      {/each}
    {/if}
  </div>
</div>

<style>
  /* Card Base - Matching Glassmorphism */
  .skeleton-card {
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    padding: 28px;
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    animation: skeleton-fade-in 0.3s ease-out;
    margin-bottom: 1rem;
  }

  .skeleton-card-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(0, 191, 255, 0.1);
  }

  .skeleton-card-title {
    width: 160px;
    height: 24px;
    border-radius: 8px;
    background: rgba(0, 191, 255, 0.15);
  }

  .skeleton-card-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Generic Rows */
  .skeleton-row {
    height: 20px;
    border-radius: 6px;
    background: rgba(0, 191, 255, 0.1);
  }

  .skeleton-row.short {
    width: 70%;
  }

  /* Search Bar */
  .skeleton-search {
    height: 48px;
    border-radius: 12px;
    background: rgba(0, 191, 255, 0.08);
  }

  /* Chips */
  .skeleton-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .skeleton-chip {
    width: 80px;
    height: 36px;
    border-radius: 20px;
    background: rgba(0, 191, 255, 0.1);
  }

  /* Form Elements */
  .skeleton-form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-form-label {
    width: 120px;
    height: 18px;
    border-radius: 6px;
    background: rgba(0, 191, 255, 0.12);
  }

  .skeleton-form-input {
    height: 44px;
    border-radius: 10px;
    background: rgba(0, 191, 255, 0.08);
  }

  /* Animations */
  .skeleton-shimmer {
    background: linear-gradient(90deg,
      rgba(0, 191, 255, 0.08) 0%,
      rgba(0, 191, 255, 0.2) 50%,
      rgba(0, 191, 255, 0.08) 100%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
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
    .skeleton-card {
      padding: 20px;
    }

    .skeleton-chips {
      gap: 6px;
    }

    .skeleton-chip {
      width: 70px;
      height: 32px;
    }
  }
</style>
