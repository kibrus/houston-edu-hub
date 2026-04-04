import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

function fmt(val, type) {
  if (val == null) return "N/A";
  if (type === "pct")    return `${(val * 100).toFixed(1)}%`;
  if (type === "dollar") return `$${Math.round(val).toLocaleString()}`;
  return val;
}

export default function FinancialAidTab({ metrics, latest }) {
  const chartData = metrics.map((m) => ({
    year:           m.year,
    "Pell Grant":   m.pell_grant_pct  != null ? parseFloat((m.pell_grant_pct  * 100).toFixed(1)) : null,
    "Federal Loan": m.federal_aid_pct != null ? parseFloat((m.federal_aid_pct * 100).toFixed(1)) : null,
  }));

  const aidItems = [
    { label: "Pell Grant Recipients",   val: fmt(latest.pell_grant_pct,       "pct"),    note: "% of students receiving need-based aid",  color: "#16A34A" },
    { label: "Federal Loan Recipients", val: fmt(latest.federal_aid_pct,      "pct"),    note: "% of students with federal loans",         color: "#1D4ED8" },
    { label: "Median Total Debt",       val: fmt(latest.median_debt,          "dollar"), note: "Typical total debt for graduates",          color: "#B45309" },
    { label: "Monthly Loan Payment",    val: fmt(latest.monthly_loan_payment, "dollar"), note: "Standard 10-yr repayment plan",             color: "#B45309" },
    { label: "Loan Default Rate",       val: fmt(latest.loan_default_rate,    "pct"),    note: "3-year federal loan default rate",           color: "#DC2626" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Highlight cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[
          { label: "Pell Grant Recipients",  val: fmt(latest.pell_grant_pct,  "pct"),    color: "#16A34A", sub: "Need-based federal grant" },
          { label: "Median Debt",            val: fmt(latest.median_debt,     "dollar"), color: "#B45309", sub: "After graduation" },
          { label: "Monthly Loan Payment",   val: fmt(latest.monthly_loan_payment, "dollar"), color: "#1D4ED8", sub: "Standard 10-yr plan" },
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ color: "var(--color-text-light)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{item.label}</div>
            <div style={{ fontSize: "28px", fontWeight: "500", color: item.color, marginBottom: "4px" }}>{item.val}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
        <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Financial Aid Recipients Trend</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="Pell Grant"   fill="#16A34A" radius={[3,3,0,0]} />
            <Bar dataKey="Federal Loan" fill="#1D4ED8" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
        <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Financial Aid Summary (Latest)</div>
        {aidItems.map((item, i) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: i < aidItems.length - 1 ? "1px solid #F1F5F9" : "none" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "500" }}>{item.label}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{item.note}</div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: "500", color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#FFF8E7", border: "1px solid #F5E0A0", borderRadius: "var(--radius-sm)", padding: "1rem 1.25rem", fontSize: "12px", color: "#92600A", lineHeight: "1.6" }}>
        <strong>Note:</strong> Financial aid data is from students who received federal aid. Actual costs vary based on scholarships, grants, and individual circumstances.
      </div>
    </div>
  );
}