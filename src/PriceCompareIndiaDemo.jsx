import React, { useState } from "react";
import { Search, ExternalLink, X, Info } from "lucide-react";

const RETAILERS = [
  { name: "Amazon.in", color: "#FF9900", url: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
  { name: "Flipkart", color: "#2874F0", url: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}` },
  { name: "Myntra", color: "#FF3F6C", url: (q) => `https://www.myntra.com/${encodeURIComponent(q.trim().replace(/\s+/g, "-"))}` },
  { name: "Ajio", color: "#D4AF37", url: (q) => `https://www.ajio.com/search/?text=${encodeURIComponent(q)}` },
  { name: "Croma", color: "#00A19C", url: (q) => `https://www.croma.com/searchB?q=${encodeURIComponent(q)}%3Arelevance&text=${encodeURIComponent(q)}` },
  { name: "Reliance Digital", color: "#E4002B", url: (q) => `https://www.reliancedigital.in/search?q=${encodeURIComponent(q)}` },
];

const POPULAR_SEARCHES = [
  "wireless headphones",
  "running shoes",
  "air fryer",
  "smartwatch",
  "backpack",
  "mixer grinder",
];

let nextId = 1;

// Deterministic pseudo-random number from a string, so the same
// product + retailer always shows the same demo price on refresh.
function seededRandom(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

function demoPrice(term, retailerName) {
  const base = 500 + seededRandom(term) * 15000;
  const variance = (seededRandom(term + retailerName) - 0.5) * 0.3;
  const price = Math.round((base * (1 + variance)) / 10) * 10;
  return price;
}

function formatINR(n) {
  return "₹" + n.toLocaleString("en-IN");
}

// Unsplash's keyword-based endpoint returns a real, relevant photo
// for a search term with no API key required — good enough for a
// visual mockup, not a real product-catalog image.
function imageFor(term) {
  return `https://source.unsplash.com/400x300/?${encodeURIComponent(term)}`;
}

export default function PriceCompareIndiaDemo() {
  const [query, setQuery] = useState("");
  const [searches, setSearches] = useState([]);

  function handleSearch(term) {
    const clean = term.trim();
    if (!clean) return;
    setSearches((prev) => [{ id: nextId++, term: clean }, ...prev]);
    setQuery("");
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
        .removeBtn:hover { background: #F0F0F0; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>PriceCheck India</span>
          <div style={styles.demoBanner}>
            <Info size={13} />
            Demo mode — prices below are sample data, not pulled from any retailer. Real prices require
            approved API access (see note at the bottom).
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
          <button className="searchBtn" style={styles.searchBtn} onClick={() => handleSearch(query)}>
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
          const priced = RETAILERS.map((r) => ({ ...r, price: demoPrice(s.term, r.name) })).sort(
            (a, b) => a.price - b.price
          );
          const lowest = priced[0].price;

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

              <div style={styles.storeGrid}>
                {priced.map((r) => (
                  <a
                    key={r.name}
                    className="storeCard"
                    style={{
                      ...styles.storeCard,
                      borderColor: r.price === lowest ? r.color : "#EAEAEA",
                    }}
                    href={r.url(s.term)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div style={styles.storeCardTop}>
                      <span style={{ ...styles.storeDot, background: r.color }} />
                      <span style={styles.storeName}>{r.name}</span>
                      <ExternalLink size={13} color="#9A9A9A" />
                    </div>
                    <div style={styles.priceRow}>
                      <span style={styles.price}>{formatINR(r.price)}</span>
                      {r.price === lowest && <span style={styles.lowestBadge}>Lowest</span>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}

        <div style={styles.footNote}>
          Prices shown are randomly generated for demo purposes and refresh consistently per search term —
          they do not reflect real retailer pricing. Getting live prices requires each retailer's approved
          pricing API (e.g. Amazon Product Advertising API), which needs affiliate approval and a backend to
          call it securely.
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
  demoBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    fontSize: "0.78rem",
    color: "#8A6D00",
    background: "#FFF8E1",
    border: "1px solid #F3E2A0",
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
    objectFit: "cover",
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
    gap: "0.5rem",
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
  footNote: {
    fontSize: "0.75rem",
    color: "#9A9A9A",
    textAlign: "center",
    padding: "1rem 0 0",
    lineHeight: 1.5,
  },
};
