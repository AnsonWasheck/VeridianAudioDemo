// SoapScreen.jsx
// California AB 3030: AI-generated clinical notes require mandatory clinician
// review and attestation before finalization or EHR transmission.
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { DARK, LIGHT } from "./App";

// ── iOS / orientation helper ──────────────────────────────────────────────────
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

// ── CSS injected at module level — runs once when the module loads, never again.
// This is the key fix: keeping it outside React means token-update re-renders
// cannot possibly touch it or reset any running animations.
(function injectSoapCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("soap-screen-styles")) return;
  const s = document.createElement("style");
  s.id = "soap-screen-styles";
  s.textContent = `
@keyframes soap-spin        { to { transform: rotate(360deg); } }
@keyframes soap-blink       { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes soap-pulse       { 0%,100%{opacity:1} 50%{opacity:0.35} }
@keyframes soap-fadeIn      { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes soap-slideRight  { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }

/* iOS: no blue tap flash */
* { -webkit-tap-highlight-color: transparent; }

/* UI chrome: no text selection; SOAP body: allow selection */
.soap-ui   { -webkit-user-select:none; user-select:none; }
.soap-body { -webkit-user-select:text; user-select:text; }

/* Momentum scroll containers */
.soap-scroll, .soap-sidebar {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  overflow-y: auto;
}

/* SOAP pane: thin custom scrollbar */
.soap-scroll::-webkit-scrollbar       { width:3px; }
.soap-scroll::-webkit-scrollbar-track { background:transparent; }
.soap-scroll.dark-scroll::-webkit-scrollbar-thumb  { background:rgba(255,255,255,0.10); border-radius:2px; }
.soap-scroll.light-scroll::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.12);        border-radius:2px; }

/* Sidebar: hide scrollbar entirely */
.soap-sidebar::-webkit-scrollbar { display:none; }
.soap-sidebar { -ms-overflow-style:none; scrollbar-width:none; }

/* Tap feedback */
.tap-btn:active { opacity:0.52!important; transform:scale(0.97)!important; }

/* Section entrance — animationFillMode:both means it locks to the final state
   after completing, so a parent re-render that doesn't change the element's
   key won't restart the animation. */
.soap-section {
  animation: soap-fadeIn 0.35s ease both;
}
`;
  document.head.appendChild(s);
}());

// =============================================================================
// ALL SUB-COMPONENTS ARE DEFINED AT MODULE SCOPE + wrapped in memo().
//
// Why this fixes the flash:
//   Before — Topbar/SoapSections/CompliancePanel were arrow functions defined
//   inside SoapScreen's render body. Every setTexts() call recreated those
//   function objects with new identities. React saw "different component type"
//   and unmounted + remounted the whole subtree, restarting every CSS animation.
//
//   After  — They are stable module-level declarations. React reconciles them
//   as the same component type across renders, only diffing props. memo() adds
//   a second layer: if props haven't changed, the component doesn't even re-render.
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
    <div className="soap-ui" style={{
      flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between",
      padding: portrait ? "18px 20px 14px" : "18px 26px 16px",
      borderBottom:`1px solid ${divCol}`,
      background:leftBg, zIndex:20,
    }}>
      <button className="tap-btn" onClick={onBack} style={{
        display:"flex", alignItems:"center", gap:6,
        background:"none", border:"none", color:fgMute,
        fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
        cursor:"pointer", outline:"none", padding:"6px 0", WebkitAppearance:"none",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={topbarTxt} strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span style={{color:topbarTxt,fontSize:9.5,letterSpacing:"0.22em",textTransform:"uppercase"}}>Veridian</span>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:portrait?10:14}}>
        {tokenCount > 0 && (
          <span style={{color:fgMute,fontSize:8,letterSpacing:"0.12em"}}>
            {tokenCount.toLocaleString()} tok{phase==="gen"?` · ${elapsed}s`:""}
          </span>
        )}
        {portrait && (phase==="checks"||phase==="review"||phase==="done") && (
          <button className="tap-btn" onClick={()=>setSheetOpen(o=>!o)} style={{
            position:"relative", display:"flex", alignItems:"center", gap:5,
            background:sheetOpen?accDim:"transparent",
            border:`1px solid ${sheetOpen?accBrd:chipB}`,
            borderRadius:5, padding:"5px 10px",
            color:sheetOpen?acc:fgMute,
            fontSize:8, letterSpacing:"0.14em", textTransform:"uppercase",
            cursor:"pointer", outline:"none", WebkitAppearance:"none",
            transition:"background 0.2s,border-color 0.2s,color 0.2s",
          }}>
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
    <div className="soap-ui" style={{
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

// ── SoapSection — one SOAP section. Stable key = animation fires once on mount only.
const SoapSection = memo(function SoapSection({
  label, text, isActive, isLast,
  acc, fgMute, fgSub, fg, chipB, divCol, portrait, mono, animDelay,
}) {
  const hasText = text.length > 0;
  return (
    <div className="soap-section" style={{marginBottom:isLast?0:36, animationDelay:`${animDelay}s`}}>
      {/* label row */}
      <div className="soap-ui" style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
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
            width:4,height:4,borderRadius:"50%",background:acc,flexShrink:0,
            animation:"soap-pulse 1s ease-in-out infinite",
          }}/>
        )}
      </div>

      {/* text — selectable on iOS */}
      <div className="soap-body" style={{
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
        {hasText?text:"—"}
        {isActive && (
          <span style={{
            display:"inline-block",width:6,height:12,
            background:acc,marginLeft:2,verticalAlign:"text-bottom",
            animation:"soap-blink 0.9s ease-in-out infinite",
          }}/>
        )}
      </div>

      {!isLast && <div style={{height:1,background:divCol,marginTop:28}}/>}
    </div>
  );
});

// ── SoapSections scroll wrapper ───────────────────────────────────────────────
const SoapSections = memo(function SoapSections({
  texts, activeSec, phase, sectionRefs, portrait, light,
  acc, fgMute, fgSub, fg, chipB, divCol, mono,
}) {
  return (
    <div
      className={`soap-scroll ${light?"light-scroll":"dark-scroll"}`}
      style={{flex:1, padding:portrait?"24px 20px 40px":"28px 32px 40px"}}
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
          {st==="run"     && <div style={{width:10,height:10,border:`1.5px solid ${acc}`,borderTopColor:"transparent",borderRadius:"50%",animation:"soap-spin 0.7s linear infinite"}}/>}
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
            <button className="tap-btn" onClick={onAck} style={{
              background:"none",border:`1px solid ${warnBrd}`,borderRadius:5,
              padding:"6px 12px",color:warn,fontSize:8,letterSpacing:"0.14em",
              textTransform:"uppercase",cursor:"pointer",outline:"none",WebkitAppearance:"none",
            }}>Acknowledge</button>
          )}
          {isWarn && acked && <span style={{color:fgMute,fontSize:8,letterSpacing:"0.10em"}}>acknowledged</span>}
        </div>
      )}
    </div>
  );
});

// ── CompliancePanel ───────────────────────────────────────────────────────────
const CompliancePanel = memo(function CompliancePanel(p) {
  const {
    inSheet, checkState, acked, onAck,
    phase, boxes, setBoxes, provider, setProvider,
    canSign, warningsAcked, doSign, signed, signTime,
    fg, fgMute, fgSub, divCol, chipB, acc, accBrd, accDim, warn, warnBrd, ok, mono,
  } = p;
  return (
    <div className="soap-sidebar" style={{flex:1,padding:inSheet?"16px 20px 32px":"18px 20px 28px"}}>
      {CHECKS.map(c=>(
        <CheckRow
          key={c.id} check={c}
          st={checkState[c.id]||"pending"}
          acked={!!acked[c.id]} onAck={()=>onAck(c.id)}
          fg={fg} fgMute={fgMute} fgSub={fgSub}
          acc={acc} warn={warn} warnBrd={warnBrd} ok={ok}
        />
      ))}

      {(phase==="review"||phase==="done") && (
        <div style={{borderTop:`1px solid ${divCol}`,paddingTop:20,marginTop:4,animation:"soap-fadeIn 0.35s ease both"}}>
          <div style={{color:fgSub,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>Attestation</div>

          {!signed ? (
            <>
              {[
                {k:"a",txt:"I have reviewed this note for accuracy and completeness."},
                {k:"b",txt:"Content reflects the clinical encounter as conducted."},
                {k:"c",txt:"I accept clinical responsibility for this AI-generated note."},
              ].map(item=>(
                <div key={item.k} className="tap-btn soap-ui"
                  onClick={()=>setBoxes(prev=>({...prev,[item.k]:!prev[item.k]}))}
                  style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:14,cursor:"pointer",padding:"2px 0"}}
                >
                  <div style={{
                    width:15,height:15,borderRadius:3,flexShrink:0,marginTop:1,
                    border:`1px solid ${boxes[item.k]?acc:chipB}`,
                    background:boxes[item.k]?accDim:"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"border-color 0.2s,background 0.2s",
                  }}>
                    {boxes[item.k]&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={acc} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
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
                    fontSize:"16px", /* prevents iOS zoom on focus */
                    outline:"none", fontFamily:mono, WebkitAppearance:"none",
                  }}
                />
              </div>

              {!warningsAcked && (
                <div style={{color:warn,fontSize:8,letterSpacing:"0.08em",marginBottom:12}}>
                  Acknowledge warnings above first.
                </div>
              )}

              <button className="tap-btn" onClick={doSign} disabled={!canSign} style={{
                width:"100%",
                background:canSign?accDim:"none",
                border:`1px solid ${canSign?accBrd:chipB}`,
                borderRadius:8, padding:"13px 0",
                color:canSign?acc:fgSub,
                fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
                cursor:canSign?"pointer":"not-allowed", outline:"none",
                transition:"border-color 0.2s,color 0.2s,background 0.2s",
                opacity:canSign?1:0.32, WebkitAppearance:"none",
              }}>
                Attest &amp; Finalize
              </button>
            </>
          ) : (
            <div style={{animation:"soap-fadeIn 0.35s ease both"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:ok}}/>
                <div style={{color:fg,fontSize:9.5,letterSpacing:"0.04em"}}>{provider}</div>
              </div>
              <div style={{color:fgMute,fontSize:8,letterSpacing:"0.10em",marginBottom:20}}>{signTime} · audit logged</div>
              <div style={{display:"flex",gap:8}}>
                <button className="tap-btn" style={{flex:1,background:"none",border:`1px solid ${accBrd}`,borderRadius:7,padding:"11px 0",color:acc,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",outline:"none",WebkitAppearance:"none"}}>EHR</button>
                <button className="tap-btn" style={{flex:1,background:"none",border:`1px solid ${chipB}`,borderRadius:7,padding:"11px 0",color:fgSub,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",outline:"none",WebkitAppearance:"none"}}>PDF</button>
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
    <div className="soap-ui" style={{flexShrink:0,padding:"14px 20px 12px",borderBottom:`1px solid ${divCol}`}}>
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
  const [phase,       setPhase]       = useState("idle");
  const [texts,       setTexts]       = useState({subjective:"",objective:"",assessment:"",plan:""});
  const [activeSec,   setActiveSec]   = useState(0);
  const [tokenCount,  setTokenCount]  = useState(0);
  const [elapsed,     setElapsed]     = useState(0);
  const [checkState,  setCheckState]  = useState({});
  const [acked,       setAcked]       = useState({});
  const [boxes,       setBoxes]       = useState({a:false,b:false,c:false});
  const [provider,    setProvider]    = useState("");
  const [signed,      setSigned]      = useState(false);
  const [signTime,    setSignTime]    = useState("");
  const [sheetOpen,   setSheetOpen]   = useState(false);

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
    setActiveSec(0);setTokenCount(0);setElapsed(0);
    t0.current=Date.now();
    timerRef.current=setInterval(()=>setElapsed(Math.floor((Date.now()-t0.current)/1000)),1000);

    const chunks=KEYS.map(k=>tokenize(FULL_SOAP[k]));
    let si=0,ti=0,total=0;

    const tick=()=>{
      if(si>=KEYS.length){clearInterval(timerRef.current);setPhase("checks");runChecks();return;}
      if(ti>=chunks[si].length){
        si++;ti=0;setActiveSec(si);
        const nk=KEYS[si];
        if(nk&&sectionRefs.current[nk]) sectionRefs.current[nk].scrollIntoView({behavior:"smooth",block:"nearest"});
        genRef.current=setTimeout(tick,80);return;
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

  // Stable compliance props object — only rebuilds when compliance-related state changes,
  // NOT when texts/tokenCount/elapsed change. This prevents CompliancePanel from re-rendering
  // during token streaming.
  const complianceProps = useMemo(()=>({
    checkState,acked,onAck:handleAck,
    phase,boxes,setBoxes,provider,setProvider,
    canSign,warningsAcked,doSign,signed,signTime,
    fg,fgMute,fgSub,divCol,chipB,acc,accBrd,accDim,warn,warnBrd,ok,mono,
  }),[
    checkState,acked,handleAck,
    phase,boxes,provider,canSign,warningsAcked,doSign,signed,signTime,
    light,mono
  ]);

  // Stable SOAP display props — rebuilds on texts/activeSec/phase changes but
  // NOT on compliance state changes.
  const soapProps = useMemo(()=>({
    texts,activeSec,phase,sectionRefs,portrait,light,
    acc,fgMute,fgSub,fg,chipB,divCol,mono,
  }),[texts,activeSec,phase,portrait,light,mono]);

  // ── PORTRAIT ────────────────────────────────────────────────────────────────
  if(portrait) return (
    <div style={{width:W,height:H,background:T.bg,fontFamily:mono,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <Topbar
        onBack={onBack} portrait={true}
        leftBg={leftBg} divCol={divCol} fgMute={fgMute} topbarTxt={T.topbarTxt}
        acc={acc} accBrd={accBrd} accDim={accDim} chipB={chipB} warn={warn}
        tokenCount={tokenCount} elapsed={elapsed} phase={phase} phaseLabel={phaseLabel}
        sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} unackedWarn={unackedWarn}
      />

      <div style={{flex:1,background:leftBg,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <DisclosureBar portrait={true} divCol={divCol} accBrd={accBrd} fgMute={fgMute}/>
        <SoapSections {...soapProps}/>
      </div>

      {/* backdrop */}
      {sheetOpen&&(
        <div onClick={()=>setSheetOpen(false)} style={{
          position:"absolute",inset:0,zIndex:30,
          background:light?"rgba(0,0,0,0.18)":"rgba(0,0,0,0.52)",
        }}/>
      )}

      {/* bottom sheet */}
      <div style={{
        position:"absolute",left:0,right:0,
        bottom:sheetOpen?0:-(H*0.74),
        height:H*0.74,
        background:rightBg,
        borderTop:`1px solid ${divCol}`,
        borderRadius:"18px 18px 0 0",
        zIndex:40,display:"flex",flexDirection:"column",overflow:"hidden",
        transition:"bottom 0.38s cubic-bezier(0.32,0.72,0,1)",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.22)",
      }}>
        <div className="soap-ui" style={{
          flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",
          padding:"10px 20px 12px",borderBottom:`1px solid ${divCol}`,
        }}>
          <div style={{width:36,height:4,borderRadius:2,background:light?"rgba(0,0,0,0.15)":"rgba(255,255,255,0.15)",marginBottom:12}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%"}}>
            <div>
              <div style={{color:fgSub,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase"}}>Compliance</div>
              <div style={{color:fgMute,fontSize:7.5,letterSpacing:"0.10em",marginTop:1}}>HIPAA · CA AB 3030 · Internal QA</div>
            </div>
            <button className="tap-btn" onClick={()=>setSheetOpen(false)} style={{background:"none",border:"none",color:fgMute,padding:"6px",cursor:"pointer",outline:"none"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <CompliancePanel inSheet={true} {...complianceProps}/>
      </div>

      {/* signed bar */}
      {signed&&(
        <div style={{
          position:"absolute",bottom:0,left:0,right:0,zIndex:29,
          background:light?"rgba(30,135,65,0.10)":"rgba(75,195,110,0.08)",
          borderTop:`1px solid ${light?"rgba(30,135,65,0.20)":"rgba(75,195,110,0.15)"}`,
          padding:"12px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",
          animation:"soap-fadeIn 0.35s ease both",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:ok}}/>
            <span style={{color:ok,fontSize:8.5,letterSpacing:"0.12em"}}>Attested · {signTime}</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="tap-btn" style={{background:"none",border:`1px solid ${accBrd}`,borderRadius:6,padding:"7px 16px",color:acc,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",outline:"none"}}>EHR</button>
            <button className="tap-btn" style={{background:"none",border:`1px solid ${chipB}`,borderRadius:6,padding:"7px 16px",color:fgSub,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",outline:"none"}}>PDF</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── LANDSCAPE ────────────────────────────────────────────────────────────────
  return (
    <div style={{width:W,height:H,background:T.bg,fontFamily:mono,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
      <Topbar
        onBack={onBack} portrait={false}
        leftBg={leftBg} divCol={divCol} fgMute={fgMute} topbarTxt={T.topbarTxt}
        acc={acc} accBrd={accBrd} accDim={accDim} chipB={chipB} warn={warn}
        tokenCount={tokenCount} elapsed={elapsed} phase={phase} phaseLabel={phaseLabel}
        sheetOpen={false} setSheetOpen={setSheetOpen} unackedWarn={unackedWarn}
      />

      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
        <div style={{flex:1,background:leftBg,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:`1px solid ${divCol}`}}>
          <DisclosureBar portrait={false} divCol={divCol} accBrd={accBrd} fgMute={fgMute}/>
          <SoapSections {...soapProps}/>
        </div>

        <div style={{width:310,flexShrink:0,background:rightBg,display:"flex",flexDirection:"column",overflow:"hidden",animation:"soap-slideRight 0.4s ease both"}}>
          <SidebarHeader divCol={divCol} fgSub={fgSub} fgMute={fgMute}/>
          <CompliancePanel inSheet={false} {...complianceProps}/>
        </div>
      </div>
    </div>
  );
}