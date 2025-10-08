<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { budgetStore, budgetActions, budgetCategoriesStore } from '../../stores/budget';
  import { authService } from '../../services/authService';
  import { DataService } from '../../services/dataService';
  import LoadingSkeleton from './LoadingSkeleton.svelte';
  import CategoryBudgetItem from './CategoryBudgetItem.svelte';

  const dispatch = createEventDispatcher();

  // Internal state management
  let currentPeriodId = '';
  let userResetDate = 1;
  let categories: any[] = [];
  let isLoading = false;
  let dataService: DataService | null = null;
  let showQuickSetup = false;
  let showAddCategoryForm = false;
  let showEditTotalModal = false;
  let selectedPackage = '';
  let newCategoryData = {
    id: '',
    name: '',
    emoji: '📦',
    budget: 0
  };

  // Reactive stores
  const budgetData = writable(null);
  const selectedPeriod = writable('');
  const availablePeriods = writable([]);

  // Derived stores for computed values
  const totalBudget = derived(budgetData, ($budgetData) => {
    if (!$budgetData?.categories) return 0;
    return Object.values($budgetData.categories).reduce((sum: number, cat: any) => sum + (cat.budget || 0), 0);
  });

  const totalSpent = derived(budgetData, ($budgetData) => {
    if (!$budgetData?.categories) return 0;
    return Object.values($budgetData.categories).reduce((sum: number, cat: any) => sum + (cat.spent || 0), 0);
  });

  const budgetHealth = derived([totalBudget, totalSpent], ([$totalBudget, $totalSpent]) => {
    if ($totalBudget === 0) return { status: 'neutral', percentage: 0 };

    const percentage = ($totalSpent / $totalBudget) * 100;
    let status = 'healthy';

    if ($totalSpent > $totalBudget) status = 'over-budget';
    else if (percentage >= 90) status = 'danger';
    else if (percentage >= 75) status = 'warning';

    return { status, percentage: Math.round(percentage) };
  });

  // Component initialization
  onMount(async () => {
    await initializeBudgetComponent();

    // TEMPORARY: Load dummy data for development
    loadDummyData();
  });

  async function initializeBudgetComponent() {
    try {
      // Wait for authentication
      const user = await authService.getCurrentUser();
      if (!user) {
        console.warn('No authenticated user found');
        return;
      }

      // Initialize data service
      dataService = new DataService(user.uid);

      // Load user settings and setup period selector
      await loadUserSettings();
      await setupPeriodSelector();

      // Load budget data for current period
      await loadBudgetData();
    } catch (error) {
      console.error('Error initializing budget component:', error);
    }
  }

  async function loadUserSettings() {
    if (!dataService) return;

    try {
      const userProfile = await dataService.getUserProfile();
      userResetDate = userProfile?.budgetResetDate || 1;
      console.log('📅 Budget component loaded user reset date:', userResetDate);
    } catch (error) {
      console.error('Error loading user settings:', error);
      userResetDate = 1; // Fallback to default
    }
  }

  async function setupPeriodSelector() {
    try {
      // Generate available periods based on user's reset date
      const periods = generatePeriodOptions(userResetDate, 12);
      availablePeriods.set(periods);

      // Set current period
      const currentPeriod = periods.find(p => p.isCurrent);
      currentPeriodId = currentPeriod?.id || periods[0]?.id || '';
      selectedPeriod.set(currentPeriodId);

      console.log('✅ Budget period selector setup complete. Period ID:', currentPeriodId);
    } catch (error) {
      console.error('❌ Error setting up period selector:', error);
    }
  }

  async function loadBudgetData() {
    if (!dataService || !currentPeriodId) return;

    try {
      isLoading = true;

      // Add minimum loading delay for better UX
      const loadingStartTime = Date.now();
      const minimumLoadingTime = 800;

      // Load budget data using the new DataService
      const periods = await dataService.getPeriods();
      const currentPeriod = periods.find(p => p.id === currentPeriodId);

      if (currentPeriod) {
        // Extract categories from period summary
        const budgetCategories = currentPeriod.summary?.categoryBreakdown || {};

        // Convert to the expected format
        const formattedCategories = Object.entries(budgetCategories).map(([categoryId, data]: [string, any]) => ({
          id: categoryId,
          name: formatCategoryName(categoryId),
          emoji: getCategoryEmoji(categoryId),
          budget: data.budget || 0,
          spent: data.spent || 0
        }));

        categories = formattedCategories;
        budgetData.set({
          categories: Object.fromEntries(
            formattedCategories.map(cat => [cat.id, { budget: cat.budget, spent: cat.spent }])
          ),
          totalBudget: formattedCategories.reduce((sum, cat) => sum + cat.budget, 0),
          totalSpent: formattedCategories.reduce((sum, cat) => sum + cat.spent, 0)
        });
      } else {
        // No budget data found
        categories = [];
        budgetData.set(null);
      }

      // Ensure minimum loading time for skeleton visibility
      const loadingElapsed = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, minimumLoadingTime - loadingElapsed);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

    } catch (error) {
      console.error('❌ Error loading budget data:', error);
      categories = [];
      budgetData.set(null);
    } finally {
      isLoading = false;
    }
  }

  function handlePeriodChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    currentPeriodId = target.value;
    selectedPeriod.set(currentPeriodId);
    loadBudgetData();
  }

  async function handleCategoryBudgetUpdate(categoryId: string, newBudget: number) {
    try {
      // Update local state immediately for responsiveness
      categories = categories.map(cat =>
        cat.id === categoryId ? { ...cat, budget: newBudget } : cat
      );

      // Update budget data store
      budgetData.update(data => {
        if (!data) return data;
        return {
          ...data,
          categories: {
            ...data.categories,
            [categoryId]: {
              ...data.categories[categoryId],
              budget: newBudget
            }
          }
        };
      });

      // Persist to database
      if (dataService) {
        // This would need to be implemented in DataService
        // await dataService.updateCategoryBudget(currentPeriodId, categoryId, newBudget);
      }

      console.log(`✅ Budget updated for ${categoryId}: ${formatCurrency(newBudget)}`);
    } catch (error) {
      console.error('❌ Error updating category budget:', error);
    }
  }

  async function handleCategoryDelete(categoryId: string) {
    try {
      categories = categories.filter(cat => cat.id !== categoryId);

      budgetData.update(data => {
        if (!data) return data;
        const newCategories = { ...data.categories };
        delete newCategories[categoryId];
        return {
          ...data,
          categories: newCategories
        };
      });

      console.log(`✅ Category deleted: ${categoryId}`);
    } catch (error) {
      console.error('❌ Error deleting category:', error);
    }
  }

  async function handleAddCategory(categoryData: { id: string; name: string; emoji: string; budget: number }) {
    try {
      const newCategory = {
        ...categoryData,
        spent: 0
      };

      categories = [...categories, newCategory];

      budgetData.update(data => {
        const currentData = data || { categories: {} };
        return {
          ...currentData,
          categories: {
            ...currentData.categories,
            [categoryData.id]: {
              budget: categoryData.budget,
              spent: 0
            }
          }
        };
      });

      console.log(`✅ Category added: ${categoryData.name}`);
    } catch (error) {
      console.error('❌ Error adding category:', error);
    }
  }

  // Budget package management
  const budgetPackages = {
    conservative: {
      name: 'Conservative',
      description: 'Safe spending with high savings focus',
      categories: [
        { id: 'food', name: 'Makanan', emoji: '🍽️', budget: 1500000 },
        { id: 'transport', name: 'Transport', emoji: '🚗', budget: 800000 },
        { id: 'utilities', name: 'Tagihan', emoji: '💡', budget: 600000 },
        { id: 'savings', name: 'Tabungan', emoji: '💰', budget: 2000000 },
        { id: 'other', name: 'Lainnya', emoji: '📦', budget: 300000 }
      ]
    },
    balanced: {
      name: 'Balanced',
      description: 'Moderate spending with balanced lifestyle',
      categories: [
        { id: 'food', name: 'Makanan', emoji: '🍽️', budget: 2000000 },
        { id: 'transport', name: 'Transport', emoji: '🚗', budget: 1000000 },
        { id: 'shopping', name: 'Belanja', emoji: '🛍️', budget: 800000 },
        { id: 'entertainment', name: 'Hiburan', emoji: '🎬', budget: 500000 },
        { id: 'utilities', name: 'Tagihan', emoji: '💡', budget: 700000 },
        { id: 'savings', name: 'Tabungan', emoji: '💰', budget: 1500000 }
      ]
    },
    flexible: {
      name: 'Flexible',
      description: 'Higher spending with lifestyle focus',
      categories: [
        { id: 'food', name: 'Makanan', emoji: '🍽️', budget: 2500000 },
        { id: 'transport', name: 'Transport', emoji: '🚗', budget: 1200000 },
        { id: 'shopping', name: 'Belanja', emoji: '🛍️', budget: 1200000 },
        { id: 'entertainment', name: 'Hiburan', emoji: '🎬', budget: 800000 },
        { id: 'health', name: 'Kesehatan', emoji: '⚕️', budget: 600000 },
        { id: 'education', name: 'Pendidikan', emoji: '📚', budget: 400000 },
        { id: 'savings', name: 'Tabungan', emoji: '💰', budget: 1000000 }
      ]
    }
  };

  function handleShowAddCategory() {
    showAddCategoryForm = true;
    newCategoryData = {
      id: '',
      name: '',
      emoji: '📦',
      budget: 0
    };
  }

  function handleCancelAddCategory() {
    showAddCategoryForm = false;
    newCategoryData = {
      id: '',
      name: '',
      emoji: '📦',
      budget: 0
    };
  }

  async function handleSaveNewCategory() {
    if (!newCategoryData.name || !newCategoryData.budget || newCategoryData.budget <= 0) {
      return;
    }

    const categoryId = newCategoryData.id || newCategoryData.name.toLowerCase().replace(/\s+/g, '_');

    await handleAddCategory({
      id: categoryId,
      name: newCategoryData.name,
      emoji: newCategoryData.emoji,
      budget: newCategoryData.budget
    });

    showAddCategoryForm = false;
  }

  function handlePackageSelect(packageKey: string) {
    selectedPackage = packageKey;
  }

  async function handleApplyPackage() {
    if (!selectedPackage || !budgetPackages[selectedPackage]) return;

    const packageData = budgetPackages[selectedPackage];

    // Clear existing categories and apply package
    categories = packageData.categories.map(cat => ({ ...cat, spent: 0 }));

    // Update budget data
    budgetData.set({
      categories: Object.fromEntries(
        categories.map(cat => [cat.id, { budget: cat.budget, spent: 0 }])
      ),
      totalBudget: categories.reduce((sum, cat) => sum + cat.budget, 0),
      totalSpent: 0
    });

    showQuickSetup = false;
    selectedPackage = '';
  }

  function handleSkipQuickSetup() {
    showQuickSetup = false;
  }

  function generatePeriodOptions(resetDate: number, count: number) {
    const periods = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, resetDate);
      const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, resetDate - 1);

      const periodId = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}-${String(resetDate).padStart(2, '0')}`;

      const displayName = periodStart.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
      }) + ` (${resetDate})`;

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

  function formatCategoryName(categoryId: string): string {
    const names: Record<string, string> = {
      'food': 'Makanan',
      'transport': 'Transport',
      'shopping': 'Belanja',
      'entertainment': 'Hiburan',
      'health': 'Kesehatan',
      'education': 'Pendidikan',
      'utilities': 'Tagihan',
      'savings': 'Tabungan',
      'other': 'Lainnya'
    };
    return names[categoryId.toLowerCase()] || categoryId;
  }

  function getCategoryEmoji(categoryId: string): string {
    const emojis: Record<string, string> = {
      'food': '🍽️',
      'transport': '🚗',
      'shopping': '🛍️',
      'entertainment': '🎬',
      'health': '⚕️',
      'education': '📚',
      'utilities': '💡',
      'savings': '💰',
      'other': '📦'
    };
    return emojis[categoryId.toLowerCase()] || '📦';
  }

  function formatCurrencyInput(amount: number): string {
    if (!amount) return '';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function getDaysLeftInPeriod(): number {
    if (!currentPeriodId) return 0;

    const periods = $availablePeriods;
    const currentPeriod = periods.find(p => p.id === currentPeriodId);

    if (!currentPeriod) return 0;

    const now = new Date();
    const endDate = new Date(currentPeriod.end);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  async function loadDummyData() {
    // Import centralized dummy data
    const { getDummyCategories, generateDummyExpenses } = await import('$lib/utils/dummyData');

    // Get expenses from store/cache (same data as Dashboard & Expenses)
    const expenses = generateDummyExpenses(25);

    // Calculate spent per category from actual expenses
    const categorySpending: Record<string, number> = {};
    expenses.forEach((expense: any) => {
      const categoryId = expense.category.toLowerCase();
      categorySpending[categoryId] = (categorySpending[categoryId] || 0) + expense.amount;
    });

    // Get categories with budget amounts
    const dummyCategories = getDummyCategories();

    // Combine budget with REAL spending from expenses
    categories = dummyCategories.map(cat => ({
      ...cat,
      spent: categorySpending[cat.id] || 0  // Use real spending from expenses
    }));

    // Calculate totals
    const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

    budgetData.set({
      categories: Object.fromEntries(
        categories.map(cat => [cat.id, { budget: cat.budget, spent: cat.spent }])
      ),
      totalBudget,
      totalSpent
    });

    console.log('📊 Dummy budget data loaded (using shared store expenses)');
    console.log('💰 Budget total spent:', totalSpent);
  }
</script>

<div class="budget-page-container">
  <!-- Header Section - Following Dashboard/Expenses Pattern -->
  <div class="budget-header">
    <div class="header-content">
      <!-- Page Title -->
      <div class="page-title-section">
        <h1 class="page-title">Budget</h1>
      </div>

      <!-- Period Selector -->
      <div class="period-selector">
        <div class="period-label">Periode Tracking</div>
        <div class="period-card">
          <span class="period-icon">📅</span>
          <span class="period-text">{$selectedPeriod || currentPeriodId}</span>
          <span class="period-arrow">▼</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Budget Content Grid -->
  <div class="budget-content-grid">
    {#if isLoading}
      <LoadingSkeleton />
    {:else if categories.length === 0}
      <!-- Empty State - Enhanced -->
      <div class="budget-empty-state">
        <div class="empty-content enhanced-empty-card">
          <div class="empty-glass-overlay"></div>

          <!-- Background decorations -->
          <div class="empty-bg-elements">
            <div class="empty-circle empty-circle-1"></div>
            <div class="empty-circle empty-circle-2"></div>
          </div>

          <div class="empty-content-inner">
            <div class="empty-icon-container">
              <div class="empty-icon">📊</div>
            </div>
            <h3 class="empty-title">Mulai Kelola Budget Kamu</h3>
            <p class="empty-description">Buat budget untuk setiap kategori dan pantau pengeluaran kamu agar tetap terkontrol. Dengan budget yang jelas, kamu bisa lebih mudah mencapai tujuan finansialmu.</p>

            <button
              class="btn-create-budget floating-cta-button"
              on:click={handleShowAddCategory}
            >
              <span class="btn-icon">💰</span>
              <span class="btn-text">Buat Budget Pertama</span>
            </button>
          </div>
        </div>
      </div>
  {:else}
    <!-- Budget Overview - Enhanced Hero Card -->
    <div class="budget-overview hero-budget-card liquid-card">
      <div class="hero-glass-overlay"></div>

      <!-- Enhanced Background Elements -->
      <div class="hero-bg-elements">
        <div class="hero-circle hero-circle-1 animate-liquid-float"></div>
        <div class="hero-circle hero-circle-2 animate-liquid-float"></div>
        <div class="hero-wave animate-liquid-flow"></div>
        <div class="hero-glass-particle hero-particle-1"></div>
        <div class="hero-glass-particle hero-particle-2"></div>
        <div class="hero-glass-particle hero-particle-3"></div>
      </div>

      <!-- Hero Content -->
      <div class="hero-content">
        <div class="overview-header">
          <h1 class="hero-title">Budget Check! 💰</h1>
          <div class="overview-period">
            <span class="period-icon">📅</span>
            <span class="period-days">{getDaysLeftInPeriod()} hari lagi</span>
          </div>
        </div>

        <div class="hero-amount">
          <div class="amount-section-hero">
            <span class="amount-label">SUDAH TERPAKAI</span>
            <div class="amount-display-new">
              <span class="main-amount-large">{formatCurrency($totalSpent)}</span>
              <span class="amount-separator">/</span>
              <span class="budget-amount-small">{formatCurrency($totalBudget)}</span>
            </div>
          </div>
        </div>

        <div class="budget-progress">
          <div class="progress-container-hero">
            <div class="progress-track">
              <div
                class="progress-fill-hero"
                class:progress-healthy={$budgetHealth.status === 'healthy'}
                class:progress-warning={$budgetHealth.status === 'warning'}
                class:progress-danger={$budgetHealth.status === 'danger' || $budgetHealth.status === 'over-budget'}
                style="width: {Math.min($budgetHealth.percentage, 100)}%"
              ></div>
            </div>
            <div class="progress-info">
              <span class="progress-percentage">{$budgetHealth.percentage}%</span>
              <div class="progress-status">
                <span class="hero-emoji">
                  {#if $budgetHealth.status === 'over-budget'}🚨
                  {:else if $budgetHealth.status === 'danger'}⚠️
                  {:else if $budgetHealth.status === 'warning'}🟡
                  {:else}✅{/if}
                </span>
                <span class="hero-message">
                  {#if $budgetHealth.status === 'over-budget'}Waduh, over budget! 😅
                  {:else if $budgetHealth.status === 'danger'}Udah mepet nih! 😰
                  {:else if $budgetHealth.status === 'warning'}Hati-hati ya 👀
                  {:else}Aman terkendali 😎{/if}
                </span>
              </div>
            </div>
            <div class="hero-summary">
              <span class="remaining-amount">Tersisa {formatCurrency($totalBudget - $totalSpent)}</span>
              <span class="reset-info">
                {#if categories.length > 0}
                  Avg per kategori: {formatCurrency($totalBudget / categories.length)}
                {/if}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Categories List -->
    <div class="budget-categories-section">
      <div class="categories-header">
        <h3 class="section-title">Budget Categories</h3>
        <button
          class="add-category-btn glass-button"
          on:click={handleShowAddCategory}
        >
          <span class="btn-icon">➕</span>
          Add Category
        </button>
      </div>

      {#if showAddCategoryForm}
        <!-- Add Category Form -->
        <div class="add-category-form glass-card">
          <div class="form-header">
            <h4>Add New Category</h4>
            <button class="close-btn" on:click={handleCancelAddCategory}>×</button>
          </div>

          <div class="form-content">
            <div class="form-group">
              <label>Category Name</label>
              <input
                type="text"
                class="glass-input"
                bind:value={newCategoryData.name}
                placeholder="e.g., Food, Transport"
              />
            </div>

            <div class="form-group">
              <label>Emoji</label>
              <input
                type="text"
                class="glass-input"
                bind:value={newCategoryData.emoji}
                placeholder="📦"
                maxlength="2"
              />
            </div>

            <div class="form-group">
              <label>Budget Amount</label>
              <input
                type="number"
                class="glass-input"
                bind:value={newCategoryData.budget}
                placeholder="0"
                min="0"
              />
            </div>

            <div class="form-actions">
              <button class="btn-secondary" on:click={handleCancelAddCategory}>
                Cancel
              </button>
              <button class="btn-primary" on:click={handleSaveNewCategory}>
                Add Category
              </button>
            </div>
          </div>
        </div>
      {/if}

      <div class="categories-list">
        {#each categories as category (category.id)}
          <CategoryBudgetItem
            {category}
            on:budgetUpdate={(e) => handleCategoryBudgetUpdate(category.id, e.detail.amount)}
            on:delete={() => handleCategoryDelete(category.id)}
          />
        {/each}
      </div>
    </div>

  {/if}
  </div>
</div>

<style>
  /* ===== GLASSMORPHISM DESIGN SYSTEM - BUDGET PAGE ===== */

  /* Page Background System */
  .budget-page-container {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    /* Enhanced glassmorphism background system */
    background:
      radial-gradient(circle at 20% 80%, rgba(0, 191, 255, 0.04) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(30, 144, 255, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(0, 123, 255, 0.02) 0%, transparent 40%),
      linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  }

  /* Floating Background Accents */
  .budget-page-container::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
      radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.03) 0%, transparent 30%),
      radial-gradient(circle at 75% 75%, rgba(30, 144, 255, 0.02) 0%, transparent 30%),
      radial-gradient(circle at 50% 10%, rgba(0, 123, 255, 0.025) 0%, transparent 25%);
    animation: float-accent 20s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes float-accent {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    33% {
      transform: translateY(-10px) rotate(120deg);
    }
    66% {
      transform: translateY(5px) rotate(240deg);
    }
  }

  /* Header Section - Following Dashboard/Expenses Pattern */
  .budget-header {
    padding: 20px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(6, 182, 212, 0.1);
    position: relative;
    z-index: 2;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Page Title Section */
  .page-title-section {
    flex-shrink: 0;
  }

  .page-title {
    font-size: 28px;
    font-weight: 800;
    color: #1f2937;
    margin: 0;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #1f2937 0%, #0891B2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 2px 4px rgba(31, 41, 55, 0.1));
  }

  /* Period Selector */
  .period-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .period-label {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .period-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(6, 182, 212, 0.02));
    border-radius: 12px;
    border: 1px solid rgba(6, 182, 212, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
  }

  .period-card:hover {
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
  }

  .period-icon {
    font-size: 18px;
  }

  .period-text {
    font-weight: 600;
    color: #0891B2;
  }

  .period-arrow {
    margin-left: auto;
    color: #6b7280;
  }

  /* Budget Content Grid - Wrapper for content after header */
  .budget-content-grid {
    display: grid;
    gap: 20px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .budget-empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    padding: 2rem 0;
  }

  /* Enhanced Empty State Card */
  .enhanced-empty-card {
    position: relative;
    text-align: center;
    padding: 3rem 2rem;
    border-radius: 20px;
    max-width: 500px;
    width: 100%;
    overflow: hidden;
    /* Enhanced glassmorphism */
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .enhanced-empty-card:hover {
    box-shadow:
      0 25px 60px rgba(0, 191, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 191, 255, 0.2);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    transform: translateY(-4px);
  }

  .empty-glass-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      transparent 40%,
      transparent 60%,
      rgba(6, 182, 212, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  .enhanced-empty-card:hover .empty-glass-overlay {
    opacity: 1;
  }

  /* Empty State Background Elements */
  .empty-bg-elements {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 0;
  }

  .empty-circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg,
      rgba(6, 182, 212, 0.1) 0%,
      rgba(6, 182, 212, 0.02) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(6, 182, 212, 0.15);
  }

  .empty-circle-1 {
    width: 120px; height: 120px;
    top: -60px; right: -60px;
  }

  .empty-circle-2 {
    width: 80px; height: 80px;
    bottom: -40px; left: -40px;
  }

  .empty-content-inner {
    position: relative;
    z-index: 1;
  }

  .empty-icon-container {
    margin-bottom: 1.5rem;
  }

  .empty-icon {
    font-size: 4rem;
    display: inline-block;
    animation: float 3s ease-in-out infinite;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .empty-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.75rem;
    background: linear-gradient(135deg, #1f2937 0%, #0891B2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .empty-description {
    color: #64748b;
    margin-bottom: 2rem;
    line-height: 1.6;
    font-size: 0.95rem;
  }

  .budget-categories-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .categories-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  /* ===== FLOATING GLASSMORPHISM - ACTION BUTTONS ===== */
  .add-category-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: white;
    font-weight: 600;
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }

  .add-category-btn:hover {
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.85) 0%,
      rgba(30, 144, 255, 0.9) 100%);
    transform: translateY(-3px) scale(1.03);
    box-shadow:
      0 12px 40px rgba(0, 191, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
  }

  .btn-icon {
    font-size: 1.1rem;
  }

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ===== DESKTOP AND TABLET RESPONSIVE ===== */
  @media (min-width: 768px) {
    .header-content {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }

    .page-title-section {
      flex: 0 0 auto;
    }

    .period-selector {
      flex: 0 0 auto;
      align-items: flex-end;
      text-align: right;
      min-width: 200px;
    }

    .period-label {
      text-align: right;
    }

    .period-card {
      width: auto;
      min-width: 180px;
      justify-content: center;
    }
  }

  /* ===== MOBILE OPTIMIZATION ===== */

  /* Enhanced Mobile Background - Following Design System */
  @media (max-width: 768px) {
    .budget-header {
      padding: 16px 16px 12px 16px;
    }

    .budget-content-grid {
      gap: 16px;
      padding: 16px;
    }

    .budget-page-container {
      background:
        radial-gradient(circle at 30% 20%, rgba(0, 191, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 70% 80%, rgba(30, 144, 255, 0.06) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(0, 123, 255, 0.04) 0%, transparent 30%),
        linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
    }

    .budget-page-container::before {
      background-image:
        radial-gradient(circle at 20% 30%, rgba(0, 191, 255, 0.06) 0%, transparent 25%),
        radial-gradient(circle at 80% 70%, rgba(30, 144, 255, 0.05) 0%, transparent 25%),
        radial-gradient(circle at 50% 10%, rgba(0, 123, 255, 0.04) 0%, transparent 20%);
    }

    .budget-header {
      padding: 1rem 1rem 0.5rem 1rem;
    }

    .header-content {
      gap: 0.75rem;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .period-selector {
      margin-top: 0.5rem;
    }

    .period-label {
      font-size: 0.75rem;
      margin-bottom: 0.4rem;
    }

    .period-card {
      padding: 0.6rem 0.8rem;
      font-size: 0.8rem;
    }

    .period-icon {
      font-size: 0.9rem;
    }

    .categories-header {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }

    .add-category-btn {
      justify-content: center;
    }

    .empty-content {
      padding: 2rem 1rem;
    }

    .empty-icon {
      font-size: 3rem;
    }

    .budget-overview {
      padding: 24px;
      min-height: 280px;
    }

    .section-title {
      font-size: 20px;
    }

    .metric-value {
      font-size: 20px;
    }
  }

  /* Extra small mobile */
  @media (max-width: 430px) {
    .budget-header {
      padding: 16px 16px 12px 16px;
    }

    .page-title-section {
      margin-bottom: 12px;
    }

    .page-title {
      font-size: 24px;
    }

    .budget-content-grid {
      gap: 12px;
      padding: 12px;
    }

    .budget-page-container {
      background:
        radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.1) 0%, transparent 35%),
        radial-gradient(circle at 75% 75%, rgba(30, 144, 255, 0.08) 0%, transparent 35%),
        linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%);
    }

    .budget-page-container::before {
      background-image:
        radial-gradient(circle at 15% 40%, rgba(0, 191, 255, 0.08) 0%, transparent 20%),
        radial-gradient(circle at 85% 60%, rgba(30, 144, 255, 0.06) 0%, transparent 20%);
    }

    .budget-header {
      padding: 16px 16px 12px 16px;
    }

    .page-title-section {
      margin-bottom: 12px;
    }

    .page-title {
      font-size: 24px;
    }

    .budget-overview {
      padding: 20px;
      min-height: 260px;
    }

    .section-title {
      font-size: 18px;
    }

    .metric-value {
      font-size: 18px;
    }

    .overview-metrics {
      grid-template-columns: 1fr;
    }
  }

  /* ===== SECONDARY GLASSMORPHISM - SUPPORTING CARDS ===== */
  .glass-card {
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(240, 248, 255, 0.4) 50%,
      rgba(248, 252, 255, 0.6) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
  }

  .glass-card:hover {
    background: linear-gradient(135deg,
      rgba(240, 248, 255, 0.7) 0%,
      rgba(248, 252, 255, 0.5) 50%,
      rgba(245, 250, 255, 0.8) 100%);
    box-shadow:
      0 25px 60px rgba(0, 191, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 191, 255, 0.2);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    transform: translateY(-8px) scale(1.02);
  }

  .glass-input {
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
  }

  .glass-input:focus {
    background: rgba(255, 255, 255, 0.5);
    border-color: rgba(0, 191, 255, 0.5);
    box-shadow: 0 0 0 3px rgba(0, 191, 255, 0.1);
  }

  .glass-button {
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
  }

  .glass-button:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  /* Enhanced Floating CTA Button */
  .floating-cta-button {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-top: 1.5rem;
    padding: 1rem 2rem;
    border-radius: 12px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .floating-cta-button::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .floating-cta-button:hover {
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.85) 0%,
      rgba(30, 144, 255, 0.9) 100%);
    transform: translateY(-3px) scale(1.03);
    box-shadow:
      0 12px 40px rgba(0, 191, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
  }

  .floating-cta-button:hover::before {
    opacity: 1;
  }

  .btn-icon {
    font-size: 1.2rem;
    transition: transform 0.3s ease;
  }

  .floating-cta-button:hover .btn-icon {
    transform: scale(1.2) rotate(10deg);
  }

  .btn-text {
    position: relative;
    z-index: 1;
  }

  /* ===== HERO GLASSMORPHISM - BUDGET OVERVIEW ===== */
  .hero-budget-card {
    position: relative;
    border-radius: 16px;
    padding: 36px;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    cursor: pointer;
    min-height: 320px;
    margin-bottom: 1.5rem;
    /* Hero glassmorphism from design system */
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.55) 0%,
      rgba(30, 144, 255, 0.65) 50%,
      rgba(0, 123, 255, 0.7) 100%);
    backdrop-filter: blur(30px) saturate(2);
    -webkit-backdrop-filter: blur(30px) saturate(2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow:
      0 8px 25px rgba(0, 191, 255, 0.08),
      0 4px 12px rgba(0, 191, 255, 0.12),
      0 2px 6px rgba(30, 144, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  .hero-budget-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(0, 191, 255, 0.12),
      0 10px 20px rgba(0, 191, 255, 0.15),
      0 4px 8px rgba(30, 144, 255, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border-color: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(40px) saturate(2.2);
    -webkit-backdrop-filter: blur(40px) saturate(2.2);
  }

  .hero-glass-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      transparent 40%,
      transparent 60%,
      rgba(6, 182, 212, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  .hero-budget-card:hover .hero-glass-overlay {
    opacity: 1;
  }

  /* Enhanced Hero Background Elements */
  .hero-bg-elements {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 1;
  }

  .hero-circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .hero-circle-1 {
    width: 140px; height: 140px;
    top: -70px; right: -70px;
  }

  .hero-circle-2 {
    width: 100px; height: 100px;
    bottom: -50px; left: -50px;
  }

  .hero-wave {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 80px;
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.05) 100%);
    border-radius: 50% 50% 0 0;
    backdrop-filter: blur(15px);
  }

  .hero-glass-particle {
    position: absolute;
    width: 6px; height: 6px;
    background: radial-gradient(circle,
      rgba(255, 255, 255, 0.8) 0%,
      rgba(6, 182, 212, 0.4) 50%,
      transparent 100%);
    border-radius: 50%;
    animation: particle-float 8s ease-in-out infinite;
  }

  .hero-particle-1 { top: 25%; left: 20%; animation-delay: 0s; }
  .hero-particle-2 { top: 60%; right: 25%; animation-delay: -3s; }
  .hero-particle-3 { bottom: 30%; left: 60%; animation-delay: -6s; }

  @keyframes particle-float {
    0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
    33% { transform: translateY(-15px) scale(1.2); opacity: 1; }
    66% { transform: translateY(10px) scale(0.8); opacity: 0.4; }
  }

  /* Hero Content */
  .hero-content {
    position: relative;
    z-index: 2;
    color: white;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .overview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    position: relative;
    z-index: 2;
  }

  .hero-title {
    font-size: 24px;
    font-weight: 800;
    color: white;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .overview-period {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    backdrop-filter: blur(10px);
  }

  .period-icon {
    font-size: 14px;
  }

  .period-days {
    color: rgba(255, 255, 255, 0.95);
    font-size: 13px;
    font-weight: 600;
  }

  /* Hero Amount Display */
  .hero-amount {
    margin-bottom: 24px;
  }

  .amount-section-hero {
    margin-bottom: 16px;
  }

  .amount-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    opacity: 0.8;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: white;
  }

  .amount-display-new {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-top: 8px;
  }

  .main-amount-large {
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    color: white;
  }

  .amount-separator {
    font-size: 20px;
    font-weight: 300;
    opacity: 0.5;
    margin: 0 4px;
  }

  .budget-amount-small {
    font-size: 16px;
    font-weight: 600;
    opacity: 0.7;
    color: rgba(255, 255, 255, 0.8);
  }

  .overview-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
    position: relative;
    z-index: 2;
  }

  .metric-card {
    text-align: center;
    padding: 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    transition: all 0.3s ease;
  }

  .metric-card:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }

  .metric-label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .metric-value {
    color: white;
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
  }

  .metric-value.remaining {
    color: white;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Hero Progress */
  .budget-progress {
    margin-top: auto;
  }

  .progress-container-hero {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 2;
  }

  .progress-track {
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .progress-fill-hero {
    height: 100%;
    border-radius: 4px;
    transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .progress-healthy {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  }

  .progress-warning {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  }

  .progress-danger {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .progress-percentage {
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    color: white;
  }

  .progress-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    opacity: 0.9;
  }

  .hero-emoji {
    font-size: 16px;
  }

  .hero-message {
    font-weight: 600;
    font-size: 14px;
  }

  /* Hero Summary */
  .hero-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .remaining-amount {
    font-size: 16px;
    font-weight: 700;
    color: white;
  }

  .reset-info {
    font-size: 14px;
    font-weight: 500;
    opacity: 0.7;
    color: rgba(255, 255, 255, 0.8);
  }

  /* Add Category Form Styles */
  .add-category-form {
    margin-bottom: 1.5rem;
    padding: 1.5rem;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .form-header h4 {
    color: #1e293b;
    margin: 0;
  }

  .close-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #64748b;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #1e293b;
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    color: #1e293b;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }


  .btn-secondary, .btn-primary {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    font-size: 0.9rem;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #1e293b;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
    color: white;
    border: 1px solid var(--primary-accent);
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(var(--primary-accent-rgb), 0.3);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Enhanced focus states for accessibility */
  .period-selector:focus,
  .add-category-btn:focus,
  .btn-secondary:focus,
  .btn-primary:focus {
    outline: 2px solid var(--primary-accent);
    outline-offset: 2px;
  }

  /* ===== MOBILE OPTIMIZATION ===== */
  @media (max-width: 768px) {
    .budget-header {
      padding: 1rem 1rem 0.5rem 1rem;
    }

    .header-content {
      gap: 0.75rem;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .period-selector {
      margin-top: 0.5rem;
    }

    .period-label {
      font-size: 0.75rem;
      margin-bottom: 0.4rem;
    }

    .period-card {
      padding: 0.6rem 0.8rem;
      font-size: 0.8rem;
    }

    .period-icon {
      font-size: 0.9rem;
    }

    .budget-content-grid {
      gap: 12px;
      padding: 12px;
    }

    /* Hero card mobile optimization */
    .hero-budget-card {
      padding: 24px;
      min-height: 280px;
    }

    .hero-title {
      font-size: 20px;
    }

    .main-amount-large {
      font-size: 28px;
    }

    .amount-separator {
      font-size: 18px;
    }

    .budget-amount-small {
      font-size: 14px;
    }

    /* Empty state mobile optimization */
    .enhanced-empty-card {
      padding: 2rem 1.5rem;
    }

    .empty-icon {
      font-size: 3rem;
    }

    .empty-title {
      font-size: 1.25rem;
    }

    .empty-description {
      font-size: 0.9rem;
    }

    .floating-cta-button {
      padding: 0.875rem 1.75rem;
      font-size: 0.95rem;
    }

    /* Categories section mobile optimization */
    .categories-header {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }

    .add-category-btn {
      justify-content: center;
      width: 100%;
    }

    .section-title {
      font-size: 1.125rem;
    }
  }

  /* Extra small mobile */
  @media (max-width: 430px) {
    .budget-header {
      padding: 16px 16px 12px 16px;
    }

    .page-title-section {
      margin-bottom: 12px;
    }

    .page-title {
      font-size: 24px;
    }

    .budget-content-grid {
      gap: 12px;
      padding: 12px;
    }

    .hero-budget-card {
      padding: 20px;
      min-height: 260px;
    }

    .hero-title {
      font-size: 18px;
    }

    .main-amount-large {
      font-size: 24px;
    }

    .amount-separator {
      font-size: 16px;
    }

    .budget-amount-small {
      font-size: 13px;
    }

    .progress-percentage {
      font-size: 16px;
    }

    .hero-message {
      font-size: 13px;
    }

    .remaining-amount {
      font-size: 14px;
    }

    .reset-info {
      font-size: 12px;
    }
  }

  /* Enhanced Mobile Background - Following Design System */
  @media (max-width: 768px) {
    .budget-page-container {
      background:
        radial-gradient(circle at 30% 20%, rgba(0, 191, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 70% 80%, rgba(30, 144, 255, 0.06) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(0, 123, 255, 0.04) 0%, transparent 30%),
        linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
    }

    .budget-page-container::before {
      background-image:
        radial-gradient(circle at 20% 30%, rgba(0, 191, 255, 0.06) 0%, transparent 25%),
        radial-gradient(circle at 80% 70%, rgba(30, 144, 255, 0.05) 0%, transparent 25%),
        radial-gradient(circle at 50% 10%, rgba(0, 123, 255, 0.04) 0%, transparent 20%);
    }
  }

  /* Extra small mobile background enhancement */
  @media (max-width: 430px) {
    .budget-page-container {
      background:
        radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.1) 0%, transparent 35%),
        radial-gradient(circle at 75% 75%, rgba(30, 144, 255, 0.08) 0%, transparent 35%),
        linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%);
    }

    .budget-page-container::before {
      background-image:
        radial-gradient(circle at 15% 40%, rgba(0, 191, 255, 0.08) 0%, transparent 20%),
        radial-gradient(circle at 85% 60%, rgba(30, 144, 255, 0.06) 0%, transparent 20%);
    }
  }

  /* Desktop and Tablet Layout */
  @media (min-width: 768px) {
    .header-content {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }

    .page-title-section {
      flex: 0 0 auto;
    }

    .period-selector {
      flex: 0 0 auto;
      align-items: flex-end;
      text-align: right;
      min-width: 200px;
    }

    .period-label {
      text-align: right;
    }

    .period-card {
      width: auto;
      min-width: 180px;
      justify-content: center;
    }
  }

  /* Smooth transitions for better UX */
  * {
    transition: all 0.3s ease;
  }
</style>