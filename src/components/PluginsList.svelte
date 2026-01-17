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
  <div style="margin-bottom:1rem;display:flex;gap:0.5rem;">
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
      style="flex:1;padding:0.75rem;border:1px solid var(--color-milk-dark);border-radius:0.5rem;font-size:1rem;outline:none;background-color:white;"
    />
    <button
      type="button"
      on:click={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      class="btn-primary"
      style="white-space:nowrap;"
    >
      Search
    </button>
  </div>

  <!-- Controls -->
  <div
    style="background-color:var(--color-milk-cream);padding:1rem;border-radius:0.75rem;box-shadow:0 1px 2px 0 rgba(0,0,0,0.05);border:1px solid var(--color-milk-dark);display:flex;flex-wrap:wrap;gap:1rem;align-items:center;justify-content:space-between;margin-bottom:2rem;"
  >
    <div style="display:flex;gap:1rem;align-items:center;">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label
        style="font-weight:700;color:var(--color-coffee);font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em;"
      >
        Sort By:
      </label>
      <select
        bind:value={sortBy}
        style="background-color:white;border:1px solid var(--color-milk-dark);color:var(--color-coffee);border-radius:0.375rem;padding:0.5rem 0.75rem;outline:none;"
      >
        <option value="date">Recently Updated</option>
        <option value="name">Name (A-Z)</option>
        <option value="popularity">Popularity</option>
      </select>
    </div>

    <div style="display:flex;gap:1rem;align-items:center;">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label
        style="font-weight:700;color:var(--color-coffee);font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em;"
      >
        Order:
      </label>
      <button
        on:click={() => (order = "asc")}
        style="background-color:{order === 'asc'
          ? 'var(--color-coffee)'
          : 'white'};color:{order === 'asc'
          ? 'var(--color-milk)'
          : 'var(--color-coffee)'};border:1px solid var(--color-milk-dark);padding:0.5rem 1rem;border-radius:0.375rem;cursor:pointer;font-weight:600;transition:all 0.2s ease;"
      >
        ↑ Asc
      </button>
      <button
        on:click={() => (order = "desc")}
        style="background-color:{order === 'desc'
          ? 'var(--color-coffee)'
          : 'white'};color:{order === 'desc'
          ? 'var(--color-milk)'
          : 'var(--color-coffee)'};border:1px solid var(--color-milk-dark);padding:0.5rem 1rem;border-radius:0.375rem;cursor:pointer;font-weight:600;transition:all 0.2s ease;"
      >
        ↓ Desc
      </button>
    </div>

    <div
      style="font-weight:600;color:var(--color-coffee-light);font-size:0.875rem;"
    >
      {resultCount}
    </div>
  </div>

  <!-- Packages List -->
  <div style="display:flex;flex-direction:column;gap:1.5rem;">
    {#if loading}
      <p
        style="text-align:center;color:var(--color-coffee-light);padding:2rem;"
      >
        Loading plugins...
      </p>
    {:else if sortedPackages.length === 0}
      <p
        style="text-align:center;color:var(--color-coffee-light);padding:2rem;"
      >
        No plugins found.
      </p>
    {:else}
      {#each sortedPackages as pkg (pkg.package.name)}
        <div
          style="background-color:white;border:1px solid var(--color-milk-dark);padding:1.5rem;border-radius:0.75rem;display:flex;flex-direction:column;gap:1rem;"
        >
          <div>
            <div
              style="display:flex;align-items:baseline;gap:0.75rem;margin-bottom:0.25rem;"
            >
              <a
                href={pkg.package.links.npm}
                target="_blank"
                rel="noreferrer"
                style="font-size:1.5rem;font-weight:700;color:var(--color-coffee);text-decoration:underline;text-decoration-color:var(--color-coffee-light);text-decoration-thickness:2px;"
              >
                {pkg.package.name}
              </a>
              <span
                style="background-color:var(--color-milk-cream);color:var(--color-coffee-light);font-size:0.75rem;padding:0.25rem 0.5rem;border-radius:9999px;font-family:monospace;"
              >
                v{pkg.package.version}
              </span>
            </div>
            <p style="color:var(--color-coffee);margin-bottom:0.75rem;">
              {pkg.package.description || "No description"}
            </p>
            <div
              style="display:flex;flex-wrap:wrap;gap:0.5rem;font-size:0.875rem;color:var(--color-coffee-light);"
            >
              <span>👤 {pkg.package.publisher.username}</span>
              <span>📅 {new Date(pkg.package.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
