import { useState } from "react";
import CategoryContent from "./CategoryContent";
import SubCategoryContent from "./SubCategoryContent";
import MenuContent from "./MenuContent";
import BrandContent from "./BrandContent";
import TagsContent from "./TagsContent";

type MenuType = "Category" | "Sub-Category" | "Menu" | "Brand" | "Tags";

export default function CatalogConfiguration() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("Category");
  const menuItems: MenuType[] = ["Category", "Sub-Category", "Menu", "Brand", "Tags"];

  return (
    <div className="min-w-0 flex flex-col lg:flex-row rounded-xl border border-[#eadfca] bg-[#fffdf7] font-inter overflow-hidden">
      {/* CONFIGURATION SIDE MENU */}
      <aside className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-[#eadfca] p-4 space-y-2 bg-[#fffdf7]">
        {menuItems.map((item) => (
          <div
            key={item}
            onClick={() => setActiveMenu(item as MenuType)}
            className={`px-3 py-2 rounded text-sm cursor-pointer transition ${
              activeMenu === item
                ? "bg-yellow-400 font-semibold text-black"
                : "text-[#4f4f4f] hover:bg-[#fff7dd]"
            }`}
          >
            {item}
          </div>
        ))}
      </aside>

      {/* CONTENT AREA */}
      <main className="min-w-0 flex-1 overflow-hidden p-5 lg:p-6 bg-[#fffdf7]">
        {activeMenu === "Category" && <CategoryContent />}
        {activeMenu === "Sub-Category" && <SubCategoryContent />}
        {activeMenu === "Menu" && <MenuContent />}
        {activeMenu === "Brand" && <BrandContent />}
        {activeMenu === "Tags" && <TagsContent />}
      </main>
    </div>
  );
}
