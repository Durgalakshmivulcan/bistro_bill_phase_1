import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function PublicHeader() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md transition ${isActive
      ? "text-bb-primary font-semibold text-[16px]"
      : "text-black hover:text-bb-primary text-[16px]"
    }`;

  return (
    <header className="bg-white border-b relative">
      <div className="mx-auto px-10 h-20 flex items-center justify-between">

        {/* LEFT: LOGO */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Bistro Bill" className="h-14 w-auto" />
        </div>

        {/* CENTER: DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
          <NavLink to="/websitefeatures" className={navClass}>
            Features
          </NavLink>

          <NavLink to="/websitebenefits" className={navClass}>
            Benefits
          </NavLink>

          <NavLink to="/websitepricing" className={navClass}>
            Pricing
          </NavLink>

          <NavLink to="/websitetestimonial" className={navClass}>
            Testimonials
          </NavLink>

          <NavLink to="/websiteblog" className={navClass}>
            Blog
          </NavLink>

          <NavLink to="/websitesupport" className={navClass}>
            Support
          </NavLink>
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <button className="hidden md:flex border border-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50">
            Login
          </button>

          <button
            onClick={() => navigate("/websitedemo")}
            className="hidden md:flex bg-bb-primary px-4 py-1.5 rounded-md text-sm font-medium text-black hover:bg-bb-primary"
          >
            Book Demo
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {isOpen && (
        <div className="md:hidden border-t bg-white shadow-sm px-6 py-4 space-y-2">
          <NavLink to="/websitefeatures" className={navClass} onClick={() => setIsOpen(false)}>
            Features
          </NavLink>

          <NavLink to="/websitebenefits" className={navClass} onClick={() => setIsOpen(false)}>
            Benefits
          </NavLink>

          <NavLink to="/websitepricing" className={navClass} onClick={() => setIsOpen(false)}>
            Pricing
          </NavLink>

          <NavLink to="/websitetestimonial" className={navClass} onClick={() => setIsOpen(false)}>
            Testimonials
          </NavLink>

          <NavLink to="/websiteblog" className={navClass} onClick={() => setIsOpen(false)}>
            Blog
          </NavLink>

          <NavLink to="/websitesupport" className={navClass} onClick={() => setIsOpen(false)}>
            Support
          </NavLink>
          <div className="flex items-center gap-3">
          <button className="sm:inline-flex border border-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50">
            Login
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/websitedemo");
            }}
            className="bg-bb-primary px-4 py-2 rounded-md text-sm font-medium text-black hover:bg-bb-primary"
          >
            Book Demo
          </button>
          </div>
        </div>
      )}
    </header>
  );
}
