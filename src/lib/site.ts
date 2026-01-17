// Central site configuration for easy domain/base-URL management.
// You can override values via environment variables (e.g., SITE_URL, SITE_IMAGE)
// when deploying (optional).

export const SITE = {
  url: "https://milkee.org",
  image: "https://milkee.org/img/milkee-logo.png",
};

export const siteUrl = (path = "") =>
  `${SITE.url.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
