import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import LogoutConfirmModal from "../layout/logoutmodal";
import { useBranch } from "../contexts/BranchContext";
import { useAuth } from "../contexts/AuthContext";
import { useKeyboardShortcuts, getModifierLabel } from "../hooks/useKeyboardShortcuts";
import KeyboardShortcutsModal from "../components/ui/KeyboardShortcutsModal";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {

const [notifyOpen, setNotifyOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { currentBranchId, availableBranches, setCurrentBranch } = useBranch();
  const { user, logout } = useAuth();
  const location = useLocation();

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.userType === 'Staff') return `${user.firstName} ${user.lastName}`;
    if (user.userType === 'BusinessOwner') return user.restaurantName || user.ownerName;
    return user.name;
  };

  const getUserRole = () => {
    if (!user) return '';
    if (user.userType === 'Staff') return user.role?.name || 'Staff';
    return user.userType === 'BusinessOwner' ? 'Business Owner' : 'Super Admin';
  };

  const handleSearchFocus = useCallback(() => {
    searchRef.current?.focus();
  }, []);
  const handleToggleShortcuts = useCallback(() => {
    setShortcutsOpen((prev) => !prev);
  }, []);

  useKeyboardShortcuts([
    { key: "k", ctrl: true, description: "Focus search", category: "global", handler: handleSearchFocus },
    { key: "/", ctrl: true, description: "Show keyboard shortcuts", category: "global", handler: handleToggleShortcuts },
  ]);
  useEffect(() => {
    const POS_ROUTES = [
      "/takeorder",
      "/orderspage",
      "/tableview",
      "/reservations",
    ];

    const isPOS = POS_ROUTES.some((route) =>
      location.pathname.startsWith(route)
    );

    if (!isPOS) {
      sessionStorage.setItem("lastNonPOS", location.pathname);
    }
  }, [location.pathname]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="bb-app-shell">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Area */}
      <div className="bb-main relative">
        {/* Top Bar */}
        <header className="bb-topbar">
          {/* Left */}
          <div className="flex items-center gap-2">
            <button
              className="bb-btn bb-btn-ghost md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="bi bi-list" />
            </button>
            <span className="bb-topbar-title">Dashboard</span>
          </div>

          {/* Center */}
          <div className="flex-1 hidden md:flex justify-center px-4">
            {/* TODO: Implement global search */}
            <input ref={searchRef} className="bb-input max-w-md" placeholder={`Search here... (${getModifierLabel()}+K)`} title={`Search (${getModifierLabel()}+K)`} />
          </div>

          {/* Right */}
          <div className="bb-topbar-actions" ref={ref}>
            <i
  className="bi bi-bell cursor-pointer text-lg relative"
  onClick={() => setNotifyOpen(true)}
/>

            {/* SWITCH LOCATION */}
            {availableBranches.length > 0 && (
              <div className="flex items-center gap-1.5">
                <i className="bi bi-geo-alt text-bb-primary" />
                <select
                  value={currentBranchId}
                  onChange={(e) => setCurrentBranch(e.target.value)}
                  className="bb-input text-sm py-1 px-2 max-w-[180px] rounded-md border border-bb-coloredborder bg-white"
                  title="Switch Location"
                >
                  {availableBranches.length > 1 && (
                    <option value="all">All Locations</option>
                  )}
                  {availableBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* PROFILE */}
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 cursor-pointer relative"
            >
              <img
                src="/images/user.jpg"
                className="w-9 h-9 rounded-full"
                alt="User"
              />

              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{getUserDisplayName()}</div>
                <div className="text-xs text-bb-muted">{getUserRole()}</div>
              </div>

              <i
                className={`bi bi-chevron-${
                  open ? "up" : "down"
                } text-xs hidden md:block`}
              />
            </button>

            {/* DROPDOWN */}
            {open && (
              <div className="absolute right-0 top-14 w-48 bg-white border border-bb-coloredborder rounded-md shadow-lg z-50">
                <button
                  onClick={() => {
                    navigate("/my-account");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-bb-hover"
                >
                  My Account
                </button>

                <button
                  onClick={() => {
                    navigate("/manage-password");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-bb-hover"
                >
                  Manage Password
                </button>

                <div className="border-t my-1" />

                <button
                  onClick={() => {
                    setLogoutOpen(true); // open modal
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Divider below top bar */}
        <hr className="mx-4 my-3 border-bb-border border-2 opacity-80" />

        {/* Page Content */}
        <main className="p-4 relative z-0">{children}</main>
      </div>
      <LogoutConfirmModal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
          navigate("/login");
        }}
      />
      {/* ================= NOTIFICATIONS MODAL ================= */}
{notifyOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center">

    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => setNotifyOpen(false)}
    />

    {/* Modal */}
    <div className="
      relative bg-white w-[95%] max-w-2xl
      rounded-xl shadow-xl
      p-6
      animate-fade-in
    ">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-4xl font-bold">
          Notifications
        </h2>

        <button
          onClick={() => setNotifyOpen(false)}
          className="text-xl text-black hover:text-black"
        >
          ✕
        </button>
      </div>

      {/* LIST */}
      <div className="divide-y max-h-[60vh] overflow-y-auto">
        <div className="flex items-center justify-center py-12 text-gray-400">
          <div className="text-center">
            <i className="bi bi-bell text-3xl mb-2 block" />
            <p className="text-sm">No new notifications</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>

  );
};

export default DashboardLayout;
