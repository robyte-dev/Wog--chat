import { LanguagesIcon } from "lucide-react";
import { useLanguage } from "./useLanguage";
import { LANGUAGES } from "./translations";

const LanguageSelector = ({ className = "" }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`language-selector ${className}`}>
      <LanguagesIcon aria-hidden="true" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        className="language-choice"
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t("language.label")}
      >
        {LANGUAGES.map(({ code, label, short }) => (
          <option key={code} value={code}>{short} · {label}</option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelector;
