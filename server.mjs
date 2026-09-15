// Minimal price API backed by SerpAPI's Google Shopping engine.
// Run with: SERPAPI_KEY=xxxxx node server.js
//
// Why a server at all: SerpAPI keys are billed per search and cannot be
// exposed in browser code. This process holds the key, caches results so
// repeat searches don't burn quota, and is the only thing that talks to
// SerpAPI.

import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));

const PORT = process.env.PORT || 3001;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

if (!SERPAPI_KEY) {
  console.error("SERPAPI_KEY is not set. Add it to .env or the environment before starting.");
  process.exit(1);
}

// Sources we care about, mapped from however Google labels them to the
// name the UI uses. Match is a lowercase substring test, so "Amazon.in -
// Seller" and "Amazon.in" both land on the same card.
const STORE_ALIASES = [
  ["amazon", "Amazon.in"],
  ["flipkart", "Flipkart"],
  ["myntra", "Myntra"],
  ["ajio", "Ajio"],
  ["croma", "Croma"],
  ["reliance", "Reliance Digital"],
  ["tata cliq", "Tata CLiQ"],
  ["vijay sales", "Vijay Sales"],
  ["jiomart", "JioMart"],
  ["nykaa", "Nykaa"],
];

function normalizeStore(source) {
  if (!source) return null;
  const s = String(source).toLowerCase();
  const hit = STORE_ALIASES.find(([needle]) => s.includes(needle));
  return hit ? hit[1] : String(source).trim();
}

// SerpAPI's free tier is 100 searches/month, so cache aggressively.
const CACHE = new Map();
const TTL_MS = 30 * 60 * 1000;

function cacheGet(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  return hit.payload;
}

async function fetchShopping(query) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("gl", "in");
  url.searchParams.set("hl", "en");
  url.searchParams.set("google_domain", "google.co.in");
  url.searchParams.set("currency", "INR");
  url.searchParams.set("num", "40");
  url.searchParams.set("api_key", SERPAPI_KEY);

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const data = await res.json();

  if (data.error) throw new Error(data.error);
  if (!res.ok) throw new Error(`SerpAPI returned ${res.status}`);
  return data;
}

// Keep the cheapest listing per store, so each retailer shows up once.
function toStoreResults(data) {
  const items = data.shopping_results || [];
  const best = new Map();

  for (const item of items) {
    const price = typeof item.extracted_price === "number" ? item.extracted_price : null;
    if (price === null) continue;

    const store = normalizeStore(item.source);
    if (!store) continue;

    const existing = best.get(store);
    if (existing && existing.price <= price) continue;

    best.set(store, {
      store,
      price,
      priceLabel: item.price || null,
      title: item.title || null,
      link: item.product_link || item.link || null,
      thumbnail: item.thumbnail || null,
      rating: item.rating ?? null,
      reviews: item.reviews ?? null,
      delivery: item.delivery || null,
    });
  }

  return [...best.values()].sort((a, b) => a.price - b.price);
}

app.get("/api/prices", async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) return res.status(400).json({ error: "Add a ?q= search term." });
  if (query.length > 120) return res.status(400).json({ error: "Search term is too long." });

  const key = query.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const data = await fetchShopping(query);
    const results = toStoreResults(data);
    const payload = {
      query,
      results: results.slice(0, 8),
      image: results.find((r) => r.thumbnail)?.thumbnail || null,
      fetchedAt: new Date().toISOString(),
    };
    CACHE.set(key, { at: Date.now(), payload });
    res.json({ ...payload, cached: false });
  } catch (err) {
    console.error("SerpAPI request failed:", err.message);
    res.status(502).json({ error: "Couldn't reach the price service. Try again in a moment." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, cacheSize: CACHE.size }));

app.listen(PORT, () => {
  console.log(`Price API listening on http://localhost:${PORT}`);
});
