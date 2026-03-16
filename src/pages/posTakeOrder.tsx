import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import DiscountSection from "../components/POSTakeOrder/DiscountSection";
import MenuTabs from "../components/POSTakeOrder/MenuTabs";
import MenuGrid from "../components/POSTakeOrder/MenuGrid";
import OrderPanel from "../components/POSTakeOrder/OrderPanel";
import MenuListView from "../components/POSTakeOrder/MenuListView";
import POSHeader from "../layout/POSHeader";
import { useOrder } from "../contexts/OrderContext";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import KeyboardShortcutsModal from "../components/ui/KeyboardShortcutsModal";

const POSPage: React.FC = () => {
  const [openOrderPanel, setOpenOrderPanel] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setTable, clearCart } = useOrder();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchParams] = useSearchParams();

  const handleNewOrder = useCallback(() => {
    clearCart();
    navigate("/pos/takeorder");
  }, [clearCart, navigate]);

  const handleSaveShortcut = useCallback(() => {
    const saveBtn = document.querySelector<HTMLButtonElement>('[data-shortcut="save-draft"]');
    if (saveBtn) saveBtn.click();
  }, []);

  const handlePrintShortcut = useCallback(() => {
    window.print();
  }, []);

  const handleToggleShortcuts = useCallback(() => {
    setShortcutsOpen((prev) => !prev);
  }, []);

  useKeyboardShortcuts([
    { key: "n", ctrl: true, description: "New order", category: "pos", handler: handleNewOrder },
    { key: "s", ctrl: true, description: "Save draft order", category: "pos", handler: handleSaveShortcut },
    { key: "p", ctrl: true, description: "Print current order", category: "pos", handler: handlePrintShortcut },
    { key: "/", ctrl: true, description: "Show keyboard shortcuts", category: "global", handler: handleToggleShortcuts },
  ]);

  // Get filter params from URL
  const categoryId = searchParams.get('categoryId') || undefined;
  const searchQuery = searchParams.get('search') || undefined;
  const barcodeQuery = searchParams.get('barcode') || undefined;

  // Set table info from navigation state (when coming from table view)
  useEffect(() => {
    const state = location.state as { tableId?: string; tableName?: string; floorId?: string; floorName?: string; guestCount?: number } | null;
    if (state?.tableId) {
      setTable({
        tableId: state.tableId,
        tableName: state.tableName,
        floorId: state.floorId,
        floorName: state.floorName,
        guestCount: state.guestCount,
      });
      // Clear the state so it doesn't re-apply on re-renders
      window.history.replaceState({}, document.title);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = () => {
  const entryPath =
    sessionStorage.getItem("posEntry") ||
    sessionStorage.getItem("lastNonPOS") ||
    "/";

  sessionStorage.removeItem("posEntry");
  navigate(entryPath);
};
  return (
    <div className="min-h-screen bg-[#F9F4E8]">
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-6">
        <POSHeader />
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="text-[#655016] hover:opacity-80 transition text-lg"
            aria-label="Back"
          >
            ←
          </button>

          <h1 className="text-sm sm:text-base lg:text-lg font-medium text-[#655016]">
            Point Of Sale
          </h1>
        </div>
      </div>

      {/* Main Layout */}
      <div className="relative grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[1.65fr_1fr] xl:grid-cols-[1.8fr_1fr] max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 pb-6">
        {/* Left Section */}
        <div className="space-y-4">

          <DiscountSection
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          <MenuTabs />

          {viewMode === "grid" ? (
            <MenuGrid categoryId={categoryId} searchQuery={searchQuery} barcode={barcodeQuery} />
          ) : (
            <MenuListView categoryId={categoryId} searchQuery={searchQuery} barcode={barcodeQuery} />
          )}

        </div>

        {/* Desktop / Tablet Order Panel */}
        <div className="hidden lg:block h-[calc(100vh-140px)] sticky top-6 overflow-y-auto overflow-x-hidden min-w-0 bg-white rounded-2xl shadow-sm border border-[#EADFC2]">
          <OrderPanel />
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setOpenOrderPanel(true)}
          className="
            fixed right-0 top-1/2 -translate-y-1/2 z-40 lg:hidden
            h-20 sm:h-24 w-8 bg-gray-700 text-white rounded-lg
            flex items-center justify-center shadow-lg
          "
          aria-label="Open order panel"
        >
          <span className="text-lg font-semibold">&lt;</span>
        </button>

        {/* Mobile Order Panel Drawer */}
        {openOrderPanel && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpenOrderPanel(false)}
            />

            <div
              className="
                absolute right-0 top-0 h-full
                w-[95%] sm:w-[80%] max-w-md
                bg-white animate-slide-in
                overflow-y-auto
              "
            >
              <OrderPanel />

              <button
                onClick={() => setOpenOrderPanel(false)}
                className="absolute top-4 right-4 text-gray-600 text-xl"
                aria-label="Close order panel"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};

export default POSPage;
