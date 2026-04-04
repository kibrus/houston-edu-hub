import { useState } from "react";

export default function ChatBot() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: "fixed",
      bottom:   "24px",
      right:    "24px",
      zIndex:   200,
    }}>
      {open && (
        <div style={{
          width:        "320px",
          height:       "420px",
          background:   "var(--color-white)",
          border:       "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow:    "var(--shadow-md)",
          marginBottom: "12px",
          display:      "flex",
          flexDirection: "column",
          overflow:     "hidden",
        }}>
          <div style={{
            background: "var(--color-dark)",
            padding:    "1rem 1.25rem",
            display:    "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <div style={{ color: "#fff", fontWeight: "500", fontSize: "14px" }}>
                Houston Edu Assistant
              </div>
              <div style={{ color: "#64748B", fontSize: "12px" }}>
                AI-powered help coming soon
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border:     "none",
                color:      "#64748B",
                fontSize:   "18px",
                lineHeight: "1",
              }}
            >×</button>
          </div>

          <div style={{
            flex:       1,
            padding:    "1.25rem",
            display:    "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap:        "0.75rem",
            textAlign:  "center",
          }}>
            <div style={{
              width:        "52px",
              height:       "52px",
              background:   "#F1F5F9",
              borderRadius: "50%",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              fontSize:     "22px",
            }}>🤖</div>
            <div style={{ color: "var(--color-text)", fontWeight: "500", fontSize: "14px" }}>
              AI Assistant Coming Soon
            </div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "13px", lineHeight: "1.6" }}>
              Ask questions about Houston institutions, compare programs, get personalized recommendations, and more.
            </div>
          </div>

          <div style={{ padding: "1rem", borderTop: "1px solid var(--color-border)" }}>
            <input
              disabled
              placeholder="Chat coming soon..."
              style={{
                width:        "100%",
                padding:      "0.6rem 1rem",
                border:       "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                background:   "#F8FAFC",
                color:        "var(--color-text-muted)",
                fontSize:     "13px",
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          width:        "52px",
          height:       "52px",
          background:   "var(--color-gold)",
          border:       "none",
          borderRadius: "50%",
          boxShadow:    "var(--shadow-md)",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          fontSize:     "22px",
          marginLeft:   "auto",
        }}
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}