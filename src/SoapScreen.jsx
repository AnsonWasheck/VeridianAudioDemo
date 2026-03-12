// SoapScreen.jsx
// California AB 3030: AI-generated clinical notes require mandatory clinician
// review and attestation before finalization or EHR transmission.
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { DARK, LIGHT } from "./App";

// ── orientation hook ──────────────────────────────────────────────────────────
export function useOrientation() {
  const detect = useCallback(() => {
    if (window.screen?.orientation?.type)
      return window.screen.orientation.type.startsWith("portrait");
    if (typeof window.orientation === "number")
      return window.orientation === 0 || window.orientation === 180;
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
  subjective: `Patient Eleanor Voss, 56-year-old female, presents for hypertension follow-up. Chief complaint: routine blood pressure monitoring and medication review. Patient reports compliance with prescribed antihypertensive regimen (Lisinopril 10mg QD, Amlodipine 5mg QD). Denies headache, visual changes, chest pain, shortness of breath, or palpitations. Reports occasional mild ankle swelling, worse in evenings. Denies dizziness with position changes. Sleep adequate at 6-7 hours/night. Diet mostly low sodium with weekend lapses. Exercise: 20-minute walks 3-4x/week. Non-smoker, occasional alcohol (1-2 drinks/week). No OTC medications beyond multivitamin. Family history: father with HTN and MI at age 68.`,
  objective:  `Vitals: BP 124/82 mmHg (left arm, seated, confirmed on repeat). HR 71 bpm regular. SpO2 98% RA. Temp 36.8 degrees C. RR 16/min. Weight 68.2 kg. BMI 24.1 kg/m2.\n\nPhysical Exam - General: Alert, oriented, no acute distress. HEENT: No papilledema, no JVD. CV: RRR, no murmurs, rubs, or gallops. Peripheral pulses 2+ bilaterally. Resp: CTA bilaterally. Abd: Soft, NT/ND, no renal bruits. Ext: Mild bilateral pitting edema 1+ at ankles, no calf tenderness. Neuro: No focal deficits.\n\nLabs (6 weeks prior): BMP WNL. Cr 0.9 mg/dL. eGFR >60. K+ 4.1. FBG 94. LDL 108, HDL 54, TG 142.`,
  assessment: `1. Essential hypertension (I10) - Controlled. BP at ACC/AHA target <130/80. Good medication adherence.\n\n2. Bilateral lower extremity edema (R60.0) - Likely Amlodipine-related. Mild, clinically stable. No signs of cardiac decompensation or DVT.\n\n3. Hyperlipidemia (E78.5) - LDL mildly above optimal. Not currently on statin. Risk-benefit discussion held.\n\n4. Health maintenance - Mammogram and colonoscopy screening reviewed. Age-appropriate preventive care discussed.`,
  plan:       `1. Hypertension - Continue Lisinopril 10mg QD and Amlodipine 5mg QD. Reinforce DASH diet (<2g sodium/day). Continue home BP log; contact office if systolic >160. Repeat BMP in 3 months.\n\n2. Ankle edema - Compression stockings 20-30 mmHg. Return if edema worsens or cardiopulmonary symptoms develop.\n\n3. Hyperlipidemia - Initiate Atorvastatin 20mg QD. Repeat lipid panel in 6-8 weeks. Target LDL <100 mg/dL.\n\n4. Health maintenance - Mammogram referral placed. GI referral for overdue colonoscopy. Flu vaccine administered today. Advance directive discussion initiated.\n\n5. Follow-up in 3 months or sooner as needed.`,
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

// ── CSS — injected once at module load, never inside React's render cycle ─────
//
// FIX 1 — Scoped selectors only. The previous version used `*` to set
//   -webkit-tap-highlight-color, which bled into App.jsx and clobbered
//   its button styles. Now every rule is scoped under `.ss-` (SoapScreen)
//   so nothing leaks outside this component tree.
//
// FIX 2 — .ss-soap-scroll is the ONLY scroll container. The sidebar gets
//   overflow:visible so it grows naturally inside its own fixed-height parent
//   and cannot scroll independently.
(function injectSoapCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("soap-screen-styles")) return;
  const s = document.createElement("style");
  s.id = "soap-screen-styles";
  s.textContent = `
/* ── keyframes (prefixed to avoid conflicts) ── */
@keyframes ss-spin    { to { transform: rotate(360deg); } }
@keyframes ss-blink   { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes ss-pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
@keyframes ss-fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes ss-slideR  { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }

/* ── scoped tap-highlight kill — only inside .ss-root ── */
.ss-root * {
  -webkit-tap-highlight-color: transparent;
}

/* ── selection control ── */
.ss-ui   { -webkit-user-select:none; user-select:none; }
.ss-body { -webkit-user-select:text;  user-select:text; }

/* ── THE only scroll container: SOAP note pane ── */
/* FIX: overflow-y:auto + -webkit-overflow-scrolling so momentum works on iOS */
/* FIX: min-height:0 is set inline on the flex child so the browser lets it shrink */
.ss-soap-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

/* Thin custom scrollbar on the SOAP pane */
.ss-soap-scroll::-webkit-scrollbar       { width: 3px; }
.ss-soap-scroll::-webkit-scrollbar-track { background: transparent; }
.ss-soap-scroll.ss-dark::-webkit-scrollbar-thumb  { background:rgba(255,255,255,0.10); border-radius:2px; }
.ss-soap-scroll.ss-light::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.12);        border-radius:2px; }

/* ── Sidebar: NO scroll. Content sits in a fixed-height column. ── */
/* The sidebar outer div has overflow:hidden (set inline). */
/* CompliancePanel itself uses overflow:visible so it grows to fill. */

/* ── tap feedback — scoped inside .ss-root only ── */
.ss-root .ss-btn:active {
  opacity: 0.52 !important;
  transform: scale(0.97) !important;
}

/* ── section entrance — fires once on mount, locks final state ── */
.ss-section {
  animation: ss-fadeIn 0.35s ease both;
}
`;
  document.head.appendChild(s);
}());

// =============================================================================
// SUB-COMPONENTS — all at module scope + memo() so React never unmounts them
// on a parent state update (prevents animation resets during token streaming).
// =============================================================================

// ── Topbar ────────────────────────────────────────────────────────────────────
const Topbar = memo(function Topbar(p) {
  const {
    onBack, portrait, leftBg, divCol, fgMute, topbarTxt,
    acc, accBrd, accDim, chipB, warn,
    tokenCount, elapsed, phase, phaseLabel,
    sheetOpen, setSheetOpen, unackedWarn,
  } = p;
  return (
    <div className="ss-ui" style={{
      flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between",
      padding: portrait ? "18px 20px 14px" : "18px 26px 16px",
      borderBottom:`1px solid ${divCol}`,
      background:leftBg, zIndex:20,
    }}>
      {/* Back button */}
      <button
        className="ss-btn"
        onClick={onBack}
        style={{
          display:"flex", alignItems:"center", gap:6,
          background:"none", border:"none", color:fgMute,
          fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
          cursor:"pointer", outline:"none", padding:"8px 0",
          WebkitAppearance:"none", touchAction:"manipulation",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      {/* Logo */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={topbarTxt} strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span style={{color:topbarTxt,fontSize:9.5,letterSpacing:"0.22em",textTransform:"uppercase"}}>Veridian</span>
      </div>

      {/* Right cluster */}
      <div style={{display:"flex",alignItems:"center",gap:portrait?10:14}}>
        {tokenCount > 0 && (
          <span style={{color:fgMute,fontSize:8,letterSpacing:"0.12em"}}>
            {tokenCount.toLocaleString()} tok{phase==="gen"?` · ${elapsed}s`:""}
          </span>
        )}

        {/* Portrait only: compliance sheet toggle */}
        {portrait && (phase==="checks"||phase==="review"||phase==="done") && (
          <button
            className="ss-btn"
            onClick={()=>setSheetOpen(o=>!o)}
            style={{
              position:"relative", display:"flex", alignItems:"center", gap:5,
              background:sheetOpen?accDim:"transparent",
              border:`1px solid ${sheetOpen?accBrd:chipB}`,
              borderRadius:5, padding:"5px 10px",
              color:sheetOpen?acc:fgMute,
              fontSize:8, letterSpacing:"0.14em", textTransform:"uppercase",
              cursor:"pointer", outline:"none", WebkitAppearance:"none",
              touchAction:"manipulation",
              transition:"background 0.2s,border-color 0.2s,color 0.2s",
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Compliance
            {unackedWarn > 0 && (
              <span style={{
                position:"absolute", top:-5, right:-5,
                width:14, height:14, borderRadius:"50%",
                background:warn, display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:7, color:"#fff", fontWeight:700,
              }}>{unackedWarn}</span>
            )}
          </button>
        )}

        <span style={{color:fgMute,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase"}}>
          {phaseLabel}
        </span>
      </div>
    </div>
  );
});

// ── DisclosureBar ─────────────────────────────────────────────────────────────
const DisclosureBar = memo(function DisclosureBar({ portrait, divCol, accBrd, fgMute }) {
  return (
    <div className="ss-ui" style={{
      flexShrink:0,
      padding:portrait?"7px 20px":"8px 26px",
      borderBottom:`1px solid ${divCol}`,
      display:"flex", alignItems:"center", gap:8,
    }}>
      <div style={{width:2,height:10,background:accBrd,flexShrink:0,borderRadius:1}}/>
      <span style={{color:fgMute,fontSize:7.5,letterSpacing:"0.13em"}}>
        AI-generated · California AB 3030 · Clinician review required before finalization
      </span>
    </div>
  );
});

// ── SoapSection — one section row ─────────────────────────────────────────────
const SoapSection = memo(function SoapSection({
  label, text, isActive, isLast,
  acc, fgMute, fgSub, fg, chipB, divCol, portrait, mono, animDelay,
}) {
  const hasText = text.length > 0;
  return (
    <div className="ss-section" style={{marginBottom:isLast?0:36, animationDelay:`${animDelay}s`}}>
      {/* label row */}
      <div className="ss-ui" style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{
          width:2, alignSelf:"stretch", minHeight:14,
          background:isActive?acc:hasText?fgMute:chipB,
          borderRadius:1, flexShrink:0, transition:"background 0.3s",
        }}/>
        <span style={{
          color:hasText?fgSub:fgMute,
          fontSize:8, letterSpacing:"0.22em", textTransform:"uppercase",
          transition:"color 0.3s",
        }}>{label}</span>
        {isActive && (
          <span style={{
            width:4, height:4, borderRadius:"50%", background:acc, flexShrink:0,
            animation:"ss-pulse 1s ease-in-out infinite",
          }}/>
        )}
      </div>

      {/* SOAP text — iOS-selectable */}
      <div className="ss-body" style={{
        color:fg,
        fontSize:portrait?10:10.5,
        lineHeight:"1.85",
        whiteSpace:"pre-wrap",
        letterSpacing:"0.01em",
        fontFamily:mono,
        paddingLeft:12,
        opacity:hasText?1:0.15,
        transition:"opacity 0.3s",
        minHeight:18,
        WebkitFontSmoothing:"antialiased",
      }}>
        {hasText ? text : "—"}
        {isActive && (
          <span style={{
            display:"inline-block", width:6, height:12,
            background:acc, marginLeft:2, verticalAlign:"text-bottom",
            animation:"ss-blink 0.9s ease-in-out infinite",
          }}/>
        )}
      </div>

      {!isLast && <div style={{height:1,background:divCol,marginTop:28}}/>}
    </div>
  );
});

// ── SoapSections — scroll wrapper (THE only scrollable element) ───────────────
//
// FIX: The scroll chain requires every ancestor to have a definite height.
//   - Parent flex column must have overflow:hidden + the scroll child needs minHeight:0
//   - We set minHeight:0 via inline style here so the browser lets flex shrink it
//   - overflow-y:auto is on the .ss-soap-scroll class (set in CSS above)
const SoapSections = memo(function SoapSections({
  texts, activeSec, phase, sectionRefs, portrait, light,
  acc, fgMute, fgSub, fg, chipB, divCol, mono,
}) {
  return (
    <div
      className={`ss-soap-scroll ${light?"ss-light":"ss-dark"}`}
      style={{
        flex:1,
        minHeight:0,   // ← critical: allows flex child to shrink below content height
        padding:portrait?"24px 20px 40px":"28px 32px 40px",
      }}
    >
      {KEYS.map((key,i) => (
        <div key={key} ref={el=>{sectionRefs.current[key]=el;}}>
          <SoapSection
            label={LABELS[key]}
            text={texts[key]}
            isActive={activeSec===i && phase==="gen"}
            isLast={i===KEYS.length-1}
            acc={acc} fgMute={fgMute} fgSub={fgSub} fg={fg}
            chipB={chipB} divCol={divCol} portrait={portrait} mono={mono}
            animDelay={i*0.06}
          />
        </div>
      ))}
    </div>
  );
});

// ── CheckRow ──────────────────────────────────────────────────────────────────
const CheckRow = memo(function CheckRow({ check, st, acked, onAck, fg, fgMute, fgSub, acc, warn, warnBrd, ok }) {
  const done   = st==="done";
  const isWarn = check.result==="warn" && done;
  const dot    = !done ? fgMute : check.result==="pass" ? ok : check.result==="warn" ? warn : fgMute;
  return (
    <div style={{marginBottom:20, opacity:st==="pending"?0.22:1, transition:"opacity 0.35s"}}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{flexShrink:0,width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {st==="pending" && <div style={{width:5,height:5,borderRadius:"50%",border:`1px solid ${fgMute}`}}/>}
          {st==="run"     && <div style={{width:10,height:10,border:`1.5px solid ${acc}`,borderTopColor:"transparent",borderRadius:"50%",animation:"ss-spin 0.7s linear infinite"}}/>}
          {done           && <div style={{width:5,height:5,borderRadius:"50%",background:dot}}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:done?fg:fgMute,fontSize:10,letterSpacing:"0.02em",lineHeight:"1.3",transition:"color 0.3s"}}>{check.label}</div>
          <div style={{color:fgMute,fontSize:7.5,letterSpacing:"0.10em",marginTop:1}}>{check.ref}</div>
        </div>
      </div>
      {done && (
        <div style={{paddingLeft:25,marginTop:5}}>
          <div style={{color:fgSub,fontSize:8.5,lineHeight:"1.6",letterSpacing:"0.01em",marginBottom:isWarn&&!acked?8:0}}>{check.note}</div>
          {isWarn && !acked && (
            <button className="ss-btn" onClick={onAck} style={{
              background:"none", border:`1px solid ${warnBrd}`, borderRadius:5,
              padding:"6px 12px", color:warn, fontSize:8, letterSpacing:"0.14em",
              textTransform:"uppercase", cursor:"pointer", outline:"none",
              WebkitAppearance:"none", touchAction:"manipulation",
            }}>Acknowledge</button>
          )}
          {isWarn && acked && <span style={{color:fgMute,fontSize:8,letterSpacing:"0.10em"}}>acknowledged</span>}
        </div>
      )}
    </div>
  );
});

// ── CompliancePanel ───────────────────────────────────────────────────────────
//
// FIX: No scroll class here. The sidebar column is overflow:hidden (set on
// the wrapper div inline). The panel just renders its content at natural height.
// In landscape the sidebar wrapper is tall enough to always show everything.
// In portrait it lives in the bottom sheet which handles its own scroll.
const CompliancePanel = memo(function CompliancePanel(p) {
  const {
    inSheet, checkState, acked, onAck,
    phase, boxes, setBoxes, provider, setProvider,
    canSign, warningsAcked, doSign, signed, signTime,
    fg, fgMute, fgSub, divCol, chipB,
    acc, accBrd, accDim, warn, warnBrd, ok, mono,
  } = p;

  // In the bottom sheet (portrait) we DO want scroll so the attestation form
  // is reachable. In the landscape sidebar we do NOT scroll.
  const scrollStyle = inSheet
    ? { overflowY:"auto", WebkitOverflowScrolling:"touch", overscrollBehavior:"contain" }
    : { overflowY:"visible" };

  return (
    <div style={{
      flex:1,
      minHeight:0,
      padding:inSheet?"16px 20px 32px":"18px 20px 28px",
      ...scrollStyle,
    }}>
      {CHECKS.map(c=>(
        <CheckRow
          key={c.id} check={c}
          st={checkState[c.id]||"pending"}
          acked={!!acked[c.id]} onAck={()=>onAck(c.id)}
          fg={fg} fgMute={fgMute} fgSub={fgSub}
          acc={acc} warn={warn} warnBrd={warnBrd} ok={ok}
        />
      ))}

      {/* Attestation */}
      {(phase==="review"||phase==="done") && (
        <div style={{
          borderTop:`1px solid ${divCol}`, paddingTop:20, marginTop:4,
          animation:"ss-fadeIn 0.35s ease both",
        }}>
          <div style={{color:fgSub,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>
            Attestation
          </div>

          {!signed ? (
            <>
              {[
                {k:"a", txt:"I have reviewed this note for accuracy and completeness."},
                {k:"b", txt:"Content reflects the clinical encounter as conducted."},
                {k:"c", txt:"I accept clinical responsibility for this AI-generated note."},
              ].map(item=>(
                <div
                  key={item.k}
                  className="ss-btn ss-ui"
                  onClick={()=>setBoxes(prev=>({...prev,[item.k]:!prev[item.k]}))}
                  style={{
                    display:"flex", alignItems:"flex-start", gap:9,
                    marginBottom:14, cursor:"pointer", padding:"2px 0",
                    touchAction:"manipulation",
                  }}
                >
                  <div style={{
                    width:15, height:15, borderRadius:3, flexShrink:0, marginTop:1,
                    border:`1px solid ${boxes[item.k]?acc:chipB}`,
                    background:boxes[item.k]?accDim:"transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"border-color 0.2s,background 0.2s",
                  }}>
                    {boxes[item.k] && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={acc} strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <span style={{color:fgSub,fontSize:8.5,lineHeight:"1.6"}}>{item.txt}</span>
                </div>
              ))}

              <div style={{marginTop:8,marginBottom:16}}>
                <div style={{color:fgMute,fontSize:7.5,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:6}}>Provider · NPI</div>
                <input
                  type="text"
                  placeholder="Dr. S. Okafor, MD"
                  value={provider}
                  onChange={e=>setProvider(e.target.value)}
                  style={{
                    width:"100%", boxSizing:"border-box",
                    background:"transparent", border:`1px solid ${chipB}`,
                    borderRadius:5, padding:"9px 10px",
                    color:fg,
                    fontSize:"16px", /* prevents iOS auto-zoom on focus */
                    outline:"none", fontFamily:mono, WebkitAppearance:"none",
                  }}
                />
              </div>

              {!warningsAcked && (
                <div style={{color:warn,fontSize:8,letterSpacing:"0.08em",marginBottom:12}}>
                  Acknowledge warnings above first.
                </div>
              )}

              <button
                className="ss-btn"
                onClick={doSign}
                disabled={!canSign}
                style={{
                  width:"100%",
                  background:canSign?accDim:"none",
                  border:`1px solid ${canSign?accBrd:chipB}`,
                  borderRadius:8, padding:"13px 0",
                  color:canSign?acc:fgSub,
                  fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
                  cursor:canSign?"pointer":"not-allowed", outline:"none",
                  transition:"border-color 0.2s,color 0.2s,background 0.2s",
                  opacity:canSign?1:0.32, WebkitAppearance:"none",
                  touchAction:"manipulation",
                }}
              >
                Attest &amp; Finalize
              </button>
            </>
          ) : (
            <div style={{animation:"ss-fadeIn 0.35s ease both"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:ok}}/>
                <div style={{color:fg,fontSize:9.5,letterSpacing:"0.04em"}}>{provider}</div>
              </div>
              <div style={{color:fgMute,fontSize:8,letterSpacing:"0.10em",marginBottom:20}}>{signTime} · audit logged</div>
              <div style={{display:"flex",gap:8}}>
                <button className="ss-btn" style={{flex:1,background:"none",border:`1px solid ${accBrd}`,borderRadius:7,padding:"11px 0",color:acc,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",outline:"none",WebkitAppearance:"none",touchAction:"manipulation"}}>EHR</button>
                <button className="ss-btn" style={{flex:1,background:"none",border:`1px solid ${chipB}`,borderRadius:7,padding:"11px 0",color:fgSub,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",outline:"none",WebkitAppearance:"none",touchAction:"manipulation"}}>PDF</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ── SidebarHeader ─────────────────────────────────────────────────────────────
const SidebarHeader = memo(function SidebarHeader({ divCol, fgSub, fgMute }) {
  return (
    <div className="ss-ui" style={{flexShrink:0,padding:"14px 20px 12px",borderBottom:`1px solid ${divCol}`}}>
      <div style={{color:fgSub,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase"}}>Compliance</div>
      <div style={{color:fgMute,fontSize:7.5,letterSpacing:"0.10em",marginTop:2}}>HIPAA · CA AB 3030 · Internal QA</div>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function SoapScreen({ onBack, light, portrait: portraitProp }) {
  const localPortrait = useOrientation();
  const portrait = portraitProp !== undefined ? portraitProp : localPortrait;

  const T    = useMemo(()=>light?LIGHT:DARK,[light]);
  const W    = portrait?IPAD_P_W:IPAD_L_W;
  const H    = portrait?IPAD_P_H:IPAD_L_H;
  const mono = "'DM Mono','Courier New',monospace";

  // ── state ────────────────────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState("idle");
  const [texts,      setTexts]      = useState({subjective:"",objective:"",assessment:"",plan:""});
  const [activeSec,  setActiveSec]  = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [elapsed,    setElapsed]    = useState(0);
  const [checkState, setCheckState] = useState({});
  const [acked,      setAcked]      = useState({});
  const [boxes,      setBoxes]      = useState({a:false,b:false,c:false});
  const [provider,   setProvider]   = useState("");
  const [signed,     setSigned]     = useState(false);
  const [signTime,   setSignTime]   = useState("");
  const [sheetOpen,  setSheetOpen]  = useState(false);

  const timerRef    = useRef(null);
  const genRef      = useRef(null);
  const t0          = useRef(null);
  const sectionRefs = useRef({});

  // ── generation ───────────────────────────────────────────────────────────────
  const runChecks = useCallback(()=>{
    CHECKS.forEach(c=>setCheckState(p=>({...p,[c.id]:"pending"})));
    let delay=150;
    CHECKS.forEach((c,i)=>{
      setTimeout(()=>{
        setCheckState(p=>({...p,[c.id]:"run"}));
        if(c.ms>0){
          setTimeout(()=>{
            setCheckState(p=>({...p,[c.id]:"done"}));
            if(i===CHECKS.length-1) setPhase("review");
          },c.ms);
        } else {
          setCheckState(p=>({...p,[c.id]:"done"}));
          setPhase("review");
        }
      },delay);
      delay+=c.ms+200;
    });
  },[]);

  const start=useCallback(()=>{
    setPhase("gen");
    setTexts({subjective:"",objective:"",assessment:"",plan:""});
    setActiveSec(0); setTokenCount(0); setElapsed(0);
    t0.current=Date.now();
    timerRef.current=setInterval(()=>setElapsed(Math.floor((Date.now()-t0.current)/1000)),1000);

    const chunks=KEYS.map(k=>tokenize(FULL_SOAP[k]));
    let si=0,ti=0,total=0;

    const tick=()=>{
      if(si>=KEYS.length){clearInterval(timerRef.current);setPhase("checks");runChecks();return;}
      if(ti>=chunks[si].length){
        si++;ti=0;setActiveSec(si);
        const nk=KEYS[si];
        if(nk&&sectionRefs.current[nk])
          sectionRefs.current[nk].scrollIntoView({behavior:"smooth",block:"nearest"});
        genRef.current=setTimeout(tick,80);
        return;
      }
      const burst=Math.min(Math.floor(Math.random()*4)+3,chunks[si].length-ti);
      const chunk=chunks[si].slice(ti,ti+burst).join("");ti+=burst;total+=burst;
      setTexts(p=>({...p,[KEYS[si]]:p[KEYS[si]]+chunk}));
      setTokenCount(total);
      const last=chunk.trim().slice(-1);
      genRef.current=setTimeout(tick,[".",":","!","?"].includes(last)?30+Math.random()*40:8+Math.random()*14);
    };
    tick();
  },[runChecks]);

  useEffect(()=>{start();},[]);
  useEffect(()=>()=>{clearInterval(timerRef.current);clearTimeout(genRef.current);},[]);
  useEffect(()=>{if(signed) setSheetOpen(false);},[signed]);

  // ── derived ──────────────────────────────────────────────────────────────────
  const warningsAcked = CHECKS.filter(c=>c.result==="warn").every(c=>acked[c.id]);
  const canSign       = boxes.a&&boxes.b&&boxes.c&&provider.trim().length>2&&warningsAcked;

  const doSign=useCallback(()=>{
    if(!canSign) return;
    setSigned(true);
    setSignTime(new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    setPhase("done");
  },[canSign]);

  const handleAck=useCallback(id=>setAcked(p=>({...p,[id]:true})),[]);

  // ── colours ──────────────────────────────────────────────────────────────────
  const leftBg  = light?"#f8f9fc":"#0b0c12";
  const rightBg = light?"#eef0f6":"#0f1018";
  const fg      = T.nameTxt;
  const fgSub   = T.valueTxt;
  const fgMute  = T.labelTxt;
  const divCol  = T.divider;
  const chipB   = T.chipBorder;
  const acc     = light?"rgba(22,95,178,0.75)" :"rgba(90,210,240,0.65)";
  const accBrd  = light?"rgba(22,95,178,0.22)" :"rgba(90,210,240,0.16)";
  const accDim  = light?"rgba(22,95,178,0.06)" :"rgba(90,210,240,0.05)";
  const warn    = light?"rgba(180,120,15,0.80)":"rgba(210,170,55,0.75)";
  const warnBrd = light?"rgba(180,120,15,0.20)":"rgba(210,170,55,0.18)";
  const ok      = light?"rgba(30,135,65,0.80)" :"rgba(75,195,110,0.75)";

  const unackedWarn = CHECKS.filter(c=>c.result==="warn"&&checkState[c.id]==="done"&&!acked[c.id]).length;

  const phaseLabel =
      phase==="idle"   ?"ready"
    : phase==="gen"    ?"generating"
    : phase==="checks" ?"verifying"
    : phase==="review" ?"review"
    : signed           ?"attested"
    :                   "review";

  // Stable prop bundles — each only rebuilds when its relevant slice of state changes.
  // complianceProps does NOT rebuild on token streaming; soapProps does NOT rebuild on attestation.
  const complianceProps = useMemo(()=>({
    checkState, acked, onAck:handleAck,
    phase, boxes, setBoxes, provider, setProvider,
    canSign, warningsAcked, doSign, signed, signTime,
    fg, fgMute, fgSub, divCol, chipB, acc, accBrd, accDim, warn, warnBrd, ok, mono,
  }),[checkState,acked,handleAck,phase,boxes,provider,canSign,warningsAcked,doSign,signed,signTime,light,mono]);

  const soapProps = useMemo(()=>({
    texts, activeSec, phase, sectionRefs, portrait, light,
    acc, fgMute, fgSub, fg, chipB, divCol, mono,
  }),[texts,activeSec,phase,portrait,light,mono]);

  // ── Shared topbar props ───────────────────────────────────────────────────────
  const topbarProps = {
    onBack, divCol, fgMute, topbarTxt:T.topbarTxt,
    acc, accBrd, accDim, chipB, warn,
    tokenCount, elapsed, phase, phaseLabel,
    sheetOpen, setSheetOpen, unackedWarn,
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // PORTRAIT LAYOUT
  // Full-width SOAP note. Compliance lives in a slide-up bottom sheet.
  // ══════════════════════════════════════════════════════════════════════════════
  if(portrait) return (
    <div
      className="ss-root"
      style={{
        width:W, height:H, background:T.bg, fontFamily:mono,
        display:"flex", flexDirection:"column",
        overflow:"hidden", position:"relative",
      }}
    >
      <Topbar leftBg={leftBg} portrait={true} {...topbarProps}/>

      {/* SOAP note — flex:1, overflow via .ss-soap-scroll class */}
      <div style={{
        flex:1, minHeight:0,         /* ← lets the flex child shrink so scroll works */
        background:leftBg,
        display:"flex", flexDirection:"column",
        overflow:"hidden",           /* ← clips the scroll child to this box */
      }}>
        <DisclosureBar portrait={true} divCol={divCol} accBrd={accBrd} fgMute={fgMute}/>
        <SoapSections {...soapProps}/>
      </div>

      {/* Backdrop */}
      {sheetOpen && (
        <div
          onClick={()=>setSheetOpen(false)}
          style={{
            position:"absolute", inset:0, zIndex:30,
            background:light?"rgba(0,0,0,0.18)":"rgba(0,0,0,0.52)",
          }}
        />
      )}

      {/* Bottom sheet */}
      <div style={{
        position:"absolute", left:0, right:0,
        bottom:sheetOpen?0:-(H*0.74),
        height:H*0.74,
        background:rightBg,
        borderTop:`1px solid ${divCol}`,
        borderRadius:"18px 18px 0 0",
        zIndex:40, display:"flex", flexDirection:"column",
        overflow:"hidden",
        transition:"bottom 0.38s cubic-bezier(0.32,0.72,0,1)",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.22)",
      }}>
        {/* Sheet header + drag handle */}
        <div className="ss-ui" style={{
          flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center",
          padding:"10px 20px 12px", borderBottom:`1px solid ${divCol}`,
        }}>
          <div style={{
            width:36, height:4, borderRadius:2,
            background:light?"rgba(0,0,0,0.15)":"rgba(255,255,255,0.15)",
            marginBottom:12,
          }}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
            <div>
              <div style={{color:fgSub,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase"}}>Compliance</div>
              <div style={{color:fgMute,fontSize:7.5,letterSpacing:"0.10em",marginTop:1}}>HIPAA · CA AB 3030 · Internal QA</div>
            </div>
            <button
              className="ss-btn"
              onClick={()=>setSheetOpen(false)}
              style={{background:"none",border:"none",color:fgMute,padding:"8px",cursor:"pointer",outline:"none",touchAction:"manipulation"}}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Sheet body — inSheet=true enables internal scroll so attestation is reachable */}
        <CompliancePanel inSheet={true} {...complianceProps}/>
      </div>

      {/* Attested confirmation bar (replaces sheet cue after signing) */}
      {signed && (
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, zIndex:29,
          background:light?"rgba(30,135,65,0.10)":"rgba(75,195,110,0.08)",
          borderTop:`1px solid ${light?"rgba(30,135,65,0.20)":"rgba(75,195,110,0.15)"}`,
          padding:"12px 22px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          animation:"ss-fadeIn 0.35s ease both",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:ok}}/>
            <span style={{color:ok,fontSize:8.5,letterSpacing:"0.12em"}}>Attested · {signTime}</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="ss-btn" style={{background:"none",border:`1px solid ${accBrd}`,borderRadius:6,padding:"7px 16px",color:acc,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",outline:"none",touchAction:"manipulation"}}>EHR</button>
            <button className="ss-btn" style={{background:"none",border:`1px solid ${chipB}`,borderRadius:6,padding:"7px 16px",color:fgSub,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",outline:"none",touchAction:"manipulation"}}>PDF</button>
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // LANDSCAPE LAYOUT
  // Two-column: scrollable SOAP note left, static compliance sidebar right.
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="ss-root"
      style={{
        width:W, height:H, background:T.bg, fontFamily:mono,
        display:"flex", flexDirection:"column",
        overflow:"hidden", position:"relative",
      }}
    >
      <Topbar leftBg={leftBg} portrait={false} {...topbarProps}/>

      <div style={{flex:1, minHeight:0, display:"flex", overflow:"hidden"}}>

        {/* LEFT — SOAP note, only scrollable element */}
        <div style={{
          flex:1, minWidth:0,
          background:leftBg,
          display:"flex", flexDirection:"column",
          overflow:"hidden",       /* clips the scroll child */
          borderRight:`1px solid ${divCol}`,
        }}>
          <DisclosureBar portrait={false} divCol={divCol} accBrd={accBrd} fgMute={fgMute}/>
          <SoapSections {...soapProps}/>
        </div>

        {/* RIGHT — compliance sidebar, NO scroll */}
        <div style={{
          width:310, flexShrink:0,
          background:rightBg,
          display:"flex", flexDirection:"column",
          overflow:"hidden",       /* sidebar is clipped; content does not scroll */
          animation:"ss-slideR 0.4s ease both",
        }}>
          <SidebarHeader divCol={divCol} fgSub={fgSub} fgMute={fgMute}/>
          {/* inSheet=false → CompliancePanel renders with overflow:visible, no scrollbar */}
          <CompliancePanel inSheet={false} {...complianceProps}/>
        </div>
      </div>
    </div>
  );
}