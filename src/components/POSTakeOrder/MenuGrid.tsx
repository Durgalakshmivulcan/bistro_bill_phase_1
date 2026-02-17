import { useState, useEffect } from "react";
import MenuCard from "./MenuCard";
import MenuItemModal from "./Modals/MenuItemModal";
import { getProducts, Product } from "../../services/productService";
import { isProductAvailableNow } from "../../utils/availability";
import { ErrorDisplay } from "../Common";
import { useOrder, CartItem } from "../../contexts/OrderContext";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  tag?: string;
  discount?: string;
  disabled?: boolean;
  product?: Product; // Store full product data for modal
};

interface MenuGridProps {
  searchQuery?: string;
  categoryId?: string;
  menuId?: string;
  barcode?: string;
}

const MenuGrid = ({ searchQuery, categoryId, menuId, barcode }: MenuGridProps) => {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { addCartItem } = useOrder();

  const handleAddToCart = (item: MenuItem) => {
    const cartItem: CartItem = {
      productId: item.id,
      productName: item.name,
      quantity: 1,
      unitPrice: item.price,
      totalPrice: item.price,
      taxAmount: 0,
    };
    addCartItem(cartItem);
  };

  // Fetch products from API
  useEffect(() => {
    loadProducts();
  }, [searchQuery, categoryId, menuId, barcode]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getProducts({
        search: searchQuery,
        barcode,
        categoryId,
        menuId,
        status: 'active',
      });

      if (response.success && response.data) {
        // Transform API products to MenuItem format
        const menuItems: MenuItem[] = response.data.products.map((product) => {
          // Get primary image
          const primaryImage = product.images?.find((img) => img.isPrimary)?.url;

          // Get base price (use DineIn channel price or first available)
          const dineInPrice = product.prices?.find((p) => p.channelType === 'DineIn');
          const price = dineInPrice?.basePrice || product.prices?.[0]?.basePrice || 0;

          return {
            id: product.id,
            name: product.name,
            price,
            image: primaryImage,
            tag: product.isVeg ? 'Veg' : 'Non-Veg',
            disabled: product.status !== 'active' || !isProductAvailableNow(product.availabilitySchedule),
            product, // Store full product data
          };
        });

        setProducts(menuItems);
      } else {
        setError(response.error?.message || 'Failed to load products');
      }
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="mt-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-lg bg-gray-100 animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-6">
        <ErrorDisplay
          message={error}
          onRetry={loadProducts}
          size="medium"
          variant="card"
        />
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="mt-6 text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          No products found
        </h3>
        <p className="text-sm text-gray-500">
          {searchQuery || categoryId
            ? 'Try adjusting your filters or search query'
            : 'No products available at the moment'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* GRID */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((item) => (
          <MenuCard
            key={item.id}
            name={item.name}
            price={item.price}
            tag={item.tag}
            discount={item.discount}
            disabled={item.disabled}
            image={item.image}
            onImageClick={() => setSelectedItem(item)}
            onAddToCart={() => handleAddToCart(item)}
          />
        ))}
      </div>

      {/* MODAL */}
      <MenuItemModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
};

export default MenuGrid;
