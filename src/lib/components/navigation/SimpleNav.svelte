<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore, userStore, authActions } from '../../stores/auth';

  // Get current path reactively
  $: currentPath = $page.url.pathname;
  $: isAuthenticated = $authStore;
  $: currentUser = $userStore;

  let isMobileMenuOpen = false;
  let isUserDropdownOpen = false;

  const menuItems = [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Expenses', icon: '💸', path: '/expenses' },
    { label: 'Budget', icon: '💰', path: '/budget' }
  ];

  function isActive(path: string): boolean {
    if (currentPath === path) return true;
    if (path === '/dashboard' && currentPath === '/') return true;
    return false;
  }

  async function navigate(path: string) {
    isMobileMenuOpen = false;
    await goto(path);
  }

  async function handleSignOut() {
    isUserDropdownOpen = false;
    await authActions.signOut();
    await goto('/');
  }

  function getUserAvatar(): string {
    if (currentUser?.photoURL) return currentUser.photoURL;
    const name = currentUser?.displayName || 'U';
    const initial = name.charAt(0).toUpperCase();
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <rect width="40" height="40" fill="#06B6D4" rx="20"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">${initial}</text>
      </svg>`
    )}`;
  }
</script>

<nav class="navbar">
  <div class="container">
    <!-- Logo -->
    <button class="logo" on:click={() => navigate('/dashboard')}>
      DuitTrack
    </button>

    <!-- Right Side: Desktop Menu + User -->
    <div class="nav-right">
      <!-- Desktop Menu -->
      <div class="desktop-menu">
        {#each menuItems as item}
          <button
            class="menu-item"
            class:active={currentPath === item.path || (item.path === '/dashboard' && currentPath === '/')}
            on:click={() => navigate(item.path)}
            style="border-bottom: {(currentPath === item.path || (item.path === '/dashboard' && currentPath === '/')) ? '3px solid #007BFF' : 'none'};"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        {/each}
      </div>

      <!-- User Avatar -->
      <div class="user">
        {#if isAuthenticated && currentUser}
          <button class="avatar" on:click={() => isUserDropdownOpen = !isUserDropdownOpen}>
            <img src={getUserAvatar()} alt="User" />
          </button>

          {#if isUserDropdownOpen}
            <div class="dropdown">
              <button on:click={() => navigate('/settings')}>⚙️ Settings</button>
              <button on:click={handleSignOut}>🚪 Logout</button>
            </div>
          {/if}
        {/if}
      </div>
    </div>

    <!-- Mobile Menu Button -->
    <button class="hamburger" on:click={() => isMobileMenuOpen = !isMobileMenuOpen}>
      ☰
    </button>
  </div>

  <!-- Mobile Menu -->
  {#if isMobileMenuOpen}
    <div class="mobile-menu">
      <!-- Account Section -->
      {#if isAuthenticated && currentUser}
        <div class="mobile-account-section">
          <div class="mobile-account-info">
            <img src={getUserAvatar()} alt="User Avatar" class="mobile-avatar" />
            <div class="mobile-account-details">
              <div class="mobile-username">{currentUser.displayName || 'User'}</div>
              <div class="mobile-email">{currentUser.email || ''}</div>
            </div>
          </div>
        </div>
        <div class="mobile-divider"></div>
      {/if}

      <!-- Navigation Menu -->
      {#each menuItems as item}
        <button
          class="mobile-item"
          class:active={currentPath === item.path || (item.path === '/dashboard' && currentPath === '/')}
          on:click={() => navigate(item.path)}
          style="border-left: {(currentPath === item.path || (item.path === '/dashboard' && currentPath === '/')) ? '4px solid #007BFF' : 'none'};"
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      {/each}

      <div class="mobile-divider"></div>

      <!-- Settings & Logout -->
      <button class="mobile-item" on:click={() => navigate('/settings')}>
        <span>⚙️</span>
        <span>Settings</span>
      </button>
      <button class="mobile-item" on:click={handleSignOut}>
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </div>
  {/if}
</nav>

<style>
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0, 191, 255, 0.15);
    box-shadow: 0 4px 24px rgba(0, 191, 255, 0.05);
  }

  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 16px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  @media (min-width: 768px) {
    .container {
      padding: 0 20px;
    }
  }

  .logo {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #00BFFF 0%, #007BFF 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    border: none;
    background-color: transparent;
    cursor: pointer;
    padding: 8px 4px;
  }

  .nav-right {
    display: none;
    align-items: center;
    gap: 16px;
  }

  @media (min-width: 768px) {
    .nav-right {
      display: flex;
    }
  }

  .desktop-menu {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: #4b5563;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .menu-item:hover {
    background: rgba(0, 191, 255, 0.08);
    color: #007BFF;
  }

  .menu-item.active {
    background: rgba(0, 191, 255, 0.15);
    color: #007BFF;
    font-weight: 600;
    border-bottom: 3px solid #007BFF;
  }

  .user {
    position: relative;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    padding: 0;
    cursor: pointer;
    overflow: hidden;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 191, 255, 0.15);
    border-radius: 12px;
    padding: 8px;
    min-width: 150px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .dropdown button {
    display: block;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
    font-size: 14px;
    color: #4b5563;
  }

  .dropdown button:hover {
    background: rgba(0, 191, 255, 0.08);
    color: #007BFF;
  }

  .hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    font-size: 24px;
    color: #00BFFF;
    cursor: pointer;
  }

  @media (min-width: 768px) {
    .hamburger {
      display: none;
    }
  }

  .mobile-menu {
    display: flex;
    flex-direction: column;
    padding: 12px 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0, 191, 255, 0.15);
  }

  @media (min-width: 768px) {
    .mobile-menu {
      display: none;
    }
  }

  .mobile-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    color: #1f2937;
    font-size: 15px;
  }

  .mobile-item:hover {
    background: rgba(0, 191, 255, 0.08);
    color: #007BFF;
  }

  .mobile-item.active {
    background: rgba(0, 191, 255, 0.15);
    color: #007BFF;
    font-weight: 600;
    border-left: 4px solid #007BFF;
  }

  /* Mobile Account Section */
  .mobile-account-section {
    padding: 16px 20px;
  }

  .mobile-account-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mobile-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid rgba(0, 191, 255, 0.3);
    object-fit: cover;
  }

  .mobile-account-details {
    flex: 1;
    overflow: hidden;
  }

  .mobile-username {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mobile-email {
    font-size: 13px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Mobile Divider */
  .mobile-divider {
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(0, 191, 255, 0.2) 20%,
      rgba(0, 191, 255, 0.2) 80%,
      transparent 100%);
    margin: 8px 0;
  }
</style>
