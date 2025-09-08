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
    
    // Setup periodic data refresh
    this.setupDataRefresh();
    
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
  
  setupDataRefresh() {
    // Refresh dashboard data every 30 seconds when active
    setInterval(() => {
      if (this.currentPage === 'dashboard' && this.isAuthenticated) {
        this.refreshDashboardData();
      }
    }, 30000);
    
    // Refresh on page focus
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isAuthenticated) {
        this.refreshCurrentPageData();
      }
    });
  }
  
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
  
  setupCustomCategories() {
    // All custom categories logic handled by simple-onboarding.js
    console.log('📄 Custom categories managed by simple-onboarding.js');
    return;
  }
  
  initCategoryLibrary() {
    this.categoryLibrary = {
      // Daily needs (same as inline script to maintain consistency)
      'makan': { emoji: '🍽️', desc: 'Makan sehari-hari, restoran' },
      'transport': { emoji: '🚗', desc: 'Bensin, ojek, bus, grab' },
      'listrik': { emoji: '⚡', desc: 'Listrik, air, internet' },
      'belanja': { emoji: '🛒', desc: 'Groceries, kebutuhan harian' },
      'jajan': { emoji: '🍿', desc: 'Snack, minuman, coffee' },
      'hiburan': { emoji: '🎮', desc: 'Cinema, game, hobi' },
      
      // Additional categories
      'air': { emoji: '💧', desc: 'PDAM, air mineral' },
      'internet': { emoji: '📶', desc: 'WiFi, paket data' },
      'pulsa': { emoji: '📱', desc: 'Pulsa, paket HP' },
      'kesehatan': { emoji: '💊', desc: 'Obat, dokter, vitamin' },
      'kecantikan': { emoji: '💄', desc: 'Skincare, makeup, salon' },
      'tabungan': { emoji: '💰', desc: 'Dana darurat, investasi' },
      'hadiah': { emoji: '🎁', desc: 'Kado, gifts, donasi' }
    };
    
    // Popular suggestions for quick buttons (same as inline script)
    this.popularCategories = ['makan', 'transport', 'listrik', 'belanja', 'jajan', 'hiburan'];
  }
  
  detectEmojiFromName(name) {
    if (!name) return '💰';
    
    const lowercaseName = name.toLowerCase();
    
    // Direct match
    if (this.categoryLibrary[lowercaseName]) {
      return this.categoryLibrary[lowercaseName].emoji;
    }
    
    // Fuzzy matching
    for (const [key, value] of Object.entries(this.categoryLibrary)) {
      if (lowercaseName.includes(key) || key.includes(lowercaseName)) {
        return value.emoji;
      }
    }
    
    // Additional fuzzy patterns
    const patterns = {
      '🚗': ['transportasi', 'kendaraan', 'bensin', 'motor', 'mobil'],
      '🍽️': ['makanan', 'food', 'nasi', 'lauk'],
      '🏠': ['rumah', 'sewa', 'kost', 'kontrakan'],
      '👕': ['baju', 'pakaian', 'fashion', 'sepatu'],
      '🎓': ['pendidikan', 'sekolah', 'kuliah', 'kursus'],
      '💊': ['obat', 'dokter', 'hospital', 'medis']
    };
    
    for (const [emoji, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => lowercaseName.includes(keyword))) {
        return emoji;
      }
    }
    
    return '💰'; // default
  }
  
  setupCategorySuggestions() {
    // Initial suggestions display
    this.updateSuggestionsDisplay();
  }
  
  selectSuggestion(categoryKey, category) {
    console.log('🎯 selectSuggestion called with:', categoryKey, category);
    
    // UX Improvement: Add category with default budget (no popup) and smoother focus
    const newCategory = {
      id: 'cat_' + Date.now(),
      icon: category.emoji,
      name: this.capitalizeFirst(categoryKey),
      description: category.desc,
      budget: 0,  // User can edit later directly in the input
      sourceKey: categoryKey  // Track which suggestion this came from
    };
    
    console.log('➕ Adding new category:', newCategory);
    
    this.userCategories.push(newCategory);
    this.updateCategoriesDisplay();
    // Keep suggestions visible for better UX - suggestions persist for easy multi-selection
    this.updateSuggestionsDisplay();
    this.updateTotalBudget();
    
    // Auto-focus on the budget input of newly created category with smooth scroll
    requestAnimationFrame(() => {
      const categoryElement = document.querySelector(`[data-category-id="${newCategory.id}"]`);
      if (categoryElement) {
        const budgetInput = categoryElement.querySelector('.category-budget-input');
        if (budgetInput) {
          // Smooth scroll to new category
          categoryElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Focus after scroll animation
          setTimeout(() => {
            budgetInput.focus();
            budgetInput.select();
          }, 300);
        }
      }
    });
  }
  
  updateSuggestionsDisplay() {
    console.log('🔄 Updating suggestions display...');
    const container = document.getElementById('suggestionButtons');
    console.log('📦 Container found:', container);
    if (!container) {
      console.error('❌ suggestionButtons container not found!');
      return;
    }
    
    // CRITICAL: Don't setup event delegation on onboarding page 
    // simple-onboarding.js handles its own events
    const onboardingPage = document.getElementById('budgetOnboardingPage');
    const isOnboardingActive = onboardingPage && onboardingPage.classList.contains('active');
    
    if (!isOnboardingActive && !container.hasAttribute('data-delegated')) {
      container.addEventListener('click', this.handleSuggestionClick.bind(this));
      container.setAttribute('data-delegated', 'true');
      console.log('✅ App.js event delegation setup (NOT on onboarding)');
    } else if (isOnboardingActive) {
      console.log('🚫 App.js event delegation skipped - onboarding active');
    }
    
    // Performance: Use DocumentFragment for batch updates
    const fragment = document.createDocumentFragment();
    
    // Get already selected category keys
    const selectedKeys = this.userCategories
      .filter(cat => cat.sourceKey)
      .map(cat => cat.sourceKey);
    console.log('📝 Selected keys:', selectedKeys);
    
    // Create suggestion buttons for unselected categories
    this.popularCategories.forEach(categoryKey => {
      if (!selectedKeys.includes(categoryKey)) {
        const category = this.categoryLibrary[categoryKey];
        if (category) {
          const button = document.createElement('button');
          button.className = 'suggestion-btn';
          button.dataset.categoryKey = categoryKey; // Use data attribute for event delegation
          button.innerHTML = `<span class="emoji">${category.emoji}</span><span>${this.capitalizeFirst(categoryKey)}</span>`;
          
          // Move styles to CSS class instead of inline for better performance
          button.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            color: #ffffff;
            padding: 12px 16px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin: 4px;
            transition: all 0.2s ease;
          `;
          
          console.log('✨ Creating suggestion button for:', categoryKey);
          fragment.appendChild(button);
        }
      }
    });
    
    // Single DOM update
    container.innerHTML = '';
    container.appendChild(fragment);
    
    console.log('✅ Suggestions updated. Button count:', container.children.length);
  }
  
  handleSuggestionClick(e) {
    const button = e.target.closest('.suggestion-btn');
    if (!button) return;
    
    // CRITICAL: Prevent app.js suggestion handling on onboarding page
    // simple-onboarding.js handles onboarding suggestions exclusively
    const onboardingPage = document.getElementById('budgetOnboardingPage');
    if (onboardingPage && onboardingPage.classList.contains('active')) {
      console.log('📄 Using simple-onboarding.js for suggestions on onboarding page');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const categoryKey = button.dataset.categoryKey;
    const category = this.categoryLibrary[categoryKey];
    
    if (category) {
      console.log('🔥 Suggestion button clicked:', categoryKey);
      this.selectSuggestion(categoryKey, category);
    }
  }
  
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  setupAddCategoryButton() {
    console.log('🔧 Setting up Add Category Button...');
    const addBtn = document.getElementById('addCategoryButton');
    console.log('🔘 Add Button found:', !!addBtn);
    
    if (addBtn) {
      // Remove any existing listeners
      addBtn.replaceWith(addBtn.cloneNode(true));
      const newBtn = document.getElementById('addCategoryButton');
      
      newBtn.addEventListener('click', () => {
        console.log('➕ Add category button clicked!');
        this.createDynamicAddForm();
      });
      console.log('✅ Add Category button listener attached');
    } else {
      console.error('❌ Add Category button not found!');
    }
  }
  
  setupAddCategoryForm() {
    console.log('🔧 Setting up Add Category Form...');
    const saveBtn = document.getElementById('saveAddCategory');
    const cancelBtn = document.getElementById('cancelAddCategory');
    const budgetInput = document.getElementById('newCategoryBudget');
    const nameInput = document.getElementById('newCategoryName');
    const emojiDisplay = document.getElementById('autoEmojiDisplay');
    
    console.log('🔘 Form elements found:', {
      saveBtn: !!saveBtn,
      cancelBtn: !!cancelBtn,
      budgetInput: !!budgetInput,
      nameInput: !!nameInput,
      emojiDisplay: !!emojiDisplay
    });
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        console.log('💾 Save button clicked');
        this.saveNewCategory();
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('❌ Cancel button clicked');
        this.hideAddCategoryForm();
      });
    }
    
    if (budgetInput) {
      budgetInput.addEventListener('input', (e) => {
        e.target.value = this.formatNumber(e.target.value.replace(/\./g, ''));
        this.updateTotalBudget();
      });
    }
    
    // Real-time emoji detection
    if (nameInput && emojiDisplay) {
      nameInput.addEventListener('input', (e) => {
        const detectedEmoji = this.detectEmojiFromName(e.target.value);
        emojiDisplay.textContent = detectedEmoji;
      });
    }
    
    console.log('✅ Add Category form setup completed');
  }
  
  showAddCategoryForm() {
    console.log('🔄 Showing Add Category Form...');
    const form = document.getElementById('addCategoryForm');
    const addBtn = document.getElementById('addCategoryButton');
    
    console.log('📋 Elements found:', { 
      form: !!form, 
      formStyle: form?.style.display,
      addBtn: !!addBtn, 
      btnStyle: addBtn?.style.display 
    });
    
    if (form && addBtn) {
      // Force show form
      form.style.display = 'block !important';
      form.style.visibility = 'visible';
      form.classList.remove('hidden');
      
      // Hide button
      addBtn.style.display = 'none';
      
      // Clear form
      const nameInput = document.getElementById('newCategoryName');
      const descInput = document.getElementById('newCategoryDescription');
      const budgetInput = document.getElementById('newCategoryBudget');
      const emojiDisplay = document.getElementById('autoEmojiDisplay');
      
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      if (budgetInput) budgetInput.value = '';
      if (emojiDisplay) emojiDisplay.textContent = '💰';
      
      // Focus on first input
      setTimeout(() => {
        if (nameInput) {
          nameInput.focus();
          console.log('✅ Form shown and focused');
        }
      }, 100);
      
      console.log('📋 Form display after changes:', form.style.display);
    } else {
      console.error('❌ Form or button not found!');
    }
  }
  
  hideAddCategoryForm() {
    const form = document.getElementById('addCategoryForm');
    const addBtn = document.getElementById('addCategoryButton');
    
    if (form && addBtn) {
      form.style.display = 'none';
      addBtn.style.display = 'block';
    }
  }
  
  saveNewCategory() {
    const icon = document.getElementById('autoEmojiDisplay').textContent || '💰';
    const name = document.getElementById('newCategoryName').value.trim();
    const description = document.getElementById('newCategoryDescription').value.trim();
    const budgetText = document.getElementById('newCategoryBudget').value.replace(/\./g, '');
    const budget = parseInt(budgetText) || 0;
    
    if (!name) {
      alert('Please enter a category name');
      return;
    }
    
    // Check for duplicate names
    if (this.userCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      alert('Category name already exists');
      return;
    }
    
    const newCategory = {
      id: 'cat_' + Date.now(),
      icon: icon,
      name: name,
      description: description,
      budget: budget
    };
    
    this.userCategories.push(newCategory);
    console.log('✅ Category added:', newCategory);
    
    this.hideAddCategoryForm();
    this.updateCategoriesDisplay();
    this.updateTotalBudget();
  }
  
  deleteCategory(categoryId) {
    this.userCategories = this.userCategories.filter(cat => cat.id !== categoryId);
    console.log('🗑️ Category deleted:', categoryId);
    
    this.updateCategoriesDisplay();
    this.updateSuggestionsDisplay(); // Refresh suggestions (deleted category might become available again)
    this.updateTotalBudget();
  }
  
  updateCategoriesDisplay() {
    const container = document.getElementById('categoryBudgetsList');
    
    if (!container) return;
    
    // Performance optimization: Use DocumentFragment for batch DOM updates
    const fragment = document.createDocumentFragment();
    
    // Clear existing dynamic categories only if needed
    const existingCategories = container.querySelectorAll('.category-budget-item:not(#addCategoryForm)');
    const existingCount = existingCategories.length;
    const newCount = this.userCategories.length;
    
    // Only clear if count changed to avoid unnecessary DOM manipulation
    if (existingCount !== newCount) {
      existingCategories.forEach(item => item.remove());
      
      // Batch create all category elements
      this.userCategories.forEach(category => {
        const categoryElement = this.createCategoryElement(category);
        fragment.appendChild(categoryElement);
      });
      
      // Single DOM update
      const addForm = container.querySelector('#addCategoryForm');
      if (addForm) {
        container.insertBefore(fragment, addForm);
      } else {
        container.appendChild(fragment);
      }
    } else {
      // Update existing elements in place (more efficient)
      existingCategories.forEach((element, index) => {
        if (this.userCategories[index]) {
          this.updateCategoryElementInPlace(element, this.userCategories[index]);
        }
      });
    }
    
    // Update total budget display
    this.updateTotalBudget();
  }
  
  updateCategoryElementInPlace(element, category) {
    // Update icon
    const iconElement = element.querySelector('.category-icon');
    if (iconElement) iconElement.textContent = category.icon;
    
    // Update name
    const nameElement = element.querySelector('.category-name');
    if (nameElement) nameElement.textContent = category.name;
    
    // Update description
    const descElement = element.querySelector('.category-description');
    if (descElement) descElement.textContent = category.description;
    
    // Update budget input
    const budgetInput = element.querySelector('.category-budget-input');
    if (budgetInput) {
      const currentValue = this.unformatNumber(budgetInput.value);
      if (currentValue !== category.budget) {
        budgetInput.value = this.formatNumber(category.budget.toString());
      }
    }
  }

  createCategoryElement(category) {
    const div = document.createElement('div');
    div.className = 'category-budget-item improved-card';
    div.dataset.categoryId = category.id; // Add for easier targeting
    div.innerHTML = `
      <button class="delete-category-improved" onclick="window.app.deleteCategory('${category.id}')">×</button>
      <div class="category-info">
        <div class="category-icon">${category.icon}</div>
        <div class="category-details">
          <div class="category-name">${category.name}</div>
          <div class="category-description">${category.description}</div>
        </div>
      </div>
      <div class="budget-input-group">
        <input type="text" class="glass-input category-budget-input" placeholder="100.000" value="${this.formatNumber(category.budget.toString())}" onchange="window.app.updateCategoryBudget('${category.id}', this.value)">
        <span class="currency">Rp</span>
      </div>
    `;
    
    // Add inline styles to match reference design
    div.style.cssText = `
      position: relative;
      background: rgba(40, 44, 52, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    `;
    
    // Style the delete button
    const deleteBtn = div.querySelector('.delete-category-improved');
    if (deleteBtn) {
      deleteBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ff4757;
        border: none;
        color: white;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 10;
      `;
      
      // Add hover effects
      deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.background = '#ff3838';
        deleteBtn.style.transform = 'scale(1.1)';
      });
      
      deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.background = '#ff4757';
        deleteBtn.style.transform = 'scale(1)';
      });
    }
    
    return div;
  }
  
  updateCategoryBudget(categoryId, value) {
    const cleanValue = value.replace(/\./g, '');
    const numericValue = parseInt(cleanValue) || 0;
    
    const category = this.userCategories.find(cat => cat.id === categoryId);
    if (category) {
      category.budget = numericValue;
      
      // Format the input value
      const input = document.querySelector(`input[onchange*="${categoryId}"]`);
      if (input) {
        input.value = this.formatNumber(cleanValue);
      }
      
      this.updateTotalBudget();
    }
  }
  
  updateTotalBudget() {
    const total = this.userCategories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalElement = document.getElementById('totalAllocated');
    if (totalElement) {
      totalElement.textContent = `Rp ${this.formatNumber(total.toString())}`;
    }
  }

  createDynamicAddForm() {
    console.log('🔥 Creating dynamic add form...');
    const container = document.getElementById('categoryBudgetsList');
    const addButton = document.getElementById('addCategoryButton');
    
    if (!container || !addButton) {
      console.error('❌ Container or button not found');
      return;
    }
    
    // Remove existing dynamic form if any
    const existingForm = container.querySelector('.dynamic-add-form');
    if (existingForm) {
      existingForm.remove();
    }
    
    // Create new form - position after add button (bottom of list)
    const dynamicForm = document.createElement('div');
    dynamicForm.className = 'category-budget-item dynamic-add-form';
    dynamicForm.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
      animation: slideDown 0.3s ease;
    `;
    
    dynamicForm.innerHTML = `
      <div class="category-info">
        <div class="category-icon" id="dynamicEmojiDisplay">💰</div>
        <div class="category-details">
          <input type="text" id="dynamicCategoryName" class="glass-input" placeholder="Category name" style="margin-bottom: 8px; width: 100%;">
          <input type="text" id="dynamicCategoryDesc" class="glass-input" placeholder="Optional description" style="width: 100%;">
        </div>
      </div>
      <div class="budget-input-group">
        <input type="text" id="dynamicCategoryBudget" class="glass-input category-budget-input" placeholder="100.000">
        <span class="currency">Rp</span>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button id="dynamicCancel" class="btn-secondary btn-small">Cancel</button>
        <button id="dynamicSave" class="btn-primary btn-small">Add Category</button>
      </div>
    `;
    
    // Insert AFTER add button (better UX - form appears below button)
    addButton.style.display = 'none';
    addButton.parentNode.insertBefore(dynamicForm, addButton.nextSibling);
    
    // Enhanced focus and interaction
    const nameInput = document.getElementById('dynamicCategoryName');
    const descInput = document.getElementById('dynamicCategoryDesc');
    const budgetInput = document.getElementById('dynamicCategoryBudget');
    const emojiDisplay = document.getElementById('dynamicEmojiDisplay');
    
    if (nameInput) {
      nameInput.focus();
      
      // Real-time emoji detection with debounce for performance
      let emojiTimeout;
      nameInput.addEventListener('input', (e) => {
        clearTimeout(emojiTimeout);
        emojiTimeout = setTimeout(() => {
          const detectedEmoji = this.detectEmojiFromName(e.target.value);
          if (emojiDisplay) {
            emojiDisplay.textContent = detectedEmoji;
          }
        }, 200);
      });
    }
    
    // Optimized number formatting for budget input
    if (budgetInput) {
      this.setupNumberFormatting(budgetInput);
    }
    
    // Cancel functionality
    const cancelBtn = document.getElementById('dynamicCancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        console.log('❌ Cancel clicked');
        dynamicForm.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
          dynamicForm.remove();
          addButton.style.display = 'block';
        }, 300);
      });
    }
    
    // Save functionality
    const saveBtn = document.getElementById('dynamicSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        console.log('💾 Save clicked');
        const name = nameInput.value.trim();
        const desc = descInput.value.trim();
        const budgetText = budgetInput.value.replace(/\./g, '');
        const budget = parseInt(budgetText) || 0;
        
        if (name) {
          // Check for duplicates
          if (this.userCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            alert('Category with this name already exists!');
            nameInput.focus();
            return;
          }
          
          const newCategory = {
            id: 'cat_' + Date.now(),
            icon: emojiDisplay.textContent || '💰',
            name: name,
            description: desc || 'Custom category',
            budget: budget,
            sourceKey: null
          };
          
          this.userCategories.push(newCategory);
          this.updateCategoriesDisplay();
          this.updateSuggestionsDisplay();
          this.updateTotalBudget();
          
          // Smooth removal animation
          dynamicForm.style.animation = 'slideUp 0.3s ease';
          setTimeout(() => {
            dynamicForm.remove();
            addButton.style.display = 'block';
          }, 300);
          
          console.log('✅ Category added successfully');
        } else {
          alert('Please enter a category name');
          nameInput.focus();
        }
      });
    }
    
    console.log('✅ Dynamic form created and ready');
  }

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
    if (this.currentPage === 'dashboard') {
      this.refreshDashboardData(month);
    }
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
  
  // Data Refresh Methods
  refreshDashboardData(month = null) {
    if (window.DashboardManager) {
      window.DashboardManager.loadDashboard(month);
    }
  }
  
  refreshCurrentPageData() {
    this.loadPageData(this.currentPage);
  }
  
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
  if (window.app) {
    window.app.refreshCurrentPageData();
  }
};

// Initialize app when script loads
console.log('🌟 DuitTrack App script loaded');
window.app = new DuitTrackApp();