import { useMemo } from "react";

export default function Avatar({ picture, name, size = 32, style = {} }) {

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  // Random fallback image
  const randomAvatar = useMemo(() => {
    const count = 5; // number of images in /ppimg
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

  const src = picture || randomAvatar;

  return (
    <img
      src={src}
      alt={name || "User"}
      style={{
        ...base,
        border: "2px solid rgba(255,199,44,0.4)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
      }}
      referrerPolicy="no-referrer"
      onError={(e) => {
        // final fallback to initials if image fails
        e.currentTarget.style.display = "none";
        const parent = e.currentTarget.parentNode;
        if (parent) {
          parent.innerHTML = `
            <div style="
              width:${size}px;
              height:${size}px;
              border-radius:50%;
              background:linear-gradient(135deg,#DA291C,#b91c1c);
              color:white;
              display:flex;
              align-items:center;
              justify-content:center;
              font-weight:900;
              font-size:${size * 0.38}px;
              border:2px solid rgba(218,41,28,0.4);
            ">
              ${initials}
            </div>
          `;
        }
      }}
    />
  );
}
