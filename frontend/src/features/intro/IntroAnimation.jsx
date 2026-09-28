import { useCallback, useEffect, useState } from "react";
import "./intro-animation.css";
import { useLanguage } from "../language/useLanguage";

const INTRO_KEY = "wog-intro-seen";

const IntroAnimation = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(() => {
    try {
      return window.sessionStorage.getItem(INTRO_KEY) !== "true";
    } catch {
      return true;
    }
  });

  const finishIntro = useCallback(() => {
    try {
      window.sessionStorage.setItem(INTRO_KEY, "true");
    } catch {
      // The intro still dismisses when session storage is disabled.
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => finishIntro(), reducedMotion ? 500 : 2900);
    return () => window.clearTimeout(timer);
  }, [finishIntro, visible]);

  if (!visible) return null;

  return (
    <div className="wog-intro" role="status" aria-label="Welcome to WOG">
      <img className="wog-intro-map" src="/world-map-connection.svg" alt="" />
      <div className="wog-intro-content">
        <span className="wog-intro-orbit wog-intro-orbit-one" />
        <span className="wog-intro-orbit wog-intro-orbit-two" />
        <img className="wog-intro-favicon" src="/favicon.png" alt="WOG" />
        <span className="wog-intro-wordmark">WOG</span>
        <span className="wog-intro-tagline">{t("intro.tagline")}</span>
      </div>
      <span className="wog-intro-colors" aria-hidden="true" />
      <button className="wog-intro-skip" onClick={finishIntro} type="button">{t("intro.skip")}</button>
    </div>
  );
};

export default IntroAnimation;
