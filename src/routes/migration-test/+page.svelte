<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { MigrationTester, type MigrationTestResult } from '$lib/migration/migrationTester';

  let testResult: MigrationTestResult | null = null;
  let healthCheck: any = null;
  let isLoading = false;
  let error = '';
  let migrationTester: MigrationTester | null = null;

  // Subscribe to user authentication
  $: if ($user) {
    migrationTester = new MigrationTester($user.uid);
  }

  onMount(async () => {
    if ($user) {
      await runHealthCheck();
    }
  });

  async function runHealthCheck() {
    if (!migrationTester) return;

    try {
      isLoading = true;
      error = '';
      healthCheck = await migrationTester.quickHealthCheck();
    } catch (err) {
      error = `Health check failed: ${err}`;
      console.error('Health check error:', err);
    } finally {
      isLoading = false;
    }
  }

  async function runMigrationTest() {
    if (!migrationTester) {
      error = 'User not authenticated';
      return;
    }

    try {
      isLoading = true;
      error = '';
      testResult = await migrationTester.runMigrationTest();
    } catch (err) {
      error = `Migration test failed: ${err}`;
      console.error('Migration test error:', err);
    } finally {
      isLoading = false;
    }
  }

  async function generateReport() {
    if (!migrationTester) return;

    try {
      isLoading = true;
      const report = await migrationTester.generateMigrationReport();

      // Download report as text file
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration-report-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      error = `Report generation failed: ${err}`;
    } finally {
      isLoading = false;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'needs_attention': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'needs_attention': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  }
</script>

<svelte:head>
  <title>Migration Test - DuitTrack</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">🧪 Migration Test Center</h1>
      <p class="text-gray-300">Test and validate data migration from vanilla JS to Svelte</p>
    </div>

    {#if !$user}
      <!-- Not authenticated -->
      <div class="glass-card p-8 text-center">
        <h2 class="text-2xl font-bold text-white mb-4">Authentication Required</h2>
        <p class="text-gray-300 mb-6">Please sign in to test migration functionality</p>
        <button
          class="btn-primary"
          on:click={() => window.location.href = '/'}
        >
          Go to Login
        </button>
      </div>
    {:else}
      <!-- User authenticated -->
      <div class="space-y-6">

        <!-- Quick Health Check -->
        <div class="glass-card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-white">Quick Health Check</h2>
            <button
              class="btn-secondary text-sm"
              on:click={runHealthCheck}
              disabled={isLoading}
            >
              {isLoading ? 'Checking...' : 'Refresh'}
            </button>
          </div>

          {#if healthCheck}
            <div class="bg-black/20 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-3">
                <span class="text-2xl">{getStatusIcon(healthCheck.dataStatus)}</span>
                <span class="text-lg font-semibold {getStatusColor(healthCheck.dataStatus)}">
                  {healthCheck.dataStatus.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p class="text-gray-300">{healthCheck.summary}</p>

              {#if healthCheck.migrationNeeded}
                <div class="mt-4 p-3 bg-yellow-600/20 border border-yellow-600/40 rounded-lg">
                  <p class="text-yellow-200 font-medium">⚠️ Migration Required</p>
                  <p class="text-yellow-300 text-sm">Your data needs to be migrated to the new structure.</p>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Migration Actions -->
        <div class="glass-card p-6">
          <h2 class="text-2xl font-bold text-white mb-4">Migration Actions</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              class="btn-primary flex flex-col items-center space-y-2 p-4"
              on:click={runMigrationTest}
              disabled={isLoading}
            >
              <span class="text-2xl">🧪</span>
              <span>Run Full Test</span>
              <span class="text-xs opacity-75">Test migration process</span>
            </button>

            <button
              class="btn-secondary flex flex-col items-center space-y-2 p-4"
              on:click={generateReport}
              disabled={isLoading || !testResult}
            >
              <span class="text-2xl">📊</span>
              <span>Generate Report</span>
              <span class="text-xs opacity-75">Download detailed report</span>
            </button>

            <button
              class="btn-accent flex flex-col items-center space-y-2 p-4"
              on:click={() => window.location.href = '/'}
              disabled={isLoading}
            >
              <span class="text-2xl">🏠</span>
              <span>Back to App</span>
              <span class="text-xs opacity-75">Return to main app</span>
            </button>
          </div>
        </div>

        <!-- Test Results -->
        {#if testResult}
          <div class="glass-card p-6">
            <h2 class="text-2xl font-bold text-white mb-4">
              Test Results
              <span class="text-lg {testResult.success ? 'text-green-400' : 'text-red-400'}">
                {testResult.success ? '✅ Success' : '❌ Issues Found'}
              </span>
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Legacy Data -->
              <div class="bg-black/20 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-white mb-3">📊 Legacy Data</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-300">Expenses:</span>
                    <span class="text-white">{testResult.testResults.legacyDataCheck.expenseCount}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Budgets:</span>
                    <span class="text-white">{testResult.testResults.legacyDataCheck.budgetCount}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">User Profile:</span>
                    <span class="text-white">{testResult.testResults.legacyDataCheck.hasUserProfile ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <!-- Migration Results -->
              <div class="bg-black/20 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-white mb-3">🚀 Migration Results</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-300">Transactions:</span>
                    <span class="text-white">{testResult.testResults.migrationExecution.migrated.transactions}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Categories:</span>
                    <span class="text-white">{testResult.testResults.migrationExecution.migrated.categories}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Periods:</span>
                    <span class="text-white">{testResult.testResults.migrationExecution.migrated.periods}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Duration:</span>
                    <span class="text-white">{testResult.testResults.migrationExecution.duration}ms</span>
                  </div>
                </div>
              </div>

              <!-- Data Validation -->
              <div class="bg-black/20 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-white mb-3">✅ Validation</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-300">Transaction Integrity:</span>
                    <span class="{testResult.testResults.dataValidation.transactionIntegrity ? 'text-green-400' : 'text-red-400'}">
                      {testResult.testResults.dataValidation.transactionIntegrity ? '✅' : '❌'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Category Mapping:</span>
                    <span class="{testResult.testResults.dataValidation.categoryMapping ? 'text-green-400' : 'text-red-400'}">
                      {testResult.testResults.dataValidation.categoryMapping ? '✅' : '❌'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Period Consistency:</span>
                    <span class="{testResult.testResults.dataValidation.periodConsistency ? 'text-green-400' : 'text-red-400'}">
                      {testResult.testResults.dataValidation.periodConsistency ? '✅' : '❌'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-300">Completion:</span>
                    <span class="text-white font-medium">{testResult.testResults.dataValidation.dataCompletion}%</span>
                  </div>
                </div>
              </div>

              <!-- Recommendations -->
              <div class="bg-black/20 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-white mb-3">💡 Recommendations</h3>
                <div class="space-y-2 text-sm">
                  {#each testResult.recommendations as recommendation}
                    <div class="text-gray-300 flex items-start space-x-2">
                      <span class="text-yellow-400 mt-0.5">•</span>
                      <span>{recommendation}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Errors (if any) -->
            {#if testResult.testResults.migrationExecution.errors.length > 0}
              <div class="mt-6 bg-red-900/20 border border-red-500/40 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-red-400 mb-3">❌ Errors</h3>
                <div class="space-y-2">
                  {#each testResult.testResults.migrationExecution.errors as error}
                    <div class="text-red-300 text-sm font-mono bg-black/30 p-2 rounded">
                      {error}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Error Display -->
        {#if error}
          <div class="glass-card p-6 border-red-500/40">
            <h2 class="text-2xl font-bold text-red-400 mb-4">❌ Error</h2>
            <div class="bg-red-900/20 rounded-lg p-4">
              <p class="text-red-300 font-mono">{error}</p>
            </div>
          </div>
        {/if}

        <!-- Loading State -->
        {#if isLoading}
          <div class="glass-card p-6 text-center">
            <div class="flex items-center justify-center space-x-3">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span class="text-white text-lg">Processing...</span>
            </div>
          </div>
        {/if}

      </div>
    {/if}
  </div>
</div>

<style>
  .glass-card {
    @apply bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl;
  }

  .btn-primary {
    @apply bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg border border-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-accent {
    @apply bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }
</style>