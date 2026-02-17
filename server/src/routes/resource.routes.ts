import { Router } from 'express';
import {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchBusinessHours,
  updateBranchBusinessHours,
} from '../controllers/branch.controller';
import {
  listKitchens,
  createKitchen,
  updateKitchen,
  deleteKitchen,
} from '../controllers/kitchen.controller';
import {
  listFloors,
  createFloor,
  updateFloor,
  deleteFloor,
} from '../controllers/floor.controller';
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
} from '../controllers/table.controller';
import {
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/room.controller';
import {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/role.controller';
import {
  listStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
} from '../controllers/staff.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { branchScopeMiddleware } from '../middleware/branchScope.middleware';

const router = Router();

/**
 * All routes in this file require authentication and tenant context
 * Tenant context is set by tenantMiddleware (for BusinessOwner/Staff)
 * SuperAdmin users bypass tenant context but still require authentication
 */

// ============================================
// Branch Routes
// ============================================

/**
 * GET /api/v1/resources/branches
 * List all branches for the authenticated tenant
 * Returns branches with staff count, table count, and kitchen count
 * Supports filtering by status
 */
router.get('/branches', authenticate, tenantMiddleware, requirePermission('resources', 'read'), listBranches);

/**
 * POST /api/v1/resources/branches
 * Create a new branch for the authenticated tenant
 * Checks subscription plan maxBranches limit
 * Required: name, address
 * Returns 403 if branch limit reached
 */
router.post('/branches', authenticate, tenantMiddleware, requirePermission('resources', 'create'), createBranch);

/**
 * PUT /api/v1/resources/branches/:id
 * Update branch details
 * All fields optional except id
 * Cannot change isMainBranch flag
 * Returns updated branch
 */
router.put('/branches/:id', authenticate, tenantMiddleware, requirePermission('resources', 'update'), updateBranch);

/**
 * DELETE /api/v1/resources/branches/:id
 * Delete a branch
 * Cannot delete main branch (isMainBranch = true)
 * Cascade deletes: kitchens, floors, tables, rooms, staff assignments
 */
router.delete('/branches/:id', authenticate, tenantMiddleware, requirePermission('resources', 'delete'), deleteBranch);

// ============================================
// Branch Business Hours Routes
// ============================================

/**
 * GET /api/v1/resources/branches/:branchId/hours
 * Get business hours for a specific branch
 * Returns all 7 days with their open/close times
 */
router.get('/branches/:branchId/hours', authenticate, tenantMiddleware, requirePermission('resources', 'read'), getBranchBusinessHours);

/**
 * PUT /api/v1/resources/branches/:branchId/hours
 * Bulk update business hours for all 7 days
 * Accepts array of 7 entries with: dayOfWeek, openTime, closeTime, isClosed
 */
router.put('/branches/:branchId/hours', authenticate, tenantMiddleware, requirePermission('resources', 'update'), updateBranchBusinessHours);

// ============================================
// Kitchen Routes
// ============================================

/**
 * GET /api/v1/resources/branches/:branchId/kitchens
 * List all kitchens for a specific branch
 * Supports filtering by status (active/inactive)
 */
router.get('/branches/:branchId/kitchens', authenticate, tenantMiddleware, requirePermission('resources', 'read'), listKitchens);

/**
 * POST /api/v1/resources/kitchens
 * Create a new kitchen
 * Required: branchId, name
 * Optional: description, status
 */
router.post('/kitchens', authenticate, tenantMiddleware, requirePermission('resources', 'create'), createKitchen);

/**
 * PUT /api/v1/resources/kitchens/:id
 * Update a kitchen
 * All fields optional except id
 */
router.put('/kitchens/:id', authenticate, tenantMiddleware, requirePermission('resources', 'update'), updateKitchen);

/**
 * DELETE /api/v1/resources/kitchens/:id
 * Delete a kitchen
 * Cascade deletes associated OrderKOTs
 */
router.delete('/kitchens/:id', authenticate, tenantMiddleware, requirePermission('resources', 'delete'), deleteKitchen);

// ============================================
// Floor Routes
// ============================================

/**
 * GET /api/v1/resources/branches/:branchId/floors
 * List all floors for a specific branch
 * Supports filtering by status (active/inactive)
 */
router.get('/branches/:branchId/floors', authenticate, tenantMiddleware, requirePermission('resources', 'read'), listFloors);

/**
 * POST /api/v1/resources/floors
 * Create a new floor
 * Required: branchId, name, type
 * Optional: status
 */
router.post('/floors', authenticate, tenantMiddleware, requirePermission('resources', 'create'), createFloor);

/**
 * PUT /api/v1/resources/floors/:id
 * Update a floor
 * All fields optional except id
 */
router.put('/floors/:id', authenticate, tenantMiddleware, requirePermission('resources', 'update'), updateFloor);

/**
 * DELETE /api/v1/resources/floors/:id
 * Delete a floor
 * Cascade deletes associated tables
 */
router.delete('/floors/:id', authenticate, tenantMiddleware, requirePermission('resources', 'delete'), deleteFloor);

// ============================================
// Table Routes
// ============================================

/**
 * GET /api/v1/resources/floors/:floorId/tables
 * List all tables for a specific floor
 * Supports filtering by status (available/running/reserved/maintenance)
 */
router.get('/floors/:floorId/tables', authenticate, tenantMiddleware, requirePermission('resources', 'read'), listTables);

/**
 * POST /api/v1/resources/tables
 * Create a new table
 * Required: floorId, label, chairs
 * Optional: shape, status
 */
router.post('/tables', authenticate, tenantMiddleware, requirePermission('resources', 'create'), createTable);

/**
 * PUT /api/v1/resources/tables/:id
 * Update a table
 * All fields optional except id
 */
router.put('/tables/:id', authenticate, tenantMiddleware, requirePermission('resources', 'update'), updateTable);

/**
 * DELETE /api/v1/resources/tables/:id
 * Delete a table
 * Cascade deletes associated reservations and orders
 */
router.delete('/tables/:id', authenticate, tenantMiddleware, requirePermission('resources', 'delete'), deleteTable);

/**
 * PATCH /api/v1/resources/tables/:id/status
 * Update table status only
 * Required: status (available/running/reserved/maintenance)
 */
router.patch('/tables/:id/status', authenticate, tenantMiddleware, requirePermission('resources', 'update'), updateTableStatus);

// ============================================
// Room Routes
// ============================================

/**
 * GET /api/v1/resources/branches/:branchId/rooms
 * List all rooms for a specific branch
 * Supports filtering by status (active/inactive)
 */
router.get('/branches/:branchId/rooms', authenticate, tenantMiddleware, requirePermission('resources', 'read'), listRooms);

/**
 * POST /api/v1/resources/rooms
 * Create a new room
 * Required: branchId, name, capacity
 * Optional: hourlyRate, status
 */
router.post('/rooms', authenticate, tenantMiddleware, requirePermission('resources', 'create'), createRoom);

/**
 * PUT /api/v1/resources/rooms/:id
 * Update a room
 * All fields optional except id
 */
router.put('/rooms/:id', authenticate, tenantMiddleware, requirePermission('resources', 'update'), updateRoom);

/**
 * DELETE /api/v1/resources/rooms/:id
 * Delete a room
 * Cascade deletes associated reservations
 */
router.delete('/rooms/:id', authenticate, tenantMiddleware, requirePermission('resources', 'delete'), deleteRoom);

// ============================================
// Role Routes
// ============================================

/**
 * GET /api/v1/resources/roles
 * List all roles for the authenticated tenant
 * Returns roles with staff count per role
 * Supports filtering by status (active/inactive)
 */
router.get('/roles', authenticate, tenantMiddleware, requirePermission('staff', 'read'), listRoles);

/**
 * GET /api/v1/resources/roles/:id
 * Get a single role by ID
 * Returns role with permissions and staff count
 */
router.get('/roles/:id', authenticate, tenantMiddleware, requirePermission('staff', 'read'), getRoleById);

/**
 * POST /api/v1/resources/roles
 * Create a new role with permissions
 * Required: name, permissions (JSON object)
 * Permissions structure: { module: { action: boolean } }
 * Example: { products: { view: true, create: true, edit: false, delete: false } }
 */
router.post('/roles', authenticate, tenantMiddleware, requirePermission('staff', 'create'), createRole);

/**
 * PUT /api/v1/resources/roles/:id
 * Update an existing role
 * All fields optional except id
 * Returns updated role
 */
router.put('/roles/:id', authenticate, tenantMiddleware, requirePermission('staff', 'update'), updateRole);

/**
 * DELETE /api/v1/resources/roles/:id
 * Delete a role
 * Prevents deletion if role has assigned staff
 * Returns 400 if role has assigned staff
 */
router.delete('/roles/:id', authenticate, tenantMiddleware, requirePermission('staff', 'delete'), deleteRole);

// ============================================
// Staff Routes
// ============================================

/**
 * GET /api/v1/resources/staff
 * List all staff members for the authenticated tenant
 * Returns paginated staff with branch name and role name
 * Supports filtering by branchId, roleId, status
 * Supports pagination with page and limit query params
 */
router.get('/staff', authenticate, tenantMiddleware, branchScopeMiddleware, requirePermission('staff', 'read'), listStaff);

/**
 * GET /api/v1/resources/staff/:id
 * Get a single staff member by ID
 * Returns staff with branch and role details
 */
router.get('/staff/:id', authenticate, tenantMiddleware, requirePermission('staff', 'read'), getStaffMember);

/**
 * POST /api/v1/resources/staff
 * Create a new staff member
 * Required: branchId, roleId, firstName, lastName, email, password
 * Hashes password before storing
 * Checks unique email within tenant
 * Returns created staff (without password)
 */
router.post('/staff', authenticate, tenantMiddleware, requirePermission('staff', 'create'), createStaff);

/**
 * PUT /api/v1/resources/staff/:id
 * Update an existing staff member
 * All fields optional except id
 * If password provided, it will be hashed
 * Returns updated staff (without password)
 */
router.put('/staff/:id', authenticate, tenantMiddleware, requirePermission('staff', 'update'), updateStaff);

/**
 * DELETE /api/v1/resources/staff/:id
 * Delete a staff member
 * Returns 404 if staff not found or doesn't belong to tenant
 */
router.delete('/staff/:id', authenticate, tenantMiddleware, requirePermission('staff', 'delete'), deleteStaff);

/**
 * PATCH /api/v1/resources/staff/:id/status
 * Update staff status only
 * Required: status in request body
 * Returns updated staff with full details
 */
router.patch('/staff/:id/status', authenticate, tenantMiddleware, requirePermission('staff', 'update'), updateStaffStatus);

export default router;
