import { Router } from 'express';
import {
  listReservations,
  getReservation,
  createReservation,
  updateReservation,
  deleteReservation,
  updateReservationStatus,
} from '../controllers/reservation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/v1/reservations
 * @description List reservations with optional filters
 * @access Private
 * @query { branchId?, date?, status?, search?, page?, limit? }
 */
router.get('/', authenticate, listReservations);

/**
 * @route GET /api/v1/reservations/:id
 * @description Get reservation by ID
 * @access Private
 */
router.get('/:id', authenticate, getReservation);

/**
 * @route POST /api/v1/reservations
 * @description Create a new reservation
 * @access Private
 * @body { branchId, customerName, customerPhone, date, startTime, endTime, guestCount?, tableId?, roomId?, customerId?, notes? }
 */
router.post('/', authenticate, createReservation);

/**
 * @route PUT /api/v1/reservations/:id
 * @description Update a reservation
 * @access Private
 */
router.put('/:id', authenticate, updateReservation);

/**
 * @route DELETE /api/v1/reservations/:id
 * @description Delete a reservation
 * @access Private
 */
router.delete('/:id', authenticate, deleteReservation);

/**
 * @route PATCH /api/v1/reservations/:id/status
 * @description Update reservation status
 * @access Private
 * @body { status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' }
 */
router.patch('/:id/status', authenticate, updateReservationStatus);

export default router;
