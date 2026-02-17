import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sidebarItems } from "../data/sidebarItems";
import { useMenuVisibility } from "../hooks/useMenuVisibility";
import logo from "../assets/imgs/Logo2.png";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const visibleKeys = useMenuVisibility();

  // Filter sidebar items by visibility config (null = show all for graceful degradation)
  const filteredItems = useMemo(() => {
    if (!visibleKeys) return sidebarItems;
    return sidebarItems.filter((item) => visibleKeys.includes(item.key));
  }, [visibleKeys]);

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
