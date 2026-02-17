import React from "react";
import { Bell, Search } from "lucide-react";

const Topbar = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="text-xl font-semibold">Catalog</h2>

      <div className="flex items-center gap-6">
        {/* Search bar */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400 h-5" />
          <input
            type="text"
            placeholder="Search here..."
            className="w-full bg-gray-100 pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>

        <Bell className="text-gray-600 cursor-pointer" />

        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="font-semibold text-sm">Shiva Sai</p>
            <p className="text-xs text-gray-500">Business Owner</p>
          </div>
          <img
            src="/profile.png"
            alt="profile"
            className="w-10 h-10 rounded-full"
          />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
