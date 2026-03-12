import { useState } from "react";
import CategoryContent from "./CategoryContent";
import SubCategoryContent from "./SubCategoryContent";
import MenuContent from "./MenuContent";
import BrandContent from "./BrandContent";
import TagsContent from "./TagsContent";

type MenuType = "Category" | "Sub-Category" | "Menu" | "Brand" | "Tags";

export default function CatalogConfiguration() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("Menu");
  const menuItems: MenuType[] = ["Category", "Sub-Category", "Menu", "Brand", "Tags"];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bb-bg font-inter">
      {/* CONFIGURATION SIDE MENU */}
      <aside className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 space-y-1 bg-bb-bg">
        {menuItems.map((item) => (
          <div
            key={item}
            onClick={() => setActiveMenu(item as MenuType)}
            className={`px-3 py-2 rounded text-sm cursor-pointer transition ${
              activeMenu === item
                ? "bg-yellow-400 font-semibold text-black"
                : "text-gray-600 hover:bg-yellow-50"
            }`}
          >
            {item}
          </div>
        ))}
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 p-6">
        {activeMenu === "Category" && <CategoryContent />}
        {activeMenu === "Sub-Category" && <SubCategoryContent />}
        {activeMenu === "Menu" && <MenuContent />}
        {activeMenu === "Brand" && <BrandContent />}
        {activeMenu === "Tags" && <TagsContent />}
      </main>
    </div>
  );
}
