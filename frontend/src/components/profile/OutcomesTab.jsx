import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";

function fmt(val, type) {
  if (val == null) return "N/A";
  if (type === "pct")    return `${Math.round(val * 100)}%`;
  if (type === "dollar") return `$${Math.round(val).toLocaleString()}`;
  return val;
}

export default function OutcomesTab({ metrics, latest }) {
  const enrollmentData = metrics.map((m) => ({ year: m.year, Enrollment: m.enrollment || 0 }));
  const earningsData   = metrics.map((m) => ({ year: m.year, Earnings: m.median_earnings || 0 }));

  const outcomeData = [
    { name: "Graduated",      value: latest.outcome_graduated_pct   ? Math.round(latest.outcome_graduated_pct   * 100) : 0, fill: "#16A34A" },
    { name: "Transferred",    value: latest.outcome_transferred_pct ? Math.round(latest.outcome_transferred_pct * 100) : 0, fill: "#1D4ED8" },
    { name: "Withdrew",       value: latest.outcome_withdrew_pct    ? Math.round(latest.outcome_withdrew_pct    * 100) : 0, fill: "#B45309" },
    { name: "Still Enrolled", value: latest.outcome_enrolled_pct    ? Math.round(latest.outcome_enrolled_pct    * 100) : 0, fill: "#8B5CF6" },
  ];

  const lineOptions = { responsive: true, maintainAspectRatio: false };

  const stats = [
    { label: "Graduation Rate",         val: fmt(latest.graduation_rate,          "pct"),    color: "#16A34A" },
    { label: "Retention Rate",          val: fmt(latest.retention_rate,           "pct"),    color: "#1D4ED8" },
    { label: "Median Earnings",         val: fmt(latest.median_earnings,          "dollar"), color: "#0891B2" },
    { label: "Earning > HS Graduate",   val: fmt(latest.pct_earning_more_than_hs, "pct"),    color: "#7C3AED" },
    { label: "Graduated (8yr)",         val: fmt(latest.outcome_graduated_pct,    "pct"),    color: "#16A34A" },
    { label: "Transferred (8yr)",       val: fmt(latest.outcome_transferred_pct,  "pct"),    color: "#1D4ED8" },
  ];

  // Retention rate donut
  const retentionVal = latest.retention_rate ? Math.round(latest.retention_rate * 100) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Retention + Graduation highlight cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        {[
          { label: "Graduation Rate",  val: fmt(latest.graduation_rate, "pct"),  color: "#16A34A", sub: "Students who completed their degree" },
          { label: "Retention Rate",   val: fmt(latest.retention_rate,  "pct"),  color: "#1D4ED8", sub: "Students who return after first year" },
          { label: "Median Earnings",  val: fmt(latest.median_earnings, "dollar"), color: "#0891B2", sub: "10 years after entry" },
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ color: "var(--color-text-light)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{item.label}</div>
            <div style={{ fontSize: "32px", fontWeight: "500", color: item.color, marginBottom: "4px" }}>{item.val}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Trend charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
          <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Enrollment Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString()} />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Line type="monotone" dataKey="Enrollment" stroke="#16A34A" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
          <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Median Earnings Trend (10yr after entry)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="Earnings" stroke="#1D4ED8" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 8-year outcomes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
          <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>8-Year Student Outcomes</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={outcomeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" radius={[3,3,0,0]}>
                {outcomeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
          <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Key Outcome Stats</div>
          {stats.map((item, i) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0", borderBottom: i < stats.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{item.label}</span>
              <span style={{ fontSize: "14px", fontWeight: "500", color: item.color }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}