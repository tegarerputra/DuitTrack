<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Insight } from '$lib/types/insights.types';
  import { fly, scale } from 'svelte/transition';

  export let insight: Insight;

  function handleClick() {
    goto(insight.actionLink);
  }
</script>

<div
  class="hero-insight hero-{insight.type}"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
  in:fly={{ y: 20, duration: 400 }}
>
  <div class="hero-glass-overlay"></div>

  <div class="hero-content">
    <div class="hero-icon" in:scale={{ delay: 100, duration: 300 }}>
      {insight.icon}
    </div>

    <div class="hero-text">
      <h4 class="hero-title">{insight.title}</h4>
      <p class="hero-message">{insight.message}</p>
    </div>

    <button class="hero-action" on:click|stopPropagation={handleClick}>
      {insight.actionText} →
    </button>
  </div>
</div>

<style>
  .hero-insight {
    position: relative;
    padding: 28px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 16px;
    overflow: hidden;
    border: 2px solid;
  }

  .hero-insight:hover {
    transform: translateY(-4px) scale(1.01);
  }

  .hero-insight:active {
    transform: translateY(-2px) scale(1.0);
  }

  /* Variant styles */
  .hero-danger {
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.12) 0%,
      rgba(220, 38, 38, 0.08) 100%);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .hero-danger:hover {
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.18) 0%,
      rgba(220, 38, 38, 0.12) 100%);
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 12px 28px rgba(239, 68, 68, 0.15);
  }

  .hero-warning {
    background: linear-gradient(135deg,
      rgba(251, 191, 36, 0.12) 0%,
      rgba(245, 158, 11, 0.08) 100%);
    border-color: rgba(251, 191, 36, 0.3);
  }

  .hero-warning:hover {
    background: linear-gradient(135deg,
      rgba(251, 191, 36, 0.18) 0%,
      rgba(245, 158, 11, 0.12) 100%);
    border-color: rgba(251, 191, 36, 0.5);
    box-shadow: 0 12px 28px rgba(251, 191, 36, 0.15);
  }

  .hero-success {
    background: linear-gradient(135deg,
      rgba(34, 197, 94, 0.12) 0%,
      rgba(22, 163, 74, 0.08) 100%);
    border-color: rgba(34, 197, 94, 0.3);
  }

  .hero-success:hover {
    background: linear-gradient(135deg,
      rgba(34, 197, 94, 0.18) 0%,
      rgba(22, 163, 74, 0.12) 100%);
    border-color: rgba(34, 197, 94, 0.5);
    box-shadow: 0 12px 28px rgba(34, 197, 94, 0.15);
  }

  .hero-info {
    background: linear-gradient(135deg,
      rgba(59, 130, 246, 0.12) 0%,
      rgba(37, 99, 235, 0.08) 100%);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .hero-info:hover {
    background: linear-gradient(135deg,
      rgba(59, 130, 246, 0.18) 0%,
      rgba(37, 99, 235, 0.12) 100%);
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 12px 28px rgba(59, 130, 246, 0.15);
  }

  /* Glass overlay effect */
  .hero-glass-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%,
      rgba(255, 255, 255, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .hero-insight:hover .hero-glass-overlay {
    opacity: 1;
  }

  /* Content layout */
  .hero-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .hero-icon {
    font-size: 56px;
    line-height: 1;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .hero-text {
    flex: 1;
  }

  .hero-title {
    font-size: 20px;
    font-weight: 800;
    margin: 0 0 8px 0;
    color: #1f2937;
    line-height: 1.3;
  }

  .hero-message {
    font-size: 15px;
    line-height: 1.6;
    color: #4b5563;
    margin: 0;
    font-weight: 500;
  }

  .hero-action {
    align-self: flex-start;
    padding: 12px 24px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.55) 0%,
      rgba(30, 144, 255, 0.65) 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    color: white;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.15);
    backdrop-filter: blur(10px);
  }

  .hero-action:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    box-shadow: 0 6px 16px rgba(0, 191, 255, 0.25);
  }

  .hero-action:active {
    transform: translateY(0);
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .hero-insight {
      padding: 20px;
    }

    .hero-icon {
      font-size: 44px;
    }

    .hero-title {
      font-size: 18px;
    }

    .hero-message {
      font-size: 14px;
    }

    .hero-action {
      width: 100%;
      text-align: center;
    }
  }
</style>
