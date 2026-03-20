// ── CONFIG — update to your store coords ──
const STORE = {
  lat: -26.2041,
  lng: 28.0473,
  name: "KotaBites HQ",
  address: "123 Kota Street, Johannesburg",
};

const DELIVERY_ZONES = [
  { label: "Express Zone",  radius: 3000,  color: "#4ade80", time: "20–30 min", fee: "R15" },
  { label: "Standard Zone", radius: 6000,  color: "#FFC72C", time: "30–45 min", fee: "R25" },
  { label: "Extended Zone", radius: 10000, color: "#f87171", time: "45–60 min", fee: "R40" },
];

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
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markerRef   = useRef(null);
  const [address, setAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult]   = useState(null);

  useEffect(() => {
    if (mapInstance.current) return;

    import("leaflet").then((L) => {
      const map = L.map(mapRef.current, {
        center: [STORE.lat, STORE.lng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
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
          fillOpacity: 0.1,
          weight: 1.5,
          opacity: 0.6,
          dashArray: zone.label === "Extended Zone" ? "6 4" : null,
        }).addTo(map);
      });

      // Store marker
      const storeIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:40px;height:40px;border-radius:50%;
          background:#FFC72C;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 0 6px rgba(255,199,44,0.2),0 4px 16px rgba(255,199,44,0.5);
          animation:markerPulse 2s ease infinite;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e0700" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([STORE.lat, STORE.lng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`<b>${STORE.name}</b><br/>${STORE.address}`);

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

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

      const { lat, lon } = data[0];
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lon);
      const dist    = haversine(STORE.lat, STORE.lng, userLat, userLng);
      const zone    = DELIVERY_ZONES.find((z) => dist <= z.radius);

      setResult({ covered: !!zone, zone: zone || null, distance: Math.round(dist / 100) / 10 });

      import("leaflet").then((L) => {
        if (!mapInstance.current) return;
        const userIcon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#DA291C;border:3px solid white;box-shadow:0 2px 8px rgba(218,41,28,0.6);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        if (markerRef.current) {
          markerRef.current.setLatLng([userLat, userLng]);
        } else {
          markerRef.current = L.marker([userLat, userLng], { icon: userIcon }).addTo(mapInstance.current);
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
    <section style={{
      background: "linear-gradient(180deg,#0e0700 0%,#1a0e00 100%)",
      borderTop: "1px solid rgba(255,199,44,0.1)",
      fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes markerPulse {
          0%,100%{box-shadow:0 0 0 4px rgba(255,199,44,0.25),0 4px 16px rgba(255,199,44,0.4)}
          50%{box-shadow:0 0 0 8px rgba(255,199,44,0.1),0 4px 20px rgba(255,199,44,0.6)}
        }
        .cov-spin {
          width:14px;height:14px;border-radius:50%;
          border:2px solid rgba(255,255,255,0.3);
          border-top-color:white;
          animation:covSpin 0.7s linear infinite;
          display:inline-block;
        }
        @keyframes covSpin { to{transform:rotate(360deg)} }
        .cov-check-btn:hover:not(:disabled){background:#b91c1c}
        .cov-chip-btn{
          padding:6px 14px;border-radius:20px;
          background:rgba(255,199,44,0.07);
          border:1px solid rgba(255,199,44,0.2);
          color:rgba(255,248,231,0.7);font-size:12px;font-weight:700;
          cursor:pointer;transition:all 0.18s;
          font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;
        }
        .cov-chip-btn:hover{background:rgba(255,199,44,0.15);color:#fff8e7;border-color:rgba(255,199,44,0.4)}
        .leaflet-control-zoom a{
          background:rgba(26,14,0,0.9)!important;
          border-color:rgba(255,199,44,0.15)!important;
          color:#fff8e7!important;
        }
        .leaflet-control-zoom a:hover{background:rgba(255,199,44,0.1)!important;color:#FFC72C!important}
        .leaflet-control-attribution{
          background:rgba(14,7,0,0.7)!important;
          color:rgba(255,248,231,0.3)!important;font-size:9px!important;
        }
        .leaflet-control-attribution a{color:rgba(255,199,44,0.4)!important}
      `}</style>

      {/* Section heading */}
      <div style={{ textAlign:"center", padding:"52px 24px 36px" }}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"rgba(255,199,44,0.08)", border:"1px solid rgba(255,199,44,0.2)",
          borderRadius:20, padding:"5px 14px", marginBottom:16,
        }}>
          <Bike style={{ width:13, height:13, color:"#FFC72C" }} />
          <span style={{ fontSize:11, fontWeight:800, color:"#FFC72C", letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Delivery Coverage
          </span>
        </div>
        <h2 style={{
          fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(32px,5vw,48px)",
          letterSpacing:3, color:"#fff8e7", lineHeight:1, marginBottom:10,
        }}>
          Do We Deliver To You?
        </h2>
        <p style={{ fontSize:14, color:"rgba(255,248,231,0.5)", fontWeight:500, maxWidth:400, margin:"0 auto" }}>
          Enter your address below to check if you're in our delivery zone.
        </p>
      </div>

      {/* Body */}
      <div style={{
        display:"flex", gap:0, maxWidth:1100, margin:"0 auto",
        padding:"0 0 60px", flexWrap:"wrap",
      }}>

        {/* Left panel */}
        <div style={{ width:320, flexShrink:0, padding:"0 24px 0 24px", display:"flex", flexDirection:"column", gap:16 }}>

          {/* Address input card */}
          <div style={{
            background:"rgba(255,248,231,0.03)", border:"1px solid rgba(255,199,44,0.12)",
            borderRadius:18, padding:"18px 18px",
          }}>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,248,231,0.4)", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
              <MapPin style={{ width:12, height:12 }} /> Check your address
            </p>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <input
                style={{
                  flex:1, background:"rgba(255,248,231,0.05)",
                  border:"1.5px solid rgba(255,199,44,0.15)", borderRadius:10,
                  padding:"9px 12px", color:"#fff8e7",
                  fontSize:13, fontWeight:500,
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  outline:"none",
                }}
                placeholder="e.g. 14 Vilakazi St, Soweto"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              />
              <button
                className="cov-check-btn"
                onClick={handleCheck}
                disabled={checking || !address.trim()}
                style={{
                  padding:"9px 16px", background:"#DA291C", color:"white",
                  border:"none", borderRadius:10, cursor:"pointer",
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  fontWeight:800, fontSize:12, flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  minWidth:60, opacity: checking || !address.trim() ? 0.45 : 1,
                  transition:"all 0.18s",
                }}
              >
                {checking ? <span className="cov-spin" /> : "Check"}
              </button>
            </div>

            {/* Quick chips */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {["Soweto", "Sandton", "Midrand", "Roodepoort"].map((area) => (
                <button
                  key={area}
                  className="cov-chip-btn"
                  onClick={() => { setAddress(area + ", Johannesburg"); setResult(null); }}
                >
                  {area}
                </button>
              ))}
            </div>

            {/* Result */}
            {result && !result.error && (
              <div style={{
                display:"flex", alignItems:"flex-start", gap:10,
                marginTop:12, padding:"10px 12px", borderRadius:10,
                border:"1px solid",
                ...(result.covered
                  ? { background:"rgba(74,222,128,0.08)", borderColor:"rgba(74,222,128,0.25)", color:"#4ade80" }
                  : { background:"rgba(248,113,113,0.08)", borderColor:"rgba(248,113,113,0.25)", color:"#f87171" }),
              }}>
                {result.covered
                  ? <CheckCircle style={{ width:16, height:16, flexShrink:0, marginTop:1 }} />
                  : <XCircle    style={{ width:16, height:16, flexShrink:0, marginTop:1 }} />}
                <div>
                  <p style={{ fontSize:12, fontWeight:800, color:"#fff8e7", marginBottom:2 }}>
                    {result.covered ? "We deliver here! 🎉" : "Outside delivery area"}
                  </p>
                  <p style={{ fontSize:11, color:"rgba(255,248,231,0.5)" }}>
                    {result.covered
                      ? `${result.zone.label} · ${result.zone.time} · ${result.zone.fee}`
                      : `${result.distance} km away — outside our ${DELIVERY_ZONES[DELIVERY_ZONES.length-1].radius/1000} km range.`}
                  </p>
                </div>
              </div>
            )}

            {result?.error && (
              <div style={{
                display:"flex", alignItems:"center", gap:10,
                marginTop:12, padding:"10px 12px", borderRadius:10,
                background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)",
              }}>
                <XCircle style={{ width:16, height:16, color:"#f87171", flexShrink:0 }} />
                <p style={{ fontSize:11, color:"rgba(255,248,231,0.5)" }}>{result.error}</p>
              </div>
            )}
          </div>

          {/* Zones legend */}
          <div style={{
            background:"rgba(255,248,231,0.03)", border:"1px solid rgba(255,199,44,0.12)",
            borderRadius:18, padding:"18px 18px",
          }}>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,248,231,0.4)", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              <Bike style={{ width:12, height:12 }} /> Delivery zones
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {DELIVERY_ZONES.map((z) => (
                <div key={z.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{
                    width:10, height:10, borderRadius:"50%", flexShrink:0,
                    background:z.color, boxShadow:`0 0 8px ${z.color}`,
                  }} />
                  <div>
                    <p style={{ fontSize:12, fontWeight:800, color:"#fff8e7", lineHeight:1.3 }}>{z.label}</p>
                    <p style={{ fontSize:11, color:"rgba(255,248,231,0.45)" }}>
                      {z.radius/1000} km · {z.time} · {z.fee}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div style={{
          flex:1, minWidth:300, borderRadius:20, overflow:"hidden",
          border:"1px solid rgba(255,199,44,0.12)",
          margin:"0 24px", minHeight:420, position:"relative",
        }}>
          <div ref={mapRef} style={{ width:"100%", height:"100%", minHeight:420 }} />
          <div style={{
            position:"absolute", top:12, left:12, zIndex:800,
            display:"flex", alignItems:"center", gap:6,
            background:"rgba(26,14,0,0.85)", backdropFilter:"blur(8px)",
            border:"1px solid rgba(255,199,44,0.15)", borderRadius:10,
            padding:"6px 12px", fontSize:11, fontWeight:700, color:"#FFC72C",
            pointerEvents:"none",
          }}>
            <MapPin style={{ width:11, height:11 }} />
            <span>{STORE.name}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
