import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon, ShipWheelIcon, UsersIcon, UserRoundIcon } from "lucide-react";
import AvatarDisplay from "./AvatarDisplay";
import { useLanguage } from "../features/language/useLanguage";

const Sidebar = ({ isOpen = true, onToggle, onNavigate }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useLanguage();

  return (
    <aside
      className={`sidebar-shell ${isOpen ? "sidebar-open" : "sidebar-collapsed"} flex flex-col h-screen sticky top-0`}
    >
      <div className="sidebar-header">
        <Link to="/" className="brand-link">
          <ShipWheelIcon className="size-9 text-primary" />
          {isOpen && (
            <span className="text-2xl md:text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              WOG
            </span>
          )}
        </Link>

        {onToggle && (
          <button type="button" className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
            {isOpen ? <ChevronLeftIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
          </button>
        )}
      </div>

      <div className={`sidebar-user ${isOpen ? "sidebar-user-expanded" : "sidebar-user-collapsed"}`}>
        <div className="sidebar-user-avatar">
          <AvatarDisplay
            src={authUser?.profilePic}
            alt={authUser?.fullName || "Your profile"}
            size={isOpen ? 68 : 38}
            className="object-cover"
          />
          <span aria-label="Online" title="Online" />
        </div>
        {isOpen && (
          <div className="sidebar-user-copy">
            <strong>{authUser?.fullName || "Language learner"}</strong>
            <span>{authUser?.email || "Ready to connect"}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-2">
        <Link
          to="/profile"
          onClick={onNavigate}
          className={`nav-item ${currentPath === "/profile" ? "nav-item-active" : ""}`}
        >
          <UserRoundIcon className="size-5 text-base-content opacity-70" />
          {isOpen && <span>Profile</span>}
        </Link>

        <Link
          to="/"
          onClick={onNavigate}
          className={`nav-item ${currentPath === "/" ? "nav-item-active" : ""}`}
        >
          <HomeIcon className="size-5 text-base-content opacity-70" />
          {isOpen && <span>{t("nav.home")}</span>}
        </Link>

        <Link
          to="/friends"
          onClick={onNavigate}
          className={`nav-item ${currentPath === "/friends" ? "nav-item-active" : ""}`}
        >
          <UsersIcon className="size-5 text-base-content opacity-70" />
          {isOpen && <span>{t("nav.friends")}</span>}
        </Link>

        <Link
          to="/notifications"
          onClick={onNavigate}
          className={`nav-item ${currentPath === "/notifications" ? "nav-item-active" : ""}`}
        >
          <BellIcon className="size-5 text-base-content opacity-70" />
          {isOpen && <span>{t("nav.notifications")}</span>}
        </Link>
      </nav>

    </aside>
  );
};
export default Sidebar;
