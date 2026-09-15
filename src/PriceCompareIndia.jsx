import React, { useState, useCallback } from "react";
import { Search, ExternalLink, X, Info, Loader2, AlertCircle } from "lucide-react";

// Where the price proxy lives. In dev, CRA's "proxy" field in package.json
// forwards /api to localhost:3001; in production set REACT_APP_PRICE_API
// to your deployed server's URL.
const API_BASE = process.env.REACT_APP_PRICE_API || "";

// Brand colours for stores we recognise. Anything else gets the neutral dot.
const STORE_COLORS = {
  "Amazon.in": "#FF9900",
  Flipkart: "#2874F0",
  Myntra: "#FF3F6C",
  Ajio: "#D4AF37",
  Croma: "#00A19C",
  "Reliance Digital": "#E4002B",
  "Tata CLiQ": "#C4161C",
  "Vijay Sales": "#0B4DA2",
  JioMart: "#0A6FB8",
  Nykaa: "#FC2779",
};

const POPULAR_SEARCHES = [  
  "wireless headphones",
  "running shoes",
  "air fryer",
  "smartwatch",
  "backpack",
  "mixer grinder",
];

let nextId = 1;

function formatINR(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function PriceCompareIndia() {
  const [query, setQuery] = useState("");
  const [searches, setSearches] = useState([]);

  const patchSearch = useCallback((id, patch) => {
    setSearches((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const runSearch = useCallback(
    async (id, term) => {
      patchSearch(id, { status: "loading", error: null });
      try {
        const res = await fetch(`${API_BASE}/api/prices?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        patchSearch(id, {
          status: "done",
          results: data.results || [],
          image: data.image || null,
          cached: data.cached,
        });
      } catch (err) {
        patchSearch(id, { status: "error", error: err.message });
      }
    },
    [patchSearch]
  );

  function handleSearch(term) {
    const clean = term.trim();
    if (!clean) return;
    const id = nextId++;
    setSearches((prev) => [
      { id, term: clean, status: "loading", results: [], image: null, error: null },
      ...prev,
    ]);
    setQuery("");
    runSearch(id, clean);
  }

  function removeSearch(id) {
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder { color: #AFAFAF; }
        .chip:hover { background: #F5F5F5; }
        .storeCard:hover { border-color: #C7C7C7; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .searchBtn:hover { background: #000000; }
        .searchBtn:disabled { background: #C7C7C7; cursor: default; }
        .removeBtn:hover { background: #F0F0F0; }
        .retryBtn:hover { background: #F5F5F5; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .spin { animation-duration: 3s; } }
        :focus-visible { outline: 2px solid #1A1A1A; outline-offset: 2px; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>PriceCheck India</span>
          <div style={styles.sourceBanner}>
            <Info size={13} />
            Prices come from Google Shopping listings via SerpAPI and can lag the retailer by a few
            minutes. Check the store page before you buy.
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.searchWrap}>
          <div style={styles.searchBar}>
            <Search size={18} color="#9A9A9A" />
            <input
              style={styles.searchInput}
              placeholder="Search for any product — try “running shoes” or “air fryer”"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            />
          </div>
          <button
            className="searchBtn"
            style={styles.searchBtn}
            onClick={() => handleSearch(query)}
            disabled={!query.trim()}
          >
            Search
          </button>
        </div>

        {searches.length === 0 && (
          <div style={styles.popularWrap}>
            <div style={styles.popularLabel}>Popular searches</div>
            <div style={styles.chips}>
              {POPULAR_SEARCHES.map((term) => (
                <button key={term} className="chip" style={styles.chip} onClick={() => handleSearch(term)}>
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {searches.map((s) => {
          const lowest = s.results.length ? s.results[0].price : null;

          return (
            <div key={s.id} style={styles.resultBlock}>
              <div style={styles.resultHeader}>
                <span>
                  Results for <span style={{ fontWeight: 700 }}>&ldquo;{s.term}&rdquo;</span>
                </span>
                <button
                  className="removeBtn"
                  style={styles.removeBtn}
                  onClick={() => removeSearch(s.id)}
                  aria-label={`Remove ${s.term}`}
                >
                  <X size={14} color="#9A9A9A" />
                </button>
              </div>

              {s.status === "loading" && (
                <div style={styles.stateBox} role="status">
                  <Loader2 className="spin" size={16} color="#9A9A9A" />
                  Checking stores
                </div>
              )}

              {s.status === "error" && (
                <div style={{ ...styles.stateBox, ...styles.errorBox }}>
                  <AlertCircle size={16} color="#C0392B" />
                  <span style={{ flex: 1 }}>{s.error}</span>
                  <button className="retryBtn" style={styles.retryBtn} onClick={() => runSearch(s.id, s.term)}>
                    Try again
                  </button>
                </div>
              )}

              {s.status === "done" && s.results.length === 0 && (
                <div style={styles.stateBox}>
                  No listings came back for this term. Try a more specific product name, like a brand and
                  model.
                </div>
              )}

              {s.status === "done" && s.results.length > 0 && (
                <>
                  {s.image && (
                    <div style={styles.productImageWrap}>
                      <img src={s.image} alt={s.term} style={styles.productImage} loading="lazy" />
                    </div>
                  )}

                  <div style={styles.storeGrid}>
                    {s.results.map((r) => {
                      const color = STORE_COLORS[r.store] || "#9A9A9A";
                      const isLowest = r.price === lowest;
                      return (
                        <a
                          key={r.store}
                          className="storeCard"
                          style={{ ...styles.storeCard, borderColor: isLowest ? color : "#EAEAEA" }}
                          href={r.link || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div style={styles.storeCardTop}>
                            <span style={{ ...styles.storeDot, background: color }} />
                            <span style={styles.storeName}>{r.store}</span>
                            <ExternalLink size={13} color="#9A9A9A" />
                          </div>
                          <div style={styles.priceRow}>
                            <span style={styles.price}>{r.priceLabel || formatINR(r.price)}</span>
                            {isLowest && <span style={styles.lowestBadge}>Lowest</span>}
                          </div>
                          {r.title && <span style={styles.itemTitle}>{r.title}</span>}
                          {r.delivery && <span style={styles.delivery}>{r.delivery}</span>}
                        </a>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}

        <div style={styles.footNote}>
          Listings are matched by store name, so the cheapest result for a store may be a different variant
          or a third-party seller. Results are cached for 30 minutes to stay inside the SerpAPI search quota.
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    background: "#FFFFFF",
    color: "#1A1A1A",
    minHeight: "100%",
  },
  header: {
    borderBottom: "1px solid #EAEAEA",
    padding: "1.25rem 1.5rem",
  },
  headerInner: {
    maxWidth: 720,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  sourceBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    fontSize: "0.78rem",
    color: "#5A6B7A",
    background: "#F4F8FB",
    border: "1px solid #DCE7F0",
    borderRadius: 8,
    padding: "0.55rem 0.8rem",
    lineHeight: 1.4,
  },
  main: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "2rem 1.5rem 3rem",
  },
  searchWrap: {
    display: "flex",
    gap: "0.6rem",
    marginBottom: "1.5rem",
  },
  searchBar: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    border: "1px solid #E0E0E0",
    borderRadius: 8,
    padding: "0.7rem 0.9rem",
    background: "#FAFAFA",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "0.92rem",
    width: "100%",
    color: "#1A1A1A",
  },
  searchBtn: {
    border: "none",
    borderRadius: 8,
    background: "#1A1A1A",
    color: "#FFFFFF",
    fontSize: "0.9rem",
    fontWeight: 600,
    padding: "0 1.4rem",
    cursor: "pointer",
  },
  popularWrap: {
    marginBottom: "1rem",
  },
  popularLabel: {
    fontSize: "0.78rem",
    color: "#9A9A9A",
    marginBottom: "0.6rem",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  chip: {
    fontSize: "0.83rem",
    padding: "0.45rem 0.9rem",
    borderRadius: 20,
    border: "1px solid #E0E0E0",
    background: "#FFFFFF",
    color: "#4A4A4A",
    cursor: "pointer",
  },
  resultBlock: {
    borderTop: "1px solid #EAEAEA",
    paddingTop: "1.5rem",
    marginBottom: "2rem",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.95rem",
    marginBottom: "1rem",
    color: "#4A4A4A",
  },
  removeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    border: "none",
    borderRadius: 6,
    background: "transparent",
    cursor: "pointer",
    flexShrink: 0,
  },
  stateBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    fontSize: "0.85rem",
    color: "#6A6A6A",
    border: "1px solid #EAEAEA",
    borderRadius: 10,
    padding: "1rem",
    lineHeight: 1.5,
  },
  errorBox: {
    borderColor: "#F2C9C4",
    background: "#FDF5F4",
    color: "#8E3B31",
  },
  retryBtn: {
    border: "1px solid #E0D0CD",
    borderRadius: 6,
    background: "#FFFFFF",
    color: "#8E3B31",
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: "0.35rem 0.7rem",
    cursor: "pointer",
    flexShrink: 0,
  },
  productImageWrap: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: "1rem",
    background: "#F5F5F5",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  storeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "0.75rem",
  },
  storeCard: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    border: "1px solid #EAEAEA",
    borderRadius: 10,
    padding: "0.9rem 1rem",
    textDecoration: "none",
    color: "#1A1A1A",
  },
  storeCardTop: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  storeDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  storeName: {
    flex: 1,
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  price: {
    fontSize: "1.05rem",
    fontWeight: 700,
  },
  lowestBadge: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#1A7A3C",
    background: "#E7F7EC",
    borderRadius: 5,
    padding: "0.15rem 0.4rem",
  },
  itemTitle: {
    fontSize: "0.75rem",
    color: "#6A6A6A",
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  delivery: {
    fontSize: "0.72rem",
    color: "#9A9A9A",
  },
  footNote: {
    fontSize: "0.75rem",
    color: "#9A9A9A",
    textAlign: "center",
    padding: "1rem 0 0",
    lineHeight: 1.5,
  },
};
