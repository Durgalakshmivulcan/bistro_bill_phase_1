import { useState, useEffect } from "react";
import AddNewPriceModal from "./models/addNewPriceModal";
import { createProductPrice, listProductPrices, deleteProductPrice, ProductPrice } from "../../../services/catalogService";

const PriceDetails = ({ onNext, onPrev, productData }: any) => {
    const [openModal, setOpenModal] = useState(false);
    const [prices, setPrices] = useState<ProductPrice[]>([]);
    const [saving, setSaving] = useState(false);

    const productId = productData?.id;
    const productName = productData?.name || "Product";

    // Load existing prices when product is available
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

    const handleSave = async (data: { branch: string; prices: { variant: string; channel: string; price: string }[] }) => {
        if (!productId) {
            // Product not yet created — just close modal and proceed
            setOpenModal(false);
            return;
        }

        setSaving(true);
        try {
            // Create each price entry via API
            for (const row of data.prices) {
                await createProductPrice(productId, {
                    channelType: row.channel,
                    basePrice: parseFloat(row.price) || 0,
                    variantId: row.variant || undefined,
                });
            }
            // Reload prices after save
            await loadPrices();
        } catch (err) {
            console.error("Failed to save prices:", err);
        } finally {
            setSaving(false);
            setOpenModal(false);
        }
    };

    const handleDeletePrice = async (priceId: string) => {
        if (!productId) return;
        try {
            await deleteProductPrice(productId, priceId);
            await loadPrices();
        } catch (err) {
            console.error("Failed to delete price:", err);
        }
    };

    return (
        <div className="bg-bb-bg border rounded-xl p-6">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Price Detail's</h2>
                <button
                    onClick={() => setOpenModal(true)}
                    className="bg-black text-white px-4 py-2 rounded text-sm"
                    disabled={saving}
                >
                    Add New
                </button>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 text-sm bg-[#FFFDF5]">
                    <thead className="bg-yellow-400">
                        <tr>
                            <th className="p-2 text-left">Channel</th>
                            <th className="p-2 text-left">Base Price</th>
                            <th className="p-2 text-left">Discount Price</th>
                            <th className="p-2 text-left">Variant</th>
                            <th className="p-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prices.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    {productId ? "No prices configured yet. Click \"Add New\" to add pricing." : "Save the product first to add pricing."}
                                </td>
                            </tr>
                        ) : (
                            prices.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-2">{p.channelType}</td>
                                    <td className="p-2">₹{p.basePrice}</td>
                                    <td className="p-2">{p.discountPrice ? `₹${p.discountPrice}` : "-"}</td>
                                    <td className="p-2">{p.variant?.name || "-"}</td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => handleDeletePrice(p.id)}
                                            className="text-red-500 hover:text-red-700 text-xs"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            <AddNewPriceModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSave={handleSave}
            />

            {/* FOOTER */}
            <div className="flex justify-end gap-3 mt-6">
                <button onClick={onPrev} className="border px-4 py-2 rounded">
                    Previous
                </button>
                <button onClick={onNext} className="bg-yellow-400 px-4 py-2 rounded">
                    Save & Next
                </button>
            </div>
        </div>
    );
};

export default PriceDetails;
