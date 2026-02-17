import { Router } from 'express';
import {
  listCustomerGroups,
  createCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroup,
  previewRules,
  recalculateGroups
} from '../controllers/customerGroup.controller';
import {
  listCustomers,
  createCustomer,
  getCustomerDetail,
  updateCustomer,
  deleteCustomer,
  importCustomers,
  bulkAssignTags
} from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { branchScopeMiddleware } from '../middleware/branchScope.middleware';
import { csvUpload, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

// ============================================
// Customer Routes
// ============================================

/**
 * GET /api/v1/customers
 * List all customers for the authenticated tenant
 * Returns paginated customers with total spent and order count
 * Supports filtering by customerGroupId, type, search (name/phone/email)
 */
router.get('/', authenticate, tenantMiddleware, branchScopeMiddleware, requirePermission('customers', 'read'), listCustomers);

/**
 * POST /api/v1/customers/bulk-tags
 * Assign tags to multiple customers at once
 * Required: customerIds (string[]), tagIds (string[])
 */
router.post('/bulk-tags', authenticate, tenantMiddleware, requirePermission('customers', 'update'), bulkAssignTags);

/**
 * POST /api/v1/customers/import
 * Import customers from CSV file
 * Expected CSV format: firstName, lastName, phone, email, type, customerGroupId
 * Supports duplicateAction query param: 'skip' (default) or 'update'
 */
router.post('/import', authenticate, tenantMiddleware, requirePermission('customers', 'create'), csvUpload.single('file'), handleUploadError, importCustomers);

/**
 * POST /api/v1/customers
 * Create a new customer
 * Required: name, phone
 * Checks for unique phone within tenant
 */
router.post('/', authenticate, tenantMiddleware, requirePermission('customers', 'create'), createCustomer);

/**
 * GET /api/v1/customers/:id
 * Get customer details with order history
 * Includes recent orders (last 10), total spent, visit count
 */
router.get('/:id', authenticate, tenantMiddleware, requirePermission('customers', 'read'), getCustomerDetail);

/**
 * PUT /api/v1/customers/:id
 * Update an existing customer
 * All fields optional except ID
 */
router.put('/:id', authenticate, tenantMiddleware, requirePermission('customers', 'update'), updateCustomer);

/**
 * DELETE /api/v1/customers/:id
 * Delete a customer
 * Prevents deletion if customer has orders
 */
router.delete('/:id', authenticate, tenantMiddleware, requirePermission('customers', 'delete'), deleteCustomer);

// ============================================
// Customer Group Routes
// ============================================

/**
 * GET /api/v1/customers/groups
 * List all customer groups for tenant
 * Include customer count per group
 */
router.get('/groups', authenticate, tenantMiddleware, requirePermission('customers', 'read'), listCustomerGroups);

/**
 * POST /api/v1/customers/groups/preview-rules
 * Preview which customers match a set of rules
 */
router.post('/groups/preview-rules', authenticate, tenantMiddleware, requirePermission('customers', 'read'), previewRules);

/**
 * POST /api/v1/customers/groups/recalculate
 * Re-run all auto-assignment rules for all customers
 */
router.post('/groups/recalculate', authenticate, tenantMiddleware, requirePermission('customers', 'update'), recalculateGroups);

/**
 * POST /api/v1/customers/groups
 * Create a new customer group
 * Required: name
 */
router.post('/groups', authenticate, tenantMiddleware, requirePermission('customers', 'create'), createCustomerGroup);

/**
 * PUT /api/v1/customers/groups/:id
 * Update a customer group
 * All fields optional
 */
router.put('/groups/:id', authenticate, tenantMiddleware, requirePermission('customers', 'update'), updateCustomerGroup);

/**
 * DELETE /api/v1/customers/groups/:id
 * Delete a customer group
 * Nullifies customer references before deletion
 */
router.delete('/groups/:id', authenticate, tenantMiddleware, requirePermission('customers', 'delete'), deleteCustomerGroup);

export default router;
