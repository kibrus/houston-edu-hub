import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: "/",        label: "Home" },
    { to: "/compare", label: "Compare" },
  ];

  return (
    <nav style={{
      background:     "var(--color-dark)",
      padding:        "0 2rem",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      height:         "58px",
      position:       "sticky",
      top:            0,
      zIndex:         100,
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width:           "28px",
          height:          "28px",
          background:      "var(--color-gold)",
          borderRadius:    "8px",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          color:           "var(--color-dark)",
          fontSize:        "13px",
          fontWeight:      "600",
        }}>H</div>
        <span style={{ color: "#fff", fontSize: "16px", fontWeight: "500" }}>
          Houston Edu Hub
        </span>
      </Link>

      <div style={{ display: "flex", gap: "2rem" }}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} style={{
            color:         pathname === l.to ? "#fff" : "#8A9BB0",
            fontSize:      "14px",
            fontWeight:    pathname === l.to ? "500" : "400",
            paddingBottom: "2px",
            borderBottom:  pathname === l.to ? "2px solid var(--color-gold)" : "2px solid transparent",
          }}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}