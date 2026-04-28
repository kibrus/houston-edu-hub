import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllSchools, getLatest } from "../services/api";
import SchoolList     from "../components/SchoolList";
import SchoolPreview  from "../components/SchoolPreview";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage   from "../components/ErrorMessage";

const CATEGORIES = ["All", "Public University", "Community College", "Private Nonprofit", "Private For-Profit"];
const SORT_OPTIONS = [
  { label: "Name",            key: "college_name",    dir: "asc"  },
  { label: "Graduation Rate", key: "graduation_rate", dir: "desc" },
  { label: "Lowest Cost",     key: "net_annual_cost", dir: "asc"  },
  { label: "Median Earnings", key: "median_earnings", dir: "desc" },
  { label: "Enrollment",      key: "enrollment",      dir: "desc" },
];

const cache = { schools: null };

function hasEnoughData(latest) {
  if (!latest) return false;
  const fields = [
    "graduation_rate", "retention_rate", "net_annual_cost",
    "median_earnings", "acceptance_rate", "enrollment",
    "median_debt", "pell_grant_pct",
  ];
  const filled = fields.filter((f) => latest[f] != null).length;
  return filled / fields.length >= 0.4;
}

export default function Home() {
  const navigate                            = useNavigate();
  const [schools, setSchools]               = useState(cache.schools || []);
  const [filtered, setFiltered]             = useState(cache.schools || []);
  const [selected, setSelected]             = useState(null);
  const [selectedLatest, setSelectedLatest] = useState(null);
  const [compareIds, setCompareIds]         = useState([]);
  const [search, setSearch]                 = useState("");
  const [category, setCategory]             = useState("All");
  const [sortIdx, setSortIdx]               = useState(0);
  const [loading, setLoading]               = useState(!cache.schools);
  const [error, setError]                   = useState(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [isMobile, setIsMobile]             = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadSchools = () => {
    setLoading(true);
    setError(null);
    getAllSchools()
      .then(async (data) => {
        const withLatest = await Promise.all(
          data.map(async (s) => {
            try {
              const l = await getLatest(s.college_id);
              return { ...s, latest: l };
            } catch {
              return { ...s, latest: {} };
            }
          })
        );
        const enoughData = withLatest.filter((s) => hasEnoughData(s.latest));
        cache.schools = enoughData;
        setSchools(enoughData);
        setFiltered(enoughData);
        if (enoughData.length > 0) handleSelect(enoughData[0]);
      })
      .catch(() => setError("Failed to load institutions. Please check your connection and try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (cache.schools) {
      if (!selected && cache.schools.length > 0) handleSelect(cache.schools[0]);
      return;
    }
    loadSchools();
  }, []);

  useEffect(() => {
    let result = [...schools];
    if (search.trim()) {
      result = result.filter((s) => s.college_name.toLowerCase().includes(search.toLowerCase()));
    }
    if (category !== "All") {
      result = result.filter((s) => s.category === category);
    }
    const sort = SORT_OPTIONS[sortIdx];
    result.sort((a, b) => {
      const av = sort.key === "college_name" ? a[sort.key] : a.latest?.[sort.key];
      const bv = sort.key === "college_name" ? b[sort.key] : b.latest?.[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sort.dir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    setFiltered(result);
  }, [schools, search, category, sortIdx]);

  const handleSelect = useCallback((school) => {
    setSelected(school);
    setSelectedLatest(school.latest || {});
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleAddToCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3)  return prev;
      return [...prev, id];
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 58px)" }}>

      {/* Search bar */}
      <div style={{
        background: "var(--color-dark)",
        padding:    isMobile ? "0.75rem 1rem" : "1rem 2rem",
        display:    "flex",
        gap:        "0.5rem",
        alignItems: "center",
        flexWrap:   isMobile ? "wrap" : "nowrap",
        borderTop:  "1px solid #1C2E42",
        flexShrink: 0,
      }}>
        {/* Hamburger toggle on mobile */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background:   "var(--color-gold)",
              border:       "none",
              borderRadius: "var(--radius-sm)",
              padding:      "0.5rem 0.75rem",
              color:        "var(--color-dark)",
              fontSize:     "18px",
              cursor:       "pointer",
              flexShrink:   0,
              lineHeight:   1,
            }}
          >
            ☰
          </button>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by school name..."
          style={{
            background:   "#F8FAFC",
            border:       "1px solid #2A3D54",
            borderRadius: "var(--radius-sm)",
            padding:      "0.5rem 0.85rem",
            fontSize:     "14px",
            color:        "var(--color-text)",
            flex:         isMobile ? "1" : "0 0 300px",
            minWidth:     "0",
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            background:   "#1C2E42",
            border:       "1px solid #2A3D54",
            borderRadius: "var(--radius-sm)",
            padding:      "0.5rem 0.75rem",
            fontSize:     "12px",
            color:        "#CBD5E1",
            flex:         isMobile ? "1" : "0 0 auto",
          }}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        {!isMobile && (
          <>
            <span style={{ color: "#64748B", fontSize: "13px", marginLeft: "auto" }}>
              {loading ? "Loading..." : `${filtered.length} institutions`}
            </span>
            <select
              value={sortIdx}
              onChange={(e) => setSortIdx(Number(e.target.value))}
              style={{
                background:   "var(--color-white)",
                border:       "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding:      "0.45rem 0.75rem",
                fontSize:     "13px",
                color:        "var(--color-text)",
              }}
            >
              {SORT_OPTIONS.map((o, i) => <option key={o.key} value={i}>Sort: {o.label}</option>)}
            </select>
          </>
        )}

        {isMobile && (
          <select
            value={sortIdx}
            onChange={(e) => setSortIdx(Number(e.target.value))}
            style={{
              background:   "#1C2E42",
              border:       "1px solid #2A3D54",
              borderRadius: "var(--radius-sm)",
              padding:      "0.5rem 0.6rem",
              fontSize:     "12px",
              color:        "#CBD5E1",
              flex:         "1",
            }}
          >
            {SORT_OPTIONS.map((o, i) => <option key={o.key} value={i}>Sort: {o.label}</option>)}
          </select>
        )}
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

        {/* Dark overlay when sidebar open on mobile */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position:   "fixed",
              inset:      0,
              top:        "58px",
              background: "rgba(0,0,0,0.5)",
              zIndex:     49,
            }}
          />
        )}

        {/* School list */}
        {(!isMobile || sidebarOpen) && (
          <div style={{
            position:   isMobile ? "fixed" : "relative",
            top:        isMobile ? "58px" : "auto",
            left:       0,
            bottom:     0,
            zIndex:     isMobile ? 50 : "auto",
            width:      isMobile ? "280px" : "auto",
            boxShadow:  isMobile ? "4px 0 16px rgba(0,0,0,0.25)" : "none",
            height:     isMobile ? "auto" : "100%",
            overflowY:  "auto",
          }}>
            {isMobile && (
              <div style={{ background: "var(--color-dark)", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#fff", fontSize: "13px", fontWeight: "500" }}>
                  {filtered.length} Institutions
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{ background: "transparent", border: "none", color: "#64748B", fontSize: "20px", cursor: "pointer" }}
                >×</button>
              </div>
            )}

            {loading ? (
              <LoadingSpinner message="Loading..." />
            ) : error ? (
              <ErrorMessage message={error} onRetry={() => { cache.schools = null; loadSchools(); }} />
            ) : filtered.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                <div style={{ fontSize: "24px", marginBottom: "0.5rem" }}>🔍</div>
                <div style={{ fontSize: "13px" }}>No institutions found.</div>
                <button
                  onClick={() => { setSearch(""); setCategory("All"); }}
                  style={{ marginTop: "0.75rem", background: "var(--color-gold)", color: "var(--color-dark)", border: "none", borderRadius: "var(--radius-sm)", padding: "6px 14px", fontSize: "12px", cursor: "pointer" }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <SchoolList
                schools={filtered}
                selectedId={selected?.college_id}
                onSelect={handleSelect}
              />
            )}
          </div>
        )}

        {/* School preview — full width on mobile */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loading && !isMobile ? (
            <LoadingSpinner message="Loading Houston-area institutions..." />
          ) : error && !isMobile ? (
            <ErrorMessage message={error} onRetry={() => { cache.schools = null; loadSchools(); }} />
          ) : (
            <SchoolPreview
              school={selected}
              latest={selectedLatest}
              onAddToCompare={handleAddToCompare}
              compareIds={compareIds}
            />
          )}
        </div>
      </div>

      {/* Compare bar */}
      {compareIds.length > 0 && (
        <div style={{
          background: "var(--color-dark)",
          padding:    isMobile ? "0.65rem 1rem" : "0.75rem 2rem",
          display:    "flex",
          alignItems: "center",
          gap:        "0.75rem",
          borderTop:  "1px solid #1C2E42",
          flexShrink: 0,
          flexWrap:   "wrap",
        }}>
          <span style={{ color: "#94A3B8", fontSize: "13px" }}>Compare:</span>
          <span style={{
            background:    "var(--color-gold)",
            color:         "var(--color-dark)",
            borderRadius:  "50%",
            width:         "20px",
            height:        "20px",
            display:       "inline-flex",
            alignItems:    "center",
            justifyContent:"center",
            fontSize:      "11px",
            fontWeight:    "600",
          }}>{compareIds.length}</span>
          <button
            onClick={() => navigate(`/compare?ids=${compareIds.join(",")}`)}
            style={{ background: "var(--color-gold)", color: "var(--color-dark)", border: "none", borderRadius: "var(--radius-sm)", padding: "7px 16px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}
          >
            Compare Now
          </button>
          <button
            onClick={() => setCompareIds([])}
            style={{ background: "transparent", color: "#64748B", border: "1px solid #2A3D54", borderRadius: "var(--radius-sm)", padding: "7px 12px", fontSize: "13px", cursor: "pointer" }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}