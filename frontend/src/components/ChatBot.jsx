import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";

const SUGGESTIONS = [
  "Which school has the best graduation rate?",
  "What is the most affordable school in Houston?",
  "Which school has the highest median earnings?",
  "What community colleges are in Houston?",
];

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color:#C9A84C;text-decoration:underline;">$1</a>')
    .replace(/\n/g, "<br/>");
}

export default function ChatBot({ schoolId = null }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    {
      role:    "assistant",
      content: "Hello, I'm your Houston Edu Hub assistant. Ask me anything about Houston-area colleges. costs, admissions, outcomes, financial aid, and more! 🎓",
    },
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6);
      const data    = await sendChatMessage(msg, history, schoolId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, {
        role:    "assistant",
        content: "Sorry, I couldn't connect to the server. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 200 }}>

      {/* Chat window */}
      {open && (
        <div style={{
          width:         "360px",
          height:        "500px",
          background:    "var(--color-white)",
          border:        "1px solid var(--color-border)",
          borderRadius:  "var(--radius-lg)",
          boxShadow:     "0 8px 32px rgba(0,0,0,0.15)",
          marginBottom:  "12px",
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
        }}>

          {/* Header */}
          <div style={{ background: "var(--color-dark)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", background: "var(--color-gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                🎓
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: "500", fontSize: "14px" }}>Houston Edu Assistant</div>
                <div style={{ color: "#16A34A", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "6px", height: "6px", background: "#16A34A", borderRadius: "50%" }} />
                  Online
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "transparent", border: "none", color: "#64748B", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}
            >×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: "24px", height: "24px", background: "var(--color-gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, marginRight: "8px", marginTop: "2px" }}>
                    🎓
                  </div>
                )}
                <div style={{
                  maxWidth:     "78%",
                  padding:      "0.65rem 0.9rem",
                  borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  background:   msg.role === "user" ? "var(--color-dark)" : "#F1F5F9",
                  color:        msg.role === "user" ? "#fff" : "var(--color-text)",
                  fontSize:     "13px",
                  lineHeight:   "1.6",
                }}>
                  {msg.role === "assistant" ? (
                    <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", background: "var(--color-gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>🎓</div>
                <div style={{ background: "#F1F5F9", padding: "0.65rem 0.9rem", borderRadius: "12px 12px 12px 4px", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width:        "6px",
                      height:       "6px",
                      background:   "#94A3B8",
                      borderRadius: "50%",
                      animation:    `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div style={{ padding: "0 1rem 0.75rem", display: "flex", flexWrap: "wrap", gap: "6px", flexShrink: 0 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  background:   "#F1F5F9",
                  border:       "1px solid var(--color-border)",
                  borderRadius: "20px",
                  padding:      "4px 12px",
                  fontSize:     "11px",
                  color:        "var(--color-text-muted)",
                  cursor:       "pointer",
                  whiteSpace:   "nowrap",
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--color-border)", display: "flex", gap: "8px", flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about Houston schools..."
              disabled={loading}
              style={{
                flex:         1,
                padding:      "0.6rem 0.9rem",
                border:       "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                fontSize:     "13px",
                color:        "var(--color-text)",
                background:   "#F8FAFC",
                outline:      "none",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                background:    input.trim() && !loading ? "var(--color-gold)" : "#E2E8F0",
                border:        "none",
                borderRadius:  "var(--radius-sm)",
                width:         "36px",
                height:        "36px",
                display:       "flex",
                alignItems:    "center",
                justifyContent:"center",
                cursor:        input.trim() && !loading ? "pointer" : "default",
                fontSize:      "16px",
                flexShrink:    0,
                transition:    "background 0.15s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width:          "52px",
          height:         "52px",
          background:     open ? "var(--color-dark)" : "var(--color-gold)",
          border:         "none",
          borderRadius:   "50%",
          boxShadow:      "0 4px 12px rgba(0,0,0,0.2)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       "22px",
          cursor:         "pointer",
          marginLeft:     "auto",
          transition:     "background 0.2s",
        }}
      >
        {open ? "×" : "🎓"}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}