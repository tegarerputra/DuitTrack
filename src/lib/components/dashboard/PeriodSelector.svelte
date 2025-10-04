<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let currentPeriodId: string;
  export let userResetDate: number = 1;

  const dispatch = createEventDispatcher();

  let isOpen = false;

  function generateAvailablePeriods() {
    const periods = [];
    const today = new Date();

    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, userResetDate);

      // Calculate period boundaries
      const periodStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), userResetDate);
      const periodEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, userResetDate - 1);

      // Format period ID as YYYY-MM-DD
      const year = periodStart.getFullYear();
      const month = String(periodStart.getMonth() + 1).padStart(2, '0');
      const day = String(userResetDate).padStart(2, '0');
      const periodId = `${year}-${month}-${day}`;

      // Create display name
      const monthName = periodStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const displayName = i === 0 ? `${monthName} (Current)` : monthName;

      periods.push({
        id: periodId,
        displayName,
        isCurrent: i === 0,
        start: periodStart,
        end: periodEnd
      });
    }

    return periods;
  }

  function handlePeriodChange(periodId: string) {
    dispatch('periodChange', { periodId });
    isOpen = false;
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function closeDropdown() {
    isOpen = false;
  }

  $: availablePeriods = generateAvailablePeriods();
  $: currentPeriod = availablePeriods.find(p => p.id === currentPeriodId) || availablePeriods[0];
</script>

<div class="relative">
  <!-- Period Selector Button -->
  <button
    class="glass-button flex items-center gap-2 {isOpen ? 'dropdown-open' : ''}"
    on:click={toggleDropdown}
    on:blur={closeDropdown}
  >
    <span class="text-sm">📅</span>
    <span class="text-sm font-medium">
      {currentPeriod?.displayName || 'Select Period'}
    </span>
    <div class="text-xs transform transition-transform duration-200 {isOpen ? 'rotate-180' : ''}">
      ▼
    </div>
  </button>

  <!-- Dropdown Menu -->
  {#if isOpen}
    <div class="absolute top-full right-0 mt-2 w-64 z-50">
      <div class="glass-card p-2 border border-white/20">
        <div class="space-y-1">
          {#each availablePeriods as period}
            <button
              class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200 {period.id === currentPeriodId ? 'bg-white/20' : ''}"
              on:click={() => handlePeriodChange(period.id)}
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-medium text-white">
                    {period.displayName}
                  </div>
                  <div class="text-xs text-gray-300">
                    {period.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} -
                    {period.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {#if period.id === currentPeriodId}
                  <div class="text-primary-400">✓</div>
                {/if}
              </div>
            </button>
          {/each}
        </div>

        <!-- Period Info -->
        <div class="mt-3 pt-3 border-t border-white/10">
          <div class="text-xs text-gray-300">
            <div class="flex items-center gap-2 mb-1">
              <span>🔄</span>
              <span>Reset Date: {userResetDate} setiap bulan</span>
            </div>
            <div class="flex items-center gap-2">
              <span>📊</span>
              <span>Showing {availablePeriods.length} recent periods</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .dropdown-open {
    transform: translateY(-1px);
  }
</style>