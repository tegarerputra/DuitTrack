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

  // Filter navigation items - only show Dashboard, Expenses, Budget
  $: navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'expenses', label: 'Expenses', icon: '💸', path: '/expenses' },
    { id: 'budget', label: 'Budget', icon: '💰', path: '/budget' }
  ];

  // Update current page when route changes
  $: if ($page.url.pathname !== currentPage) {
    navigationActions.setCurrentPage($page.url.pathname);
  }

  onMount(() => {
    setupClickOutsideHandlers();
    setupKeyboardHandlers();
  });

  function setupClickOutsideHandlers() {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;

      // Close mobile menu when clicking outside
      if (mobileMenuPanel && !mobileMenuPanel.contains(target) &&
          (!mobileMenuButton || !mobileMenuButton.contains(target))) {
        closeMobileMenu();
      }

      // Close user dropdown when clicking outside
      if (userDropdown && !userDropdown.contains(target) &&
          (!userAvatarButton || !userAvatarButton.contains(target))) {
        closeUserDropdown();
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
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
    isMobileMenuOpen = !isMobileMenuOpen;
    if (isMobileMenuOpen) {
      isUserDropdownOpen = false;
    }
  }

  function closeMobileMenu() {
    isMobileMenuOpen = false;
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

    // Generate placeholder avatar
    const name = getUserDisplayName();
    const initial = name.charAt(0).toUpperCase();
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <rect width="40" height="40" fill="#3182ce" rx="20"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${initial}</text>
      </svg>`
    )}`;
  }

  function isCurrentPage(path: string): boolean {
    return currentPath === path || (path === '/dashboard' && currentPath === '/');
  }
</script>

<!-- Liquid Glass Navigation Bar -->
<nav class="liquid-nav navbar" aria-label="Main navigation">
  <div class="navbar-container">

    <!-- Left Section: Mobile Menu + Logo -->
    <div class="navbar-left">
      <!-- Mobile Menu Button -->
      <button
        bind:this={mobileMenuButton}
        class="mobile-menu-btn liquid-glass-subtle liquid-interactive"
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

      <!-- Logo -->
      <button
        class="logo-btn liquid-interactive"
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
            class="liquid-nav-item"
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
          <!-- User Avatar -->
          <button
            bind:this={userAvatarButton}
            class="user-avatar-btn liquid-glass-medium liquid-interactive animate-liquid-pulse"
            class:active={isUserDropdownOpen}
            on:click|stopPropagation={toggleUserDropdown}
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
          <!-- Sign In Button for Guest Users -->
          <button
            class="signin-btn liquid-glass-strong liquid-interactive text-vital animate-liquid-bounce"
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

  <!-- Mobile Menu Panel -->
  {#if isMobileMenuOpen}
    <div
      bind:this={mobileMenuPanel}
      class="mobile-menu-panel liquid-glass-strong animate-slide-down"
      role="menu"
      aria-orientation="vertical"
    >
      {#each navigationItems as item}
        <button
          class="mobile-nav-item liquid-interactive text-primary-glass hover:text-vital animate-liquid-bounce"
          class:active={isCurrentPage(item.path)}
          on:click={() => handleNavigation(item)}
          role="menuitem"
        >
          <span class="nav-icon animate-liquid-float">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</nav>

<style>
  /* Navbar Container - Enhanced with Liquid Glass */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    border-bottom: 1px solid rgba(255, 255, 255, 0.18);
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

  /* Mobile Menu Button - Simplified for Liquid Glass */
  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    cursor: pointer;
    border-radius: 8px;
    color: rgba(17, 24, 39, 0.9);
  }

  .mobile-menu-btn.active {
    color: rgba(17, 24, 39, 1);
  }

  .hamburger-icon {
    width: 24px;
    height: 24px;
  }

  /* Logo - Simplified */
  .logo-btn {
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
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

  /* Desktop Navigation */
  .desktop-nav {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    background: none;
    color: #4a5568;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 8px;
    text-decoration: none;
    position: relative;
    transition: all 0.2s ease;
  }

  .nav-item:hover {
    color: #3182ce;
    background: #f7fafc;
  }

  .nav-item.active {
    color: #3182ce;
    background: #e3f2fd;
  }

  .nav-item.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 16px;
    right: 16px;
    height: 2px;
    background: #3182ce;
    border-radius: 1px;
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
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  /* User Dropdown - Simplified */
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
    color: #4a5568;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
  }

  .dropdown-item:hover {
    background: #f7fafc;
    color: #e53e3e;
  }

  .logout-icon {
    width: 16px;
    height: 16px;
  }

  /* Sign In Button */
  .signin-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #3182ce;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .signin-btn:hover {
    background: #2c5aa0;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.4);
  }

  .google-icon {
    width: 16px;
    height: 16px;
  }

  /* Mobile Menu Panel */
  .mobile-menu-panel {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    z-index: 999;
  }

  .mobile-nav-item {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 16px 20px;
    border: none;
    background: none;
    color: #4a5568;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f7fafc;
  }

  .mobile-nav-item:hover {
    background: #f7fafc;
    color: #3182ce;
  }

  .mobile-nav-item.active {
    background: #e3f2fd;
    color: #3182ce;
    border-left: 4px solid #3182ce;
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
</style>