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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div
        className="
          bg-white w-full sm:max-w-3xl
          max-h-[90vh]
          rounded-t-2xl sm:rounded-2xl
          flex flex-col
        "
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b relative">
          <h2 className="text-lg sm:text-2xl font-semibold">{item.name}</h2>
          <button onClick={onClose} className="absolute top-4 right-4">
            <X />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Section */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Image */}
            <div className="relative mx-auto sm:mx-0">
              <img
                src={item.image || "/images/menu/biryani.jpg"}
                alt={item.name}
                className="w-full sm:w-44 h-48 sm:h-32 rounded-lg object-cover"
              />
              {item.discount && (
                <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.discount}
                </span>
              )}
            </div>

            {/* Description & Qty */}
            <div className="flex-1">
              {description && (
                <p className="text-sm text-gray-600 mb-3">{description}</p>
              )}
              {!description && (
                <p className="text-sm text-gray-600 mb-3">
                  {item.name}
                </p>
              )}

              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">
                  ₹ {unitPrice.toFixed(2)}
                </span>
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="text-sm line-through text-gray-400">
                    ₹ {item.originalPrice.toFixed(2)}
                  </span>
                )}
                {!item.originalPrice && (variantAdditionalPrice > 0 || addonTotal > 0) && (
                  <span className="text-sm line-through text-gray-400">
                    ₹ {item.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Quantity Controller */}
              <div className="mt-3 inline-flex items-center bg-yellow-400 rounded-lg overflow-hidden">
                <button
                  onClick={decrement}
                  className="px-4 py-1 text-lg font-semibold hover:bg-yellow-500"
                >
                  -
                </button>
                <span className="px-5 font-medium">
                  {qty.toString().padStart(2, "0")}
                </span>
                <button
                  onClick={increment}
                  className="px-4 py-1 text-lg font-semibold hover:bg-yellow-500"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Variants */}
          {loading ? (
            <div className="text-sm text-gray-400">Loading options...</div>
          ) : (
            <>
              {variants.length > 0 && (
                <div>
                  <div className="flex justify-between font-medium mb-2">
                    <span>Variants</span>
                    <span>₹ {variantAdditionalPrice.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {variants.map(variant => (
                      <label key={variant.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="variant"
                          checked={selectedVariant === variant.id}
                          onChange={() => setSelectedVariant(variant.id)}
                        />
                        {variant.name}
                        {variant.additionalPrice > 0 && (
                          <span className="text-gray-500">+₹{variant.additionalPrice.toFixed(2)}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons */}
              {addons.length > 0 && (
                <div>
                  <div className="flex justify-between font-medium mb-2">
                    <span>Addons</span>
                    <span>₹ {addonTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 text-sm flex-wrap">
                    {addons.map(addon => (
                      <label key={addon.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAddons.includes(addon.id)}
                          onChange={() => handleToggleAddon(addon.id)}
                        />
                        {addon.name} ₹{addon.price.toFixed(2)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {item.discount && (
            <div className="flex justify-between text-sm font-medium">
              <span>Discount</span>
              <span className="text-red-500">{item.discount}</span>
            </div>
          )}

          <hr />

          {/* Total */}
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>₹ {total.toFixed(2)}</span>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Preparation Notes</label>
            <textarea
              placeholder="Add Description"
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              className="mt-1 w-full border rounded-lg p-3 text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3 justify-end bg-white">
          <button
            onClick={onClose}
            className="border rounded-lg px-6 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            className="bg-yellow-400 rounded-lg px-6 py-2 font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
