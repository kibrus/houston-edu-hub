import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

function pct(val) {
  if (val == null) return "N/A";
  return `${(val * 100).toFixed(1)}%`;
}

const COLORS = ["#6366F1","#EC4899","#3B82F6","#F59E0B","#10B981","#8B5CF6","#94A3B8"];

export default function DiversityTab({ diversity, latest }) {
  const latestDiv = diversity[diversity.length - 1] || {};

  const races = [
    { label: "Hispanic",     student: latestDiv.hispanic_student_pct,    staff: latestDiv.hispanic_staff_pct    },
    { label: "Black",        student: latestDiv.black_student_pct,       staff: latestDiv.black_staff_pct       },
    { label: "White",        student: latestDiv.white_student_pct,       staff: latestDiv.white_staff_pct       },
    { label: "Asian",        student: latestDiv.asian_student_pct,       staff: latestDiv.asian_staff_pct       },
    { label: "Two or More",  student: latestDiv.twoplus_student_pct,     staff: latestDiv.twoplus_staff_pct     },
    { label: "Non-Resident", student: latestDiv.nonresident_student_pct, staff: latestDiv.nonresident_staff_pct },
    { label: "Unknown",      student: latestDiv.unknown_student_pct,     staff: latestDiv.unknown_staff_pct     },
  ].filter((r) => r.student != null && r.student > 0);

  const pieData = races.map((r) => ({ name: r.label, value: parseFloat((r.student * 100).toFixed(1)) }));
  const barData = races.map((r) => ({
    name:     r.label,
    Students: parseFloat((r.student * 100).toFixed(1)),
    Staff:    r.staff != null ? parseFloat((r.staff * 100).toFixed(1)) : 0,
  }));

  if (races.length === 0) return (
    <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
      No diversity data available for this institution.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {[
          { label: "Total Enrollment",   val: latest.enrollment ? Math.round(latest.enrollment).toLocaleString() : "N/A" },
          { label: "Full-Time Students", val: latest.fulltime_pct  ? `${Math.round(latest.fulltime_pct  * 100)}%` : "N/A" },
          { label: "Part-Time Students", val: latest.parttime_pct  ? `${Math.round(latest.parttime_pct  * 100)}%` : "N/A" },
          { label: "Pell Grant Students",val: latest.pell_grant_pct ? `${Math.round(latest.pell_grant_pct * 100)}%` : "N/A" },
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div style={{ color: "var(--color-text-light)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{item.label}</div>
            <div style={{ fontSize: "22px", fontWeight: "500" }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
          <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Student Body Composition</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => value > 5 ? `${value}%` : ""} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
          <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Students vs Staff by Race</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Students" fill="#1D4ED8" radius={[3,3,0,0]} />
              <Bar dataKey="Staff"    fill="#C9A84C" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full table */}
      <div style={{ background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
        <div style={{ fontWeight: "500", fontSize: "14px", marginBottom: "1rem" }}>Full Race/Ethnicity Breakdown</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              <th style={{ textAlign: "left",  padding: "0.6rem 0", color: "var(--color-text-muted)", fontWeight: "500" }}>Race / Ethnicity</th>
              <th style={{ textAlign: "right", padding: "0.6rem 0", color: "var(--color-text-muted)", fontWeight: "500" }}>Students</th>
              <th style={{ textAlign: "right", padding: "0.6rem 0", color: "var(--color-text-muted)", fontWeight: "500" }}>Staff</th>
            </tr>
          </thead>
          <tbody>
            {races.map((row, i) => (
              <tr key={row.label} style={{ borderBottom: i < races.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <td style={{ padding: "0.7rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[i], flexShrink: 0 }} />
                  {row.label}
                </td>
                <td style={{ textAlign: "right", padding: "0.7rem 0", fontWeight: "500" }}>{pct(row.student)}</td>
                <td style={{ textAlign: "right", padding: "0.7rem 0", color: "var(--color-text-muted)" }}>{pct(row.staff)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}