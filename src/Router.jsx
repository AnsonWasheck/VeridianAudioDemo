// Router.jsx — screen navigation. Import this from your main.jsx entry point.
import { useState, useEffect, useRef, useCallback } from "react";
import RecorderScreen, { useOrientation } from "./App";
import SoapScreen from "./SoapScreen";

const IPAD_P_W = 834;
const IPAD_P_H = 1194;
const IPAD_L_W = 1194;
const IPAD_L_H = 834;

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    overscroll-behavior: none;
    background: #08090f;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  button, input, textarea, select, a, [role="button"], label {
    touch-action: manipulation;
    cursor: pointer;
  }

  /* Centers the scaled iPad frame in the browser window */
  #veridian-scaler {
    position: fixed;
    top: 0; left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #08090f;
  }

  #veridian-frame {
    transform-origin: center center;
    /* Crisp rendering at any scale */
    image-rendering: crisp-edges;
    -webkit-font-smoothing: antialiased;
  }

  @keyframes hpop        { 0%,100%{transform:scaleY(1);opacity:.7}  50%{transform:scaleY(2.4);opacity:1} }
  @keyframes ringOut     { 0%{transform:scale(1);opacity:.45}        100%{transform:scale(1.88);opacity:0} }
  @keyframes statusPulse { 0%,100%{opacity:0.5}                      50%{opacity:1} }
  @keyframes spin        { from{transform:rotate(0deg)}               to{transform:rotate(360deg)} }
  @keyframes blink       { 0%,100%{opacity:1}                        50%{opacity:0} }
  @keyframes checkPop    { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes slideInFromRight { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
`;

const INTERACTIVE_TAGS = new Set(["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A", "LABEL"]);

function isInteractive(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  if (INTERACTIVE_TAGS.has(el.tagName)) return true;
  if (el.getAttribute?.("role") === "button") return true;
  if (el.hasAttribute?.("tabindex")) return true;
  return isInteractive(el.parentElement);
}

// Compute the uniform scale that fits the iPad frame inside the window
// with a small margin so it never touches the edges.
function computeScale(portrait) {
  const MARGIN = 0.97; // 97% of available space
  const frameW = portrait ? IPAD_P_W : IPAD_L_W;
  const frameH = portrait ? IPAD_P_H : IPAD_L_H;
  const scaleX = (window.innerWidth  * MARGIN) / frameW;
  const scaleY = (window.innerHeight * MARGIN) / frameH;
  return Math.min(scaleX, scaleY, 1); // never scale UP, only down
}

export default function Router() {
  const [screen, setScreen] = useState("recorder");
  const [light,  setLight]  = useState(false);
  const portrait = useOrientation();
  const [scale,  setScale]  = useState(() => computeScale(true));
  const touchOnInteractive = useRef(false);

  // Recompute scale on resize or orientation change
  const updateScale = useCallback(() => {
    setScale(computeScale(portrait));
  }, [portrait]);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  // Inject global CSS
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Touch handling — passive touchstart so click is never blocked,
  // touchmove preventDefault only for non-interactive elements.
  useEffect(() => {
    const onTouchStart = (e) => {
      touchOnInteractive.current = isInteractive(e.target);
    };
    const onTouchMove = (e) => {
      if (!touchOnInteractive.current) e.preventDefault();
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove",  onTouchMove,  { passive: false });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove",  onTouchMove);
    };
  }, []);

  // Keyboard shortcut: O = toggle light/dark
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
      {/*
        The frame div is exactly iPad-sized. CSS scale() shrinks it to fit
        the browser window. Because scale() does not affect layout (the element
        still occupies its original pixel footprint in the DOM), we also
        set explicit width/height so the centering flexbox works correctly.

        Critically: scale() does NOT affect pointer event coordinates in modern
        browsers — the browser maps click/touch positions through the transform
        automatically, so all hit targets remain accurate at any zoom level.
      */}
      <div
        id="veridian-frame"
        style={{
          width:  frameW,
          height: frameH,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          overflow: "hidden",
          borderRadius: scale < 1 ? 16 : 0,
          boxShadow: scale < 1 ? "0 20px 80px rgba(0,0,0,0.8)" : "none",
          flexShrink: 0,
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