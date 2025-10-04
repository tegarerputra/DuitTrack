<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { authStore, userStore, authActions } from '../../stores/auth';
  import { navigationActions, currentPageStore, pageMetadata } from '../../stores/navigation';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  const dispatch = createEventDispatcher();

  // Internal state
  let isMobileMenuOpen = false;
  let isUserDropdownOpen = false;
  let mobileMenuButton: HTMLButtonElement;
  let mobileMenuPanel: HTMLDivElement;
  let userAvatarButton: HTMLButtonElement;
  let userDropdown: HTMLDivElement;

  // Reactive values
  $: isAuthenticated = $authStore;
  $: currentUser = $userStore;
  $: currentPage = $currentPageStore;
  $: currentPath = $page.url.pathname;

  // Debug reactive statement
  $: {
    console.log('🔄 Mobile menu state changed:', isMobileMenuOpen);
  }

  // Filter navigation items - only show Dashboard, Expenses, Budget, Settings
  $: navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'expenses', label: 'Expenses', icon: '💸', path: '/expenses' },
    { id: 'budget', label: 'Budget', icon: '💰', path: '/budget' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' }
  ];

  // Update current page when route changes
  $: if ($page.url.pathname !== currentPage) {
    navigationActions.setCurrentPage($page.url.pathname);
  }

  onMount(() => {
    const cleanupClickHandler = setupClickOutsideHandlers();
    const cleanupKeyboardHandler = setupKeyboardHandlers();

    return () => {
      cleanupClickHandler();
      cleanupKeyboardHandler();
    };
  });

  function setupClickOutsideHandlers() {
    let clickTimeout: NodeJS.Timeout | null = null;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      console.log('🎯 Document click detected, target:', target.tagName, target.className);
      console.log('🎯 Current mobile menu state:', isMobileMenuOpen);
      console.log('🎯 Mobile menu panel exists:', !!mobileMenuPanel);
      console.log('🎯 Mobile menu button exists:', !!mobileMenuButton);

      // Clear any existing timeout to debounce rapid clicks
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }

      // Debounce the click handling to prevent rapid fire
      clickTimeout = setTimeout(() => {
        // Close mobile menu when clicking outside (but not on hamburger button)
        if (isMobileMenuOpen && mobileMenuPanel && !mobileMenuPanel.contains(target) &&
            (!mobileMenuButton || !mobileMenuButton.contains(target))) {
          console.log('🎯 Calling closeMobileMenu from click outside');
          closeMobileMenu();
        }

        // Close user dropdown when clicking outside
        if (isUserDropdownOpen && userDropdown && !userDropdown.contains(target) &&
            (!userAvatarButton || !userAvatarButton.contains(target))) {
          closeUserDropdown();
        }
      }, 10); // Small delay to debounce
    }

    document.addEventListener('click', handleClick);
    return () => {
      if (clickTimeout) clearTimeout(clickTimeout);
      document.removeEventListener('click', handleClick);
    };
  }

  function setupKeyboardHandlers() {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isMobileMenuOpen) closeMobileMenu();
        if (isUserDropdownOpen) closeUserDropdown();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }

  function toggleMobileMenu() {
    console.log('🍔 toggleMobileMenu called, current state:', isMobileMenuOpen);
    isMobileMenuOpen = !isMobileMenuOpen;
    console.log('🍔 toggleMobileMenu after toggle:', isMobileMenuOpen);
    if (isMobileMenuOpen) {
      isUserDropdownOpen = false;
    }
  }

  function closeMobileMenu() {
    console.log('❌ closeMobileMenu called, current state:', isMobileMenuOpen);
    isMobileMenuOpen = false;
    console.log('❌ closeMobileMenu after close:', isMobileMenuOpen);
  }

  function toggleUserDropdown() {
    isUserDropdownOpen = !isUserDropdownOpen;
    if (isUserDropdownOpen) {
      isMobileMenuOpen = false;
    }
  }

  function closeUserDropdown() {
    isUserDropdownOpen = false;
  }

  async function handleNavigation(item: typeof navigationItems[0]) {
    closeMobileMenu();

    // Save current scroll position
    navigationActions.saveCurrentScrollPosition(currentPath);

    // Navigate to the page
    await goto(item.path);

    // Update navigation store
    navigationActions.setCurrentPage(item.path);

    dispatch('navigate', { page: item.id, path: item.path });
  }

  async function handleLogoClick() {
    await goto('/dashboard');
    navigationActions.setCurrentPage('/dashboard');
  }

  async function handleGoogleSignIn() {
    closeUserDropdown();

    try {
      await authActions.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      dispatch('authError', { error });
    }
  }

  async function handleSignOut() {
    closeUserDropdown();

    try {
      await authActions.signOut();
      await goto('/');
    } catch (error) {
      console.error('Sign out failed:', error);
      dispatch('authError', { error });
    }
  }

  function getUserDisplayName(): string {
    if (!currentUser) return 'Guest';
    return currentUser.displayName || currentUser.email || 'User';
  }

  function getUserAvatar(): string {
    if (currentUser?.photoURL) {
      return currentUser.photoURL;
    }

    // Generate placeholder avatar with water theme colors
    const name = getUserDisplayName();
    const initial = name.charAt(0).toUpperCase();
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <rect width="40" height="40" fill="#06B6D4" rx="20"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${initial}</text>
      </svg>`
    )}`;
  }

  function isCurrentPage(path: string): boolean {
    return currentPath === path || (path === '/dashboard' && currentPath === '/');
  }
</script>

<!-- Water-Themed Liquid Glass Navigation Bar -->
<nav class="liquid-nav navbar" aria-label="Main navigation">
  <div class="navbar-container">

    <!-- Left Section: Mobile Menu + Logo -->
    <div class="navbar-left">
      <!-- Mobile Menu Button with Water Ripple Effect -->
      <button
        bind:this={mobileMenuButton}
        class="mobile-menu-btn liquid-glass-subtle liquid-interactive animate-water-ripple"
        class:active={isMobileMenuOpen}
        on:click|stopPropagation={toggleMobileMenu}
        aria-expanded={isMobileMenuOpen}
        aria-haspopup="true"
        aria-label="Toggle navigation menu"
        type="button"
      >
        <svg class="hamburger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Logo with Enhanced Water Glow -->
      <button
        class="logo-btn liquid-interactive animate-liquid-float"
        on:click={handleLogoClick}
        aria-label="Navigate to dashboard"
      >
        <span class="logo-text text-vital animate-liquid-glow">DuitTrack</span>
      </button>
    </div>

    <!-- Right Section: Desktop Menu + Avatar -->
    <div class="navbar-right">

      <!-- Desktop Navigation Menu -->
      <div class="desktop-nav hidden">
        {#each navigationItems as item}
          <button
            class="liquid-nav-item liquid-interactive"
            class:active={isCurrentPage(item.path)}
            on:click={() => handleNavigation(item)}
          >
            <span class="nav-icon animate-liquid-float">{item.icon}</span>
            <span class="nav-label text-primary-glass">{item.label}</span>
          </button>
        {/each}
      </div>

      <!-- User Section -->
      <div class="user-section">
        {#if isAuthenticated && currentUser}
          <!-- User Avatar with Water Droplet Effect -->
          <button
            bind:this={userAvatarButton}
            class="user-avatar-btn liquid-glass-medium liquid-interactive animate-water-droplet"
            class:active={isUserDropdownOpen}
            on:click={toggleUserDropdown}
            aria-expanded={isUserDropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <img
              src={getUserAvatar()}
              alt={getUserDisplayName()}
              class="avatar-img"
            />
          </button>

          <!-- User Dropdown -->
          {#if isUserDropdownOpen}
            <div
              bind:this={userDropdown}
              class="user-dropdown liquid-glass-strong animate-slide-down"
              role="menu"
              aria-orientation="vertical"
            >
              <button
                class="dropdown-item logout-btn liquid-interactive text-supporting-glass hover:text-vital"
                on:click={handleSignOut}
                role="menuitem"
              >
                <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          {/if}
        {:else}
          <!-- Sign In Button with Enhanced Water Effects -->
          <button
            class="signin-btn liquid-btn liquid-btn-primary text-vital animate-liquid-bounce"
            on:click={handleGoogleSignIn}
          >
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign In</span>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Mobile Menu Overlay and Panel -->
  {#if isMobileMenuOpen}
    <!-- Dark Overlay -->
    <div
      class="mobile-menu-overlay animate-fade-in"
      on:click|stopPropagation={closeMobileMenu}
      on:keydown={(e) => e.key === 'Escape' && closeMobileMenu()}
      role="button"
      tabindex="0"
      aria-label="Close menu"
    ></div>

    <!-- Menu Panel -->
    <div
      bind:this={mobileMenuPanel}
      class="mobile-menu-panel animate-slide-down"
      role="menu"
      aria-orientation="vertical"
      on:click|stopPropagation
    >
      {#each navigationItems as item}
        <button
          class="mobile-nav-item"
          class:active={isCurrentPage(item.path)}
          on:click={() => handleNavigation(item)}
          role="menuitem"
        >
          <span class="nav-icon">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</nav>

<style>
  /* Navbar Container - Enhanced with Water-Themed Liquid Glass */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }

  .navbar-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 16px;
    max-width: 100%;
  }

  @media (min-width: 768px) {
    .navbar-container {
      height: 64px;
      padding: 0 24px;
    }
  }

  /* Left Section */
  .navbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* Mobile Menu Button - Water-Themed */
  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    cursor: pointer;
    border-radius: 12px;
    color: var(--water-primary, #06B6D4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-menu-btn.active {
    background: var(--water-glass-primary, rgba(6, 182, 212, 0.15));
    transform: scale(1.1);
  }

  .hamburger-icon {
    width: 24px;
    height: 24px;
  }

  /* Logo - Enhanced with Water Effects */
  .logo-btn {
    border: none;
    background: none;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .logo-btn:hover {
    background: var(--water-glass-light, rgba(103, 232, 249, 0.08));
    transform: translateY(-2px);
  }

  .logo-text {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  @media (min-width: 768px) {
    .logo-text {
      font-size: 24px;
    }
  }

  /* Right Section */
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  /* Desktop Navigation - Water-Themed */
  .desktop-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-icon {
    font-size: 18px;
  }

  .nav-label {
    font-size: 16px;
  }

  /* User Section */
  .user-section {
    position: relative;
    display: flex;
    align-items: center;
  }

  .user-avatar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .user-avatar-btn:hover {
    transform: scale(1.1);
    box-shadow: var(--water-shadow-medium, 0 12px 40px rgba(6, 182, 212, 0.15));
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  /* User Dropdown - Water-Themed */
  .user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    border-radius: 12px;
    overflow: hidden;
    min-width: 120px;
    z-index: 1001;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
  }

  .dropdown-item:hover {
    background: var(--water-glass-light, rgba(103, 232, 249, 0.08));
    transform: translateX(4px);
  }

  .logout-icon {
    width: 16px;
    height: 16px;
  }

  /* Sign In Button - Water-Themed */
  .signin-btn {
    color: white !important;
    font-size: 14px;
    font-weight: 500;
  }

  .google-icon {
    width: 16px;
    height: 16px;
  }

  /* Mobile Menu Overlay */
  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  /* Mobile Menu Panel - Fixed Design */
  .mobile-menu-panel {
    position: fixed;
    top: 56px; /* Height of navbar */
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(6, 182, 212, 0.2);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 999;
    border-radius: 0 0 16px 16px;
    overflow: hidden;
    max-height: calc(100vh - 56px);
    overflow-y: auto;
  }

  .mobile-nav-item {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 16px 20px;
    border: none;
    background: transparent;
    color: #1f2937;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(6, 182, 212, 0.1);
  }

  .mobile-nav-item:hover {
    background: rgba(6, 182, 212, 0.08);
    color: #06B6D4;
    transform: translateX(4px);
  }

  .mobile-nav-item.active {
    background: rgba(6, 182, 212, 0.12);
    color: #06B6D4;
    border-left: 4px solid #06B6D4;
    font-weight: 600;
  }

  .mobile-nav-item:last-child {
    border-bottom: none;
  }

  /* Utility Classes */
  .hidden {
    display: none;
  }

  @media (min-width: 768px) {
    .mobile-menu-btn {
      display: none;
    }

    .desktop-nav {
      display: flex !important;
    }

    .mobile-menu-panel {
      display: none;
    }
  }

  /* Water-themed active states */
  .liquid-nav-item.active {
    position: relative;
  }

  .liquid-nav-item.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 20%;
    right: 20%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--water-primary, #06B6D4),
      transparent
    );
    border-radius: 1px;
  }

  /* Enhanced mobile menu active states */
  .mobile-nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(
      180deg,
      var(--water-light, #67E8F9),
      var(--water-primary, #06B6D4),
      var(--water-secondary, #0891B2)
    );
  }
</style>