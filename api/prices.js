// Vercel serverless function — deployed automatically because it lives in /api.
// Available at https://your-app.vercel.app/api/prices?q=...
//
// Same logic as the local server.mjs, but as a single handler instead of an
// Express app, since Vercel runs each file in /api as its own function.

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

// Vercel functions are stateless between cold starts, so this cache only
// helps for requests that land on the same warm instance — good enough to
// smooth out double-clicks and repeated searches in a single session, but
// won't protect quota across a burst of unique visitors the way a real
// server's persistent cache would.
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

async function fetchShopping(query, apiKey) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("gl", "in");
  url.searchParams.set("hl", "en");
  url.searchParams.set("google_domain", "google.co.in");
  url.searchParams.set("currency", "INR");
  url.searchParams.set("num", "40");
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const data = await res.json();

  if (data.error) throw new Error(data.error);
  if (!res.ok) throw new Error(`SerpAPI returned ${res.status}`);
  return data;
}

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

export default async function handler(req, res) {
  const query = String(req.query.q || "").trim();
  if (!query) return res.status(400).json({ error: "Add a ?q= search term." });
  if (query.length > 120) return res.status(400).json({ error: "Search term is too long." });

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.error("SERPAPI_KEY is not set in Vercel's environment variables.");
    return res.status(500).json({ error: "Server is misconfigured." });
  }

  const key = query.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  try {
    const data = await fetchShopping(query, apiKey);
    const results = toStoreResults(data);
    const payload = {
      query,
      results: results.slice(0, 8),
      image: results.find((r) => r.thumbnail)?.thumbnail || null,
      fetchedAt: new Date().toISOString(),
    };
    CACHE.set(key, { at: Date.now(), payload });
    res.status(200).json({ ...payload, cached: false });
  } catch (err) {
    console.error("SerpAPI request failed:", err.message);
    res.status(502).json({ error: "Couldn't reach the price service. Try again in a moment." });
  }
}
