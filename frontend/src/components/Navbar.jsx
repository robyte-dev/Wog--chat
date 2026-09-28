import { Link, useLocation } from "react-router";
import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, MenuIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import AvatarDisplay from "./AvatarDisplay";
import LanguageSelector from "../features/language/LanguageSelector";
import ConfirmDialog from "./ConfirmDialog";

const Navbar = ({ onSidebarToggle, showSidebar }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { logoutMutation } = useLogout();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <nav className="navbar-shell sticky top-0 z-30 h-16 px-3 sm:px-6">
      <div className="flex items-center w-full gap-3">
        {showSidebar && (
          <button type="button" className="btn btn-ghost btn-circle lg:hidden" onClick={onSidebarToggle} aria-label="Toggle sidebar">
            <MenuIcon className="size-5" />
          </button>
        )}

        {showSidebar && !isChatPage && (
          <button type="button" className="btn btn-ghost btn-circle hidden lg:inline-flex" onClick={onSidebarToggle} aria-label="Toggle sidebar">
            <MenuIcon className="size-5" />
          </button>
        )}

        {isChatPage && (
          <div className="flex items-center gap-2.5 mr-auto">
            <Link to="/" className="flex items-center gap-2.5">
              <ShipWheelIcon className="size-8 text-primary" />
              <span className="chat-page-brand-wordmark text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                WOG
              </span>
            </Link>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link to="/notifications" className="btn btn-ghost btn-circle relative">
            <BellIcon className="h-5 w-5 text-base-content opacity-80" />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary shadow-sm" />
          </Link>

          <ThemeSelector />

          <LanguageSelector className="navbar-language-selector" />

          <Link to="/profile" className="avatar mr-1" aria-label="Open profile">
            <div className="w-10 rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-base-100 overflow-hidden">
              <AvatarDisplay src={authUser?.profilePic} alt={authUser?.fullName || "User Avatar"} size={40} className="object-cover" />
            </div>
          </Link>

          <button className="btn btn-ghost btn-circle" onClick={() => setConfirmLogout(true)} aria-label="Logout">
            <LogOutIcon className="h-5 w-5 text-base-content opacity-80" />
          </button>
        </div>
      </div>
      {confirmLogout && <ConfirmDialog
        title="Sign out of WOG?"
        description="You’ll be disconnected from chat on this device. Your profile, friends, and conversation history will stay saved, and you can sign back in any time."
        confirmLabel="Yes, sign out"
        busy={false}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); logoutMutation(); }}
      />}
    </nav>
  );
};
export default Navbar;
