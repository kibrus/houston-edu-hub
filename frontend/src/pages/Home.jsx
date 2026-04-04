import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllSchools, getLatest } from "../services/api";
import SchoolList    from "../components/SchoolList";
import SchoolPreview from "../components/SchoolPreview";

const CATEGORIES = ["All", "Public University", "Community College", "Private Nonprofit", "Private For-Profit"];
const SORT_OPTIONS = [
  { label: "Name",            key: "college_name",    dir: "asc"  },
  { label: "Graduation Rate", key: "graduation_rate", dir: "desc" },
  { label: "Lowest Cost",     key: "net_annual_cost", dir: "asc"  },
  { label: "Median Earnings", key: "median_earnings", dir: "desc" },
  { label: "Enrollment",      key: "enrollment",      dir: "desc" },
];

// Module-level cache — persists across navigation
const cache = { schools: null };

export default function Home() {
  const navigate                              = useNavigate();
  const [schools, setSchools]                 = useState(cache.schools || []);
  const [filtered, setFiltered]               = useState(cache.schools || []);
  const [selected, setSelected]               = useState(null);
  const [selectedLatest, setSelectedLatest]   = useState(null);
  const [compareIds, setCompareIds]           = useState([]);
  const [search, setSearch]                   = useState("");
  const [category, setCategory]               = useState("All");
  const [sortIdx, setSortIdx]                 = useState(0);
  const [loading, setLoading]                 = useState(!cache.schools);

  useEffect(() => {
    if (cache.schools) {
      if (!selected && cache.schools.length > 0) handleSelect(cache.schools[0]);
      return;
    }
    setLoading(true);
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
        cache.schools = withLatest;
        setSchools(withLatest);
        setFiltered(withLatest);
        if (withLatest.length > 0) handleSelect(withLatest[0]);
      })
      .finally(() => setLoading(false));
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

  const handleSelect = useCallback(async (school) => {
    setSelected(school);
    setSelectedLatest(school.latest || {});
  }, []);

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
      <div style={{ background: "var(--color-dark)", padding: "1rem 2rem", display: "flex", gap: "0.75rem", alignItems: "center", borderTop: "1px solid #1C2E42" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by school name..."
          style={{ background: "#F8FAFC", border: "1px solid #2A3D54", borderRadius: "var(--radius-sm)", padding: "0.55rem 1rem", fontSize: "14px", color: "var(--color-text)", width: "300px" }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          style={{ background: "#1C2E42", border: "1px solid #2A3D54", borderRadius: "var(--radius-sm)", padding: "0.55rem 1rem", fontSize: "13px", color: "#CBD5E1" }}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <span style={{ color: "#64748B", fontSize: "13px", marginLeft: "auto" }}>{filtered.length} institutions</span>
        <select value={sortIdx} onChange={(e) => setSortIdx(Number(e.target.value))}
          style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.45rem 0.75rem", fontSize: "13px", color: "var(--color-text)" }}>
          {SORT_OPTIONS.map((o, i) => <option key={o.key} value={i}>Sort: {o.label}</option>)}
        </select>
      </div>

      {/* Split panel */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.75rem", color: "var(--color-text-muted)" }}>
            <div style={{ fontSize: "24px" }}>🎓</div>
            <div>Loading institutions...</div>
          </div>
        ) : (
          <>
            <SchoolList schools={filtered} selectedId={selected?.college_id} onSelect={handleSelect} />
            <SchoolPreview school={selected} latest={selectedLatest} onAddToCompare={handleAddToCompare} compareIds={compareIds} />
          </>
        )}
      </div>

      {/* Compare bar */}
      {compareIds.length > 0 && (
        <div style={{ background: "var(--color-dark)", padding: "0.75rem 2rem", display: "flex", alignItems: "center", gap: "1rem", borderTop: "1px solid #1C2E42" }}>
          <span style={{ color: "#94A3B8", fontSize: "13px" }}>Ready to Compare:</span>
          <span style={{ background: "var(--color-gold)", color: "var(--color-dark)", borderRadius: "50%", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "600" }}>
            {compareIds.length}
          </span>
          <span style={{ color: "#94A3B8", fontSize: "13px" }}>{compareIds.length === 1 ? "school selected" : "schools selected"}</span>
          <button onClick={() => navigate(`/compare?ids=${compareIds.join(",")}`)} style={{ background: "var(--color-gold)", color: "var(--color-dark)", border: "none", borderRadius: "var(--radius-sm)", padding: "7px 18px", fontSize: "13px", fontWeight: "500" }}>
            Compare Now
          </button>
          <button onClick={() => setCompareIds([])} style={{ background: "transparent", color: "#64748B", border: "1px solid #2A3D54", borderRadius: "var(--radius-sm)", padding: "7px 14px", fontSize: "13px" }}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}