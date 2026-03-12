// Router.jsx — screen navigation. Import this from your main.jsx entry point.
import { useState, useEffect } from "react";
import RecorderScreen, { useOrientation } from "./App";
import SoapScreen from "./SoapScreen";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
  html,body{overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important;position:fixed!important;width:100%!important;height:100%!important;margin:0;padding:0;}
  *{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;}
  button{touch-action:manipulation;}
  @keyframes hpop{0%,100%{transform:scaleY(1);opacity:.7}50%{transform:scaleY(2.4);opacity:1}}
  @keyframes ringOut{0%{transform:scale(1);opacity:.45}100%{transform:scale(1.88);opacity:0}}
  @keyframes statusPulse{0%,100%{opacity:0.5}50%{opacity:1}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes checkPop{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
  @keyframes slideInFromRight{from{transform:translateX(60px);opacity:0}to{transform:translateX(0);opacity:1}}
`;

export default function Router() {
  const [screen, setScreen] = useState("recorder");
  const [light,  setLight]  = useState(false);
  const portrait = useOrientation();

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    document.addEventListener("touchmove",  prevent, { passive: false });
    document.addEventListener("touchstart", prevent, { passive: false });
    return () => {
      document.removeEventListener("touchmove",  prevent);
      document.removeEventListener("touchstart", prevent);
    };
  }, []);

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