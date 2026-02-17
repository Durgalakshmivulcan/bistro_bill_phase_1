import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategories, Category } from "../../services/catalogService";

const MenuTabs = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Get selected category from URL params
  const selectedCategoryId = searchParams.get('categoryId') || 'all';

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await getCategories({ status: 'active' });

        if (response.success && response.data) {
          setCategories(response.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    const newParams = new URLSearchParams(searchParams);

    if (categoryId === 'all') {
      newParams.delete('categoryId');
    } else {
      newParams.set('categoryId', categoryId);
    }

    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <>
        <h3 className="mt-8 text-lg font-semibold text-yellow-600">Menu</h3>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 bg-gray-200 rounded-full animate-pulse"
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="mt-8 text-lg font-semibold text-yellow-600">Menu</h3>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* All tab */}
        <button
          onClick={() => handleCategorySelect('all')}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
            selectedCategoryId === 'all' ? "bg-black text-white" : "border bg-white"
          }`}
        >
          All
        </button>

        {/* Category tabs from API */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
              selectedCategoryId === category.id ? "bg-black text-white" : "border bg-white"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </>
  );
};

export default MenuTabs;
