import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { OrderType, OrderItem } from '../services/orderService';

/**
 * Order Context
 *
 * Manages the current order being created in the POS system
 * Tracks cart items, customer details, table assignment, and order totals
 */

// ============================================
// Type Definitions
// ============================================

export interface CartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  notes?: string;
  addons?: {
    addonId: string;
    addonName: string;
    price: number;
    quantity: number;
  }[];
}

export interface CustomerInfo {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
}

export interface TableInfo {
  tableId?: string;
  tableName?: string;
  floorId?: string;
  floorName?: string;
  guestCount?: number;
  captainId?: string;
  captainName?: string;
}

export interface OrderSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  additionalCharges: number;
  total: number;
}

interface OrderContextType {
  // Order Basic Info
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;

  // Cart Items
  cartItems: CartItem[];
  addCartItem: (item: CartItem) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  removeCartItem: (productId: string) => void;
  clearCart: () => void;

  // Customer Info
  customer: CustomerInfo;
  setCustomer: (customer: CustomerInfo) => void;

  // Table Info
  table: TableInfo;
  setTable: (table: TableInfo) => void;

  // Order Summary
  summary: OrderSummary;
  updateSummary: (summary: Partial<OrderSummary>) => void;

  // Order Notes
  orderNotes: string;
  setOrderNotes: (notes: string) => void;

  // Discount
  discountReason?: string;
  setDiscountReason: (reason?: string) => void;

  // Order State
  currentOrderId?: string;
  setCurrentOrderId: (id?: string) => void;

  // Catering Event Details
  eventName: string;
  setEventName: (name: string) => void;
  eventDate: string;
  setEventDate: (date: string) => void;

  // Subscription Plan
  subscriptionPlanId: string;
  setSubscriptionPlanId: (id: string) => void;

  // Reset entire order state
  resetOrder: () => void;
}

// ============================================
// Context Creation
// ============================================

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orderType, setOrderType] = useState<OrderType>('DineIn');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo>({});
  const [table, setTable] = useState<TableInfo>({});
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string | undefined>();
  const [currentOrderId, setCurrentOrderId] = useState<string | undefined>();
  const [eventName, setEventName] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [subscriptionPlanId, setSubscriptionPlanId] = useState<string>('');

  const [summary, setSummary] = useState<OrderSummary>({
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    additionalCharges: 0,
    total: 0,
  });

  // Recalculate summary whenever cart items change
  useEffect(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = cartItems.reduce((sum, item) => sum + item.taxAmount, 0);

    setSummary(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total: subtotal - prev.discountAmount + taxAmount + prev.additionalCharges,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  // Add item to cart
  const addCartItem = (item: CartItem) => {
    setCartItems(prev => {
      // Check if item already exists
      const existingIndex = prev.findIndex(i => i.productId === item.productId);
      if (existingIndex >= 0) {
        // Update quantity if exists
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
          totalPrice: (updated[existingIndex].quantity + item.quantity) * item.unitPrice,
        };
        return updated;
      }
      // Add new item
      return [...prev, item];
    });
  };

  // Update cart item
  const updateCartItem = (productId: string, updates: Partial<CartItem>) => {
    setCartItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              ...updates,
              totalPrice: (updates.quantity ?? item.quantity) * (updates.unitPrice ?? item.unitPrice),
            }
          : item
      )
    );
  };

  // Remove cart item
  const removeCartItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Clear all cart items
  const clearCart = () => {
    setCartItems([]);
    setSummary({
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      additionalCharges: 0,
      total: 0,
    });
  };

  // Update summary
  const updateSummary = (updates: Partial<OrderSummary>) => {
    setSummary(prev => ({
      ...prev,
      ...updates,
      total: (updates.subtotal ?? prev.subtotal)
        - (updates.discountAmount ?? prev.discountAmount)
        + (updates.taxAmount ?? prev.taxAmount)
        + (updates.additionalCharges ?? prev.additionalCharges),
    }));
  };

  // Reset entire order state
  const resetOrder = () => {
    setOrderType('DineIn');
    setCartItems([]);
    setCustomer({});
    setTable({});
    setOrderNotes('');
    setDiscountReason(undefined);
    setCurrentOrderId(undefined);
    setEventName('');
    setEventDate('');
    setSubscriptionPlanId('');
    setSummary({
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      additionalCharges: 0,
      total: 0,
    });
  };

  const value: OrderContextType = {
    orderType,
    setOrderType,
    cartItems,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    customer,
    setCustomer,
    table,
    setTable,
    summary,
    updateSummary,
    orderNotes,
    setOrderNotes,
    discountReason,
    setDiscountReason,
    currentOrderId,
    setCurrentOrderId,
    eventName,
    setEventName,
    eventDate,
    setEventDate,
    subscriptionPlanId,
    setSubscriptionPlanId,
    resetOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

// ============================================
// Custom Hook
// ============================================

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
