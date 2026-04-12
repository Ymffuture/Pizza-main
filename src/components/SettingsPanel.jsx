// src/components/SettingsPanel.jsx
/**
 * Slide-in settings panel with theme selector.
 * Drop inside any layout — triggered by a button.
 *
 * Usage:
 *   import SettingsPanel from "../components/SettingsPanel";
 *   <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
 */

import { useEffect, useRef } from "react";
import { X, Palette, Moon, Fingerprint, ChevronRight, Bell, Shield } from "lucide-react";
import { THEMES, useTheme } from "../hooks/useTheme";
import { Link } from "react-router-dom";

export default function SettingsPanel({ open, onClose }) {
  const { themeId, changeTheme } = useTheme();
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            animation: "spFadeIn 0.2s ease",
          }}
        />
      )}

      {/* Drawer */}
      <div
        ref={panelRef}
        style={{
          position:   "fixed",
          top:        0,
          right:      0,
          bottom:     0,
          zIndex:     201,
          width:      "min(320px, 100vw)",
          background: "var(--card, #1a0e00)",
          borderLeft: "1px solid var(--border, rgba(255,199,44,0.12))",
          display:    "flex",
          flexDirection: "column",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          transform:  open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow:  open ? "-24px 0 64px rgba(0,0,0,0.5)" : "none",
          overflowY:  "auto",
        }}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={iconWrapStyle}>
              <Palette style={{ width: 16, height: 16, color: "var(--gold, #FFC72C)" }} />
            </div>
            <div>
              <h2 style={titleStyle}>Settings</h2>
              <p style={subtitleStyle}>Personalise your experience</p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── Theme Section ── */}
          <section>
            <SectionLabel icon={<Palette style={{ width: 12, height: 12 }} />} label="App Theme" />
            <div style={themeGridStyle}>
              {THEMES.map(theme => {
                const active = themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => changeTheme(theme.id)}
                    style={themeCardStyle(active, theme)}
                    title={theme.name}
                  >
                    {/* Color swatch */}
                    <div style={swatchContainerStyle}>
                      {theme.preview.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            flex:        1,
                            height:      "100%",
                            background:  c,
                            borderRadius: i === 0 ? "6px 0 0 6px" : i === 2 ? "0 6px 6px 0" : 0,
                          }}
                        />
                      ))}
                    </div>

                    {/* Label */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
                      <span style={{ fontSize: 14 }}>{theme.emoji}</span>
                      <span style={{
                        fontSize:   11,
                        fontWeight: active ? 800 : 600,
                        color:      active ? "var(--gold, #FFC72C)" : "var(--muted, rgba(255,248,231,0.42))",
                      }}>
                        {theme.name}
                      </span>
                    </div>

                    {/* Active ring */}
                    {active && (
                      <div style={{
                        position:     "absolute",
                        inset:        -2,
                        borderRadius: 12,
                        border:       "2px solid var(--gold, #FFC72C)",
                        pointerEvents:"none",
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Security Section ── */}
          <section>
            <SectionLabel icon={<Shield style={{ width: 12, height: 12 }} />} label="Security" />
            <div style={listStyle}>
              <Link
                to="/wallet"
                onClick={onClose}
                style={listItemStyle}
              >
                <div style={{ ...listIconStyle, background: "rgba(74,222,128,0.12)" }}>
                  <Fingerprint style={{ width: 15, height: 15, color: "#4ade80" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={listItemTitleStyle}>Passkeys & Fingerprints</p>
                  <p style={listItemSubStyle}>Manage biometric login</p>
                </div>
                <ChevronRight style={{ width: 14, height: 14, color: "var(--muted, rgba(255,248,231,0.42))", flexShrink: 0 }} />
              </Link>
            </div>
          </section>

          {/* ── Display Section ── */}
          <section>
            <SectionLabel icon={<Moon style={{ width: 12, height: 12 }} />} label="Display" />
            <div style={listStyle}>
              <div style={{ ...listItemStyle, cursor: "default" }}>
                <div style={{ ...listIconStyle, background: "rgba(96,165,250,0.12)" }}>
                  <Moon style={{ width: 15, height: 15, color: "#60a5fa" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={listItemTitleStyle}>Dark Mode</p>
                  <p style={listItemSubStyle}>Always on — KotaBites is dark by design</p>
                </div>
                <div style={toggleOnStyle} />
              </div>
            </div>
          </section>

          {/* ── App Info ── */}
          <div style={appInfoStyle}>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>KotaBites v2.1.0</p>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>
              Built by SwiftMeta · Johannesburg, SA
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ icon, label }) {
  return (
    <div style={{
      display:       "flex",
      alignItems:    "center",
      gap:           6,
      marginBottom:  10,
      fontSize:      10,
      fontWeight:    800,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color:         "var(--gold, #FFC72C)",
    }}>
      {icon}
      {label}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const headerStyle = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  padding:        "20px 16px 16px",
  borderBottom:   "1px solid var(--border, rgba(255,199,44,0.12))",
  flexShrink:     0,
};

const iconWrapStyle = {
  width:          34,
  height:         34,
  borderRadius:   10,
  background:     "rgba(255,199,44,0.1)",
  border:         "1px solid rgba(255,199,44,0.2)",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  flexShrink:     0,
};

const titleStyle = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize:   18,
  letterSpacing: "2px",
  color:      "var(--text, #fff8e7)",
  margin:     0,
  lineHeight: 1,
};

const subtitleStyle = {
  fontSize:   11,
  color:      "var(--muted, rgba(255,248,231,0.42))",
  margin:     "2px 0 0",
};

const closeBtnStyle = {
  width:          30,
  height:         30,
  borderRadius:   8,
  background:     "rgba(255,248,231,0.06)",
  border:         "1px solid rgba(255,248,231,0.1)",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  color:          "var(--muted, rgba(255,248,231,0.42))",
  cursor:         "pointer",
  flexShrink:     0,
  transition:     "all 0.2s",
};

const themeGridStyle = {
  display:               "grid",
  gridTemplateColumns:   "repeat(3, 1fr)",
  gap:                   10,
};

const themeCardStyle = (active, theme) => ({
  position:     "relative",
  background:   active ? "rgba(255,199,44,0.06)" : "rgba(255,248,231,0.03)",
  border:       `1px solid ${active ? "transparent" : "rgba(255,248,231,0.08)"}`,
  borderRadius: 10,
  padding:      "10px 8px",
  cursor:       "pointer",
  display:      "flex",
  flexDirection:"column",
  alignItems:   "flex-start",
  gap:          0,
  transition:   "all 0.2s",
});

const swatchContainerStyle = {
  width:        "100%",
  height:       28,
  borderRadius: 6,
  overflow:     "hidden",
  display:      "flex",
  border:       "1px solid rgba(255,255,255,0.08)",
};

const listStyle = {
  display:       "flex",
  flexDirection: "column",
  gap:           6,
};

const listItemStyle = {
  display:       "flex",
  alignItems:    "center",
  gap:           12,
  padding:       "11px 12px",
  background:    "rgba(255,248,231,0.03)",
  border:        "1px solid rgba(255,248,231,0.06)",
  borderRadius:  12,
  cursor:        "pointer",
  textDecoration:"none",
  transition:    "all 0.2s",
};

const listIconStyle = {
  width:          32,
  height:         32,
  borderRadius:   9,
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  flexShrink:     0,
};

const listItemTitleStyle = {
  fontSize:   13,
  fontWeight: 700,
  color:      "var(--text, #fff8e7)",
  margin:     0,
};

const listItemSubStyle = {
  fontSize:   11,
  color:      "var(--muted, rgba(255,248,231,0.42))",
  margin:     "2px 0 0",
};

const toggleOnStyle = {
  width:        38,
  height:       22,
  borderRadius: 11,
  background:   "linear-gradient(135deg, var(--red, #DA291C), var(--gold, #FFC72C))",
  border:       "none",
  position:     "relative",
  flexShrink:   0,
};

const appInfoStyle = {
  marginTop:     "auto",
  paddingTop:    16,
  borderTop:     "1px solid rgba(255,248,231,0.06)",
  textAlign:     "center",
};
