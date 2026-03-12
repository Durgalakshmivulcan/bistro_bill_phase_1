import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sidebarItems } from "../data/sidebarItems";
import { useMenuVisibility } from "../hooks/useMenuVisibility";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/imgs/Logo2.png";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface PermissionObject {
  [key: string]: PermissionValue;
}

type PermissionValue = boolean | PermissionObject;
type RolePermissions = Record<string, PermissionValue>;

const MENU_TO_PERMISSION_MODULES: Record<string, string[]> = {
  bo_dashboard: ["dashboard", "reports"],
  pos: ["pos"],
  kds: ["kds", "pos"],
  all_orders: ["orders", "pos"],
  reservations: ["reservations", "pos"],
  catalog: ["catalog"],
  inventory: ["inventory"],
  purchase_order: ["purchase_orders", "purchaseorder"],
  payments: ["payments"],
  customers: ["customers"],
  loyalty_program: ["loyalty", "customers"],
  marketing: ["marketing"],
  reviews: ["reviews", "marketing"],
  analytics_reports: ["analytics", "reports"],
  manage_resources: ["staff"],
  business_settings: ["settings"],
};

const normalizeKey = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s-]+/g, "_");

const hasGrantedPermission = (value: PermissionValue | undefined): boolean => {
  if (typeof value === "boolean") return value;
  if (!value || typeof value !== "object") return false;

  return Object.values(value).some((entry) => hasGrantedPermission(entry));
};

const getRoleVisibleMenuKeys = (permissions: RolePermissions): string[] => {
  const normalizedPermissions = new Map<string, PermissionValue>();

  Object.entries(permissions).forEach(([moduleKey, modulePermission]) => {
    normalizedPermissions.set(normalizeKey(moduleKey), modulePermission);
  });

  return sidebarItems
    .filter((item) => {
      const moduleCandidates = MENU_TO_PERMISSION_MODULES[item.key];

      // Keep items that are not mapped to a specific role permission module.
      if (!moduleCandidates) return true;

      return moduleCandidates.some((candidate) => {
        const permissionValue = normalizedPermissions.get(normalizeKey(candidate));
        return hasGrantedPermission(permissionValue);
      });
    })
    .map((item) => item.key);
};

const Sidebar = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const visibleKeys = useMenuVisibility();
  const { user } = useAuth();

  const staffRoleVisibleKeys = useMemo(() => {
    if (user?.userType !== "Staff") return null;

    const rolePermissions = user.role?.permissions as RolePermissions | undefined;
    if (!rolePermissions || typeof rolePermissions !== "object") {
      return null;
    }

    return getRoleVisibleMenuKeys(rolePermissions);
  }, [user]);

  // Apply global visibility and role-based permission visibility together.
  const filteredItems = useMemo(() => {
    let items = sidebarItems;

    if (visibleKeys) {
      items = items.filter((item) => visibleKeys.includes(item.key));
    }

    if (staffRoleVisibleKeys) {
      items = items.filter((item) => staffRoleVisibleKeys.includes(item.key));
    }

    return items;
  }, [visibleKeys, staffRoleVisibleKeys]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          bb-sidebar
          fixed md:sticky
          top-0
          inset-y-0 left-0
          z-50 md:z-auto
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div
          className="bb-sidebar-header justify-center cursor-pointer"
          onClick={() => navigate("/bodashboard")}
        >
          <img
            src={logo}
            alt="Bistro Bill"
            className="object-contain"
            style={{ width: "130px", height: "118.5px" }}
          />
        </div>


        {/* Navigation */}
        <nav className="bb-sidebar-nav">
          {filteredItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <div
                key={item.path}
                className={`bb-sidebar-link ${isActive ? "bb-sidebar-link--active" : ""
                  }`}
                onClick={() => {
                  const isCurrentlyInPOS =
                    location.pathname.startsWith("/pos");

                  if (item.path.startsWith("/pos") && !isCurrentlyInPOS) {
                    navigate(item.path, {
                      state: {
                        posEntry: location.pathname,
                      },
                    });
                  } else {
                    navigate(item.path);
                  }

                  onClose();
                }}
              >
                {/* ICON OR IMAGE */}
                {item.imgSrc ? (
                  <img
                    src={item.imgSrc}
                    alt={item.name}
                    className="w-8 h-6 object-contain"
                  />
                ) : (
                  item.icon && <i className={`bi ${item.icon}`} />
                )}

                <span>{item.name}</span>
              </div>

            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

