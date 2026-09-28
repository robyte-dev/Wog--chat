let googleIdentityScriptPromise;

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity="true"]');
    const script = existing || document.createElement("script");

    const handleLoad = () => {
      if (window.google?.accounts?.id) {
        script.dataset.loaded = "true";
        resolve(window.google.accounts.id);
      } else {
        script.remove();
        reject(new Error("Google Identity Services did not initialize."));
      }
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () => {
      script.remove();
      reject(new Error("Google sign-in could not be loaded."));
    }, { once: true });

    if (!existing) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    googleIdentityScriptPromise = null;
    throw error;
  });

  return googleIdentityScriptPromise;
}
