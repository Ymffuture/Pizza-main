import { useEffect, useRef, useState } from "react";
import { MapPin, CheckCircle, XCircle, Bike, Navigation, Clock, ArrowRight, LocateFixed } from "lucide-react";

const STORE = {
  lat:-26.430171,
  lng: 27.872867,
  name: "KotaBites HQ",
  address: "Tjovitjo phase 2, Johannesburg",
};

const MAX_RADIUS = 1300; // 1.3km strict limit

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

export default function CoverageSection() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (mapInstance.current) return;

    import("leaflet").then((L) => {
      const map = L.map(mapRef.current, {
        center: [STORE.lat, STORE.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      L.control
        .attribution({ position: "bottomright", prefix: false })
        .addAttribution('© <a href="https://carto.com">CARTO</a>')
        .addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Single delivery zone - 1.3km
      L.circle([STORE.lat, STORE.lng], {
        radius: MAX_RADIUS,
        color: "#4ade80",
        fillColor: "#4ade80",
        fillOpacity: 0.08,
        weight: 2,
        opacity: 0.8,
      }).addTo(map);

      // Store marker
      const storeIcon = L.divIcon({
        className: "",
        html: `<div class="store-marker">
          <div class="store-marker-inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0e0700" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      L.marker([STORE.lat, STORE.lng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:'Plus Jakarta Sans',sans-serif;padding:8px;">
            <b style="color:#0e0700;font-size:14px;">${STORE.name}</b><br/>
            <span style="color:#666;font-size:12px;">${STORE.address}</span>
          </div>`
        );

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const checkLocation = (lat, lng, source = "manual") => {
    const dist = haversine(STORE.lat, STORE.lng, lat, lng);
    const covered = dist <= MAX_RADIUS;
    
    setResult({
      covered,
      distance: Math.round(dist / 100) / 10,
      source,
    });

    import("leaflet").then((L) => {
      if (!mapInstance.current) return;
      const userIcon = L.divIcon({
        className: "",
        html: `<div class="user-marker ${covered ? 'user-marker--in' : 'user-marker--out'}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(mapInstance.current);
      }
      mapInstance.current.flyTo([lat, lng], 15, { duration: 1.2, easeLinearity: 0.25 });
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setResult({ error: "Geolocation is not supported by your browser." });
      return;
    }
    
    setLocating(true);
    setResult(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        checkLocation(latitude, longitude, "gps");
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setResult({ error: "Unable to retrieve your location. Please check your permissions." });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheck = async () => {
    if (!address.trim()) return;
    setChecking(true);
    setResult(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await res.json();

      if (!data.length) {
        setResult({ error: "Address not found. Try a more specific address." });
        setChecking(false);
        return;
      }

      const { lat, lon } = data[0];
      checkLocation(parseFloat(lat), parseFloat(lon), "search");
    } catch {
      setResult({ error: "Could not check coverage. Please try again." });
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="coverage-section">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bebas+Neue&display=swap');
        
        .coverage-section {
          background: linear-gradient(180deg, #0a0500 0%, #1a0f00 50%, #0e0700 100%);
          border-top: 1px solid rgba(255, 199, 44, 0.08);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
        }
        
        .coverage-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 300px;
          background: radial-gradient(ellipse at center, rgba(74, 222, 128, 0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        
        .store-marker {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFC72C 0%, #ffb700 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 4px rgba(255, 199, 44, 0.2), 0 8px 32px rgba(255, 199, 44, 0.4);
          animation: markerFloat 3s ease-in-out infinite;
          position: relative;
        }
        
        .store-marker::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent, rgba(255, 199, 44, 0.3), transparent);
          animation: markerRotate 4s linear infinite;
        }
        
        .store-marker-inner {
          position: relative;
          z-index: 1;
        }
        
        @keyframes markerFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        @keyframes markerRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .user-marker {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }
        
        .user-marker--in {
          background: #4ade80;
          box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4), 0 4px 12px rgba(74, 222, 128, 0.5);
          animation: pulseIn 2s ease infinite;
        }
        
        .user-marker--out {
          background: #f87171;
          box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.4), 0 4px 12px rgba(248, 113, 113, 0.5);
          animation: pulseOut 2s ease infinite;
        }
        
        @keyframes pulseIn {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4), 0 4px 12px rgba(74, 222, 128, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0), 0 4px 12px rgba(74, 222, 128, 0.5); }
        }
        
        @keyframes pulseOut {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.4), 0 4px 12px rgba(248, 113, 113, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(248, 113, 113, 0), 0 4px 12px rgba(248, 113, 113, 0.5); }
        }
        
        .cov-spin {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: white;
          animation: covSpin 0.8s linear infinite;
          display: inline-block;
        }
        
        @keyframes covSpin { 
          to { transform: rotate(360deg); } 
        }
        
        .locate-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid rgba(74, 222, 128, 0.3);
          color: #4ade80;
          transition: all 0.3s ease;
        }
        
        .locate-btn:hover:not(:disabled) {
          background: rgba(74, 222, 128, 0.1);
          border-color: rgba(74, 222, 128, 0.5);
          transform: translateY(-1px);
        }
        
        .check-btn {
          background: linear-gradient(135deg, #DA291C 0%, #b91c1c 100%);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .check-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .check-btn:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .check-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(218, 41, 28, 0.4);
        }
        
        .zone-card {
          background: rgba(255, 248, 231, 0.02);
          border: 1px solid rgba(255, 199, 44, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        
        .zone-card:hover {
          background: rgba(255, 248, 231, 0.04);
          border-color: rgba(255, 199, 44, 0.2);
        }
        
        .chip-btn {
          background: rgba(255, 199, 44, 0.05);
          border: 1px solid rgba(255, 199, 44, 0.15);
          color: rgba(255, 248, 231, 0.6);
          transition: all 0.2s ease;
        }
        
        .chip-btn:hover {
          background: rgba(255, 199, 44, 0.12);
          color: #fff8e7;
          border-color: rgba(255, 199, 44, 0.3);
          transform: translateY(-1px);
        }
        
        .result-success {
          background: linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(74, 222, 128, 0.02) 100%);
          border: 1px solid rgba(74, 222, 128, 0.3);
          animation: resultSlideIn 0.4s ease;
        }
        
        .result-error {
          background: linear-gradient(135deg, rgba(248, 113, 113, 0.1) 0%, rgba(248, 113, 113, 0.02) 100%);
          border: 1px solid rgba(248, 113, 113, 0.3);
          animation: resultSlideIn 0.4s ease;
        }
        
        @keyframes resultSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .input-field {
          background: rgba(255, 248, 231, 0.03);
          border: 1.5px solid rgba(255, 199, 44, 0.12);
          transition: all 0.3s ease;
        }
        
        .input-field:focus {
          background: rgba(255, 248, 231, 0.06);
          border-color: rgba(255, 199, 44, 0.3);
          box-shadow: 0 0 0 3px rgba(255, 199, 44, 0.1);
        }
        
        .map-container {
          position: relative;
          overflow: hidden;
        }
        
        .map-container::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.3);
          pointer-events: none;
          z-index: 10;
        }
        
        .radius-badge {
          background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05));
          border: 1px solid rgba(74, 222, 128, 0.2);
        }
        
        .leaflet-control-zoom a {
          background: rgba(26, 14, 0, 0.9) !important;
          border-color: rgba(255, 199, 44, 0.15) !important;
          color: #fff8e7 !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: rgba(255, 199, 44, 0.15) !important;
          color: #FFC72C !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "64px 24px 40px", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(74, 222, 128, 0.08)",
            border: "1px solid rgba(74, 222, 128, 0.15)",
            borderRadius: 50,
            padding: "8px 18px",
            marginBottom: 20,
          }}
        >
          <Bike style={{ width: 14, height: 14, color: "#4ade80" }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#4ade80",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Local Delivery Only
          </span>
        </div>
        
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(36px, 6vw, 56px)",
            letterSpacing: 4,
            color: "#fff8e7",
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          Are You Nearby?
        </h2>
        
        <p
          style={{
            fontSize: 15,
            color: "rgba(255, 248, 231, 0.45)",
            fontWeight: 500,
            maxWidth: 420,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          We only deliver within 1.3km of our kitchen to ensure your food arrives hot and fresh.
        </p>
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          gap: 32,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px 80px",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            width: 360,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Quick Location Button */}
          <button
            onClick={handleGetLocation}
            disabled={locating}
            className="locate-btn"
            style={{
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {locating ? (
              <span className="cov-spin" />
            ) : (
              <LocateFixed style={{ width: 18, height: 18 }} />
            )}
            <span>{locating ? "Finding you..." : "Use my current location"}</span>
          </button>

          {/* Or divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.3 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,199,44,0.2)" }} />
            <span style={{ fontSize: 11, color: "#FFC72C", fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,199,44,0.2)" }} />
          </div>

          {/* Address Check Card */}
          <div
            className="zone-card"
            style={{
              borderRadius: 24,
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(255, 199, 44, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Navigation style={{ width: 16, height: 16, color: "#FFC72C" }} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255, 248, 231, 0.5)",
                }}
              >
                Enter address manually
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input
                className="input-field"
                style={{
                  flex: 1,
                  borderRadius: 12,
                  padding: "12px 16px",
                  color: "#fff8e7",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: "none",
                }}
                placeholder="e.g. 14 Vilakazi St, Soweto"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setResult(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              />
              <button
                className="check-btn"
                onClick={handleCheck}
                disabled={checking || !address.trim()}
                style={{
                  padding: "12px 20px",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: checking || !address.trim() ? 0.5 : 1,
                }}
              >
                {checking ? (
                  <span className="cov-spin" />
                ) : (
                  <>
                    Check
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </>
                )}
              </button>
            </div>

            {/* Quick Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Soweto", "Sandton", "Midrand", "Roodepoort"].map((area) => (
                <button
                  key={area}
                  className="chip-btn"
                  onClick={() => {
                    setAddress(area + ", Johannesburg");
                    setResult(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {area}
                </button>
              ))}
            </div>

            {/* Results */}
            {result && !result.error && (
              <div
                className={result.covered ? "result-success" : "result-error"}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "16px",
                  borderRadius: 14,
                  marginTop: 16,
                }}
              >
                {result.covered ? (
                  <CheckCircle style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2, color: "#4ade80" }} />
                ) : (
                  <XCircle style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2, color: "#f87171" }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff8e7", marginBottom: 4 }}>
                    {result.covered ? "Yes, we deliver to you! 🎉" : "Sorry, you're too far"}
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255, 248, 231, 0.5)", lineHeight: 1.5 }}>
                    {result.covered
                      ? `You're ${result.distance} km away — within our ${MAX_RADIUS/1000}km range.`
                      : `You're ${result.distance} km away. We only deliver within ${MAX_RADIUS/1000}km.`}
                  </p>
                  {result.source === "gps" && (
                    <p style={{ fontSize: 11, color: "#4ade80", marginTop: 6, fontWeight: 600 }}>
                      📍 Using your current location
                    </p>
                  )}
                </div>
              </div>
            )}

            {result?.error && (
              <div
                className="result-error"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 14,
                  marginTop: 16,
                }}
              >
                <XCircle style={{ width: 18, height: 18, color: "#f87171", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "rgba(255, 248, 231, 0.6)" }}>{result.error}</p>
              </div>
            )}
          </div>

          {/* Simple Info Card */}
          <div
            className="zone-card radius-badge"
            style={{
              borderRadius: 20,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ fontSize: 11, color: "rgba(255, 248, 231, 0.4)", marginBottom: 4 }}>
                Delivery Radius
              </p>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#4ade80" }}>
                1.3 <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255, 248, 231, 0.5)" }}>km</span>
              </p>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(74, 222, 128, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock style={{ width: 24, height: 24, color: "#4ade80" }} />
            </div>
          </div>

          {/* Why local */}
          <div
            style={{
              borderRadius: 16,
              padding: "20px",
              background: "rgba(255, 199, 44, 0.03)",
              border: "1px solid rgba(255, 199, 44, 0.08)",
            }}
          >
            <p style={{ fontSize: 12, color: "rgba(255, 248, 231, 0.6)", lineHeight: 1.6 }}>
              <strong style={{ color: "#FFC72C" }}>Why so close?</strong> We keep our delivery radius small to guarantee your kota arrives hot, fresh, and within 20-30 minutes.
            </p>
          </div>
        </div>

        {/* Map */}
        <div
          className="map-container"
          style={{
            flex: 1,
            minWidth: 320,
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(74, 222, 128, 0.15)",
            minHeight: 500,
            position: "relative",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: 500 }} />
          
          {/* Map Overlay */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 800,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(14, 7, 0, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(74, 222, 128, 0.2)",
              borderRadius: 12,
              padding: "10px 16px",
              fontSize: 12,
              fontWeight: 700,
              color: "#4ade80",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 8px #4ade80",
              }}
            />
            <span>{STORE.name}</span>
          </div>

          {/* Distance Badge */}
          {result?.distance && (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                right: 16,
                zIndex: 800,
                background: "rgba(14, 7, 0, 0.9)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${result.covered ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)"}`,
                borderRadius: 12,
                padding: "10px 16px",
                fontSize: 12,
                fontWeight: 700,
                color: result.covered ? "#4ade80" : "#f87171",
              }}
            >
              {result.distance} km away
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
