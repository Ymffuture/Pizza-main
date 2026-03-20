import { useMemo, useState } from "react";

export default function Avatar({ picture, name, size = 32, style = {} }) {
  const [error, setError] = useState(false);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // AI avatar
  const aiAvatar = useMemo(() => {
    const seed = encodeURIComponent(name || "user");
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
  }, [name]);

  // Random local avatar
  const randomAvatar = useMemo(() => {
    const count = 5;
    const index = Math.floor(Math.random() * count) + 1;
    return `/ppimg/img${index}.png`;
  }, []);

  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    objectFit: "cover",
    ...style,
  };

  const src = picture || aiAvatar || randomAvatar;

  if (error) {
    return (
      <div
        style={{
          ...base,
          background: "linear-gradient(135deg,#DA291C,#b91c1c)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.38,
          fontWeight: 900,
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          border: "2px solid rgba(218,41,28,0.4)",
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "User"}
      style={{
        ...base,
        border: "2px solid rgba(255,199,44,0.4)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      }}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}
