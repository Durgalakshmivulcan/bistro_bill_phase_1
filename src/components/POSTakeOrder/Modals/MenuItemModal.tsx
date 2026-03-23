import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useOrder } from "../../../contexts/OrderContext";
import { getProductById } from "../../../services/productService";

type MenuItem = {
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  discount?: string;
  id?: string;
};

interface ProductVariant {
  id: string;
  name: string;
  additionalPrice: number;
  status: string;
}

interface ProductAddon {
  id: string;
  name: string;
  price: number;
  status: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
  item: MenuItem | null;
};

export default function MenuItemModal({ open, onClose, item }: Props) {
  const [qty, setQty] = useState(1);
  const { addCartItem } = useOrder();

  // Variant, addon, and notes state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [prepNotes, setPrepNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  // Reset state when item changes
  useEffect(() => {
    if (open && item?.id) {
      setQty(1);
      setSelectedVariant(null);
      setSelectedAddons([]);
      setPrepNotes("");
      setVariants([]);
      setAddons([]);
      setDescription("");
      fetchProductDetails(item.id);
    } else if (open) {
      setQty(1);
      setSelectedVariant(null);
      setSelectedAddons([]);
      setPrepNotes("");
      setVariants([]);
      setAddons([]);
      setDescription("");
    }
  }, [open, item]);

  const fetchProductDetails = async (productId: string) => {
    setLoading(true);
    try {
      const response = await getProductById(productId);
      if (response.success && response.data) {
        const product = response.data;
        const activeVariants = (product.variants || []).filter(v => v.status === "active");
        const activeAddons = (product.addons || []).filter(a => a.status === "active");
        setVariants(activeVariants);
        setAddons(activeAddons);
        setDescription(product.description || "");
      }
    } catch (err) {
      console.error("Failed to fetch product details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !item) return null;

  const increment = () => setQty((q) => q + 1);
  const decrement = () => setQty((q) => (q > 1 ? q - 1 : 1));

  // Calculate variant additional price
  const selectedVariantData = variants.find(v => v.id === selectedVariant);
  const variantAdditionalPrice = selectedVariantData?.additionalPrice || 0;

  // Calculate addon total
  const addonTotal = addons
    .filter(a => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const unitPrice = item.price + variantAdditionalPrice + addonTotal;
  const total = unitPrice * qty;

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleAddToCart = () => {
    if (!item.id) return;
    addCartItem({
      productId: item.id,
      productName: selectedVariantData
        ? `${item.name} (${selectedVariantData.name})`
        : item.name,
      variantId: selectedVariant || undefined,
      variantName: selectedVariantData?.name,
      quantity: qty,
      unitPrice,
      totalPrice: total,
      taxAmount: 0,
      notes: prepNotes || undefined,
      addons: selectedAddons.length > 0
        ? addons
            .filter(a => selectedAddons.includes(a.id))
            .map(a => ({
              addonId: a.id,
              addonName: a.name,
              price: a.price,
              quantity: qty,
            }))
        : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center px-3">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start gap-4 sm:gap-6 p-4 sm:p-6 border-b relative">
          <div className="relative rounded-lg overflow-hidden w-32 h-28 sm:w-36 sm:h-32 flex-shrink-0">
            <img
              src={item.image || "/images/menu/biryani.jpg"}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            {item.discount && (
              <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                {item.discount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold text-gray-900 leading-tight">{item.name}</h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
              {description || item.name}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-900">₹ {unitPrice.toFixed(2)}</span>
              {(item.originalPrice && item.originalPrice > item.price) || variantAdditionalPrice > 0 || addonTotal > 0 ? (
                <span className="text-sm line-through text-gray-400">
                  ₹ {(item.originalPrice && item.originalPrice > item.price ? item.originalPrice : item.price).toFixed(2)}
                </span>
              ) : null}
            </div>

            {/* Mini line item pill with quantity control */}
            <div className="mt-3 inline-flex items-center gap-3 bg-gray-100 rounded-full pl-3 pr-2 py-1 text-sm">
              <span className="font-medium text-gray-800">{item.name}</span>
              <div className="inline-flex items-center bg-yellow-400 rounded-full overflow-hidden">
                <button
                  onClick={decrement}
                  className="px-3 text-base font-semibold hover:bg-yellow-500"
                >
                  -
                </button>
                <span className="px-4 font-semibold tracking-wide">
                  {qty.toString().padStart(2, "0")}
                </span>
                <button
                  onClick={increment}
                  className="px-3 text-base font-semibold hover:bg-yellow-500"
                >
                  +
                </button>
              </div>
              <span className="font-semibold text-gray-800">₹ {item.price.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-black"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="text-sm text-gray-400">Loading options...</div>
          ) : (
            <>
              {/* Variants */}
              {variants.length > 0 && (
                <div>
                  <div className="flex justify-between items-center font-semibold text-gray-900 mb-3">
                    <span>Variants</span>
                    <span className="text-sm text-gray-700">₹ {variantAdditionalPrice.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {variants.map(variant => (
                      <label
                        key={variant.id}
                        className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:border-gray-300"
                      >
                        <input
                          type="radio"
                          name="variant"
                          className="accent-black"
                          checked={selectedVariant === variant.id}
                          onChange={() => setSelectedVariant(variant.id)}
                        />
                        <span className="flex-1 text-gray-800">{variant.name}</span>
                        {variant.additionalPrice > 0 && (
                          <span className="text-gray-600 text-xs">+₹{variant.additionalPrice.toFixed(2)}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons */}
              {addons.length > 0 && (
                <div>
                  <div className="flex justify-between items-center font-semibold text-gray-900 mb-3">
                    <span>Addons</span>
                    <span className="text-sm text-gray-700">₹ {addonTotal.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {addons.map(addon => (
                      <label
                        key={addon.id}
                        className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:border-gray-300"
                      >
                        <input
                          type="checkbox"
                          className="accent-black"
                          checked={selectedAddons.includes(addon.id)}
                          onChange={() => handleToggleAddon(addon.id)}
                        />
                        <span className="flex-1 text-gray-800">{addon.name}</span>
                        <span className="text-gray-700 text-xs">₹{addon.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Discount */}
              {item.discount && (
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Discount</span>
                  <span className="text-red-500">{item.discount}</span>
                </div>
              )}

              <hr className="border-gray-200" />

              {/* Total */}
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>₹ {total.toFixed(2)}</span>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-gray-900">Preparation Notes</label>
                <textarea
                  placeholder="Add Description"
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  className="mt-2 w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 sm:px-6 py-4 flex items-center justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="h-11 px-6 rounded-lg border border-gray-400 text-gray-800 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            className="h-11 px-6 rounded-lg bg-yellow-400 text-black text-sm font-semibold hover:bg-yellow-500"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
