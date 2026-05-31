// src/pages/DeliveryCoverage.jsx
// Simplified & Enhanced UX — clear instructions, cleaner layout, better feedback

import { useEffect, useRef, useState } from "react";
import { MapPin, Clock, CheckCircle, XCircle, Bike, ArrowLeft, Info, Search, Navigation } from "lucide-react";
import { Flame } from "lucide-react";
import { Link } from "react-router-dom";

// ── CONFIG ──
const STORE = {
  lat: -26.430171,
  lng: 27.872867,
  name: "KotaBites HQ",
  address: "Tjovitjo phase 2, Johannesburg",
};

const DELIVERY_ZONES = [
  { label: "Express Zone",  radius: 1000,  color: "#4ade80", time: "20–30 min", fee: "R15" },
  { label: "Standard Zone", radius: 1100,  color: "#FFC72C", time: "30–45 min", fee: "R25" },
  { label: "Extended Zone", radius: 1300, color: "#f87171", time: "45–60 min", fee: "R40" },
];

export default function DeliveryCoverage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [address, setAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [markerRef, setMarkerRef] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // ── Init Leaflet map ──
  useEffect(() => {
    if (mapInstance.current) return;

    import("leaflet").then((L) => {
      const map = L.map(mapRef.current, {
        center: [STORE.lat, STORE.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('© <a href="https://carto.com">CARTO</a>')
        .addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Draw zones
      DELIVERY_ZONES.forEach((zone) => {
        L.circle([STORE.lat, STORE.lng], {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.12,
          weight: 2,
          opacity: 0.7,
          dashArray: zone.label === "Extended Zone" ? "6 4" : null,
        }).addTo(map);
      });

      // Store marker
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

  const handleCheck = async () => {
    if (!address.trim()) return;
    setChecking(true);
    setResult(null);
    setShowInstructions(false);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await res.json();

      if (!data.length) {
        setResult({ error: "Address not found. Try a more specific address with street name and area." });
        setChecking(false);
        return;
      }

      const { lat, lon, display_name } = data[0];
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lon);
      const dist = haversine(STORE.lat, STORE.lng, userLat, userLng);
      const zone = DELIVERY_ZONES.find((z) => dist <= z.radius);

      setResult({
        covered: !!zone,
        zone: zone || null,
        distance: Math.round(dist / 100) / 10,
        displayName: display_name,
      });

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
        mapInstance.current.flyTo([userLat, userLng], 14, { duration: 1.2 });
      });
    } catch {
      setResult({ error: "Could not check coverage. Please check your internet and try again." });
    } finally {
      setChecking(false);
    }
  };

  const clearSearch = () => {
    setAddress("");
    setResult(null);
    setShowInstructions(true);
    if (markerRef && mapInstance.current) {
      mapInstance.current.removeLayer(markerRef);
      setMarkerRef(null);
    }
    if (mapInstance.current) {
      mapInstance.current.flyTo([STORE.lat, STORE.lng], 13, { duration: 0.8 });
    }
  };

  return (
    <div className="cov-root">
      <style>{styles}</style>

      {/* Header */}
      <header className="cov-header">
        <Link to="/" className="cov-back">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="cov-header-center">
          <div className="cov-logo">
            <Flame className="w-5 h-5" style={{ color: "#0e0700" }} />
          </div>
          <div>
            <h1 className="cov-title">Delivery Coverage</h1>
            <p className="cov-sub">Check if we deliver to your area</p>
          </div>
        </div>
        <div className="cov-header-spacer" />
      </header>

      {/* Main */}
      <div className="cov-body">

        {/* Sidebar */}
        <aside className="cov-sidebar">

          {/* Address Checker Card */}
          <div className="cov-card cov-card-main">
            <div className="cov-card-header">
              <Search className="w-4 h-4" />
              <span>Check Your Address</span>
            </div>

            <div className="cov-input-wrap">
              <input
                className="cov-input"
                placeholder="Enter your street address..."
                value={address}
                onChange={(e) => { setAddress(e.target.value); if (!e.target.value) clearSearch(); }}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              />
              {address && (
                <button className="cov-clear" onClick={clearSearch}>
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              className="cov-check-btn"
              onClick={handleCheck}
              disabled={checking || !address.trim()}
            >
              {checking ? (
                <>
                  <span className="cov-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Check Coverage
                </>
              )}
            </button>

            {/* Instructions */}
            {showInstructions && !result && (
              <div className="cov-instructions">
                <div className="cov-instr-header">
                  <Info className="w-4 h-4" />
                  <span>How to check</span>
                </div>
                <ol className="cov-instr-list">
                  <li>Type your full street address in the box above</li>
                  <li>Include your area name (e.g., "Soweto", "Roodepoort")</li>
                  <li>Click <strong>Check Coverage</strong> or press Enter</li>
                  <li>We'll show your zone, delivery time, and fee</li>
                </ol>
                <div className="cov-instr-example">
                  <MapPin className="w-3 h-3" />
                  <span>Example: "14 Vilakazi St, Soweto"</span>
                </div>
              </div>
            )}

            {/* Result */}
            {result && !result.error && (
              <div className={`cov-result ${result.covered ? "cov-result-yes" : "cov-result-no"}`}>
                {result.covered ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <div className="cov-result-body">
                  <p className="cov-result-title">
                    {result.covered ? "✓ We deliver to your area!" : "✗ Outside delivery area"}
                  </p>
                  {result.covered ? (
                    <div className="cov-result-details">
                      <div className="cov-detail-row">
                        <span className="cov-detail-label">Zone</span>
                        <span className="cov-detail-value" style={{ color: result.zone.color }}>
                          {result.zone.label}
                        </span>
                      </div>
                      <div className="cov-detail-row">
                        <span className="cov-detail-label">Delivery Time</span>
                        <span className="cov-detail-value">{result.zone.time}</span>
                      </div>
                      <div className="cov-detail-row">
                        <span className="cov-detail-label">Delivery Fee</span>
                        <span className="cov-detail-value">{result.zone.fee}</span>
                      </div>
                      <div className="cov-detail-row">
                        <span className="cov-detail-label">Distance</span>
                        <span className="cov-detail-value">{result.distance} km</span>
                      </div>
                    </div>
                  ) : (
                    <p className="cov-result-sub">
                      Your location is <strong>{result.distance} km</strong> away.<br />
                      Our max range is <strong>{DELIVERY_ZONES[DELIVERY_ZONES.length - 1].radius / 1000} km</strong>.
                    </p>
                  )}
                </div>
              </div>
            )}

            {result?.error && (
              <div className="cov-result cov-result-no">
                <XCircle className="w-5 h-5" />
                <div>
                  <p className="cov-result-title">Could not find address</p>
                  <p className="cov-result-sub">{result.error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Zone Legend */}
          <div className="cov-card">
            <div className="cov-card-header">
              <Bike className="w-4 h-4" />
              <span>Delivery Zones</span>
            </div>
            <div className="cov-zones">
              {DELIVERY_ZONES.map((z) => (
                <div key={z.label} className="cov-zone-row">
                  <span className="cov-zone-dot" style={{ background: z.color }} />
                  <div className="cov-zone-info">
                    <p className="cov-zone-name">{z.label}</p>
                    <p className="cov-zone-meta">Up to {z.radius / 1000} km · {z.time} · {z.fee}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Store Info */}
          <div className="cov-card">
            <div className="cov-card-header">
              <Clock className="w-4 h-4" />
              <span>Store & Hours</span>
            </div>
            <div className="cov-store-info">
              <p className="cov-store-name">{STORE.name}</p>
              <p className="cov-store-addr">{STORE.address}</p>
              <div className="cov-hours">
                {[
                  ["Mon – Fri", "09:00 – 17:00"],
                  ["Saturday", "09:00 – 14:00"],
                  ["Sunday", "Closed"],
                ].map(([day, hrs]) => (
                  <div key={day} className="cov-hours-row">
                    <span>{day}</span><span>{hrs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link to="/menu" className="cov-order-btn">
            <Flame className="w-4 h-4" />
            Order Now
          </Link>
        </aside>

        {/* Map */}
        <div className="cov-map-wrap">
          <div ref={mapRef} className="cov-map" />
          <div className="cov-map-badge">
            <MapPin className="w-3 h-3" />
            <span>{STORE.name}</span>
          </div>
          <div className="cov-map-legend">
            <span className="cov-legend-dot" style={{ background: "#4ade80" }} /> Express
            <span className="cov-legend-dot" style={{ background: "#FFC72C" }} /> Standard
            <span className="cov-legend-dot" style={{ background: "#f87171" }} /> Extended
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
    --green: #4ade80;
  }

  .cov-root {
    min-height: 100vh;
    background: var(--dark);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: var(--text);
    display: flex; flex-direction: column;
  }

  /* Header */
  .cov-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: rgba(26,14,0,0.9);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
  }
  .cov-back {
    display: flex; align-items: center; gap: 6px;
    color: var(--muted); text-decoration: none;
    font-size: 13px; font-weight: 600;
    transition: color 0.2s;
  }
  .cov-back:hover { color: var(--gold); }
  .cov-header-center {
    display: flex; align-items: center; gap: 12px;
    position: absolute; left: 50%; transform: translateX(-50%);
  }
  .cov-logo {
    width: 36px; height: 36px; background: var(--gold); border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 16px rgba(255,199,44,0.3);
  }
  .cov-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 2px; color: var(--text);
    line-height: 1;
  }
  .cov-sub {
    font-size: 11px; color: var(--muted); font-weight: 500;
    margin-top: 2px;
  }
  .cov-header-spacer { width: 60px; }

  /* Body */
  .cov-body {
    flex: 1; display: flex; gap: 0;
    overflow: hidden; min-height: 0;
  }

  /* Sidebar */
  .cov-sidebar {
    width: 340px; flex-shrink: 0;
    overflow-y: auto; padding: 16px;
    display: flex; flex-direction: column; gap: 12px;
    border-right: 1px solid var(--border);
    scrollbar-width: thin; scrollbar-color: rgba(255,199,44,0.15) transparent;
  }
  .cov-sidebar::-webkit-scrollbar { width: 4px; }
  .cov-sidebar::-webkit-scrollbar-thumb { background: rgba(255,199,44,0.15); border-radius: 4px; }

  /* Cards */
  .cov-card {
    background: rgba(255,248,231,0.03);
    border: 1px solid var(--border);
    border-radius: 14px; padding: 16px;
  }
  .cov-card-main { border-color: rgba(255,199,44,0.2); }
  .cov-card-header {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 800; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 14px;
  }

  /* Input */
  .cov-input-wrap {
    display: flex; align-items: center; gap: 8px;
    position: relative;
  }
  .cov-input {
    flex: 1; background: rgba(255,248,231,0.05);
    border: 1.5px solid var(--border); border-radius: 12px;
    padding: 12px 40px 12px 14px; color: var(--text);
    font-size: 14px; font-weight: 500;
    font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none; transition: all 0.2s;
  }
  .cov-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(255,199,44,0.1); }
  .cov-input::placeholder { color: var(--muted); }
  .cov-clear {
    position: absolute; right: 14px;
    background: none; border: none; color: var(--muted);
    cursor: pointer; padding: 2px;
    display: flex; align-items: center; justify-content: center;
  }
  .cov-clear:hover { color: var(--text); }

  /* Check Button */
  .cov-check-btn {
    width: 100%; margin-top: 10px;
    padding: 12px; background: var(--red); color: white;
    border: none; border-radius: 12px; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800; font-size: 13px;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .cov-check-btn:hover:not(:disabled) { background: var(--red2); transform: translateY(-1px); }
  .cov-check-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .cov-spin {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: covSpin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes covSpin { to { transform: rotate(360deg); } }

  /* Instructions */
  .cov-instructions {
    margin-top: 14px; padding: 14px;
    background: rgba(255,199,44,0.05);
    border: 1px dashed rgba(255,199,44,0.2);
    border-radius: 12px;
  }
  .cov-instr-header {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; color: var(--gold);
    margin-bottom: 10px;
  }
  .cov-instr-list {
    margin: 0; padding-left: 18px;
    font-size: 12px; color: var(--muted); line-height: 1.8;
  }
  .cov-instr-list li { margin-bottom: 4px; }
  .cov-instr-example {
    margin-top: 10px; padding: 8px 10px;
    background: rgba(255,199,44,0.08);
    border-radius: 8px;
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--gold); font-weight: 600;
  }

  /* Result */
  .cov-result {
    display: flex; align-items: flex-start; gap: 12px;
    margin-top: 14px; padding: 14px; border-radius: 12px;
    border: 1px solid; animation: covFadeIn 0.3s ease;
  }
  .cov-result-yes {
    background: rgba(74,222,128,0.08); border-color: rgba(74,222,128,0.25);
    color: var(--green);
  }
  .cov-result-no {
    background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.25);
    color: #f87171;
  }
  .cov-result-body { flex: 1; }
  .cov-result-title { font-size: 14px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
  .cov-result-sub { font-size: 12px; color: var(--muted); line-height: 1.6; }
  .cov-result-details { display: flex; flex-direction: column; gap: 6px; }
  .cov-detail-row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; padding: 6px 0;
    border-bottom: 1px solid rgba(255,248,231,0.05);
  }
  .cov-detail-row:last-child { border-bottom: none; }
  .cov-detail-label { color: var(--muted); font-weight: 500; }
  .cov-detail-value { color: var(--text); font-weight: 700; }
  @keyframes covFadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }

  /* Zones */
  .cov-zones { display: flex; flex-direction: column; gap: 10px; }
  .cov-zone-row { display: flex; align-items: center; gap: 10px; }
  .cov-zone-dot {
    width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
    box-shadow: 0 0 8px currentColor;
  }
  .cov-zone-name { font-size: 13px; font-weight: 700; color: var(--text); }
  .cov-zone-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* Store Info */
  .cov-store-name { font-size: 14px; font-weight: 800; color: var(--text); margin-bottom: 3px; }
  .cov-store-addr { font-size: 12px; color: var(--muted); margin-bottom: 12px; }
  .cov-hours { display: flex; flex-direction: column; gap: 6px; }
  .cov-hours-row {
    display: flex; justify-content: space-between;
    font-size: 12px; color: var(--muted);
    padding: 4px 0;
    border-bottom: 1px solid rgba(255,248,231,0.05);
  }
  .cov-hours-row:last-child { border-bottom: none; }
  .cov-hours-row span:last-child { color: var(--text); font-weight: 700; }

  /* Order Button */
  .cov-order-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: var(--red); color: white; text-decoration: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 900; font-size: 14px;
    padding: 14px; border-radius: 14px;
    box-shadow: 0 6px 20px rgba(218,41,28,0.4);
    transition: all 0.2s; text-align: center;
  }
  .cov-order-btn:hover { background: var(--red2); transform: scale(1.02); }

  /* Map */
  .cov-map-wrap {
    flex: 1; position: relative; min-height: 0;
  }
  .cov-map {
    width: 100%; height: 100%;
    min-height: calc(100vh - 70px);
  }
  .cov-map .leaflet-tile-pane { filter: brightness(0.85) contrast(1.05); }

  .cov-map-badge {
    position: absolute; top: 14px; left: 14px; z-index: 800;
    display: flex; align-items: center; gap: 6px;
    background: rgba(26,14,0,0.9); backdrop-filter: blur(8px);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 8px 14px; font-size: 12px; font-weight: 700; color: var(--gold);
    pointer-events: none;
  }

  .cov-map-legend {
    position: absolute; bottom: 14px; right: 14px; z-index: 800;
    display: flex; align-items: center; gap: 10px;
    background: rgba(26,14,0,0.9); backdrop-filter: blur(8px);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 8px 14px; font-size: 11px; font-weight: 600; color: var(--muted);
    pointer-events: none;
  }
  .cov-legend-dot {
    width: 10px; height: 10px; border-radius: 50%; margin-right: 4px;
  }

  /* Markers */
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
    background: var(--red);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(218,41,28,0.6);
  }

  /* Popup */
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

  /* Zoom */
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

  /* Attribution */
  .leaflet-control-attribution {
    background: rgba(14,7,0,0.7) !important;
    color: rgba(255,248,231,0.3) !important;
    font-size: 9px !important;
  }
  .leaflet-control-attribution a { color: rgba(255,199,44,0.4) !important; }

  /* Responsive */
  @media (max-width: 768px) {
    .cov-body { flex-direction: column; overflow: visible; }
    .cov-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border); max-height: none; }
    .cov-map-wrap { min-height: 350px; }
    .cov-map { min-height: 350px; }
    .cov-header { padding: 12px 16px; }
    .cov-header-center { position: static; transform: none; }
    .cov-header-spacer { display: none; }
    .cov-back span { display: none; }
    .cov-title { font-size: 18px; }
    .cov-sub { display: none; }
    .cov-map-legend { display: none; }
  }
`;
