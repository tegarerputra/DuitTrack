<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { selectedPeriodStore } from '$lib/stores/period';

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

  function handlePeriodChange(event: Event, periodId: string) {
    event.stopPropagation();

    // Save to shared store for cross-page persistence
    selectedPeriodStore.set(periodId);

    // Dispatch event for local handling
    dispatch('periodChange', { periodId });
    isOpen = false;
  }

  // On mount, ensure we have a default period (current period)
  onMount(() => {
    // Get current period from localStorage
    const storedPeriod = $selectedPeriodStore;

    // Generate available periods
    const availablePeriods = generateAvailablePeriods();
    const currentPeriod = availablePeriods.find(p => p.isCurrent);

    // If no stored period or stored period is invalid, default to current period
    const isStoredPeriodValid = storedPeriod && availablePeriods.find(p => p.id === storedPeriod);

    if (!isStoredPeriodValid) {
      const defaultPeriod = currentPeriod?.id || availablePeriods[0]?.id || '';
      console.log('📅 PeriodSelector: Setting default to current period:', defaultPeriod);
      selectedPeriodStore.set(defaultPeriod);
      dispatch('periodChange', { periodId: defaultPeriod });
    } else {
      console.log('📅 PeriodSelector: Using stored period:', storedPeriod);
    }
  });

  function toggleDropdown(event: Event) {
    event.stopPropagation();
    isOpen = !isOpen;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.period-selector-wrapper');
    if (!dropdown) {
      isOpen = false;
    }
  }

  // Handle clicks outside dropdown
  $: if (typeof window !== 'undefined') {
    if (isOpen) {
      window.addEventListener('click', handleClickOutside);
    } else {
      window.removeEventListener('click', handleClickOutside);
    }
  }

  $: availablePeriods = generateAvailablePeriods();
  $: currentPeriod = availablePeriods.find(p => p.id === currentPeriodId) || availablePeriods[0];
</script>

<div class="period-selector-wrapper">
  <!-- Title -->
  <div class="period-title">
    Periode Tracking
  </div>

  <!-- Period Selector Button -->
  <div class="relative">
    <button
      type="button"
      class="period-button {isOpen ? 'dropdown-open' : ''}"
      on:click={toggleDropdown}
    >
      <span class="period-emoji">📅</span>
      <span class="period-name">
        {currentPeriod?.displayName || 'Select Period'}
      </span>
      <div class="period-arrow {isOpen ? 'rotate-180' : ''}">
        ▼
      </div>
    </button>

    <!-- Dropdown Menu -->
    {#if isOpen}
      <div class="dropdown-menu">
        <div class="dropdown-card">
          <div class="dropdown-list">
            {#each availablePeriods as period}
              <button
                type="button"
                class="dropdown-item {period.id === currentPeriodId ? 'active' : ''}"
                on:click={(e) => handlePeriodChange(e, period.id)}
              >
                <div class="dropdown-item-content">
                  <div>
                    <div class="dropdown-item-name">
                      {period.displayName}
                    </div>
                    <div class="dropdown-item-date">
                      {period.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} -
                      {period.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  {#if period.id === currentPeriodId}
                    <div class="dropdown-checkmark">✓</div>
                  {/if}
                </div>
              </button>
            {/each}
          </div>

          <!-- Period Info -->
          <div class="dropdown-info">
            <div class="dropdown-info-text">
              <div class="dropdown-info-item">
                <span>🔄</span>
                <span>Reset Date: {userResetDate} setiap bulan</span>
              </div>
              <div class="dropdown-info-item">
                <span>📊</span>
                <span>Showing {availablePeriods.length} recent periods</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Period Selector Wrapper */
  .period-selector-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 280px;
  }

  /* Title */
  .period-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
  }

  /* Period Button */
  .period-button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(6, 182, 212, 0.02));
    border: 1px solid rgba(6, 182, 212, 0.15);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    font-family: inherit;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .period-button:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05));
    border-color: rgba(6, 182, 212, 0.25);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.1);
  }

  .period-button.dropdown-open {
    transform: translateY(-1px);
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.06));
    border-color: rgba(6, 182, 212, 0.3);
  }

  .period-emoji {
    font-size: 18px;
    flex-shrink: 0;
  }

  .period-name {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #0891B2;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .period-arrow {
    font-size: 10px;
    color: #6b7280;
    transition: transform 0.3s ease;
    flex-shrink: 0;
  }

  .period-arrow.rotate-180 {
    transform: rotate(180deg);
  }

  /* Dropdown Menu */
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 9999;
    animation: dropdownFadeIn 0.2s ease-out;
  }

  @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-card {
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(248, 252, 255, 0.95) 100%);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 12px;
    padding: 8px;
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.1),
      0 4px 10px rgba(6, 182, 212, 0.05);
  }

  /* Dropdown List */
  .dropdown-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 280px;
    overflow-y: auto;
  }

  /* Dropdown Item */
  .dropdown-item {
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    text-align: left;
  }

  .dropdown-item:hover {
    background: rgba(6, 182, 212, 0.08);
  }

  .dropdown-item.active {
    background: rgba(6, 182, 212, 0.15);
  }

  .dropdown-item-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .dropdown-item-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 2px;
  }

  .dropdown-item-date {
    font-size: 12px;
    color: #6b7280;
  }

  .dropdown-checkmark {
    font-size: 16px;
    color: #0891B2;
    flex-shrink: 0;
  }

  /* Dropdown Info */
  .dropdown-info {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(6, 182, 212, 0.15);
  }

  .dropdown-info-text {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .dropdown-info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #6b7280;
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .period-selector-wrapper {
      max-width: 100%;
    }

    .period-button {
      padding: 8px 12px;
    }

    .period-emoji {
      font-size: 16px;
    }

    .period-name {
      font-size: 13px;
    }

    .dropdown-menu {
      left: 0;
      right: 0;
      width: 100%;
    }

    .dropdown-list {
      max-height: 240px;
    }

    .dropdown-item {
      padding: 8px 10px;
    }

    .dropdown-item-name {
      font-size: 13px;
    }

    .dropdown-item-date {
      font-size: 11px;
    }
  }

  /* Utility Classes */
  .relative {
    position: relative;
  }
</style>