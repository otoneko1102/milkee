<script lang="ts">
  import { onMount } from "svelte";

  interface Package {
    package: {
      name: string;
      version: string;
      description: string;
      date: string;
      links: { npm: string };
      publisher: { username: string };
      keywords?: string[];
    };
    score: { detail: { popularity: number } };
  }

  let packages: Package[] = [];
  let searchInput = "";
  let activeQuery = "";
  let sortBy: "date" | "name" | "popularity" = "date";
  let order: "asc" | "desc" = "desc";
  let loading = true;

  onMount(async () => {
    try {
      const res = await fetch(
        "https://registry.npmjs.org/-/v1/search?text=keywords:milkee-plugin&size=100",
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      packages = data.objects || [];
      console.log("Loaded packages:", packages.length);
    } catch (err) {
      console.error("Failed to fetch plugins:", err);
      packages = [];
    } finally {
      loading = false;
    }
  });

  function handleSearch() {
    const trimmed = searchInput.trim();
    activeQuery = trimmed;
  }

  $: filteredPackages = (() => {
    if (!activeQuery) return packages;

    const q = activeQuery.toLowerCase();
    return packages.filter((p) => {
      const name = p.package.name.toLowerCase();
      const nameNoPrefix = name.replace("milkee-plugin-", "");

      return nameNoPrefix.includes(q);
    });
  })();

  $: sortedPackages = [...filteredPackages].sort((a, b) => {
    let va: any, vb: any;

    if (sortBy === "date") {
      va = new Date(a.package.date).getTime();
      vb = new Date(b.package.date).getTime();
    } else if (sortBy === "name") {
      va = a.package.name;
      vb = b.package.name;
      return order === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    } else {
      va = a.score.detail.popularity;
      vb = b.score.detail.popularity;
    }

    return order === "asc" ? va - vb : vb - va;
  });

  $: resultCount = `${sortedPackages.length} / ${packages.length} results`;
</script>

<div>
  <!-- Search Box -->
  <div class="search-row">
    <input
      type="text"
      bind:value={searchInput}
      on:keypress={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSearch();
        }
      }}
      placeholder="Search plugins..."
      class="search-input"
    />
    <button
      type="button"
      on:click={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      class="btn-primary nowrap"
    >
      Search
    </button>
  </div>

  <!-- Controls -->
  <div class="plugins-controls">
    <div class="controls-left">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="control-label">Sort By:</label>
      <select bind:value={sortBy} class="control-select">
        <option value="date">Recently Updated</option>
        <option value="name">Name (A-Z)</option>
        <option value="popularity">Popularity</option>
      </select>
    </div>

    <div class="controls-mid">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="control-label">Order:</label>
      <button
        on:click={() => (order = "asc")}
        class="order-btn"
        class:active={order === "asc"}
      >
        ↑ Asc
      </button>
      <button
        on:click={() => (order = "desc")}
        class="order-btn"
        class:active={order === "desc"}
      >
        ↓ Desc
      </button>
    </div>

    <div class="result-count">{resultCount}</div>
  </div>

  <!-- Packages List -->
  <div class="plugins-list">
    {#if loading}
      <p class="empty-state">Loading plugins...</p>
    {:else if sortedPackages.length === 0}
      <p class="empty-state">No plugins found.</p>
    {:else}
      {#each sortedPackages as pkg (pkg.package.name)}
        <div class="plugin-item">
          <div>
            <div class="plugin-header">
              <a
                href={pkg.package.links.npm}
                target="_blank"
                rel="noreferrer"
                class="plugin-name">{pkg.package.name}</a
              >
              <span class="plugin-version">v{pkg.package.version}</span>
            </div>
            <p class="plugin-desc">
              {pkg.package.description || "No description"}
            </p>
            <div class="plugin-meta">
              <span class="plugin-meta-item"
                ><span class="material-icons small" aria-hidden="true"
                  >person</span
                ><span>{pkg.package.publisher.username}</span></span
              >
              <span class="plugin-meta-item"
                ><span class="material-icons small" aria-hidden="true"
                  >calendar_today</span
                ><span>{new Date(pkg.package.date).toLocaleDateString()}</span
                ></span
              >
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .search-row {
    margin-bottom: 1rem;
    display: flex;
    gap: 0.5rem;
  }
  .search-input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--color-milk-dark);
    border-radius: 0.5rem;
    font-size: 1rem;
    outline: none;
    background-color: white;
  }
  .nowrap {
    white-space: nowrap;
  }

  .plugins-controls {
    background-color: var(--color-milk-cream);
    padding: 1rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid var(--color-milk-dark);
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }
  .controls-left,
  .controls-mid {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .control-label {
    font-weight: 700;
    color: var(--color-coffee);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .control-select {
    background-color: white;
    border: 1px solid var(--color-milk-dark);
    color: var(--color-coffee);
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    outline: none;
  }

  .order-btn {
    border: 1px solid var(--color-milk-dark);
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
    background: white;
    color: var(--color-coffee);
  }
  .order-btn.active {
    background: var(--color-coffee);
    color: var(--color-milk);
  }

  .result-count {
    font-weight: 600;
    color: var(--color-coffee-light);
    font-size: 0.875rem;
  }

  .plugins-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .empty-state {
    text-align: center;
    color: var(--color-coffee-light);
    padding: 2rem;
  }

  .plugin-item {
    background-color: white;
    border: 1px solid var(--color-milk-dark);
    padding: 1.5rem;
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .plugin-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }
  .plugin-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-coffee);
    text-decoration: underline;
    text-decoration-color: var(--color-coffee-light);
    text-decoration-thickness: 2px;
  }
  .plugin-version {
    background-color: var(--color-milk-cream);
    color: var(--color-coffee-light);
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-family: monospace;
  }
  .plugin-desc {
    color: var(--color-coffee);
    margin-bottom: 0.75rem;
  }
  .plugin-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-coffee-light);
  }
  .plugin-meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
</style>
