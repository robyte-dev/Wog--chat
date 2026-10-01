import { useState } from "react";
import { ArrowRight, ShipWheelIcon } from "lucide-react";
import { Link } from "react-router";
import useLogin from "../hooks/useLogin";
import AuthSideNav from "../components/AuthSideNav";
import LanguageSelector from "../features/language/LanguageSelector";
import { useLanguage } from "../features/language/useLanguage";
import GoogleSignInButton from "../features/google-auth/GoogleSignInButton";
import DeviceVerification from "../features/sessions/DeviceVerification";

const LoginPage = () => {
  const { t } = useLanguage();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [verificationEmail, setVerificationEmail] = useState("");

  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData, { onSuccess: (result) => result?.requiresVerification && setVerificationEmail(result.email) });
  };

  return (
    <div className="auth-page-shell" data-theme="forest">
      <LanguageSelector className="auth-language-selector" />
      <div className="auth-panel">
        <AuthSideNav active="login" />
        <div className="auth-form-column">
          <div className="mb-6 flex items-center justify-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
              <ShipWheelIcon className="size-7 text-white" />
            </div>
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              WOG
            </span>
          </div>

          {verificationEmail ? (
            <DeviceVerification email={verificationEmail} onCancel={() => setVerificationEmail("")} />
          ) : <>
          {error && (
            <div className="alert alert-error mb-4 rounded-2xl">
              <span>{error.response?.data?.message || "Unable to sign in."}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-primary/80">{t("auth.welcome")}</p>
              <h2 className="mt-2 text-3xl font-semibold">{t("auth.loginTitle")}</h2>
              <p className="mt-2 text-sm text-base-content/70">
                {t("auth.loginDescription")}
              </p>
            </div>

            <div className="space-y-4">
              <div className="form-floating">
                <input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="hello@example.com"
                  required
                />
                <label htmlFor="login-email">{t("auth.email")}</label>
              </div>

              <div className="form-floating">
                <input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Password"
                  required
                />
                <label htmlFor="login-password">{t("auth.password")}</label>
              </div>
              <div className="-mt-2 flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-primary transition-colors hover:text-secondary hover:underline">
                  {t("passwordReset.link")}
                </Link>
              </div>
            </div>

            <button type="submit" className="auth-cta btn btn-primary" disabled={isPending}>
              {isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  {t("auth.signingIn")}
                </>
              ) : (
                <>
                  {t("auth.signIn")}
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </button>

            <GoogleSignInButton onVerificationRequired={setVerificationEmail} />

            <div className="text-center pt-1">
              <p className="text-sm text-base-content/70">
                {t("auth.noAccount")}{" "}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                  {t("auth.createOne")}
                </Link>
              </p>
            </div>
          </form>
          </>}
        </div>

        <div className="auth-visual-column flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="relative mx-auto aspect-square w-full max-w-sm">
              <div className="absolute inset-8 rounded-full bg-primary/15 blur-3xl" />
              <img src="/wog.png" alt="Language connection illustration" className="relative z-10 w-full h-full object-contain drop-shadow-2xl" />
            </div>

            <div className="mt-8 space-y-3 text-center">
              <h2 className="text-2xl font-semibold">{t("auth.visualTitle")}</h2>
              <p className="text-base-content/70">
                {t("auth.loginVisualDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
