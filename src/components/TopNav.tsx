import React from "react";

const TopNav: React.FC = () => {
  return (
    <header className="text-black px-6 py-3 flex items-center justify-between">
      {/* Left: Brand + navigation */}
      <div className="flex items-center gap-6">
        <div className="text-lg font-semibold">Bistro Bill</div>

        <div className="flex items-center gap-3 text-sm">
          <button className="flex items-center gap-1 hover:underline">
            <span className="text-xl leading-none">&larr;</span>
            <span>Catalog</span>
          </button>

          <nav className="flex items-center gap-5 ml-6">
            <button className="border-b-2 border-white pb-1 text-sm">
              Dashboard
            </button>
            <button className="text-sm opacity-90 hover:opacity-100">
              Products
            </button>
            <button className="text-sm opacity-90 hover:opacity-100">
              Channel Menu
            </button>
            <button className="text-sm opacity-90 hover:opacity-100">
              Configuration
            </button>
          </nav>
        </div>
      </div>

      {/* Right: icons + avatar */}
      <div className="flex items-center gap-4 text-sm">
        <button
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="Search"
        >
          🔍
        </button>
        <button
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="Notifications"
        >
          🔔
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Andhra Meals</span>
          <div className="w-9 h-9 rounded-full bg-white text-primary flex items-center justify-center font-semibold">
            AM
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
