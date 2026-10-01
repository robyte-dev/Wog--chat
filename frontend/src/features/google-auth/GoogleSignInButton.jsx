import { useEffect, useRef, useState } from "react";
import useGoogleAuth from "./useGoogleAuth";
import { loadGoogleIdentityScript } from "./googleIdentity";
import { useLanguage } from "../language/useLanguage";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleSignInButton = ({ onVerificationRequired }) => {
  const buttonRef = useRef(null);
  const { t } = useLanguage();
  const { mutate, isPending, error } = useGoogleAuth();
  const [widgetError, setWidgetError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const buttonElement = buttonRef.current;

    if (!GOOGLE_CLIENT_ID) {
      setWidgetError(t("auth.googleNotConfigured"));
      return () => { cancelled = true; };
    }

    setWidgetError("");
    loadGoogleIdentityScript()
      .then((identity) => {
        if (cancelled || !buttonElement) return;
        const nonce = window.crypto.randomUUID();
        identity.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce,
          callback: (response) => {
            if (response?.credential) mutate({ credential: response.credential, nonce }, {
              onSuccess: (result) => result?.requiresVerification && onVerificationRequired?.(result.email),
            });
            else setWidgetError(t("auth.googleTryAgain"));
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const width = Math.floor(buttonElement.getBoundingClientRect().width);
        buttonElement.replaceChildren();
        identity.renderButton(buttonElement, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.max(200, Math.min(400, width)),
        });
      })
      .catch((loadError) => {
        if (!cancelled) setWidgetError(loadError.message || t("auth.googleTryAgain"));
      });

    return () => {
      cancelled = true;
      buttonElement?.replaceChildren();
    };
  }, [mutate, onVerificationRequired, t]);

  const errorMessage = error?.response?.data?.message || widgetError;

  return (
    <div className="google-auth-block" aria-busy={isPending}>
      <div className="google-auth-divider"><span>{t("auth.orContinueWith")}</span></div>
      <div className={`google-auth-button ${isPending ? "is-pending" : ""}`} ref={buttonRef} />
      {isPending && <p className="google-auth-status">{t("auth.googleSigningIn")}</p>}
      {errorMessage && <p className="google-auth-error" role="status">{errorMessage}</p>}
    </div>
  );
};

export default GoogleSignInButton;
