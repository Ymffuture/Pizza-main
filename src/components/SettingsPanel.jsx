// src/components/SettingsPanel.jsx
import { useEffect, useRef } from "react";
import { X, Palette, Moon, Fingerprint, ChevronRight, Shield, Settings, Lock } from "lucide-react";
import { THEMES, useTheme } from "../hooks/useTheme";
import { Link } from "react-router-dom";
import { useBilling } from '../context/BillingContext';

export default function SettingsPanel({ open, onClose }) {
  const { themeId, changeTheme } = useTheme();
  const panelRef = useRef(null);
  const { isProBite } = useBilling();

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <style>{css}</style>
      <div className="sp-backdrop" onClick={onClose} />
      <div className="sp-modal" ref={panelRef} role="dialog" aria-modal="true">

        {/* Header */}
        <div className="sp-header">
          <div className="sp-header-left">
            <div className="sp-header-icon">
              <Settings style={{ width: 16, height: 16, color: "var(--gold, #FFC72C)" }} />
            </div>
            <div>
              <h2 className="sp-title">Settings</h2>
              <p className="sp-subtitle">Personalise your experience</p>
            </div>
          </div>
          <button className="sp-close" onClick={onClose} aria-label="Close settings">
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div className="sp-body">

          {/* Theme Section */}
          <section className="sp-section">
            <SectionLabel icon={<Palette style={{ width: 12, height: 12 }} />} label="App Theme" />
            <div className="sp-theme-grid">
              {THEMES.map(theme => {
                const active = themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => changeTheme(theme.id)}
                    className={`sp-theme-card${active ? " sp-theme-active" : ""}`}
                    title={theme.name}
                  >
                    <div className="sp-swatch">
                      {theme.preview.map((c, i) => (
                        <div key={i} style={{ flex: 1, height: "100%", background: c, borderRadius: i === 0 ? "6px 0 0 6px" : i === 2 ? "0 6px 6px 0" : 0 }} />
                      ))}
                    </div>
                    <div className="sp-theme-label-row">
                      <span className="sp-theme-emoji">{theme.emoji}</span>
                      <span className={`sp-theme-name${active ? " sp-theme-name-active" : ""}`}>{theme.name}</span>
                    </div>
                    {active && <div className="sp-active-ring" />}
                    {active && <div className="sp-active-check">✓</div>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Security Section */}
          <section className="sp-section">
            <SectionLabel icon={<Shield style={{ width: 12, height: 12 }} />} label="Security" />
            <div className="sp-list">
              <Link to="/pkm" onClick={onClose} className="sp-list-item">
                <div className="sp-list-icon sp-list-icon-green">
                  <Fingerprint style={{ width: 15, height: 15, color: "#4ade80" }} />
                </div>
                <div className="sp-list-text">
                  <p className="sp-list-title">Passkeys & Fingerprints</p>
                  <p className="sp-list-sub">Manage biometric login</p>
                </div>
                <ChevronRight style={{ width: 14, height: 14, color: "var(--muted, rgba(255,248,231,0.42))", flexShrink: 0 }} />
              </Link>
            </div>
          </section>

          {/* Display Section */}
          <section className="sp-section">
            <SectionLabel icon={<Moon style={{ width: 12, height: 12 }} />} label="Display" />
            <div className="sp-list">
              <div className="sp-list-item" style={{ cursor: "default" }}>
                <div className="sp-list-icon sp-list-icon-blue">
                  <Moon style={{ width: 15, height: 15, color: "#60a5fa" }} />
                </div>
                <div className="sp-list-text">
                  <p className="sp-list-title">Dark Mode</p>
                  <p className="sp-list-sub">Always on — KotaBites is dark by design</p>
                </div>
                <div className="sp-toggle-on" />
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="sp-footer">
            <div className="sp-footer-dot" />
            <p>KotaBites v2.1.0</p>
            <span className="sp-footer-sep">·</span>
            <p>Built by SwiftMeta · JHB</p>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionLabel({ icon, label }) {
  return (
    <div className="sp-section-label">
      {icon}
      {label}
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');

  .sp-backdrop {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(8px);
    animation: spBdIn 0.2s ease;
  }
  @keyframes spBdIn { from{opacity:0} to{opacity:1} }

  .sp-modal {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    z-index: 501;
    width: min(520px, calc(100vw - 32px));
    max-height: min(88vh, 700px);
    background: var(--card, #1a0e00);
    border: 1px solid rgba(255,199,44,0.2);
    border-radius: 24px;
    box-shadow:
      0 40px 100px rgba(0,0,0,0.8),
      0 0 0 1px rgba(255,199,44,0.07),
      inset 0 1px 0 rgba(255,248,231,0.05);
    display: flex; flex-direction: column;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    overflow: hidden;
    animation: spModalIn 0.3s cubic-bezier(0.34,1.2,0.64,1);
  }
  @keyframes spModalIn {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.9) translateY(10px); }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1) translateY(0); }
  }

  .sp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 22px 16px;
    border-bottom: 1px solid rgba(255,199,44,0.1);
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba(255,199,44,0.07) 0%, transparent 60%);
  }
  .sp-header-left  { display:flex; align-items:center; gap:12px; }
  .sp-header-icon  {
    width:36px; height:36px; border-radius:10px;
    background:rgba(255,199,44,0.12); border:1px solid rgba(255,199,44,0.25);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    box-shadow: 0 0 12px rgba(255,199,44,0.15);
  }
  .sp-title    { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:2.5px; color:var(--text,#fff8e7); margin:0; line-height:1; }
  .sp-subtitle { font-size:11px; color:var(--muted,rgba(255,248,231,0.42)); margin:3px 0 0; }
  .sp-close {
    width:32px; height:32px; border-radius:9px;
    background:rgba(255,248,231,0.05); border:1px solid rgba(255,248,231,0.1);
    display:flex; align-items:center; justify-content:center;
    color:rgba(255,248,231,0.45); cursor:pointer; transition:all 0.18s;
  }
  .sp-close:hover { color:var(--text,#fff8e7); background:rgba(218,41,28,0.2); border-color:rgba(218,41,28,0.35); }

  .sp-body {
    flex:1; overflow-y:auto; padding:20px 22px;
    display:flex; flex-direction:column; gap:24px;
    scrollbar-width:thin; scrollbar-color:rgba(255,199,44,0.15) transparent;
  }
  .sp-body::-webkit-scrollbar { width:4px; }
  .sp-body::-webkit-scrollbar-thumb { background:rgba(255,199,44,0.15); border-radius:4px; }

  .sp-section { display:flex; flex-direction:column; gap:10px; }
  .sp-section-label {
    display:flex; align-items:center; gap:6px;
    font-size:10px; font-weight:800; letter-spacing:0.12em;
    text-transform:uppercase; color:var(--gold,#FFC72C);
  }

  /* Theme grid */
  .sp-theme-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .sp-theme-card {
    position:relative; background:rgba(255,248,231,0.03);
    border:1.5px solid rgba(255,248,231,0.08); border-radius:12px;
    padding:10px 8px; cursor:pointer;
    display:flex; flex-direction:column; gap:0;
    transition:all 0.2s;
  }
  .sp-theme-card:hover { background:rgba(255,199,44,0.06); border-color:rgba(255,199,44,0.22); transform:translateY(-1px); }
  .sp-theme-active { background:rgba(255,199,44,0.07)!important; border-color:transparent!important; }
  .sp-swatch { width:100%; height:28px; border-radius:7px; overflow:hidden; display:flex; border:1px solid rgba(255,255,255,0.08); }
  .sp-theme-label-row { display:flex; align-items:center; gap:5px; margin-top:8px; }
  .sp-theme-emoji { font-size:13px; }
  .sp-theme-name { font-size:11px; font-weight:600; color:var(--muted,rgba(255,248,231,0.42)); }
  .sp-theme-name-active { font-weight:800; color:var(--gold,#FFC72C); }
  .sp-active-ring {
    position:absolute; inset:-2px; border-radius:13px;
    border:2px solid var(--gold,#FFC72C); pointer-events:none;
    animation:spRingIn 0.2s ease;
  }
  @keyframes spRingIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  .sp-active-check {
    position:absolute; top:6px; right:7px;
    width:16px; height:16px; border-radius:50%;
    background:var(--gold,#FFC72C); color:#0e0700;
    font-size:9px; font-weight:900;
    display:flex; align-items:center; justify-content:center;
  }

  /* List */
  .sp-list { display:flex; flex-direction:column; gap:6px; }
  .sp-list-item {
    display:flex; align-items:center; gap:12px;
    padding:12px 14px;
    background:rgba(255,248,231,0.03); border:1px solid rgba(255,248,231,0.06);
    border-radius:13px; cursor:pointer; text-decoration:none; transition:all 0.2s;
  }
  .sp-list-item:hover { background:rgba(255,248,231,0.07); border-color:rgba(255,199,44,0.18); }
  .sp-list-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sp-list-icon-green { background:rgba(74,222,128,0.12); }
  .sp-list-icon-blue  { background:rgba(96,165,250,0.12); }
  .sp-list-text { flex:1; min-width:0; }
  .sp-list-title { font-size:13px; font-weight:700; color:var(--text,#fff8e7); margin:0; }
  .sp-list-sub   { font-size:11px; color:var(--muted,rgba(255,248,231,0.42)); margin:2px 0 0; }

  .sp-toggle-on {
    width:38px; height:22px; border-radius:11px;
    background:linear-gradient(135deg,var(--red,#DA291C),var(--gold,#FFC72C));
    flex-shrink:0; position:relative;
  }

  /* Footer */
  .sp-footer {
    display:flex; align-items:center; justify-content:center; gap:8px;
    padding-top:16px; border-top:1px solid rgba(255,248,231,0.06);
    font-size:11px; color:var(--muted,rgba(255,248,231,0.42));
  }
  .sp-footer-dot {
    width:5px; height:5px; border-radius:50%;
    background:var(--gold,#FFC72C); box-shadow:0 0 6px rgba(255,199,44,0.6);
    animation:spDotPulse 2s ease infinite;
  }
  @keyframes spDotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.5)} }
  .sp-footer-sep { opacity:0.3; }

  @media(max-width:520px) {
    .sp-modal { max-height:92vh; }
    .sp-theme-grid { grid-template-columns:repeat(2,1fr); }
  }
`;
