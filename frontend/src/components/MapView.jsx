export default function MapView({ lat, lng, name, height = "180px" }) {
  if (!lat || !lng) {
    return (
      <div style={{
        height,
        background:     "#1C2E42",
        borderRadius:   "var(--radius-md)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        color:          "#64748B",
        fontSize:       "13px",
      }}>
        No location data
      </div>
    );
  }

  const d   = 0.02;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div style={{ height, borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      <iframe
        src={src}
        title={name}
        style={{ width: "100%", height: "100%", border: "none" }}
        loading="lazy"
      />
    </div>
  );
}