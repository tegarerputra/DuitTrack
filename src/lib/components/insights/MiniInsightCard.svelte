<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Insight } from '$lib/types/insights.types';
  import { scale } from 'svelte/transition';

  export let insight: Insight;

  function handleClick() {
    goto(insight.actionLink);
  }
</script>

<div
  class="mini-card mini-{insight.type}"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
  in:scale={{ delay: 200, duration: 300 }}
>
  <div class="mini-glass-overlay"></div>

  <div class="mini-content">
    <div class="mini-icon">{insight.icon}</div>
    <div class="mini-title">{insight.title}</div>
  </div>
</div>

<style>
  .mini-card {
    position: relative;
    padding: 20px 16px;
    border-radius: 12px;
    cursor: pointer;
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    border: 2px solid;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mini-card:hover {
    transform: translateY(-6px) scale(1.03);
  }

  .mini-card:active {
    transform: translateY(-4px) scale(1.02);
  }

  /* Variant styles */
  .mini-danger {
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.1) 0%,
      rgba(220, 38, 38, 0.06) 100%);
    border-color: rgba(239, 68, 68, 0.25);
  }

  .mini-danger:hover {
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.15) 0%,
      rgba(220, 38, 38, 0.1) 100%);
    border-color: rgba(239, 68, 68, 0.4);
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.12);
  }

  .mini-warning {
    background: linear-gradient(135deg,
      rgba(251, 191, 36, 0.1) 0%,
      rgba(245, 158, 11, 0.06) 100%);
    border-color: rgba(251, 191, 36, 0.25);
  }

  .mini-warning:hover {
    background: linear-gradient(135deg,
      rgba(251, 191, 36, 0.15) 0%,
      rgba(245, 158, 11, 0.1) 100%);
    border-color: rgba(251, 191, 36, 0.4);
    box-shadow: 0 8px 20px rgba(251, 191, 36, 0.12);
  }

  .mini-success {
    background: linear-gradient(135deg,
      rgba(34, 197, 94, 0.1) 0%,
      rgba(22, 163, 74, 0.06) 100%);
    border-color: rgba(34, 197, 94, 0.25);
  }

  .mini-success:hover {
    background: linear-gradient(135deg,
      rgba(34, 197, 94, 0.15) 0%,
      rgba(22, 163, 74, 0.1) 100%);
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 0 8px 20px rgba(34, 197, 94, 0.12);
  }

  .mini-info {
    background: linear-gradient(135deg,
      rgba(59, 130, 246, 0.1) 0%,
      rgba(37, 99, 235, 0.06) 100%);
    border-color: rgba(59, 130, 246, 0.25);
  }

  .mini-info:hover {
    background: linear-gradient(135deg,
      rgba(59, 130, 246, 0.15) 0%,
      rgba(37, 99, 235, 0.1) 100%);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.12);
  }

  /* Glass overlay */
  .mini-glass-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 50%,
      rgba(255, 255, 255, 0.08) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .mini-card:hover .mini-glass-overlay {
    opacity: 1;
  }

  /* Content */
  .mini-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .mini-icon {
    font-size: 36px;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    transition: transform 0.3s ease;
  }

  .mini-card:hover .mini-icon {
    transform: scale(1.15);
  }

  .mini-title {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.4;
    color: #1f2937;
    max-width: 100%;
    word-wrap: break-word;
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .mini-card {
      padding: 16px 12px;
      min-height: 100px;
    }

    .mini-icon {
      font-size: 32px;
    }

    .mini-title {
      font-size: 12px;
    }
  }
</style>
