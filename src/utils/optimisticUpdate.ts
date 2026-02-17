import { showSuccessToast, showErrorToast } from "./toast";

/**
 * Optimistic Update Utility
 *
 * Provides utilities for implementing optimistic UI updates with automatic rollback on failure.
 * This creates a responsive user experience by immediately showing changes before the API call completes.
 */

/**
 * Options for optimistic update behavior
 */
interface OptimisticUpdateOptions<T> {
  /** The async operation to perform (API call) */
  operation: () => Promise<T>;

  /** Function to apply the optimistic update to local state */
  onOptimisticUpdate: () => void;

  /** Function to rollback the optimistic update if the operation fails */
  onRollback: () => void;

  /** Success message to show as toast */
  successMessage?: string;

  /** Error message to show as toast (if not provided, uses error from API) */
  errorMessage?: string;

  /** Optional callback on success */
  onSuccess?: (result: T) => void;

  /** Optional callback on error */
  onError?: (error: any) => void;
}

/**
 * Execute an operation with optimistic UI update
 *
 * This function:
 * 1. Immediately applies the optimistic update to local state
 * 2. Executes the async operation
 * 3. On success: shows success toast and calls onSuccess callback
 * 4. On failure: rolls back the optimistic update, shows error toast, and calls onError callback
 *
 * @example
 * await withOptimisticUpdate({
 *   operation: () => createProduct(newProduct),
 *   onOptimisticUpdate: () => setProducts([...products, newProductWithTempId]),
 *   onRollback: () => setProducts(products),
 *   successMessage: "Product created successfully",
 *   onSuccess: (createdProduct) => setProducts([...products, createdProduct]),
 * });
 */
export async function withOptimisticUpdate<T>({
  operation,
  onOptimisticUpdate,
  onRollback,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: OptimisticUpdateOptions<T>): Promise<void> {
  try {
    // Step 1: Apply optimistic update immediately
    onOptimisticUpdate();

    // Step 2: Execute the async operation
    const result = await operation();

    // Step 3: On success, show success message and call success callback
    if (successMessage) {
      showSuccessToast(successMessage);
    }

    if (onSuccess) {
      onSuccess(result);
    }
  } catch (error: any) {
    // Step 4: On failure, rollback the optimistic update
    onRollback();

    // Show error message
    const message = errorMessage || error.message || "Operation failed";
    showErrorToast(message);

    // Call error callback if provided
    if (onError) {
      onError(error);
    }

    throw error; // Re-throw so caller can handle if needed
  }
}

/**
 * Helper to generate a temporary ID for optimistic updates
 * Uses a prefix to identify temporary items
 */
export function generateTempId(prefix: string = "temp"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an ID is a temporary ID
 */
export function isTempId(id: string, prefix: string = "temp"): boolean {
  return id.startsWith(`${prefix}-`);
}

/**
 * Animation class names for optimistic updates
 * Add these to elements that are optimistically added
 */
export const optimisticAnimationClasses = {
  /** Fade in animation for new items */
  fadeIn: "animate-fade-in",

  /** Slide in from right for new items */
  slideInRight: "animate-slide-in-right",

  /** Pulse animation to highlight updated items */
  pulse: "animate-pulse-once",

  /** Fade out animation for deleted items */
  fadeOut: "animate-fade-out",
};

/**
 * Optimistic list operations helper
 * Provides common patterns for list CRUD operations
 */
export const optimisticListOperations = {
  /**
   * Add item to list optimistically
   */
  add: <T extends { id: string }>(list: T[], newItem: T): T[] => {
    return [...list, newItem];
  },

  /**
   * Update item in list optimistically
   */
  update: <T extends { id: string }>(list: T[], id: string, updatedItem: T): T[] => {
    return list.map((item) => (item.id === id ? updatedItem : item));
  },

  /**
   * Remove item from list optimistically
   */
  remove: <T extends { id: string }>(list: T[], id: string): T[] => {
    return list.filter((item) => item.id !== id);
  },

  /**
   * Replace item with real data after API response
   * Useful when temp item was added and we need to replace with real ID
   */
  replace: <T extends { id: string }>(list: T[], tempId: string, realItem: T): T[] => {
    return list.map((item) => (item.id === tempId ? realItem : item));
  },
};
