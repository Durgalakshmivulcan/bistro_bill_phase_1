import { useState } from "react";
import CategoryContent from "./CategoryContent";
import SubCategoryContent from "./SubCategoryContent";
import MenuContent from "./MenuContent";
import BrandContent from "./BrandContent";
import TagsContent from "./TagsContent";

type MenuType = "Category" | "Sub-Category" | "Menu" | "Brand" | "Tags";

export default function CatalogConfiguration() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("Category");

  return (
    <div className="flex min-h-screen bg-bb-bg font-inter">
      {/* CONFIGURATION SIDE MENU */}
      <aside className="w-56 border-r p-4 space-y-1 bg-bb-bg">
        {["Category", "Sub-Category", "Menu", "Brand", "Tags"].map((item) => (
          <div
            key={item}
            onClick={() => setActiveMenu(item as MenuType)}
            className={`px-3 py-2 rounded text-sm cursor-pointer transition ${
              activeMenu === item
                ? "bg-yellow-400 font-bold"
                : "text-gray-600 hover:bg-yellow-100"
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
