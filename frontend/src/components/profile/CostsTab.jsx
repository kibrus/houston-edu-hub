import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

function fmt(val, type) {
  if (val == null) return "N/A";
  if (type === "dollar") return `$${Math.round(val).toLocaleString()}`;
  if (type === "pct")    return `${(val * 100).toFixed(1)}%`;
  return val;
}

export default function CostsTab({ metrics, latest }) {
  const chartData = metrics.map((m) => ({
    year:        m.year,
    "In-State":  m.in_state_tuition  || 0,
    "Out-State": m.out_state_tuition || 0,
    "Net Cost":  m.net_annual_cost   || 0,
  }));

  const incomeData = [
    { bracket: "$0 – $30k",       val: latest.cost_income_0_30k    },
    { bracket: "$30k – $48k",     val: latest.cost_income_30k_48k  },
    { bracket: "$48k – $75k",     val: latest.cost_income_48k_75k  },
    { bracket: "$75k – $110k",    val: latest.cost_income_75k_110k },
    { bracket: "$110k+",          val: latest.cost_income_110k_plus},
  ].filter((d) => d.val != null);

  const hasIncomeData = incomeData.length > 0;

  const costItems = [
    { label: "In-State Tuition",     val: fmt(latest.in_state_tuition,     "dollar") },
    { label: "Out-of-State Tuition", val: fmt(latest.out_state_tuition,    "dollar") },
    { label: "Net Annual Cost",      val: fmt(latest.net_annual_cost,      "dollar"), note: "After grants & scholarships" },
    { label: "Median Total Debt",    val: fmt(latest.median_debt,          "dollar") },
    { label: "Monthly Loan Payment", val: fmt(latest.monthly_loan_payment, "dollar"), note: "Standard 10-yr plan" },
    { label: "Loan Default Rate",    val: fmt(latest.loan_default_rate,    "pct")    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Tuition trend */}
      <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
        <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Tuition & Cost Trend (2018–2023)</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="In-State"  fill="#1D4ED8" radius={[3,3,0,0]} />
            <Bar dataKey="Out-State" fill="#6366F1" radius={[3,3,0,0]} />
            <Bar dataKey="Net Cost"  fill="#C9A84C" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: hasIncomeData ? "1fr 1fr" : "1fr", gap: "1.25rem" }}>

        {/* Cost breakdown */}
        <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
          <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Cost Breakdown (Latest)</div>
          {costItems.map((item, i) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 0", borderBottom: i < costItems.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <div>
                <div style={{ fontSize: "13px" }}>{item.label}</div>
                {item.note && <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{item.note}</div>}
              </div>
              <div style={{ fontSize: "14px", fontWeight: "500" }}>{item.val}</div>
            </div>
          ))}
        </div>

        {/* By family income */}
        {hasIncomeData && (
          <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "4px" }}>Average Annual Cost by Family Income</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "1.25rem", lineHeight: "1.5" }}>
              Students in different income brackets may pay more or less based on available grant aid.
            </div>
            {incomeData.map((row, i) => (
              <div key={row.bracket} style={{ marginBottom: i < incomeData.length - 1 ? "1rem" : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{row.bracket}</span>
                  <span style={{ fontSize: "13px", fontWeight: "500" }}>${Math.round(row.val).toLocaleString()}</span>
                </div>
                <div style={{ height: "8px", background: "#F1F5F9", borderRadius: "4px" }}>
                  <div style={{
                    height:       "8px",
                    width:        `${Math.min((row.val / 60000) * 100, 100)}%`,
                    background:   "#1D4ED8",
                    borderRadius: "4px",
                    transition:   "width 0.4s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}