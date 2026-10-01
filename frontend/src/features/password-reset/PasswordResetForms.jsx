import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useLanguage } from "../language/useLanguage";

function StepHeading({ icon, title, description }) {
  return (
    <div className="reset-step-heading">
      <span className="reset-step-icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ErrorMessage({ children }) {
  return children ? <p className="reset-error" role="alert">{children}</p> : null;
}

export function EmailStep({ email, onEmailChange, onSubmit, pending, error }) {
  const { t } = useLanguage();
  return (
    <form className="reset-form" onSubmit={onSubmit}>
      <StepHeading icon={<Mail size={21} aria-hidden="true" />} title={t("passwordReset.emailTitle")} description={t("passwordReset.emailDescription")} />
      <label className="reset-field-label" htmlFor="reset-email">{t("auth.email")}</label>
      <input
        id="reset-email"
        className="reset-input"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="you@example.com"
        required
      />
      <ErrorMessage>{error}</ErrorMessage>
      <button className="reset-primary-button" type="submit" disabled={pending}>
        {pending ? <><span className="loading loading-spinner loading-xs" />{t("passwordReset.sending")}</> : <>{t("passwordReset.sendCode")}<ArrowRight size={17} /></>}
      </button>
    </form>
  );
}

export function CodeStep({ email, code, onCodeChange, onSubmit, onResend, onBack, pending, resending, secondsRemaining, error }) {
  const { t } = useLanguage();
  const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, "0");
  const seconds = (secondsRemaining % 60).toString().padStart(2, "0");
  return (
    <form className="reset-form" onSubmit={onSubmit}>
      <StepHeading icon={<ShieldCheck size={21} aria-hidden="true" />} title={t("passwordReset.codeTitle")} description={t("passwordReset.codeDescription")} />
      <p className="reset-email-target"><Mail size={15} />{email}</p>
      <label className="reset-field-label" htmlFor="reset-code">{t("passwordReset.codeLabel")}</label>
      <input
        id="reset-code"
        className="reset-input reset-code-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={code}
        onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        aria-describedby="reset-code-help"
        required
      />
      <div className="reset-code-meta" id="reset-code-help">
        <span>{secondsRemaining > 0 ? t("passwordReset.expires") : t("passwordReset.expired")}</span>
        <strong className={secondsRemaining <= 30 ? "is-expiring" : ""}>{minutes}:{seconds}</strong>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      <button className="reset-primary-button" type="submit" disabled={pending || code.length !== 6 || secondsRemaining <= 0}>
        {pending ? <><span className="loading loading-spinner loading-xs" />{t("passwordReset.verifying")}</> : <>{t("passwordReset.verifyCode")}<ArrowRight size={17} /></>}
      </button>
      <div className="reset-secondary-actions">
        <button type="button" className="reset-text-button" onClick={onBack}><ArrowLeft size={15} />{t("passwordReset.changeEmail")}</button>
        <button type="button" className="reset-text-button" onClick={onResend} disabled={resending}>
          {resending ? t("passwordReset.sending") : t("passwordReset.resend")}
        </button>
      </div>
    </form>
  );
}

export function PasswordStep({ password, confirmPassword, onPasswordChange, onConfirmChange, onSubmit, onBack, pending, error }) {
  const { t } = useLanguage();
  return (
    <form className="reset-form" onSubmit={onSubmit}>
      <StepHeading icon={<KeyRound size={21} aria-hidden="true" />} title={t("passwordReset.newPasswordTitle")} description={t("passwordReset.newPasswordDescription")} />
      <label className="reset-field-label" htmlFor="new-password">{t("passwordReset.newPassword")}</label>
      <input
        id="new-password"
        className="reset-input"
        type="password"
        autoComplete="new-password"
        minLength={6}
        maxLength={128}
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="••••••••"
        required
      />
      <label className="reset-field-label reset-confirm-label" htmlFor="confirm-password">{t("passwordReset.confirmPassword")}</label>
      <input
        id="confirm-password"
        className="reset-input"
        type="password"
        autoComplete="new-password"
        minLength={6}
        maxLength={128}
        value={confirmPassword}
        onChange={(event) => onConfirmChange(event.target.value)}
        placeholder="••••••••"
        required
      />
      <p className="reset-password-hint">{t("passwordReset.passwordHint")}</p>
      <ErrorMessage>{error}</ErrorMessage>
      <button className="reset-primary-button" type="submit" disabled={pending || password.length < 6 || password !== confirmPassword}>
        {pending ? <><span className="loading loading-spinner loading-xs" />{t("passwordReset.resetting")}</> : <>{t("passwordReset.resetButton")}<LockKeyhole size={17} /></>}
      </button>
      <button type="button" className="reset-text-button reset-back-button" onClick={onBack}><ArrowLeft size={15} />{t("passwordReset.backToCode")}</button>
    </form>
  );
}
