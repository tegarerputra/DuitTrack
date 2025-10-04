<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$stores/auth';
  import { goto } from '$app/navigation';

  // Import components
  import Budget from '$lib/components/budget/Budget.svelte';
  import AuthGuard from '$components/auth/AuthGuard.svelte';

  export let params: Record<string, string> = {};

  onMount(() => {
    if (browser) {
      // Check authentication
      authStore.subscribe((isAuthenticated) => {
        if (!isAuthenticated) {
          goto('/');
        }
      });
    }
  });
</script>

<svelte:head>
  <title>Budget - DuitTrack</title>
  <meta name="description" content="Kelola budget keuangan Anda dengan mudah" />
</svelte:head>

<AuthGuard requireAuth={true} redirectTo="/" let:user let:isAuthenticated>
  <div class="budget-page-wrapper">
    <Budget />
  </div>
</AuthGuard>

<style>
  .budget-page-wrapper {
    min-height: 100vh;
    background:
      radial-gradient(circle at 20% 80%, rgba(0, 191, 255, 0.04) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(30, 144, 255, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(0, 123, 255, 0.02) 0%, transparent 40%),
      linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  }

  @media (max-width: 768px) {
    .budget-page-wrapper {
      background:
        radial-gradient(circle at 30% 20%, rgba(0, 191, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 70% 80%, rgba(30, 144, 255, 0.06) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(0, 123, 255, 0.04) 0%, transparent 30%),
        linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
    }
  }
</style>