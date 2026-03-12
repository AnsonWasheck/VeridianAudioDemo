// Router.jsx — screen navigation. Import this from your main.jsx entry point.
import { useState, useEffect } from "react";
import RecorderScreen, { useOrientation } from "./App";
import SoapScreen from "./SoapScreen";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');

  html, body {
    overflow: hidden !important;
    overscroll-behavior: none !important;
    position: fixed !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0;
    padding: 0;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    /* NOTE: user-select is intentionally NOT set globally here.
       SoapScreen scopes its own .ss-body { user-select:text } for the note text.
       A global user-select:none would override that. */
    -webkit-tap-highlight-color: transparent;
  }

  /* Ensure all buttons respond immediately on iOS */
  button, [role="button"] {
    touch-action: manipulation;
    cursor: pointer;
  }

  @keyframes hpop        { 0%,100%{transform:scaleY(1);opacity:.7}  50%{transform:scaleY(2.4);opacity:1} }
  @keyframes ringOut     { 0%{transform:scale(1);opacity:.45}        100%{transform:scale(1.88);opacity:0} }
  @keyframes statusPulse { 0%,100%{opacity:0.5}                      50%{opacity:1} }
  @keyframes spin        { from{transform:rotate(0deg)}               to{transform:rotate(360deg)} }
  @keyframes blink       { 0%,100%{opacity:1}                        50%{opacity:0} }
  @keyframes checkPop    { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes slideInFromRight { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
`;

// Elements that are interactive — touchstart on these must NOT be prevented
// so that iOS can fire the subsequent click event.
const INTERACTIVE_TAGS = new Set(["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A", "LABEL"]);

function isInteractive(el) {
  if (!el) return false;
  if (INTERACTIVE_TAGS.has(el.tagName)) return true;
  if (el.getAttribute("role") === "button") return true;
  if (el.getAttribute("tabindex") !== null) return true;
  // Walk up to catch clicks on SVG children inside buttons, etc.
  return isInteractive(el.parentElement);
}

export default function Router() {
  const [screen, setScreen] = useState("recorder");
  const [light,  setLight]  = useState(false);
  const portrait = useOrientation();

  // Inject global CSS once
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Block touchmove globally to prevent iOS rubber-band scroll on the app shell.
  // Block touchstart ONLY on non-interactive elements so buttons still fire click.
  // Never block touchend — iOS needs it to synthesise the click event.
  useEffect(() => {
    const preventMove = (e) => e.preventDefault();

    const preventNonInteractiveTouchStart = (e) => {
      if (!isInteractive(e.target)) {
        e.preventDefault();
      }
      // If the target IS interactive, do nothing — let the event through
      // so iOS can fire touchend → click normally.
    };

    document.addEventListener("touchmove",  preventMove,                      { passive: false });
    document.addEventListener("touchstart", preventNonInteractiveTouchStart,  { passive: false });

    return () => {
      document.removeEventListener("touchmove",  preventMove);
      document.removeEventListener("touchstart", preventNonInteractiveTouchStart);
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

  return (
    <>
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
    </>
  );
}