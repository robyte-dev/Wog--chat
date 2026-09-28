import { useState } from "react";
import { ArrowRight, ShipWheelIcon } from "lucide-react";
import { Link } from "react-router";

import useSignUp from "../hooks/useSignUp";
import AuthSideNav from "../components/AuthSideNav";
import LanguageSelector from "../features/language/LanguageSelector";
import { useLanguage } from "../features/language/useLanguage";
import GoogleSignInButton from "../features/google-auth/GoogleSignInButton";

const SignUpPage = () => {
  const { t } = useLanguage();
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { isPending, error, signupMutation } = useSignUp();

  const handleSignup = (e) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    signupMutation(signupData);
  };

  return (
    <div className="auth-page-shell" data-theme="forest">
      <LanguageSelector className="auth-language-selector" />
      <div className="auth-panel">
        <AuthSideNav active="signup" />
        <div className="auth-form-column">
          <div className="mb-6 flex items-center justify-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
              <ShipWheelIcon className="size-7 text-white" />
            </div>
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              WOG
            </span>
          </div>

          {error && (
            <div className="alert alert-error mb-4 rounded-2xl">
              <span>{error.response?.data?.message || "Unable to create account."}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-primary/80">{t("auth.createAccount")}</p>
              <h2 className="mt-2 text-3xl font-semibold">{t("auth.signupTitle")}</h2>
              <p className="mt-2 text-sm text-base-content/70">
                {t("auth.signupDescription")}
              </p>
            </div>

            <div className="space-y-4">
              <div className="form-floating">
                <input
                  id="signup-fullname"
                  type="text"
                  value={signupData.fullName}
                  onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
                <label htmlFor="signup-fullname">{t("auth.fullName")}</label>
              </div>

              <div className="form-floating">
                <input
                  id="signup-email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  placeholder="john@gmail.com"
                  required
                />
                <label htmlFor="signup-email">{t("auth.email")}</label>
              </div>

              <div className="form-floating">
                <input
                  id="signup-password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  placeholder="Password"
                  required
                />
                <label htmlFor="signup-password">{t("auth.password")}</label>
              </div>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 bg-base-200/40 p-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span className="text-xs leading-relaxed text-base-content/80">
                  {t("auth.agree")} <span className="text-primary hover:underline">{t("auth.terms")}</span> {t("auth.and")} <span className="text-primary hover:underline">{t("auth.privacy")}</span>
                </span>
              </label>
            </div>

            <button className="auth-cta btn btn-primary" type="submit" disabled={isPending || !agreedToTerms}>
              {isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  {t("auth.creatingAccount")}
                </>
              ) : (
                <>
                  {t("auth.createAccountButton")}
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </button>

            <GoogleSignInButton />

            <div className="text-center pt-1">
              <p className="text-sm text-base-content/70">
                {t("auth.haveAccount")}{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  {t("auth.signInLink")}
                </Link>
              </p>
            </div>
          </form>
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
                {t("auth.signupVisualDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
