// ========================================
// DuitTrack - Main Application Controller
// Handles routing, page management, and initialization
// ========================================

class DuitTrackApp {
  constructor() {
    this.currentPage = 'landing';
    this.isAuthenticated = false;
    this.currentUser = null;
    
    this.init();
  }
  
  init() {
    console.log('🚀 DuitTrack App initializing...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupApp());
    } else {
      this.setupApp();
    }
  }
  
  setupApp() {
    console.log('📱 Setting up app components...');
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup navigation
    this.setupNavigation();
    
    // Setup modals
    this.setupModals();
    
    // Setup number formatting
    this.setupNumberInputs();
    
    // Initialize page routing
    this.initializeRouting();
    
    // Auto-refresh removed for better performance
    
    console.log('✅ App setup completed');
  }
  
  setupEventListeners() {
    // Menu toggle (dropdown)
    const menuToggle = document.getElementById('menuToggle');
    const menuDropdown = document.getElementById('menuDropdown');
    
    console.log('🔧 Setting up event listeners...');
    console.log('📱 MenuToggle found:', !!menuToggle);
    console.log('📋 MenuDropdown found:', !!menuDropdown);
    
    if (menuToggle) {
      menuToggle.addEventListener('click', (e) => {
        console.log('🖱️ Hamburger clicked');
        e.stopPropagation();
        this.toggleDropdown();
      });
    } else {
      console.error('❌ menuToggle element not found');
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (menuDropdown && !menuDropdown.contains(e.target)) {
        this.closeDropdown();
      }
      
      // Close user dropdown when clicking outside
      const userLoginDropdown = document.getElementById('userLoginDropdown');
      const userAvatar = document.getElementById('userAvatar');
      if (userLoginDropdown && userAvatar && 
          !userLoginDropdown.contains(e.target) && 
          !userAvatar.contains(e.target)) {
        this.closeUserDropdown();
      }
    });
    
    // Google login buttons
    const googleLoginBtn = document.getElementById('googleLogin');
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', () => this.handleGoogleLogin());
    }
    
    const dropdownGoogleLoginBtn = document.getElementById('dropdownGoogleLogin');
    if (dropdownGoogleLoginBtn) {
      dropdownGoogleLoginBtn.addEventListener('click', () => this.handleGoogleLogin());
    }
    
    // User avatar dropdown
    const userAvatar = document.getElementById('userAvatar');
    const userLoginDropdown = document.getElementById('userLoginDropdown');
    console.log('🔧 Avatar found:', !!userAvatar);
    console.log('🔧 Dropdown found:', !!userLoginDropdown);
    
    if (userAvatar && userLoginDropdown) {
      userAvatar.addEventListener('click', (e) => {
        console.log('🖱️ Avatar clicked!');
        e.stopPropagation();
        this.toggleUserDropdown();
      });
      console.log('✅ Avatar click listener attached');
    } else {
      console.error('❌ Avatar or dropdown element not found');
    }
    
    // Add expense card
    const addExpenseCard = document.getElementById('addExpenseCard');
    if (addExpenseCard) {
      addExpenseCard.addEventListener('click', () => this.openAddExpenseModal());
    }
    
    // Month selector
    const monthSelector = document.getElementById('monthSelector');
    if (monthSelector) {
      monthSelector.addEventListener('change', (e) => this.handleMonthChange(e.target.value));
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }
  
  setupNavigation() {
    // Dropdown navigation
    const dropdownItems = document.querySelectorAll('.dropdown-items a[data-page]');
    dropdownItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateTo(page);
        this.closeDropdown();
      });
    });
    
    // Logout handling
    const logoutBtn = document.querySelector('a[data-action=\"logout\"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
  }
  
  setupModals() {
    // Add expense modal
    const modal = document.getElementById('addExpenseModal');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeModal());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
    
    // DISABLED: ExpenseManager now handles form submission
    // const expenseForm = document.getElementById('expenseForm');
    // if (expenseForm) {
    //   expenseForm.addEventListener('submit', (e) => {
    //     e.preventDefault();
    //     this.handleExpenseSubmit();
    //   });
    // }
  }
  
  setupNumberInputs() {
    // Format budget inputs in onboarding
    const budgetInputs = document.querySelectorAll('.category-budget-input');
    budgetInputs.forEach(input => {
      this.setupNumberFormatting(input);
    });
    
    // Format expense amount input
    const expenseAmountInput = document.getElementById('expenseAmount');
    if (expenseAmountInput) {
      this.setupNumberFormatting(expenseAmountInput);
    }
  }
  
  initializeRouting() {
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      const page = e.state?.page || 'dashboard';
      this.showPage(page, false);
    });
    
    // Set initial route
    const hash = window.location.hash.substring(1);
    if (hash && this.isAuthenticated) {
      this.navigateTo(hash, false);
    }
  }
  
  // Auto-refresh functionality removed for better performance
  
  // Page Management
  showPage(pageId, addToHistory = true) {
    console.log(`📄 Showing page: ${pageId}`);
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(`${pageId}Page`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = pageId;
      
      // Update URL
      if (addToHistory) {
        const url = pageId === 'landing' ? '/' : `/#${pageId}`;
        history.pushState({ page: pageId }, '', url);
      }
      
      // Load page-specific data
      this.loadPageData(pageId);
    } else {
      console.warn(`Page not found: ${pageId}`);
    }
  }
  
  navigateTo(pageId, addToHistory = true) {
    if (!this.isAuthenticated && pageId !== 'landing') {
      console.warn('Authentication required for page:', pageId);
      this.showPage('landing', addToHistory);
      return;
    }
    
    this.showPage(pageId, addToHistory);
  }
  
  loadPageData(pageId) {
    switch (pageId) {
      case 'dashboard':
        if (window.DashboardManager) {
          window.DashboardManager.loadDashboard();
        }
        break;
      case 'expenses':
        if (window.ExpenseManager) {
          window.ExpenseManager.loadExpenses();
        }
        break;
      case 'budget':
        // Budget management will be implemented in future versions
        console.log('Budget page selected');
        break;
    }
  }
  
  // Authentication Methods
  async handleGoogleLogin() {
    console.log('🔐 Attempting Google login...');
    
    // Close dropdown immediately when login button is clicked
    this.closeUserDropdown();
    
    // Get all login buttons
    const mainButton = document.getElementById('googleLogin');
    const dropdownButton = document.getElementById('dropdownGoogleLogin');
    
    // Set loading state for all buttons
    this.setLoginButtonsLoading(true);
    
    try {
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      
      console.log('✅ Login successful:', user.email);
      
      // Create/update user profile
      await this.createUserProfile(user);
      
      // Don't call setAuthenticationState here - let firebase-config.js handle routing
      // based on onboarding status via auth.onAuthStateChanged observer
      
      // Reset button states (though user will be redirected)
      this.setLoginButtonsLoading(false);
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Check if user cancelled the popup
      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request') {
        console.log('👤 User cancelled login');
      } else {
        this.showError('Login failed: ' + error.message);
      }
      
      // Always reset button states on error
      this.setLoginButtonsLoading(false);
    }
  }
  
  async handleLogout() {
    console.log('🚪 Logging out...');
    
    // Close any open dropdowns first
    this.closeDropdown();
    this.closeUserDropdown();
    
    try {
      await auth.signOut();
      this.setAuthenticationState(false, null);
      
      // Ensure login buttons are reset
      this.setLoginButtonsLoading(false);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      this.showError('Logout failed: ' + error.message);
      
      // Reset button states even on logout error
      this.setLoginButtonsLoading(false);
    }
  }
  
  async createUserProfile(user) {
    try {
      const userRef = FirebaseUtils.getUserProfileRef(user.uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        await userRef.set({
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ User profile created');
      } else {
        await userRef.update({
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ User profile updated');
      }
    } catch (error) {
      console.error('❌ Failed to create/update user profile:', error);
    }
  }
  
  setAuthenticationState(isAuthenticated, user) {
    this.isAuthenticated = isAuthenticated;
    this.currentUser = user;
    
    if (isAuthenticated) {
      this.showDashboard();
      this.updateUserUI(user);
    } else {
      // Ensure all dropdowns are closed when logging out
      this.closeDropdown();
      this.closeUserDropdown();
      this.showLanding();
      this.clearUserUI();
    }
  }
  
  updateUserUI(user) {
    const userAvatar = document.getElementById('userAvatar');
    const userLoginDropdown = document.getElementById('userLoginDropdown');
    
    if (userAvatar && user.photoURL) {
      userAvatar.src = user.photoURL;
      userAvatar.alt = user.displayName || 'User';
    }
    
    // Hide login dropdown when user is authenticated
    if (userLoginDropdown) {
      userLoginDropdown.style.display = 'none';
    }
  }
  
  clearUserUI() {
    const userAvatar = document.getElementById('userAvatar');
    const userLoginDropdown = document.getElementById('userLoginDropdown');
    
    if (userAvatar) {
      userAvatar.src = 'assets/images/default-avatar.svg';
      userAvatar.alt = 'User';
    }
    
    // Show login dropdown when user is not authenticated
    if (userLoginDropdown) {
      userLoginDropdown.style.display = 'block';
    }
    
    // Reset login button states to normal
    this.setLoginButtonsLoading(false);
  }
  
  // Page Display Methods
  showLanding() {
    this.hideLoading();
    this.showPage('landing');
  }
  
  showDashboard() {
    this.hideLoading();
    this.showPage('dashboard');
    
    // Trigger dashboard loading after showing the page
    setTimeout(() => {
      if (window.DashboardManager) {
        window.DashboardManager.loadDashboard();
      }
    }, 100);
  }
  
  showBudgetOnboarding() {
    this.hideLoading();
    this.showPage('budgetOnboarding');
    this.updateBudgetPeriodInfo();
    this.setupWelcomeCardClose();
    // All onboarding logic handled by simple-onboarding.js
    console.log('📄 Onboarding page shown - using simple-onboarding.js');
  }
  
  updateBudgetPeriodInfo() {
    const budgetPeriodElement = document.getElementById('budgetPeriodInfo');
    if (budgetPeriodElement) {
      const now = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();
      budgetPeriodElement.textContent = `Budget Period: ${currentMonth} ${currentYear}`;
    }
  }
  
  setupWelcomeCardClose() {
    const closeBtn = document.getElementById('welcomeCloseBtn');
    const welcomeCard = document.querySelector('.onboarding-header');
    const formCard = document.querySelector('.budget-setup-card');
    
    if (closeBtn && welcomeCard && formCard) {
      // Always show welcome card on page load (reset any previous state)
      console.log('🎯 Setting up welcome card - always visible on load');
      welcomeCard.style.display = 'block';
      formCard.style.display = 'block'; // Ensure form card is visible
      
      closeBtn.addEventListener('click', () => {
        console.log('🔄 Welcome card close clicked');
        
        // Simple fade out animation for welcome card
        welcomeCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        welcomeCard.style.opacity = '0';
        welcomeCard.style.transform = 'translateY(-20px)';
        
        // After animation completes, hide welcome card completely
        setTimeout(() => {
          welcomeCard.style.display = 'none';
          // Ensure form card stays visible and accessible
          formCard.style.display = 'block';
          formCard.style.opacity = '1';
          formCard.style.transform = 'translateY(0)';
          
          console.log('✅ Welcome card hidden, form card active');
        }, 300);
      });
    }
  }
  
  // Category library managed by simple-onboarding.js for better separation of concerns
  
  // Suggestion system handled by simple-onboarding.js for better separation
  
  // Category button setup handled by simple-onboarding.js
  
  // All category form management handled by simple-onboarding.js for better organization

  setupBudgetOnboardingForm() {
    const form = document.getElementById('budgetOnboardingForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBudgetFormSubmit();
      });
    }

    const skipBtn = document.getElementById('skipBudgetBtn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.skipBudgetSetup();
      });
    }
  }

  async handleBudgetFormSubmit() {
    try {
      console.log('📊 Submitting budget onboarding form...');
      
      // Check authentication
      if (!window.auth?.currentUser) {
        throw new Error('Please sign in to continue');
      }

      // Collect budget data from categories
      const budgetData = {
        totalBudget: this.userCategories.reduce((sum, cat) => sum + cat.budget, 0),
        categories: {},
        month: this.getCurrentMonth(),
        createdAt: new Date().toISOString()
      };

      // Convert categories format
      this.userCategories.forEach(category => {
        const categoryKey = category.sourceKey || category.name.toLowerCase();
        budgetData.categories[categoryKey] = {
          budget: category.budget,
          spent: 0
        };
      });

      // Improved validation - more user friendly
      if (this.userCategories.length === 0) {
        alert('Please add at least one category first');
        return;
      }
      
      // Allow zero budget categories - user can setup budget later
      console.log('💰 Total budget:', budgetData.totalBudget);

      // Save to Firestore
      const userId = window.auth.currentUser.uid;
      const budgetRef = window.db.collection('users').doc(userId).collection('budgets').doc(budgetData.month);
      
      await budgetRef.set(budgetData);
      
      // Mark onboarding complete
      const userProfileRef = window.db.collection('users').doc(userId);
      await userProfileRef.set({
        onboardingComplete: true,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log('✅ Budget setup completed successfully!');
      
      // Go to dashboard
      this.showDashboard();
      
    } catch (error) {
      console.error('❌ Error completing budget setup:', error);
      alert('Error: ' + (error.message || 'Failed to save budget'));
    }
  }

  async skipBudgetSetup() {
    try {
      if (!window.auth?.currentUser) {
        throw new Error('Please sign in first');
      }

      // Mark user as onboarded without budget setup
      const userId = window.auth.currentUser.uid;
      const userProfileRef = window.db.collection('users').doc(userId);
      await userProfileRef.set({
        onboardingComplete: true,
        skippedBudgetSetup: true,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log('✅ Budget setup skipped, proceeding to dashboard');
      this.showDashboard();

    } catch (error) {
      console.error('❌ Error skipping budget setup:', error);
      alert('Error: ' + (error.message || 'Failed to skip setup'));
    }
  }

  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
  
  // UI Interaction Methods
  toggleDropdown() {
    console.log('🔄 Toggle dropdown clicked');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuToggle = document.getElementById('menuToggle');
    
    if (menuDropdown) {
      const isActive = menuDropdown.classList.toggle('active');
      
      // Toggle hamburger icon to X
      if (menuToggle) {
        if (isActive) {
          menuToggle.classList.add('active');
        } else {
          menuToggle.classList.remove('active');
        }
      }
      
      console.log('📱 Dropdown classes:', menuDropdown.classList.toString());
      console.log('🍔 Menu toggle classes:', menuToggle?.classList.toString());
    } else {
      console.error('❌ menuDropdown element not found');
    }
  }
  
  closeDropdown() {
    const menuDropdown = document.getElementById('menuDropdown');
    const menuToggle = document.getElementById('menuToggle');
    
    if (menuDropdown) {
      menuDropdown.classList.remove('active');
    }
    
    // Reset hamburger icon
    if (menuToggle) {
      menuToggle.classList.remove('active');
    }
  }
  
  toggleUserDropdown() {
    console.log('🔄 toggleUserDropdown called');
    const userLoginDropdown = document.getElementById('userLoginDropdown');
    console.log('🔧 Dropdown element:', userLoginDropdown);
    
    if (userLoginDropdown) {
      userLoginDropdown.classList.toggle('active');
      console.log('🔄 User dropdown toggled, classes:', userLoginDropdown.classList.toString());
    } else {
      console.error('❌ userLoginDropdown not found in toggle method');
    }
  }
  
  closeUserDropdown() {
    const userLoginDropdown = document.getElementById('userLoginDropdown');
    if (userLoginDropdown) {
      userLoginDropdown.classList.remove('active');
    }
  }
  
  setLoginButtonsLoading(loading) {
    const mainButton = document.getElementById('googleLogin');
    const dropdownButton = document.getElementById('dropdownGoogleLogin');
    
    if (mainButton) {
      if (loading) {
        mainButton.disabled = true;
        mainButton.innerHTML = '<div class="loading-spinner"></div> Signing in...';
      } else {
        mainButton.disabled = false;
        mainButton.innerHTML = '<img src="assets/images/google-icon.svg" alt="Google" class="google-icon"> Get Started with Google';
      }
    }
    
    if (dropdownButton) {
      if (loading) {
        dropdownButton.disabled = true;
        dropdownButton.innerHTML = '<div class="loading-spinner"></div> Signing in...';
      } else {
        dropdownButton.disabled = false;
        dropdownButton.innerHTML = '<img src="assets/images/google-icon.svg" alt="Google" class="google-icon"> Sign in with Google';
      }
    }
  }
  
  openAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
      modal.classList.add('active');
      
      // Set today's date as default
      const dateInput = document.getElementById('expenseDate');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
      
      // Focus amount input
      const amountInput = document.getElementById('expenseAmount');
      if (amountInput) {
        setTimeout(() => amountInput.focus(), 100);
      }
    }
  }
  
  closeModal() {
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
      modal.classList.remove('active');
      
      // Reset form
      const form = document.getElementById('expenseForm');
      if (form) {
        form.reset();
      }
    }
  }
  
  // DISABLED: ExpenseManager now handles all expense submission and validation
  // async handleExpenseSubmit() {
  //   console.log('💰 Submitting expense...');
  //   
  //   const form = document.getElementById('expenseForm');
  //   const submitBtn = form.querySelector('button[type=\"submit\"]');
  //   
  //   if (submitBtn) {
  //     submitBtn.disabled = true;
  //     submitBtn.innerHTML = 'Menyimpan...';
  //   }
  //   
  //   try {
  //     const formData = new FormData(form);
  //     const amountValue = document.getElementById('expenseAmount').value;
  //     const expense = {
  //       amount: this.unformatNumber(amountValue),
  //       category: document.getElementById('expenseCategory').value,
  //       description: document.getElementById('expenseDescription').value || '',
  //       date: document.getElementById('expenseDate').value,
  //       month: document.getElementById('expenseDate').value.substring(0, 7) // YYYY-MM
  //     };
  //     
  //     // Validate data
  //     if (!expense.amount || !expense.category || !expense.date) {
  //       throw new Error('Please fill in all required fields');
  //     }
  //     
  //     if (expense.amount <= 0) {
  //       throw new Error('Amount must be greater than 0');
  //     }
  //     
  //     // Save expense
  //     if (window.ExpenseManager) {
  //       await window.ExpenseManager.createExpense(expense);
  //       this.showSuccess('Expense saved successfully!');
  //       this.closeModal();
  //       
  //       // Refresh dashboard if visible
  //       if (this.currentPage === 'dashboard') {
  //         this.refreshDashboardData();
  //       }
  //     } else {
  //       throw new Error('ExpenseManager not available');
  //     }
  //     
  //   } catch (error) {
  //     console.error('❌ Failed to save expense:', error);
  //     this.showError(error.message);
  //   } finally {
  //     if (submitBtn) {
  //       submitBtn.disabled = false;
  //       submitBtn.innerHTML = 'Simpan';
  //     }
  //   }
  // }
  
  handleMonthChange(month) {
    console.log('📅 Month changed to:', month);
    // Manual refresh only, no auto-refresh
  }
  
  handleKeyboard(e) {
    // ESC key - close modals/dropdown
    if (e.key === 'Escape') {
      this.closeModal();
      this.closeDropdown();
      this.closeUserDropdown();
    }
    
    // Ctrl/Cmd + N - new expense (when authenticated)
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && this.isAuthenticated) {
      e.preventDefault();
      this.openAddExpenseModal();
    }
  }
  
  // Data Refresh Methods - simplified for better performance
  // Only refresh when explicitly needed (e.g., after expense added)
  
  // Loading Management
  hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 300);
    }
  }
  
  // Number Formatting Methods
  formatNumber(num) {
    if (!num) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  
  unformatNumber(str) {
    if (!str) return 0;
    return parseInt(str.replace(/\./g, '')) || 0;
  }
  
  setupNumberFormatting(inputElement) {
    if (!inputElement) return;
    
    inputElement.addEventListener('input', (e) => {
      const value = e.target.value;
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = this.formatNumber(numericValue);
      e.target.value = formattedValue;
      
      // Trigger budget calculation if it's a budget input
      if (e.target.classList.contains('category-budget-input')) {
        this.updateTotalBudget();
      }
    });
    
    inputElement.addEventListener('blur', (e) => {
      const value = e.target.value;
      if (value) {
        const numericValue = value.replace(/[^\d]/g, '');
        e.target.value = this.formatNumber(numericValue);
        
        // Trigger budget calculation if it's a budget input
        if (e.target.classList.contains('category-budget-input')) {
          this.updateTotalBudget();
        }
      }
    });
  }

  // Notification Methods
  showSuccess(message) {
    this.showNotification(message, 'success');
  }
  
  showError(message) {
    this.showNotification(message, 'error');
  }
  
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification glass-card ${type}`;
    notification.innerHTML = `
      <div class=\"notification-content\">
        <span class=\"notification-message\">${message}</span>
        <button class=\"notification-close\">&times;</button>
      </div>
    `;
    
    // Add styles if not exist
    if (!document.getElementById('notificationStyles')) {
      const style = document.createElement('style');
      style.id = 'notificationStyles';
      style.textContent = `
        .notification {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3000;
          min-width: 300px;
          max-width: 400px;
          animation: slideDown 0.3s ease;
        }
        .notification.success { border-left: 4px solid var(--safe-color); }
        .notification.error { border-left: 4px solid var(--danger-color); }
        .notification.info { border-left: 4px solid var(--primary-accent); }
        .notification-content { display: flex; justify-content: space-between; align-items: center; }
        .notification-close { 
          background: none; border: none; color: var(--text-secondary); 
          cursor: pointer; font-size: 1.2rem; padding: 0 0.5rem;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(notification);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }
}

// Global functions for use by Firebase auth observer
window.showLanding = () => {
  if (window.app) {
    window.app.showLanding();
  }
};

window.showDashboard = () => {
  if (window.app) {
    window.app.showDashboard();
  }
};

window.showBudgetOnboarding = () => {
  if (window.app) {
    window.app.showBudgetOnboarding();
  }
};

window.loadUserData = () => {
  // Load user data when needed, no auto-refresh
  console.log('📊 Load user data called');
};

// Initialize app when script loads
console.log('🌟 DuitTrack App script loaded');
window.app = new DuitTrackApp();