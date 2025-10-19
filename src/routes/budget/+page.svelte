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

    <!-- Footer -->
    <footer class="budget-footer">
      <div class="footer-content">
        <p class="footer-text">
          📧 <a href="mailto:tegarerputra@outlook.com" class="footer-email-link">tegarerputra@outlook.com</a>
          <span class="footer-separator">•</span>
          © {new Date().getFullYear()} DuitTrack
        </p>
      </div>
    </footer>
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

  /* Budget Footer */
  .budget-footer {
    margin-top: 40px;
    padding: 24px 20px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(6, 182, 212, 0.1);
    border-radius: 16px 16px 0 0;
    position: relative;
    z-index: 2;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }

  .footer-text {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    margin: 0;
    line-height: 1.6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .footer-email-link {
    color: #0891B2;
    text-decoration: none;
    transition: all 0.2s ease;
    font-weight: 600;
  }

  .footer-email-link:hover {
    color: #06B6D4;
    text-decoration: underline;
  }

  .footer-separator {
    color: #d1d5db;
    font-weight: 400;
    padding: 0 4px;
  }

  /* Mobile responsive footer */
  @media (max-width: 430px) {
    .budget-footer {
      margin-top: 32px;
      padding: 20px 16px;
    }

    .footer-text {
      font-size: 13px;
      gap: 6px;
    }

    .footer-email-link {
      font-size: 13px;
    }
  }
</style>