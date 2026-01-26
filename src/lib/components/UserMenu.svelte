<script>
  import { authStore, currentUser, signOutUser } from '../stores/auth.js';
  import { isFirebaseConfigured } from '../firebase/config.js';

  let isOpen = false;
  let loading = false;

  function toggleMenu() {
    isOpen = !isOpen;
  }

  function closeMenu() {
    isOpen = false;
  }

  async function handleSignOut() {
    loading = true;
    try {
      await signOutUser();
      isOpen = false;
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      loading = false;
    }
  }

  // Close menu when clicking outside
  function handleClickOutside(event) {
    if (isOpen && !event.target.closest('.user-menu')) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

{#if $currentUser}
  <div class="user-menu">
    <button class="avatar-button" on:click={toggleMenu}>
      {#if $currentUser.photoURL}
        <img
          src={$currentUser.photoURL}
          alt={$currentUser.displayName || 'User'}
          class="avatar"
          referrerpolicy="no-referrer"
        />
      {:else}
        <div class="avatar placeholder">
          {($currentUser.displayName || $currentUser.email || 'U').charAt(0).toUpperCase()}
        </div>
      {/if}
    </button>

    {#if isOpen}
      <div class="dropdown">
        <div class="user-info">
          {#if $currentUser.photoURL}
            <img
              src={$currentUser.photoURL}
              alt={$currentUser.displayName || 'User'}
              class="dropdown-avatar"
              referrerpolicy="no-referrer"
            />
          {:else}
            <div class="dropdown-avatar placeholder">
              {($currentUser.displayName || $currentUser.email || 'U').charAt(0).toUpperCase()}
            </div>
          {/if}
          <div class="user-details">
            <div class="user-name">{$currentUser.displayName || 'User'}</div>
            <div class="user-email">{$currentUser.email}</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="sync-status">
          <span class="sync-icon">&#9679;</span>
          <span>Synced to cloud</span>
        </div>

        <div class="divider"></div>

        <button class="menu-item signout-item" on:click={handleSignOut} disabled={loading}>
          {#if loading}
            <span class="spinner"></span>
          {:else}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          {/if}
          Sign Out
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .user-menu {
    position: relative;
  }

  .avatar-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .avatar-button:hover {
    transform: scale(1.05);
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    object-fit: cover;
  }

  .avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.3);
    color: white;
    font-weight: 600;
    font-size: 16px;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: var(--bg-card, white);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    min-width: 260px;
    z-index: 1000;
    overflow: hidden;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
  }

  .dropdown-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
  }

  .dropdown-avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    font-size: 18px;
  }

  .user-details {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-weight: 600;
    color: var(--text-primary, #333);
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-email {
    font-size: 13px;
    color: var(--text-secondary, #666);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .divider {
    height: 1px;
    background: var(--border-color, #e0e0e0);
    margin: 0;
  }

  .sync-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    font-size: 13px;
    color: var(--text-secondary, #666);
  }

  .sync-icon {
    color: #22c55e;
    font-size: 10px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    font-size: 14px;
    color: var(--text-primary, #333);
    cursor: pointer;
    transition: background 0.2s;
  }

  .menu-item:hover {
    background: var(--bg-secondary, #f5f5f5);
  }

  .signout-item {
    color: #ef4444;
  }

  .signout-item:hover {
    background: #fef2f2;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
