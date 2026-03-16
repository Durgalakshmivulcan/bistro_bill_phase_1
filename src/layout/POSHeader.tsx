import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import kitchenImg from "../assets/kitchenImg.png";
import bevarageImg from "../assets/beveragesImg.png";
import kitchenImg1 from "../assets/kitchenImg.png";
import { useBranch } from "../contexts/BranchContext";
import { useAuth } from "../contexts/AuthContext";
import { showSuccessToast } from "../utils/toast";
import LogoutConfirmModal from "./logoutmodal";

const POSHeader = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { currentBranchId, availableBranches, setCurrentBranch } = useBranch();
  const { user, logout } = useAuth();

  const posEntry = sessionStorage.getItem("posEntry");

  const [open, setOpen] = useState(false);
  const [openKDS, setOpenKDS] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [branchStatus, setBranchStatus] = useState<'Open' | 'Closed'>('Open');

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.userType === 'Staff') return `${user.firstName} ${user.lastName}`;
    if (user.userType === 'BusinessOwner') return user.ownerName;
    return user.name;
  };

  const getUserRole = () => {
    if (!user) return '';
    if (user.userType === 'Staff') return user.role?.name || 'Staff';
    return user.userType === 'BusinessOwner' ? 'Business Owner' : 'Super Admin';
  };

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

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
    <>
      {/* ================= HEADER ================= */}
      <header className="w-full bg-[#F9F4E8]/90 backdrop-blur border-b border-[#EADFC2]">
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-[64px]">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" onClick={() => navigate("/bodashboard")}>
              <img
                src="/logo.png"
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
              <span className="font-semibold text-sm sm:text-base text-bb-text">
                Bistro Bill
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-9 px-3 text-sm rounded-md bg-bb-bg border border-bb-border focus:outline-none"
                value={currentBranchId}
                onChange={(e) => setCurrentBranch(e.target.value)}
              >
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>

              <select
                className="hidden md:block h-9 px-3 text-sm rounded-md bg-bb-bg border border-bb-border focus:outline-none"
                value={branchStatus}
                onChange={(e) => {
                  const status = e.target.value as 'Open' | 'Closed';
                  setBranchStatus(status);
                  showSuccessToast(`Branch marked as ${status}`);
                }}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 relative" ref={ref}>
            {/* KDS */}
            <button
              onClick={() => setOpenKDS(true)}
              className="hidden md:flex h-9 px-3 rounded-md border border-bb-border bg-bb-bg items-center gap-2 text-sm"
            >
              <i className="bi bi-display" />
              KDS
            </button>

            {/* Date */}
            <div className="hidden lg:flex h-9 px-3 items-center gap-2 rounded-md bg-bb-bg border border-bb-border text-sm">
              <i className="bi bi-calendar3" />
              {todayDate}
            </div>

            {/* Notification */}
            <i
              className="bi bi-bell cursor-pointer text-lg text-bb-text"
              onClick={() => setNotifyOpen(true)}
            />

            {/* User */}
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2"
            >
              <img
                src="/images/user.jpg"
                className="w-9 h-9 rounded-full object-cover"
                alt="User"
              />

              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-bb-text">{getUserDisplayName()}</div>
                <div className="text-xs text-bb-muted">{getUserRole()}</div>
              </div>

              <i
                className={`bi bi-chevron-${open ? "up" : "down"} text-xs hidden md:block`}
              />
            </button>

            {/* USER DROPDOWN */}
            {open && (
              <div className="absolute right-0 top-12 w-48 bg-bb-bg border border-bb-border rounded-lg shadow-lg z-50">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-bb-hover"
                  onClick={() => { setOpen(false); navigate('/my-account'); }}
                >
                  My Account
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-bb-hover"
                  onClick={() => { setOpen(false); navigate('/manage-password'); }}
                >
                  Manage Password
                </button>
                <div className="border-t border-bb-border my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                  onClick={() => { setOpen(false); setLogoutOpen(true); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= KDS MODAL ================= */}
      {openKDS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpenKDS(false)}
          />

          <div className="relative bg-white rounded-xl w-[90%] max-w-md p-6 shadow-xl">
            <button
              onClick={() => setOpenKDS(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-center">
              Select the Kitchen
            </h2>

            <p className="text-sm text-gray-500 text-center mt-1">
              Choose a kitchen to View Kitchen Display System
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {[
                { name: "Kitchen-1", path: "/kds", image: kitchenImg },
                { name: "Beverages", path: "/kds", image: bevarageImg },
                { name: "Kitchen-2", path: "/kds", image: kitchenImg1 },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setOpenKDS(false);
                    navigate(item.path, {
                      state: posEntry ? { posEntry } : undefined,
                    });
                  }}
                  className="flex flex-col items-center justify-center border rounded-xl p-4 hover:border-yellow-400 hover:shadow-lg transition"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 mb-3"
                  />
                  <span className="text-sm font-semibold">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= LOGOUT CONFIRM MODAL ================= */}
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
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setNotifyOpen(false)}
          />

          <div className="relative bg-white w-[95%] max-w-2xl rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Notifications</h2>

              <button
                onClick={() => setNotifyOpen(false)}
                className="text-xl"
              >
                ✕
              </button>
            </div>

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
    </>
  );
};

export default POSHeader;
