import { useState } from "react";
import OrderTypeTabs from "./OrderTypeTabs";
import OrderActions from "./OrderActions";
import DineInOrderPanel from "./DineInOrderPanel";
import TakeAwayOrderPanel from "./TakeAwayOrderPanel";
import CateringOrderPanel from "./CateringOrderPanel";
import SubscriptionOrderPanel from "./SubscriptionOrderPanel";
import { Bookmark, CreditCard, ShoppingBag, Archive, FileText } from "lucide-react";

import PaymentModal from "./Modals/PaymentModal";
import QuickSettleModal from "./Modals/QuickSettleModal";
import ActionAlertModal from "./Modals/ActionAlertModal";
import RetrieveHoldOrderModal from "./Modals/RetrieveHoldOrderModal";
import LoadDraftOrderModal from "./Modals/LoadDraftOrderModal";

import saveImg from "../../assets/saveorderalert.png";
import tickImg from "../../assets/tick.png";
import holdImg from "../../assets/holdalert.png";
import cancelledImg from "../../assets/cancelledalert.png";

import { useOrder } from "../../contexts/OrderContext";
import type { CartItem } from "../../contexts/OrderContext";
import { useAuth } from "../../contexts/AuthContext";
import { createOrder, holdOrder, cancelOrder } from "../../services/orderService";
import { showSuccessToast } from "../../utils/toast";
import { CRUDToasts } from "../../utils/toast";

type OrderType = "dinein" | "takeaway" | "catering" | "subscription";

const OrderPanel = () => {
  const [orderType, setOrderType] = useState<OrderType>("dinein");
  const [openPayment, setOpenPayment] = useState(false);
  const [activeFooter, setActiveFooter] = useState<
    "save" | "quick" | "checkout" | null
  >(null);

  // ✅ NEW STATES
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [quickSettleOpen, setQuickSettleOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [holdSuccess, setHoldSuccess] = useState(false);
  const [holdTicketId, setHoldTicketId] = useState<string>("");
  const [retrieveHoldOpen, setRetrieveHoldOpen] = useState(false);
  const [loadDraftOpen, setLoadDraftOpen] = useState(false);
  const [draftOrderId, setDraftOrderId] = useState<string>("");

  // ✅ API INTEGRATION STATES
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState<string>("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string>("");

  // ✅ CONTEXT HOOKS
  const orderContext = useOrder();
  const { user } = useAuth();

  // ✅ RESET ORDER HANDLER
  const handleResetOrder = () => {
    // Reset order type to default
    setOrderType("dinein");
    // Clear any active footer state
    setActiveFooter(null);
    // Close all modals
    setOpenPayment(false);
    setShowSaveAlert(false);
    setQuickSettleOpen(false);
    setPaymentSuccess(false);
    setHoldSuccess(false);
    setHoldTicketId("");

    // Clear cart items, customer, table, and discount state
    orderContext.resetOrder();
  };

  // ✅ HOLD ORDER HANDLER
  const handleHoldOrder = async () => {
    try {
      setHolding(true);
      setHoldError("");

      // Validate: Check if order has been created (currentOrderId exists)
      if (!orderContext.currentOrderId) {
        // If no order ID exists yet, create the order first as draft
        await handleSaveOrderDraft();

        // If save failed, don't proceed with hold
        if (!orderContext.currentOrderId) {
          setHoldError("Cannot hold order. Please save the order first.");
          return;
        }
      }

      // Call hold order API
      const response = await holdOrder(orderContext.currentOrderId);

      if (response.success && response.data?.order) {
        const heldOrder = response.data.order;

        // Store the order number as hold ticket ID
        setHoldTicketId(heldOrder.orderNumber || heldOrder.id);

        // Show success toast
        CRUDToasts.orderHeld(heldOrder.orderNumber);

        // Show hold success modal
        setHoldSuccess(true);

        // Clear the order context after successful hold
        orderContext.resetOrder();

        // Reset local state
        setOrderType("dinein");
        setActiveFooter(null);
        setOpenPayment(false);
        setShowSaveAlert(false);
        setQuickSettleOpen(false);
        setPaymentSuccess(false);
        setSaveError("");
        setDraftOrderId("");
      } else {
        setHoldError(response.error?.message || "Failed to hold order. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to hold order:", error);
      setHoldError(error.message || "Failed to hold order. Please try again.");
    } finally {
      setHolding(false);
    }
  };

  // ✅ CANCEL ORDER HANDLER
  const handleCancelOrder = async (reason: string, remarks?: string) => {
    try {
      setCancelling(true);
      setCancelError("");

      // Validate: Check if order has been created (currentOrderId exists)
      if (!orderContext.currentOrderId) {
        setCancelError("Cannot cancel order. No order exists to cancel.");
        return;
      }

      // Call cancel order API
      const response = await cancelOrder(
        orderContext.currentOrderId,
        reason,
        remarks
      );

      if (response.success && response.data?.order) {
        // Success - order has been cancelled
        const cancelledOrder = response.data.order;

        // Show success toast
        CRUDToasts.orderCancelled(cancelledOrder.orderNumber);

        // Clear the order context after successful cancellation
        orderContext.resetOrder();

        // Reset local state
        setOrderType("dinein");
        setActiveFooter(null);
        setOpenPayment(false);
        setShowSaveAlert(false);
        setQuickSettleOpen(false);
        setPaymentSuccess(false);
        setHoldSuccess(false);
        setHoldTicketId("");
        setSaveError("");
        setHoldError("");
        setDraftOrderId("");

        // Success message is shown by the ActionAlertModal in OrderActions
      } else {
        setCancelError(response.error?.message || "Failed to cancel order. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      setCancelError(error.message || "Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  // ✅ SAVE ORDER DRAFT HANDLER
  const handleSaveOrderDraft = async () => {
    try {
      setSaving(true);
      setSaveError("");

      // Validate: Check if cart has items
      if (!orderContext.cartItems || orderContext.cartItems.length === 0) {
        setSaveError("Cannot save an empty order. Please add items to the cart.");
        return;
      }

      // Validate: Check if user exists
      if (!user) {
        setSaveError("User information is missing. Please log in again.");
        return;
      }

      // Extract branchId based on user type
      let branchId: string | undefined;
      let staffId: string;

      if (user.userType === 'Staff') {
        branchId = user.branch?.id;
        staffId = user.id;
      } else if (user.userType === 'BusinessOwner') {
        // For business owner, use the first branch or main branch
        branchId = user.branches?.find(b => b.isMainBranch)?.id || user.branches?.[0]?.id;
        staffId = user.id;
      } else {
        // SuperAdmin - shouldn't be creating orders typically, but handle it
        staffId = user.id;
      }

      if (!branchId) {
        setSaveError("Branch information is missing. Please select a branch.");
        return;
      }

      // Map order type from UI to API format
      const orderTypeMap: Record<OrderType, "DineIn" | "Takeaway" | "Delivery" | "Online"> = {
        "dinein": "DineIn",
        "takeaway": "Takeaway",
        "catering": "Delivery", // Map catering to Delivery for now
        "subscription": "Online", // Map subscription to Online for now
      };

      // Create order via API
      const response = await createOrder({
        branchId: branchId,
        type: orderTypeMap[orderType],
        staffId: staffId,
        tableId: orderContext.table.tableId,
        customerId: orderContext.customer.customerId,
        customerName: orderContext.customer.customerName,
        customerPhone: orderContext.customer.customerPhone,
        notes: orderContext.orderNotes,
      });

      if (response.success && response.data?.order) {
        const createdOrder = response.data.order;

        // Store the order ID
        setDraftOrderId(createdOrder.orderNumber || createdOrder.id);
        orderContext.setCurrentOrderId(createdOrder.id);

        // Show success toast
        CRUDToasts.orderCreated(createdOrder.orderNumber);

        // Show save success modal
        setShowSaveAlert(true);

        // Note: Unlike Hold/Cancel, Save does NOT clear the cart
        // The order remains in the current state for continued editing
      } else {
        setSaveError(response.error?.message || "Failed to save order. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to save order draft:", error);
      setSaveError(error.message || "Failed to save order draft. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ HELPER: Get branch ID from user
  const getBranchId = (): string => {
    if (!user) return '';

    if (user.userType === 'Staff') {
      return user.branch?.id || '';
    } else if (user.userType === 'BusinessOwner') {
      return user.branches?.find(b => b.isMainBranch)?.id || user.branches?.[0]?.id || '';
    }

    return '';
  };

  // ✅ PAYMENT SUCCESS HANDLER
  const handlePaymentSuccess = () => {
    // Reset order state after successful payment
    setOrderType("dinein");
    setActiveFooter(null);
    setOpenPayment(false);
    setShowSaveAlert(false);
    setQuickSettleOpen(false);
    setHoldSuccess(false);
    setHoldTicketId("");

    // Show success modal first, then reset order when dismissed
    setPaymentSuccess(true);
  };

  return (
    <>
      <div
        className="
          w-full bg-white rounded-2xl
          grid grid-rows-[auto_1fr_auto]
          h-[calc(100vh-3rem)]
          min-h-[600px]
          lg:h-[calc(100vh-4rem)]
          xl:h-[calc(100vh-5rem)] mt-5
        "
      >
        {/* TOP */}
        <div className="p-3 sm:p-4 space-y-3">
          <OrderTypeTabs value={orderType} onChange={setOrderType} />
          <OrderActions
            onResetOrder={handleResetOrder}
            onHoldOrder={handleHoldOrder}
            onCancelOrder={handleCancelOrder}
            onSaveNotes={(note) => orderContext.setOrderNotes(note)}
            currentNotes={orderContext.orderNotes}
          />
        </div>

        {/* BODY */}
        <div className="overflow-y-auto px-3 sm:px-4">
          <div className="mt-4 sm:mt-6 space-y-3">
            {orderType === "dinein" && <DineInOrderPanel />}
            {orderType === "takeaway" && <TakeAwayOrderPanel />}
            {orderType === "catering" && <CateringOrderPanel />}
            {orderType === "subscription" && <SubscriptionOrderPanel />}
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t px-3 py-2 sm:p-4">
          <div className="grid grid-cols-2 gap-2">

            {/* RETRIEVE HELD ORDERS */}
            <button
              onClick={() => setRetrieveHoldOpen(true)}
              className="h-10 sm:h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm transition bg-white hover:bg-gray-50"
            >
              <Archive size={16} />
              Held Orders
            </button>

            {/* LOAD DRAFT ORDERS */}
            <button
              onClick={() => setLoadDraftOpen(true)}
              className="h-10 sm:h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm transition bg-white hover:bg-gray-50"
            >
              <FileText size={16} />
              Draft Orders
            </button>

            {/* SAVE */}
            <button
              data-shortcut="save-draft"
              onClick={() => {
                setActiveFooter("save");
                handleSaveOrderDraft();
              }}
              disabled={saving}
              title={`Save Order (${typeof navigator !== "undefined" && /Mac/.test(navigator.platform) ? "Cmd" : "Ctrl"}+S)`}
              className={`h-10 sm:h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm transition
  ${activeFooter === "save"
                  ? "bg-bb-primary border-[#FFC533]"
                  : "bg-white hover:bg-gray-50"
                }
  ${saving ? "opacity-50 cursor-not-allowed" : ""}`}

            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Bookmark size={18} />
                  Save Order
                </>
              )}
            </button>

            {/* QUICK SETTLE */}
            <button
              onClick={() => {
                setActiveFooter("quick");
                setQuickSettleOpen(true);
              }}
              className={`h-10 sm:h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm transition
  ${activeFooter === "quick"
                  ? "bg-bb-primary border-[#FFC533]"
                  : "bg-white hover:bg-gray-50"
                }`}
            >
              <CreditCard size={18} />
              Quick Settle
            </button>

            {/* CHECKOUT */}
            <button
              onClick={() => {
                setActiveFooter("checkout");
                setOpenPayment(true);
              }}
              className={`col-span-2 h-10 sm:h-12 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition
  ${activeFooter === "checkout"
                  ? "bg-bb-primary"
                  : "bg-white hover:bg-gray-50"
                }`}
            >
              <ShoppingBag size={18} />
              Checkout
            </button>

          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      <PaymentModal
        open={openPayment}
        onClose={() => setOpenPayment(false)}
        order={orderContext.currentOrderId ? {
          id: orderContext.currentOrderId,
          orderNumber: draftOrderId,
          branchId: getBranchId(),
          type: orderType === 'dinein' ? 'DineIn' : orderType === 'takeaway' ? 'Takeaway' : orderType === 'catering' ? 'Delivery' : 'Online',
          status: 'Draft',
          paymentStatus: 'Unpaid',
          staffId: user?.id || '',
          tableId: orderContext.table.tableId,
          customerId: orderContext.customer.customerId,
          customerName: orderContext.customer.customerName,
          customerPhone: orderContext.customer.customerPhone,
          notes: orderContext.orderNotes,
          subtotal: orderContext.summary.subtotal,
          discountAmount: orderContext.summary.discountAmount,
          taxAmount: orderContext.summary.taxAmount,
          total: orderContext.summary.total,
          paidAmount: 0,
          dueAmount: orderContext.summary.total,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } : null}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* SAVE ALERT */}
      <ActionAlertModal
        open={showSaveAlert}
        image={saveImg}
        title="Order Saved"
        description={`Your Order has been Saved Successfully! Order ID: ${draftOrderId}`}
        cancelText="Close"
        onClose={() => {
          setShowSaveAlert(false);
          setActiveFooter(null);
        }}
      />

      {/* SAVE ERROR ALERT */}
      {saveError && (
        <ActionAlertModal
          open={!!saveError}
          image={saveImg}
          title="Save Failed"
          description={saveError}
          cancelText="Close"
          onClose={() => {
            setSaveError("");
            setActiveFooter(null);
          }}
        />
      )}

      {/* QUICK SETTLE */}
      <QuickSettleModal
        open={quickSettleOpen}
        orderId={orderContext.currentOrderId}
        amount={orderContext.summary.total}
        onClose={() => setQuickSettleOpen(false)}
        onPaymentSuccess={() => {
          setQuickSettleOpen(false);
          setPaymentSuccess(true);
          handlePaymentSuccess(); // Clear cart and reset state
        }}
      />

      {/* PAYMENT SUCCESS */}
      <ActionAlertModal
        open={paymentSuccess}
        image={tickImg}
        title="Payment Successful"
        description="Transaction has been Processed Successfully!"
        cancelText="Close"
        onClose={() => {
          setPaymentSuccess(false);
          orderContext.resetOrder();
        }}
      />

      {/* HOLD SUCCESS */}
      <ActionAlertModal
        open={holdSuccess}
        image={holdImg}
        title="Order On Hold"
        description={`Order has been placed on hold. Hold Ticket ID: ${holdTicketId}`}
        cancelText="Close"
        onClose={() => {
          setHoldSuccess(false);
          setHoldTicketId("");
        }}
      />

      {/* HOLD ERROR ALERT */}
      {holdError && (
        <ActionAlertModal
          open={!!holdError}
          image={holdImg}
          title="Hold Failed"
          description={holdError}
          cancelText="Close"
          onClose={() => {
            setHoldError("");
          }}
        />
      )}

      {/* CANCEL ERROR ALERT */}
      {cancelError && (
        <ActionAlertModal
          open={!!cancelError}
          image={cancelledImg}
          title="Cancel Failed"
          description={cancelError}
          cancelText="Close"
          onClose={() => {
            setCancelError("");
          }}
        />
      )}

      {/* RETRIEVE HELD ORDERS */}
      <RetrieveHoldOrderModal
        open={retrieveHoldOpen}
        onClose={() => setRetrieveHoldOpen(false)}
        onRetrieve={(order) => {
          // Load the retrieved order into the current cart
          orderContext.setCurrentOrderId(order.id);

          // Set order type based on the retrieved order
          const orderTypeMap: Record<typeof order.type, OrderType> = {
            "DineIn": "dinein",
            "Takeaway": "takeaway",
            "Delivery": "catering",
            "Online": "subscription",
          };
          setOrderType(orderTypeMap[order.type]);

          // Load customer info
          if (order.customerName || order.customerPhone || order.customerId) {
            orderContext.setCustomer({
              customerId: order.customerId,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
            });
          }

          // Load table info (if applicable)
          if (order.tableId) {
            orderContext.setTable({
              tableId: order.tableId,
            });
          }

          // Load order notes
          if (order.notes) {
            orderContext.setOrderNotes(order.notes);
          }

          // Load cart items from order items
          if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
              orderContext.addCartItem({
                productId: item.productId,
                productName: item.productName,
                variantId: item.variantId,
                variantName: item.variantName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                taxAmount: item.taxAmount,
                notes: item.notes,
                addons: item.addons,
              });
            });
          }

          // Update summary
          orderContext.updateSummary({
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            taxAmount: order.taxAmount,
            total: order.total,
          });

          setRetrieveHoldOpen(false);
        }}
      />

      {/* LOAD DRAFT ORDERS */}
      <LoadDraftOrderModal
        open={loadDraftOpen}
        onClose={() => setLoadDraftOpen(false)}
        onLoad={(order) => {
          // Clear current cart and populate with draft order data
          orderContext.clearCart();

          // Add each item from the draft order to the cart
          if (order.items) {
            for (const item of order.items) {
              const cartItem: CartItem = {
                productId: item.productId,
                productName: item.productName,
                variantId: item.variantId,
                variantName: item.variantName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                taxAmount: item.taxAmount,
                notes: item.notes,
                addons: item.addons?.map(a => ({
                  addonId: a.addonId,
                  addonName: a.addonName,
                  price: a.price,
                  quantity: a.quantity,
                })),
              };
              orderContext.addCartItem(cartItem);
            }
          }

          // Set order ID so subsequent saves update the existing order
          orderContext.setCurrentOrderId(order.id);

          // Set customer info if present
          if (order.customerId || order.customerName) {
            orderContext.setCustomer({
              customerId: order.customerId,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
            });
          }

          // Set table info if present
          if (order.tableId) {
            orderContext.setTable({ tableId: order.tableId });
          }

          setLoadDraftOpen(false);
          showSuccessToast('Draft order loaded');
        }}
      />
    </>
  );
};

export default OrderPanel;
