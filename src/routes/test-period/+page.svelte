<script lang="ts">
  import {
    generatePeriods,
    formatPeriodDisplay,
    formatPeriodRange,
    getCurrentPeriod,
    getDaysRemainingInPeriod,
    getTotalDaysInPeriod,
    type PeriodGeneratorConfig
  } from '$lib/utils/periodHelpers';

  // Test configurations
  let configs: Array<PeriodGeneratorConfig & { name: string }> = [
    { name: 'Reset tanggal 1', resetDate: 1, resetType: 'fixed' },
    { name: 'Reset tanggal 5', resetDate: 5, resetType: 'fixed' },
    { name: 'Reset tanggal 15', resetDate: 15, resetType: 'fixed' },
    { name: 'Reset tanggal 25', resetDate: 25, resetType: 'fixed' },
    { name: 'Reset tanggal 31', resetDate: 31, resetType: 'fixed' },
    { name: 'Reset akhir bulan', resetDate: -1, resetType: 'last-day-of-month' }
  ];

  let selectedConfigIndex = 3; // Default: tanggal 25
  let periodCount = 6;

  $: selectedConfig = configs[selectedConfigIndex];
  $: periods = generatePeriods({
    resetDate: selectedConfig.resetDate,
    resetType: selectedConfig.resetType
  }, periodCount);
  $: currentPeriod = getCurrentPeriod({
    resetDate: selectedConfig.resetDate,
    resetType: selectedConfig.resetType
  });
  $: daysRemaining = currentPeriod ? getDaysRemainingInPeriod(currentPeriod) : 0;
  $: totalDays = currentPeriod ? getTotalDaysInPeriod(currentPeriod) : 0;

  // Dummy data untuk testing
  const dummyExpenses = [
    { amount: 150000, category: 'Makanan', description: 'Lunch', date: new Date() },
    { amount: 50000, category: 'Transportasi', description: 'Grab', date: new Date() },
    { amount: 200000, category: 'Belanja', description: 'Groceries', date: new Date() },
    { amount: 100000, category: 'Hiburan', description: 'Netflix', date: new Date() }
  ];

  $: totalSpent = dummyExpenses.reduce((sum, e) => sum + e.amount, 0);

  function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Period Generation Test - DuitTrack</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="glass-card p-6 mb-6">
      <h1 class="text-3xl font-bold text-white mb-2">
        🧪 Period Generation Test
      </h1>
      <p class="text-gray-300">
        Test flexible budget periods dengan berbagai reset date configurations
      </p>
    </div>

    <!-- Controls -->
    <div class="glass-card p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Config Selection -->
        <div>
          <label class="block text-white font-semibold mb-2">
            Reset Date Configuration:
          </label>
          <select
            bind:value={selectedConfigIndex}
            class="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white"
          >
            {#each configs as config, i}
              <option value={i}>{config.name}</option>
            {/each}
          </select>
        </div>

        <!-- Period Count -->
        <div>
          <label class="block text-white font-semibold mb-2">
            Number of Periods:
          </label>
          <input
            type="number"
            min="1"
            max="24"
            bind:value={periodCount}
            class="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white"
          />
        </div>
      </div>

      <!-- Current Config Info -->
      <div class="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
        <div class="text-white text-sm space-y-1">
          <div><strong>Reset Date:</strong> {selectedConfig.resetDate === -1 ? 'Last day of month' : selectedConfig.resetDate}</div>
          <div><strong>Reset Type:</strong> {selectedConfig.resetType}</div>
          <div><strong>Current Period:</strong> {currentPeriod ? formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate) : 'N/A'}</div>
          <div><strong>Days Remaining:</strong> {daysRemaining} days</div>
          <div><strong>Total Days in Period:</strong> {totalDays} days</div>
        </div>
      </div>
    </div>

    <!-- Current Period Summary (Dummy Data) -->
    <div class="glass-card p-6 mb-6">
      <h2 class="text-xl font-bold text-white mb-4">📊 Current Period Summary (Dummy Data)</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="stat-card">
          <div class="text-gray-400 text-sm mb-1">Total Spent</div>
          <div class="text-white text-2xl font-bold">{formatRupiah(totalSpent)}</div>
          <div class="text-green-400 text-xs mt-1">↑ Budget tracking active</div>
        </div>

        <div class="stat-card">
          <div class="text-gray-400 text-sm mb-1">Days Remaining</div>
          <div class="text-white text-2xl font-bold">{daysRemaining}</div>
          <div class="text-gray-400 text-xs mt-1">out of {totalDays} days</div>
        </div>

        <div class="stat-card">
          <div class="text-gray-400 text-sm mb-1">Transactions</div>
          <div class="text-white text-2xl font-bold">{dummyExpenses.length}</div>
          <div class="text-gray-400 text-xs mt-1">this period</div>
        </div>
      </div>

      <!-- Dummy Transactions -->
      <div class="space-y-2">
        <h3 class="text-white font-semibold mb-2">Recent Transactions:</h3>
        {#each dummyExpenses as expense}
          <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <div>
              <div class="text-white font-medium">{expense.description}</div>
              <div class="text-gray-400 text-sm">{expense.category}</div>
            </div>
            <div class="text-white font-semibold">{formatRupiah(expense.amount)}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Generated Periods -->
    <div class="glass-card p-6">
      <h2 class="text-xl font-bold text-white mb-4">📅 Generated Periods</h2>

      <div class="space-y-3">
        {#each periods as period, i}
          <div class="period-item {period.isActive ? 'active' : ''}">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-gray-400 text-xs">Period #{i + 1}</span>
                  {#if period.isActive}
                    <span class="badge-current">CURRENT</span>
                  {/if}
                </div>
                <div class="text-white font-semibold text-lg">
                  {formatPeriodDisplay(period.startDate, period.endDate)}
                </div>
                <div class="text-gray-400 text-sm mt-1">
                  {formatPeriodRange(period.startDate, period.endDate)}
                </div>
              </div>

              <div class="text-right">
                <div class="text-white text-sm">
                  {getTotalDaysInPeriod(period)} days
                </div>
                <div class="text-gray-400 text-xs">ID: {period.id}</div>
              </div>
            </div>

            <!-- Period Details -->
            <div class="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span class="text-gray-400">Start:</span>
                <span class="text-white ml-2">{period.startDate.toLocaleDateString('id-ID')}</span>
              </div>
              <div>
                <span class="text-gray-400">End:</span>
                <span class="text-white ml-2">{period.endDate.toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Edge Cases Test -->
    <div class="glass-card p-6 mt-6">
      <h2 class="text-xl font-bold text-white mb-4">🧪 Edge Cases Test</h2>

      <div class="space-y-4">
        <!-- February Test (Reset date 31) -->
        <div class="edge-case-card">
          <h3 class="text-white font-semibold mb-2">Test 1: Reset Date 31 in February</h3>
          <div class="text-gray-300 text-sm mb-2">
            Should adjust to last day of February (28 or 29)
          </div>
          <div class="result-box">
            {#each generatePeriods({ resetDate: 31, resetType: 'fixed' }, 3).filter((p, i) => {
              const month = p.startDate.getMonth();
              return month === 1 || month === 2; // Feb or March
            }) as period}
              <div class="text-white text-sm">
                {formatPeriodDisplay(period.startDate, period.endDate)}
                <span class="text-gray-400 ml-2">
                  ({period.startDate.getMonth() === 1 ? 'February' : 'March'})
                </span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Last Day of Month Test -->
        <div class="edge-case-card">
          <h3 class="text-white font-semibold mb-2">Test 2: Last Day of Month (Different Lengths)</h3>
          <div class="text-gray-300 text-sm mb-2">
            Should correctly handle months with 28, 30, and 31 days
          </div>
          <div class="result-box">
            {#each generatePeriods({ resetDate: -1, resetType: 'last-day-of-month' }, 4) as period}
              <div class="text-white text-sm">
                {formatPeriodDisplay(period.startDate, period.endDate)}
                <span class="text-gray-400 ml-2">
                  ({period.startDate.getDate()} days → {period.endDate.getDate()} days)
                </span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Year Boundary Test -->
        <div class="edge-case-card">
          <h3 class="text-white font-semibold mb-2">Test 3: Year Boundary Cross (Dec-Jan)</h3>
          <div class="text-gray-300 text-sm mb-2">
            Period should correctly span across year boundaries
          </div>
          <div class="result-box">
            {#each generatePeriods({ resetDate: 25, resetType: 'fixed' }, 12).filter((p, i) => {
              const month = p.startDate.getMonth();
              return month === 11 || month === 0; // Dec or Jan
            }).slice(0, 2) as period}
              <div class="text-white text-sm">
                {formatPeriodDisplay(period.startDate, period.endDate)}
                <span class="text-gray-400 ml-2">
                  (Year: {period.startDate.getFullYear()} → {period.endDate.getFullYear()})
                </span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Back button -->
    <div class="mt-6">
      <a href="/dashboard" class="glass-button inline-block">
        ← Back to Dashboard
      </a>
    </div>
  </div>
</div>

<style>
  .stat-card {
    padding: 1rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .period-item {
    padding: 1.25rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .period-item:hover {
    transform: translateX(4px);
    border-color: rgba(0, 191, 255, 0.3);
  }

  .period-item.active {
    border-color: rgba(0, 191, 255, 0.5);
    background: rgba(0, 191, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 191, 255, 0.2);
  }

  .badge-current {
    display: inline-block;
    background: #10b981;
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .edge-case-card {
    padding: 1rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .result-box {
    padding: 0.75rem;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    space-y: 0.5rem;
  }

  .result-box > div {
    margin-bottom: 0.5rem;
  }

  .result-box > div:last-child {
    margin-bottom: 0;
  }

  select, input[type="number"] {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  select:focus, input[type="number"]:focus {
    outline: none;
    border-color: rgba(0, 191, 255, 0.5);
    box-shadow: 0 0 0 3px rgba(0, 191, 255, 0.1);
  }
</style>