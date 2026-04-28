export default function ErrorMessage({ message = "Something went wrong.", onRetry }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "300px", gap: "0.75rem", color: "var(--color-text-muted)", textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: "36px" }}>⚠️</div>
      <div style={{ fontSize: "15px", fontWeight: "500", color: "var(--color-text)" }}>Something went wrong</div>
      <div style={{ fontSize: "13px", maxWidth: "360px", lineHeight: "1.6" }}>{message}</div>
      {onRetry && (
        <button onClick={onRetry} style={{ marginTop: "0.5rem", background: "var(--color-gold)", color: "var(--color-dark)", border: "none", borderRadius: "var(--radius-sm)", padding: "9px 22px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
          Try Again
        </button>
      )}
    </div>
  );
}