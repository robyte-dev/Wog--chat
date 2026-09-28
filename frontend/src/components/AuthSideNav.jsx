import { useEffect, useState } from "react";
import { UserRound, UserRoundPlus } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "../features/language/useLanguage";

const AuthSideNav = ({ active }) => {
  const location = useLocation();
  const { t } = useLanguage();
  const [entryDirection] = useState(() => {
    if (typeof window === "undefined") return "down";
    const direction = window.sessionStorage.getItem("auth-transition-direction");
    window.sessionStorage.removeItem("auth-transition-direction");
    return direction === "up" ? "up" : "down";
  });

  useEffect(() => {
    document.documentElement.dataset.authTransition = entryDirection;
    return () => {
      delete document.documentElement.dataset.authTransition;
    };
  }, [entryDirection, location.pathname]);

  const rememberDirection = (direction) => {
    window.sessionStorage.setItem("auth-transition-direction", direction);
  };

  return (
    <nav className={`auth-side-nav auth-side-nav-${active}`} aria-label="Authentication">
      <Link
        to="/login"
        onClick={() => rememberDirection("down")}
        className={`auth-side-link ${active === "login" ? "active" : ""}`}
        aria-current={active === "login" ? "page" : undefined}
      >
        <UserRound aria-hidden="true" />
        <span>{t("auth.signIn")}</span>
      </Link>
      <Link
        to="/signup"
        onClick={() => rememberDirection("up")}
        className={`auth-side-link ${active === "signup" ? "active" : ""}`}
        aria-current={active === "signup" ? "page" : undefined}
      >
        <UserRoundPlus aria-hidden="true" />
        <span>{t("auth.signUp")}</span>
      </Link>
    </nav>
  );
};

export default AuthSideNav;
