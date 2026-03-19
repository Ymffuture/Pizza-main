export default function Avatar({ picture, name, size = 32, style = {} }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const base = {
    width:        size,
    height:       size,
    borderRadius: "50%",
    flexShrink:   0,
    objectFit:    "cover",
    ...style,
  };

  if (picture) {
    return (
      <img
        src={picture}
        alt={name || "User"}
        style={{ ...base, border: "2px solid rgba(255,199,44,0.4)" }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      style={{
        ...base,
        background:     "linear-gradient(135deg,#DA291C,#b91c1c)",
        color:          "white",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       size * 0.38,
        fontWeight:     900,
        fontFamily:     "'Plus Jakarta Sans',sans-serif",
        border:         "2px solid rgba(218,41,28,0.4)",
      }}
    >
      {initials}
    </div>
  );
}
