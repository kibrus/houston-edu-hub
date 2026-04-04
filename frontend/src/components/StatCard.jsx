export default function StatCard({ label, value, sub, color = "var(--color-text)", barWidth = 0, barColor }) {
  return (
    <div style={{
      background:   "var(--color-white)",
      border:       "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)",
      padding:      "1rem 1.1rem",
    }}>
      <div style={{
        color:         "var(--color-text-light)",
        fontSize:      "10px",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        marginBottom:  "6px",
      }}>{label}</div>

      <div style={{ fontSize: "26px", fontWeight: "500", color, marginBottom: "3px" }}>
        {value ?? "N/A"}
      </div>

      {sub && (
        <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>{sub}</div>
      )}

      {barWidth > 0 && (
        <div style={{
          height:       "4px",
          background:   "#F1F5F9",
          borderRadius: "2px",
          marginTop:    "8px",
        }}>
          <div style={{
            height:       "4px",
            width:        `${Math.min(barWidth, 100)}%`,
            background:   barColor || color,
            borderRadius: "2px",
            transition:   "width 0.4s ease",
          }} />
        </div>
      )}
    </div>
  );
}