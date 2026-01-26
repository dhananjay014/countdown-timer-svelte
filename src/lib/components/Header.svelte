<script>
  import AuthButton from './AuthButton.svelte';
  import UserMenu from './UserMenu.svelte';
  import { isAuthenticated, isLoading } from '../stores/auth.js';
  import { isFirebaseConfigured } from '../firebase/config.js';
</script>

<header>
  <div class="header-content">
    <div class="brand">
      <span class="icon">&#9200;</span>
      <div class="titles">
        <h1>Countdown Timer</h1>
        <p>Track time, stay on schedule</p>
      </div>
    </div>

    {#if isFirebaseConfigured()}
      <div class="auth-area">
        {#if $isLoading}
          <div class="loading-spinner"></div>
        {:else if $isAuthenticated}
          <UserMenu />
        {:else}
          <AuthButton />
        {/if}
      </div>
    {/if}
  </div>
</header>

<style>
  header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon {
    font-size: 32px;
    display: flex;
    align-items: center;
  }

  .titles {
    text-align: left;
  }

  h1 {
    color: white;
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin-top: 2px;
  }

  .auth-area {
    display: flex;
    align-items: center;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 480px) {
    .header-content {
      flex-direction: column;
      gap: 16px;
    }

    .brand {
      justify-content: center;
    }

    .titles {
      text-align: center;
    }
  }
</style>
