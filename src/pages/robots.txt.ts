import type { APIRoute } from "astro";

const BOTS = [
  "*",
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "Applebot",
  "Amazonbot",
  "CCBot",
  "FacebookBot",
  "meta-externalagent",
  "Bytespider",
];

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("SITE_URL is missing.");
  const sitemap = new URL("sitemap-index.xml", site).href;
  const groups = BOTS.map((bot) => `User-agent: ${bot}\nAllow: /`).join("\n\n");
  const body = `${groups}\n\nSitemap: ${sitemap}\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
