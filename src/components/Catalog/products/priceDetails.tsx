import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import AddNewPriceModal from "./models/addNewPriceModal";
import {
  createProductPrice,
  deleteProductPrice,
  listProductPrices,
  ProductPrice,
} from "../../../services/catalogService";

type DraftPrice = {
  id: string;
  branch?: string;
  channelType: string;
  basePrice: number;
  discountPrice?: number | null;
  variantId?: string;
  variantName?: string;
};

type UiPrice = {
  id: string;
  branch: string;
  channelType: string;
  basePrice: number;
  discountPrice?: number | null;
  variantId?: string;
  variantName: string;
};

const chunk = <T,>(arr: T[], size: number): T[][] => {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const PriceDetails = ({ onNext, onPrev, productData, setProductData }: any) => {
  const [openModal, setOpenModal] = useState(false);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [draftPrices, setDraftPrices] = useState<DraftPrice[]>([]);
  const [saving, setSaving] = useState(false);

  const productId = productData?.id;

  useEffect(() => {
    if (productId) return;
    const existingDrafts = Array.isArray(productData?.prices)
      ? productData.prices
      : [];
    setDraftPrices(
      existingDrafts.map((p: any, idx: number) => ({
        id: String(p.id || `draft-${idx}`),
        branch: p.branch || "All Branches",
        channelType: p.channelType || p.channel || "",
        basePrice: Number(p.basePrice || p.price || 0),
        discountPrice: p.discountPrice ?? null,
        variantId: p.variantId || p.variant || undefined,
        variantName: p.variant?.name || p.variantName || undefined,
      }))
    );
  }, [productId, productData?.prices]);

  useEffect(() => {
    if (productId) {
      loadPrices();
    }
  }, [productId]);

  const loadPrices = async () => {
    if (!productId) return;
    try {
      const response = await listProductPrices(productId);
      if (response.success && response.data) {
        setPrices(response.data.prices || []);
      }
    } catch (err) {
      console.error("Failed to load prices:", err);
    }
  };

  const handleSave = async (data: {
    branch: string;
    prices: { variant: string; channel: string; price: string }[];
  }) => {
    if (!productId) {
      const variantMap = new Map<string, string>(
        (productData?.variants || []).map((v: any) => [
          String(v.id),
          String(v.name || ""),
        ])
      );
      const appendedDrafts: DraftPrice[] = data.prices.map((row, idx) => ({
        id: `draft-${Date.now()}-${idx}`,
        branch: data.branch || "All Branches",
        channelType: row.channel,
        basePrice: parseFloat(row.price) || 0,
        discountPrice: null,
        variantId: row.variant || undefined,
        variantName: row.variant
          ? variantMap.get(String(row.variant)) || row.variant
          : "Base Product",
      }));

      const updatedDrafts = [...draftPrices, ...appendedDrafts];
      setDraftPrices(updatedDrafts);
      setProductData?.((prev: any) => ({
        ...prev,
        prices: updatedDrafts,
      }));
      setOpenModal(false);
      return;
    }

    setSaving(true);
    try {
      for (const row of data.prices) {
        await createProductPrice(productId, {
          channelType: row.channel,
          basePrice: parseFloat(row.price) || 0,
          variantId: row.variant || undefined,
        });
      }
      await loadPrices();
    } catch (err) {
      console.error("Failed to save prices:", err);
    } finally {
      setSaving(false);
      setOpenModal(false);
    }
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!productId) {
      const updatedDrafts = draftPrices.filter((p) => p.id !== priceId);
      setDraftPrices(updatedDrafts);
      setProductData?.((prev: any) => ({
        ...prev,
        prices: updatedDrafts,
      }));
      return;
    }

    try {
      await deleteProductPrice(productId, priceId);
      await loadPrices();
    } catch (err) {
      console.error("Failed to delete price:", err);
    }
  };

  const displayPrices: UiPrice[] = useMemo(() => {
    if (productId) {
      return (prices || []).map((p: any) => ({
        id: String(p.id),
        branch: "All Branches",
        channelType: String(p.channelType || ""),
        basePrice: Number(p.basePrice || 0),
        discountPrice: p.discountPrice ?? null,
        variantId: p.variantId || undefined,
        variantName: p.variant?.name || "Base Product",
      }));
    }

    return (draftPrices || []).map((p: DraftPrice) => ({
      id: p.id,
      branch: p.branch || "All Branches",
      channelType: String(p.channelType || ""),
      basePrice: Number(p.basePrice || 0),
      discountPrice: p.discountPrice ?? null,
      variantId: p.variantId,
      variantName: p.variantName || "Base Product",
    }));
  }, [productId, prices, draftPrices]);

  const groupedByBranch = useMemo(() => {
    const map = new Map<string, UiPrice[]>();
    for (const row of displayPrices) {
      const key = row.branch || "All Branches";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries()).map(([branchName, rows]) => ({
      branchName,
      rows,
    }));
  }, [displayPrices]);

  const productImage = useMemo(() => {
    if (typeof productData?.imageFile === "string") return productData.imageFile;
    if (Array.isArray(productData?.imageFiles) && productData.imageFiles.length > 0) {
      return productData.imageFiles[0]?.preview;
    }
    if (Array.isArray(productData?.images) && productData.images.length > 0) {
      return productData.images[0]?.url;
    }
    return "";
  }, [productData]);

  const productName = String(productData?.name || "Product");

  return (
    <div className="bg-bb-bg border rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-2xl">Price Detail&apos;s</h2>
        <button
          onClick={() => setOpenModal(true)}
          className="bg-black text-white px-6 py-2 rounded text-sm"
          disabled={saving}
        >
          Add New
        </button>
      </div>

      <div className="space-y-4">
        {groupedByBranch.length === 0 ? (
          <div className="border rounded p-6 text-center text-gray-500 bg-white">
            {productId
              ? 'No prices configured yet. Click "Add New" to add pricing.'
              : 'No draft prices yet. Click "Add New" to add pricing.'}
          </div>
        ) : (
          groupedByBranch.map((group, idx) => {
            const variantMap = new Map<string, UiPrice[]>();

            for (const row of group.rows) {
              const key = row.variantId || "base-product";
              if (!variantMap.has(key)) variantMap.set(key, []);
              variantMap.get(key)!.push(row);
            }

            const variants = Array.from(variantMap.entries()).map(([key, rows]) => ({
              key,
              variantName: rows[0]?.variantName || "Base Product",
              rowPairs: chunk(rows, 2),
            }));

            const totalRows = variants.reduce((sum, v) => sum + v.rowPairs.length, 0);

            return (
              <div key={`${group.branchName}-${idx}`} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {variants.map((variant, variantIndex) =>
                      variant.rowPairs.map((pair, pairIndex) => {
                        const firstInCard = variantIndex === 0 && pairIndex === 0;
                        const firstInVariant = pairIndex === 0;
                        return (
                          <tr key={`${variant.key}-${pairIndex}`} className="border-t border-gray-200">
                            {firstInCard && (
                              <td
                                rowSpan={totalRows}
                                className="w-[260px] p-3 align-top border-r border-gray-200"
                              >
                                <div className="flex gap-3">
                                  <div className="w-28 h-24 bg-gray-100 rounded overflow-hidden shrink-0">
                                    {productImage ? (
                                      <img
                                        src={productImage}
                                        alt={productName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                        No Image
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-base">{productName}</p>
                                    <p className="text-gray-500 text-xs">Product Name</p>
                                    <p className="font-semibold mt-3 text-base">{group.branchName}</p>
                                    <p className="text-gray-500 text-xs">Branch Location</p>
                                  </div>
                                </div>
                              </td>
                            )}

                            {firstInVariant && (
                              <td
                                rowSpan={variant.rowPairs.length}
                                className={`w-[160px] p-2 align-top border-r border-gray-200 ${
                                  firstInCard ? "bg-yellow-400" : "bg-[#FFF8DD]"
                                }`}
                              >
                                <p className="font-semibold text-2lg">{variant.variantName}</p>
                                <p className="text-gray-700 text-xs">Variant Name</p>
                              </td>
                            )}

                            {[0, 1].map((slot) => {
                              const item = pair[slot];
                              return (
                                <>
                                  <td key={`channel-${slot}`} className="p-2 border-r border-gray-200 min-w-[180px]">
                                    {item ? (
                                      <>
                                        <p className="font-semibold text-2lg">{item.channelType}</p>
                                        <p className="text-gray-500 text-xs">Channel</p>
                                      </>
                                    ) : null}
                                  </td>
                                  <td key={`price-${slot}`} className="p-2 border-r border-gray-200 min-w-[130px]">
                                    {item ? (
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <p className="font-semibold text-2lg">Rs {item.basePrice}</p>
                                          <p className="text-gray-500 text-xs">Price</p>
                                        </div>
                                        <button
                                          className="text-red-500 hover:text-red-600"
                                          onClick={() => handleDeletePrice(item.id)}
                                          title="Delete price"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    ) : null}
                                  </td>
                                </>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>

      <AddNewPriceModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
        productId={productId}
        localVariants={productData?.variants || []}
      />

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onPrev} className="border px-6 py-2 rounded border-black">
          Previous
        </button>
        <button onClick={onNext} className="bg-yellow-400 px-6 py-2 rounded">
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default PriceDetails;
