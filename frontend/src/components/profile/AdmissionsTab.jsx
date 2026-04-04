function fmt(val, type) {
  if (val == null) return "N/A";
  if (type === "pct") return `${Math.round(val * 100)}%`;
  return Math.round(val).toLocaleString();
}

function ScoreBar({ label, low, high, min, max, color }) {
  if (!low || !high) return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "var(--color-text-light)" }}>No data available</div>
    </div>
  );
  const leftPct  = ((low  - min) / (max - min)) * 100;
  const widthPct = ((high - low) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: "500", color }}>{Math.round(low)} – {Math.round(high)}</span>
      </div>
      <div style={{ position: "relative", height: "8px", background: "#F1F5F9", borderRadius: "4px" }}>
        <div style={{ position: "absolute", left: `${leftPct}%`, width: `${widthPct}%`, height: "100%", background: color, borderRadius: "4px" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ fontSize: "11px", color: "var(--color-text-light)" }}>{min}</span>
        <span style={{ fontSize: "11px", color: "var(--color-text-light)" }}>{max}</span>
      </div>
    </div>
  );
}

export default function AdmissionsTab({ metrics, latest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[
          { label: "Acceptance Rate",  val: fmt(latest.acceptance_rate, "pct"), color: "#1D4ED8" },
          { label: "Enrollment",       val: latest.enrollment ? Math.round(latest.enrollment).toLocaleString() : "N/A", color: "#16A34A" },
          { label: "Student/Faculty",  val: latest.student_faculty_ratio ? `${latest.student_faculty_ratio}:1` : "N/A", color: "#B45309" },
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ color: "var(--color-text-light)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{item.label}</div>
            <div style={{ fontSize: "32px", fontWeight: "500", color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Enrollment breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {[
          { label: "Full-Time Students", val: latest.fulltime_pct  ? `${Math.round(latest.fulltime_pct  * 100)}%` : "N/A", color: "#1D4ED8" },
          { label: "Part-Time Students", val: latest.parttime_pct  ? `${Math.round(latest.parttime_pct  * 100)}%` : "N/A", color: "#6366F1" },
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{item.label}</span>
            <span style={{ fontSize: "20px", fontWeight: "500", color: item.color }}>{item.val}</span>
          </div>
        ))}
      </div>

      {/* Test scores */}
      <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.5rem" }}>
        <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "4px" }}>Test Score Ranges (25th – 75th Percentile)</div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          {latest.acceptance_rate
            ? `This school has an acceptance rate of ${fmt(latest.acceptance_rate, "pct")}. Score ranges show the middle 50% of admitted students.`
            : "Score ranges show the middle 50% of admitted students. These are benchmarks, not cutoffs."}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--color-text-muted)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>SAT</div>
            <ScoreBar label="Reading & Writing" low={latest.sat_reading_25} high={latest.sat_reading_75} min={200} max={800} color="#1D4ED8" />
            <ScoreBar label="Math"              low={latest.sat_math_25}    high={latest.sat_math_75}    min={200} max={800} color="#6366F1" />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--color-text-muted)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>ACT</div>
            <ScoreBar label="Composite" low={latest.act_25} high={latest.act_75} min={1} max={36} color="#C9A84C" />
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#F8FAFC", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--color-text-muted)", lineHeight: "1.6" }}>
              Students outside these ranges are still admitted. Scores shown are for the most recently available cohort.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}