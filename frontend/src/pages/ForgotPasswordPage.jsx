import { useEffect, useState } from "react";
import { ArrowLeft, Check, LockKeyhole, ShipWheelIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import LanguageSelector from "../features/language/LanguageSelector";
import { useLanguage } from "../features/language/useLanguage";
import {
  completePasswordReset,
  requestPasswordReset,
  verifyPasswordResetCode,
} from "../lib/api";
import { CodeStep, EmailStep, PasswordStep } from "../features/password-reset/PasswordResetForms";
import "../features/password-reset/password-reset.css";

const STEPS = ["email", "code", "password"];

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step !== "code" || secondsRemaining <= 0) return undefined;
    const timer = window.setInterval(() => setSecondsRemaining((remaining) => Math.max(remaining - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsRemaining]);

  const beginCodeCountdown = () => setSecondsRemaining(5 * 60);
  const showRequestError = (requestError) => setError(requestError.response?.data?.message || t("passwordReset.genericError"));

  const sendCode = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await requestPasswordReset(email);
      setEmail(email.trim().toLowerCase());
      setCode("");
      beginCodeCountdown();
      setStep("code");
      toast.success(result.message);
    } catch (requestError) {
      showRequestError(requestError);
    } finally {
      setPending(false);
    }
  };

  const resendCode = async () => {
    setResending(true);
    setError("");
    try {
      const result = await requestPasswordReset(email);
      setCode("");
      beginCodeCountdown();
      toast.success(result.message);
    } catch (requestError) {
      showRequestError(requestError);
    } finally {
      setResending(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await verifyPasswordResetCode({ email, code });
      setResetToken(result.resetToken);
      setStep("password");
    } catch (requestError) {
      showRequestError(requestError);
    } finally {
      setPending(false);
    }
  };

  const saveNewPassword = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t("passwordReset.passwordMismatch"));
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await completePasswordReset({ resetToken, password });
      toast.success(result.message);
      navigate("/login", { replace: true });
    } catch (requestError) {
      showRequestError(requestError);
    } finally {
      setPending(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <main className="auth-page-shell reset-page-shell">
      <LanguageSelector className="auth-language-selector" />
      <section className="reset-card" aria-labelledby="reset-page-title">
        <div className="reset-content">
          <Link to="/login" className="reset-brand" aria-label={t("passwordReset.backToLogin")}>
            <span className="reset-brand-icon"><ShipWheelIcon size={25} /></span>
            <span>WOG</span>
          </Link>

          <div className="reset-intro">
            <p className="reset-eyebrow">{t("passwordReset.eyebrow")}</p>
            <h1 id="reset-page-title">{t("passwordReset.title")}</h1>
            <p>{t("passwordReset.description")}</p>
          </div>

          <ol className="reset-progress" aria-label={t("passwordReset.progressLabel")}>
            {STEPS.map((item, index) => (
              <li key={item} className={index < stepIndex ? "is-complete" : index === stepIndex ? "is-current" : ""}>
                <span>{index < stepIndex ? <Check size={14} /> : index + 1}</span>
                <small>{t(`passwordReset.step.${item}`)}</small>
              </li>
            ))}
          </ol>

          {step === "email" && <EmailStep email={email} onEmailChange={setEmail} onSubmit={sendCode} pending={pending} error={error} />}
          {step === "code" && (
            <CodeStep
              email={email}
              code={code}
              onCodeChange={setCode}
              onSubmit={verifyCode}
              onResend={resendCode}
              onBack={() => { setError(""); setStep("email"); }}
              pending={pending}
              resending={resending}
              secondsRemaining={secondsRemaining}
              error={error}
            />
          )}
          {step === "password" && (
            <PasswordStep
              password={password}
              confirmPassword={confirmPassword}
              onPasswordChange={setPassword}
              onConfirmChange={setConfirmPassword}
              onSubmit={saveNewPassword}
              onBack={() => { setError(""); setStep("code"); }}
              pending={pending}
              error={error}
            />
          )}

          <Link to="/login" className="reset-login-link"><ArrowLeft size={15} />{t("passwordReset.backToLogin")}</Link>
        </div>

        <aside className="reset-visual" aria-hidden="true">
          <div className="reset-visual-orbit reset-orbit-one" />
          <div className="reset-visual-orbit reset-orbit-two" />
          <img src="/wog.png" alt="" />
          <div className="reset-visual-copy">
            <span>{t("passwordReset.visualEyebrow")}</span>
            <h2>{t("passwordReset.visualTitle")}</h2>
            <p>{t("passwordReset.visualDescription")}</p>
          </div>
          <div className="reset-secure-pill"><LockKeyhole size={15} />{t("passwordReset.secureLabel")}</div>
        </aside>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
