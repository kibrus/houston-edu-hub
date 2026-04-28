import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname }            = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [pathname]);

  const links = [
    { to: "/",        label: "Home"    },
    { to: "/compare", label: "Compare" },
  ];

  return (
    <nav style={{
      background: "var(--color-dark)",
      padding:    isMobile ? "0 1rem" : "0 2rem",
      display:    "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height:     "58px",
      position:   "sticky",
      top:        0,
      zIndex:     100,
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
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
          flexShrink:      0,
        }}>H</div>
        <span style={{ color: "#fff", fontSize: isMobile ? "14px" : "16px", fontWeight: "500" }}>
          Houston Edu Hub
        </span>
      </Link>

      {/* Desktop links */}
      {!isMobile && (
        <div style={{ display: "flex", gap: "2rem" }}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} style={{
              color:         pathname === l.to ? "#fff" : "#8A9BB0",
              fontSize:      "14px",
              fontWeight:    pathname === l.to ? "500" : "400",
              paddingBottom: "2px",
              borderBottom:  pathname === l.to ? "2px solid var(--color-gold)" : "2px solid transparent",
              textDecoration:"none",
            }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "transparent", border: "none", color: "#fff", fontSize: "22px", cursor: "pointer", padding: "4px" }}
        >
          {menuOpen ? "×" : "☰"}
        </button>
      )}

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{
          position:   "absolute",
          top:        "58px",
          left:       0,
          right:      0,
          background: "var(--color-dark)",
          borderTop:  "1px solid #1C2E42",
          zIndex:     99,
          padding:    "0.5rem 0",
        }}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} style={{
              display:        "block",
              padding:        "0.85rem 1.5rem",
              color:          pathname === l.to ? "var(--color-gold)" : "#CBD5E1",
              fontSize:       "15px",
              fontWeight:     pathname === l.to ? "500" : "400",
              textDecoration: "none",
              borderBottom:   "1px solid #1C2E42",
            }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}