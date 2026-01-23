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
      downloads?: number; // allow downloads here as some code checks pkg.package.downloads
    };
    score?: { detail?: { popularity?: number } };
    downloads?: number; // last-month downloads (added by client fetch)
  }

  let packages: Package[] = [];
  let searchInput = "";
  let activeQuery = "";
  let sortBy: "date" | "name" | "downloads" = "date";
  let order: "asc" | "desc" = "desc";
  let loading = true;

  // Track previous mode so we only apply the mode default when the mode changes
  let prevSortBy: typeof sortBy | null = null;

  // Labels for the order buttons that change depending on mode
  let orderAscLabel = "↑ Asc";
  let orderDescLabel = "↓ Desc";

  // When the sort mode changes, apply sensible defaults per user request
  $: if (prevSortBy !== sortBy) {
    if (sortBy === "name") {
      // A-Z is default
      order = "asc";
    } else if (sortBy === "downloads") {
      // most downloads first is default
      order = "desc";
    } else {
      // date: keep current behavior (recent first)
      order = "desc";
    }
    // @ts-ignore
    prevSortBy = sortBy;
  }

  // Update visible labels for the order buttons based on mode
  $: {
    if (sortBy === "name") {
      orderAscLabel = "A → Z";
      orderDescLabel = "Z → A";
    } else if (sortBy === "downloads") {
      // Left button shows most downloads, right shows least downloads
      orderAscLabel = "Most";
      orderDescLabel = "Least";
    } else {
      // Date: left = Newest, right = Oldest
      orderAscLabel = "Newest";
      orderDescLabel = "Oldest";
    }
  }

  // Clicking left/right buttons maps to an order value depending on the mode
  function setLeftOrder() {
    if (sortBy === "name")
      order = "asc"; // A → Z
    else if (sortBy === "downloads")
      order = "desc"; // Most downloads first
    else order = "desc"; // Date: Newest first
    // eslint-disable-next-line no-console
    console.debug("setLeftOrder -> order", order, "mode", sortBy);
  }

  function setRightOrder() {
    if (sortBy === "name")
      order = "desc"; // Z → A
    else if (sortBy === "downloads")
      order = "asc"; // Least downloads first
    else order = "asc"; // Date: Oldest first
    // eslint-disable-next-line no-console
    console.debug("setRightOrder -> order", order, "mode", sortBy);
  }

  // Active state for left/right buttons depends on mode since meaning flips for some modes
  $: leftActive = sortBy === "name" ? order === "asc" : order === "desc";
  $: rightActive = sortBy === "name" ? order === "desc" : order === "asc"; // unchanged logic; references downloads via sortBy value checks elsewhere

  onMount(async () => {
    try {
      const res = await fetch(
        "https://registry.npmjs.org/-/v1/search?text=keywords:milkee-plugin&size=100",
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      packages = (data.objects || []).map((p: Package) => ({
        ...p,
        downloads: 0,
      }));
      console.log("Loaded packages:", packages.length);

      // Fetch last-month downloads for each package in parallel (best-effort).
      const downloadPromises = packages.map((p) =>
        fetch(
          `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(p.package.name)}`,
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      );

      const downloadResults = await Promise.allSettled(downloadPromises);
      downloadResults.forEach((res, idx) => {
        if (
          res.status === "fulfilled" &&
          res.value &&
          typeof res.value.downloads === "number"
        ) {
          packages[idx].downloads = Number(res.value.downloads);
        } else {
          packages[idx].downloads = 0;
        }
      });

      // Small debug sample
      // eslint-disable-next-line no-console
      console.debug(
        "Sample downloads:",
        packages
          .slice(0, 6)
          .map((p) => ({ name: p.package.name, d: p.downloads })),
      );
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
      // Use downloads (last-month) as the metric; fallback to 0
      va = Number(a?.downloads ?? a?.package?.downloads ?? 0);
      vb = Number(b?.downloads ?? b?.package?.downloads ?? 0);
    }

    // For debugging, log when sorting by downloads and order changes
    if (sortBy === "downloads") {
      // eslint-disable-next-line no-console
      console.debug("Sorting by downloads", {
        order,
        vaSample: va,
        vbSample: vb,
      });
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
      <label for="sort-by" class="control-label">Sort By:</label>
      <select id="sort-by" bind:value={sortBy} class="control-select">
        <option value="date">Recently Updated</option>
        <option value="name">Name (A-Z)</option>
        <option value="downloads">Downloads</option>
      </select>

      <div class="order-group" role="group" aria-labelledby="order-label">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label id="order-label" class="control-label">Order:</label>
        <button
          on:click={setLeftOrder}
          class="order-btn"
          class:active={leftActive}
          aria-pressed={leftActive}
          title={orderAscLabel}
        >
          {orderAscLabel}
        </button>
        <button
          on:click={setRightOrder}
          class="order-btn"
          class:active={rightActive}
          aria-pressed={rightActive}
          title={orderDescLabel}
        >
          {orderDescLabel}
        </button>
      </div>
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
              <div class="plugin-meta-row">
                <span class="plugin-meta-item"
                  ><span class="material-icons small" aria-hidden="true"
                    >person</span
                  ><span>{pkg.package.publisher.username}</span></span
                >
              </div>
              <div class="plugin-meta-row">
                <span class="plugin-meta-item"
                  ><span class="material-icons small" aria-hidden="true"
                    >calendar_today</span
                  ><span>{new Date(pkg.package.date).toLocaleDateString()}</span
                  ></span
                >
                <span class="plugin-meta-item">
                  <span class="material-icons small" aria-hidden="true"
                    >download</span
                  >
                  <span
                    >{(
                      pkg.downloads ??
                      pkg.package.downloads ??
                      0
                    ).toLocaleString()}</span
                  >
                </span>
              </div>
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
  .controls-left {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  /* Group that contains the order buttons aligned to the left side */
  .order-group {
    display: flex;
    gap: 0.5rem;
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
    display: block;
    font-size: 0.875rem;
    color: var(--color-coffee-light);
  }
  .plugin-meta-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .plugin-meta-row + .plugin-meta-row {
    margin-top: 0.5rem;
  }
  .plugin-meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
</style>
