import { useNavigate } from "react-router-dom";
import StatCard from "./StatCard";
import MapView  from "./MapView";

function fmt(val, type) {
  if (val == null) return null;
  if (type === "pct")    return `${Math.round(val * 100)}%`;
  if (type === "dollar") return `$${Math.round(val).toLocaleString()}`;
  return val;
}

export default function SchoolPreview({ school, latest, onAddToCompare, compareIds = [] }) {
  const navigate  = useNavigate();
  const l         = latest || {};
  const inCompare = compareIds.includes(school?.college_id);

  if (!school) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.75rem", color: "var(--color-text-muted)", background: "var(--color-bg)" }}>
      <div style={{ fontSize: "32px" }}>🎓</div>
      <div style={{ fontSize: "14px" }}>Select a school to see details</div>
    </div>
  );

  const tags = [
    school.predominant_degree,
    school.ownership,
    school.size,
    school.urbanicity,
    school.specialized_mission !== "None" ? school.specialized_mission : null,
  ].filter(Boolean);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {/* Header */}
      <div style={{ background: "var(--color-dark)", padding: "1.5rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "1.5rem", alignItems: "start" }}>
          <div>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "500", marginBottom: "4px" }}>
              {school.college_name}
            </h2>
            <div style={{ color: "#64748B", fontSize: "12px", marginBottom: "1rem" }}>
              {[l.enrollment ? `${Math.round(l.enrollment).toLocaleString()} students` : null, school.city, school.ownership]
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
              <a href={school.website} target="_blank" rel="noreferrer" style={{ color: "var(--color-gold)", fontSize: "12px" }}>
                {school.website.replace("https://", "")} ↗
              </a>
            )}

            <div style={{ display: "flex", gap: "0.65rem", marginTop: "1rem" }}>
              <button onClick={() => navigate(`/school/${school.college_id}`)} style={{
                background: "var(--color-dark-mid)", color: "#fff",
                border: "1px solid var(--color-dark-light)", borderRadius: "var(--radius-sm)",
                padding: "8px 16px", fontSize: "13px",
              }}>View Full Profile</button>
              <button onClick={() => onAddToCompare(school.college_id)} style={{
                background:   inCompare ? "var(--color-gold)" : "transparent",
                color:        inCompare ? "var(--color-dark)" : "var(--color-gold)",
                border:       "1px solid var(--color-gold)",
                borderRadius: "var(--radius-sm)",
                padding:      "8px 16px", fontSize: "13px", fontWeight: "500",
              }}>{inCompare ? "✓ In Compare" : "+ Compare"}</button>
            </div>
          </div>

          <div>
            <MapView lat={school.latitude} lng={school.longitude} name={school.college_name} height="160px" />
            <div style={{ color: "#64748B", fontSize: "11px", marginTop: "6px" }}>📍 {school.city}, {school.state}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "1.25rem 2rem", background: "var(--color-bg)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem", marginBottom: "1.25rem" }}>
          <StatCard label="Graduation Rate"  value={fmt(l.graduation_rate,  "pct")}    color="var(--color-green)" barWidth={l.graduation_rate  ? l.graduation_rate  * 100 : 0} barColor="var(--color-green)" sub="Latest available" />
          <StatCard label="Avg Annual Cost"  value={fmt(l.net_annual_cost,  "dollar")} color="var(--color-amber)" barWidth={l.net_annual_cost  ? Math.min((l.net_annual_cost / 60000) * 100, 100) : 0} barColor="var(--color-amber)" sub="After grants & aid" />
          <StatCard label="Median Earnings"  value={fmt(l.median_earnings,  "dollar")} color="var(--color-blue)"  barWidth={l.median_earnings  ? Math.min((l.median_earnings / 120000) * 100, 100) : 0} barColor="var(--color-blue)"  sub="10 yrs after entry" />
        </div>

        <div style={{ color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.85rem", paddingBottom: "7px", borderBottom: "1px solid var(--color-border)" }}>
          Institution Details
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.65rem" }}>
          {[
            { label: "Acceptance Rate",   val: fmt(l.acceptance_rate, "pct") },
            { label: "Enrollment",        val: l.enrollment ? Math.round(l.enrollment).toLocaleString() : "N/A" },
            { label: "Retention Rate",    val: fmt(l.retention_rate,  "pct") },
            { label: "Student / Faculty", val: l.student_faculty_ratio ? `${l.student_faculty_ratio}:1` : "N/A" },
            { label: "Median Debt",       val: fmt(l.median_debt,     "dollar") },
            { label: "Pell Grant",        val: fmt(l.pell_grant_pct,  "pct") },
          ].map((item) => (
            <div key={item.label} style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.8rem 0.9rem" }}>
              <div style={{ color: "var(--color-text-light)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{item.label}</div>
              <div style={{ fontSize: "14px", fontWeight: "500" }}>{item.val ?? "N/A"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}