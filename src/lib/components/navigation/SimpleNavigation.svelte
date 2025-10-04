<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { authStore, userStore, authActions } from '../../stores/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  const dispatch = createEventDispatcher();

  // Simple state management
  let isMobileMenuOpen = false;
  let isUserDropdownOpen = false;

  // Reactive values
  $: isAuthenticated = $authStore;
  $: currentUser = $userStore;

  // Update current page reactively
  $: currentPath = $page.url.pathname;

  // Simple reactive update trigger
  $: activePageTrigger = currentPath;

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'expenses', label: 'Expenses', icon: '💸', path: '/expenses' },
    { id: 'budget', label: 'Budget', icon: '💰', path: '/budget' }
  ];

  // Simple toggle functions
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

  // Close menus when clicking outside
  function handleDocumentClick(event) {
    const target = event.target;

    // Check if click is outside mobile menu
    if (isMobileMenuOpen) {
      const mobileMenu = document.querySelector('.mobile-menu');
      const hamburger = document.querySelector('.hamburger-btn');

      if (mobileMenu && !mobileMenu.contains(target) &&
          hamburger && !hamburger.contains(target)) {
        closeMobileMenu();
      }
    }

    // Check if click is outside user dropdown
    if (isUserDropdownOpen) {
      const dropdown = document.querySelector('.user-dropdown');
      const avatar = document.querySelector('.user-avatar');

      if (dropdown && !dropdown.contains(target) &&
          avatar && !avatar.contains(target)) {
        closeUserDropdown();
      }
    }
  }

  // Navigation handler
  async function handleNavigation(item) {
    closeMobileMenu();
    await goto(item.path);
    dispatch('navigate', { page: item.id, path: item.path });
  }

  async function handleLogoClick() {
    await goto('/dashboard');
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

  function getUserDisplayName() {
    if (!currentUser) return 'Guest';
    return currentUser.displayName || currentUser.email || 'User';
  }

  function getUserAvatar() {
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

  function isCurrentPage(path) {
    // Clean path comparison (remove query parameters)
    const cleanCurrentPath = currentPath.split('?')[0];
    const cleanTargetPath = path.split('?')[0];

    return cleanCurrentPath === cleanTargetPath ||
           (cleanTargetPath === '/dashboard' && cleanCurrentPath === '/');
  }
</script>

<svelte:document on:click={handleDocumentClick} />

<!-- Simple Clean Navbar -->
<nav class="navbar">
  <div class="nav-container">

    <!-- Left: Hamburger + Logo -->
    <div class="nav-left">
      <!-- Hamburger Button -->
      <button
        class="hamburger-btn"
        class:active={isMobileMenuOpen}
        on:click|stopPropagation={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <!-- Logo -->
      <button class="logo-btn" on:click={handleLogoClick}>
        <span class="logo-text">DuitTrack</span>
      </button>
    </div>

    <!-- Right: Menu + User Section -->
    <div class="nav-right">
      <!-- Desktop Menu Items -->
      <div class="desktop-nav desktop-only">
        {#each navigationItems as item}
          {#key activePageTrigger}
            <button
              class="nav-item"
              class:active={currentPath === item.path || (item.path === '/dashboard' && currentPath === '/')}
              on:click={() => handleNavigation(item)}
            >
              <span class="nav-icon">{item.icon}</span>
              <span class="nav-label">{item.label}</span>
            </button>
          {/key}
        {/each}
      </div>

      <!-- User Section -->
      <div class="user-section">
      {#if isAuthenticated && currentUser}
        <!-- User Avatar -->
        <button
          class="user-avatar"
          class:active={isUserDropdownOpen}
          on:click|stopPropagation={toggleUserDropdown}
          aria-label="User menu"
        >
          <img src={getUserAvatar()} alt={getUserDisplayName()} />
        </button>

        <!-- User Dropdown -->
        {#if isUserDropdownOpen}
          <div class="user-dropdown">
            <button class="dropdown-item" on:click={handleSignOut}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        {/if}
      {:else}
        <!-- Sign In Button -->
        <button class="signin-btn" on:click={handleGoogleSignIn}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign In
        </button>
      {/if}
      </div>
    </div>
  </div>

  <!-- Mobile Menu -->
  {#if isMobileMenuOpen}
    <div class="mobile-menu">
      {#each navigationItems as item}
        <button
          class="mobile-nav-item"
          class:active={isCurrentPage(item.path)}
          on:click={() => handleNavigation(item)}
        >
          <span class="nav-icon">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</nav>

<style>
  /* Navbar Base */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(6, 182, 212, 0.1);
    z-index: 1000;
  }

  .nav-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Left Section */
  .nav-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* Hamburger Button */
  .hamburger-btn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: background-color 0.2s;
    position: relative;
  }

  .hamburger-btn:hover {
    background: rgba(6, 182, 212, 0.1);
  }

  .hamburger-line {
    width: 20px;
    height: 2px;
    background: #06B6D4;
    transition: all 0.3s ease;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    transform-origin: center;
  }

  .hamburger-line:nth-child(1) {
    top: 8px;
  }

  .hamburger-line:nth-child(2) {
    top: 15px;
  }

  .hamburger-line:nth-child(3) {
    top: 22px;
  }

  .hamburger-btn.active .hamburger-line:nth-child(1) {
    transform: translateX(-50%) rotate(45deg);
    top: 15px;
  }

  .hamburger-btn.active .hamburger-line:nth-child(2) {
    opacity: 0;
    transform: translateX(-50%) scale(0);
  }

  .hamburger-btn.active .hamburger-line:nth-child(3) {
    transform: translateX(-50%) rotate(-45deg);
    top: 15px;
  }

  /* Logo */
  .logo-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: background-color 0.2s;
  }

  .logo-btn:hover {
    background: rgba(6, 182, 212, 0.1);
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: #06B6D4;
  }

  /* Desktop Navigation - Moved to Right */
  .desktop-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-right: 1.5rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 8px;
    color: #64748b;
    font-weight: 500;
    transition: all 0.2s;
  }

  .nav-item:hover {
    background: rgba(6, 182, 212, 0.1);
    color: #06B6D4;
  }

  .nav-item.active {
    background: rgba(6, 182, 212, 0.15) !important;
    color: #06B6D4 !important;
    font-weight: 600 !important;
    border-radius: 8px;
  }

  .nav-icon {
    font-size: 1rem;
  }

  .nav-label {
    font-size: 0.875rem;
  }

  /* Right Section */
  .nav-right {
    display: flex;
    align-items: center;
    position: relative;
  }

  .user-section {
    position: relative;
  }

  /* User Avatar */
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.2s;
    background: none;
    padding: 0;
  }

  .user-avatar:hover,
  .user-avatar.active {
    border-color: #06B6D4;
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* User Dropdown */
  .user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: white;
    border: 1px solid rgba(6, 182, 212, 0.1);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    min-width: 120px;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
    font-size: 0.875rem;
    text-align: left;
    transition: background-color 0.2s;
  }

  .dropdown-item:hover {
    background: rgba(6, 182, 212, 0.1);
    color: #06B6D4;
  }

  /* Sign In Button */
  .signin-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #06B6D4;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .signin-btn:hover {
    background: #0891B2;
  }

  /* Mobile Menu */
  .mobile-menu {
    background: white;
    border-top: 1px solid rgba(6, 182, 212, 0.1);
    padding: 1rem 0;
  }

  .mobile-nav-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
    font-weight: 500;
    text-align: left;
    transition: all 0.2s;
  }

  .mobile-nav-item:hover {
    background: rgba(6, 182, 212, 0.1);
    color: #06B6D4;
  }

  .mobile-nav-item.active {
    background: rgba(6, 182, 212, 0.15);
    color: #06B6D4;
    font-weight: 600;
    border-left: 3px solid #06B6D4;
  }

  /* Responsive */
  .desktop-only {
    display: none;
  }

  @media (min-width: 768px) {
    .hamburger-btn {
      display: none;
    }

    .desktop-only {
      display: flex !important;
    }

    .mobile-menu {
      display: none;
    }
  }
</style>