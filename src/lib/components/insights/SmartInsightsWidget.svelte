<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { generateInsights } from '$lib/utils/insightGenerator';
  import type { Insight, InsightContext } from '$lib/types/insights.types';
  import MiniInsightCard from './MiniInsightCard.svelte';
  import { fly } from 'svelte/transition';

  // Props - receive data directly from dashboard
  export let currentPeriodId: string;
  export let budgetData: any = null;
  export let expenses: any[] = [];

  let insights: Insight[] = [];
  let topInsight: Insight | null = null;
  let miniInsights: Insight[] = [];
  let loading = true;

  // Reactive generation of insights whenever data changes
  $: if (budgetData && expenses && currentPeriodId) {
    generateSmartInsights();
  }

  function generateSmartInsights() {
    try {
      loading = true;

      // Build context from passed props
      const context: InsightContext = {
        totalBudget: budgetData?.totalBudget || 0,
        totalSpent: budgetData?.totalSpent || 0,
        categories: budgetData?.categories || {},
        expenses: expenses.map(e => ({
          id: e.id,
          amount: e.amount,
          category: e.category,
          date: e.date instanceof Date ? e.date : new Date(e.date)
        })),
        currentPeriod: currentPeriodId,
        previousPeriod: undefined
      };

      // Generate insights
      insights = generateInsights(context);

      // Split: top insight + 2 mini insights
      topInsight = insights[0] || null;
      miniInsights = insights.slice(1, 3);

      loading = false;
    } catch (error) {
      console.error('Error generating insights:', error);
      loading = false;
    }
  }

  onMount(() => {
    generateSmartInsights();
  });
</script>

<div class="smart-insights-widget" in:fly={{ y: 20, duration: 400, delay: 100 }}>
  <!-- Header -->
  <div class="insights-header">
    <div class="header-content">
      <span class="header-icon">💡</span>
      <h3 class="header-title">Smart Insights</h3>
    </div>
    <div class="header-badge">
      {#if loading}
        <span class="badge-loading">...</span>
      {:else}
        <span class="badge-count">{insights.length}</span>
      {/if}
    </div>
  </div>

  <!-- Content -->
  {#if loading}
    <!-- Loading State -->
    <div class="insights-loading">
      <div class="loading-hero"></div>
      <div class="loading-mini-grid">
        <div class="loading-mini"></div>
        <div class="loading-mini"></div>
      </div>
    </div>
  {:else}
    <!-- Top Insight (Main Card) -->
    <div
      class="top-insight-card"
      class:danger={topInsight.type === 'danger'}
      class:warning={topInsight.type === 'warning'}
      class:success={topInsight.type === 'success'}
    >
      <div class="top-insight-header">
        <span class="checkmark-icon">✅</span>
        <span class="top-label">TOP INSIGHT:</span>
      </div>
      <div class="top-insight-message">
        {topInsight.message} {topInsight.icon}
      </div>
      {#if topInsight.actionText && topInsight.actionLink}
        <button class="insight-action-btn" on:click={() => goto(topInsight.actionLink)}>
          {topInsight.actionText} →
        </button>
      {/if}
    </div>

    <!-- Mini Insights Grid (if available) -->
    {#if miniInsights.length > 0}
      <div class="mini-insights-grid">
        {#each miniInsights as insight (insight.id)}
          <MiniInsightCard {insight} />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .smart-insights-widget {
    position: relative;
    padding: 24px;
    border-radius: 16px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.6) 0%,
      rgba(240, 248, 255, 0.5) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    margin-bottom: 24px;
  }

  /* Header */
  .insights-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-icon {
    font-size: 24px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .header-title {
    font-size: 20px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #1f2937 0%, #0891B2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-badge {
    padding: 4px 12px;
    background: rgba(6, 182, 212, 0.1);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    color: #0891B2;
  }

  .badge-loading {
    animation: pulse 1.5s ease-in-out infinite;
  }

  .badge-count {
    font-variant-numeric: tabular-nums;
  }

  /* Loading State */
  .insights-loading {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .loading-hero {
    height: 140px;
    background: linear-gradient(90deg,
      rgba(6, 182, 212, 0.05) 0%,
      rgba(6, 182, 212, 0.1) 50%,
      rgba(6, 182, 212, 0.05) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
  }

  .loading-mini-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .loading-mini {
    height: 100px;
    background: linear-gradient(90deg,
      rgba(6, 182, 212, 0.05) 0%,
      rgba(6, 182, 212, 0.1) 50%,
      rgba(6, 182, 212, 0.05) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Empty State */
  .insights-empty {
    text-align: center;
    padding: 40px 20px;
  }

  .empty-icon {
    font-size: 56px;
    margin-bottom: 16px;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .empty-title {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .empty-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  /* Top Insight Card - Hero Style */
  .top-insight-card {
    padding: 20px;
    background: linear-gradient(135deg,
      rgba(16, 185, 129, 0.1) 0%,
      rgba(5, 150, 105, 0.05) 100%);
    backdrop-filter: blur(15px);
    border-radius: 12px;
    border: 2px solid rgba(16, 185, 129, 0.3);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
    margin-bottom: 16px;
    transition: all 0.3s ease;
  }

  .top-insight-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.12);
  }

  .top-insight-card.danger {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
    border-color: rgba(239, 68, 68, 0.3);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
  }

  .top-insight-card.danger:hover {
    box-shadow: 0 8px 20px rgba(239, 68, 68, 0.12);
  }

  .top-insight-card.warning {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05));
    border-color: rgba(251, 191, 36, 0.3);
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.08);
  }

  .top-insight-card.warning:hover {
    box-shadow: 0 8px 20px rgba(251, 191, 36, 0.12);
  }

  .top-insight-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .checkmark-icon {
    font-size: 18px;
  }

  .top-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #6b7280;
  }

  .top-insight-message {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .insight-action-btn {
    width: 100%;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(0, 191, 255, 0.55) 0%, rgba(30, 144, 255, 0.65) 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    color: white;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.12);
  }

  .insight-action-btn:hover {
    background: linear-gradient(135deg, rgba(0, 191, 255, 0.7) 0%, rgba(30, 144, 255, 0.8) 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 191, 255, 0.18);
  }

  /* Mini Insights Grid */
  .mini-insights-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .smart-insights-widget {
      padding: 20px 16px;
    }

    .header-title {
      font-size: 18px;
    }

    .header-icon {
      font-size: 20px;
    }

    .mini-insights-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }
  }

  /* Tablet */
  @media (min-width: 641px) and (max-width: 1023px) {
    .mini-insights-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
