// src/components/FingerprintGate.jsx — FIXED VERSION
// Bug 1: was calling /auth/me (doesn't exist) → now reads email from AuthContext
// Bug 2: waited for button click → now auto-triggers on mount (bank-app UX)
// Bug 3: verification result cached in sessionStorage per pageKey

import { useState, useEffect, useCallback, useRef } from "react";
import { Fingerprint, Loader, ShieldCheck, ShieldX, KeyRound, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

function b64urlToBuffer(b64url) {
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)).buffer;
}
function bufferToB64url(buffer) {
  let binary = "";
  new Uint8Array(buffer).forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function prepareGetOptions(opts) {
  return {
    ...opts,
    challenge: b64urlToBuffer(opts.challenge),
    allowCredentials: (opts.allowCredentials || []).map((c) => ({ ...c, id: b64urlToBuffer(c.id) })),
  };
}
function serializeAssertion(cred) {
  const r = cred.response;
  return {
    id: cred.id, rawId: bufferToB64url(cred.rawId), type: cred.type,
    response: {
      clientDataJSON:    bufferToB64url(r.clientDataJSON),
      authenticatorData: bufferToB64url(r.authenticatorData),
      signature:         bufferToB64url(r.signature),
      ...(r.userHandle ? { userHandle: bufferToB64url(r.userHandle) } : {}),
    },
  };
}

const isVerified  = (k) => sessionStorage.getItem(`kb_fp_ok_${k}`) === "1";
const markVerified = (k) => sessionStorage.setItem(`kb_fp_ok_${k}`, "1");
const webAuthnOK   = typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;

export default function FingerprintGate({ children, pageKey = "protected" }) {
  const navigate       = useNavigate();
  const { user }       = useAuth();           // ← FIX: email from context
  const email          = user?.email || "";
  const autoFired      = useRef(false);
  const [gateStatus, setGateStatus] = useState("loading");   // loading|gate|verified|no_passkeys
  const [step,       setStep]       = useState("idle");       // idle|scanning|verifying|success|error|cancelled
  const [errMsg,     setErrMsg]     = useState("");

  // Decide whether gate is needed
  useEffect(() => {
    if (isVerified(pageKey))  { setGateStatus("verified");   return; }
    if (!webAuthnOK || !email){ setGateStatus("no_passkeys"); return; }
    axiosClient.get("/webauthn/credentials")
      .then(({ data }) => setGateStatus(Array.isArray(data) && data.length > 0 ? "gate" : "no_passkeys"))
      .catch(() => setGateStatus("no_passkeys"));
  }, [pageKey, email]);

  const triggerVerify = useCallback(async () => {
    if (!email) { setStep("error"); setErrMsg("Sign in again — email not found."); return; }
    setStep("scanning"); setErrMsg("");
    try {
      const { data: opts } = await axiosClient.post("/webauthn/auth/options", { email });
      setStep("verifying");
      const assertion = await navigator.credentials.get({ publicKey: prepareGetOptions(opts) });
      if (!assertion) throw new Error("No credential returned");
      await axiosClient.post("/webauthn/auth/verify", { email, credential: serializeAssertion(assertion) });
      setStep("success");
      markVerified(pageKey);
      setTimeout(() => setGateStatus("verified"), 700);
    } catch (err) {
      if (err?.name === "NotAllowedError") { setStep("cancelled"); setErrMsg("Scan cancelled — tap to retry."); }
      else { setStep("error"); setErrMsg(err?.response?.data?.detail || err?.message || "Verification failed."); }
    }
  }, [email, pageKey]);

  // ← FIX: Auto-prompt on mount (bank-app behaviour)
  useEffect(() => {
    if (gateStatus === "gate" && !autoFired.current) {
      autoFired.current = true;
      setTimeout(triggerVerify, 350); // small delay so UI renders first
    }
  }, [gateStatus, triggerVerify]);

  if (gateStatus === "loading") return <div style={ss}><Loader style={{width:28,height:28,color:"var(--gold,#FFC72C)",animation:"fpgSpin .8s linear infinite"}}/><style>{css}</style></div>;
  if (gateStatus !== "gate")   return <>{children}</>;

  const ok  = step === "success";
  const bad = step === "error" || step === "cancelled";
  const busy= step === "scanning" || step === "verifying";
  const ic  = ok ? "#4ade80" : bad ? "#f87171" : "var(--gold,#FFC72C)";

  return (
    <div style={ss}>
      <style>{css}</style>
      <div style={card}>
        <button onClick={() => navigate(-1)} style={backBtn}><ArrowLeft style={{width:13,height:13}}/><span>Back</span></button>

        <div style={{position:"relative",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center",marginTop:8}}>
          <div className={busy ? "fpg-spin-ring" : "fpg-pulse-ring"} style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${ic}`,opacity:.35}}/>
          <div style={{width:80,height:80,borderRadius:"50%",background:`${ic}15`,border:`1px solid ${ic}30`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}>
            {ok   ? <ShieldCheck  style={{width:40,height:40,color:ic}}/> :
             bad  ? <ShieldX      style={{width:40,height:40,color:ic}}/> :
             busy ? <Loader       style={{width:40,height:40,color:ic,animation:"fpgSpin .8s linear infinite"}}/> :
                    <Fingerprint  style={{width:40,height:40,color:ic}}/>}
          </div>
        </div>

        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:"2px",color:"var(--text,#fff8e7)",margin:0,lineHeight:1}}>
          {ok   ? "Verified ✓" : busy ? (step==="scanning" ? "Ready…" : "Checking…") :
           bad  ? "Couldn't Verify" : "Confirm It's You"}
        </h2>

        <p style={{fontSize:13,color:"var(--muted,rgba(255,248,231,.42))",lineHeight:1.6,maxWidth:270,margin:0,minHeight:40}}>
          {ok    ? "Identity confirmed. Opening your wallet."
           : busy ? "Touch your fingerprint sensor or use your passkey."
           : bad  ? errMsg
           : "Your wallet requires fingerprint verification each session."}
        </p>

        {busy && <div style={{display:"flex",gap:8}}>{[0,1,2].map(i=><div key={i} className="fpg-dot" style={{animationDelay:`${i*.2}s`}}/>)}</div>}

        {(step==="idle"||bad) && (
          <div style={{width:"100%",display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={triggerVerify} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%",padding:"14px 20px",background:"var(--red,#DA291C)",border:"none",borderRadius:14,color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:900,fontSize:15,cursor:"pointer",boxShadow:"0 6px 20px rgba(218,41,28,.4)"}}>
              <Fingerprint style={{width:18,height:18}}/>
              {bad ? "Try Again" : "Verify Fingerprint"}
            </button>
            <button onClick={()=>navigate(-1)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"rgba(255,248,231,.04)",border:"1px solid rgba(255,248,231,.08)",borderRadius:12,color:"rgba(255,248,231,.4)",fontSize:12,fontWeight:700,padding:10,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              <KeyRound style={{width:13,height:13}}/> Cancel
            </button>
          </div>
        )}

        {ok && (
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.25)",borderRadius:10,color:"#4ade80",fontSize:12,fontWeight:700,width:"100%",justifyContent:"center"}}>
            <ShieldCheck style={{width:14,height:14}}/> Opening wallet…
          </div>
        )}

        {step==="idle" && <p style={{fontSize:11,color:"rgba(255,248,231,.2)",margin:"4px 0 0"}}>🔒 Your fingerprint never leaves this device</p>}
      </div>
    </div>
  );
}

const ss = {minHeight:"100vh",background:"radial-gradient(ellipse 80% 50% at 50% 0%,rgba(255,199,44,.07) 0%,transparent 65%),var(--dark,#0e0700)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"};
const card = {width:"100%",maxWidth:360,background:"var(--card,#1a0e00)",border:"1px solid var(--border,rgba(255,199,44,.12))",borderRadius:24,padding:"44px 28px 32px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:16,boxShadow:"0 24px 64px rgba(0,0,0,.5)",position:"relative"};
const backBtn = {position:"absolute",top:14,left:14,display:"flex",alignItems:"center",gap:5,background:"rgba(255,248,231,.05)",border:"1px solid rgba(255,248,231,.08)",borderRadius:8,padding:"5px 10px",color:"rgba(255,248,231,.4)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  @keyframes fpgSpin      { to { transform: rotate(360deg); } }
  @keyframes fpgPulseRing { 0%,100%{transform:scale(1);opacity:.35} 50%{transform:scale(1.15);opacity:.65} }
  @keyframes fpgSpinRing  { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes fpgDot       { 0%,80%,100%{transform:scale(.5);opacity:.3} 40%{transform:scale(1);opacity:1} }
  .fpg-pulse-ring { animation: fpgPulseRing 1.8s ease-in-out infinite; }
  .fpg-spin-ring  { animation: fpgSpinRing  1.0s linear infinite; }
  .fpg-dot        { width:8px;height:8px;border-radius:50%;background:var(--gold,#FFC72C);animation:fpgDot 1.4s ease-in-out infinite; }
`;
