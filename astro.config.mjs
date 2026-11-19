import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import fs from "node:fs/promises";
import { getSiteUrl, INDEXNOW_KEY } from "./site.config.mjs";

const site = getSiteUrl();
const parsedSite = new URL(site);
if (parsedSite.protocol !== "http:" && parsedSite.protocol !== "https:") {
  throw new Error(`SITE_URL must start with http:// or https:// (got ${site})`);
}

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "never",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/thanks"),
    }),
    indexNowKeyFile(),
  ],
  image: {
    responsiveStyles: true,
  },
  vite: {
    define: {
      "import.meta.env.INCLUDE_DRAFTS": JSON.stringify(process.env.INCLUDE_DRAFTS === "true"),
    },
  },
});

function indexNowKeyFile() {
  return {
    name: "indexnow-key-file",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split("?")[0];
          if (path === `/${INDEXNOW_KEY}.txt`) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(INDEXNOW_KEY);
            return;
          }
          next();
        });
      },
      "astro:build:done": async ({ dir }) => {
        const base = dir.href.endsWith("/") ? dir.href : `${dir.href}/`;
        await fs.writeFile(new URL(`${INDEXNOW_KEY}.txt`, base), INDEXNOW_KEY);
      },
    },
  };
}
