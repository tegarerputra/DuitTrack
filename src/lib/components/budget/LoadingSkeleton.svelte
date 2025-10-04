<script lang="ts">
  // Loading skeleton component for budget page
</script>

<div class="budget-loading-state">
  <!-- Overview Skeleton -->
  <div class="overview-skeleton glass-card">
    <div class="skeleton-grid">
      <div class="skeleton-stat">
        <div class="skeleton-label"></div>
        <div class="skeleton-value large"></div>
      </div>
      <div class="skeleton-stat">
        <div class="skeleton-label"></div>
        <div class="skeleton-value"></div>
      </div>
      <div class="skeleton-stat">
        <div class="skeleton-label"></div>
        <div class="skeleton-value"></div>
      </div>
      <div class="skeleton-stat">
        <div class="skeleton-label"></div>
        <div class="skeleton-value small"></div>
      </div>
    </div>
  </div>

  <!-- Categories Skeleton -->
  <div class="categories-skeleton">
    <div class="skeleton-header">
      <div class="skeleton-title"></div>
      <div class="skeleton-button"></div>
    </div>

    <div class="skeleton-categories">
      {#each Array(4) as _, i}
        <div class="category-skeleton glass-card">
          <div class="category-info-skeleton">
            <div class="category-icon-skeleton"></div>
            <div class="category-details-skeleton">
              <div class="category-name-skeleton"></div>
              <div class="category-progress-skeleton">
                <div class="progress-bar-skeleton"></div>
                <div class="progress-text-skeleton"></div>
              </div>
              <div class="progress-details-skeleton">
                <div class="detail-skeleton"></div>
                <div class="detail-skeleton"></div>
              </div>
            </div>
          </div>
          <div class="budget-input-skeleton">
            <div class="input-skeleton"></div>
          </div>
          <div class="action-skeleton"></div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .budget-loading-state {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .overview-skeleton {
    padding: 1.5rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .skeleton-stat {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .skeleton-label {
    height: 1rem;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    width: 60%;
  }

  .skeleton-value {
    height: 1.5rem;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }

  .skeleton-value.large {
    height: 2rem;
    width: 80%;
  }

  .skeleton-value.small {
    width: 40%;
  }

  .categories-skeleton {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .skeleton-title {
    height: 1.5rem;
    width: 200px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }

  .skeleton-button {
    height: 2.5rem;
    width: 120px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
  }

  .skeleton-categories {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .category-skeleton {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .category-info-skeleton {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .category-icon-skeleton {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 12px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    flex-shrink: 0;
  }

  .category-details-skeleton {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-name-skeleton {
    height: 1.2rem;
    width: 120px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  .category-progress-skeleton {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .progress-bar-skeleton {
    flex: 1;
    height: 8px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  .progress-text-skeleton {
    width: 40px;
    height: 1rem;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  .progress-details-skeleton {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .detail-skeleton {
    height: 0.8rem;
    width: 80px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  .budget-input-skeleton {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .input-skeleton {
    width: 120px;
    height: 2.5rem;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }

  .action-skeleton {
    width: 2rem;
    height: 2rem;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .budget-loading-state {
      padding: 0.75rem;
      gap: 1rem;
    }

    .overview-skeleton {
      padding: 1rem;
    }

    .skeleton-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .category-skeleton {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
      padding: 1rem;
    }

    .category-info-skeleton {
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .budget-input-skeleton {
      align-items: center;
    }

    .skeleton-header {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }
  }

  /* Glass morphism */
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  /* Staggered animation for better visual effect */
  .category-skeleton:nth-child(1) { animation-delay: 0s; }
  .category-skeleton:nth-child(2) { animation-delay: 0.2s; }
  .category-skeleton:nth-child(3) { animation-delay: 0.4s; }
  .category-skeleton:nth-child(4) { animation-delay: 0.6s; }

  .category-skeleton {
    opacity: 0;
    animation: fadeIn 0.5s ease forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
</style>