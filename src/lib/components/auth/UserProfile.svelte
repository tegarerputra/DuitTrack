<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { userStore } from '$stores/auth';
  import type { User } from 'firebase/auth';
  import SignOutButton from './SignOutButton.svelte';

  const dispatch = createEventDispatcher();

  export let showEmail = true;
  export let showName = true;
  export let showSignOut = true;
  export let avatarSize: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let layout: 'horizontal' | 'vertical' = 'horizontal';

  let user: User | null = null;

  // Subscribe to user store
  userStore.subscribe((userData) => {
    user = userData;
  });

  // Avatar size classes
  $: avatarClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-24 h-24'
  }[avatarSize];

  // Layout classes
  $: layoutClasses = layout === 'horizontal'
    ? 'flex items-center space-x-3'
    : 'flex flex-col items-center space-y-2';

  const handleSignOutSuccess = () => {
    dispatch('signout-success');
  };

  const handleSignOutError = (event: CustomEvent) => {
    dispatch('signout-error', event.detail);
  };

  const getDisplayName = (user: User | null): string => {
    if (!user) return 'User';
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
</script>

{#if user}
  <div class="user-profile {layoutClasses}">
    <!-- Avatar -->
    <div class="relative">
      {#if user.photoURL}
        <img
          src={user.photoURL}
          alt={getDisplayName(user)}
          class="{avatarClasses} rounded-full object-cover border-2 border-white/20"
          loading="lazy"
        />
      {:else}
        <div class="{avatarClasses} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-white/20">
          {getInitials(getDisplayName(user))}
        </div>
      {/if}

      <!-- Online indicator -->
      <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white/20"></div>
    </div>

    <!-- User Info -->
    <div class="{layout === 'vertical' ? 'text-center' : 'flex-1 min-w-0'}">
      {#if showName}
        <h3 class="user-name text-sm font-semibold text-white truncate">
          {getDisplayName(user)}
        </h3>
      {/if}

      {#if showEmail && user.email}
        <p class="user-email text-xs text-gray-300 truncate">
          {user.email}
        </p>
      {/if}

      {#if showSignOut}
        <div class="mt-2 space-y-2">
          <SignOutButton
            size="sm"
            variant="secondary"
            on:success={handleSignOutSuccess}
            on:error={handleSignOutError}
          />
          <button
            on:click={() => dispatch('reset-account')}
            class="text-xs text-red-400 hover:text-red-300 underline transition-colors"
          >
            Reset Akun
          </button>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- Loading skeleton -->
  <div class="user-profile {layoutClasses}">
    <div class="{avatarClasses} rounded-full bg-gray-300/20 animate-pulse"></div>

    <div class="{layout === 'vertical' ? 'text-center' : 'flex-1'}">
      <div class="h-4 bg-gray-300/20 rounded animate-pulse mb-1"></div>
      {#if showEmail}
        <div class="h-3 bg-gray-300/20 rounded animate-pulse w-2/3 {layout === 'vertical' ? 'mx-auto' : ''}"></div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .user-profile {
    /* Custom styles if needed */
  }
</style>