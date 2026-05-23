// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Writes public/sitemap.xml. If the number of entries exceeds URLS_PER_SITEMAP,
// it also writes shard files (sitemap-1.xml, sitemap-2.xml, ...) and turns
// public/sitemap.xml into a <sitemapindex>.

import { writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { resolve, join } from "path";

const BASE_URL = "https://comida-ia-bem.lovable.app";
const URLS_PER_SITEMAP = 45000; // sitemaps.org limit is 50,000; leave headroom
const BUILD_DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

type ChangeFreq =
  | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: string;
}

// Consistent defaults by route role
const DEFAULTS = {
  home:     { changefreq: "weekly"  as ChangeFreq, priority: "1.0" },
  primary:  { changefreq: "weekly"  as ChangeFreq, priority: "0.9" },
  auth:     { changefreq: "monthly" as ChangeFreq, priority: "0.8" },
  flow:     { changefreq: "monthly" as ChangeFreq, priority: "0.7" },
  utility:  { changefreq: "monthly" as ChangeFreq, priority: "0.5" },
};

const rawEntries: SitemapEntry[] = [
  { path: "/",                 ...DEFAULTS.home },
  { path: "/planos",           ...DEFAULTS.primary },
  { path: "/cadastro",         ...DEFAULTS.auth },
  { path: "/login",            ...DEFAULTS.auth },
  { path: "/escolher-plano",   ...DEFAULTS.flow },
  { path: "/verificar-email",  ...DEFAULTS.utility },
  { path: "/checkout/sucesso", ...DEFAULTS.utility },
];

// Normalize: ensure every entry has a lastmod for consistency
const entries: SitemapEntry[] = rawEntries.map((e) => ({
  lastmod: BUILD_DATE,
  ...e,
}));

function renderUrlset(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

function renderSitemapIndex(shardFiles: string[]) {
  const items = shardFiles.map((f) =>
    [
      `  <sitemap>`,
      `    <loc>${BASE_URL}/${f}</loc>`,
      `    <lastmod>${BUILD_DATE}</lastmod>`,
      `  </sitemap>`,
    ].join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items,
    `</sitemapindex>`,
  ].join("\n");
}

const publicDir = resolve("public");
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

// Clean up old shards to avoid stale files when entry count shrinks
for (const f of readdirSync(publicDir)) {
  if (/^sitemap-\d+\.xml$/.test(f)) unlinkSync(join(publicDir, f));
}

if (entries.length <= URLS_PER_SITEMAP) {
  writeFileSync(join(publicDir, "sitemap.xml"), renderUrlset(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
} else {
  const shards: string[] = [];
  for (let i = 0; i < entries.length; i += URLS_PER_SITEMAP) {
    const chunk = entries.slice(i, i + URLS_PER_SITEMAP);
    const name = `sitemap-${shards.length + 1}.xml`;
    writeFileSync(join(publicDir, name), renderUrlset(chunk));
    shards.push(name);
  }
  writeFileSync(join(publicDir, "sitemap.xml"), renderSitemapIndex(shards));
  console.log(
    `sitemap index written: ${shards.length} shards, ${entries.length} entries total`
  );
}
