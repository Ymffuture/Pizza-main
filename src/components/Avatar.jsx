import { useMemo, useState } from "react";
import md5 from "blueimp-md5";
import { CircleUser } from 'lucide-react';

export default function Avatar({
  picture,
  email,
  name,
  size = 22,
  style = {},
}) {
  const [error, setError] = useState(false);

  // Check if we have any user data at all
  const hasUser = picture || email || name;

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null;

  // Gravatar avatar
  const gravatar = useMemo(() => {
    if (!email) return null;

    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  }, [email, size]);

  // Random local avatar (based on email or name for consistency)
  const randomAvatar = useMemo(() => {
    const count = 5;
    const seed = email || name || "default";
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = (Math.abs(hash) % count) + 1;
    return `/ppimg/img${index}.png`;
  }, [email, name]);

  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    objectFit: "cover",
    ...style,
  };

  const src = picture || gravatar || randomAvatar;

  // ✅ Transparent fallback when no user data
  if (!hasUser) {
    return (
      <div
        style={{
          ...base,
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircleUser 
          className="text-gray-400" 
          style={{ width: size * 0.9, height: size * 0.9 }}
        />
      </div>
    );
  }

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
        {initials || <CircleUser size={size * 0.5} />}
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
