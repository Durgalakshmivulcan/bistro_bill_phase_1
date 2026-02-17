import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';

/**
 * GET /api/v1/reservations
 * List reservations with optional filters: branchId, date, status
 * Returns paginated results with customer and table relations
 */
export async function listReservations(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
      };
      res.status(403).json(response);
      return;
    }

    const { branchId, date, status, page, limit, search } = req.query;

    const currentPage = page && typeof page === 'string' ? parseInt(page, 10) : 1;
    const pageSize = limit && typeof limit === 'string' ? parseInt(limit, 10) : 20;
    const skip = (currentPage - 1) * pageSize;

    const where: any = {};

    // Branch scope filtering
    if (branchId && typeof branchId === 'string') {
      where.branchId = branchId;
    } else if (req.branchScope) {
      where.branchId = { in: req.branchScope };
    }

    // Date filter
    if (date && typeof date === 'string') {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: d, lt: nextDay };
    }

    // Status filter
    if (status && typeof status === 'string') {
      where.status = status;
    }

    // Search by customer name or phone
    if (search && typeof search === 'string') {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
      ];
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          table: { select: { id: true, label: true, chairs: true, floor: { select: { id: true, name: true, type: true } } } },
          room: { select: { id: true, name: true, capacity: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
        skip,
        take: pageSize,
      }),
      prisma.reservation.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        reservations,
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      message: 'Reservations retrieved successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error listing reservations:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list reservations' },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/reservations/:id
 * Get single reservation by ID with customer, table, and room relations
 */
export async function getReservation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        table: { select: { id: true, label: true, chairs: true, floor: { select: { id: true, name: true, type: true } } } },
        room: { select: { id: true, name: true, capacity: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (!reservation) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reservation not found' },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: reservation,
      message: 'Reservation retrieved successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting reservation:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get reservation' },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/reservations
 * Create a new reservation
 * Required: branchId, customerName, customerPhone, date, startTime, endTime, guestCount
 */
export async function createReservation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
      };
      res.status(403).json(response);
      return;
    }

    const { branchId, customerName, customerPhone, date, startTime, endTime, guestCount, tableId, roomId, customerId, notes } = req.body;

    // Validate required fields
    if (!branchId || !customerName || !customerPhone || !date || !startTime || !endTime) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'branchId, customerName, customerPhone, date, startTime, and endTime are required' },
      };
      res.status(400).json(response);
      return;
    }

    const reservation = await prisma.reservation.create({
      data: {
        branchId,
        customerName,
        customerPhone,
        date: new Date(date),
        startTime,
        endTime,
        guestCount: guestCount ? parseInt(guestCount, 10) : 1,
        tableId: tableId || null,
        roomId: roomId || null,
        customerId: customerId || null,
        notes: notes || null,
        status: 'Pending',
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        table: { select: { id: true, label: true, chairs: true } },
        room: { select: { id: true, name: true, capacity: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: reservation,
      message: 'Reservation created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating reservation:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create reservation' },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/reservations/:id
 * Update an existing reservation
 */
export async function updateReservation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reservation not found' },
      };
      res.status(404).json(response);
      return;
    }

    const { customerName, customerPhone, date, startTime, endTime, guestCount, tableId, roomId, customerId, notes } = req.body;

    const data: any = {};
    if (customerName !== undefined) data.customerName = customerName;
    if (customerPhone !== undefined) data.customerPhone = customerPhone;
    if (date !== undefined) data.date = new Date(date);
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (guestCount !== undefined) data.guestCount = parseInt(guestCount, 10);
    if (tableId !== undefined) data.tableId = tableId || null;
    if (roomId !== undefined) data.roomId = roomId || null;
    if (customerId !== undefined) data.customerId = customerId || null;
    if (notes !== undefined) data.notes = notes;

    const reservation = await prisma.reservation.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        table: { select: { id: true, label: true, chairs: true } },
        room: { select: { id: true, name: true, capacity: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: reservation,
      message: 'Reservation updated successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating reservation:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update reservation' },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/reservations/:id
 * Delete a reservation
 */
export async function deleteReservation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reservation not found' },
      };
      res.status(404).json(response);
      return;
    }

    await prisma.reservation.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      message: 'Reservation deleted successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting reservation:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete reservation' },
    };
    res.status(500).json(response);
  }
}

/**
 * PATCH /api/v1/reservations/:id/status
 * Update reservation status
 * Valid statuses: Pending, Confirmed, Cancelled, Completed
 */
export async function updateReservationStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
    if (!status || !validStatuses.includes(status)) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Status must be one of: ${validStatuses.join(', ')}` },
      };
      res.status(400).json(response);
      return;
    }

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reservation not found' },
      };
      res.status(404).json(response);
      return;
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        table: { select: { id: true, label: true, chairs: true } },
        room: { select: { id: true, name: true, capacity: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: reservation,
      message: `Reservation status updated to ${status}`,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating reservation status:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update reservation status' },
    };
    res.status(500).json(response);
  }
}
