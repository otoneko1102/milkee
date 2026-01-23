const description = `A modern build tool for CoffeeScript.
Simple, fast, and creamy smooth.`;
const links = {
  npm: "https://www.npmjs.com/package/milkee",
  github: "https://github.com/otoneko1102/coffeescript-milkee",
};

export const SITE_CONFIG = {
  name: "Milkee",
  description: description,
  author: "otoneko.",
  startYear: 2025,
  nav: [
    { label: "Docs", href: "/docs" },
    { label: "Plugins", href: "/plugins" },
    { label: "npm", href: links.npm },
    { label: "GitHub", href: links.github },
  ],
  buttons: {
    getStarted: "Get Started",
    findPlugins: "Find Plugins",
    viewOnNpm: "View on npm registry →",
  },
  messages: {
    noDocument: "No document available.",
    warnDeprecated: "v2.2 and below are no longer supported.",
    copyCmdAria: "Copy command",
    copied: "Copied",
    copy: "Copy",
  },
};
