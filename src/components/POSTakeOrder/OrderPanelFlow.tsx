import { useState } from "react";
import { Archive, Bookmark, CreditCard, FileText, ShoppingBag } from "lucide-react";
import OrderTypeTabs from "./OrderTypeTabs";
import OrderActions from "./OrderActions";
import DineInOrderPanel from "./DineInOrderPanel";
import TakeAwayOrderPanel from "./TakeAwayOrderPanel";
import CateringOrderPanel from "./CateringOrderPanel";
import SubscriptionOrderPanel from "./SubscriptionOrderPanel";
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
import {
  addOrderItem,
  cancelOrder,
  createOrder,
  generateKOT,
  getOrder,
  holdOrder,
  removeOrderItem,
  type Order,
  updateOrderItem,
  updateOrderStatus,
} from "../../services/orderService";
import { CRUDToasts, showSuccessToast } from "../../utils/toast";

type OrderType = "dinein" | "takeaway" | "catering" | "subscription";

const ORDER_TYPE_MAP: Record<OrderType, "DineIn" | "TakeAway" | "Catering" | "Subscription"> = {
  dinein: "DineIn",
  takeaway: "TakeAway",
  catering: "Catering",
  subscription: "Subscription",
};

const getCartItemKey = (item: { productId: string; variantId?: string; notes?: string }) =>
  `${item.productId}::${item.variantId || ""}::${item.notes || ""}`;

const normaliseAddons = (addons?: { addonId: string; quantity: number }[]) =>
  [...(addons || [])]
    .map((addon) => `${addon.addonId}:${addon.quantity}`)
    .sort()
    .join("|");

const OrderPanelFlow = () => {
  const [orderType, setOrderType] = useState<OrderType>("dinein");
  const [openPayment, setOpenPayment] = useState(false);
  const [activeFooter, setActiveFooter] = useState<"save" | "quick" | "checkout" | null>(null);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [quickSettleOpen, setQuickSettleOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [holdSuccess, setHoldSuccess] = useState(false);
  const [holdTicketId, setHoldTicketId] = useState("");
  const [retrieveHoldOpen, setRetrieveHoldOpen] = useState(false);
  const [loadDraftOpen, setLoadDraftOpen] = useState(false);
  const [draftOrderId, setDraftOrderId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const orderContext = useOrder();
  const { user } = useAuth();

  const resetVisualState = () => {
    setOrderType("dinein");
    setActiveFooter(null);
    setOpenPayment(false);
    setShowSaveAlert(false);
    setQuickSettleOpen(false);
    setPaymentSuccess(false);
    setHoldSuccess(false);
    setHoldTicketId("");
  };

  const handleResetOrder = () => {
    resetVisualState();
    orderContext.resetOrder();
  };

  const getBranchId = (): string => {
    if (!user) return "";
    if (user.userType === "Staff") return user.branch?.id || "";
    if (user.userType === "BusinessOwner") {
      return (user as any).branchId || user.branches?.find((branch) => branch.isMainBranch)?.id || user.branches?.[0]?.id || "";
    }
    return "";
  };

  const validateOrderBasics = () => {
    if (!orderContext.cartItems.length) {
      throw new Error("Cannot save an empty order. Please add items to the cart.");
    }
    if (!user) {
      throw new Error("User information is missing. Please log in again.");
    }

    const branchId = getBranchId();
    if (!branchId) {
      throw new Error("Branch information is missing. Please select a branch.");
    }

    const staffId = orderContext.table.captainId || user.id;
    if (!staffId) {
      throw new Error("Please select a captain/staff before saving the order.");
    }

    return { branchId, staffId };
  };

  const syncOrderItems = async (orderId: string, existingOrderFallback?: Order) => {
    let existingOrder: Order | undefined = existingOrderFallback;

    if (!existingOrder) {
      const orderResponse = await getOrder(orderId);
      if (!orderResponse.success || !orderResponse.data?.order) {
        throw new Error(orderResponse.error?.message || "Failed to load order items.");
      }
      existingOrder = orderResponse.data.order;
    }

    const existingItems = existingOrder.items || [];
    const existingByKey = new Map(
      existingItems.map((item) => [
        getCartItemKey({
          productId: item.productId,
          variantId: item.variantId,
          notes: item.notes,
        }),
        item,
      ])
    );
    const cartKeys = new Set<string>();

    for (const cartItem of orderContext.cartItems) {
      const itemKey = getCartItemKey(cartItem);
      cartKeys.add(itemKey);

      const addons =
        cartItem.addons?.map((addon) => ({
          addonId: addon.addonId,
          quantity: addon.quantity,
        })) || [];

      const existingItem = existingByKey.get(itemKey);
      if (!existingItem) {
        const addResponse = await addOrderItem(orderId, {
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          variantId: cartItem.variantId,
          notes: cartItem.notes,
          addons,
        });

        if (!addResponse.success) {
          throw new Error(addResponse.error?.message || "Failed to add order item.");
        }
        continue;
      }

      const existingAddonSignature = normaliseAddons(
        (existingItem.addons || []).map((addon) => ({
          addonId: addon.addonId,
          quantity: addon.quantity,
        }))
      );
      const cartAddonSignature = normaliseAddons(addons);

      const needsUpdate =
        existingItem.quantity !== cartItem.quantity ||
        (existingItem.notes || "") !== (cartItem.notes || "") ||
        (existingItem.variantId || "") !== (cartItem.variantId || "") ||
        existingAddonSignature !== cartAddonSignature;

      if (needsUpdate) {
        const updateResponse = await updateOrderItem(orderId, existingItem.id, {
          quantity: cartItem.quantity,
          notes: cartItem.notes,
          addons,
        });

        if (!updateResponse.success) {
          throw new Error(updateResponse.error?.message || "Failed to update order item.");
        }
      }
    }

    for (const existingItem of existingItems) {
      const existingKey = getCartItemKey({
        productId: existingItem.productId,
        variantId: existingItem.variantId,
        notes: existingItem.notes,
      });

      if (!cartKeys.has(existingKey)) {
        const removeResponse = await removeOrderItem(orderId, existingItem.id);
        if (!removeResponse.success) {
          throw new Error(removeResponse.error?.message || "Failed to remove order item.");
        }
      }
    }

    const refreshedOrder = await getOrder(orderId);
    if (refreshedOrder.success && refreshedOrder.data?.order) {
      return refreshedOrder.data.order;
    }

    return existingOrder;
  };

  const ensureOrderPersisted = async () => {
    const { branchId, staffId } = validateOrderBasics();
    let orderId = orderContext.currentOrderId;
    let orderNumber = draftOrderId;

    let createdOrder: Order | undefined;

    if (!orderId) {
      const createResponse = await createOrder({
        branchId,
        type: ORDER_TYPE_MAP[orderType],
        staffId,
        tableId: orderContext.table.tableId,
        customerId: orderContext.customer.customerId,
        customerName: orderContext.customer.customerName,
        customerPhone: orderContext.customer.customerPhone,
        notes: orderContext.orderNotes,
      });

      if (!createResponse.success || !createResponse.data?.order) {
        throw new Error(createResponse.error?.message || "Failed to create order. Please try again.");
      }

      orderId = createResponse.data.order.id;
      orderNumber = createResponse.data.order.orderNumber || createResponse.data.order.id;
      createdOrder = createResponse.data.order;
      orderContext.setCurrentOrderId(orderId);
      setDraftOrderId(orderNumber);
    }

    const order = await syncOrderItems(orderId, createdOrder);
    const resolvedOrderNumber = order.orderNumber || orderNumber || orderId;
    setDraftOrderId(resolvedOrderNumber);

    return { orderId, order, orderNumber: resolvedOrderNumber };
  };

  const placeOrderIntoKDS = async () => {
    const { orderId, order, orderNumber } = await ensureOrderPersisted();

    if (order.status === "Draft" || order.status === "OnHold") {
      const placeResponse = await updateOrderStatus(orderId, {
        status: "Placed",
        reason: "Order placed from POS and sent to kitchen",
      });

      if (!placeResponse.success) {
        throw new Error(placeResponse.error?.message || "Failed to place order.");
      }

      const kotResponse = await generateKOT(orderId, { kitchenId: "default" });
      if (!kotResponse.success) {
        throw new Error(kotResponse.error?.message || "Failed to send order to kitchen.");
      }

      showSuccessToast(`Order #${orderNumber} sent to KDS`);
    }

    return { orderId, orderNumber };
  };

  const handleSaveOrderDraft = async () => {
    try {
      setSaving(true);
      setSaveError("");

      const { orderId, orderNumber } = await ensureOrderPersisted();
      orderContext.setCurrentOrderId(orderId);
      setDraftOrderId(orderNumber);
      CRUDToasts.orderCreated(orderNumber);
      setShowSaveAlert(true);
    } catch (error: any) {
      console.error("Failed to save order draft:", error);
      setSaveError(error.message || "Failed to save order draft. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartCheckout = async (mode: "checkout" | "quick") => {
    try {
      setPlacingOrder(true);
      setSaveError("");
      setActiveFooter(mode);

      await placeOrderIntoKDS();

      if (mode === "checkout") {
        setOpenPayment(true);
      } else {
        setQuickSettleOpen(true);
      }
    } catch (error: any) {
      console.error("Failed to prepare order for payment:", error);
      setSaveError(error.message || "Failed to prepare order for payment.");
      setActiveFooter(null);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleHoldOrder = async () => {
    try {
      setHolding(true);
      setHoldError("");

      if (!orderContext.currentOrderId) {
        await handleSaveOrderDraft();
        if (!orderContext.currentOrderId) {
          setHoldError("Cannot hold order. Please save the order first.");
          return;
        }
      }

      const response = await holdOrder(orderContext.currentOrderId);
      if (response.success && response.data?.order) {
        const heldOrder = response.data.order;
        setHoldTicketId(heldOrder.orderNumber || heldOrder.id);
        CRUDToasts.orderHeld(heldOrder.orderNumber);
        setHoldSuccess(true);
        orderContext.resetOrder();
        resetVisualState();
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

  const handleCancelOrder = async (reason: string, remarks?: string): Promise<boolean> => {
    try {
      setCancelling(true);
      setCancelError("");

      if (!orderContext.currentOrderId) {
        setCancelError("Cannot cancel order. No order exists to cancel.");
        return false;
      }

      const response = await cancelOrder(orderContext.currentOrderId, reason, remarks);

      if (response.success && response.data?.order) {
        CRUDToasts.orderCancelled(response.data.order.orderNumber);
        orderContext.resetOrder();
        resetVisualState();
        setSaveError("");
        setHoldError("");
        setDraftOrderId("");
        return true;
      }

      setCancelError(response.error?.message || "Failed to cancel order. Please try again.");
      return false;
    } catch (error: any) {
      console.error("Failed to cancel order:", error);
      setCancelError(error.message || "Failed to cancel order. Please try again.");
      return false;
    } finally {
      setCancelling(false);
    }
  };

  const handlePaymentSuccess = () => {
    setOrderType("dinein");
    setActiveFooter(null);
    setOpenPayment(false);
    setShowSaveAlert(false);
    setQuickSettleOpen(false);
    setHoldSuccess(false);
    setHoldTicketId("");
    setPaymentSuccess(true);
  };

  const paymentOrder = orderContext.currentOrderId
    ? {
        id: orderContext.currentOrderId,
        orderNumber: draftOrderId,
        branchId: getBranchId(),
        type: ORDER_TYPE_MAP[orderType],
        status: "Placed" as const,
        paymentStatus: "Unpaid" as const,
        staffId: user?.id || "",
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
      }
    : null;

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
        <div className="p-3 sm:p-4 space-y-3">
          <OrderTypeTabs value={orderType} onChange={setOrderType} />
          <OrderActions
            onResetOrder={handleResetOrder}
            onHoldOrder={handleHoldOrder}
            onCancelOrder={handleCancelOrder}
            onSaveNotes={(note) => orderContext.setOrderNotes(note)}
            currentNotes={orderContext.orderNotes}
            canCancel={!!orderContext.currentOrderId}
          />
        </div>

        <div className="overflow-y-auto px-3 sm:px-4">
          <div className="mt-4 sm:mt-6 space-y-3">
            {orderType === "dinein" && <DineInOrderPanel />}
            {orderType === "takeaway" && <TakeAwayOrderPanel />}
            {orderType === "catering" && <CateringOrderPanel />}
            {orderType === "subscription" && <SubscriptionOrderPanel />}
          </div>
        </div>

        <div className="bg-white border-t px-3 py-2 sm:p-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setRetrieveHoldOpen(true)}
              disabled={holding || placingOrder}
              className="h-10 sm:h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm transition bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Archive size={16} />
              Held Orders
            </button>

            <button
              onClick={() => setLoadDraftOpen(true)}
              disabled={saving || placingOrder}
              className="h-10 sm:h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm transition bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <FileText size={16} />
              Draft Orders
            </button>

            <button
              data-shortcut="save-draft"
              onClick={() => {
                setActiveFooter("save");
                handleSaveOrderDraft();
              }}
              disabled={saving || placingOrder}
              title={`Save Order (${typeof navigator !== "undefined" && /Mac/.test(navigator.platform) ? "Cmd" : "Ctrl"}+S)`}
              className={`h-10 sm:h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm transition ${
                activeFooter === "save" ? "bg-bb-primary border-[#FFC533]" : "bg-white hover:bg-gray-50"
              } ${(saving || placingOrder) ? "opacity-50 cursor-not-allowed" : ""}`}
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

            <button
              onClick={() => handleStartCheckout("quick")}
              disabled={placingOrder || saving}
              className={`h-10 sm:h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm transition ${
                activeFooter === "quick" ? "bg-bb-primary border-[#FFC533]" : "bg-white hover:bg-gray-50"
              } ${(placingOrder || saving) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <CreditCard size={18} />
              {placingOrder && activeFooter === "quick" ? "Placing..." : "Quick Settle"}
            </button>

            <button
              onClick={() => handleStartCheckout("checkout")}
              disabled={placingOrder || saving}
              className={`col-span-2 h-10 sm:h-12 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition ${
                activeFooter === "checkout" ? "bg-bb-primary" : "bg-white hover:bg-gray-50"
              } ${(placingOrder || saving) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <ShoppingBag size={18} />
              {placingOrder && activeFooter === "checkout" ? "Placing Order..." : "Checkout"}
            </button>
          </div>
        </div>
      </div>

      <PaymentModal open={openPayment} onClose={() => setOpenPayment(false)} order={paymentOrder} onPaymentSuccess={handlePaymentSuccess} />

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

      <QuickSettleModal
        open={quickSettleOpen}
        orderId={orderContext.currentOrderId}
        amount={orderContext.summary.total}
        onClose={() => setQuickSettleOpen(false)}
        onPaymentSuccess={() => {
          setQuickSettleOpen(false);
          handlePaymentSuccess();
        }}
      />

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

      <ActionAlertModal
        open={holdSuccess}
        image={holdImg}
        title="Order On Hold"
        description={`Order has been placed on hold. Order No.: #${holdTicketId}`}
        cancelText="Close"
        onClose={() => {
          setHoldSuccess(false);
          setHoldTicketId("");
        }}
      />

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

      <RetrieveHoldOrderModal
        open={retrieveHoldOpen}
        onClose={() => setRetrieveHoldOpen(false)}
        onRetrieve={(order) => {
          orderContext.clearCart();
          orderContext.setCurrentOrderId(order.id);
          setDraftOrderId(order.orderNumber || order.id);

          const orderTypeMap: Partial<Record<string, OrderType>> = {
            DineIn: "dinein",
            TakeAway: "takeaway",
            Delivery: "catering",
            Catering: "catering",
            Subscription: "subscription",
          };
          setOrderType(orderTypeMap[order.type] || "dinein");

          if (order.customerName || order.customerPhone || order.customerId) {
            orderContext.setCustomer({
              customerId: order.customerId,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
            });
          }

          if (order.tableId) {
            orderContext.setTable({
              tableId: order.tableId,
            });
          }

          if (order.notes) {
            orderContext.setOrderNotes(order.notes);
          }

          if (order.items?.length) {
            order.items.forEach((item) => {
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
                addons: item.addons?.map((addon) => ({
                  addonId: addon.addonId,
                  addonName: addon.addonName,
                  price: addon.price,
                  quantity: addon.quantity,
                })),
              });
            });
          }

          orderContext.updateSummary({
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            taxAmount: order.taxAmount,
            total: order.total,
          });

          setRetrieveHoldOpen(false);
        }}
      />

      <LoadDraftOrderModal
        open={loadDraftOpen}
        onClose={() => setLoadDraftOpen(false)}
        onLoad={(order) => {
          orderContext.clearCart();

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
                addons: item.addons?.map((addon) => ({
                  addonId: addon.addonId,
                  addonName: addon.addonName,
                  price: addon.price,
                  quantity: addon.quantity,
                })),
              };
              orderContext.addCartItem(cartItem);
            }
          }

          orderContext.setCurrentOrderId(order.id);
          setDraftOrderId(order.orderNumber || order.id);

          if (order.customerId || order.customerName) {
            orderContext.setCustomer({
              customerId: order.customerId,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
            });
          }

          if (order.tableId) {
            orderContext.setTable({ tableId: order.tableId });
          }

          setLoadDraftOpen(false);
          showSuccessToast("Draft order loaded");
        }}
      />
    </>
  );
};

export default OrderPanelFlow;
