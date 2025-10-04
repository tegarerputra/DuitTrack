<script lang="ts">
  export let type: string = '';
  export let data: any = {};

  function getWarningIcon(warningType: string): string {
    switch (warningType) {
      case 'exceeded':
        return '⚠️';
      case 'caution':
        return '💡';
      default:
        return '💡';
    }
  }

  function getWarningClass(warningType: string): string {
    switch (warningType) {
      case 'exceeded':
        return 'warning-exceeded';
      case 'caution':
        return 'warning-caution';
      default:
        return 'warning-caution';
    }
  }
</script>

{#if type}
  <div class="smart-warning-container">
    <div class="smart-warning {getWarningClass(type)}">
      <div class="warning-icon">{getWarningIcon(type)}</div>
      <div class="warning-content">
        {#if type === 'exceeded'}
          <h4>Budget Alert!</h4>
          <p><strong>{data.category}</strong> budget akan terlampaui <strong>{data.overage}</strong></p>
          <p class="warning-details">{data.newTotal} dari budget {data.budget} ({data.percentage}%)</p>
        {:else if type === 'caution'}
          <h4>Budget Update</h4>
          <p><strong>{data.category}</strong> akan mencapai {data.percentage}% dari budget</p>
          <p class="warning-details">Sisa budget: <strong>{data.remaining}</strong></p>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .smart-warning-container {
    margin-bottom: 1rem;
    animation: slideDown 0.4s ease;
  }

  .smart-warning {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid;
    position: relative;
    overflow: hidden;
  }

  .smart-warning::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: currentColor;
    opacity: 0.6;
  }

  .warning-exceeded {
    background: rgba(244, 67, 54, 0.1);
    border-color: rgba(244, 67, 54, 0.3);
    color: var(--danger-color);
  }

  .warning-caution {
    background: rgba(255, 152, 0, 0.1);
    border-color: rgba(255, 152, 0, 0.3);
    color: #FF9800;
  }

  .warning-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .warning-content {
    flex: 1;
    min-width: 0;
  }

  .warning-content h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: currentColor;
  }

  .warning-content p {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    line-height: 1.4;
    color: var(--text-primary);
  }

  .warning-content p:last-child {
    margin-bottom: 0;
  }

  .warning-details {
    font-size: 0.85rem !important;
    color: var(--text-secondary) !important;
    margin-top: 0.25rem;
  }

  .warning-content strong {
    font-weight: 600;
    color: currentColor;
  }

  /* Animations */
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .smart-warning {
      padding: 0.875rem;
      gap: 0.625rem;
    }

    .warning-icon {
      font-size: 1.25rem;
    }

    .warning-content h4 {
      font-size: 0.95rem;
    }

    .warning-content p {
      font-size: 0.85rem;
    }

    .warning-details {
      font-size: 0.8rem !important;
    }
  }

  @media (max-width: 480px) {
    .smart-warning {
      padding: 0.75rem;
      gap: 0.5rem;
    }

    .warning-content h4 {
      font-size: 0.9rem;
    }

    .warning-content p {
      font-size: 0.8rem;
    }
  }

  /* Enhanced visual feedback */
  .smart-warning {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .warning-exceeded {
    box-shadow: 0 4px 20px rgba(244, 67, 54, 0.15);
  }

  .warning-caution {
    box-shadow: 0 4px 20px rgba(255, 152, 0, 0.15);
  }

  /* Pulse animation for critical warnings */
  .warning-exceeded {
    animation: slideDown 0.4s ease, pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }

  /* Accessibility improvements */
  .smart-warning {
    role: alert;
    aria-live: polite;
  }

  .warning-exceeded {
    aria-live: assertive;
  }
</style>