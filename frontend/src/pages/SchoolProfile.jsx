import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSchool, getMetrics, getDiversity, getLatest } from "../services/api";
import MapView from "../components/MapView";
import CostsTab        from "../components/profile/CostsTab";
import OutcomesTab     from "../components/profile/OutcomesTab";
import DiversityTab    from "../components/profile/DiversityTab";
import AdmissionsTab   from "../components/profile/AdmissionsTab";
import FinancialAidTab from "../components/profile/FinancialAidTab";

const BADGE = {
  "Public University":  { bg: "#EEF2FF", color: "#4F46E5" },
  "Community College":  { bg: "#F0FDF4", color: "#15803D" },
  "Private Nonprofit":  { bg: "#FDF4FF", color: "#9333EA" },
  "Private For-Profit": { bg: "#FFF7ED", color: "#EA580C" },
};

const TABS = [
  { key: "costs",      label: "Costs"        },
  { key: "outcomes",   label: "Outcomes"      },
  { key: "diversity",  label: "Diversity"     },
  { key: "admissions", label: "Admissions"    },
  { key: "financial",  label: "Financial Aid" },
];

export default function SchoolProfile() {
  const { id }                    = useParams();
  const navigate                  = useNavigate();
  const [school,    setSchool]    = useState(null);
  const [metrics,   setMetrics]   = useState([]);
  const [diversity, setDiversity] = useState([]);
  const [latest,    setLatest]    = useState({});
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("costs");

  useEffect(() => {
    setLoading(true);
    setActiveTab("costs");
    Promise.all([getSchool(id), getMetrics(id), getDiversity(id), getLatest(id)])
      .then(([s, m, d, l]) => {
        setSchool(s);
        setMetrics(m);
        setDiversity(d);
        setLatest(l || {});
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--color-text-muted)", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ fontSize: "24px" }}>🎓</div>
      <div>Loading school data...</div>
    </div>
  );

  if (!school) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--color-text-muted)" }}>
      School not found.
    </div>
  );

  const badge = BADGE[school.category] || BADGE["Private For-Profit"];
  const tags  = [
    school.predominant_degree,
    school.ownership,
    school.size,
    school.urbanicity,
    school.specialized_mission !== "None" ? school.specialized_mission : null,
  ].filter(Boolean);

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "calc(100vh - 58px)" }}>
      <div style={{ background: "var(--color-dark)", padding: "1.25rem 2rem 0" }}>
        <button
          onClick={() => navigate("/")}
          style={{ background: "transparent", border: "none", color: "#64748B", fontSize: "13px", marginBottom: "1rem", cursor: "pointer" }}
        >
          ← Back to search
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "2rem", alignItems: "start", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h1 style={{ color: "#F1F5F9", fontSize: "22px", fontWeight: "500" }}>{school.college_name}</h1>
              <span style={{ background: badge.bg, color: badge.color, fontSize: "11px", padding: "3px 10px", borderRadius: "4px", fontWeight: "500" }}>
                {school.category}
              </span>
            </div>

            <div style={{ color: "#64748B", fontSize: "13px", marginBottom: "1rem" }}>
              {[latest.enrollment ? `${Math.round(latest.enrollment).toLocaleString()} students` : null, school.city, school.state]
                .filter(Boolean).join(" · ")}
            </div>

            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "1rem" }}>
              {tags.map((t, i) => (
                <span key={t} style={{
                  background:   i === 0 ? "var(--color-gold)" : "#1C2E42",
                  color:        i === 0 ? "var(--color-dark)" : "#94A3B8",
                  fontSize:     "11px", padding: "3px 10px", borderRadius: "4px",
                  fontWeight:   i === 0 ? "500" : "400",
                }}>{t}</span>
              ))}
            </div>

            {school.website && (
              <a href={school.website} target="_blank" rel="noreferrer" style={{ color: "var(--color-gold)", fontSize: "13px" }}>
                {school.website.replace("https://", "")} ↗
              </a>
            )}
          </div>

          <div>
            <MapView lat={school.latitude} lng={school.longitude} name={school.college_name} height="170px" />
            <div style={{ color: "#64748B", fontSize: "11px", marginTop: "6px" }}>📍 {school.city}, {school.state}</div>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #1C2E42" }}>
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background:   "transparent",
              border:       "none",
              borderBottom: activeTab === tab.key ? "2px solid var(--color-gold)" : "2px solid transparent",
              color:        activeTab === tab.key ? "#F1F5F9" : "#64748B",
              padding:      "0.65rem 1.25rem",
              fontSize:     "13px",
              fontWeight:   activeTab === tab.key ? "500" : "400",
              cursor:       "pointer",
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "1.5rem 2rem" }}>
        {activeTab === "costs"      && <CostsTab        metrics={metrics}   latest={latest} />}
        {activeTab === "outcomes"   && <OutcomesTab      metrics={metrics}   latest={latest} />}
        {activeTab === "diversity"  && <DiversityTab     diversity={diversity} latest={latest} />}
        {activeTab === "admissions" && <AdmissionsTab    metrics={metrics}   latest={latest} />}
        {activeTab === "financial"  && <FinancialAidTab  metrics={metrics}   latest={latest} />}
      </div>
    </div>
  );
}