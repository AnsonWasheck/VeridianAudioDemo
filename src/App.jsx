import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const W    = 1366;
const H    = 1024;
const STEP = 4;
const CH   = 220; // canvas height

const LAYER_DEFS = [
  { fills:["#3b1fa8","#6234d4","#4a22bc"], alpha:0.72, freqs:[0.55,1.1,1.8,0.38], amps:[0.38,0.24,0.14,0.28], speed:1.4 },
  { fills:["#5b2ce0","#7b4af5","#4fc3e8"], alpha:0.65, freqs:[0.62,1.25,2.1,0.44], amps:[0.30,0.20,0.11,0.23], speed:1.9 },
  { fills:["#38b8e8","#62d8f5","#4ab8d8"], alpha:0.55, freqs:[0.70,1.45,2.4,0.52], amps:[0.22,0.16,0.09,0.18], speed:2.5 },
  { fills:["#7ae8ff","#a8f0ff","#60d8f0"], alpha:0.28, freqs:[0.85,1.7,2.8,0.6],  amps:[0.15,0.11,0.07,0.13], speed:3.2 },
];

// ─── Theme tokens (module-level — never recreated) ────────────────────────────
const DARK = {
  bg:"#08090f", cardBg:"#0d0e13", cardBorder:"rgba(255,255,255,0.07)",
  cardBorderRec:"rgba(90,200,230,0.18)",
  cardShadow:"0 1px 0 rgba(0,0,0,0.95),0 8px 22px rgba(0,0,0,0.60),0 22px 55px rgba(0,0,0,0.38)",
  cardShadowRec:"0 1px 0 rgba(0,0,0,0.95),0 8px 22px rgba(0,0,0,0.60),0 22px 55px rgba(50,160,220,0.08)",
  iconBox:"#14151c", iconBoxBorder:"rgba(255,255,255,0.06)", iconStroke:"rgba(255,255,255,0.38)",
  nameTxt:"rgba(255,255,255,0.84)", labelTxt:"rgba(255,255,255,0.22)", labelTxtRec:"rgba(90,210,240,0.52)",
  valueTxt:"rgba(255,255,255,0.54)", divider:"rgba(255,255,255,0.05)",
  dividerRec:"linear-gradient(90deg,rgba(90,210,240,0.12),rgba(255,255,255,0.04),transparent)",
  chip:"rgba(255,255,255,0.025)", chipBorder:"rgba(255,255,255,0.055)",
  tagBg:"rgba(90,210,240,0.07)", tagBorder:"rgba(90,210,240,0.16)", tagTxt:"rgba(90,210,240,0.72)",
  sectionHead:"rgba(255,255,255,0.14)", topbarTxt:"rgba(255,255,255,0.28)", topbarSub:"rgba(255,255,255,0.12)",
  glowCenter:"rgba(45,20,140,0.07)", glowRight:"rgba(30,130,190,0.04)", glowLeft:"rgba(65,25,165,0.04)",
  btnBg:"#0d0e13", btnBorder:"rgba(255,255,255,0.07)", btnBorderRec:"rgba(90,210,240,0.20)",
  btnShadow:"0 1px 0 rgba(0,0,0,0.95),0 6px 18px rgba(0,0,0,0.65),0 16px 40px rgba(0,0,0,0.35)",
  btnShadowRec:"0 1px 0 rgba(0,0,0,0.95),0 6px 18px rgba(0,0,0,0.65),0 16px 40px rgba(50,160,220,0.09)",
  micStroke:"rgba(255,255,255,0.34)", micStrokeRec:"rgba(170,232,248,0.88)",
  ringColor:"rgba(90,210,240,", hapticIdle:"rgba(255,255,255,0.09)",
  hapticActive:"rgba(100,218,252,", hapticGlow:"rgba(90,210,240,0.65)",
  hideBtn:"rgba(255,255,255,0.05)", hideBtnTxt:"rgba(255,255,255,0.28)", hideBtnBorder:"rgba(255,255,255,0.07)",
  timerTxt:"rgba(255,255,255,0.22)", timerTxtRec:"rgba(90,210,240,0.55)",
  circleBg:"#0d0e13", circleBorder:"rgba(255,255,255,0.08)", circleTxt:"rgba(255,255,255,0.38)",
  circleShadow:"0 1px 0 rgba(0,0,0,0.9),0 5px 14px rgba(0,0,0,0.5),0 12px 30px rgba(0,0,0,0.28)",
  circleLabelTxt:"rgba(255,255,255,0.22)",
  dangerBorder:"rgba(210,65,65,0.22)", dangerTxt:"rgba(210,90,90,0.75)",
  primaryBorder:"rgba(90,210,240,0.22)", primaryTxt:"rgba(90,210,240,0.75)",
};

const LIGHT = {
  bg:"#f1f3f8", cardBg:"#ffffff", cardBorder:"rgba(0,0,0,0.09)",
  cardBorderRec:"rgba(25,100,185,0.25)",
  cardShadow:"0 1px 0 rgba(0,0,0,0.05),0 6px 20px rgba(0,0,0,0.07),0 20px 50px rgba(0,0,0,0.05)",
  cardShadowRec:"0 1px 0 rgba(0,0,0,0.05),0 6px 20px rgba(0,0,0,0.07),0 20px 50px rgba(25,100,185,0.09)",
  iconBox:"#f0f2f7", iconBoxBorder:"rgba(0,0,0,0.08)", iconStroke:"rgba(0,0,0,0.42)",
  nameTxt:"rgba(0,0,0,0.84)", labelTxt:"rgba(0,0,0,0.30)", labelTxtRec:"rgba(22,95,178,0.68)",
  valueTxt:"rgba(0,0,0,0.60)", divider:"rgba(0,0,0,0.065)",
  dividerRec:"linear-gradient(90deg,rgba(22,95,178,0.15),rgba(0,0,0,0.04),transparent)",
  chip:"rgba(0,0,0,0.028)", chipBorder:"rgba(0,0,0,0.068)",
  tagBg:"rgba(22,95,178,0.07)", tagBorder:"rgba(22,95,178,0.18)", tagTxt:"rgba(22,95,178,0.80)",
  sectionHead:"rgba(0,0,0,0.22)", topbarTxt:"rgba(0,0,0,0.38)", topbarSub:"rgba(0,0,0,0.20)",
  glowCenter:"rgba(120,135,210,0.10)", glowRight:"rgba(60,140,205,0.06)", glowLeft:"rgba(100,85,210,0.06)",
  btnBg:"#ffffff", btnBorder:"rgba(0,0,0,0.09)", btnBorderRec:"rgba(22,95,178,0.26)",
  btnShadow:"0 1px 0 rgba(0,0,0,0.06),0 5px 16px rgba(0,0,0,0.08),0 14px 38px rgba(0,0,0,0.05)",
  btnShadowRec:"0 1px 0 rgba(0,0,0,0.06),0 5px 16px rgba(0,0,0,0.08),0 14px 38px rgba(22,95,178,0.10)",
  micStroke:"rgba(0,0,0,0.32)", micStrokeRec:"rgba(22,85,170,0.88)",
  ringColor:"rgba(22,95,178,", hapticIdle:"rgba(0,0,0,0.13)",
  hapticActive:"rgba(22,95,178,", hapticGlow:"rgba(22,95,178,0.40)",
  hideBtn:"rgba(0,0,0,0.04)", hideBtnTxt:"rgba(0,0,0,0.34)", hideBtnBorder:"rgba(0,0,0,0.08)",
  timerTxt:"rgba(0,0,0,0.22)", timerTxtRec:"rgba(22,95,178,0.55)",
  circleBg:"#ffffff", circleBorder:"rgba(0,0,0,0.09)", circleTxt:"rgba(0,0,0,0.38)",
  circleShadow:"0 1px 0 rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.07),0 10px 24px rgba(0,0,0,0.04)",
  circleLabelTxt:"rgba(0,0,0,0.28)",
  dangerBorder:"rgba(190,50,50,0.20)", dangerTxt:"rgba(185,45,45,0.72)",
  primaryBorder:"rgba(22,95,178,0.22)", primaryTxt:"rgba(22,95,178,0.78)",
};

// ─── Pre-compute edge weight LUT (avoid per-pixel Math.pow/Math.sin every frame)
const EDGE_LUT = new Float32Array(Math.ceil(W / STEP) + 2);
(function buildLut() {
  const steps = Math.ceil(W / STEP) + 1;
  for (let i = 0; i <= steps; i++) {
    const n = (i * STEP) / W;
    const s = Math.sin(n * Math.PI);
    EDGE_LUT[i] = s * s * Math.sqrt(s); // ≈ Math.pow(sin,1.8) but faster
  }
})();

// ─── Waveform — isolated, never re-renders from parent state ─────────────────
const Waveform = memo(function Waveform({ recording, light }) {
  const canvasRef  = useRef(null);
  // All mutable draw state lives in ONE ref — no closures rebuilt each frame
  const stateRef   = useRef({ time: 0, raf: null, energy: 0, recording, as: light ? 0.68 : 1.0, grads: null });

  // Sync props into ref without causing re-renders
  useEffect(() => { stateRef.current.recording = recording; }, [recording]);
  useEffect(() => { stateRef.current.as = light ? 0.68 : 1.0; stateRef.current.grads = null; }, [light]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width  = W;
    canvas.height = CH;
    const ctx = canvas.getContext("2d", { alpha: true });
    const s   = stateRef.current;

    // Build gradients once (reuse every frame — only rebuild on light change)
    function buildGrads() {
      s.grads = LAYER_DEFS.map(layer => {
        const g = ctx.createLinearGradient(0, 0, W, 0);
        layer.fills.forEach((c, i) => g.addColorStop(i / (layer.fills.length - 1), c));
        return g;
      });
      // Shimmer gradient
      s.shimGrad = ctx.createLinearGradient(0, 0, W, 0);
      s.shimGrad.addColorStop(0,    "rgba(200,245,255,0)");
      s.shimGrad.addColorStop(0.15, "rgba(200,245,255,0.65)");
      s.shimGrad.addColorStop(0.5,  "rgba(255,255,255,0.85)");
      s.shimGrad.addColorStop(0.85, "rgba(200,245,255,0.65)");
      s.shimGrad.addColorStop(1,    "rgba(200,245,255,0)");
    }
    buildGrads();

    // Inline wave computation — avoids function call overhead per sample
    function yTop(layer, xi, t, em) {
      const n  = (xi * STEP) / W;
      const ew = EDGE_LUT[xi];
      let d = 0;
      const { freqs, amps, speed } = layer;
      d += Math.sin(n * 6.283 * freqs[0] + t * speed + 0)     * amps[0] * em;
      d += Math.sin(n * 6.283 * freqs[1] + t * speed + 1.1)   * amps[1] * em;
      d += Math.sin(n * 6.283 * freqs[2] + t * speed + 2.2)   * amps[2] * em;
      d += Math.sin(n * 6.283 * freqs[3] + t * speed + 3.3)   * amps[3] * em;
      return (0.5 - d * ew) * CH;
    }
    function yBot(layer, xi, t, em) {
      const n  = (xi * STEP) / W;
      const ew = EDGE_LUT[xi];
      let d = 0;
      const { freqs, amps, speed } = layer;
      const sp = speed * 0.85;
      d += Math.sin(n * 6.283 * freqs[0] + t * sp + 4.084)  * amps[0] * em;
      d += Math.sin(n * 6.283 * freqs[1] + t * sp + 9.614)  * amps[1] * em;
      d += Math.sin(n * 6.283 * freqs[2] + t * sp + 11.237) * amps[2] * em;
      d += Math.sin(n * 6.283 * freqs[3] + t * sp + 7.782)  * amps[3] * em;
      return (0.5 + d * ew) * CH;
    }

    const steps = Math.ceil(W / STEP);

    function draw() {
      // Rebuild grads if flagged null (light mode switch)
      if (!s.grads) buildGrads();

      s.time   += s.recording ? 0.022 : 0.009;
      s.energy += ((s.recording ? 1.0 : 0.28) - s.energy) * 0.04;
      const em  = 0.28 + s.energy * 0.72;
      const as  = s.as;
      const t   = s.time;

      ctx.clearRect(0, 0, W, CH);

      LAYER_DEFS.forEach((layer, li) => {
        const grad = s.grads[li];

        // ── Fill shape ──
        ctx.globalAlpha = layer.alpha * as;
        ctx.beginPath();
        for (let xi = 0; xi <= steps; xi++) {
          const px = xi * STEP;
          const py = yTop(layer, xi, t, em);
          xi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        for (let xi = steps; xi >= 0; xi--) {
          ctx.lineTo(xi * STEP, yBot(layer, xi, t, em));
        }
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // ── Top stroke (no shadowBlur — removed for perf) ──
        ctx.globalAlpha = layer.alpha * as * 0.85;
        ctx.strokeStyle = layer.fills[layer.fills.length - 1];
        ctx.lineWidth   = li < 2 ? 2 : 1.5;
        ctx.lineJoin    = "round";
        ctx.lineCap     = "round";
        ctx.beginPath();
        for (let xi = 0; xi <= steps; xi++) {
          const px = xi * STEP, py = yTop(layer, xi, t, em);
          xi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      });

      // ── Shimmer line (single, no shadow) ──
      ctx.globalAlpha = 0.45 * as;
      ctx.strokeStyle = s.shimGrad;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      const sl = LAYER_DEFS[2];
      for (let xi = 0; xi <= steps; xi++) {
        const px = xi * STEP, py = yTop(sl, xi, t, em) - 1;
        xi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Reset globalAlpha once at end (avoid cascading state)
      ctx.globalAlpha = 1;

      s.raf = requestAnimationFrame(draw);
    }

    s.raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(s.raf);
  }, []); // ← intentionally empty: draw loop reads from stateRef, not props

  return (
    <canvas
      ref={canvasRef}
      style={{ width:"100%", height:"100%", display:"block", willChange:"contents" }}
    />
  );
});

// ─── Haptic dots + timer — memo so parent re-renders don't touch the canvas ──
const HapticDotAndTimer = memo(function HapticDotAndTimer({ recording, elapsedRef, T }) {
  const [display, setDisplay] = useState("0:00");

  useEffect(() => {
    const id = setInterval(() => {
      const s  = Math.floor(elapsedRef.current);
      const m  = Math.floor(s / 60);
      const ss = String(s % 60).padStart(2, "0");
      setDisplay(`${m}:${ss}`);
    }, 500); // 500ms is fine for mm:ss display — halves the interval overhead
    return () => clearInterval(id);
  }, [elapsedRef]);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, height:20 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: recording ? 5 : 3,
            height: recording ? 5 : 3,
            borderRadius: "50%",
            background: recording ? `${T.hapticActive}${0.9 - i * 0.2})` : T.hapticIdle,
            boxShadow: recording ? `0 0 ${7 + i * 2}px ${T.hapticGlow}` : "none",
            transition: "all 0.4s ease",
            animation: recording ? `hpop 1.1s ease-in-out ${i * 0.16}s infinite` : "none",
          }} />
        ))}
      </div>
      <div style={{
        color: recording ? T.timerTxtRec : T.timerTxt,
        fontSize: 11,
        letterSpacing: "0.22em",
        fontVariantNumeric: "tabular-nums",
        transition: "color 0.5s ease",
        opacity: recording || display !== "0:00" ? 1 : 0.4,
      }}>
        {display}
      </div>
    </div>
  );
});

// ─── Patient card — memo, only re-renders when recording or T changes ─────────
const PatientCard = memo(function PatientCard({ recording, T }) {
  const [hidden, setHidden] = useState(false);

  const lbl = useMemo(() => ({
    color: recording ? T.labelTxtRec : T.labelTxt,
    fontSize:8, letterSpacing:"0.20em", textTransform:"uppercase",
    minWidth:58, flexShrink:0, transition:"color 0.6s ease", lineHeight:"1.4",
  }), [recording, T]);

  const val = { color:T.valueTxt, fontSize:11, letterSpacing:"0.01em", lineHeight:"1.4" };

  const Row = useCallback(({label, value}) => (
    <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
      <div style={lbl}>{label}</div>
      <div style={val}>{value}</div>
    </div>
  ), [lbl]); // eslint-disable-line

  const toggleHidden = useCallback(() => setHidden(h => !h), []);

  return (
    <div style={{
      background:T.cardBg,
      border:`1px solid ${recording ? T.cardBorderRec : T.cardBorder}`,
      borderRadius:11, width:520,
      boxShadow: recording ? T.cardShadowRec : T.cardShadow,
      transition:"box-shadow 0.8s ease,border-color 0.8s ease,background 0.5s ease",
      position:"relative", overflow:"hidden",
      willChange:"box-shadow",
    }}>
      {/* Recording wash */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(50,22,150,0.05) 0%,rgba(60,180,225,0.03) 100%)",opacity:recording?1:0,transition:"opacity 0.8s ease",pointerEvents:"none",borderRadius:11}}/>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 18px",borderBottom:`1px solid ${hidden?T.divider:"transparent"}`,transition:"border-color 0.3s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:7,background:T.iconBox,border:`1px solid ${T.iconBoxBorder}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 0 rgba(0,0,0,0.4),0 3px 8px rgba(0,0,0,0.18)",flexShrink:0}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.iconStroke} strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{color:T.nameTxt,fontSize:13.5,fontWeight:500,letterSpacing:"0.01em"}}>Eleanor Voss</span>
              {recording && (
                <span style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:T.tagTxt,boxShadow:`0 0 5px ${T.tagTxt}`,animation:"statusPulse 2s ease-in-out infinite"}}/>
                  <span style={{color:T.tagTxt,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase"}}>Live</span>
                </span>
              )}
            </div>
            <div style={{color:recording?T.labelTxtRec:T.labelTxt,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",marginTop:1,transition:"color 0.6s ease"}}>Patient · Internal Medicine</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{background:T.chip,border:`1px solid ${T.chipBorder}`,borderRadius:5,padding:"4px 10px"}}>
            <div style={{color:recording?T.labelTxtRec:T.labelTxt,fontSize:7,letterSpacing:"0.20em",textTransform:"uppercase",marginBottom:1,transition:"color 0.6s ease"}}>MRN</div>
            <div style={{color:T.valueTxt,fontSize:10.5,letterSpacing:"0.03em"}}>MRN-0042817</div>
          </div>
          <button onClick={toggleHidden} style={{background:T.hideBtn,border:`1px solid ${T.hideBtnBorder}`,borderRadius:5,padding:"5px 10px",color:T.hideBtnTxt,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",outline:"none",boxShadow:"0 1px 0 rgba(0,0,0,0.3),0 3px 8px rgba(0,0,0,0.15)",display:"flex",alignItems:"center",gap:5}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {hidden
                ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
              }
            </svg>
            {hidden ? "Show" : "Hide"}
          </button>
        </div>
      </div>

      {/* Collapsible body */}
      <div style={{maxHeight:hidden?0:270,overflow:"hidden",transition:"max-height 0.38s cubic-bezier(0.4,0,0.2,1)"}}>
        <div style={{padding:"13px 18px 15px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
          {/* Left */}
          <div>
            <SectionRule label="Demographics" T={T}/>
            <Row label="DOB"       value="14 Mar 1968 (56 yrs)"/>
            <Row label="Sex"       value="Female"/>
            <Row label="Insurance" value="BlueCross PPO"/>
            <Row label="Language"  value="English"/>
            <SectionRule label="Allergies" T={T}/>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
              {["Penicillin","Sulfa","NSAIDs"].map(a=>(
                <span key={a} style={{display:"inline-block",background:T.tagBg,border:`1px solid ${T.tagBorder}`,color:T.tagTxt,fontSize:8,letterSpacing:"0.13em",textTransform:"uppercase",padding:"2px 7px",borderRadius:3}}>{a}</span>
              ))}
            </div>
          </div>
          {/* Right */}
          <div>
            <SectionRule label="Encounter" T={T}/>
            <Row label="Provider"   value="Dr. S. Okafor, MD"/>
            <Row label="Visit type" value="Follow-up"/>
            <Row label="ID"         value="ENC-20240311-04"/>
            <Row label="Complaint"  value="HTN review"/>
            <SectionRule label="Vitals — last visit" T={T}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 5px"}}>
              {VITALS.map(v=>(
                <div key={v.label} style={{background:T.chip,border:`1px solid ${T.chipBorder}`,borderRadius:5,padding:"5px 7px"}}>
                  <div style={{color:recording?T.labelTxtRec:T.labelTxt,fontSize:7,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:2,transition:"color 0.6s ease"}}>{v.label}</div>
                  <div style={{color:T.valueTxt,fontSize:10.5}}>{v.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Module-level static data (never recreated)
const VITALS = [
  {label:"BP",value:"124/82"},{label:"HR",value:"71 bpm"},{label:"SpO₂",value:"98%"},
  {label:"Temp",value:"36.8°C"},{label:"RR",value:"16/min"},{label:"BMI",value:"24.1"},
];

// Pure presentational — no state, no hooks
function SectionRule({ label, T }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"11px 0 9px"}}>
      <span style={{color:T.sectionHead,fontSize:7.5,letterSpacing:"0.24em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{label}</span>
      <div style={{flex:1,height:1,background:T.divider}}/>
    </div>
  );
}

// ─── Circle action button — memo ──────────────────────────────────────────────
const CircleBtn = memo(function CircleBtn({ onClick, label, danger, primary, T, children }) {
  const [hover, setHover] = useState(false);
  const border = danger ? T.dangerBorder : primary ? T.primaryBorder : T.circleBorder;
  const color  = danger ? T.dangerTxt   : primary ? T.primaryTxt    : T.circleTxt;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
      <button
        onClick={onClick}
        onMouseEnter={()=>setHover(true)}
        onMouseLeave={()=>setHover(false)}
        style={{
          width:48, height:48, borderRadius:"50%",
          background:T.circleBg, border:`1px solid ${border}`,
          boxShadow:T.circleShadow,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", outline:"none", color,
          transform:hover?"scale(1.07)":"scale(1)",
          opacity:hover?1:0.88,
          transition:"transform 0.18s ease,opacity 0.18s ease",
          willChange:"transform",
        }}>
        {children}
      </button>
      <span style={{color:T.circleLabelTxt,fontSize:7.5,letterSpacing:"0.18em",textTransform:"uppercase"}}>{label}</span>
    </div>
  );
});

// ─── Record button — memo ─────────────────────────────────────────────────────
const RecordButton = memo(function RecordButton({ recording, onToggle, T }) {
  const [press, setPress] = useState(false);
  return (
    <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {recording && [0,1,2].map(i => (
        <div key={i} style={{
          position:"absolute", width:110, height:110, borderRadius:"50%",
          border:`1px solid ${T.ringColor}${0.13 - i * 0.04})`,
          animation:`ringOut 2.6s ease-out ${i * 0.75}s infinite`,
          pointerEvents:"none",
          willChange:"transform,opacity",
        }}/>
      ))}
      <button
        onMouseDown={()=>setPress(true)}
        onMouseUp={()=>{setPress(false);onToggle();}}
        onMouseLeave={()=>setPress(false)}
        style={{
          width:84, height:84, borderRadius:"50%",
          background:T.btnBg,
          border:`1px solid ${recording ? T.btnBorderRec : T.btnBorder}`,
          boxShadow:recording ? T.btnShadowRec : T.btnShadow,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", outline:"none",
          transform:press?"scale(0.90)":"scale(1)",
          transition:"transform 0.13s ease,box-shadow 0.8s ease,border-color 0.8s ease,background 0.5s ease",
          willChange:"transform",
        }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke={recording ? T.micStrokeRec : T.micStroke}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{transition:"stroke 0.8s ease"}}>
          <rect x="9" y="2" width="6" height="12" rx="3"/>
          <path d="M5 10a7 7 0 0 0 14 0"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="9" y1="22" x2="15" y2="22"/>
        </svg>
      </button>
    </div>
  );
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [recording, setRecording]       = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [light, setLight]               = useState(false);
  const elapsedRef  = useRef(0);
  const timerIdRef  = useRef(null);
  const T = light ? LIGHT : DARK;

  // Stable date string — recalculate only once per mount
  const dateStr = useMemo(() =>
    new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),
  []);

  const handleToggle = useCallback(() => {
    setRecording(r => {
      if (!r) {
        elapsedRef.current = 0;
        timerIdRef.current = setInterval(() => { elapsedRef.current += 0.5; }, 500);
      } else {
        clearInterval(timerIdRef.current);
        setHasRecording(true);
      }
      return !r;
    });
  }, []);

  const handleDelete = useCallback(() => {
    elapsedRef.current = 0;
    setHasRecording(false);
  }, []);

  const toggleLight = useCallback(() => setLight(l => !l), []);

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "o" || e.key === "O") setLight(l => !l);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => () => clearInterval(timerIdRef.current), []);

  return (
    <div style={{
      width:W, height:H, background:T.bg,
      position:"relative", overflow:"hidden",
      fontFamily:"'DM Mono','Courier New',monospace",
      transition:"background 0.5s ease",
      userSelect:"none", WebkitUserSelect:"none",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-user-select:none;}
        @keyframes hpop{0%,100%{transform:scaleY(1);opacity:.7}50%{transform:scaleY(2.4);opacity:1}}
        @keyframes ringOut{0%{transform:scale(1);opacity:.45}100%{transform:scale(1.88);opacity:0}}
        @keyframes statusPulse{0%,100%{opacity:0.5}50%{opacity:1}}
        button{user-select:none;-webkit-user-select:none;cursor:pointer;}
      `}</style>

      {/* Ambient glows — CSS only, zero JS cost */}
      <div style={{position:"absolute",width:"110%",height:"110%",borderRadius:"50%",background:`radial-gradient(ellipse at center,${T.glowCenter} 0%,transparent 55%)`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",transition:"background 0.6s ease"}}/>
      <div style={{position:"absolute",width:"60%",height:"60%",borderRadius:"50%",background:`radial-gradient(ellipse at center,${T.glowRight} 0%,transparent 55%)`,top:"42%",right:"-8%",transform:"translateY(-50%)",pointerEvents:"none",transition:"background 0.6s ease"}}/>
      <div style={{position:"absolute",width:"48%",height:"48%",borderRadius:"50%",background:`radial-gradient(ellipse at center,${T.glowLeft} 0%,transparent 55%)`,top:"55%",left:"-6%",transform:"translateY(-50%)",pointerEvents:"none",transition:"background 0.6s ease"}}/>

      {/* Top bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 32px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.topbarTxt} strokeWidth="1.6" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <span style={{color:T.topbarTxt,fontSize:10.5,letterSpacing:"0.24em",textTransform:"uppercase"}}>Scribe</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={toggleLight} style={{background:light?"rgba(22,95,178,0.10)":"rgba(255,255,255,0.06)",border:`1px solid ${light?"rgba(22,95,178,0.22)":"rgba(255,255,255,0.08)"}`,borderRadius:5,padding:"4px 11px",color:T.topbarSub,fontSize:8.5,letterSpacing:"0.18em",textTransform:"uppercase",outline:"none",display:"flex",alignItems:"center",gap:6,boxShadow:"0 1px 0 rgba(0,0,0,0.3),0 3px 8px rgba(0,0,0,0.14)",transition:"all 0.4s ease"}}>
            {light
              ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
            {light ? "Light" : "Dark"}
          </button>
          <div style={{color:T.topbarSub,fontSize:9.5,letterSpacing:"0.16em",textTransform:"uppercase"}}>{dateStr}</div>
        </div>
      </div>

      {/* Waveform */}
      <div style={{position:"absolute",top:"50%",left:0,right:0,height:CH,transform:"translateY(-54%)"}}>
        <Waveform recording={recording} light={light}/>
      </div>

      {/* Haptic + timer */}
      <div style={{position:"absolute",top:"50%",left:0,right:0,transform:"translateY(calc(-50% + 132px))",display:"flex",justifyContent:"center"}}>
        <HapticDotAndTimer recording={recording} elapsedRef={elapsedRef} T={T}/>
      </div>

      {/* Bottom row */}
      <div style={{position:"absolute",bottom:32,left:32,right:32,display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
        <PatientCard recording={recording} T={T}/>

        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
          {/* Action circles */}
          <div style={{
            display:"flex", alignItems:"flex-end", gap:16,
            opacity: hasRecording ? 1 : 0,
            transform: hasRecording ? "translateY(0)" : "translateY(10px)",
            transition:"opacity 0.4s ease,transform 0.4s ease",
            pointerEvents: hasRecording ? "all" : "none",
            willChange:"opacity,transform",
          }}>
            <CircleBtn danger onClick={handleDelete} label="Delete" T={T}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </CircleBtn>
            <CircleBtn primary onClick={()=>{}} label="SOAP Note" T={T}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </CircleBtn>
          </div>

          <RecordButton recording={recording} onToggle={handleToggle} T={T}/>
        </div>
      </div>
    </div>
  );
}