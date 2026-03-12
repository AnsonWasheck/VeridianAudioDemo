// SoapScreen.jsx
// California AB 3030: AI-generated clinical notes require mandatory clinician
// review and attestation before finalization or EHR transmission.
//
// PWA FIX SUMMARY (iOS Standalone mode):
// 1. Replaced every <div onClick> with <button> — iOS only fires click reliably on native interactive elements.
// 2. Removed global * { -webkit-tap-highlight-color } from injected CSS — scoped to .ss-root only.
// 3. Every button has: cursor:pointer, touch-action:manipulation, min-height:44px (Apple HIG tap target).
// 4. All decorative/overlay divs have pointer-events:none so they never steal taps.
// 5. CSS class tap-btn removed — active state feedback via :active scoped to .ss-root button:active.
// 6. CSS injected via IIFE at module load (not inside a React component) so it's stable across renders.

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { DARK, LIGHT } from "./App";

// ── orientation ───────────────────────────────────────────────────────────────
export function useOrientation() {
  const detect = useCallback(() => {
    if (window.screen?.orientation?.type) return window.screen.orientation.type.startsWith("portrait");
    if (typeof window.orientation === "number") return window.orientation === 0 || window.orientation === 180;
    return window.innerHeight >= window.innerWidth;
  }, []);
  const [portrait, setPortrait] = useState(detect);
  useEffect(() => {
    const update = () => setPortrait(detect());
    window.screen?.orientation?.addEventListener("change", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);
    return () => {
      window.screen?.orientation?.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, [detect]);
  return portrait;
}

// ── constants ─────────────────────────────────────────────────────────────────
const IPAD_P_W = 834;
const IPAD_P_H = 1194;
const IPAD_L_W = 1194;
const IPAD_L_H = 834;

const FULL_SOAP = {
  subjective: `Patient Eleanor Voss, 56-year-old female, presents for hypertension follow-up. Chief complaint: routine blood pressure monitoring and medication review. Patient reports compliance with prescribed antihypertensive regimen (Lisinopril 10mg QD, Amlodipine 5mg QD). Denies headache, visual changes, chest pain, shortness of breath, or palpitations. Reports occasional mild ankle swelling, worse in evenings. Denies dizziness with position changes. Sleep adequate at 6–7 hours/night. Diet mostly low sodium with weekend lapses. Exercise: 20-minute walks 3–4x/week. Non-smoker, occasional alcohol (1–2 drinks/week). No OTC medications beyond multivitamin. Family history: father with HTN and MI at age 68.`,
  objective:  `Vitals: BP 124/82 mmHg (left arm, seated, confirmed on repeat). HR 71 bpm regular. SpO2 98% RA. Temp 36.8°C. RR 16/min. Weight 68.2 kg. BMI 24.1 kg/m2.\n\nPhysical Exam — General: Alert, oriented, no acute distress. HEENT: No papilledema, no JVD. CV: RRR, no murmurs, rubs, or gallops. Peripheral pulses 2+ bilaterally. Resp: CTA bilaterally. Abd: Soft, NT/ND, no renal bruits. Ext: Mild bilateral pitting edema 1+ at ankles, no calf tenderness. Neuro: No focal deficits.\n\nLabs (6 weeks prior): BMP WNL. Cr 0.9 mg/dL. eGFR >60. K+ 4.1. FBG 94. LDL 108, HDL 54, TG 142.`,
  assessment: `1. Essential hypertension (I10) — Controlled. BP at ACC/AHA target <130/80. Good medication adherence.\n\n2. Bilateral lower extremity edema (R60.0) — Likely Amlodipine-related. Mild, clinically stable. No signs of cardiac decompensation or DVT.\n\n3. Hyperlipidemia (E78.5) — LDL mildly above optimal. Not currently on statin. Risk-benefit discussion held.\n\n4. Health maintenance — Mammogram and colonoscopy screening reviewed. Age-appropriate preventive care discussed.`,
  plan:       `1. Hypertension — Continue Lisinopril 10mg QD and Amlodipine 5mg QD. Reinforce DASH diet (<2g sodium/day). Continue home BP log; contact office if systolic >160. Repeat BMP in 3 months.\n\n2. Ankle edema — Compression stockings 20–30 mmHg. Return if edema worsens or cardiopulmonary symptoms develop.\n\n3. Hyperlipidemia — Initiate Atorvastatin 20mg QD. Repeat lipid panel in 6–8 weeks. Target LDL <100 mg/dL.\n\n4. Health maintenance — Mammogram referral placed. GI referral for overdue colonoscopy. Flu vaccine administered today. Advance directive discussion initiated.\n\n5. Follow-up in 3 months or sooner as needed.`,
};

const KEYS   = ["subjective", "objective", "assessment", "plan"];
const LABELS = { subjective:"Subjective", objective:"Objective", assessment:"Assessment", plan:"Plan" };

const CHECKS = [
  { id:"phi",       label:"PHI scan",          ref:"HIPAA 164.514",   ms:700,  result:"warn", note:"Name, MRN, DOB present. Confirm minimum-necessary before external transmission." },
  { id:"disclose",  label:"AI disclosure",      ref:"CA AB 3030",      ms:500,  result:"pass", note:"Disclosure statement queued for EHR submission." },
  { id:"coherence", label:"Clinical coherence", ref:"Internal QA",     ms:1000, result:"pass", note:"ICD-10 codes verified. Plan aligns with diagnoses." },
  { id:"meds",      label:"Medication safety",  ref:"FDA interaction", ms:800,  result:"warn", note:"Atorvastatin added. No critical interactions. Monitor for myopathy." },
  { id:"attest",    label:"Manual attestation", ref:"CA AB 3030 1(b)", ms:0,   result:"req",  note:"Clinician sign-off required before finalization." },
];

function tokenize(t) { return t.match(/[\w'']+|[^\w\s]|\s+/g) || []; }

// ── CSS injected once at module load ──────────────────────────────────────────
// PWA FIX: Injected via IIFE at module scope (not inside a React component)
// so the style tag is stable and never re-injected during renders.
// ALL rules are scoped to .ss-root to prevent leaking into App.jsx.
(function injectSoapCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("soap-screen-styles")) return;
  const s = document.createElement("style");
  s.id = "soap-screen-styles";
  s.textContent = `
    @keyframes ss-spin        { to { transform: rotate(360deg); } }
    @keyframes ss-blink       { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes ss-pulse       { 0%,100%{opacity:1} 50%{opacity:0.35} }
    @keyframes ss-fadeIn      { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ss-sideSlide   { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
    @keyframes ss-drawerUp    { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }

    /* PWA FIX: Scoped tap highlight kill — only inside SoapScreen */
    .ss-root, .ss-root * { -webkit-tap-highlight-color: transparent; }

    /* PWA FIX: All buttons inside ss-root get the minimum viable tap properties.
       cursor:pointer is critical — iOS PWA won't fire click without it. */
    .ss-root button {
      cursor: pointer !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent;
      min-height: 44px;
      -webkit-appearance: none;
      appearance: none;
    }

    /* Active-state tap feedback, scoped so it can't affect App.jsx buttons */
    .ss-root button:active {
      opacity: 0.55 !important;
      transform: scale(0.97) !important;
    }

    /* Exception: the attest button shouldn't scale when disabled */
    .ss-root button:disabled:active {
      opacity: 0.32 !important;
      transform: none !important;
    }

    /* UI chrome: no text selection */
    .ss-ui { -webkit-user-select: none; user-select: none; }

    /* SOAP text body: allow text selection for copy/paste */
    .ss-body { -webkit-user-select: text; user-select: text; }

    /* Main SOAP scroll container */
    .ss-soap-scroll {
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
      flex: 1;
      min-height: 0;
    }
    .ss-soap-scroll.ss-dark::-webkit-scrollbar        { width: 3px; }
    .ss-soap-scroll.ss-dark::-webkit-scrollbar-track  { background: transparent; }
    .ss-soap-scroll.ss-dark::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.10); border-radius: 2px; }
    .ss-soap-scroll.ss-light::-webkit-scrollbar       { width: 3px; }
    .ss-soap-scroll.ss-light::-webkit-scrollbar-track { background: transparent; }
    .ss-soap-scroll.ss-light::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }

    /* Compliance panel scroll (sheet only) */
    .ss-compliance-scroll {
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
      flex: 1;
      min-height: 0;
      /* hide scrollbar in compliance panel */
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .ss-compliance-scroll::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(s);
}());

// ── shared button base style ──────────────────────────────────────────────────
// Applied inline to every <button> as a base. The .ss-root button rule in CSS
// handles cursor and touch-action globally within the component tree.
const BTN = {
  display:"flex", alignItems:"center", justifyContent:"center",
  background:"none", border:"none", outline:"none",
  padding:0, margin:0, fontFamily:"inherit",
};

// ── Topbar ────────────────────────────────────────────────────────────────────
const Topbar = memo(function Topbar({
  onBack, portrait, light, T, div, fgMute, fgSub, acc, accBrd, accDim, chipB, warn,
  tokenCount, elapsed, phase, phaseLabel, sheetOpen, setSheetOpen, unackedWarn, leftBg,
}) {
  return (
    <div className="ss-ui" style={{
      flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding: portrait ? "18px 20px 14px" : "18px 26px 16px",
      borderBottom:`1px solid ${div}`,
      background: leftBg,
      zIndex:20,
    }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          ...BTN,
          gap:6, color:fgMute,
          fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
          padding:"6px 8px", borderRadius:6,
          minWidth:44,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{pointerEvents:"none"}}>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      {/* Logo */}
      <div style={{display:"flex",alignItems:"center",gap:8,pointerEvents:"none"}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.topbarTxt} strokeWidth="1.6" strokeLinecap="round" style={{pointerEvents:"none"}}>
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        <span style={{color:T.topbarTxt,fontSize:9.5,letterSpacing:"0.22em",textTransform:"uppercase"}}>Veridian</span>
      </div>

      {/* Right: token count + compliance pill + phase */}
      <div style={{display:"flex",alignItems:"center",gap:portrait?10:14}}>
        {tokenCount > 0 && (
          <span style={{color:fgMute,fontSize:8,letterSpacing:"0.12em",pointerEvents:"none"}}>
            {tokenCount.toLocaleString()} tok{phase==="gen"?` · ${elapsed}s`:""}
          </span>
        )}

        {/* Portrait: compliance sheet toggle pill */}
        {portrait && (phase==="checks"||phase==="review"||phase==="done") && (
          <button
            onClick={()=>setSheetOpen(o=>!o)}
            style={{
              ...BTN,
              position:"relative", gap:5,
              background: sheetOpen ? accDim : "transparent",
              border:`1px solid ${sheetOpen ? accBrd : chipB}`,
              borderRadius:5,
              padding:"5px 10px",
              color: sheetOpen ? acc : fgMute,
              fontSize:8, letterSpacing:"0.14em", textTransform:"uppercase",
              transition:"background 0.2s,border-color 0.2s,color 0.2s",
              minWidth:44,
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{pointerEvents:"none"}}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Compliance
            {unackedWarn > 0 && (
              <span style={{
                position:"absolute", top:-5, right:-5,
                width:14, height:14, borderRadius:"50%",
                background:warn, display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:7, color:"#fff", fontWeight:700,
                pointerEvents:"none",
              }}>{unackedWarn}</span>
            )}
          </button>
        )}

        <span style={{color:fgMute,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",pointerEvents:"none"}}>
          {phaseLabel}
        </span>
      </div>
    </div>
  );
});

// ── DisclosureBar ─────────────────────────────────────────────────────────────
const DisclosureBar = memo(function DisclosureBar({ portrait, div, accBrd, fgMute }) {
  return (
    <div className="ss-ui" style={{
      flexShrink:0,
      padding: portrait ? "7px 20px" : "8px 26px",
      borderBottom:`1px solid ${div}`,
      display:"flex", alignItems:"center", gap:8,
      pointerEvents:"none",
    }}>
      <div style={{width:2,height:10,background:accBrd,flexShrink:0,borderRadius:1}}/>
      <span style={{color:fgMute,fontSize:7.5,letterSpacing:"0.13em"}}>
        AI-generated · California AB 3030 · Clinician review required before finalization
      </span>
    </div>
  );
});

// ── SoapSections ──────────────────────────────────────────────────────────────
const SoapSections = memo(function SoapSections({
  soapScrollRef, light, portrait, texts, activeSec, phase,
  fg, fgSub, fgMute, acc, chipB, div, mono, sectionRefs,
}) {
  return (
    <div
      ref={soapScrollRef}
      className={`ss-soap-scroll ${light?"ss-light":"ss-dark"}`}
      style={{ padding: portrait ? "24px 20px 40px" : "28px 32px 40px" }}
    >
      {KEYS.map((key, i) => {
        const isActive = activeSec === i && phase === "gen";
        const hasText  = texts[key].length > 0;
        return (
          <div
            key={key}
            ref={el => { sectionRefs.current[key] = el; }}
            style={{
              marginBottom: i < KEYS.length-1 ? 36 : 0,
              animation:"ss-fadeIn 0.35s ease both",
              animationDelay:`${i*0.06}s`,
            }}
          >
            <div className="ss-ui" style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{
                width:2, alignSelf:"stretch",
                background: isActive ? acc : hasText ? fgMute : chipB,
                borderRadius:1, flexShrink:0,
                transition:"background 0.3s", minHeight:14,
              }}/>
              <span style={{
                color: hasText ? fgSub : fgMute,
                fontSize:8, letterSpacing:"0.22em", textTransform:"uppercase",
                transition:"color 0.3s",
              }}>{LABELS[key]}</span>
              {isActive && (
                <span style={{
                  width:4,height:4,borderRadius:"50%",
                  background:acc,flexShrink:0,
                  animation:"ss-pulse 1s ease-in-out infinite",
                  pointerEvents:"none",
                }}/>
              )}
            </div>

            {/* SOAP text — selectable for copy/paste on iOS */}
            <div
              className="ss-body"
              style={{
                color:fg, fontSize: portrait ? 10 : 10.5,
                lineHeight:"1.85", whiteSpace:"pre-wrap",
                letterSpacing:"0.01em", fontFamily:mono,
                paddingLeft:12,
                opacity: hasText ? 1 : 0.15,
                transition:"opacity 0.3s", minHeight:18,
                WebkitFontSmoothing:"antialiased",
              }}
            >
              {hasText ? texts[key] : "—"}
              {isActive && (
                <span style={{
                  display:"inline-block",width:6,height:12,
                  background:acc,marginLeft:2,verticalAlign:"text-bottom",
                  animation:"ss-blink 0.9s ease-in-out infinite",
                  pointerEvents:"none",
                }}/>
              )}
            </div>

            {i < KEYS.length-1 && <div style={{height:1,background:div,marginTop:28}}/>}
          </div>
        );
      })}
    </div>
  );
});

// ── CompliancePanel ───────────────────────────────────────────────────────────
// PWA FIX: Attestation checkboxes were <div onClick> — converted to <button>.
// iOS PWA only reliably fires click on native interactive elements.
const CompliancePanel = memo(function CompliancePanel({
  inSheet, checkState, acked, setAcked, phase, signed, signTime,
  boxes, setBoxes, provider, setProvider, canSign, warningsAcked, doSign,
  fg, fgSub, fgMute, div, chipB, acc, accBrd, accDim, warn, warnBrd, ok, mono,
}) {
  return (
    <div
      className={inSheet ? "ss-compliance-scroll" : ""}
      style={{
        flex:1, minHeight:0,
        padding: inSheet ? "16px 20px 32px" : "18px 20px 28px",
        overflowY: inSheet ? "auto" : "visible",
        WebkitOverflowScrolling: inSheet ? "touch" : undefined,
      }}
    >
      {/* Compliance checks */}
      {CHECKS.map(c => {
        const st      = checkState[c.id] || "pending";
        const done    = st === "done";
        const isWarn  = c.result==="warn" && done;
        const isAcked = acked[c.id];
        return (
          <div key={c.id} style={{
            marginBottom:20,
            opacity: st==="pending" ? 0.22 : 1,
            transition:"opacity 0.35s",
            animation: done ? "ss-fadeIn 0.3s ease both" : "none",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{flexShrink:0,width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                {st==="pending" && <div style={{width:5,height:5,borderRadius:"50%",border:`1px solid ${fgMute}`}}/>}
                {st==="run"     && <div style={{width:10,height:10,border:`1.5px solid ${acc}`,borderTopColor:"transparent",borderRadius:"50%",animation:"ss-spin 0.7s linear infinite"}}/>}
                {done           && <div style={{width:5,height:5,borderRadius:"50%",background: c.result==="pass"?ok:c.result==="warn"?warn:fgMute}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:done?fg:fgMute,fontSize:10,letterSpacing:"0.02em",lineHeight:"1.3",transition:"color 0.3s"}}>{c.label}</div>
                <div style={{color:fgMute,fontSize:7.5,letterSpacing:"0.10em",marginTop:1}}>{c.ref}</div>
              </div>
            </div>
            {done && (
              <div style={{paddingLeft:25,marginTop:5}}>
                <div style={{color:fgSub,fontSize:8.5,lineHeight:"1.6",letterSpacing:"0.01em",marginBottom:isWarn&&!isAcked?8:0}}>{c.note}</div>
                {isWarn && !isAcked && (
                  <button
                    onClick={()=>setAcked(p=>({...p,[c.id]:true}))}
                    style={{
                      ...BTN,
                      border:`1px solid ${warnBrd}`,borderRadius:5,
                      padding:"6px 12px",color:warn,fontSize:8,letterSpacing:"0.14em",
                      textTransform:"uppercase",
                    }}
                  >Acknowledge</button>
                )}
                {isWarn && isAcked && (
                  <span style={{color:fgMute,fontSize:8,letterSpacing:"0.10em",pointerEvents:"none"}}>acknowledged</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Attestation */}
      {(phase==="review"||phase==="done") && (
        <div style={{borderTop:`1px solid ${div}`,paddingTop:20,marginTop:4,animation:"ss-fadeIn 0.35s ease both"}}>
          <div className="ss-ui" style={{color:fgSub,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>Attestation</div>

          {!signed ? (
            <>
              {/* PWA FIX: Was <div onClick> — now <button>. iOS PWA ignores div clicks. */}
              {[
                {k:"a", txt:"I have reviewed this note for accuracy and completeness."},
                {k:"b", txt:"Content reflects the clinical encounter as conducted."},
                {k:"c", txt:"I accept clinical responsibility for this AI-generated note."},
              ].map(item => (
                <button
                  key={item.k}
                  onClick={()=>setBoxes(p=>({...p,[item.k]:!p[item.k]}))}
                  style={{
                    ...BTN,
                    width:"100%", alignItems:"flex-start",
                    gap:9, marginBottom:14,
                    padding:"4px 0", textAlign:"left",
                    border:"none", background:"none",
                    minHeight:44,
                  }}
                >
                  <div style={{
                    width:15,height:15,borderRadius:3,flexShrink:0,marginTop:1,
                    border:`1px solid ${boxes[item.k]?acc:chipB}`,
                    background:boxes[item.k]?accDim:"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"border-color 0.2s,background 0.2s",
                    pointerEvents:"none",
                  }}>
                    {boxes[item.k]&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={acc} strokeWidth="3" strokeLinecap="round" style={{pointerEvents:"none"}}><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{color:fgSub,fontSize:8.5,lineHeight:"1.6",pointerEvents:"none"}}>{item.txt}</span>
                </button>
              ))}

              <div style={{marginTop:8,marginBottom:16}}>
                <div className="ss-ui" style={{color:fgMute,fontSize:7.5,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:6}}>Provider · NPI</div>
                <input
                  type="text"
                  placeholder="Dr. S. Okafor, MD"
                  value={provider}
                  onChange={e=>setProvider(e.target.value)}
                  style={{
                    width:"100%",
                    background:"transparent",border:`1px solid ${chipB}`,borderRadius:5,
                    padding:"9px 10px",color:fg,outline:"none",
                    fontFamily:mono,WebkitAppearance:"none", appearance:"none",
                    // PWA FIX: font-size 16px prevents iOS auto-zoom on input focus
                    fontSize:"16px",
                    touchAction:"manipulation",
                    boxSizing:"border-box",
                  }}
                />
              </div>

              {!warningsAcked && (
                <div style={{color:warn,fontSize:8,letterSpacing:"0.08em",marginBottom:12,pointerEvents:"none"}}>
                  Acknowledge warnings above first.
                </div>
              )}

              <button
                onClick={doSign}
                disabled={!canSign}
                style={{
                  ...BTN,
                  width:"100%",
                  background: canSign ? accDim : "none",
                  border:`1px solid ${canSign ? accBrd : chipB}`,
                  borderRadius:8,
                  padding:"13px 0",
                  color: canSign ? acc : fgSub,
                  fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
                  transition:"border-color 0.2s,color 0.2s,background 0.2s",
                  opacity: canSign ? 1 : 0.32,
                  cursor: canSign ? "pointer" : "not-allowed",
                  // PWA FIX: min-height 44 set by .ss-root button CSS rule
                }}
              >
                Attest &amp; Finalize
              </button>
            </>
          ) : (
            <div style={{animation:"ss-fadeIn 0.35s ease both"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,pointerEvents:"none"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:ok}}/>
                <div style={{color:fg,fontSize:9.5,letterSpacing:"0.04em"}}>{provider}</div>
              </div>
              <div style={{color:fgMute,fontSize:8,letterSpacing:"0.10em",marginBottom:20,pointerEvents:"none"}}>{signTime} · audit logged</div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...BTN,flex:1,border:`1px solid ${accBrd}`,borderRadius:7,padding:"11px 0",color:acc,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase"}}>EHR</button>
                <button style={{...BTN,flex:1,border:`1px solid ${chipB}`,borderRadius:7,padding:"11px 0",color:fgSub,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase"}}>PDF</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ── SoapScreen ────────────────────────────────────────────────────────────────
export default function SoapScreen({ onBack, light, portrait: portraitProp }) {
  const localPortrait = useOrientation();
  const portrait = portraitProp !== undefined ? portraitProp : localPortrait;

  const T    = useMemo(() => light ? LIGHT : DARK, [light]);
  const W    = portrait ? IPAD_P_W : IPAD_L_W;
  const H    = portrait ? IPAD_P_H : IPAD_L_H;
  const mono = "'DM Mono','Courier New',monospace";

  const [sheetOpen, setSheetOpen] = useState(false);
  const [phase, setPhase]         = useState("idle");
  const [texts, setTexts]         = useState({ subjective:"", objective:"", assessment:"", plan:"" });
  const [activeSec, setActiveSec] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [elapsed, setElapsed]     = useState(0);
  const [checkState, setCheckState] = useState({});
  const [acked, setAcked]         = useState({});
  const [boxes, setBoxes]         = useState({ a:false, b:false, c:false });
  const [provider, setProvider]   = useState("");
  const [signed, setSigned]       = useState(false);
  const [signTime, setSignTime]   = useState("");
  const [warnCount, setWarnCount] = useState(0);

  const timerRef    = useRef(null);
  const genRef      = useRef(null);
  const t0          = useRef(null);
  const sectionRefs = useRef({});
  const soapScrollRef = useRef(null);

  const runChecks = useCallback(() => {
    CHECKS.forEach(c => setCheckState(p=>({...p,[c.id]:"pending"})));
    let delay = 150;
    CHECKS.forEach((c,i) => {
      setTimeout(()=>{
        setCheckState(p=>({...p,[c.id]:"run"}));
        if (c.ms > 0) {
          setTimeout(()=>{
            setCheckState(p=>({...p,[c.id]:"done"}));
            if (c.result === "warn") setWarnCount(n => n+1);
            if (i === CHECKS.length-1) setPhase("review");
          }, c.ms);
        } else {
          setCheckState(p=>({...p,[c.id]:"done"}));
          setPhase("review");
        }
      }, delay);
      delay += c.ms + 200;
    });
  }, []);

  const start = useCallback(() => {
    setPhase("gen");
    setTexts({ subjective:"", objective:"", assessment:"", plan:"" });
    setActiveSec(0); setTokenCount(0); setElapsed(0); setWarnCount(0);
    t0.current = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now()-t0.current)/1000)), 1000);
    const chunks = KEYS.map(k => tokenize(FULL_SOAP[k]));
    let si=0, ti=0, total=0;
    const tick = () => {
      if (si >= KEYS.length) {
        clearInterval(timerRef.current); setPhase("checks"); runChecks(); return;
      }
      if (ti >= chunks[si].length) {
        si++; ti=0; setActiveSec(si);
        const nextKey = KEYS[si];
        if (nextKey && sectionRefs.current[nextKey])
          sectionRefs.current[nextKey].scrollIntoView({ behavior:"smooth", block:"nearest" });
        genRef.current = setTimeout(tick, 80); return;
      }
      const burst = Math.min(Math.floor(Math.random()*4)+3, chunks[si].length-ti);
      const chunk = chunks[si].slice(ti,ti+burst).join(""); ti+=burst; total+=burst;
      setTexts(p=>({...p,[KEYS[si]]:p[KEYS[si]]+chunk}));
      setTokenCount(total);
      const last = chunk.trim().slice(-1);
      genRef.current = setTimeout(tick, [".",":","!","?"].includes(last)?30+Math.random()*40:8+Math.random()*14);
    };
    tick();
  }, [runChecks]);

  useEffect(() => { start(); }, []);
  useEffect(() => () => { clearInterval(timerRef.current); clearTimeout(genRef.current); }, []);

  const warningsAcked = CHECKS.filter(c=>c.result==="warn").every(c=>acked[c.id]);
  const canSign = boxes.a && boxes.b && boxes.c && provider.trim().length > 2 && warningsAcked;
  const unackedWarn = CHECKS.filter(c=>c.result==="warn" && checkState[c.id]==="done" && !acked[c.id]).length;

  const doSign = useCallback(()=>{
    if (!canSign) return;
    setSigned(true);
    setSignTime(new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    setPhase("done");
  }, [canSign]);

  useEffect(() => { if (signed) setSheetOpen(false); }, [signed]);

  // ── colours ──────────────────────────────────────────────────────────────────
  const leftBg  = light ? "#f8f9fc" : "#0b0c12";
  const rightBg = light ? "#eef0f6" : "#0f1018";
  const fg      = T.nameTxt;
  const fgSub   = T.valueTxt;
  const fgMute  = T.labelTxt;
  const div     = T.divider;
  const chipB   = T.chipBorder;
  const acc     = light ? "rgba(22,95,178,0.75)"  : "rgba(90,210,240,0.65)";
  const accBrd  = light ? "rgba(22,95,178,0.22)"  : "rgba(90,210,240,0.16)";
  const accDim  = light ? "rgba(22,95,178,0.06)"  : "rgba(90,210,240,0.05)";
  const warn    = light ? "rgba(180,120,15,0.80)" : "rgba(210,170,55,0.75)";
  const warnBrd = light ? "rgba(180,120,15,0.20)" : "rgba(210,170,55,0.18)";
  const ok      = light ? "rgba(30,135,65,0.80)"  : "rgba(75,195,110,0.75)";

  const phaseLabel =
    phase==="idle"  ? "ready" : phase==="gen" ? "generating" :
    phase==="checks"? "verifying" : signed ? "attested" : "review";

  // ── shared props bundles (stable refs — don't change during token streaming) ─
  const sharedColors = useMemo(()=>({
    fg,fgSub,fgMute,div,chipB,acc,accBrd,accDim,warn,warnBrd,ok,mono,
  }),[light]); // only recalc on theme change

  const complianceProps = useMemo(()=>({
    checkState, acked, setAcked, phase, signed, signTime,
    boxes, setBoxes, provider, setProvider, canSign, warningsAcked, doSign,
    ...sharedColors,
  }),[checkState, acked, phase, signed, signTime, boxes, provider, canSign, warningsAcked, doSign, sharedColors]);

  const topbarProps = useMemo(()=>({
    onBack, portrait, light, T, leftBg,
    tokenCount, elapsed, phase, phaseLabel, sheetOpen, setSheetOpen, unackedWarn,
    ...sharedColors,
  }),[portrait, light, tokenCount, elapsed, phase, phaseLabel, sheetOpen, unackedWarn, sharedColors]);

  const soapProps = useMemo(()=>({
    soapScrollRef, light, portrait, texts, activeSec, phase, sectionRefs,
    ...sharedColors,
  }),[light, portrait, texts, activeSec, phase, sharedColors]);

  const disclosureProps = useMemo(()=>({
    portrait, div, accBrd, fgMute,
  }),[portrait, light]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PORTRAIT LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  if (portrait) {
    return (
      <div className="ss-root" style={{
        width:W, height:H, background:T.bg, fontFamily:mono,
        display:"flex", flexDirection:"column", overflow:"hidden", position:"relative",
      }}>
        <Topbar {...topbarProps}/>
        <div style={{flex:1,background:leftBg,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
          <DisclosureBar {...disclosureProps}/>
          <SoapSections {...soapProps}/>
        </div>

        {/* Backdrop */}
        {sheetOpen && (
          <button
            onClick={()=>setSheetOpen(false)}
            style={{
              position:"absolute",inset:0,
              background: light ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.52)",
              zIndex:30, border:"none", cursor:"default",
              // full-screen backdrop — needs to be a button for iOS PWA
            }}
          />
        )}

        {/* Bottom sheet */}
        <div style={{
          position:"absolute", left:0, right:0,
          bottom: sheetOpen ? 0 : -(H * 0.72),
          height: H * 0.72,
          background:rightBg,
          borderTop:`1px solid ${div}`,
          borderRadius:"18px 18px 0 0",
          zIndex:40,
          display:"flex", flexDirection:"column",
          overflow:"hidden",
          transition:"bottom 0.38s cubic-bezier(0.32,0.72,0,1)",
          boxShadow:"0 -8px 40px rgba(0,0,0,0.22)",
        }}>
          {/* Sheet header */}
          <div className="ss-ui" style={{
            flexShrink:0,
            display:"flex",flexDirection:"column",alignItems:"center",
            padding:"10px 20px 0",
            borderBottom:`1px solid ${div}`,
            paddingBottom:12,
          }}>
            <div style={{
              width:36,height:4,borderRadius:2,
              background: light ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
              marginBottom:12, pointerEvents:"none",
            }}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
              <div style={{pointerEvents:"none"}}>
                <div style={{color:fgSub,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase"}}>Compliance</div>
                <div style={{color:fgMute,fontSize:7.5,letterSpacing:"0.10em",marginTop:1}}>HIPAA · CA AB 3030 · Internal QA</div>
              </div>
              <button
                onClick={()=>setSheetOpen(false)}
                style={{...BTN, color:fgMute, padding:"6px 8px", borderRadius:6, minWidth:44}}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{pointerEvents:"none"}}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <CompliancePanel inSheet={true} {...complianceProps}/>
        </div>

        {/* Unacked warning badge (portrait, sheet closed) */}
        {!sheetOpen && (phase==="review"||phase==="done") && !signed && unackedWarn > 0 && (
          <div style={{
            position:"absolute", bottom:24, right:22, zIndex:29,
            animation:"ss-fadeIn 0.35s ease both",
            pointerEvents:"none",
          }}>
            <div style={{
              background: light ? "rgba(180,120,15,0.12)" : "rgba(210,170,55,0.10)",
              border:`1px solid ${warnBrd}`,
              borderRadius:8, padding:"7px 14px",
              display:"flex",alignItems:"center",gap:6,
            }}>
              <div style={{width:5,height:5,borderRadius:"50%",background:warn,flexShrink:0,animation:"ss-pulse 1.5s ease-in-out infinite"}}/>
              <span style={{color:warn,fontSize:8,letterSpacing:"0.12em"}}>{unackedWarn} warning{unackedWarn>1?"s":""} to review</span>
            </div>
          </div>
        )}

        {/* Signed bar (portrait) */}
        {signed && (
          <div style={{
            position:"absolute", bottom:0,left:0,right:0,
            background: light ? "rgba(30,135,65,0.10)" : "rgba(75,195,110,0.08)",
            borderTop:`1px solid ${light?"rgba(30,135,65,0.20)":"rgba(75,195,110,0.15)"}`,
            padding:"12px 22px",
            display:"flex",alignItems:"center",justifyContent:"space-between",
            zIndex:29, animation:"ss-fadeIn 0.35s ease both",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:8,pointerEvents:"none"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:ok}}/>
              <span style={{color:ok,fontSize:8.5,letterSpacing:"0.12em"}}>Attested · {signTime}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={{...BTN,border:`1px solid ${accBrd}`,borderRadius:6,padding:"7px 16px",color:acc,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase"}}>EHR</button>
              <button style={{...BTN,border:`1px solid ${chipB}`,borderRadius:6,padding:"7px 16px",color:fgSub,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase"}}>PDF</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LANDSCAPE LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="ss-root" style={{
      width:W, height:H, background:T.bg, fontFamily:mono,
      display:"flex", flexDirection:"column", overflow:"hidden", position:"relative",
    }}>
      <Topbar {...topbarProps}/>
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
        {/* LEFT: SOAP note */}
        <div style={{
          flex:1, background:leftBg,
          display:"flex",flexDirection:"column",
          overflow:"hidden", borderRight:`1px solid ${div}`,
        }}>
          <DisclosureBar {...disclosureProps}/>
          <SoapSections {...soapProps}/>
        </div>

        {/* RIGHT: compliance sidebar */}
        <div style={{
          width:310, flexShrink:0,
          background:rightBg,
          display:"flex",flexDirection:"column",
          overflow:"hidden",
          animation:"ss-sideSlide 0.4s ease both",
        }}>
          <div className="ss-ui" style={{
            flexShrink:0, padding:"14px 20px 12px",
            borderBottom:`1px solid ${div}`,
            pointerEvents:"none",
          }}>
            <div style={{color:fgSub,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase"}}>Compliance</div>
            <div style={{color:fgMute,fontSize:7.5,letterSpacing:"0.10em",marginTop:2}}>HIPAA · CA AB 3030 · Internal QA</div>
          </div>
          <CompliancePanel inSheet={false} {...complianceProps}/>
        </div>
      </div>
    </div>
  );
}