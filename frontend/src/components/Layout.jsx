import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children, showSidebar = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.matchMedia("(min-width: 1024px)").matches);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const syncSidebar = (event) => setIsSidebarOpen(event.matches);
    desktop.addEventListener("change", syncSidebar);
    return () => desktop.removeEventListener("change", syncSidebar);
  }, []);

  const closeMobileSidebar = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <div className="layout-shell flex min-h-screen">
        {showSidebar && (
          <>
            <div
              className={`mobile-backdrop ${isSidebarOpen ? "mobile-backdrop-visible" : ""}`}
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
            <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((prev) => !prev)} onNavigate={closeMobileSidebar} />
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)} showSidebar={showSidebar} />

          <main className="flex-1 overflow-y-auto app-surface">{children}</main>
        </div>
      </div>
    </div>
  );
};
export default Layout;
