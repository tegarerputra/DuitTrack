<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { authStore, userStore, authActions } from '../../stores/auth';
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
  $: currentPath = $page.url.pathname;

  // Navigation items - Settings removed from main nav
  $: navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'expenses', label: 'Expenses', icon: '💸', path: '/expenses' },
    { id: 'budget', label: 'Budget', icon: '💰', path: '/budget' }
  ];

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

      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }

      clickTimeout = setTimeout(() => {
        // Close mobile menu when clicking outside
        if (isMobileMenuOpen && mobileMenuPanel && !mobileMenuPanel.contains(target) &&
            (!mobileMenuButton || !mobileMenuButton.contains(target))) {
          closeMobileMenu();
        }

        // Close user dropdown when clicking outside
        if (isUserDropdownOpen && userDropdown && !userDropdown.contains(target) &&
            (!userAvatarButton || !userAvatarButton.contains(target))) {
          closeUserDropdown();
        }
      }, 10);
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
    await goto(item.path);
    dispatch('navigate', { page: item.id, path: item.path });
  }

  async function handleLogoClick() {
    await goto('/dashboard');
  }

  async function handleSettingsClick() {
    closeMobileMenu();
    closeUserDropdown();
    await goto('/settings');
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
    // Simple exact match
    if (currentPath === path) return true;
    // Handle dashboard special case
    if (path === '/dashboard' && currentPath === '/') return true;
    return false;
  }
</script>

<!-- White Glassy Navigation Bar - Nimble Style -->
<nav class="navbar-glassy" aria-label="Main navigation">
  <div class="navbar-container">

    <!-- Left Section: Logo Only -->
    <div class="navbar-left">
      <!-- Logo -->
      <button
        class="logo-btn"
        on:click={handleLogoClick}
        aria-label="Navigate to dashboard"
      >
        <span class="logo-text">DuitTrack</span>
      </button>
    </div>

    <!-- Right Section: Desktop Menu + User + Mobile Menu -->
    <div class="navbar-right">

      <!-- Desktop Navigation Menu (No Settings) -->
      <div class="desktop-nav desktop-only">
        {#each navigationItems as item}
          <button
            class="desktop-nav-item"
            class:active={isCurrentPage(item.path)}
            on:click={() => handleNavigation(item)}
          >
            <span class="nav-icon">{item.icon}</span>
            <span class="nav-label">{item.label}</span>
          </button>
        {/each}
      </div>

      <!-- User Section (Desktop Only) -->
      <div class="user-section desktop-only">
        {#if isAuthenticated && currentUser}
          <!-- Desktop: Avatar + Username -->
          <button
            bind:this={userAvatarButton}
            class="desktop-user-btn"
            class:active={isUserDropdownOpen}
            on:click|stopPropagation={toggleUserDropdown}
            aria-expanded={isUserDropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <img
              src={getUserAvatar()}
              alt={getUserDisplayName()}
              class="user-avatar-desktop"
            />
            <span class="desktop-username">{getUserDisplayName()}</span>
            <span class="dropdown-arrow" class:rotated={isUserDropdownOpen}>▾</span>
          </button>

          <!-- User Dropdown (Desktop & Mobile) -->
          {#if isUserDropdownOpen}
            <div
              bind:this={userDropdown}
              class="user-dropdown-menu"
              role="menu"
              aria-orientation="vertical"
              on:click|stopPropagation
            >
              <!-- User Info Header (Desktop Only) -->
              <div class="dropdown-user-info desktop-only">
                <img
                  src={getUserAvatar()}
                  alt={getUserDisplayName()}
                  class="dropdown-avatar"
                />
                <div class="dropdown-user-text">
                  <div class="dropdown-username">{getUserDisplayName()}</div>
                  <div class="dropdown-email">{currentUser.email}</div>
                </div>
              </div>

              <!-- Glass Divider (Desktop Only) -->
              <div class="glass-divider desktop-only"></div>

              <!-- Settings -->
              <button
                class="dropdown-item"
                on:click={handleSettingsClick}
                role="menuitem"
              >
                <span class="dropdown-icon">⚙️</span>
                <span>Settings</span>
              </button>

              <!-- Glass Divider -->
              <div class="glass-divider"></div>

              <!-- Logout -->
              <button
                class="dropdown-item logout-item"
                on:click={handleSignOut}
                role="menuitem"
              >
                <span class="dropdown-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          {/if}
        {:else}
          <!-- Sign In Button -->
          <button
            class="signin-btn"
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

      <!-- Mobile Menu Button (Mobile Only - Right Side) -->
      <button
        bind:this={mobileMenuButton}
        class="mobile-menu-btn mobile-only animate-water-ripple"
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
    </div>
  </div>

  <!-- Mobile Menu Dropdown (Nimble Style) -->
  {#if isMobileMenuOpen}
    <!-- Dark Overlay -->
    <div
      class="mobile-menu-overlay"
      on:click|stopPropagation={closeMobileMenu}
      on:keydown={(e) => e.key === 'Escape' && closeMobileMenu()}
      role="button"
      tabindex="0"
      aria-label="Close menu"
    ></div>

    <!-- Menu Dropdown Panel -->
    <div
      bind:this={mobileMenuPanel}
      class="mobile-menu-dropdown"
      role="menu"
      aria-orientation="vertical"
      on:click|stopPropagation
    >
      <!-- User Info Section (Blue Glass Card) -->
      {#if isAuthenticated && currentUser}
        <div class="user-info-section animate-liquid-float">
          <div class="user-info-content">
            <img
              src={getUserAvatar()}
              alt={getUserDisplayName()}
              class="user-avatar-large"
            />
            <div class="user-text-info">
              <div class="user-display-name">{getUserDisplayName()}</div>
              <div class="user-email">{currentUser.email}</div>
            </div>
          </div>
        </div>

        <!-- Glass Divider -->
        <div class="glass-divider"></div>
      {/if}

      <!-- Navigation Items -->
      {#each navigationItems as item}
        <button
          class="mobile-menu-item"
          class:active={isCurrentPage(item.path)}
          on:click={() => handleNavigation(item)}
          role="menuitem"
        >
          <span class="menu-icon">{item.icon}</span>
          <span class="menu-label">{item.label}</span>
        </button>
      {/each}

      <!-- Glass Divider -->
      <div class="glass-divider"></div>

      <!-- Settings -->
      <button
        class="mobile-menu-item"
        on:click={handleSettingsClick}
        role="menuitem"
      >
        <span class="menu-icon">⚙️</span>
        <span class="menu-label">Settings</span>
      </button>

      <!-- Glass Divider -->
      <div class="glass-divider"></div>

      <!-- Logout -->
      {#if isAuthenticated}
        <button
          class="mobile-menu-item"
          on:click={handleSignOut}
          role="menuitem"
        >
          <span class="menu-icon">🚪</span>
          <span class="menu-label">Logout</span>
        </button>
      {/if}
    </div>
  {/if}
</nav>

<style>
  /* ==================== NAVBAR - WHITE GLASSY ==================== */
  .navbar-glassy {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;

    /* Ultra light white glass */
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);

    /* Subtle blue border */
    border-bottom: 1px solid rgba(0, 191, 255, 0.12);

    /* Soft shadow */
    box-shadow:
      0 4px 24px rgba(0, 191, 255, 0.04),
      inset 0 -1px 0 rgba(255, 255, 255, 0.5);

    transition: all 0.3s ease;
  }

  .navbar-glassy:hover {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(25px) saturate(1.5);
    -webkit-backdrop-filter: blur(25px) saturate(1.5);
    border-bottom-color: rgba(0, 191, 255, 0.18);
  }

  .navbar-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 12px;
    max-width: 100%;
  }

  @media (min-width: 768px) {
    .navbar-container {
      height: 64px;
      padding: 0 20px;
    }
  }

  /* ==================== LEFT SECTION ==================== */
  .navbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* Mobile Menu Button */
  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    cursor: pointer;
    border-radius: 12px;
    background: transparent;
    color: #00BFFF;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-menu-btn:hover {
    background: rgba(0, 191, 255, 0.08);
    backdrop-filter: blur(12px);
    transform: scale(1.05);
  }

  .mobile-menu-btn.active {
    background: rgba(0, 191, 255, 0.15);
    transform: scale(1.1);
  }

  .hamburger-icon {
    width: 24px;
    height: 24px;
  }

  /* Logo */
  .logo-btn {
    border: none;
    background: none;
    cursor: pointer;
    padding: 8px 4px;
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .logo-btn:hover {
    background: rgba(0, 191, 255, 0.08);
    transform: translateY(-2px);
  }

  .logo-text {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, #00BFFF 0%, #007BFF 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 1px 2px rgba(0, 123, 255, 0.2));
  }

  @media (min-width: 768px) {
    .logo-text {
      font-size: 24px;
    }
  }

  /* ==================== RIGHT SECTION ==================== */
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  /* Desktop Navigation */
  .desktop-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .desktop-nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 10px;
    color: #4b5563;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    position: relative;
  }

  .desktop-nav-item:hover {
    background: rgba(0, 191, 255, 0.08);
    color: #007BFF;
  }

  /* Active state with higher specificity */
  .desktop-nav-item.active {
    background: rgba(0, 191, 255, 0.15) !important;
    color: #007BFF !important;
    font-weight: 600 !important;
    border-bottom: 3px solid #007BFF;
  }

  .nav-icon {
    font-size: 18px;
  }

  .nav-label {
    font-size: 14px;
  }

  /* ==================== USER SECTION ==================== */
  .user-section {
    position: relative;
    display: flex;
    align-items: center;
  }

  /* Desktop User Button (Avatar + Username) */
  .desktop-user-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border: none;
    cursor: pointer;
    border-radius: 12px;
    background: transparent;
    transition: all 0.3s ease;
  }

  .desktop-user-btn:hover {
    background: rgba(0, 191, 255, 0.08);
    backdrop-filter: blur(12px);
    transform: translateY(-2px);
  }

  .user-avatar-desktop {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid rgba(0, 191, 255, 0.3);
    transition: all 0.3s ease;
  }

  .desktop-user-btn:hover .user-avatar-desktop {
    border-color: rgba(0, 191, 255, 0.6);
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.2);
  }

  .desktop-username {
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #00BFFF 0%, #007BFF 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 1px 2px rgba(0, 123, 255, 0.2));
  }

  .dropdown-arrow {
    font-size: 12px;
    color: #00BFFF;
    transition: transform 0.3s ease;
  }

  .dropdown-arrow.rotated {
    transform: rotate(180deg);
  }

  /* Mobile User Button (Avatar Only) */
  .mobile-user-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    background: transparent;
    padding: 0;
    transition: all 0.3s ease;
  }

  .mobile-user-btn:hover {
    transform: scale(1.1);
  }

  .user-avatar-mobile {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid rgba(0, 191, 255, 0.3);
  }

  .mobile-user-btn:hover .user-avatar-mobile,
  .mobile-user-btn.active .user-avatar-mobile {
    border-color: rgba(0, 191, 255, 0.6);
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.2);
  }

  /* ==================== USER DROPDOWN ==================== */
  .user-dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    min-width: 240px;

    /* White glass matching navbar */
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(22px) saturate(1.5);
    -webkit-backdrop-filter: blur(22px) saturate(1.5);

    border: 1px solid rgba(0, 191, 255, 0.15);
    border-radius: 16px;

    box-shadow:
      0 12px 40px rgba(0, 191, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);

    z-index: 1001;
    padding: 8px;

    animation: slideDownFade 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dropdown-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin-bottom: 4px;
  }

  .dropdown-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid rgba(0, 191, 255, 0.3);
  }

  .dropdown-user-text {
    flex: 1;
  }

  .dropdown-username {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 2px;
  }

  .dropdown-email {
    font-size: 13px;
    color: #6b7280;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    color: #4b5563;
    cursor: pointer;
    text-align: left;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 10px;
    position: relative;
  }

  .dropdown-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(180deg,
      rgba(0, 191, 255, 0.6) 0%,
      rgba(30, 144, 255, 0.7) 50%,
      rgba(0, 123, 255, 0.8) 100%);
    border-radius: 10px 0 0 10px;
    transition: width 0.3s ease;
  }

  .dropdown-item:hover {
    background: rgba(0, 191, 255, 0.08);
    backdrop-filter: blur(12px);
    color: #007BFF;
    transform: translateX(4px);
  }

  .dropdown-item:hover::before {
    width: 3px;
  }

  .dropdown-icon {
    font-size: 18px;
  }

  /* ==================== SIGN IN BUTTON ==================== */
  .signin-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.55) 0%,
      rgba(30, 144, 255, 0.65) 100%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow:
      0 4px 16px rgba(0, 191, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(20px) saturate(1.6);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
  }

  .signin-btn:hover {
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.7) 0%,
      rgba(30, 144, 255, 0.8) 100%);
    transform: translateY(-2px);
    box-shadow:
      0 8px 24px rgba(0, 191, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  .google-icon {
    width: 16px;
    height: 16px;
  }

  /* ==================== MOBILE MENU DROPDOWN ==================== */
  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 998;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: fadeIn 0.3s ease;
  }

  .mobile-menu-dropdown {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;

    /* White glass matching navbar */
    background: rgba(255, 255, 255, 0.70);
    backdrop-filter: blur(25px) saturate(1.6);
    -webkit-backdrop-filter: blur(25px) saturate(1.6);

    border-bottom: 1px solid rgba(0, 191, 255, 0.15);
    border-radius: 0 0 20px 20px;

    box-shadow:
      0 8px 32px rgba(0, 191, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);

    z-index: 999;
    padding: 12px 0;
    max-height: calc(100vh - 56px);
    overflow-y: auto;

    animation: slideDownFade 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ==================== USER INFO SECTION (Blue Glass) ==================== */
  .user-info-section {
    position: relative;
    padding: 20px;
    margin: 8px 12px;

    /* Blue glassmorphism matching hero card */
    background: linear-gradient(135deg,
      rgba(0, 191, 255, 0.45) 0%,
      rgba(30, 144, 255, 0.55) 50%,
      rgba(0, 123, 255, 0.6) 100%);

    backdrop-filter: blur(25px) saturate(1.8);
    -webkit-backdrop-filter: blur(25px) saturate(1.8);

    border: 1.5px solid rgba(255, 255, 255, 0.35);
    border-radius: 16px;

    box-shadow:
      0 6px 20px rgba(0, 191, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  .user-info-content {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 2;
  }

  .user-avatar-large {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 12px rgba(0, 191, 255, 0.2);
  }

  .user-text-info {
    flex: 1;
  }

  .user-display-name {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin-bottom: 2px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .user-email {
    font-size: 13px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.85);
  }

  /* ==================== GLASS DIVIDER ==================== */
  .glass-divider {
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(0, 191, 255, 0.2) 20%,
      rgba(30, 144, 255, 0.25) 50%,
      rgba(0, 191, 255, 0.2) 80%,
      transparent);
    margin: 8px 12px;
    box-shadow: 0 1px 2px rgba(0, 191, 255, 0.1);
  }

  /* ==================== MOBILE MENU ITEMS ==================== */
  .mobile-menu-item {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 14px 20px;
    border: none;
    background: transparent;
    color: #1f2937;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.3s ease;
    border-radius: 10px;
    margin: 2px 8px;
    position: relative;
  }

  .mobile-menu-item:hover {
    background: rgba(0, 191, 255, 0.08);
    color: #007BFF;
  }

  /* Active state with higher specificity */
  .mobile-menu-item.active {
    background: rgba(0, 191, 255, 0.15) !important;
    color: #007BFF !important;
    font-weight: 600 !important;
    border-left: 4px solid #007BFF;
  }

  .menu-icon {
    font-size: 20px;
  }

  .menu-label {
    font-size: 15px;
  }

  /* ==================== RESPONSIVE ==================== */
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  /* Mobile: hamburger menu di kanan */
  @media (max-width: 767px) {
    .mobile-menu-btn {
      display: flex;
    }
  }

  @media (min-width: 768px) {
    .mobile-menu-btn {
      display: none;
    }

    .desktop-only {
      display: flex !important;
    }

    .mobile-only {
      display: none !important;
    }

    .mobile-menu-dropdown {
      display: none;
    }

    .mobile-menu-overlay {
      display: none;
    }
  }

  /* ==================== ANIMATIONS ==================== */
  @keyframes slideDownFade {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes animate-liquid-float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    33% {
      transform: translateY(-8px) rotate(3deg);
    }
    66% {
      transform: translateY(4px) rotate(-3deg);
    }
  }

  .animate-liquid-float {
    animation: animate-liquid-float 6s ease-in-out infinite;
  }

  @keyframes animate-water-ripple {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 191, 255, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(0, 191, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 191, 255, 0);
    }
  }

  .animate-water-ripple:active {
    animation: animate-water-ripple 0.6s ease-out;
  }
</style>
