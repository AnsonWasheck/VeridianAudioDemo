// Router.jsx
import { useState, useEffect, useCallback } from "react";
import RecorderScreen, { useOrientation } from "./App";
import SoapScreen from "./SoapScreen";

const IPAD_P_W = 834;
const IPAD_P_H = 1194;
const IPAD_L_W = 1194;
const IPAD_L_H = 834;

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');

  html, body {
    margin: 0; padding: 0;
    width: 100%; height: 100%;
    overflow: hidden;
    overscroll-behavior: none;
    background: #08090f;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  /*
    PWA FIX: Every interactive element gets touch-action:manipulation + cursor:pointer.
    This is the #1 fix for iOS standalone mode — without cursor:pointer Safari
    does not consider the element "clickable" and silently drops the tap.
  */
  button, input, textarea, select, a, label, [role="button"] {
    touch-action: manipulation !important;
    cursor: pointer !important;
    -webkit-tap-highlight-color: transparent;
    /* Prevent iOS from zooming on double-tap of buttons */
    user-select: none;
    -webkit-user-select: none;
  }

  /* Center + scale the iPad frame in browser */
  #veridian-scaler {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #08090f;
    /* 
      PWA FIX: Do NOT set touch-action or pointer-events on this container.
      Any restriction here kills button taps in standalone mode.
    */
  }

  #veridian-frame {
    transform-origin: center center;
    -webkit-font-smoothing: antialiased;
    flex-shrink: 0;
  }

  @keyframes hpop        { 0%,100%{transform:scaleY(1);opacity:.7}  50%{transform:scaleY(2.4);opacity:1} }
  @keyframes ringOut     { 0%{transform:scale(1);opacity:.45}        100%{transform:scale(1.88);opacity:0} }
  @keyframes statusPulse { 0%,100%{opacity:0.5}                      50%{opacity:1} }
  @keyframes spin        { from{transform:rotate(0deg)}               to{transform:rotate(360deg)} }
  @keyframes blink       { 0%,100%{opacity:1}                        50%{opacity:0} }
  @keyframes checkPop    { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes slideInFromRight { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
`;

function computeScale(portrait) {
  const fw = portrait ? IPAD_P_W : IPAD_L_W;
  const fh = portrait ? IPAD_P_H : IPAD_L_H;
  const sx = (window.innerWidth  * 0.97) / fw;
  const sy = (window.innerHeight * 0.97) / fh;
  return Math.min(sx, sy, 1);
}

export default function Router() {
  const [screen, setScreen] = useState("recorder");
  const [light,  setLight]  = useState(false);
  const portrait = useOrientation();
  const [scale,  setScale]  = useState(() => computeScale(true));

  const updateScale = useCallback(() => {
    setScale(computeScale(portrait));
  }, [portrait]);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  /*
    PWA FIX: Only block touchmove (prevents rubber-band scroll).
    NEVER call preventDefault on touchstart — it kills onClick in PWA mode.
    NEVER block touchend — iOS needs it to fire the click event.
  */
  useEffect(() => {
    const onTouchMove = (e) => {
      // Allow scroll inside elements that are actually scrollable
      let el = e.target;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const overflow = style.overflowY;
        if ((overflow === "auto" || overflow === "scroll") && el.scrollHeight > el.clientHeight) {
          return; // let it scroll naturally
        }
        el = el.parentElement;
      }
      e.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => document.removeEventListener("touchmove", onTouchMove);
  }, []);

  // Dev shortcut: O key toggles theme
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "o" || e.key === "O") setLight(l => !l);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const frameW = portrait ? IPAD_P_W : IPAD_L_W;
  const frameH = portrait ? IPAD_P_H : IPAD_L_H;

  return (
    <div id="veridian-scaler">
      <div
        id="veridian-frame"
        style={{
          width: frameW,
          height: frameH,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          overflow: "hidden",
          borderRadius: scale < 1 ? 16 : 0,
          boxShadow: scale < 1 ? "0 24px 80px rgba(0,0,0,0.85)" : "none",
        }}
      >
        {screen === "recorder" && (
          <RecorderScreen
            onNavigateToSoap={() => setScreen("soap")}
            light={light}
            setLight={setLight}
            portrait={portrait}
          />
        )}
        {screen === "soap" && (
          <SoapScreen
            onBack={() => setScreen("recorder")}
            light={light}
            portrait={portrait}
          />
        )}
      </div>
    </div>
  );
}