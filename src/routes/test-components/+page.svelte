<script lang="ts">
  import { onMount } from 'svelte';
  import Navigation from '$lib/components/navigation/Navigation.svelte';
  import Budget from '$lib/components/budget/Budget.svelte';
  import ExpenseForm from '$lib/components/expense/ExpenseForm.svelte';

  let showExpenseForm = false;
  let currentPage = 'budget';

  const categories = [
    { value: 'FOOD', label: 'Makanan & Minuman', disabled: false },
    { value: 'TRANSPORT', label: 'Transport', disabled: false },
    { value: 'SHOPPING', label: 'Belanja', disabled: false },
    { value: 'ENTERTAINMENT', label: 'Hiburan', disabled: false },
    { value: 'HEALTH', label: 'Kesehatan', disabled: false },
    { value: 'EDUCATION', label: 'Pendidikan', disabled: false },
    { value: 'UTILITIES', label: 'Tagihan', disabled: false },
    { value: 'OTHER', label: 'Lainnya', disabled: false }
  ];

  function handleNavigation(event) {
    console.log('Navigation event:', event.detail);
    currentPage = event.detail.page;
  }

  function handleExpenseFormClose() {
    showExpenseForm = false;
  }

  function handleExpenseCreated(event) {
    console.log('Expense created:', event.detail);
    showExpenseForm = false;
  }

  function handleExpenseUpdated(event) {
    console.log('Expense updated:', event.detail);
    showExpenseForm = false;
  }
</script>

<div class="test-page">
  <!-- Navigation Component Test -->
  <header class="test-header">
    <div class="header-content">
      <div class="logo">
        <h1>DuitTrack</h1>
        <span class="logo-subtitle">Component Test</span>
      </div>

      <Navigation
        on:navigate={handleNavigation}
        on:authError={(e) => console.error('Auth error:', e.detail)}
      />
    </div>
  </header>

  <!-- Main Content Area -->
  <main class="test-content">
    <div class="page-header">
      <h2 class="page-title">
        {#if currentPage === 'budget'}
          💰 Budget Management Test
        {:else if currentPage === 'expenses'}
          💸 Expense Management Test
        {:else if currentPage === 'dashboard'}
          📊 Dashboard Test
        {:else}
          📱 Component Test Page
        {/if}
      </h2>

      <div class="test-actions">
        <button
          class="test-btn"
          on:click={() => showExpenseForm = true}
        >
          Test Expense Form
        </button>
        <button
          class="test-btn secondary"
          on:click={() => currentPage = 'budget'}
        >
          Test Budget
        </button>
      </div>
    </div>

    <!-- Budget Component Test -->
    {#if currentPage === 'budget'}
      <div class="component-test-section">
        <h3>Budget Component</h3>
        <div class="component-container">
          <Budget />
        </div>
      </div>
    {/if}

    <!-- Test Cards for Other Components -->
    <div class="test-grid">
      <div class="test-card">
        <h4>Navigation Component</h4>
        <p>✅ Responsive hamburger menu</p>
        <p>✅ User authentication state</p>
        <p>✅ Mobile-first design (430px optimization)</p>
        <p>✅ Glass morphism styling</p>
      </div>

      <div class="test-card">
        <h4>Budget Component</h4>
        <p>✅ Budget creation and editing</p>
        <p>✅ Category management</p>
        <p>✅ Quick setup packages</p>
        <p>✅ Indonesian Rupiah formatting</p>
      </div>

      <div class="test-card">
        <h4>ExpenseForm Component</h4>
        <p>✅ Smart budget-aware warnings</p>
        <p>✅ Category dropdown with caching</p>
        <p>✅ 3-layer error handling</p>
        <p>✅ Progressive success states</p>
      </div>
    </div>
  </main>

  <!-- Expense Form Modal Test -->
  {#if showExpenseForm}
    <ExpenseForm
      isOpen={showExpenseForm}
      {categories}
      on:close={handleExpenseFormClose}
      on:expenseCreated={handleExpenseCreated}
      on:expenseUpdated={handleExpenseUpdated}
    />
  {/if}
</div>

<style>
  .test-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .test-header {
    padding: 1rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .logo-subtitle {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .test-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
  }

  .test-actions {
    display: flex;
    gap: 1rem;
  }

  .test-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .test-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .test-btn.secondary {
    background: rgba(76, 175, 80, 0.2);
    border-color: rgba(76, 175, 80, 0.4);
  }

  .component-test-section {
    margin-bottom: 2rem;
  }

  .component-test-section h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .component-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
  }

  .test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .test-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
  }

  .test-card h4 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.95);
  }

  .test-card p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .test-header {
      padding: 1rem;
    }

    .test-content {
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }

    .test-actions {
      justify-content: center;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .test-grid {
      grid-template-columns: 1fr;
    }
  }

  /* CSS Variables for components */
  :global(:root) {
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.7);
    --primary-accent: #4ECDC4;
    --secondary-accent: #45B7D1;
    --primary-accent-rgb: 78, 205, 196;
    --safe-color: #4CAF50;
    --warning-color: #FF9800;
    --danger-color: #F44336;
  }
</style>