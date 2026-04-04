const BADGE = {
  "Public University":  { bg: "#EEF2FF", color: "#4F46E5", label: "Public" },
  "Community College":  { bg: "#F0FDF4", color: "#15803D", label: "Community" },
  "Private Nonprofit":  { bg: "#FDF4FF", color: "#9333EA", label: "Private" },
  "Private For-Profit": { bg: "#FFF7ED", color: "#EA580C", label: "For-Profit" },
};

function fmt(val, type) {
  if (val == null) return "N/A";
  if (type === "pct")    return `${Math.round(val * 100)}%`;
  if (type === "dollar") return `$${Math.round(val).toLocaleString()}`;
  return val;
}

export default function SchoolList({ schools, selectedId, onSelect }) {
  return (
    <div style={{
      width:       "310px",
      flexShrink:  0,
      background:  "var(--color-white)",
      borderRight: "1px solid var(--color-border)",
      overflowY:   "auto",
      height:      "100%",
    }}>
      {schools.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          No institutions found.
        </div>
      )}

      {schools.map((s) => {
        const badge   = BADGE[s.category] || BADGE["Private For-Profit"];
        const active  = s.college_id === selectedId;

        return (
          <div
            key={s.college_id}
            onClick={() => onSelect(s)}
            style={{
              padding:      "0.85rem 1.25rem",
              borderBottom: "1px solid #F1F5F9",
              borderLeft:   active ? "3px solid var(--color-gold)" : "3px solid transparent",
              background:   active ? "#FBF8F0" : "var(--color-white)",
              cursor:       "pointer",
              transition:   "background 0.1s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
              <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--color-text)", lineHeight: "1.4" }}>
                {s.college_name}
              </div>
              <span style={{
                fontSize:     "10px",
                padding:      "2px 7px",
                borderRadius: "4px",
                fontWeight:   "500",
                flexShrink:   0,
                background:   badge.bg,
                color:        badge.color,
              }}>
                {badge.label}
              </span>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              {[
                { label: "Grad Rate", val: fmt(s.latest?.graduation_rate, "pct"),  color: "var(--color-green)" },
                { label: "Avg Cost",  val: fmt(s.latest?.net_annual_cost, "dollar"), color: "var(--color-amber)" },
                { label: "Earnings",  val: fmt(s.latest?.median_earnings, "dollar"), color: "var(--color-blue)" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: "10px", color: "var(--color-text-light)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "500", color: stat.val === "N/A" ? "var(--color-text-light)" : stat.color }}>
                    {stat.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}