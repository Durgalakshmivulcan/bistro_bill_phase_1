import { useState, useEffect } from "react";
import { getProducts, Product } from "../../services/productService";
import { isProductAvailableNow } from "../../utils/availability";
import { ErrorDisplay } from "../Common";
import { useOrder, CartItem } from "../../contexts/OrderContext";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  tag?: string;
  discount?: string;
  disabled?: boolean;
  product?: Product; // Store full product data
};

interface MenuListViewProps {
  searchQuery?: string;
  categoryId?: string;
  menuId?: string;
  barcode?: string;
}

const MenuListView = ({ searchQuery, categoryId, menuId, barcode }: MenuListViewProps) => {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cartItems, addCartItem, updateCartItem, removeCartItem } = useOrder();

  // Fetch products from API
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          // Get base price (use DineIn channel price or first available)
          const dineInPrice = product.prices?.find((p) => p.channelType === 'DineIn');
          const price = dineInPrice?.basePrice || product.prices?.[0]?.basePrice || 0;

          return {
            id: product.id,
            name: product.name,
            price,
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

  const getCartQty = (productId: string) => {
    const item = cartItems.find(i => i.productId === productId);
    return item?.quantity || 0;
  };

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

  const inc = (item: MenuItem) => {
    const existing = cartItems.find(i => i.productId === item.id);
    if (existing) {
      updateCartItem(item.id, { quantity: existing.quantity + 1 });
    } else {
      handleAddToCart(item);
    }
  };

  const dec = (item: MenuItem) => {
    const existing = cartItems.find(i => i.productId === item.id);
    if (existing && existing.quantity > 1) {
      updateCartItem(item.id, { quantity: existing.quantity - 1 });
    } else if (existing) {
      removeCartItem(item.id);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="mt-6 divide-y rounded-xl bg-white">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-4 py-3 h-16 bg-gray-100 animate-pulse"></div>
        ))}
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
      <div className="mt-6 text-center py-12 bg-white rounded-xl">
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
    <div className="mt-6 divide-y rounded-xl bg-white border border-[#F0E6C7] shadow-[0_1px_6px_rgba(0,0,0,0.04)]">

      {products.map((item) => {
  const count = getCartQty(item.id);

  return (
    <div
      key={item.id}
      className="
        grid grid-cols-[1fr_auto]
        md:grid-cols-[1fr_auto_auto]
        items-center gap-4
        px-4 py-3
      "
    >
      {/* ================= LEFT: NAME ================= */}
      <div>
        <p className="text-sm font-medium text-[#4A3B10]">
          {item.name}
        </p>
      </div>

      {/* ================= CENTER: PRICE ================= */}
      <div className="flex items-center gap-3 text-sm text-right md:text-left">
        <span className="text-green-600 font-semibold text-xs uppercase">
          {item.discount || "20% OFF"}
        </span>
        <span className="font-semibold text-gray-900">
          ₹ {item.price.toFixed(2)}
        </span>
        <span className="line-through text-gray-400 text-xs">
          ₹ {(item.price + 30).toFixed(2)}
        </span>
      </div>

      {/* ================= RIGHT: ACTION ================= */}
      <div className="flex justify-end min-w-[150px]">

        {item.disabled ? (
          <button
            disabled
            className="
              flex items-center gap-2
              rounded-lg border border-gray-200
              bg-gray-100
              px-4 py-1.5 text-xs text-gray-400
            "
          >
            ✕ Not Available
          </button>
        ) : count === 0 ? (
          <button
            onClick={() => handleAddToCart(item)}
            className="
              rounded-lg
              bg-yellow-400
              px-5 py-1.5
              text-sm font-medium
              hover:bg-yellow-500
            "
          >
            + Add to cart
          </button>
        ) : (
          <div
            className="
              flex items-center
              rounded-lg
              bg-yellow-400
              overflow-hidden
            "
          >
            <button
              onClick={() => dec(item)}
              className="px-3 py-1"
            >
              –
            </button>

            <span className="px-4 text-sm font-semibold">
              {count.toString().padStart(2, "0")}
            </span>

            <button
              onClick={() => inc(item)}
              className="px-3 py-1"
            >
              +
            </button>
          </div>
        )}

      </div>
    </div>
  );
})}

    </div>
  );
};

export default MenuListView;
