import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Leaf, Clock, ChefHat } from "lucide-react";
import Modal from "../../ui/Modal";
import { getProduct, Product } from "../../../services/catalogService";
import BarcodeDisplay from "./BarcodeDisplay";
import { isProductAvailableNow, formatTime12h } from "../../../utils/availability";

interface ProductQuickViewModalProps {
  open: boolean;
  productId: string | number;
  onClose: () => void;
  onDelete?: (id: number) => void;
}

export default function ProductQuickViewModal({
  open,
  productId,
  onClose,
  onDelete,
}: ProductQuickViewModalProps) {
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    if (!open || !productId) return;

    setLoading(true);
    setError(null);
    setProduct(null);
    setSelectedImageIdx(0);

    getProduct(String(productId))
      .then((res) => {
        if (res.success && res.data) {
          setProduct(res.data);
          // Set initial selected image to primary
          const primaryIdx = res.data.images?.findIndex((img) => img.isPrimary) ?? 0;
          setSelectedImageIdx(primaryIdx >= 0 ? primaryIdx : 0);
        } else {
          setError(res.message || "Failed to load product");
        }
      })
      .catch(() => {
        setError("Failed to load product details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, productId]);

  const sortedImages = product?.images
    ? [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const displayImage =
    sortedImages[selectedImageIdx]?.url ||
    sortedImages[0]?.url ||
    "/placeholder.jpg";

  const primaryPrice = product?.prices?.[0];
  const displayPrice = primaryPrice?.discountPrice || primaryPrice?.basePrice;

  return (
    <Modal open={open} onClose={onClose} className="w-[95%] max-w-2xl p-6">
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-bb-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="py-16 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 text-sm text-bb-primary underline"
          >
            Close
          </button>
        </div>
      )}

      {product && !loading && (
        <>
          {/* Header */}
          <div className="flex items-start gap-2 mb-4 pr-6">
            <Eye size={20} className="text-bb-textSoft mt-0.5 shrink-0" />
            <h2 className="text-lg font-bold text-bb-text">Quick View</h2>
          </div>

          {/* Body */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Image Gallery */}
            <div className="shrink-0">
              <img
                src={displayImage}
                alt={product.name}
                className="w-full sm:w-48 h-36 rounded-lg object-cover bg-gray-100"
              />
              {sortedImages.length > 1 && (
                <div className="flex gap-2 mt-2">
                  {sortedImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`w-10 h-10 rounded overflow-hidden border-2 transition-colors ${
                        idx === selectedImageIdx
                          ? "border-bb-primary"
                          : "border-bb-border hover:border-bb-primary/50"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover bg-gray-100"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-bb-text truncate">
                  {product.name}
                </h3>
                {product.isVeg && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-xs text-green-600 border border-green-600 rounded px-1">
                    <Leaf size={10} /> Veg
                  </span>
                )}
                {!product.isVeg && (
                  <span className="shrink-0 text-xs text-red-500 border border-red-500 rounded px-1">
                    Non-Veg
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-bb-textSoft mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-bb-textSoft">Price:</span>{" "}
                  <span className="font-medium">
                    {displayPrice != null ? `₹${displayPrice}` : "—"}
                  </span>
                  {primaryPrice?.discountPrice && primaryPrice.basePrice && (
                    <span className="ml-1 text-xs text-bb-textSoft line-through">
                      ₹{primaryPrice.basePrice}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-bb-textSoft">SKU:</span>{" "}
                  <span className="font-medium">{product.sku || "—"}</span>
                </div>

                <div>
                  <span className="text-bb-textSoft">Category:</span>{" "}
                  <span className="font-medium">
                    {product.category?.name || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-bb-textSoft">Brand:</span>{" "}
                  <span className="font-medium">
                    {product.brand?.name || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-bb-textSoft">Type:</span>{" "}
                  <span className="font-medium">{product.type}</span>
                </div>

                <div>
                  <span className="text-bb-textSoft">Status:</span>{" "}
                  <span
                    className={`font-medium ${
                      product.status === "active"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {product.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                {product.preparationTime != null && (
                  <div>
                    <span className="text-bb-textSoft">Prep Time:</span>{" "}
                    <span className="font-medium">
                      {product.preparationTime} min
                    </span>
                  </div>
                )}

                {product.servesCount != null && (
                  <div>
                    <span className="text-bb-textSoft">Serves:</span>{" "}
                    <span className="font-medium">{product.servesCount}</span>
                  </div>
                )}
              </div>

              {/* Barcode */}
              {product.barcode && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-bb-textSoft uppercase">
                    Barcode
                  </span>
                  <div className="mt-1">
                    <BarcodeDisplay
                      value={product.barcode}
                      height={40}
                      width={1.5}
                      showDownload
                      productName={product.name}
                    />
                  </div>
                </div>
              )}

              {/* Availability Schedule */}
              {product.availabilitySchedule &&
                product.availabilitySchedule.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock size={12} className="text-bb-textSoft" />
                      <span className="text-xs font-medium text-bb-textSoft uppercase">
                        Availability
                      </span>
                      {isProductAvailableNow(product.availabilitySchedule) ? (
                        <span className="ml-auto text-xs text-green-600 bg-green-50 rounded px-1.5 py-0.5">
                          Available Now
                        </span>
                      ) : (
                        <span className="ml-auto text-xs text-red-500 bg-red-50 rounded px-1.5 py-0.5">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5 text-sm">
                      {product.availabilitySchedule.map((s) => (
                        <div
                          key={s.dayOfWeek}
                          className="flex justify-between"
                        >
                          <span className="text-bb-textSoft">
                            {s.dayOfWeek}
                          </span>
                          <span className="font-medium">
                            {s.isAvailable
                              ? s.startTime && s.endTime
                                ? `${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)}`
                                : "All Day"
                              : "Closed"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-bb-textSoft uppercase">
                    Variants
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {product.variants.map((v) => (
                      <span
                        key={v.id}
                        className="text-xs bg-gray-100 rounded px-2 py-0.5"
                      >
                        {v.name}{" "}
                        {v.additionalPrice > 0 && `(+₹${v.additionalPrice})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-bb-textSoft uppercase">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {product.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs rounded px-2 py-0.5"
                        style={{
                          backgroundColor: tag.color + "20",
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Kitchen Stations */}
              {product.kitchens && product.kitchens.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ChefHat size={12} className="text-bb-textSoft" />
                    <span className="text-xs font-medium text-bb-textSoft uppercase">
                      Kitchen Stations
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {product.kitchens.map((kitchen) => (
                      <span
                        key={kitchen.id}
                        className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 rounded px-2 py-0.5"
                      >
                        <ChefHat size={10} />
                        {kitchen.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-bb-border">
            <button
              onClick={() => {
                onClose();
                navigate(`/catalog/products/edit/${product.id}`);
              }}
              className="flex items-center gap-1.5 border border-black px-4 py-2 rounded text-sm font-medium hover:bg-gray-50"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete?.(Number(product.id));
              }}
              className="flex items-center gap-1.5 border border-red-300 text-red-500 px-4 py-2 rounded text-sm font-medium hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
