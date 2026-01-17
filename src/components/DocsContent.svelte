<script lang="ts">
  import { onMount } from "svelte";
  export let htmlMap: Record<string, string> = {};
  export let docFiles: string[] = [];
  // These are provided for external reference only (no internal use); export as consts to avoid linter warnings
  export const defaultFile: string = "";
  export const headingsByFile: Record<string, any> = {};

  const slugify = (text: string) => {
    const s = String(text).trim().toLowerCase();
    try {
      let base = s
        .normalize("NFKD")
        .replace(/[^^\p{L}\p{N}]+/gu, "-")
        .replace(/(^-|-$)+/g, "");
      if (!base)
        base =
          s.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") || "heading";
      return base;
    } catch (e) {
      return (
        s.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") || "heading"
      );
    }
  };

  const hashString = (text: string) => {
    let h = 5381;
    for (let i = 0; i < text.length; i++) {
      h = (h << 5) + h + text.charCodeAt(i);
      h = h >>> 0;
    }
    return h.toString(36).slice(-8);
  };

  const createId = (text: string) => {
    const s = String(text).trim();
    const base = slugify(s);
    if (/[^\x00-\x7f]/.test(base)) {
      return `h-${hashString(s)}`;
    }
    return base;
  };

  function getPageParam() {
    return new URLSearchParams(window.location.search).get("page");
  }
  function setPageParam(param: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", param);
    // Ensure hash is cleared when changing pages
    url.hash = "";
    history.replaceState(null, "", url.toString());
  }

  function fileToParam(f: string) {
    return f.replace(/\//g, "_");
  }

  function normalizeParam(q: string | null) {
    if (!q) return null;
    let qc = q;
    if (qc.startsWith("docs_")) qc = qc.replace(/^docs_/, "");
    if (qc.includes("_") && !docFiles.includes(qc)) {
      const maybeBase = qc.split("_").pop();
      if (maybeBase && docFiles.includes(maybeBase)) qc = maybeBase;
    }
    return qc;
  }

  function renderFromMap(param: string) {
    const container = document.querySelector(".docs-content");
    if (!container) return;
    const stored = document.querySelector(`[data-doc="${param}"]`);
    container.innerHTML =
      stored?.innerHTML ||
      htmlMap[param] ||
      '<p style="color:var(--color-coffee-light);padding:2rem;text-align:center">No document available.</p>';

    // Rebuild sidebar from current container headings
    const nav = document.querySelector(".sidebar-nav");
    if (nav) {
      buildTOCFromContainer();
    }
  }

  function buildTOCFromContainer() {
    const container = document.querySelector(".docs-content");
    const nav = document.querySelector(".sidebar-nav");
    if (!container || !nav) return;
    const headEls = Array.from(container.querySelectorAll("h1, h2, h3"));
    // Build a tree from headings and render properly nested lists
    const nodes: any[] = [];
    const stack: any[] = [{ level: 0, children: nodes }];
    headEls.forEach((h) => {
      if (!h.id) h.id = slugify(h.textContent || "");
      const level = parseInt(h.tagName.slice(1), 10);
      while (stack.length && stack[stack.length - 1].level >= level)
        stack.pop();
      const parent = stack[stack.length - 1];
      const node = {
        level,
        id: h.id,
        text: String(h.textContent || ""),
        children: [],
      };
      parent.children.push(node);
      stack.push(node);
    });

    const indentForLevel = (level: number) => {
      if (level === 1) return 0;
      if (level === 2) return 1.0;
      return 2.0;
    };

    const renderNodes = (ns: any[]) => {
      if (!ns || !ns.length) return "";
      let s = '<ul class="toc-list">';
      for (const n of ns) {
        const indent = indentForLevel(n.level);
        const style = `display:block;padding:0.125rem 0;padding-left:${indent}rem`;
        s += `<li class="toc-item toc-level-${n.level}" style="margin:0.25rem 0"><a href="#${n.id}" class="nav-h${n.level}" style="${style}">${n.text}</a>`;
        if (n.children && n.children.length) s += renderNodes(n.children);
        s += `</li>`;
      }
      s += "</ul>";
      return s;
    };

    nav.innerHTML = renderNodes(nodes);
  }

  onMount(() => {
    const select = document.getElementById(
      "doc-source",
    ) as HTMLSelectElement | null;
    const qRaw = getPageParam();
    const q = normalizeParam(qRaw);
    if (select) {
      if (q && Array.from(select.options).some((o) => o.value === q))
        select.value = q;
      renderFromMap(select.value);
      select.addEventListener("change", (e) => {
        const val = (e.target as HTMLSelectElement).value;
        setPageParam(val);
        renderFromMap(val);
        window.scrollTo({ top: 0 });
      });
    }

    // Mobile open/close
    const mobileOpen = document.getElementById("mobile-toc-open");
    const mobileClose = document.getElementById("mobile-toc-close");
    const sidebarEl = document.querySelector(".docs-sidebar");
    if (mobileOpen)
      mobileOpen.addEventListener("click", () =>
        sidebarEl?.classList.toggle("toc-open"),
      );
    if (mobileClose)
      mobileClose.addEventListener("click", () =>
        sidebarEl?.classList.remove("toc-open"),
      );

    // delegate nav clicks
    const nav = document.querySelector(".sidebar-nav");
    if (nav) {
      nav.addEventListener("click", (ev) => {
        const a =
          ev.target instanceof HTMLElement ? ev.target.closest("a") : null;
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (href.startsWith("#")) {
          ev.preventDefault();
          const raw = decodeURIComponent(href.slice(1));
          let el = document.getElementById(raw);
          if (!el) {
            const alt = createId(raw);
            el = document.getElementById(alt);
            if (el)
              history.replaceState(
                null,
                "",
                `${location.pathname}?page=${(document.getElementById("doc-source") as HTMLSelectElement | null)?.value}`,
              );
          } else {
            history.replaceState(
              null,
              "",
              `${location.pathname}?page=${(document.getElementById("doc-source") as HTMLSelectElement | null)?.value}`,
            );
          }
          if (el) el.scrollIntoView({ behavior: "smooth" });
        } else if (href.includes("?page=")) {
          ev.preventDefault();
          const url = new URL(href, location.origin);
          const param = url.searchParams.get("page");
          const hash = url.hash ? url.hash.slice(1) : null;
          if (param) {
            const selectEl = document.getElementById(
              "doc-source",
            ) as HTMLSelectElement | null;
            if (selectEl) selectEl.value = param;
            setPageParam(param);
            renderFromMap(param);
            if (hash) {
              const rawHash = decodeURIComponent(hash);
              let el2 = document.getElementById(rawHash);
              if (!el2) {
                const alt2 = createId(rawHash);
                el2 = document.getElementById(alt2);
                if (el2)
                  history.replaceState(
                    null,
                    "",
                    `${location.pathname}?page=${param}`,
                  );
              }
              if (el2) el2.scrollIntoView({ behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0 });
            }
          }
        }
      });
    }

    // Click outside to close on mobile
    document.addEventListener("click", (e) => {
      if (!sidebarEl || !sidebarEl.classList.contains("toc-open")) return;
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (
        !sidebarEl.contains(target) &&
        !(target instanceof HTMLElement && target.id === "mobile-toc-open")
      ) {
        sidebarEl.classList.remove("toc-open");
        const mobileBtn = document.getElementById("mobile-toc-open");
        if (mobileBtn instanceof HTMLElement)
          mobileBtn.setAttribute("aria-expanded", "false");
      }
    });
  });
</script>
