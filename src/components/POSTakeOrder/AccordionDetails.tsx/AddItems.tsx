import { useState } from "react";
import { Pencil } from "lucide-react";
import OrderNotesModal from "../Modals/OrderNotesModal";
import { useOrder } from "../../../contexts/OrderContext";

const AddItems = () => {
  const { cartItems, updateCartItem } = useOrder();

  // modal state
  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");

  /* ---------- QTY UPDATE ---------- */
  const updateQty = (productId: string, delta: number) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + delta);
    updateCartItem(productId, { quantity: newQuantity });
  };

  /* ---------- NOTE SAVE ---------- */
  const saveNote = (newNote: string) => {
    if (noteItemId) {
      updateCartItem(noteItemId, { notes: newNote });
    }
    setNoteItemId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-sm font-medium text-gray-700">
        <span>Items</span>
        <span className="text-center">Qty</span>
        <span className="text-right">Price</span>
      </div>

      <div className="border-t border-gray-200" />

      {/* Empty State */}
      {cartItems.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-500">
          No items in cart
        </div>
      )}

      {/* Items */}
      {cartItems.map((item) => (
        <div key={item.productId} className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
            {/* Item info */}
            <div>
              <p className="text-sm font-medium text-gray-800">
                {item.productName}
                {item.variantName && (
                  <span className="text-xs text-gray-500"> ({item.variantName})</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                ₹ {item.unitPrice.toFixed(2)}
              </p>

              <button
                onClick={() => {
                  setNoteItemId(item.productId);
                  setNoteValue(item.notes || "Add Notes");
                }}
                className="mt-1 flex items-center gap-1 text-xs text-gray-500 hover:text-black"
              >
                <Pencil size={12} />
                {item.notes || "Add Notes"}
              </button>
            </div>

            {/* Qty control */}
            <div className="flex items-center rounded-md overflow-hidden bg-[#FFD24D]">
              <button
                onClick={() => updateQty(item.productId, -1)}
                className="h-7 w-7 text-sm font-medium"
              >
                −
              </button>

              <span className="h-7 w-8 flex items-center justify-center text-sm font-medium">
                {item.quantity.toString().padStart(2, "0")}
              </span>

              <button
                onClick={() => updateQty(item.productId, 1)}
                className="h-7 w-7 text-sm font-medium"
              >
                +
              </button>
            </div>

            {/* Price */}
            <div className="text-sm font-medium text-gray-800 text-right">
              ₹ {item.totalPrice.toFixed(2)}
            </div>
          </div>

          <div className="border-t border-gray-200" />
        </div>
      ))}

      {/* Notes Modal */}
      <OrderNotesModal
        open={noteItemId !== null}
        value={noteValue}
        onClose={() => setNoteItemId(null)}
        onSave={saveNote}
      />
    </div>
  );
};

export default AddItems;
