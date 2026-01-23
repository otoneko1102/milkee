<script lang="ts">
  import { SITE_CONFIG } from "../settings/config.js";
  export let commands = [
    {
      id: "global",
      label: "# Global installation",
      cmd: "npm install -g milkee@latest",
    },
    {
      id: "local",
      label: "# Local installation (Dev)",
      cmd: "npm install -D milkee@latest",
    },
  ];

  let copiedId: string | null = null;

  async function copyCmd(cmd: string, id: string) {
    try {
      await navigator.clipboard.writeText(cmd);
      copiedId = id;
      setTimeout(() => (copiedId = null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }
</script>

<div class="install-box">
  <div class="install-panel">
    <div class="install-list">
      {#each commands as item}
        <div>
          <p class="cmd-label">{item.label}</p>
          <div class="cmd-row">
            <div class="cmd-main">
              <span class="cmd-dollar">$</span>
              <code class="cmd-code">{item.cmd}</code>
            </div>
            <button
              on:click={() => copyCmd(item.cmd, item.id)}
              class="btn-secondary copy-btn"
              aria-label={SITE_CONFIG.messages.copyCmdAria}
              title={SITE_CONFIG.messages.copyCmdAria}
            >
              {#if copiedId === item.id}
                <span aria-hidden="true" class="material-icons cmd-check"
                  >check</span
                >
                <span class="sr-only">{SITE_CONFIG.messages.copied}</span>
              {:else}
                <span aria-hidden="true" class="material-icons"
                  >content_copy</span
                >
                <span class="sr-only">{SITE_CONFIG.messages.copy}</span>
              {/if}
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .copy-btn {
    padding: 0.25rem 0.4rem;
    font-size: 1rem; /* keep emoji large enough to see */
    line-height: 1;
    min-width: 2.2rem;
    border-radius: 0.375rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* visually hidden for screen readers */
  .sr-only {
    position: absolute !important;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .install-box {
    width: 100%;
    max-width: 42rem;
    margin-bottom: 2.5rem;
  }

  .install-panel {
    background-color: var(--color-coffee-dark);
    color: var(--color-milk);
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    text-align: left;
    font-family: "Monaco", "Courier New", monospace;
    font-size: 0.875rem;
    border: 1px solid var(--color-coffee);
  }

  .install-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .cmd-label {
    color: var(--color-coffee-light);
    margin-bottom: 0.5rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cmd-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .cmd-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    overflow-x: auto;
    flex: 1;
  }
  .cmd-dollar {
    color: var(--color-success);
    user-select: none;
  }
  .cmd-code {
    white-space: nowrap;
  }
  .cmd-check {
    color: var(--color-success);
  }
</style>
