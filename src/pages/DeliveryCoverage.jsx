// src/pages/DeliveryCoverage.jsx
// Requires: npm install react-leaflet leaflet
// In your index.html or main CSS: import 'leaflet/dist/leaflet.css'

import { useEffect, useRef, useState } from "react";
import { MapPin, Clock, CheckCircle, XCircle, Bike, ChevronDown } from "lucide-react";
import { Flame } from "lucide-react";
import { Link } from "react-router-dom";

// ── CONFIG — update these to your actual store location & radius ──
const STORE = {
  lat: -26.2041,   // Johannesburg example — replace with your coords
  lng: 28.0473,
  name: "KotaBites HQ",
  address: "123 Kota Street, Johannesburg",
};

const DELIVERY_ZONES = [
  { label: "Express Zone",  radius: 3000,  color: "#4ade80", opacity: 0.18, borderOpacity: 0.7, time: "20–30 min", fee: "R15" },
  { label: "Standard Zone", radius: 6000,  color: "#FFC72C", opacity: 0.12, borderOpacity: 0.6, time: "30–45 min", fee: "R25" },
  { label: "Extended Zone", radius: 10000, color: "#f87171", opacity: 0.08, borderOpacity: 0.4, time: "45–60 min", fee: "R40" },
];

export default function DeliveryCoverage() {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const [address, setAddress]     = useState("");
  const [checking, setChecking]   = useState(false);
  const [result, setResult]       = useState(null); // { covered: bool, zone, distance }
  const [markerRef, setMarkerRef] = useState(null);

  // ── Init Leaflet map ──
  useEffect(() => {
    if (mapInstance.current) return;

    // Dynamic import so SSR-safe
    import("leaflet").then((L) => {
      const map = L.map(mapRef.current, {
        center: [STORE.lat, STORE.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tile layer (CartoDB Dark Matter)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // Attribution (small, bottom-right)
      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('© <a href="https://carto.com">CARTO</a>')
        .addTo(map);

      // Zoom control (styled position)
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Draw delivery circles
      DELIVERY_ZONES.forEach((zone) => {
        L.circle([STORE.lat, STORE.lng], {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: zone.opacity,
          weight: 1.5,
          opacity: zone.borderOpacity,
          dashArray: zone.label === "Extended Zone" ? "6 4" : null,
        }).addTo(map);
      });

      // Store marker (custom)
      const storeIcon = L.divIcon({
        className: "",
        html: `<div class="kb-map-marker-store">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e0700" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([STORE.lat, STORE.lng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`<b>${STORE.name}</b><br/>${STORE.address}`, {
          className: "kb-map-popup",
        });

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // ── Haversine distance (metres) ──
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ── Check coverage via Nominatim geocoding ──
  const handleCheck = async () => {
    if (!address.trim()) return;
    setChecking(true);
    setResult(null);

    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await res.json();

      if (!data.length) {
        setResult({ error: "Address not found. Try a more specific address." });
        setChecking(false);
        return;
      }

      const { lat, lon, display_name } = data[0];
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lon);
      const dist    = haversine(STORE.lat, STORE.lng, userLat, userLng);

      // Find which zone
      const zone = DELIVERY_ZONES.find((z) => dist <= z.radius);

      setResult({
        covered:      !!zone,
        zone:         zone || null,
        distance:     Math.round(dist / 100) / 10, // km
        displayName:  display_name,
      });

      // Place / move marker on map
      import("leaflet").then((L) => {
        if (!mapInstance.current) return;

        if (markerRef) {
          markerRef.setLatLng([userLat, userLng]);
        } else {
          const userIcon = L.divIcon({
            className: "",
            html: `<div class="kb-map-marker-user"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          const m = L.marker([userLat, userLng], { icon: userIcon }).addTo(mapInstance.current);
          setMarkerRef(m);
        }

        mapInstance.current.flyTo([userLat, userLng], 13, { duration: 1.2 });
      });
    } catch {
      setResult({ error: "Could not check coverage. Please try again." });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="cov-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <header className="cov-header">
        <Link to="/" className="cov-logo-wrap">
          <div className="cov-logo">
            <Flame className="w-5 h-5" style={{ color: "#0e0700" }} />
          </div>
          <span className="cov-brand">KOTABITES</span>
        </Link>
        <h1 className="cov-title">Delivery Coverage</h1>
        <p className="cov-sub">Check if we deliver to your area</p>
      </header>

      {/* ── Main layout ── */}
      <div className="cov-body">

        {/* ── Sidebar ── */}
        <aside className="cov-sidebar">

          {/* Address checker */}
          <div className="cov-card">
            <p className="cov-card-label">
              <MapPin className="w-3.5 h-3.5" /> Check your address
            </p>
            <div className="cov-input-wrap">
              <input
                className="cov-input"
                placeholder="e.g. 14 Vilakazi St, Soweto"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              />
              <button
                className="cov-check-btn"
                onClick={handleCheck}
                disabled={checking || !address.trim()}
              >
                {checking ? <span className="cov-spin" /> : "Check"}
              </button>
            </div>

            {/* Result */}
            {result && !result.error && (
              <div className={`cov-result ${result.covered ? "cov-result-yes" : "cov-result-no"}`}>
                {result.covered ? (
                  <CheckCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
                ) : (
                  <XCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
                )}
                <div>
                  <p className="cov-result-title">
                    {result.covered ? `We deliver here! 🎉` : "Outside delivery area"}
                  </p>
                  {result.covered ? (
                    <p className="cov-result-sub">
                      {result.zone.label} · {result.zone.time} · {result.zone.fee}
                    </p>
                  ) : (
                    <p className="cov-result-sub">
                      {result.distance} km away — outside our {DELIVERY_ZONES[DELIVERY_ZONES.length - 1].radius / 1000} km range.
                    </p>
                  )}
                </div>
              </div>
            )}

            {result?.error && (
              <div className="cov-result cov-result-no">
                <XCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
                <p className="cov-result-sub">{result.error}</p>
              </div>
            )}
          </div>

          {/* Zone legend */}
          <div className="cov-card">
            <p className="cov-card-label">
              <Bike className="w-3.5 h-3.5" /> Delivery zones
            </p>
            <div className="cov-zones">
              {DELIVERY_ZONES.map((z) => (
                <div key={z.label} className="cov-zone-row">
                  <span className="cov-zone-dot" style={{ background: z.color, boxShadow: `0 0 8px ${z.color}` }} />
                  <div className="cov-zone-info">
                    <p className="cov-zone-name">{z.label}</p>
                    <p className="cov-zone-meta">{z.radius / 1000} km radius · {z.time} · {z.fee}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Store info */}
          <div className="cov-card">
            <p className="cov-card-label">
              <Clock className="w-3.5 h-3.5" /> Store & hours
            </p>
            <div className="cov-store-info">
              <p className="cov-store-name">{STORE.name}</p>
              <p className="cov-store-addr">{STORE.address}</p>
              <div className="cov-hours">
                {[
                  ["Mon – Fri", "09:00 – 21:00"],
                  ["Saturday",  "10:00 – 22:00"],
                  ["Sunday",    "11:00 – 20:00"],
                ].map(([day, hrs]) => (
                  <div key={day} className="cov-hours-row">
                    <span>{day}</span><span>{hrs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link to="/menu" className="cov-order-btn">
            Order Now
          </Link>
        </aside>

        {/* ── Map ── */}
        <div className="cov-map-wrap">
          <div ref={mapRef} className="cov-map" />
          <div className="cov-map-badge">
            <MapPin className="w-3 h-3" />
            <span>{STORE.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --red:   #DA291C;
    --red2:  #b91c1c;
    --gold:  #FFC72C;
    --dark:  #0e0700;
    --card:  #1a0e00;
    --border: rgba(255,199,44,0.12);
    --text:  #fff8e7;
    --muted: rgba(255,248,231,0.42);
  }

  .cov-root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 40% at 50% 0%, rgba(218,41,28,0.15) 0%, transparent 60%),
      var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    display: flex; flex-direction: column;
  }

  /* ── Header ── */
  .cov-header {
    padding: 24px 32px 20px;
    border-bottom: 1px solid var(--border);
    background: rgba(26,14,0,0.8);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; gap: 16px;
    flex-wrap: wrap;
  }
  .cov-logo-wrap {
    display: flex; align-items: center; gap: 8px; text-decoration: none;
  }
  .cov-logo {
    width: 34px; height: 34px; background: var(--gold); border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 16px rgba(255,199,44,0.3);
    flex-shrink: 0;
  }
  .cov-brand {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px; letter-spacing: 3px; color: var(--text); line-height: 1;
  }
  .cov-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px; letter-spacing: 2px; color: var(--text);
    border-left: 1px solid var(--border); padding-left: 16px;
    line-height: 1;
  }
  .cov-sub {
    font-size: 12px; color: var(--muted); font-weight: 600;
    margin-left: auto;
  }

  /* ── Body layout ── */
  .cov-body {
    flex: 1; display: flex; gap: 0;
    overflow: hidden; min-height: 0;
  }

  /* ── Sidebar ── */
  .cov-sidebar {
    width: 320px; flex-shrink: 0;
    overflow-y: auto; padding: 20px 16px;
    display: flex; flex-direction: column; gap: 12px;
    border-right: 1px solid var(--border);
    scrollbar-width: thin; scrollbar-color: rgba(255,199,44,0.15) transparent;
  }
  .cov-sidebar::-webkit-scrollbar { width: 4px; }
  .cov-sidebar::-webkit-scrollbar-thumb { background: rgba(255,199,44,0.15); border-radius: 4px; }

  /* ── Cards ── */
  .cov-card {
    background: rgba(255,248,231,0.03);
    border: 1px solid var(--border);
    border-radius: 16px; padding: 14px 16px;
  }
  .cov-card-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 12px;
  }

  /* ── Address input ── */
  .cov-input-wrap {
    display: flex; gap: 8px;
  }
  .cov-input {
    flex: 1; background: rgba(255,248,231,0.05);
    border: 1.5px solid var(--border); border-radius: 10px;
    padding: 9px 12px; color: var(--text);
    font-size: 13px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none; transition: border-color 0.2s;
  }
  .cov-input:focus { border-color: rgba(255,199,44,0.4); }
  .cov-input::placeholder { color: var(--muted); }
  .cov-check-btn {
    padding: 9px 16px; background: var(--red); color: white;
    border: none; border-radius: 10px; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800; font-size: 12px;
    transition: all 0.18s; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    min-width: 60px;
  }
  .cov-check-btn:hover:not(:disabled) { background: var(--red2); }
  .cov-check-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .cov-spin {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: covSpin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes covSpin { to { transform: rotate(360deg); } }

  /* ── Result ── */
  .cov-result {
    display: flex; align-items: flex-start; gap: 10px;
    margin-top: 10px; padding: 10px 12px; border-radius: 10px;
    border: 1px solid; animation: covFadeIn 0.25s ease;
  }
  .cov-result-yes {
    background: rgba(74,222,128,0.08); border-color: rgba(74,222,128,0.25);
    color: #4ade80;
  }
  .cov-result-no {
    background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.25);
    color: #f87171;
  }
  .cov-result-title { font-size: 12px; font-weight: 800; color: var(--text); }
  .cov-result-sub   { font-size: 11px; color: var(--muted); margin-top: 2px; }
  @keyframes covFadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

  /* ── Zones ── */
  .cov-zones { display: flex; flex-direction: column; gap: 10px; }
  .cov-zone-row { display: flex; align-items: center; gap: 10px; }
  .cov-zone-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  }
  .cov-zone-name { font-size: 12px; font-weight: 800; color: var(--text); }
  .cov-zone-meta { font-size: 11px; color: var(--muted); margin-top: 1px; }

  /* ── Store info ── */
  .cov-store-name { font-size: 13px; font-weight: 800; color: var(--text); margin-bottom: 3px; }
  .cov-store-addr { font-size: 11px; color: var(--muted); margin-bottom: 10px; }
  .cov-hours { display: flex; flex-direction: column; gap: 5px; }
  .cov-hours-row {
    display: flex; justify-content: space-between;
    font-size: 11px; color: var(--muted);
  }
  .cov-hours-row span:last-child { color: var(--text); font-weight: 700; }

  /* ── Order button ── */
  .cov-order-btn {
    display: flex; align-items: center; justify-content: center;
    background: var(--red); color: white; text-decoration: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 900; font-size: 14px;
    padding: 14px; border-radius: 14px;
    box-shadow: 0 6px 20px rgba(218,41,28,0.4);
    transition: all 0.2s; text-align: center;
  }
  .cov-order-btn:hover { background: var(--red2); transform: scale(1.02); }

  /* ── Map ── */
  .cov-map-wrap {
    flex: 1; position: relative; min-height: 0;
  }
  .cov-map {
    width: 100%; height: 100%;
    min-height: calc(100vh - 80px);
  }

  /* Override Leaflet tiles for dark look */
  .cov-map .leaflet-tile-pane { filter: brightness(0.85) contrast(1.05); }

  .cov-map-badge {
    position: absolute; top: 14px; left: 14px; z-index: 800;
    display: flex; align-items: center; gap: 6px;
    background: rgba(26,14,0,0.85); backdrop-filter: blur(8px);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 7px 12px; font-size: 11px; font-weight: 700; color: var(--gold);
    pointer-events: none;
  }

  /* ── Custom map markers ── */
  .kb-map-marker-store {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--gold);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 4px rgba(255,199,44,0.25), 0 4px 16px rgba(255,199,44,0.5);
    animation: markerPulse 2s ease infinite;
  }
  @keyframes markerPulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(255,199,44,0.25), 0 4px 16px rgba(255,199,44,0.4); }
    50%       { box-shadow: 0 0 0 8px rgba(255,199,44,0.1),  0 4px 20px rgba(255,199,44,0.6); }
  }

  .kb-map-marker-user {
    width: 16px; height: 16px; border-radius: 50%;
    background: #DA291C;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(218,41,28,0.6);
  }

  /* ── Leaflet popup override ── */
  .kb-map-popup .leaflet-popup-content-wrapper {
    background: var(--card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 10px !important;
    color: var(--text) !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-size: 12px !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
  }
  .kb-map-popup .leaflet-popup-tip { background: var(--card) !important; }

  /* ── Leaflet zoom buttons override ── */
  .leaflet-control-zoom a {
    background: rgba(26,14,0,0.9) !important;
    border-color: var(--border) !important;
    color: var(--text) !important;
    font-size: 16px !important;
  }
  .leaflet-control-zoom a:hover {
    background: rgba(255,199,44,0.1) !important;
    color: var(--gold) !important;
  }

  /* ── Attribution override ── */
  .leaflet-control-attribution {
    background: rgba(14,7,0,0.7) !important;
    color: rgba(255,248,231,0.3) !important;
    font-size: 9px !important;
  }
  .leaflet-control-attribution a { color: rgba(255,199,44,0.4) !important; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .cov-body { flex-direction: column; overflow: visible; }
    .cov-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border); }
    .cov-map-wrap { min-height: 400px; }
    .cov-map { min-height: 400px; }
    .cov-header { padding: 16px; gap: 10px; }
    .cov-sub { display: none; }
  }
`;
