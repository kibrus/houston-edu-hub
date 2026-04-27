import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getSchool, getLatest } from "../services/api";

function getVal(school, key) {
  let val = school.latest?.[key];
  // Treat 0 as null for loan default rate — likely missing data not a true 0%
  if (key === "loan_default_rate" && val === 0) return null;
  return val;
}

function getBest(schools, key) {
  const values = schools.map((s) => ({ id: s.college_id, val: getVal(s, key) }));
  const valid  = values.filter((v) => v.val != null);
  if (valid.length < 2) return null;

  // Don't mark best if all values are identical
  const unique = new Set(valid.map((v) => v.val));
  if (unique.size === 1) return null;

  const higherIsBetter = [
    "graduation_rate", "retention_rate", "median_earnings",
    "pct_earning_more_than_hs", "enrollment", "fulltime_pct",
  ];
  const lowerIsBetter = [
    "net_annual_cost", "in_state_tuition", "out_state_tuition",
    "median_debt", "monthly_loan_payment", "loan_default_rate",
    "acceptance_rate", "student_faculty_ratio",
  ];

  if (higherIsBetter.includes(key)) {
    return valid.reduce((a, b) => a.val > b.val ? a : b).id;
  } else if (lowerIsBetter.includes(key)) {
    return valid.reduce((a, b) => a.val < b.val ? a : b).id;
  }
  return null;
}

function display(val, type) {
  if (val == null) return "N/A";
  if (type === "pct")    return `${Math.round(val * 100)}%`;
  if (type === "dollar") return `$${Math.round(val).toLocaleString()}`;
  if (type === "ratio")  return `${val}:1`;
  return Math.round(val).toLocaleString();
}

const BADGE = {
  "Public University":  { bg: "#EEF2FF", color: "#4F46E5" },
  "Community College":  { bg: "#F0FDF4", color: "#15803D" },
  "Private Nonprofit":  { bg: "#FDF4FF", color: "#9333EA" },
  "Private For-Profit": { bg: "#FFF7ED", color: "#EA580C" },
};

const SECTIONS = [
  {
    title: "Key Metrics",
    rows: [
      { label: "Graduation Rate",        key: "graduation_rate",          type: "pct"    },
      { label: "Retention Rate",         key: "retention_rate",           type: "pct"    },
      { label: "Median Earnings",        key: "median_earnings",          type: "dollar" },
      { label: "Enrollment",             key: "enrollment",               type: "number" },
    ],
  },
  {
    title: "Costs",
    rows: [
      { label: "In-State Tuition",       key: "in_state_tuition",         type: "dollar" },
      { label: "Out-of-State Tuition",   key: "out_state_tuition",        type: "dollar" },
      { label: "Net Annual Cost",        key: "net_annual_cost",          type: "dollar" },
      { label: "Median Debt",            key: "median_debt",              type: "dollar" },
      { label: "Monthly Loan Payment",   key: "monthly_loan_payment",     type: "dollar" },
      { label: "Loan Default Rate",      key: "loan_default_rate",        type: "pct"    },
    ],
  },
  {
    title: "Admissions",
    rows: [
      { label: "Acceptance Rate",        key: "acceptance_rate",          type: "pct"    },
      { label: "Student / Faculty",      key: "student_faculty_ratio",    type: "ratio"  },
      { label: "Full-Time Students",     key: "fulltime_pct",             type: "pct",   noBest: true },
      { label: "Part-Time Students",     key: "parttime_pct",             type: "pct",   noBest: true },
    ],
  },
  {
    title: "Financial Aid",
    rows: [
      { label: "Pell Grant Recipients",  key: "pell_grant_pct",           type: "pct",   noBest: true },
      { label: "Federal Loan Recipients",key: "federal_aid_pct",          type: "pct",   noBest: true },
    ],
  },
  {
    title: "Outcomes",
    rows: [
      { label: "Graduated (8yr)",        key: "outcome_graduated_pct",    type: "pct"    },
      { label: "Transferred (8yr)",      key: "outcome_transferred_pct",  type: "pct",   noBest: true },
      { label: "Withdrew (8yr)",         key: "outcome_withdrew_pct",     type: "pct",   noBest: true },
      { label: "Earning > HS Graduate",  key: "pct_earning_more_than_hs", type: "pct"    },
    ],
  },
];

export default function Compare() {
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  const ids = searchParams.get("ids")?.split(",").map(Number).filter(Boolean) || [];

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return; }
    setLoading(true);
    Promise.all(
      ids.map(async (id) => {
        const [school, latest] = await Promise.all([getSchool(id), getLatest(id)]);
        return { ...school, latest: latest || {} };
      })
    )
      .then(setSchools)
      .finally(() => setLoading(false));
  }, [searchParams.get("ids")]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "0.75rem", color: "var(--color-text-muted)" }}>
      <div style={{ fontSize: "24px" }}>🎓</div>
      <div>Loading comparison...</div>
    </div>
  );

  if (ids.length === 0) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "1rem", color: "var(--color-text-muted)" }}>
      <div style={{ fontSize: "48px" }}>📊</div>
      <div style={{ fontSize: "18px", fontWeight: "500", color: "var(--color-text)" }}>No schools selected</div>
      <div style={{ fontSize: "14px" }}>Go back to the home page and add schools to compare.</div>
      <button onClick={() => navigate("/")} style={{ background: "var(--color-gold)", color: "var(--color-dark)", border: "none", borderRadius: "var(--radius-sm)", padding: "10px 24px", fontSize: "14px", fontWeight: "500", cursor: "pointer", marginTop: "0.5rem" }}>
        Back to Home
      </button>
    </div>
  );

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "calc(100vh - 58px)" }}>

      {/* Header */}
      <div style={{ background: "var(--color-dark)", padding: "1.5rem 2rem" }}>
        <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: "#64748B", fontSize: "13px", marginBottom: "1rem", cursor: "pointer" }}>
          ← Back to search
        </button>
        <h1 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "500", marginBottom: "4px" }}>
          Side-by-Side Comparison
        </h1>
        <div style={{ color: "#64748B", fontSize: "13px" }}>
          Comparing {schools.length} institution{schools.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div style={{ padding: "1.5rem 2rem" }}>

        {/* School header cards */}
        <div style={{ display: "grid", gridTemplateColumns: `200px ${schools.map(() => "1fr").join(" ")}`, gap: "1rem", marginBottom: "1.5rem" }}>
          <div />
          {schools.map((school) => {
            const badge = BADGE[school.category] || BADGE["Private For-Profit"];
            return (
              <div key={school.college_id} style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem", position: "relative" }}>
                <button
                  onClick={() => navigate(`/compare?ids=${ids.filter((i) => i !== school.college_id).join(",")}`)}
                  style={{ position: "absolute", top: "10px", right: "10px", background: "transparent", border: "none", color: "var(--color-text-light)", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}
                  title="Remove"
                >×</button>
                <div style={{ fontSize: "14px", fontWeight: "500", color: "var(--color-text)", marginBottom: "6px", paddingRight: "20px" }}>
                  {school.college_name}
                </div>
                <span style={{ background: badge.bg, color: badge.color, fontSize: "10px", padding: "2px 8px", borderRadius: "4px", fontWeight: "500" }}>
                  {school.category}
                </span>
                <div style={{ color: "var(--color-text-muted)", fontSize: "12px", marginTop: "8px" }}>
                  {school.city}, {school.state}
                </div>
                {school.website && (
                  <a href={school.website} target="_blank" rel="noreferrer" style={{ color: "var(--color-gold)", fontSize: "11px", display: "block", marginTop: "6px" }}>
                    Visit website ↗
                  </a>
                )}
                <button
                  onClick={() => navigate(`/school/${school.college_id}`)}
                  style={{ marginTop: "10px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "5px 12px", fontSize: "11px", color: "var(--color-text-muted)", cursor: "pointer", width: "100%" }}
                >
                  View Full Profile
                </button>
              </div>
            );
          })}
        </div>

        {/* Add more schools */}
        {schools.length < 3 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <button onClick={() => navigate("/")} style={{ background: "var(--color-white)", border: "2px dashed var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.85rem 1.5rem", fontSize: "13px", color: "var(--color-text-muted)", cursor: "pointer" }}>
              + Add another school (go back to search)
            </button>
          </div>
        )}

        {/* Comparison sections */}
        {SECTIONS.map((section) => (
          <div key={section.title} style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: "1.25rem", overflow: "hidden" }}>
            <div style={{ background: "#F8FAFC", padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--color-border)", fontWeight: "500", fontSize: "13px", color: "var(--color-text)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {section.title}
            </div>

            {section.rows.map((row, rowIdx) => {
              const bestId = row.noBest ? null : getBest(schools, row.key);
              return (
                <div key={row.key} style={{ display: "grid", gridTemplateColumns: `200px ${schools.map(() => "1fr").join(" ")}`, borderBottom: rowIdx < section.rows.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <div style={{ padding: "0.9rem 1.25rem", fontSize: "13px", color: "var(--color-text-muted)", borderRight: "1px solid #F1F5F9", display: "flex", alignItems: "center" }}>
                    {row.label}
                  </div>
                  {schools.map((school) => {
                    const val    = getVal(school, row.key);
                    const isBest = bestId === school.college_id;
                    return (
                      <div key={school.college_id} style={{ padding: "0.9rem 1.25rem", textAlign: "center", borderRight: "1px solid #F1F5F9", background: isBest ? "#F0FDF4" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <span style={{ fontSize: "15px", fontWeight: isBest ? "600" : "400", color: val == null ? "var(--color-text-light)" : isBest ? "#16A34A" : "var(--color-text)" }}>
                          {display(val, row.type)}
                        </span>
                        {isBest && val != null && (
                          <span style={{ fontSize: "11px", background: "#16A34A", color: "#fff", borderRadius: "4px", padding: "1px 6px", fontWeight: "500" }}>
                            Best
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.85rem 1.25rem", fontSize: "12px", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ background: "#16A34A", color: "#fff", borderRadius: "4px", padding: "1px 6px", fontSize: "11px", fontWeight: "500", flexShrink: 0 }}>Best</span>
          <span>indicates the best value among selected schools. For costs and debt lower is better. For graduation rate and earnings higher is better. Fields marked without a Best badge are informational only.</span>
        </div>
      </div>
    </div>
  );
}