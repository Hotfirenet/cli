import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

type Category = "performance" | "accessibility" | "best-practices" | "seo" | "pwa";
type Strategy = "mobile" | "desktop";

interface LighthouseResult {
  categories?: Record<string, { score: number; title: string }>;
  audits?: Record<string, { score: number | null; title: string; displayValue?: string }>;
}

interface PageSpeedResponse {
  lighthouseResult?: LighthouseResult;
  id?: string;
}

function formatScore(score: number | null): string {
  if (score === null) return "n/a";
  const pct = Math.round(score * 100);
  if (pct >= 90) return `\x1b[32m${pct}\x1b[0m`; // green
  if (pct >= 50) return `\x1b[33m${pct}\x1b[0m`; // orange
  return `\x1b[31m${pct}\x1b[0m`;                 // red
}

export const analyzeResource = new Command("analyze")
  .description("Run a PageSpeed Insights analysis");

analyzeResource
  .command("run <url>")
  .description("Analyze a URL with PageSpeed Insights")
  .option("--strategy <strategy>", "mobile or desktop", "mobile")
  .option("--category <categories...>", "Categories: performance accessibility best-practices seo pwa", ["performance", "seo", "accessibility", "best-practices"])
  .option("--json", "Output raw JSON")
  .action(async (url, opts) => {
    try {
      const categories: Category[] = Array.isArray(opts.category) ? opts.category : [opts.category];
      const strategy: Strategy = opts.strategy;

      const params: Record<string, unknown> = { url, strategy };
      categories.forEach((c) => {
        // PageSpeed expects repeated category params — URLSearchParams doesn't support that natively
        // We append them manually below
      });

      // Build URL manually for repeated category params
      const base = `${process.env.PAGESPEED_URL ?? "https://www.googleapis.com/pagespeedonline/v5"}/runPagespeed`;
      const token = process.env.PAGESPEED_TOKEN ?? (await import("../lib/config.js")).getToken();
      const qs = new URLSearchParams({ url, strategy, key: token ?? "" });
      categories.forEach((c) => qs.append("category", c));

      const res = await fetch(`${base}?${qs}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(60_000),
      });
      const data = await res.json() as PageSpeedResponse;

      if (opts.json) {
        output(data, { json: true });
        return;
      }

      const lhr = data.lighthouseResult;
      if (!lhr) { console.error("No lighthouse result"); process.exit(1); }

      console.log(`\nPageSpeed Insights — ${data.id ?? url} [${strategy}]\n`);

      const cats = lhr.categories ?? {};
      console.log("Scores:");
      for (const [, cat] of Object.entries(cats)) {
        console.log(`  ${cat.title.padEnd(20)} ${formatScore(cat.score)}`);
      }

      // Core Web Vitals
      const cwv = ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index", "interactive"];
      const audits = lhr.audits ?? {};
      const cwvAudits = cwv.filter((k) => audits[k]);
      if (cwvAudits.length) {
        console.log("\nCore Web Vitals:");
        for (const key of cwvAudits) {
          const a = audits[key];
          console.log(`  ${a.title.padEnd(35)} ${a.displayValue ?? formatScore(a.score)}`);
        }
      }
    } catch (err) { handleError(err, opts.json); }
  });

analyzeResource
  .command("compare <url>")
  .description("Compare mobile vs desktop scores side by side")
  .option("--category <categories...>", "Categories to compare", ["performance", "seo", "accessibility", "best-practices"])
  .option("--json", "Output as JSON")
  .action(async (url, opts) => {
    try {
      const categories: Category[] = opts.category;

      async function fetchScores(strategy: Strategy) {
        const qs = new URLSearchParams({ url, strategy, key: (await import("../lib/config.js")).getToken() ?? "" });
        categories.forEach((c) => qs.append("category", c));
        const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(60_000),
        });
        return (await res.json()) as PageSpeedResponse;
      }

      console.log(`Fetching mobile & desktop scores for ${url}...`);
      const [mobile, desktop] = await Promise.all([fetchScores("mobile"), fetchScores("desktop")]);

      if (opts.json) { output({ mobile, desktop }, { json: true }); return; }

      const mCats = mobile.lighthouseResult?.categories ?? {};
      const dCats = desktop.lighthouseResult?.categories ?? {};

      console.log(`\n${"Category".padEnd(25)} ${"Mobile".padEnd(10)} Desktop`);
      console.log("-".repeat(45));
      for (const key of Object.keys(mCats)) {
        const title = mCats[key].title.padEnd(25);
        const m = formatScore(mCats[key]?.score ?? null).padEnd(10);
        const d = formatScore(dCats[key]?.score ?? null);
        console.log(`${title} ${m} ${d}`);
      }
    } catch (err) { handleError(err, opts.json); }
  });
