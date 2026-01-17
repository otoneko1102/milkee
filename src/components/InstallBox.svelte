<script lang="ts">
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

<div style="width:100%;max-width:42rem;margin-bottom:2.5rem;">
  <div
    style="background-color:var(--color-coffee-dark);color:var(--color-milk);border-radius:0.5rem;padding:1.5rem;box-shadow:inset 0 2px 4px 0 rgba(0,0,0,0.3);text-align:left;font-family:'Monaco','Courier New',monospace;font-size:0.875rem;border:1px solid var(--color-coffee);"
  >
    <div style="display:flex;flex-direction:column;gap:1.5rem;">
      {#each commands as item}
        <div>
          <p
            style="color:var(--color-coffee-light);margin-bottom:0.5rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;"
          >
            {item.label}
          </p>
          <div
            style="display:flex;align-items:center;justify-content:space-between;gap:1rem;background-color:rgba(0,0,0,0.2);padding:0.75rem;border-radius:0.375rem;border:1px solid rgba(255,255,255,0.1);"
          >
            <div
              style="display:flex;align-items:center;gap:0.75rem;overflow-x:auto;flex:1;"
            >
              <span style="color:#4ade80;user-select:none;">$</span>
              <code style="white-space:nowrap;">{item.cmd}</code>
            </div>
            <button
              on:click={() => copyCmd(item.cmd, item.id)}
              class="btn-secondary"
              style="font-size:0.75rem;"
            >
              {#if copiedId === item.id}
                <span style="color:#4ade80;">✓</span> Copied
              {:else}
                <span>📋</span> Copy
              {/if}
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
