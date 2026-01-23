<script lang="ts">
  import { onMount } from "svelte";

  let version = "Loading...";
  let downloads = "Loading...";
  let lastUpdated = "-";
  let error = false;

  onMount(async () => {
    try {
      const [registryRes, downloadsRes] = await Promise.all([
        fetch("https://registry.npmjs.org/milkee"),
        fetch("https://api.npmjs.org/downloads/point/last-month/milkee"),
      ]);

      if (!registryRes.ok || !downloadsRes.ok)
        throw new Error("Failed to fetch");

      const registry = await registryRes.json();
      const dl = await downloadsRes.json();

      version = "v" + registry["dist-tags"].latest;
      lastUpdated = new Date(registry.time.modified).toLocaleDateString(
        "ja-JP",
      );
      downloads = dl.downloads.toLocaleString();
    } catch (err) {
      console.warn("Failed to load milkee stats", err);
      error = true;
    }
  });
</script>

<div class="stats-grid">
  <div class="stat-item">
    <div class="stat-title">Latest Version</div>
    <div class="stat-value">{version}</div>
  </div>

  <div class="stat-item">
    <div class="stat-title">Monthly Downloads</div>
    <div class="stat-value">{downloads}</div>
  </div>

  <div class="stat-item">
    <div class="stat-title">Last Updated</div>
    <div class="stat-value">{lastUpdated}</div>
  </div>
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    width: 100%;
    max-width: 42rem;
    margin-bottom: 2.5rem;
  }
  .stat-item {
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-milk-dark);
    text-align: center;
  }
  .stat-title {
    font-weight: 700;
    color: var(--color-coffee);
    margin-bottom: 0.5rem;
  }
  .stat-value {
    font-weight: 800;
    color: var(--color-coffee-dark);
    font-size: 1.125rem;
  }
</style>
