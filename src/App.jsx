import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";

// ── iPad 11" Pro M4 dimensions ────────────────────────────────────────────────
// Portrait:  834 × 1194 logical px  (264 ppi, 2× scale)
// Landscape: 1194 × 834 logical px
const IPAD_PORTRAIT_W  = 834;
const IPAD_PORTRAIT_H  = 1194;
const IPAD_LANDSCAPE_W = 1194;
const IPAD_LANDSCAPE_H = 834;

const STEP = 4;

// ── Theme tokens ──────────────────────────────────────────────────────────────
const DARK = {
  bg:            "#08090f",
  cardBg:        "#0d0e13",
  cardBorder:    "rgba(255,255,255,0.07)",
  cardBorderRec: "rgba(90,200,230,0.18)",
  cardShadow:    "0 1px 0 rgba(0,0,0,0.95), 0 8px 22px rgba(0,0,0,0.60), 0 22px 55px rgba(0,0,0,0.38)",
  cardShadowRec: "0 1px 0 rgba(0,0,0,0.95), 0 8px 22px rgba(0,0,0,0.60), 0 22px 55px rgba(50,160,220,0.08)",
  iconBox:       "#14151c",
  iconBoxBorder: "rgba(255,255,255,0.06)",
  iconStroke:    "rgba(255,255,255,0.38)",
  nameTxt:       "rgba(255,255,255,0.84)",
  labelTxt:      "rgba(255,255,255,0.22)",
  labelTxtRec:   "rgba(90,210,240,0.52)",
  valueTxt:      "rgba(255,255,255,0.54)",
  divider:       "rgba(255,255,255,0.05)",
  dividerRec:    "linear-gradient(90deg,rgba(90,210,240,0.12),rgba(255,255,255,0.04),transparent)",
  chip:          "rgba(255,255,255,0.025)",
  chipBorder:    "rgba(255,255,255,0.055)",
  tagBg:         "rgba(90,210,240,0.07)",
  tagBorder:     "rgba(90,210,240,0.16)",
  tagTxt:        "rgba(90,210,240,0.72)",
  sectionHead:   "rgba(255,255,255,0.14)",
  topbarTxt:     "rgba(255,255,255,0.28)",
  topbarSub:     "rgba(255,255,255,0.12)",
  glowCenter:    "rgba(45,20,140,0.07)",
  glowRight:     "rgba(30,130,190,0.04)",
  glowLeft:      "rgba(65,25,165,0.04)",
  btnBg:         "#0d0e13",
  btnBorder:     "rgba(255,255,255,0.07)",
  btnBorderRec:  "rgba(90,210,240,0.20)",
  btnShadow:     "0 1px 0 rgba(0,0,0,0.95), 0 6px 18px rgba(0,0,0,0.65), 0 16px 40px rgba(0,0,0,0.35)",
  btnShadowRec:  "0 1px 0 rgba(0,0,0,0.95), 0 6px 18px rgba(0,0,0,0.65), 0 16px 40px rgba(50,160,220,0.09)",
  micStroke:     "rgba(255,255,255,0.34)",
  micStrokeRec:  "rgba(170,232,248,0.88)",
  ringColor:     "rgba(90,210,240,",
  hapticIdle:    "rgba(255,255,255,0.09)",
  hapticActive:  "rgba(100,218,252,",
  hapticGlow:    "rgba(90,210,240,0.65)",
  hideBtn:       "rgba(255,255,255,0.05)",
  hideBtnTxt:    "rgba(255,255,255,0.28)",
  hideBtnBorder: "rgba(255,255,255,0.07)",
  actBg:         "#0d0e13",
  actBorder:     "rgba(255,255,255,0.08)",
  actTxt:        "rgba(255,255,255,0.45)",
  actShadow:     "0 1px 0 rgba(0,0,0,0.9), 0 5px 14px rgba(0,0,0,0.5), 0 12px 30px rgba(0,0,0,0.28)",
  actDangerBg:   "#0d0e13",
  actDangerBorder:"rgba(220,70,70,0.22)",
  actDangerTxt:  "rgba(220,100,100,0.70)",
  actPrimaryBg:  "#0d0e13",
  actPrimaryBorder:"rgba(90,210,240,0.22)",
  actPrimaryTxt: "rgba(90,210,240,0.72)",
};

const LIGHT = {
  bg:            "#f1f3f8",
  cardBg:        "#ffffff",
  cardBorder:    "rgba(0,0,0,0.09)",
  cardBorderRec: "rgba(25,100,185,0.25)",
  cardShadow:    "0 1px 0 rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.07), 0 20px 50px rgba(0,0,0,0.05)",
  cardShadowRec: "0 1px 0 rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.07), 0 20px 50px rgba(25,100,185,0.09)",
  iconBox:       "#f0f2f7",
  iconBoxBorder: "rgba(0,0,0,0.08)",
  iconStroke:    "rgba(0,0,0,0.42)",
  nameTxt:       "rgba(0,0,0,0.84)",
  labelTxt:      "rgba(0,0,0,0.30)",
  labelTxtRec:   "rgba(22,95,178,0.68)",
  valueTxt:      "rgba(0,0,0,0.60)",
  divider:       "rgba(0,0,0,0.065)",
  dividerRec:    "linear-gradient(90deg,rgba(22,95,178,0.15),rgba(0,0,0,0.04),transparent)",
  chip:          "rgba(0,0,0,0.028)",
  chipBorder:    "rgba(0,0,0,0.068)",
  tagBg:         "rgba(22,95,178,0.07)",
  tagBorder:     "rgba(22,95,178,0.18)",
  tagTxt:        "rgba(22,95,178,0.80)",
  sectionHead:   "rgba(0,0,0,0.22)",
  topbarTxt:     "rgba(0,0,0,0.38)",
  topbarSub:     "rgba(0,0,0,0.20)",
  glowCenter:    "rgba(120,135,210,0.10)",
  glowRight:     "rgba(60,140,205,0.06)",
  glowLeft:      "rgba(100,85,210,0.06)",
  btnBg:         "#ffffff",
  btnBorder:     "rgba(0,0,0,0.09)",
  btnBorderRec:  "rgba(22,95,178,0.26)",
  btnShadow:     "0 1px 0 rgba(0,0,0,0.06), 0 5px 16px rgba(0,0,0,0.08), 0 14px 38px rgba(0,0,0,0.05)",
  btnShadowRec:  "0 1px 0 rgba(0,0,0,0.06), 0 5px 16px rgba(0,0,0,0.08), 0 14px 38px rgba(22,95,178,0.10)",
  micStroke:     "rgba(0,0,0,0.32)",
  micStrokeRec:  "rgba(22,85,170,0.88)",
  ringColor:     "rgba(22,95,178,",
  hapticIdle:    "rgba(0,0,0,0.13)",
  hapticActive:  "rgba(22,95,178,",
  hapticGlow:    "rgba(22,95,178,0.40)",
  hideBtn:       "rgba(0,0,0,0.04)",
  hideBtnTxt:    "rgba(0,0,0,0.34)",
  hideBtnBorder: "rgba(0,0,0,0.08)",
  actBg:         "#ffffff",
  actBorder:     "rgba(0,0,0,0.09)",
  actTxt:        "rgba(0,0,0,0.48)",
  actShadow:     "0 1px 0 rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.07), 0 10px 24px rgba(0,0,0,0.04)",
  actDangerBg:   "#ffffff",
  actDangerBorder:"rgba(200,60,60,0.20)",
  actDangerTxt:  "rgba(190,50,50,0.72)",
  actPrimaryBg:  "#ffffff",
  actPrimaryBorder:"rgba(22,95,178,0.22)",
  actPrimaryTxt: "rgba(22,95,178,0.78)",
};

// ── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-user-select:none;}
  @keyframes hpop{0%,100%{transform:scaleY(1);opacity:.7}50%{transform:scaleY(2.4);opacity:1}}
  @keyframes ringOut{0%{transform:scale(1);opacity:.45}100%{transform:scale(1.88);opacity:0}}
  @keyframes statusPulse{0%,100%{opacity:0.5}50%{opacity:1}}
  button{user-select:none;-webkit-user-select:none;}
`;

// ── Waveform ──────────────────────────────────────────────────────────────────
function Waveform({ recording, light, canvasWidth }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ time: 0, raf: null, energy: 0 });

  const LAYERS = useMemo(() => [
    { fills:["#3b1fa8","#6234d4","#4a22bc"], alpha:0.72, freqs:[0.55,1.1,1.8,0.38], amps:[0.38,0.24,0.14,0.28], speed:1.4, baseY:0.50 },
    { fills:["#5b2ce0","#7b4af5","#4fc3e8"], alpha:0.65, freqs:[0.62,1.25,2.1,0.44], amps:[0.30,0.20,0.11,0.23], speed:1.9, baseY:0.50 },
    { fills:["#38b8e8","#62d8f5","#4ab8d8"], alpha:0.55, freqs:[0.70,1.45,2.4,0.52], amps:[0.22,0.16,0.09,0.18], speed:2.5, baseY:0.50 },
    { fills:["#7ae8ff","#a8f0ff","#60d8f0"], alpha:0.28, freqs:[0.85,1.7,2.8,0.6],  amps:[0.15,0.11,0.07,0.13], speed:3.2, baseY:0.50 },
  ], []);

  const edgeWeight = useCallback((n) => Math.pow(Math.sin(n * Math.PI), 1.8), []);
  const getTopY    = useCallback((layer, x, cw, ch, t, em) => {
    const n=x/cw, ew=edgeWeight(n); let d=0;
    for (let i=0;i<layer.freqs.length;i++) d+=Math.sin(n*Math.PI*2*layer.freqs[i]+t*layer.speed+i*1.1)*layer.amps[i]*em;
    return (layer.baseY-d*ew)*ch;
  }, [edgeWeight]);
  const getBottomY = useCallback((layer, x, cw, ch, t, em) => {
    const n=x/cw, ew=edgeWeight(n); let d=0;
    for (let i=0;i<layer.freqs.length;i++) d+=Math.sin(n*Math.PI*2*layer.freqs[i]+t*layer.speed*0.85+i*2.7+Math.PI*1.3)*layer.amps[i]*em;
    return (layer.baseY+d*ew)*ch;
  }, [edgeWeight]);

  const as = light ? 0.68 : 1.0;

  const draw = useCallback(() => {
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"), cw=canvas.width, ch=canvas.height, s=stateRef.current;
    s.time+=recording?0.022:0.009;
    s.energy+=((recording?1.0:0.28)-s.energy)*0.04;
    const em=0.28+s.energy*0.72;
    ctx.clearRect(0,0,cw,ch);
    LAYERS.forEach((layer,li)=>{
      const grad=ctx.createLinearGradient(0,0,cw,0);
      layer.fills.forEach((c,i)=>grad.addColorStop(i/(layer.fills.length-1),c));
      ctx.save(); ctx.globalAlpha=layer.alpha*as; ctx.beginPath();
      for(let x=0;x<=cw;x+=STEP){const y=getTopY(layer,x,cw,ch,s.time,em);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      for(let x=cw;x>=0;x-=STEP) ctx.lineTo(x,getBottomY(layer,x,cw,ch,s.time,em));
      ctx.closePath(); ctx.fillStyle=grad; ctx.fill(); ctx.restore();
      [0.9,0.7].forEach((aFactor,bi)=>{
        const isTop=bi===0;
        ctx.save(); ctx.globalAlpha=layer.alpha*as*aFactor;
        ctx.strokeStyle=layer.fills[layer.fills.length-1];
        ctx.lineWidth=li===0?2.5:li===1?2:1.5; ctx.shadowColor=layer.fills[1]; ctx.shadowBlur=li<2?7:4;
        ctx.lineJoin="round"; ctx.lineCap="round"; ctx.beginPath();
        for(let x=0;x<=cw;x+=STEP){const y=isTop?getTopY(layer,x,cw,ch,s.time,em):getBottomY(layer,x,cw,ch,s.time,em);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        ctx.stroke(); ctx.restore();
      });
    });
    const sl=LAYERS[2]; ctx.save(); ctx.globalAlpha=0.50*as;
    const shimG=ctx.createLinearGradient(0,0,cw,0);
    shimG.addColorStop(0,"rgba(200,245,255,0)"); shimG.addColorStop(0.15,"rgba(200,245,255,0.65)");
    shimG.addColorStop(0.5,"rgba(255,255,255,0.85)"); shimG.addColorStop(0.85,"rgba(200,245,255,0.65)"); shimG.addColorStop(1,"rgba(200,245,255,0)");
    ctx.strokeStyle=shimG; ctx.lineWidth=1; ctx.shadowColor="#b0f0ff"; ctx.shadowBlur=3; ctx.beginPath();
    for(let x=0;x<=cw;x+=STEP){const y=getTopY(sl,x,cw,ch,s.time,em)-1;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.stroke(); ctx.restore();
    s.raf=requestAnimationFrame(draw);
  }, [recording, LAYERS, getTopY, getBottomY, as]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    canvas.width = canvasWidth || 834;
    canvas.height = 200;
    const s=stateRef.current; s.raf=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(s.raf);
  }, [draw, canvasWidth]);

  return <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block"}}/>;
}

// ── Haptic dots ───────────────────────────────────────────────────────────────
const HapticDot = memo(function HapticDot({ recording, T }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,height:20}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{
          width:recording?5:3, height:recording?5:3, borderRadius:"50%",
          background:recording?`${T.hapticActive}${0.9-i*0.2})`:T.hapticIdle,
          boxShadow:recording?`0 0 ${7+i*2}px ${T.hapticGlow}`:"none",
          transition:"all 0.4s ease",
          animation:recording?`hpop 1.1s ease-in-out ${i*0.16}s infinite`:"none",
        }}/>
      ))}
    </div>
  );
});

// ── Patient card ──────────────────────────────────────────────────────────────
const VITALS = [
  {label:"BP",value:"124/82"},{label:"HR",value:"71 bpm"},{label:"SpO₂",value:"98%"},
  {label:"Temp",value:"36.8°C"},{label:"RR",value:"16/min"},{label:"BMI",value:"24.1"},
];
const ALLERGIES = ["Penicillin","Sulfa","NSAIDs"];

const PatientCard = memo(function PatientCard({ recording, T, portrait }) {
  const [hidden, setHidden] = useState(false);

  const lblStyle = useMemo(()=>({
    fontSize:8, letterSpacing:"0.20em", textTransform:"uppercase",
    minWidth:58, flexShrink:0, lineHeight:"1.4",
    color: recording ? T.labelTxtRec : T.labelTxt,
    transition:"color 0.6s ease",
  }), [recording, T.labelTxt, T.labelTxtRec]);

  const valStyle = useMemo(()=>({
    fontSize:11, letterSpacing:"0.01em", lineHeight:"1.4",
    color: T.valueTxt, transition:"color 0.5s ease",
  }), [T.valueTxt]);

  const hideBtnStyle = useMemo(()=>({
    borderRadius:5, padding:"5px 10px",
    fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase",
    cursor:"pointer", outline:"none",
    boxShadow:"0 1px 0 rgba(0,0,0,0.3), 0 3px 8px rgba(0,0,0,0.15)",
    display:"flex", alignItems:"center", gap:5, transition:"all 0.3s ease",
    background:T.hideBtn, border:`1px solid ${T.hideBtnBorder}`, color:T.hideBtnTxt,
  }), [T.hideBtn, T.hideBtnBorder, T.hideBtnTxt]);

  const toggleHidden = useCallback(()=>setHidden(h=>!h), []);

  const Row = useCallback(({label,value}) => (
    <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
      <div style={lblStyle}>{label}</div>
      <div style={valStyle}>{value}</div>
    </div>
  ), [lblStyle, valStyle]);

  const Chip = useCallback(({children}) => (
    <span style={{
      display:"inline-block", background:T.tagBg, border:`1px solid ${T.tagBorder}`,
      color:T.tagTxt, fontSize:8, letterSpacing:"0.13em", textTransform:"uppercase",
      padding:"2px 7px", borderRadius:3, transition:"all 0.6s ease",
    }}>{children}</span>
  ), [T.tagBg, T.tagBorder, T.tagTxt]);

  const SectionRule = useCallback(({label}) => (
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"11px 0 9px"}}>
      <span style={{fontSize:7.5,letterSpacing:"0.24em",textTransform:"uppercase",whiteSpace:"nowrap",color:T.sectionHead,transition:"color 0.6s ease"}}>{label}</span>
      <div style={{flex:1,height:1,background:T.divider,transition:"background 0.6s ease"}}/>
    </div>
  ), [T.sectionHead, T.divider]);

  // In portrait: card is full-width at bottom. In landscape: card is left column.
  const cardWidth = portrait ? "100%" : 460;

  return (
    <div style={{
      background:T.cardBg, border:`1px solid ${recording?T.cardBorderRec:T.cardBorder}`,
      borderRadius:11, width:cardWidth,
      boxShadow:recording?T.cardShadowRec:T.cardShadow,
      transition:"box-shadow 0.8s ease,border-color 0.8s ease,background 0.5s ease,width 0.4s ease",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute",inset:0,
        background:"linear-gradient(135deg,rgba(50,22,150,0.05) 0%,rgba(60,180,225,0.03) 100%)",
        opacity:recording?1:0, transition:"opacity 0.8s ease",
        pointerEvents:"none", borderRadius:11,
      }}/>

      {/* Header */}
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"15px 18px",
        borderBottom:`1px solid ${hidden?T.divider:"transparent"}`,
        transition:"border-color 0.3s ease",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:34,height:34,borderRadius:7,
            background:T.iconBox, border:`1px solid ${T.iconBoxBorder}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 1px 0 rgba(0,0,0,0.4),0 3px 8px rgba(0,0,0,0.18)",
            flexShrink:0, transition:"background 0.5s ease",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke={T.iconStroke} strokeWidth="1.7" strokeLinecap="round"
              style={{transition:"stroke 0.5s ease"}}>
              <circle cx="12" cy="7" r="4"/>
              <path d="M4 21v-1a8 8 0 0 1 16 0v1"/>
            </svg>
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{color:T.nameTxt,fontSize:13.5,fontWeight:500,letterSpacing:"0.01em",transition:"color 0.5s ease"}}>
                Eleanor Voss
              </span>
              {recording && (
                <span style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{
                    display:"inline-block",width:5,height:5,borderRadius:"50%",
                    background:T.tagTxt,boxShadow:`0 0 5px ${T.tagTxt}`,
                    animation:"statusPulse 2s ease-in-out infinite",
                  }}/>
                  <span style={{color:T.tagTxt,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase"}}>Live</span>
                </span>
              )}
            </div>
            <div style={{
              color:recording?T.labelTxtRec:T.labelTxt,
              fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",
              marginTop:1,transition:"color 0.6s ease",
            }}>
              Patient · Internal Medicine
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{background:T.chip,border:`1px solid ${T.chipBorder}`,borderRadius:5,padding:"4px 10px",transition:"background 0.5s ease"}}>
            <div style={{color:recording?T.labelTxtRec:T.labelTxt,fontSize:7,letterSpacing:"0.20em",textTransform:"uppercase",marginBottom:1,transition:"color 0.6s ease"}}>MRN</div>
            <div style={{color:T.valueTxt,fontSize:10.5,letterSpacing:"0.03em"}}>MRN-0042817</div>
          </div>
          <button onClick={toggleHidden} style={hideBtnStyle}>
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

      {/* Collapsible body — portrait: 2-col grid; landscape: stacked single col */}
      <div style={{maxHeight:hidden?0:300,overflow:"hidden",transition:"max-height 0.38s cubic-bezier(0.4,0,0.2,1)"}}>
        <div style={{
          padding:"13px 18px 15px",
          display:"grid",
          gridTemplateColumns: portrait ? "1fr 1fr" : "1fr",
          gap: portrait ? "0 28px" : "0",
        }}>
          <div>
            <SectionRule label="Demographics"/>
            <Row label="DOB"       value="14 Mar 1968 (56 yrs)"/>
            <Row label="Sex"       value="Female"/>
            <Row label="Insurance" value="BlueCross PPO"/>
            <Row label="Language"  value="English"/>
            <SectionRule label="Allergies"/>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
              {ALLERGIES.map(a=><Chip key={a}>{a}</Chip>)}
            </div>
          </div>
          <div>
            <SectionRule label="Encounter"/>
            <Row label="Provider"   value="Dr. S. Okafor, MD"/>
            <Row label="Visit type" value="Follow-up"/>
            <Row label="ID"         value="ENC-20240311-04"/>
            <Row label="Complaint"  value="HTN review"/>
            <SectionRule label="Vitals — last visit"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 5px"}}>
              {VITALS.map(v=>(
                <div key={v.label} style={{background:T.chip,border:`1px solid ${T.chipBorder}`,borderRadius:5,padding:"5px 7px",transition:"background 0.5s ease"}}>
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

// ── Action buttons ────────────────────────────────────────────────────────────
const ACT_BTN_BASE = {
  display:"flex", alignItems:"center", gap:6,
  borderRadius:7, padding:"9px 14px",
  cursor:"pointer", outline:"none",
  fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
  transition:"all 0.25s ease",
};

const ActionButtons = memo(function ActionButtons({ hasRecording, onDelete, onSoap, T, portrait }) {
  const [showMore, setShowMore] = useState(false);
  const [soapDone, setSoapDone] = useState(false);
  const toggleMore = useCallback(()=>setShowMore(m=>!m), []);

  const handleSoap = useCallback(()=>{
    onSoap();
    setSoapDone(true);
  }, [onSoap]);

  const variantStyles = useMemo(()=>({
    danger: { bg:T.actDangerBg, border:T.actDangerBorder, txt:T.actDangerTxt },
    primary:{ bg:T.actPrimaryBg,border:T.actPrimaryBorder,txt:T.actPrimaryTxt },
    normal: { bg:T.actBg,       border:T.actBorder,       txt:T.actTxt       },
  }), [T.actDangerBg,T.actDangerBorder,T.actDangerTxt,T.actPrimaryBg,T.actPrimaryBorder,T.actPrimaryTxt,T.actBg,T.actBorder,T.actTxt]);

  if (!hasRecording) return null;

  const Btn = ({ onClick, variant="normal", children, title }) => {
    const [hover, setHover] = useState(false);
    const v = variantStyles[variant];
    return (
      <button
        title={title}
        onClick={onClick}
        onMouseEnter={()=>setHover(true)}
        onMouseLeave={()=>setHover(false)}
        style={{
          ...ACT_BTN_BASE,
          background: v.bg,
          border: `1px solid ${v.border}`,
          color: v.txt,
          boxShadow: T.actShadow,
          opacity: hover ? 1 : 0.92,
          transform: hover ? "translateY(-1px)" : "translateY(0)",
        }}>
        {children}
      </button>
    );
  };

  // Portrait: buttons spread horizontally above the record button row
  // Landscape: buttons stacked to the right of the record button
  return (
    <div style={{
      display:"flex",
      flexDirection: portrait ? "row" : "column",
      alignItems: portrait ? "center" : "flex-end",
      gap:8,
      flexWrap: portrait ? "wrap" : "nowrap",
      justifyContent: portrait ? "center" : "flex-end",
    }}>
      {/* More options */}
      <div style={{
        display:"flex", alignItems:"center", gap:6,
        maxHeight: showMore ? 60 : 0,
        overflow:"hidden",
        transition:"max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
        opacity: showMore ? 1 : 0,
      }}>
        <Btn title="Export as PDF">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Export PDF
        </Btn>
        <Btn title="Copy transcript">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Transcript
        </Btn>
        <Btn title="Send to EHR">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Send to EHR
        </Btn>
      </div>
      {/* Main actions */}
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <Btn variant="danger" onClick={onDelete} title="Delete recording">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Delete
        </Btn>
        <Btn onClick={toggleMore} title="More options">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          {showMore ? "Less" : "More"}
        </Btn>
        <Btn variant="primary" onClick={handleSoap} title="Generate SOAP note">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          {soapDone ? "Regenerate SOAP" : "SOAP Note"}
        </Btn>
      </div>
    </div>
  );
});

// ── Record button ─────────────────────────────────────────────────────────────
const RING_INDICES = [0, 1, 2];

const RecordButton = memo(function RecordButton({ recording, onToggle, T }) {
  const [press, setPress] = useState(false);
  const onDown  = useCallback(()=>setPress(true), []);
  const onUp    = useCallback(()=>{ setPress(false); onToggle(); }, [onToggle]);
  const onLeave = useCallback(()=>setPress(false), []);

  return (
    <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {recording && RING_INDICES.map(i=>(
        <div key={i} style={{
          position:"absolute", width:110, height:110, borderRadius:"50%",
          border:`1px solid ${T.ringColor}${0.13-i*0.04})`,
          animation:`ringOut 2.6s ease-out ${i*0.75}s infinite`,
          pointerEvents:"none",
        }}/>
      ))}
      <button
        onMouseDown={onDown} onMouseUp={onUp} onMouseLeave={onLeave}
        onTouchStart={onDown} onTouchEnd={onUp}
        title={recording ? "Stop recording" : "Start recording"}
        style={{
          width:84, height:84, borderRadius:"50%",
          background:T.btnBg,
          border:`1px solid ${recording ? T.btnBorderRec : T.btnBorder}`,
          boxShadow:recording ? T.btnShadowRec : T.btnShadow,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", outline:"none",
          transform: press ? "scale(0.90)" : "scale(1)",
          transition:"transform 0.13s ease,box-shadow 0.8s ease,border-color 0.8s ease,background 0.5s ease",
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

// ── Orientation toggle button ─────────────────────────────────────────────────
const OrientationToggle = memo(function OrientationToggle({ portrait, onToggle, T }) {
  return (
    <button onClick={onToggle} title="Toggle orientation" style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${T.btnBorder}`,
      borderRadius: 5,
      padding: "4px 11px",
      color: T.topbarSub,
      fontSize: 8.5,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      cursor: "pointer",
      outline: "none",
      display: "flex",
      alignItems: "center",
      gap: 6,
      boxShadow: "0 1px 0 rgba(0,0,0,0.3),0 3px 8px rgba(0,0,0,0.14)",
      transition: "all 0.4s ease",
    }}>
      {/* Rotate icon */}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {portrait
          ? <><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.5"/></>
          : <><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="18" y1="12" x2="18.5" y2="12"/></>
        }
      </svg>
      {portrait ? "Portrait" : "Landscape"}
    </button>
  );
});

// ── Today's date ──────────────────────────────────────────────────────────────
const TODAY = new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [recording, setRecording]       = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [light, setLight]               = useState(false);
  const [portrait, setPortrait]         = useState(true);

  const T = useMemo(()=>(light ? LIGHT : DARK), [light]);

  // iPad 11" Pro M4 dimensions
  const W = portrait ? IPAD_PORTRAIT_W  : IPAD_LANDSCAPE_W;
  const H = portrait ? IPAD_PORTRAIT_H  : IPAD_LANDSCAPE_H;

  const handleToggle = useCallback(()=>{
    setRecording(r => { if (r) setHasRecording(true); return !r; });
  }, []);
  const handleDelete   = useCallback(()=>setHasRecording(false), []);
  const handleSoap     = useCallback(()=>{}, []);
  const toggleLight    = useCallback(()=>setLight(l=>!l), []);
  const togglePortrait = useCallback(()=>setPortrait(p=>!p), []);

  useEffect(()=>{
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return ()=>document.head.removeChild(el);
  }, []);

  useEffect(()=>{
    const h = (e) => {
      if (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      if (e.key==="o"||e.key==="O") toggleLight();
      if (e.key==="r"||e.key==="R") togglePortrait();
    };
    window.addEventListener("keydown", h);
    return ()=>window.removeEventListener("keydown", h);
  }, [toggleLight, togglePortrait]);

  const themeBtnStyle = useMemo(()=>({
    background: light ? "rgba(22,95,178,0.10)" : "rgba(255,255,255,0.06)",
    border: `1px solid ${light ? "rgba(22,95,178,0.22)" : "rgba(255,255,255,0.08)"}`,
    borderRadius:5, padding:"4px 11px",
    color:T.topbarSub, fontSize:8.5, letterSpacing:"0.18em", textTransform:"uppercase",
    cursor:"pointer", outline:"none", display:"flex", alignItems:"center", gap:6,
    boxShadow:"0 1px 0 rgba(0,0,0,0.3),0 3px 8px rgba(0,0,0,0.14)",
    transition:"all 0.4s ease",
  }), [light, T.topbarSub]);

  // ── Waveform vertical position differs by orientation
  const waveTop    = portrait ? "38%" : "42%";
  const waveHeight = portrait ? 220    : 180;
  const waveOffset = portrait ? "54%"  : "52%";

  // ── Bottom section layout
  // Portrait: stacked column — patient card, then controls row, then record btn
  // Landscape: side by side — patient card left, waveform center, controls+btn right
  return (
    <div style={{
      width:W, height:H, background:T.bg,
      position:"relative", overflow:"hidden",
      fontFamily:"'DM Mono','Courier New',monospace",
      transition:"background 0.5s ease, width 0.4s ease, height 0.4s ease",
    }}>
      {/* Ambient glows */}
      <div style={{position:"absolute",width:"110%",height:"110%",borderRadius:"50%",background:`radial-gradient(ellipse at center,${T.glowCenter} 0%,transparent 55%)`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",transition:"background 0.6s ease"}}/>
      <div style={{position:"absolute",width:"60%",height:"60%",borderRadius:"50%",background:`radial-gradient(ellipse at center,${T.glowRight} 0%,transparent 55%)`,top:"42%",right:"-8%",transform:"translateY(-50%)",pointerEvents:"none",transition:"background 0.6s ease"}}/>
      <div style={{position:"absolute",width:"48%",height:"48%",borderRadius:"50%",background:`radial-gradient(ellipse at center,${T.glowLeft} 0%,transparent 55%)`,top:"55%",left:"-6%",transform:"translateY(-50%)",pointerEvents:"none",transition:"background 0.6s ease"}}/>

      {/* Top bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 28px 0",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.topbarTxt} strokeWidth="1.6" strokeLinecap="round" style={{transition:"stroke 0.5s ease"}}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <span style={{color:T.topbarTxt,fontSize:10.5,letterSpacing:"0.24em",textTransform:"uppercase",transition:"color 0.5s ease"}}>Veridian</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <OrientationToggle portrait={portrait} onToggle={togglePortrait} T={T}/>
          <button onClick={toggleLight} style={themeBtnStyle}>
            {light
              ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
            {light ? "Light" : "Dark"}
          </button>
          <div style={{color:T.topbarSub,fontSize:9.5,letterSpacing:"0.16em",textTransform:"uppercase",transition:"color 0.5s ease"}}>{TODAY}</div>
        </div>
      </div>

      {/* ── PORTRAIT LAYOUT ─────────────────────────────────────────────────── */}
      {portrait && (
        <>
          {/* Waveform — centered vertically in upper 60% */}
          <div style={{position:"absolute",top:waveTop,left:0,right:0,height:waveHeight,transform:`translateY(-${waveOffset})`}}>
            <Waveform recording={recording} light={light} canvasWidth={IPAD_PORTRAIT_W}/>
          </div>
          {/* Haptic dots */}
          <div style={{position:"absolute",top:"50%",left:0,right:0,transform:"translateY(calc(-50% + 120px))",display:"flex",justifyContent:"center"}}>
            <HapticDot recording={recording} T={T}/>
          </div>
          {/* Bottom section: patient card + controls */}
          <div style={{
            position:"absolute", bottom:28, left:24, right:24,
            display:"flex", flexDirection:"column", gap:14,
          }}>
            <PatientCard recording={recording} T={T} portrait={true}/>
            {/* Controls row: action buttons left, record button right */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:4}}>
              <ActionButtons hasRecording={hasRecording} onDelete={handleDelete} onSoap={handleSoap} T={T} portrait={true}/>
              <RecordButton recording={recording} onToggle={handleToggle} T={T}/>
            </div>
          </div>
        </>
      )}

      {/* ── LANDSCAPE LAYOUT ────────────────────────────────────────────────── */}
      {!portrait && (
        <>
          {/* Waveform — centered */}
          <div style={{position:"absolute",top:"46%",left:0,right:0,height:waveHeight,transform:"translateY(-50%)"}}>
            <Waveform recording={recording} light={light} canvasWidth={IPAD_LANDSCAPE_W}/>
          </div>
          {/* Haptic dots */}
          <div style={{position:"absolute",top:"50%",left:0,right:0,transform:"translateY(calc(-50% + 100px))",display:"flex",justifyContent:"center"}}>
            <HapticDot recording={recording} T={T}/>
          </div>
          {/* Bottom row: patient card left | record + actions right */}
          <div style={{
            position:"absolute", bottom:22, left:22, right:22,
            display:"flex", alignItems:"flex-end", justifyContent:"space-between",
            gap:16,
          }}>
            {/* Left: patient card — narrower in landscape */}
            <PatientCard recording={recording} T={T} portrait={false}/>
            {/* Right: action buttons stacked above record button */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10,flexShrink:0}}>
              <ActionButtons hasRecording={hasRecording} onDelete={handleDelete} onSoap={handleSoap} T={T} portrait={false}/>
              <RecordButton recording={recording} onToggle={handleToggle} T={T}/>
            </div>
          </div>
        </>
      )}
    </div>
  );
}