import { Router } from 'express';
import { listInventoryProducts, createInventoryProduct, updateInventoryProduct, adjustInventoryStock, deleteInventoryProduct, getLowStockAlerts, importInventoryProducts, getStockAdjustmentHistory, undoStockAdjustment } from '../controllers/inventory.controller';
import { listSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, listSupplierContacts, createSupplierContact, updateSupplierContact, deleteSupplierContact } from '../controllers/supplier.controller';
import { getSupplierPerformance, updateSupplierRating } from '../controllers/supplierPerformance.controller';
import { listPurchaseOrders, getPurchaseOrderDetail, createPurchaseOrder, addPurchaseOrderItem, updatePurchaseOrderItem, deletePurchaseOrderItem, updatePurchaseOrderStatus, deletePurchaseOrder, importPurchaseOrders, resendPurchaseOrderEmail, downloadPurchaseOrderPdf } from '../controllers/purchaseOrder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireAnyPermission, requirePermission } from '../middleware/rbac.middleware';
import { branchScopeMiddleware } from '../middleware/branchScope.middleware';
import { csvUpload } from '../middleware/upload.middleware';

const router = Router();

/**
 * All routes in this file require authentication and tenant context
 * Tenant context is set by tenantMiddleware (for BusinessOwner/Staff)
 * SuperAdmin users bypass tenant context but still require authentication
 */

// ============================================
// Inventory Alert Routes (place before parameterized routes)
// ============================================

/**
 * GET /api/v1/inventory/low-stock
 * Returns all items that need restocking (inStock <= restockAlert)
 * Grouped by branch for easy management
 * Includes supplier info for easy reordering
 */
router.get('/low-stock', authenticate, tenantMiddleware, branchScopeMiddleware, requirePermission('inventory', 'read'), getLowStockAlerts);

// ============================================
// Supplier Routes
// ============================================

/**
 * GET /api/v1/inventory/suppliers
 * List all suppliers for the authenticated tenant
 * Includes purchase order count and total amount spent
 * Supports filtering by status
 */
router.get('/suppliers', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'read'), listSuppliers);

/**
 * POST /api/v1/inventory/suppliers
 * Create a new supplier for the authenticated tenant
 * Required: name, phone
 * Optional: code, email, address, status
 * Generates unique code if not provided (format: SUP-XXXXX)
 */
router.post('/suppliers', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'create'), createSupplier);

/**
 * GET /api/v1/inventory/suppliers/performance
 * Returns supplier performance metrics aggregated from PurchaseOrder data
 * Supports pagination, search, minRating filter, and sorting
 */
router.get('/suppliers/performance', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'read'), getSupplierPerformance);

/**
 * GET /api/v1/inventory/suppliers/:id
 * Get a single supplier by ID for the authenticated tenant
 */
router.get('/suppliers/:id', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'read'), getSupplierById);

/**
 * PUT /api/v1/inventory/suppliers/:id
 * Update an existing supplier for the authenticated tenant
 * All fields optional
 */
router.put('/suppliers/:id', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'update'), updateSupplier);

/**
 * DELETE /api/v1/inventory/suppliers/:id
 * Delete a supplier for the authenticated tenant
 * Prevents deletion if supplier has pending purchase orders
 */
router.delete('/suppliers/:id', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'delete'), deleteSupplier);

/**
 * PATCH /api/v1/inventory/suppliers/:supplierId/rating
 * Upsert a SupplierRating record for the supplier + businessOwner combination
 * Accepts { rating, comment } or { rating, performanceNotes }
 */
router.patch('/suppliers/:supplierId/rating', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'update'), updateSupplierRating);

// ============================================
// Supplier Contact Routes
// ============================================

/**
 * GET /api/v1/inventory/suppliers/:supplierId/contacts
 * List all contacts for a supplier
 */
router.get('/suppliers/:supplierId/contacts', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'read'), listSupplierContacts);

/**
 * POST /api/v1/inventory/suppliers/:supplierId/contacts
 * Create a new contact for a supplier
 * Required: name
 * Optional: email, phone
 */
router.post('/suppliers/:supplierId/contacts', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'create'), createSupplierContact);

/**
 * PUT /api/v1/inventory/suppliers/:supplierId/contacts/:id
 * Update a supplier contact
 * All fields optional
 */
router.put('/suppliers/:supplierId/contacts/:id', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'update'), updateSupplierContact);

/**
 * DELETE /api/v1/inventory/suppliers/:supplierId/contacts/:id
 * Delete a supplier contact
 */
router.delete('/suppliers/:supplierId/contacts/:id', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'delete'), deleteSupplierContact);

// ============================================
// Purchase Order Routes
// ============================================

/**
 * GET /api/v1/inventory/purchase-orders
 * List all purchase orders for the authenticated tenant
 * Supports filters: branchId, supplierId, status
 * Includes: supplier name, item count, grand total
 */
router.get('/purchase-orders', authenticate, tenantMiddleware, branchScopeMiddleware, requirePermission('purchase_orders', 'read'), listPurchaseOrders);

/**
 * POST /api/v1/inventory/purchase-orders/import
 * Import purchase orders from CSV file
 * CSV Format: Supplier, Branch, Item Name, Quantity, Unit Price, Notes, Invoice Number
 * Required columns: Supplier, Branch, Item Name, Quantity, Unit Price
 * Groups rows by Invoice Number (or Supplier+Branch) to create POs with items
 */
router.post('/purchase-orders/import', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'create'), csvUpload.single('file'), importPurchaseOrders);

/**
 * POST /api/v1/inventory/purchase-orders
 * Create a new purchase order
 * Required: branchId, supplierId
 * Optional: notes
 * Generates unique invoice number (format: PO-YYYYMMDD-XXXX)
 * Default status: 'Pending'
 */
router.post('/purchase-orders', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'create'), createPurchaseOrder);

/**
 * GET /api/v1/inventory/purchase-orders/:id
 * Get full details of a specific purchase order
 * Includes all items with inventory product details and supplier info
 */
router.get('/purchase-orders/:id', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'read'), getPurchaseOrderDetail);

/**
 * DELETE /api/v1/inventory/purchase-orders/:id
 * Delete a purchase order
 * Only allows deletion of 'Pending' status POs
 * Deletes all associated items
 */
router.delete('/purchase-orders/:id', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'delete'), deletePurchaseOrder);

/**
 * PATCH /api/v1/inventory/purchase-orders/:id/status
 * Update purchase order status
 * Accept: status ('Approved', 'Declined', 'Received')
 * When 'Received': update inventory stock for all items
 * Log status change to AuditLog
 */
router.patch('/purchase-orders/:id/status', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'approve'), updatePurchaseOrderStatus);

/**
 * POST /api/v1/inventory/purchase-orders/:id/resend-email
 * Resend purchase order email to supplier
 * Fetches PO details and supplier email, logs to audit trail
 */
router.post('/purchase-orders/:id/resend-email', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'update'), resendPurchaseOrderEmail);

/**
 * GET /api/v1/inventory/purchase-orders/:id/download
 * Download purchase order as PDF
 * Returns PDF file with PO details, items, supplier info, and branch info
 */
router.get('/purchase-orders/:id/download', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'read'), downloadPurchaseOrderPdf);

/**
 * POST /api/v1/inventory/purchase-orders/:id/items
 * Add an item to a purchase order
 * Required: inventoryProductId, quantity, unitPrice
 * Calculate totalPrice = quantity * unitPrice
 * Recalculates PO grandTotal after adding
 * Only allowed when PO status is 'Pending'
 */
router.post(
  '/purchase-orders/:id/items',
  authenticate,
  tenantMiddleware,
  // Allow adding items during both create and edit flows
  requireAnyPermission([
    ['purchase_orders', 'create'],
    ['purchase_orders', 'update'],
  ]),
  addPurchaseOrderItem
);

/**
 * PUT /api/v1/inventory/purchase-orders/:id/items/:itemId
 * Update an item in a purchase order
 * Optional: quantity, unitPrice
 * Recalculates totalPrice and PO grandTotal after update
 * Only allowed when PO status is 'Pending'
 */
router.put('/purchase-orders/:id/items/:itemId', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'update'), updatePurchaseOrderItem);

/**
 * DELETE /api/v1/inventory/purchase-orders/:id/items/:itemId
 * Remove an item from a purchase order
 * Recalculates PO grandTotal after deletion
 * Only allowed when PO status is 'Pending'
 */
router.delete('/purchase-orders/:id/items/:itemId', authenticate, tenantMiddleware, requirePermission('purchase_orders', 'delete'), deletePurchaseOrderItem);

// ============================================
// Inventory Product Routes
// ============================================

/**
 * GET /api/v1/inventory/products
 * List all inventory products for the authenticated tenant
 * Supports filters: branchId, supplierId, status, lowStock (boolean)
 * Supports pagination: page, limit
 * Supports search by name
 */
router.get('/products', authenticate, tenantMiddleware, branchScopeMiddleware, requirePermission('inventory', 'read'), listInventoryProducts);

/**
 * POST /api/v1/inventory/products/import
 * Import inventory products from CSV file
 * CSV Format: Name, Branch, Supplier, Unit, In Stock, Restock Alert, Cost Price, Selling Price, Expiry Date, Status
 * Required columns: Name, Branch, Unit
 * Auto-creates branches and suppliers if they don't exist
 */
router.post('/products/import', authenticate, tenantMiddleware, requirePermission('inventory', 'create'), csvUpload.single('file'), importInventoryProducts);

/**
 * POST /api/v1/inventory/products
 * Create a new inventory product
 * Required: name, branchId, unit
 * Optional: image, supplierId, inStock, restockAlert, costPrice, sellingPrice, expiryDate
 */
router.post('/products', authenticate, tenantMiddleware, requirePermission('inventory', 'create'), createInventoryProduct);

/**
 * PUT /api/v1/inventory/products/:id
 * Update an existing inventory product
 * All fields optional
 */
router.put('/products/:id', authenticate, tenantMiddleware, requirePermission('inventory', 'update'), updateInventoryProduct);

/**
 * PATCH /api/v1/inventory/products/:id/stock
 * Manually adjust stock levels for an inventory product
 * Required: adjustment (positive/negative number)
 * Optional: reason (string explaining the adjustment)
 * Logs adjustment to AuditLog with old/new values
 */
router.patch('/products/:id/stock', authenticate, tenantMiddleware, requirePermission('inventory', 'update'), adjustInventoryStock);

/**
 * GET /api/v1/inventory/products/:id/adjustments
 * Get stock adjustment history for an inventory product
 * Returns last 10 adjustments, most recent first
 */
router.get('/products/:id/adjustments', authenticate, tenantMiddleware, requirePermission('inventory', 'read'), getStockAdjustmentHistory);

/**
 * POST /api/v1/inventory/adjustments/:adjustmentId/undo
 * Undo a specific stock adjustment
 * Reverses the adjustment and marks it as undone
 * Logs the undo action in audit trail
 */
router.post('/adjustments/:adjustmentId/undo', authenticate, tenantMiddleware, requirePermission('inventory', 'create'), undoStockAdjustment);

/**
 * DELETE /api/v1/inventory/products/:id
 * Delete an inventory product
 * Deletes associated image from S3
 * Prevents deletion if item is in pending PO
 */
router.delete('/products/:id', authenticate, tenantMiddleware, requirePermission('inventory', 'delete'), deleteInventoryProduct);

export default router;
