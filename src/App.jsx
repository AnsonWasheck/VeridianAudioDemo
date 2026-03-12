// ─────────────────────────────────────────────────────────────────────────────
// App.jsx  –  Screen 1: Recording / Patient Card
// To navigate to the SOAP screen, call the `onOpenSoap` prop that is passed
// down from main.jsx (or index.jsx). See main.jsx for the router.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";

const IPAD_P_W = 834;
const IPAD_P_H = 1194;
const IPAD_L_W = 1194;
const IPAD_L_H = 834;
const STEP = 4;

// ── Theme tokens ──────────────────────────────────────────────────────────────
export const DARK = {
  bg:"#08090f",cardBg:"#0d0e13",cardBorder:"rgba(255,255,255,0.07)",
  cardBorderRec:"rgba(90,200,230,0.18)",
  cardShadow:"0 1px 0 rgba(0,0,0,0.95),0 8px 22px rgba(0,0,0,0.60),0 22px 55px rgba(0,0,0,0.38)",
  cardShadowRec:"0 1px 0 rgba(0,0,0,0.95),0 8px 22px rgba(0,0,0,0.60),0 22px 55px rgba(50,160,220,0.08)",
  iconBox:"#14151c",iconBoxBorder:"rgba(255,255,255,0.06)",iconStroke:"rgba(255,255,255,0.38)",
  nameTxt:"rgba(255,255,255,0.84)",labelTxt:"rgba(255,255,255,0.22)",
  labelTxtRec:"rgba(90,210,240,0.52)",valueTxt:"rgba(255,255,255,0.54)",
  divider:"rgba(255,255,255,0.05)",chip:"rgba(255,255,255,0.025)",
  chipBorder:"rgba(255,255,255,0.055)",tagBg:"rgba(90,210,240,0.07)",
  tagBorder:"rgba(90,210,240,0.16)",tagTxt:"rgba(90,210,240,0.72)",
  sectionHead:"rgba(255,255,255,0.14)",topbarTxt:"rgba(255,255,255,0.28)",
  topbarSub:"rgba(255,255,255,0.12)",glowCenter:"rgba(45,20,140,0.07)",
  glowRight:"rgba(30,130,190,0.04)",glowLeft:"rgba(65,25,165,0.04)",
  btnBg:"#0d0e13",btnBorder:"rgba(255,255,255,0.07)",
  btnBorderRec:"rgba(90,210,240,0.20)",
  btnShadow:"0 1px 0 rgba(0,0,0,0.95),0 6px 18px rgba(0,0,0,0.65),0 16px 40px rgba(0,0,0,0.35)",
  btnShadowRec:"0 1px 0 rgba(0,0,0,0.95),0 6px 18px rgba(0,0,0,0.65),0 16px 40px rgba(50,160,220,0.09)",
  micStroke:"rgba(255,255,255,0.34)",micStrokeRec:"rgba(170,232,248,0.88)",
  ringColor:"rgba(90,210,240,",hapticIdle:"rgba(255,255,255,0.09)",
  hapticActive:"rgba(100,218,252,",hapticGlow:"rgba(90,210,240,0.65)",
  hideBtn:"rgba(255,255,255,0.05)",hideBtnTxt:"rgba(255,255,255,0.28)",
  hideBtnBorder:"rgba(255,255,255,0.07)",actBg:"#0d0e13",
  actBorder:"rgba(255,255,255,0.08)",actTxt:"rgba(255,255,255,0.45)",
  actShadow:"0 1px 0 rgba(0,0,0,0.9),0 5px 14px rgba(0,0,0,0.5),0 12px 30px rgba(0,0,0,0.28)",
  actDangerBg:"#0d0e13",actDangerBorder:"rgba(220,70,70,0.22)",actDangerTxt:"rgba(220,100,100,0.70)",
  actPrimaryBg:"#0d0e13",actPrimaryBorder:"rgba(90,210,240,0.22)",actPrimaryTxt:"rgba(90,210,240,0.72)",
};
export const LIGHT = {
  bg:"#f1f3f8",cardBg:"#ffffff",cardBorder:"rgba(0,0,0,0.09)",
  cardBorderRec:"rgba(25,100,185,0.25)",
  cardShadow:"0 1px 0 rgba(0,0,0,0.05),0 6px 20px rgba(0,0,0,0.07),0 20px 50px rgba(0,0,0,0.05)",
  cardShadowRec:"0 1px 0 rgba(0,0,0,0.05),0 6px 20px rgba(0,0,0,0.07),0 20px 50px rgba(25,100,185,0.09)",
  iconBox:"#f0f2f7",iconBoxBorder:"rgba(0,0,0,0.08)",iconStroke:"rgba(0,0,0,0.42)",
  nameTxt:"rgba(0,0,0,0.84)",labelTxt:"rgba(0,0,0,0.30)",labelTxtRec:"rgba(22,95,178,0.68)",
  valueTxt:"rgba(0,0,0,0.60)",divider:"rgba(0,0,0,0.065)",chip:"rgba(0,0,0,0.028)",
  chipBorder:"rgba(0,0,0,0.068)",tagBg:"rgba(22,95,178,0.07)",tagBorder:"rgba(22,95,178,0.18)",
  tagTxt:"rgba(22,95,178,0.80)",sectionHead:"rgba(0,0,0,0.22)",topbarTxt:"rgba(0,0,0,0.38)",
  topbarSub:"rgba(0,0,0,0.20)",glowCenter:"rgba(120,135,210,0.10)",
  glowRight:"rgba(60,140,205,0.06)",glowLeft:"rgba(100,85,210,0.06)",
  btnBg:"#ffffff",btnBorder:"rgba(0,0,0,0.09)",btnBorderRec:"rgba(22,95,178,0.26)",
  btnShadow:"0 1px 0 rgba(0,0,0,0.06),0 5px 16px rgba(0,0,0,0.08),0 14px 38px rgba(0,0,0,0.05)",
  btnShadowRec:"0 1px 0 rgba(0,0,0,0.06),0 5px 16px rgba(0,0,0,0.08),0 14px 38px rgba(22,95,178,0.10)",
  micStroke:"rgba(0,0,0,0.32)",micStrokeRec:"rgba(22,85,170,0.88)",
  ringColor:"rgba(22,95,178,",hapticIdle:"rgba(0,0,0,0.13)",hapticActive:"rgba(22,95,178,",
  hapticGlow:"rgba(22,95,178,0.40)",hideBtn:"rgba(0,0,0,0.04)",hideBtnTxt:"rgba(0,0,0,0.34)",
  hideBtnBorder:"rgba(0,0,0,0.08)",actBg:"#ffffff",actBorder:"rgba(0,0,0,0.09)",
  actTxt:"rgba(0,0,0,0.48)",actShadow:"0 1px 0 rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.07),0 10px 24px rgba(0,0,0,0.04)",
  actDangerBg:"#ffffff",actDangerBorder:"rgba(200,60,60,0.20)",actDangerTxt:"rgba(190,50,50,0.72)",
  actPrimaryBg:"#ffffff",actPrimaryBorder:"rgba(22,95,178,0.22)",actPrimaryTxt:"rgba(22,95,178,0.78)",
};

// ── useOrientation ────────────────────────────────────────────────────────────
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

// ── Waveform ──────────────────────────────────────────────────────────────────
function Waveform({ recording, light, canvasWidth }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ time:0, raf:null, energy:0 });
  const LAYERS = useMemo(() => [
    {fills:["#3b1fa8","#6234d4","#4a22bc"],alpha:0.72,freqs:[0.55,1.1,1.8,0.38],amps:[0.38,0.24,0.14,0.28],speed:1.4,baseY:0.50},
    {fills:["#5b2ce0","#7b4af5","#4fc3e8"],alpha:0.65,freqs:[0.62,1.25,2.1,0.44],amps:[0.30,0.20,0.11,0.23],speed:1.9,baseY:0.50},
    {fills:["#38b8e8","#62d8f5","#4ab8d8"],alpha:0.55,freqs:[0.70,1.45,2.4,0.52],amps:[0.22,0.16,0.09,0.18],speed:2.5,baseY:0.50},
    {fills:["#7ae8ff","#a8f0ff","#60d8f0"],alpha:0.28,freqs:[0.85,1.7,2.8,0.6],amps:[0.15,0.11,0.07,0.13],speed:3.2,baseY:0.50},
  ], []);
  const ew = useCallback((n) => Math.pow(Math.sin(n*Math.PI),1.8),[]);
  const topY = useCallback((l,x,cw,ch,t,em)=>{const n=x/cw,e=ew(n);let d=0;for(let i=0;i<l.freqs.length;i++)d+=Math.sin(n*Math.PI*2*l.freqs[i]+t*l.speed+i*1.1)*l.amps[i]*em;return(l.baseY-d*e)*ch;},[ew]);
  const botY = useCallback((l,x,cw,ch,t,em)=>{const n=x/cw,e=ew(n);let d=0;for(let i=0;i<l.freqs.length;i++)d+=Math.sin(n*Math.PI*2*l.freqs[i]+t*l.speed*0.85+i*2.7+Math.PI*1.3)*l.amps[i]*em;return(l.baseY+d*e)*ch;},[ew]);
  const as = light ? 0.68 : 1.0;
  const draw = useCallback(()=>{
    const cv=canvasRef.current;if(!cv)return;
    const ctx=cv.getContext("2d"),cw=cv.width,ch=cv.height,s=stateRef.current;
    s.time+=recording?0.022:0.009;s.energy+=((recording?1.0:0.28)-s.energy)*0.04;
    const em=0.28+s.energy*0.72;ctx.clearRect(0,0,cw,ch);
    LAYERS.forEach((l,li)=>{
      const g=ctx.createLinearGradient(0,0,cw,0);l.fills.forEach((c,i)=>g.addColorStop(i/(l.fills.length-1),c));
      ctx.save();ctx.globalAlpha=l.alpha*as;ctx.beginPath();
      for(let x=0;x<=cw;x+=STEP){const y=topY(l,x,cw,ch,s.time,em);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      for(let x=cw;x>=0;x-=STEP)ctx.lineTo(x,botY(l,x,cw,ch,s.time,em));
      ctx.closePath();ctx.fillStyle=g;ctx.fill();ctx.restore();
      [0.9,0.7].forEach((af,bi)=>{const it=bi===0;ctx.save();ctx.globalAlpha=l.alpha*as*af;ctx.strokeStyle=l.fills[l.fills.length-1];ctx.lineWidth=li===0?2.5:li===1?2:1.5;ctx.shadowColor=l.fills[1];ctx.shadowBlur=li<2?7:4;ctx.lineJoin="round";ctx.lineCap="round";ctx.beginPath();for(let x=0;x<=cw;x+=STEP){const y=it?topY(l,x,cw,ch,s.time,em):botY(l,x,cw,ch,s.time,em);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.restore();});
    });
    const sl=LAYERS[2];ctx.save();ctx.globalAlpha=0.50*as;
    const sh=ctx.createLinearGradient(0,0,cw,0);sh.addColorStop(0,"rgba(200,245,255,0)");sh.addColorStop(0.15,"rgba(200,245,255,0.65)");sh.addColorStop(0.5,"rgba(255,255,255,0.85)");sh.addColorStop(0.85,"rgba(200,245,255,0.65)");sh.addColorStop(1,"rgba(200,245,255,0)");
    ctx.strokeStyle=sh;ctx.lineWidth=1;ctx.shadowColor="#b0f0ff";ctx.shadowBlur=3;ctx.beginPath();
    for(let x=0;x<=cw;x+=STEP){const y=topY(sl,x,cw,ch,s.time,em)-1;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.stroke();ctx.restore();s.raf=requestAnimationFrame(draw);
  },[recording,LAYERS,topY,botY,as]);
  useEffect(()=>{const cv=canvasRef.current;cv.width=canvasWidth||IPAD_P_W;cv.height=200;},[canvasWidth]);
  useEffect(()=>{const s=stateRef.current;s.raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(s.raf);},[draw]);
  return <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block"}}/>;
}

// ── HapticDot ─────────────────────────────────────────────────────────────────
const HapticDot = memo(function HapticDot({recording,T}){
  return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,height:20}}>
    {[0,1,2].map(i=>(<div key={i} style={{width:recording?5:3,height:recording?5:3,borderRadius:"50%",background:recording?`${T.hapticActive}${0.9-i*0.2})`:T.hapticIdle,boxShadow:recording?`0 0 ${7+i*2}px ${T.hapticGlow}`:"none",transition:"all 0.4s ease",animation:recording?`hpop 1.1s ease-in-out ${i*0.16}s infinite`:"none"}}/>))}
  </div>);
});

// ── PatientCard ───────────────────────────────────────────────────────────────
const VITALS=[{label:"BP",value:"124/82"},{label:"HR",value:"71 bpm"},{label:"SpO₂",value:"98%"},{label:"Temp",value:"36.8°C"},{label:"RR",value:"16/min"},{label:"BMI",value:"24.1"}];
const ALLERGIES=["Penicillin","Sulfa","NSAIDs"];

const PatientCard = memo(function PatientCard({recording,T,portrait}){
  const [hidden,setHidden]=useState(false);
  const toggle=useCallback(()=>setHidden(h=>!h),[]);
  const lbl={fontSize:8,letterSpacing:"0.20em",textTransform:"uppercase",minWidth:58,flexShrink:0,lineHeight:"1.4",color:recording?T.labelTxtRec:T.labelTxt,transition:"color 0.6s ease"};
  const val={fontSize:11,letterSpacing:"0.01em",lineHeight:"1.4",color:T.valueTxt};
  const Row=({label,value})=>(<div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}><div style={lbl}>{label}</div><div style={val}>{value}</div></div>);
  const Chip=({children})=>(<span style={{display:"inline-block",background:T.tagBg,border:`1px solid ${T.tagBorder}`,color:T.tagTxt,fontSize:8,letterSpacing:"0.13em",textTransform:"uppercase",padding:"2px 7px",borderRadius:3}}>{children}</span>);
  const SR=({label})=>(<div style={{display:"flex",alignItems:"center",gap:8,margin:"11px 0 9px"}}><span style={{fontSize:7.5,letterSpacing:"0.24em",textTransform:"uppercase",whiteSpace:"nowrap",color:T.sectionHead}}>{label}</span><div style={{flex:1,height:1,background:T.divider}}/></div>);
  return(
    <div style={{background:T.cardBg,border:`1px solid ${recording?T.cardBorderRec:T.cardBorder}`,borderRadius:11,width:portrait?"100%":460,boxShadow:recording?T.cardShadowRec:T.cardShadow,transition:"box-shadow 0.8s ease,border-color 0.8s ease",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(50,22,150,0.05) 0%,rgba(60,180,225,0.03) 100%)",opacity:recording?1:0,transition:"opacity 0.8s ease",pointerEvents:"none",borderRadius:11}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 18px",borderBottom:`1px solid ${hidden?T.divider:"transparent"}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:7,background:T.iconBox,border:`1px solid ${T.iconBoxBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.iconStroke} strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{color:T.nameTxt,fontSize:13.5,fontWeight:500}}>Eleanor Voss</span>
              {recording&&(<span style={{display:"flex",alignItems:"center",gap:4}}><span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:T.tagTxt,boxShadow:`0 0 5px ${T.tagTxt}`,animation:"statusPulse 2s ease-in-out infinite"}}/><span style={{color:T.tagTxt,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase"}}>Live</span></span>)}
            </div>
            <div style={{color:recording?T.labelTxtRec:T.labelTxt,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",marginTop:1}}>Patient · Internal Medicine</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{background:T.chip,border:`1px solid ${T.chipBorder}`,borderRadius:5,padding:"4px 10px"}}><div style={{color:recording?T.labelTxtRec:T.labelTxt,fontSize:7,letterSpacing:"0.20em",textTransform:"uppercase",marginBottom:1}}>MRN</div><div style={{color:T.valueTxt,fontSize:10.5}}>MRN-0042817</div></div>
          <button onClick={toggle} style={{borderRadius:5,padding:"5px 10px",fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",outline:"none",border:`1px solid ${T.hideBtnBorder}`,background:T.hideBtn,color:T.hideBtnTxt,display:"flex",alignItems:"center",gap:5}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">{hidden?<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
            {hidden?"Show":"Hide"}
          </button>
        </div>
      </div>
      <div style={{maxHeight:hidden?0:320,overflow:"hidden",transition:"max-height 0.38s cubic-bezier(0.4,0,0.2,1)"}}>
        <div style={{padding:"13px 18px 15px",display:"grid",gridTemplateColumns:portrait?"1fr 1fr":"1fr",gap:portrait?"0 28px":0}}>
          <div><SR label="Demographics"/><Row label="DOB" value="14 Mar 1968 (56 yrs)"/><Row label="Sex" value="Female"/><Row label="Insurance" value="BlueCross PPO"/><Row label="Language" value="English"/><SR label="Allergies"/><div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>{ALLERGIES.map(a=><Chip key={a}>{a}</Chip>)}</div></div>
          <div><SR label="Encounter"/><Row label="Provider" value="Dr. S. Okafor, MD"/><Row label="Visit type" value="Follow-up"/><Row label="ID" value="ENC-20240311-04"/><Row label="Complaint" value="HTN review"/><SR label="Vitals — last visit"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 5px"}}>{VITALS.map(v=>(<div key={v.label} style={{background:T.chip,border:`1px solid ${T.chipBorder}`,borderRadius:5,padding:"5px 7px"}}><div style={{color:recording?T.labelTxtRec:T.labelTxt,fontSize:7,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:2}}>{v.label}</div><div style={{color:T.valueTxt,fontSize:10.5}}>{v.value}</div></div>))}</div></div>
        </div>
      </div>
    </div>
  );
});

// ── ActionButtons ─────────────────────────────────────────────────────────────
const AB={display:"flex",alignItems:"center",gap:6,borderRadius:7,padding:"9px 14px",outline:"none",fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",transition:"all 0.25s ease",touchAction:"manipulation"};

const ActionButtons = memo(function ActionButtons({hasRecording,onDelete,onSoap,T}){
  const [showMore,setShowMore]=useState(false);
  const [soapDone,setSoapDone]=useState(false);
  const VS=useMemo(()=>({danger:{bg:T.actDangerBg,border:T.actDangerBorder,txt:T.actDangerTxt},primary:{bg:T.actPrimaryBg,border:T.actPrimaryBorder,txt:T.actPrimaryTxt},normal:{bg:T.actBg,border:T.actBorder,txt:T.actTxt}}),[T.actDangerBg,T.actDangerBorder,T.actDangerTxt,T.actPrimaryBg,T.actPrimaryBorder,T.actPrimaryTxt,T.actBg,T.actBorder,T.actTxt]);
  if(!hasRecording)return null;
  const Btn=({onClick,variant="normal",children})=>{const[h,sh]=useState(false);const v=VS[variant];return(<button onClick={onClick} onMouseEnter={()=>sh(true)} onMouseLeave={()=>sh(false)} style={{...AB,background:v.bg,border:`1px solid ${v.border}`,color:v.txt,boxShadow:T.actShadow,opacity:h?1:0.92,transform:h?"translateY(-1px)":"none"}}>{children}</button>);};
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:6,maxHeight:showMore?60:0,overflow:"hidden",transition:"max-height 0.32s cubic-bezier(0.4,0,0.2,1),opacity 0.25s ease",opacity:showMore?1:0}}>
        <Btn><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Export PDF</Btn>
        <Btn><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy Transcript</Btn>
        <Btn><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send to EHR</Btn>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <Btn variant="danger" onClick={onDelete}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>Delete</Btn>
        <Btn onClick={()=>setShowMore(m=>!m)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>{showMore?"Less":"More"}</Btn>
        {/* ↓ THIS is the button that triggers navigation to SoapScreen */}
        <Btn variant="primary" onClick={()=>{setSoapDone(true);onSoap();}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>{soapDone?"Regenerate SOAP":"SOAP Note"}</Btn>
      </div>
    </div>
  );
});

// ── RecordButton ──────────────────────────────────────────────────────────────
const RINGS=[0,1,2];
const RecordButton=memo(function RecordButton({recording,onToggle,T}){
  const [press,setPress]=useState(false);
  const onS=useCallback((e)=>{e.preventDefault();setPress(true);},[]);
  const onE=useCallback((e)=>{e.preventDefault();setPress(false);onToggle();},[onToggle]);
  const onC=useCallback((e)=>{e.preventDefault();setPress(false);},[]);
  return(
    <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,width:110,height:110}}>
      {recording&&RINGS.map(i=>(<div key={i} style={{position:"absolute",width:110,height:110,borderRadius:"50%",border:`1px solid ${T.ringColor}${0.13-i*0.04})`,animation:`ringOut 2.6s ease-out ${i*0.75}s infinite`,pointerEvents:"none"}}/>))}
      <button onMouseDown={onS} onMouseUp={onE} onMouseLeave={onC} onTouchStart={onS} onTouchEnd={onE} onTouchCancel={onC}
        style={{width:84,height:84,borderRadius:"50%",background:T.btnBg,border:`1px solid ${recording?T.btnBorderRec:T.btnBorder}`,boxShadow:recording?T.btnShadowRec:T.btnShadow,display:"flex",alignItems:"center",justifyContent:"center",outline:"none",transform:press?"scale(0.90)":"scale(1)",transition:"transform 0.13s ease,box-shadow 0.8s ease,border-color 0.8s ease",touchAction:"manipulation",WebkitAppearance:"none",flexShrink:0}}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={recording?T.micStrokeRec:T.micStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{transition:"stroke 0.8s ease",pointerEvents:"none"}}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/></svg>
      </button>
    </div>
  );
});

const TODAY=new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});

// ── App (Screen 1) ────────────────────────────────────────────────────────────
// Props:
//   onNavigateToSoap() — called when user taps "SOAP Note"; defined in main.jsx
//   light / setLight   — passed from main.jsx so theme persists across screens
//   portrait           — passed from main.jsx's useOrientation()
export default function RecorderScreen({ onNavigateToSoap, light, setLight, portrait }) {
  const [recording,setRecording]=useState(false);
  const [hasRecording,setHasRecording]=useState(false);
  const T=useMemo(()=>(light?LIGHT:DARK),[light]);
  const W=portrait?IPAD_P_W:IPAD_L_W;
  const H=portrait?IPAD_P_H:IPAD_L_H;
  const handleToggle=useCallback(()=>setRecording(r=>{if(r)setHasRecording(true);return!r;}),[]);
  const handleDelete=useCallback(()=>setHasRecording(false),[]);
  const toggleLight=useCallback(()=>setLight(l=>!l),[setLight]);
  const tbBtn={background:light?"rgba(22,95,178,0.10)":"rgba(255,255,255,0.06)",border:`1px solid ${light?"rgba(22,95,178,0.22)":"rgba(255,255,255,0.08)"}`,borderRadius:5,padding:"4px 11px",color:T.topbarSub,fontSize:8.5,letterSpacing:"0.18em",textTransform:"uppercase",outline:"none",display:"flex",alignItems:"center",gap:6,touchAction:"manipulation"};

  return(
    <div style={{width:W,height:H,background:T.bg,position:"relative",overflow:"hidden",fontFamily:"'DM Mono','Courier New',monospace",transition:"background 0.5s ease"}}>
      <div style={{position:"absolute",width:"110%",height:"110%",borderRadius:"50%",background:`radial-gradient(ellipse at center,${T.glowCenter} 0%,transparent 55%)`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:"60%",height:"60%",borderRadius:"50%",background:`radial-gradient(ellipse at center,${T.glowRight} 0%,transparent 55%)`,top:"42%",right:"-8%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:"48%",height:"48%",borderRadius:"50%",background:`radial-gradient(ellipse at center,${T.glowLeft} 0%,transparent 55%)`,top:"55%",left:"-6%",transform:"translateY(-50%)",pointerEvents:"none"}}/>

      {/* Topbar */}
      <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 28px 0",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.topbarTxt} strokeWidth="1.6" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <span style={{color:T.topbarTxt,fontSize:10.5,letterSpacing:"0.24em",textTransform:"uppercase"}}>Veridian</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={toggleLight} style={tbBtn}>{light?<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>:<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}{light?"Light":"Dark"}</button>
          <div style={{color:T.topbarSub,fontSize:9.5,letterSpacing:"0.16em",textTransform:"uppercase"}}>{TODAY}</div>
        </div>
      </div>

      {/* Portrait layout */}
      {portrait&&(<>
        <div style={{position:"absolute",top:"38%",left:0,right:0,height:220,transform:"translateY(-54%)"}}><Waveform recording={recording} light={light} canvasWidth={IPAD_P_W}/></div>
        <div style={{position:"absolute",top:"50%",left:0,right:0,transform:"translateY(calc(-50% + 120px))",display:"flex",justifyContent:"center"}}><HapticDot recording={recording} T={T}/></div>
        <div style={{position:"absolute",bottom:28,left:24,right:24,display:"flex",flexDirection:"column",gap:14}}>
          <PatientCard recording={recording} T={T} portrait={true}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:4}}>
            <ActionButtons hasRecording={hasRecording} onDelete={handleDelete} onSoap={onNavigateToSoap} T={T}/>
            <RecordButton recording={recording} onToggle={handleToggle} T={T}/>
          </div>
        </div>
      </>)}

      {/* Landscape layout */}
      {!portrait&&(<>
        <div style={{position:"absolute",top:"46%",left:0,right:0,height:180,transform:"translateY(-50%)"}}><Waveform recording={recording} light={light} canvasWidth={IPAD_L_W}/></div>
        <div style={{position:"absolute",top:"50%",left:0,right:0,transform:"translateY(calc(-50% + 100px))",display:"flex",justifyContent:"center"}}><HapticDot recording={recording} T={T}/></div>
        <div style={{position:"absolute",bottom:22,left:22,right:22,display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16}}>
          <PatientCard recording={recording} T={T} portrait={false}/>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10,flexShrink:0}}>
            <ActionButtons hasRecording={hasRecording} onDelete={handleDelete} onSoap={onNavigateToSoap} T={T}/>
            <RecordButton recording={recording} onToggle={handleToggle} T={T}/>
          </div>
        </div>
      </>)}
    </div>
  );
}