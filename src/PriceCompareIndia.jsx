import React, { useState } from "react";
import { Search, ExternalLink, X, Home, Link2, Check, Pencil } from "lucide-react";

const RETAILERS = [
  {
    name: "Amazon.in",
    color: "#FF9900",
    home: "https://www.amazon.in",
    url: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  },
  {
    name: "Flipkart",
    color: "#2874F0",
    home: "https://www.flipkart.com",
    url: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Myntra",
    color: "#FF3F6C",
    home: "https://www.myntra.com",
    url: (q) => `https://www.myntra.com/${encodeURIComponent(q.trim().replace(/\s+/g, "-"))}`,
  },
  {
    name: "Ajio",
    color: "#D4AF37",
    home: "https://www.ajio.com",
    url: (q) => `https://www.ajio.com/search/?text=${encodeURIComponent(q)}`,
  },
  {
    name: "Croma",
    color: "#00A19C",
    home: "https://www.croma.com",
    url: (q) =>
      `https://www.croma.com/searchB?q=${encodeURIComponent(q)}%3Arelevance&text=${encodeURIComponent(q)}`,
  },
  {
    name: "Reliance Digital",
    color: "#E4002B",
    home: "https://www.reliancedigital.in",
    url: (q) => `https://www.reliancedigital.in/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: "BigBasket",
    color: "#84C225",
    home: "https://www.bigbasket.com",
    url: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Tata Cliq",
    color: "#E90C8B",
    home: "https://www.tatacliq.com",
    url: (q) => `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(q)}`,
  },
  {
    name: "Nykaa",
    color: "#FC2779",
    home: "https://www.nykaa.com",
    url: (q) => `https://www.nykaa.com/search/result/?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Snapdeal",
    color: "#E40046",
    home: "https://www.snapdeal.com",
    url: (q) => `https://www.snapdeal.com/search?keyword=${encodeURIComponent(q)}`,
  },
];

const POPULAR_SEARCHES = [
  "wireless headphones",
  "running shoes",
  "air fryer",
  "smartwatch",
  "backpack",
  "coffee",
  "mixer grinder",
  "laptop",
  "office chair",
  "bluetooth speaker",
  "yoga mat",
  "electric kettle",
];

let nextId = 1;

function isValidUrl(value) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function PriceCompareIndia() {
  const [query, setQuery] = useState("");
  // Every search a person runs gets appended here — no cap, so
  // comparing 10+ products in one session just means a longer list.
  // Each entry can also carry pasted exact-product links per retailer.
  const [searches, setSearches] = useState([]);
  const [editingKey, setEditingKey] = useState(null); // `${searchId}:${retailerName}`
  const [editingValue, setEditingValue] = useState("");

  function handleSearch(term) {
    const clean = term.trim();
    if (!clean) return;
    setSearches((prev) => [{ id: nextId++, term: clean, links: {} }, ...prev]);
    setQuery("");
  }

  function removeSearch(id) {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    if (editingKey && editingKey.startsWith(`${id}:`)) {
      setEditingKey(null);
      setEditingValue("");
    }
  }

  function clearAll() {
    setSearches([]);
    setEditingKey(null);
    setEditingValue("");
  }

  function startEditing(searchId, retailerName, currentValue) {
    setEditingKey(`${searchId}:${retailerName}`);
    setEditingValue(currentValue || "");
  }

  function cancelEditing() {
    setEditingKey(null);
    setEditingValue("");
  }

  function saveLink(searchId, retailerName) {
    const clean = editingValue.trim();
    setSearches((prev) =>
      prev.map((s) => {
        if (s.id !== searchId) return s;
        const links = { ...s.links };
        if (clean && isValidUrl(clean)) {
          links[retailerName] = clean;
        } else {
          delete links[retailerName];
        }
        return { ...s, links };
      })
    );
    setEditingKey(null);
    setEditingValue("");
  }

  function removeLink(searchId, retailerName) {
    setSearches((prev) =>
      prev.map((s) => {
        if (s.id !== searchId) return s;
        const links = { ...s.links };
        delete links[retailerName];
        return { ...s, links };
      })
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder { color: #AFAFAF; }
        .chip:hover { background: #F5F5F5; }
        .storeCard:hover { border-color: #C7C7C7; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .homeLink:hover { border-color: #C7C7C7; }
        .searchBtn:hover { background: #000000; }
        .removeBtn:hover { background: #F0F0F0; }
        .clearBtn:hover { color: #1A1A1A; }
        .editBtn:hover { background: #F0F0F0; }
        .saveBtn:hover { background: #000000; }
        .linkRemoveBtn:hover { color: #C0392B; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>PriceCheck India</span>
          <span style={styles.headerSub}>
            Search any product to open live results across {RETAILERS.length} Indian retailers. Found the exact
            listing you want? Paste its link in and this becomes your watchlist.
          </span>
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

        <div style={styles.popularWrap}>
          <div style={styles.popularLabel}>Popular searches</div>
          <div style={styles.chips}>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                className="chip"
                style={styles.chip}
                onClick={() => handleSearch(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {searches.length === 0 && (
          <div style={styles.homesWrap}>
            <div style={styles.popularLabel}>Or just browse a store directly</div>
            <div style={styles.homeGrid}>
              {RETAILERS.map((r) => (
                <a
                  key={r.name}
                  className="homeLink"
                  style={styles.homeLink}
                  href={r.home}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span style={{ ...styles.storeDot, background: r.color }} />
                  <span style={styles.storeName}>{r.name}</span>
                  <Home size={14} color="#9A9A9A" />
                </a>
              ))}
            </div>
          </div>
        )}

        {searches.length > 0 && (
          <div style={styles.resultsWrap}>
            <div style={styles.resultsTopBar}>
              <span style={styles.resultsCount}>
                {searches.length} product{searches.length === 1 ? "" : "s"} being compared
              </span>
              <button className="clearBtn" style={styles.clearBtn} onClick={clearAll}>
                Clear all
              </button>
            </div>

            {searches.map((s) => (
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
                  {RETAILERS.map((r) => {
                    const exactLink = s.links[r.name];
                    const key = `${s.id}:${r.name}`;
                    const isEditing = editingKey === key;

                    if (isEditing) {
                      return (
                        <div key={r.name} style={styles.editCard}>
                          <div style={styles.editCardTop}>
                            <span style={{ ...styles.storeDot, background: r.color }} />
                            <span style={styles.storeName}>{r.name}</span>
                          </div>
                          <input
                            autoFocus
                            style={styles.editInput}
                            placeholder="Paste the exact product URL"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveLink(s.id, r.name);
                              if (e.key === "Escape") cancelEditing();
                            }}
                          />
                          <div style={styles.editCardBtns}>
                            <button
                              className="saveBtn"
                              style={styles.saveBtn}
                              onClick={() => saveLink(s.id, r.name)}
                            >
                              <Check size={13} /> Save
                            </button>
                            <button style={styles.cancelBtn} onClick={cancelEditing}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={r.name} style={styles.storeCardWrap}>
                        <a
                          className="storeCard"
                          style={{
                            ...styles.storeCard,
                            borderColor: exactLink ? r.color : "#EAEAEA",
                            background: exactLink ? "#FFFDF9" : "#FFFFFF",
                          }}
                          href={exactLink || r.url(s.term)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span style={{ ...styles.storeDot, background: r.color }} />
                          <div style={styles.storeCardText}>
                            <span style={styles.storeName}>{r.name}</span>
                            {exactLink && <span style={styles.exactBadge}>Exact listing saved</span>}
                          </div>
                          <ExternalLink size={15} color="#9A9A9A" />
                        </a>
                        <div style={styles.cardActions}>
                          <button
                            className="editBtn"
                            style={styles.editBtn}
                            onClick={() => startEditing(s.id, r.name, exactLink)}
                            aria-label={`Paste exact ${r.name} link for ${s.term}`}
                          >
                            {exactLink ? <Pencil size={12} /> : <Link2 size={12} />}
                            {exactLink ? "Edit link" : "Paste exact link"}
                          </button>
                          {exactLink && (
                            <button
                              className="linkRemoveBtn"
                              style={styles.linkRemoveBtn}
                              onClick={() => removeLink(s.id, r.name)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={styles.hint}>
              Cards with no pasted link open that store's live search results. Once you paste a product's exact
              URL, that card opens the specific listing instead — this tool can't fetch live prices, so you'll
              still check the price on the actual page.
            </div>
          </div>
        )}

        <div style={styles.footNote}>
          This tool links to live retailer pages. It doesn't display prices directly, since that requires each
          retailer's approved pricing API.
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
    gap: "0.35rem",
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  headerSub: {
    fontSize: "0.8rem",
    color: "#767676",
    lineHeight: 1.5,
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
    marginTop: "0.5rem",
    marginBottom: "2rem",
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
  homesWrap: {
    borderTop: "1px solid #EAEAEA",
    paddingTop: "1.5rem",
  },
  homeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "0.6rem",
  },
  homeLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    border: "1px solid #EAEAEA",
    borderRadius: 10,
    padding: "0.75rem 0.9rem",
    textDecoration: "none",
    color: "#1A1A1A",
  },
  resultsWrap: {
    borderTop: "1px solid #EAEAEA",
    paddingTop: "1.5rem",
  },
  resultsTopBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
  },
  resultsCount: {
    fontSize: "0.78rem",
    color: "#9A9A9A",
  },
  clearBtn: {
    border: "none",
    background: "none",
    color: "#9A9A9A",
    fontSize: "0.78rem",
    cursor: "pointer",
    padding: 0,
  },
  resultBlock: {
    marginBottom: "1.75rem",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.95rem",
    marginBottom: "0.75rem",
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
  storeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "0.75rem",
  },
  storeCardWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  storeCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    border: "1px solid #EAEAEA",
    borderRadius: 10,
    padding: "0.9rem 1rem",
    textDecoration: "none",
    color: "#1A1A1A",
  },
  storeCardText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    minWidth: 0,
  },
  exactBadge: {
    fontSize: "0.68rem",
    color: "#767676",
  },
  storeDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  storeName: {
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  cardActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    padding: "0 0.2rem",
  },
  editBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    border: "none",
    background: "none",
    color: "#9A9A9A",
    fontSize: "0.72rem",
    cursor: "pointer",
    padding: "0.2rem 0.3rem",
    borderRadius: 5,
  },
  linkRemoveBtn: {
    border: "none",
    background: "none",
    color: "#B0B0B0",
    fontSize: "0.72rem",
    cursor: "pointer",
    padding: "0.2rem 0.3rem",
  },
  editCard: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    border: "1px solid #1A1A1A",
    borderRadius: 10,
    padding: "0.8rem 0.9rem",
  },
  editCardTop: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  editInput: {
    border: "1px solid #E0E0E0",
    borderRadius: 6,
    padding: "0.45rem 0.6rem",
    fontSize: "0.8rem",
    outline: "none",
    width: "100%",
  },
  editCardBtns: {
    display: "flex",
    gap: "0.5rem",
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    border: "none",
    borderRadius: 6,
    background: "#1A1A1A",
    color: "#FFFFFF",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.35rem 0.7rem",
    cursor: "pointer",
  },
  cancelBtn: {
    border: "none",
    background: "none",
    color: "#9A9A9A",
    fontSize: "0.75rem",
    cursor: "pointer",
    padding: "0.35rem 0.4rem",
  },
  hint: {
    marginTop: "0.5rem",
    fontSize: "0.78rem",
    color: "#9A9A9A",
  },
  footNote: {
    fontSize: "0.75rem",
    color: "#9A9A9A",
    textAlign: "center",
    padding: "2.5rem 0 0",
  },
};
