import { useState, useRef, useCallback, useEffect } from "react";
import { formatCurrency } from "../utils/formatCurrency";
import { ShoppingBag, ZoomIn, X, CircleStar, Tags } from "lucide-react";
import StarRating from "./StarRating";
/* ─────────────────────────────────────────────
   3-D Lightbox — full-screen image viewer with
   mouse-drag orbit + touch drag orbit
───────────────────────────────────────────── */
function ImageViewer({ item, onClose }) {
  const [rotX, setRotX] = useState(-8);
  const [rotY, setRotY] = useState(10);
  const [zoom, setZoom] = useState(1);
  const drag = useRef(null);
  const frameRef = useRef(null);

  // keyboard escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // auto rotate when idle
  useEffect(() => {
    let id;
    if (!drag.current) {
      id = requestAnimationFrame(function tick() {
        if (!drag.current) setRotY((y) => y + 0.15);
        id = requestAnimationFrame(tick);
      });
    }
    return () => cancelAnimationFrame(id);
  }, []);

  const startDrag = (cx, cy) => {
    drag.current = { cx, cy, rx: rotX, ry: rotY };
  };
  const moveDrag = (cx, cy) => {
    if (!drag.current) return;
    const dx = cx - drag.current.cx;
    const dy = cy - drag.current.cy;
    setRotY(drag.current.ry + dx * 0.5);
    setRotX(drag.current.rx - dy * 0.5);
  };
  const endDrag = () => { drag.current = null; };

  return (
    <div className="iv-overlay" onClick={onClose}>
      <style>{viewerStyles}</style>

      {/* Close */}
      <button className="iv-close" onClick={onClose}><X className="w-5 h-5" /></button>

      {/* Zoom */}
      <div className="iv-zoom-bar" onClick={(e) => e.stopPropagation()}>
        <button className="iv-zoom-btn" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}>−</button>
        <span className="iv-zoom-val">{Math.round(zoom * 100)}%</span>
        <button className="iv-zoom-btn" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>+</button>
        <button className="iv-zoom-btn iv-reset" onClick={() => { setRotX(-8); setRotY(10); setZoom(1); }}>↺</button>
      </div>

      {/* 3D stage */}
      <div
        ref={frameRef}
        className="iv-stage"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
        style={{ perspective: "900px" }}
      >
        {/* Glow behind */}
        <div className="iv-glow" />

        <div
          className="iv-frame"
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoom})`,
            cursor: drag.current ? "grabbing" : "grab",
          }}
        >
          {/* Main image face */}
          <img src={item.image_url} alt={item.name} className="iv-img" draggable={false} />

          {/* Bottom face (depth illusion) */}
          <div className="iv-face iv-face-bottom" />
          {/* Right face */}
          <div className="iv-face iv-face-right" />
          {/* Left face */}
          <div className="iv-face iv-face-left" />

          {/* Info overlay */}
          <div className="iv-info-bar">
            <span className="iv-info-name">{item.name}</span>
            <span className="iv-info-price">{formatCurrency(item.price)}</span>
          </div>
        </div>

        <p className="iv-hint">Drag to orbit · scroll buttons to zoom</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MenuCard
───────────────────────────────────────────── */
export default function MenuCard({ item, onSelect }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientY - rect.top)  / rect.height - 0.5) * 18;
    const y = ((e.clientX - rect.left) / rect.width  - 0.5) * -18;
    setTilt({ x, y });
  }, []);

  const resetTilt = () => { setTilt({ x: 0, y: 0 }); setHovering(false); };

  return (
    <>
      <style>{cardStyles}</style>

      {showViewer && (
        <ImageViewer item={item} onClose={() => setShowViewer(false)} />
      )}

      <div
        ref={cardRef}
        className={`mc-root${hovering ? " mc-hovered" : ""}${pressed ? " mc-pressed" : ""}`}
        style={{
          transform: hovering
            ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`
            : "perspective(800px) rotateX(0) rotateY(0) translateY(0)",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={resetTilt}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
      >
        {/* ── Image ── */}
        <div className="mc-img-wrap">
          {!imgLoaded && <div className="mc-skeleton" />}
          <img
            src={item.image_url}
            alt={item.name}
            className={`mc-img${imgLoaded ? " mc-img-loaded" : ""}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            style={{ transform: hovering ? "scale(1.07)" : "scale(1)" }}
          />

          {/* Dark overlay on hover */}
          <div className={`mc-overlay${hovering ? " mc-overlay-vis" : ""}`} />

          {/* Available badge */}
          <div className="mc-badge">
            <span className="mc-badge-dot" />
            Available
          </div>

          {/* 3D View button */}
          <button
            className={`mc-3d-btn${hovering ? " mc-3d-btn-vis" : ""}`}
            onClick={(e) => { e.stopPropagation(); setShowViewer(true); }}
            title="View in 3D"
          >
            <ZoomIn className="w-4 h-4" />
            <span>3D View</span>
          </button>

          {/* Category tag */}
          {item.category && (
            <div className="mc-cat-tag">
              <Tags className="w-3 h-3" />
              {item.category}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="mc-body">
          <div className="mc-name-row">
            <h3 className="mc-name">{item.name}</h3>
            {/* Animated underline */}
            <div className={`mc-underline${hovering ? " mc-underline-full" : ""}`} />
          </div>

          {item.description && (
            <p className="mc-desc">{item.description}</p>
          )}

          <div className="mc-meta">
            <div>
              <span className="mc-price-label">Price</span>
              <span className="mc-price">{formatCurrency(item.price)}</span>
            </div>
<div className="mc-stars">
              {[...Array(5)].map((_, i) => (
                <CircleStar
                  key={i}
                  className={`mc-star${i < (item.rating || 4) ? " mc-star-on" : ""}`}
                />
              ))}
            </div>
          </div>

          <button
            className="mc-add-btn"
            onClick={() => onSelect(item)}
          >
            {/* Shimmer sweep */}
            <span className={`mc-shimmer${hovering ? " mc-shimmer-sweep" : ""}`} />
            <ShoppingBag className="w-4 h-4" style={{ position: "relative" }} />
            <span style={{ position: "relative" }}>Add to Order</span>
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const cardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --red:    #DA291C;
    --red2:   #b91c1c;
    --gold:   #FFC72C;
    --dark:   #0e0700;
    --card:   #1a0e00;
    --border: rgba(255,199,44,0.12);
    --text:   #fff8e7;
    --muted:  rgba(255,248,231,0.42);
  }

  /* ── Card root ── */
  .mc-root {
    position: relative;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    transition: transform 0.18s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    will-change: transform;
  }
  .mc-hovered {
    border-color: rgba(255,199,44,0.3);
    box-shadow:
      0 16px 48px rgba(0,0,0,0.6),
      0 0 0 1px rgba(255,199,44,0.2),
      0 0 40px rgba(218,41,28,0.12);
  }
  .mc-pressed { transform: scale(0.98) !important; }

  /* ── Image ── */
  .mc-img-wrap {
    position: relative; height: 220px; overflow: hidden;
    background: #120800;
  }
  .mc-skeleton {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, #1a0e00 25%, #2a1800 50%, #1a0e00 75%);
    background-size: 200% 100%;
    animation: mcSkel 1.4s ease infinite;
  }
  @keyframes mcSkel {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .mc-img {
    width: 100%; height: 100%; object-fit: cover;
    opacity: 0; transition: transform 0.55s ease, opacity 0.4s ease;
  }
  .mc-img-loaded { opacity: 1; }
  .mc-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%);
    opacity: 0; transition: opacity 0.3s;
  }
  .mc-overlay-vis { opacity: 1; }

  /* Badge */
  .mc-badge {
    position: absolute; top: 12px; left: 12px;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 50px;
    background: rgba(14,7,0,0.75); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,199,44,0.2);
    font-size: 10px; font-weight: 800; letter-spacing: 0.06em;
    color: var(--text); text-transform: uppercase;
  }
  .mc-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 6px rgba(74,222,128,0.8);
    animation: mcPulse 1.5s ease infinite;
  }
  @keyframes mcPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.6} }

  /* 3D button */
  .mc-3d-btn {
    position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%) translateY(8px);
    display: flex; align-items: center; gap: 6px;
    background: rgba(14,7,0,0.7); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,199,44,0.3); border-radius: 50px;
    padding: 7px 16px; color: var(--gold);
    font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
    cursor: pointer; opacity: 0;
    transition: opacity 0.25s, transform 0.25s;
    white-space: nowrap;
  }
  .mc-3d-btn-vis { opacity: 1; transform: translateX(-50%) translateY(0); }
  .mc-3d-btn:hover { background: rgba(255,199,44,0.15); }

  /* Category tag */
  .mc-cat-tag {
    position: absolute; top: 12px; right: 12px;
    display: flex; align-items: center; gap: 4px;
    background: var(--red); color: white;
    font-size: 9px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 4px 9px; border-radius: 50px;
  }

  /* ── Body ── */
  .mc-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; }

  .mc-name-row { position: relative; display: inline-block; }
  .mc-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 1.5px; color: var(--text); line-height: 1;
    transition: color 0.25s;
  }
  .mc-hovered .mc-name { color: var(--gold); }
  .mc-underline {
    position: absolute; bottom: -2px; left: 0;
    height: 2px; width: 0;
    background: linear-gradient(90deg, var(--red), var(--gold));
    border-radius: 2px; transition: width 0.4s ease;
  }
  .mc-underline-full { width: 100%; }

  .mc-desc {
    font-size: 12px; color: var(--muted); line-height: 1.55;
    overflow: hidden;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  }

  /* Meta row */
  .mc-meta { display: flex; align-items: flex-end; justify-content: space-between; }
  .mc-price-label {
    display: block; font-size: 9px; font-weight: 800;
    color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase;
  }
  .mc-price {
    display: block; font-family: 'Bebas Neue', sans-serif;
    font-size: 26px; letter-spacing: 1px; color: var(--text);
    line-height: 1; transition: color 0.25s;
  }
  .mc-hovered .mc-price { color: var(--gold); }

  /* Stars */
  .mc-stars { display: flex; gap: 2px; }
  .mc-star { width: 13px; height: 13px; color: rgba(255,199,44,0.2); transition: color 0.2s; }
  .mc-star-on { color: var(--gold); fill: var(--gold); }

  /* Add button */
  .mc-add-btn {
    position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 13px;
    background: var(--red); color: white; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 13px;
    border-radius: 12px; letter-spacing: 0.04em;
    box-shadow: 0 4px 16px rgba(218,41,28,0.35);
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    margin-top: 2px;
  }
  .mc-add-btn:hover { background: var(--red2); box-shadow: 0 6px 24px rgba(218,41,28,0.5); }
  .mc-add-btn:active { transform: scale(0.97); }

  /* Shimmer sweep */
  .mc-shimmer {
    position: absolute; top: 0; left: -75%;
    width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    transform: skewX(-20deg); transition: left 0s;
  }
  .mc-shimmer-sweep { left: 150%; transition: left 0.65s ease; }
`;

const viewerStyles = `
  .iv-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(10,4,0,0.92);
    backdrop-filter: blur(18px);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    animation: ivFadeIn 0.25s ease;
  }
  @keyframes ivFadeIn { from{opacity:0} to{opacity:1} }

  .iv-close {
    position: absolute; top: 20px; right: 20px;
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,199,44,0.1); border: 1px solid rgba(255,199,44,0.25);
    color: #fff8e7; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .iv-close:hover { background: rgba(218,41,28,0.4); }

  .iv-zoom-bar {
    position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 6px;
    background: rgba(26,14,0,0.85); border: 1px solid rgba(255,199,44,0.2);
    border-radius: 50px; padding: 8px 16px;
  }
  .iv-zoom-btn {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(255,199,44,0.1); border: 1px solid rgba(255,199,44,0.2);
    color: #fff8e7; cursor: pointer; font-size: 16px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .iv-zoom-btn:hover { background: rgba(218,41,28,0.5); }
  .iv-reset { font-size: 14px; }
  .iv-zoom-val { font-size: 12px; font-weight: 700; color: rgba(255,248,231,0.6); min-width: 38px; text-align: center; font-family: monospace; }

  .iv-stage {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 20px; user-select: none;
  }

  .iv-glow {
    position: absolute; width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(218,41,28,0.25) 0%, transparent 70%);
    pointer-events: none; filter: blur(40px);
  }

  .iv-frame {
    position: relative;
    width: clamp(280px, 55vw, 480px);
    border-radius: 16px;
    transition: transform 0.08s linear;
    transform-style: preserve-3d;
    box-shadow:
      0 30px 80px rgba(0,0,0,0.8),
      0 0 0 1px rgba(255,199,44,0.18),
      0 0 60px rgba(218,41,28,0.2);
  }

  .iv-img {
    width: 100%; border-radius: 16px; display: block;
    aspect-ratio: 4/3; object-fit: cover;
    pointer-events: none;
  }

  /* Depth faces */
  .iv-face {
    position: absolute; background: rgba(255,199,44,0.08);
    border: 1px solid rgba(255,199,44,0.15);
  }
  .iv-face-bottom {
    bottom: -12px; left: 6px; right: 6px; height: 12px;
    border-radius: 0 0 8px 8px;
    transform: rotateX(-90deg) translateZ(-6px);
  }
  .iv-face-right {
    top: 4px; right: -12px; width: 12px; bottom: 4px;
    border-radius: 0 8px 8px 0;
    transform: rotateY(90deg) translateZ(-6px);
  }
  .iv-face-left {
    top: 4px; left: -12px; width: 12px; bottom: 4px;
    border-radius: 8px 0 0 8px;
    transform: rotateY(-90deg) translateZ(-6px);
  }

  .iv-info-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 16px; border-radius: 0 0 16px 16px;
    background: linear-gradient(to top, rgba(14,7,0,0.9) 0%, transparent 100%);
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .iv-info-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px; letter-spacing: 2px; color: #fff8e7;
  }
  .iv-info-price {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 1px; color: #FFC72C;
  }

  .iv-hint {
    font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
    color: rgba(255,248,231,0.3); text-transform: uppercase;
    position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
    white-space: nowrap;
  }
`;
