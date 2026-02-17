import Swal from "sweetalert2";

/**
 * Toast Notification Utility
 *
 * Provides consistent toast notifications across the application using SweetAlert2.
 * All toasts are positioned in the top-right corner and auto-dismiss after 3 seconds.
 */

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

/**
 * Show success toast notification
 * @param message - Success message to display
 */
export const showSuccessToast = (message: string) => {
  Toast.fire({
    icon: "success",
    title: message,
  });
};

/**
 * Show error toast notification
 * @param message - Error message to display
 */
export const showErrorToast = (message: string) => {
  Toast.fire({
    icon: "error",
    title: message,
  });
};

/**
 * Show info toast notification
 * @param message - Info message to display
 */
export const showInfoToast = (message: string) => {
  Toast.fire({
    icon: "info",
    title: message,
  });
};

/**
 * Show warning toast notification
 * @param message - Warning message to display
 */
export const showWarningToast = (message: string) => {
  Toast.fire({
    icon: "warning",
    title: message,
  });
};

/**
 * CRUD Operation Success Messages
 * Provides consistent success messages for common CRUD operations
 */
export const CRUDToasts = {
  // Create operations
  created: (entityName: string) => showSuccessToast(`${entityName} created successfully`),

  // Update operations
  updated: (entityName: string) => showSuccessToast(`${entityName} updated successfully`),

  // Delete operations
  deleted: (entityName: string) => showSuccessToast(`${entityName} deleted successfully`),

  // Save operations
  saved: (entityName: string) => showSuccessToast(`${entityName} saved successfully`),

  // Payment operations
  paymentProcessed: () => showSuccessToast("Payment processed successfully"),

  // Order operations
  orderCreated: (orderNumber?: string) =>
    showSuccessToast(orderNumber ? `Order ${orderNumber} created successfully` : "Order created successfully"),
  orderHeld: (orderNumber?: string) =>
    showSuccessToast(orderNumber ? `Order ${orderNumber} saved as draft` : "Order saved as draft"),
  orderCancelled: (orderNumber?: string) =>
    showSuccessToast(orderNumber ? `Order ${orderNumber} cancelled` : "Order cancelled"),

  // Login
  welcome: (name: string) => showSuccessToast(`Welcome back, ${name}!`),
};

/**
 * Loading toast that can be updated
 * Useful for optimistic UI updates where you show immediate feedback and then update the status
 */
export const showLoadingToast = (message: string) => {
  return Swal.fire({
    title: message,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};
