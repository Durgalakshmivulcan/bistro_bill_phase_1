import { NavLink } from "react-router-dom";

const BlogNavTabs = () => {
  return (
    <div className="flex gap-6 border-b">
      <NavLink
        to="/blog-management"
        end
        className={({ isActive }) =>
          `px-4 py-2 rounded-md text-sm ${
            isActive
              ? "bg-black text-white"
              : "text-gray-700 hover:text-black"
          }`
        }
      >
        Blogs
      </NavLink>

      <NavLink
        to="/blog-management/categories"
        className={({ isActive }) =>
          `px-4 py-2 rounded-md text-sm ${
            isActive
              ? "bg-black text-white"
              : "text-gray-700 hover:text-black"
          }`
        }
      >
        Blog categories
      </NavLink>

      <NavLink
        to="/blog-management/tags"
        className={({ isActive }) =>
          `px-4 py-2 rounded-md text-sm ${
            isActive
              ? "bg-black text-white"
              : "text-gray-700 hover:text-black"
          }`
        }
      >
        Blog tags
      </NavLink>
    </div>
  );
};

export default BlogNavTabs;
