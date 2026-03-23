import POSActionsBar from "../NavTabs/POSActionsBar";
import MenuCard from "./MenuCard";
// import MenuItemModal from "./MenuItemModal";
import { useState, useEffect, useRef, useCallback } from "react";
import MenuItemModal from "./Modals/MenuItemModal";
import OnlineOrderQueue from "./OnlineOrderQueue";
import { LayoutGrid, List, Search, ScanBarcode } from "lucide-react";
import { getActiveDiscounts } from "../../services/marketingService";
import { getProducts, Product } from "../../services/productService";
import { useSearchParams, useNavigate } from "react-router-dom";
import { isValidBarcode } from "../../utils/barcode";
import { useOrder } from "../../contexts/OrderContext";
import { showSuccessToast } from "../../utils/toast";
import { useAuth } from "../../contexts/AuthContext";

// ============================================
// Type Definitions
// ============================================

export interface DiscountedProduct {
  productId: string;
  productName: string;
  originalPrice: number;
  discountedPrice: number;
  discountLabel: string;
  discountId: string;
  product: Product;
}

type Props = {
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get products with active discounts applied
 * Fetches active discounts, retrieves associated products, and calculates discounted prices
 */
export async function getDiscountedProducts(): Promise<DiscountedProduct[]> {
  try {
    // Step 1: Fetch active discounts
    const discountsResponse = await getActiveDiscounts();

    if (!discountsResponse.success || !discountsResponse.data || discountsResponse.data.length === 0) {
      return [];
    }

    const discounts = discountsResponse.data;

    // Step 2: Extract productIds from all discounts that have discountProducts
    const productIdsSet = new Set<string>();
    discounts.forEach((discount) => {
      if (discount.discountProducts && discount.discountProducts.length > 0) {
        discount.discountProducts.forEach((dp) => {
          productIdsSet.add(dp.productId);
        });
      }
    });

    if (productIdsSet.size === 0) {
      return [];
    }

    const productIds = Array.from(productIdsSet);

    // Step 3: Fetch products by productIds
    const productsResponse = await getProducts({
      productIds,
      status: 'active'
    });

    if (!productsResponse.success || !productsResponse.data || productsResponse.data.products.length === 0) {
      return [];
    }

    const products = productsResponse.data.products;

    // Step 4: Calculate discounted prices and create DiscountedProduct objects
    const discountedProducts: DiscountedProduct[] = [];

    products.forEach((product) => {
      // Find discount(s) that apply to this product
      const applicableDiscount = discounts.find((discount) =>
        discount.discountProducts?.some((dp) => dp.productId === product.id)
      );

      if (!applicableDiscount) {
        return; // Skip if no discount found
      }

      // Get product price (prefer DineIn channel price)
      const dineInPrice = product.prices?.find((p) => p.channelType === 'DineIn');
      const originalPrice = dineInPrice?.basePrice || product.prices?.[0]?.basePrice || 0;

      if (originalPrice === 0) {
        return; // Skip if no valid price
      }

      // Calculate discounted price based on discount type
      let discountedPrice = originalPrice;
      let discountLabel = '';

      if (applicableDiscount.valueType === 'Percentage') {
        const discountAmount = (originalPrice * applicableDiscount.value) / 100;
        discountedPrice = originalPrice - discountAmount;
        discountLabel = `${applicableDiscount.value}% Off`;
      } else if (applicableDiscount.valueType === 'Fixed') {
        discountedPrice = Math.max(0, originalPrice - applicableDiscount.value);
        discountLabel = `₹${applicableDiscount.value} Off`;
      } else if (applicableDiscount.valueType === 'BOGO') {
        // For BOGO, show 50% off label (buy one get one = 50% off on average)
        discountedPrice = originalPrice * 0.5;
        discountLabel = 'BOGO';
      }

      // Apply maxDiscount cap if specified (for percentage discounts)
      if (applicableDiscount.maxDiscount && applicableDiscount.valueType === 'Percentage') {
        const actualDiscount = originalPrice - discountedPrice;
        if (actualDiscount > applicableDiscount.maxDiscount) {
          discountedPrice = originalPrice - applicableDiscount.maxDiscount;
        }
      }

      discountedProducts.push({
        productId: product.id,
        productName: product.name,
        originalPrice,
        discountedPrice: Math.round(discountedPrice * 100) / 100, // Round to 2 decimals
        discountLabel,
        discountId: applicableDiscount.id,
        product,
      });
    });

    return discountedProducts;
  } catch (error) {
    console.error('Error fetching discounted products:', error);
    return [];
  }
}

const DiscountSection = ({ viewMode, setViewMode }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedDiscountProduct, setSelectedDiscountProduct] = useState<DiscountedProduct | null>(null);
  const [discountedProducts, setDiscountedProducts] = useState<DiscountedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [discountExpired, setDiscountExpired] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams({});
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || searchParams.get('barcode') || '');
  const { cartItems, addCartItem, updateCartItem, removeCartItem } = useOrder();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = useCallback((item: DiscountedProduct) => {
    addCartItem({
      productId: item.productId,
      productName: item.productName,
      quantity: 1,
      unitPrice: item.discountedPrice,
      totalPrice: item.discountedPrice,
      taxAmount: 0,
    });
    showSuccessToast(`${item.productName} added to cart`);
  }, [addCartItem]);

  const getCartQty = (productId: string) => {
    const item = cartItems.find((i) => i.productId === productId);
    return item?.quantity || 0;
  };

  const inc = useCallback((item: DiscountedProduct) => {
    const existing = cartItems.find((i) => i.productId === item.productId);
    if (existing) {
      updateCartItem(item.productId, { quantity: existing.quantity + 1 });
    } else {
      handleAddToCart(item);
    }
  }, [cartItems, updateCartItem, handleAddToCart]);

  const dec = useCallback((item: DiscountedProduct) => {
    const existing = cartItems.find((i) => i.productId === item.productId);
    if (existing && existing.quantity > 1) {
      updateCartItem(item.productId, { quantity: existing.quantity - 1 });
    } else if (existing) {
      removeCartItem(item.productId);
    }
  }, [cartItems, updateCartItem, removeCartItem]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    // Debounce search URL param updates
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      // Detect if input looks like a barcode (numeric 13 digits or valid barcode pattern)
      if (value && isValidBarcode(value)) {
        params.set('barcode', value);
        params.delete('search');
      } else if (value) {
        params.set('search', value);
        params.delete('barcode');
      } else {
        params.delete('search');
        params.delete('barcode');
      }
      setSearchParams(params, { replace: true });
    }, 300);
  };

  // Fetch discounted products on mount
  useEffect(() => {
    const loadDiscountedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const products = await getDiscountedProducts();
        setDiscountedProducts(products);
      } catch (err) {
        setError('Failed to load discounted products');
        console.error('Error loading discounted products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDiscountedProducts();
  }, []);

  // Countdown timer for discount expiry
  useEffect(() => {
    // Calculate earliest endDate from active discounts
    const calculateTimeRemaining = async () => {
      try {
        const discountsResponse = await getActiveDiscounts();

        if (!discountsResponse.success || !discountsResponse.data || discountsResponse.data.length === 0) {
          setTimeRemaining(null);
          return null;
        }

        const discounts = discountsResponse.data;

        // Find earliest endDate
        const endDates = discounts
          .map(d => d.endDate)
          .filter((date): date is string => date !== null && date !== undefined);

        if (endDates.length === 0) {
          setTimeRemaining('No time limit');
          return null;
        }

        // Get earliest endDate
        const earliestEndDate = new Date(Math.min(...endDates.map(d => new Date(d).getTime())));
        return earliestEndDate;
      } catch (err) {
        console.error('Error calculating time remaining:', err);
        return null;
      }
    };

    const updateCountdown = (endDate: Date) => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Discounts Ended');
        setDiscountExpired(true);
        return true; // Expired
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeRemaining(`Ends in ${formatted}`);
      return false; // Not expired
    };

    let intervalId: NodeJS.Timeout | null = null;
    let endDate: Date | null = null;

    // Initialize countdown
    calculateTimeRemaining().then((calculatedEndDate) => {
      if (calculatedEndDate) {
        endDate = calculatedEndDate;

        // Update immediately
        const expired = updateCountdown(calculatedEndDate);

        // Set up interval if not expired
        if (!expired) {
          intervalId = setInterval(() => {
            const isExpired = updateCountdown(calculatedEndDate);
            if (isExpired && intervalId) {
              clearInterval(intervalId);
            }
          }, 1000);
        }
      }
    });

    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [discountedProducts]); // Re-run when discounted products change

  return (
    <>
    
      {/* POS ACTION BAR – EXACT FIGMA POSITION */}
  <div className="w-full space-y-4">

  {/* ROW 1 — POS Tabs */}
  <div className="flex items-center justify-start">
    <POSActionsBar />
  </div>

  {/* ROW 2 — Search + View Toggle */}
  <div className="flex items-center justify-end gap-4">

    {/* Search / Barcode Scan */}
    <div className="relative w-full max-w-[420px]">
      <input
        placeholder="Search or scan barcode..."
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          handleSearchChange(e.target.value);
        }}
        className="
          w-full h-11
          rounded-xl
          text-black
          placeholder-gray-400
          border border-gray-200
          pl-4 pr-10
          text-sm
          focus:outline-none
          focus:ring-1 focus:ring-gray-300
        "
      />

      {searchInput && isValidBarcode(searchInput) ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Barcode detected">
          <ScanBarcode
            size={18}
            className="text-green-600"
          />
        </span>
      ) : (
        <Search
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
      )}
    </div>

    {/* View Toggle */}
    <div className="flex items-center overflow-hidden border border-gray-200 bg-white rounded-lg shrink-0">
      <button
        onClick={() => setViewMode("list")}
        className={`h-11 w-11 flex items-center justify-center transition
          ${viewMode === "list" ? "bg-[#FFC533]" : "hover:bg-gray-100"}`}
      >
        <List size={18} />
      </button>

      <button
        onClick={() => setViewMode("grid")}
        className={`h-11 w-11 flex items-center justify-center transition
          ${viewMode === "grid" ? "bg-[#FFC533]" : "hover:bg-gray-100"}`}
      >
        <LayoutGrid size={18} />
      </button>
    </div>

  </div>

</div>


<OnlineOrderQueue/>

      {/* Discount Header */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-yellow-600">
            Special Discount for Today
          </h3>
          {(user?.userType === 'BusinessOwner' || user?.userType === 'Staff') && (
            <button
              onClick={() => navigate('/marketing/discounts')}
              className="text-xs font-medium text-bb-primary hover:text-yellow-600 border border-bb-primary rounded-lg px-3 py-1 transition-colors hover:bg-yellow-50"
            >
              Manage Discounts
            </button>
          )}
        </div>
        {timeRemaining && (
          <span className={`text-sm font-medium ${discountExpired ? 'text-red-500' : 'text-gray-600'}`}>
            {timeRemaining}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-4 text-center py-8 text-gray-500">
          Loading discounts...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 text-center py-8 text-red-500">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (discountedProducts.length === 0 || discountExpired) && (
        <div className="mt-4 text-center py-8 text-gray-500">
          <p>{discountExpired ? 'Discounts Ended' : 'No special discounts today'}</p>
          {(user?.userType === 'BusinessOwner' || user?.userType === 'Staff') && (
            <button
              onClick={() => navigate('/marketing/discounts')}
              className="mt-3 inline-flex items-center gap-2 bg-bb-primary hover:bg-yellow-500 text-bb-text font-medium text-sm px-5 py-2 rounded-lg transition-colors"
            >
              <i className="bi bi-plus-lg" />
              Create a Discount
            </button>
          )}
        </div>
      )}

      {/* Discount Cards */}
      {!loading && !error && discountedProducts.length > 0 && !discountExpired && (
        viewMode === "grid" ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {discountedProducts.map((item) => (
              <MenuCard
                key={item.productId}
                name={item.productName}
                price={item.discountedPrice}
                originalPrice={item.originalPrice}
                tag={item.product.type || ""}
                discount={item.discountLabel}
                onImageClick={() => {
                  setSelectedDiscountProduct(item);
                  setOpen(true);
                }}
                quantity={getCartQty(item.productId)}
                onAddToCart={() => handleAddToCart(item)}
                onIncrement={() => inc(item)}
                onDecrement={() => dec(item)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 divide-y rounded-xl bg-white">
            {discountedProducts.map((item) => {
              const quantity = getCartQty(item.productId);

              return (
                <div
                  key={item.productId}
                  className="
                    grid
                    grid-cols-[0.3fr_1.4fr_auto]
                    md:grid-cols-[0.3fr_1.3fr_auto]
                    items-center
                    px-4 py-3
                  "
                >
                  {/* LEFT — NAME */}
                  <p className="text-sm font-medium text-[#4A3B10]">
                    {item.productName}
                  </p>

                  {/* CENTER — PRICE */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-600 font-semibold text-xs">
                      {item.discountLabel}
                    </span>

                    <span className="font-semibold">
                      ₹{item.discountedPrice.toFixed(2)}
                    </span>

                    <span className="text-xs text-gray-400 line-through">
                      ₹{item.originalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* RIGHT — ACTION */}
                  <div className="flex justify-end min-w-[150px]">
                    {quantity > 0 ? (
                      <div className="flex items-center rounded-lg bg-yellow-400 overflow-hidden">
                        <button
                          onClick={() => dec(item)}
                          className="px-3 py-1"
                          aria-label="Decrease quantity"
                        >
                          –
                        </button>

                        <span className="px-4 text-sm font-semibold tabular-nums">
                          {quantity.toString().padStart(2, "0")}
                        </span>

                        <button
                          onClick={() => inc(item)}
                          className="px-3 py-1"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="
                          rounded-lg
                          bg-yellow-400
                          px-5 py-1.5
                          text-sm font-medium
                          transition-colors
                          hover:bg-yellow-500
                        "
                      >
                        + Add to cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}


      <MenuItemModal
        open={open}
        item={selectedDiscountProduct ? {
          id: selectedDiscountProduct.productId,
          name: selectedDiscountProduct.productName,
          price: selectedDiscountProduct.discountedPrice,
          originalPrice: selectedDiscountProduct.originalPrice,
          image: selectedDiscountProduct.product.images?.find(img => img.isPrimary)?.url || selectedDiscountProduct.product.images?.[0]?.url || "/images/menu/biryani.jpg",
          discount: selectedDiscountProduct.discountLabel,
        } : { name: "", price: 0 }}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default DiscountSection;
