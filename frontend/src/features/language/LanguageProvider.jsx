import { useEffect, useMemo, useState } from "react";
import LanguageContext from "./LanguageContext";
import { LANGUAGES, TRANSLATIONS } from "./translations";

const STORAGE_KEY = "wog-language";

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return LANGUAGES.some(({ code }) => code === saved) ? saved : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    const selected = LANGUAGES.find(({ code }) => code === language) || LANGUAGES[0];
    document.documentElement.lang = selected.htmlLang;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Language still works for this session if storage is unavailable.
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key, values = {}) => {
      let message = TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
      for (const [name, replacement] of Object.entries(values)) {
        message = message.replaceAll(`{${name}}`, String(replacement));
      }
      return message;
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
