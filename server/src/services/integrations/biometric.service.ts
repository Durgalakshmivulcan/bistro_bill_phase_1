import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * Biometric Attendance Integration Service (US-262)
 *
 * Receives attendance data from biometric devices (fingerprint, face, card),
 * stores punch-in/punch-out records in StaffAttendance table,
 * calculates work hours per shift, and generates daily attendance reports.
 */

interface BiometricConfig {
  deviceType: 'fingerprint' | 'face' | 'card' | 'multi'; // Device type
  deviceHost: string; // IP/host of biometric device
  devicePort: number; // Port (typically 5005)
  apiKey?: string; // Device API key for push-based integration
  syncInterval?: number; // Polling interval in minutes (default 15)
  autoCalculateHours: boolean; // Whether to auto-calculate work hours on OUT punch
}

export interface AttendanceRecord {
  staffId: string;
  staffName: string;
  punchType: string;
  punchTime: string;
  deviceId?: string;
  verifyMode?: string;
}

export interface AttendanceResult {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
}

export interface AttendanceReportEntry {
  staffId: string;
  staffName: string;
  branchId: string;
  shiftDate: string;
  firstIn: string | null;
  lastOut: string | null;
  totalWorkHours: number | null;
  punchCount: number;
  status: 'present' | 'absent' | 'incomplete';
}

export interface AttendanceReportResult {
  success: boolean;
  message: string;
  report?: AttendanceReportEntry[];
  date?: string;
  totalStaff?: number;
  presentCount?: number;
  absentCount?: number;
}

/**
 * Find the biometric integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'biometric',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Log an action to IntegrationLog.
 */
async function logAction(
  integrationId: string,
  action: string,
  status: string,
  requestPayload: Record<string, unknown> | null,
  responsePayload: Record<string, unknown> | null,
  errorMessage: string | null
): Promise<void> {
  try {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        action,
        status,
        requestPayload: requestPayload
          ? JSON.parse(JSON.stringify(requestPayload))
          : Prisma.JsonNull,
        responsePayload: responsePayload
          ? JSON.parse(JSON.stringify(responsePayload))
          : Prisma.JsonNull,
        errorMessage,
      },
    });
  } catch {
    console.error('[Biometric] Failed to write IntegrationLog');
  }
}

/**
 * Normalize a date to midnight (start of day) for shift grouping.
 */
function normalizeToShiftDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Record attendance data from a biometric device.
 *
 * Receives punch data (IN/OUT) from the biometric device API/webhook,
 * matches the employee to a staff member, and stores the attendance record.
 * On OUT punch, calculates total work hours for the shift if auto-calculate is enabled.
 */
export async function recordAttendance(
  staffId: string,
  punchType: 'IN' | 'OUT',
  punchTime: Date,
  businessOwnerId: string,
  deviceId?: string,
  verifyMode?: string
): Promise<AttendanceResult> {
  const integration = await findIntegration(businessOwnerId);

  if (!integration) {
    return {
      success: false,
      message: 'Biometric integration is not configured or inactive.',
    };
  }

  const config = integration.config as unknown as BiometricConfig;

  // Verify the staff member exists and belongs to this business
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, businessOwnerId, status: 'active' },
  });

  if (!staff) {
    await logAction(
      integration.id,
      'record_attendance',
      'failure',
      { staffId, punchType, punchTime: punchTime.toISOString(), deviceId },
      null,
      `Staff not found or inactive: ${staffId}`
    );
    return {
      success: false,
      message: `Staff not found or inactive: ${staffId}`,
    };
  }

  const shiftDate = normalizeToShiftDate(punchTime);
  let workHours: number | null = null;

  // If OUT punch and auto-calculate is enabled, calculate work hours
  if (punchType === 'OUT' && config.autoCalculateHours) {
    const firstInToday = await prisma.staffAttendance.findFirst({
      where: {
        staffId,
        shiftDate,
        punchType: 'IN',
      },
      orderBy: { punchTime: 'asc' },
    });

    if (firstInToday) {
      const diffMs = punchTime.getTime() - firstInToday.punchTime.getTime();
      workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
    }
  }

  try {
    await prisma.staffAttendance.create({
      data: {
        businessOwnerId,
        branchId: staff.branchId,
        staffId,
        punchType,
        punchTime,
        deviceId: deviceId || null,
        verifyMode: verifyMode || null,
        workHours,
        shiftDate,
      },
    });

    const record: AttendanceRecord = {
      staffId,
      staffName: `${staff.firstName} ${staff.lastName}`,
      punchType,
      punchTime: punchTime.toISOString(),
      deviceId,
      verifyMode,
    };

    await logAction(
      integration.id,
      'record_attendance',
      'success',
      { staffId, punchType, punchTime: punchTime.toISOString(), deviceId, verifyMode },
      { staffName: record.staffName, workHours },
      null
    );

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return {
      success: true,
      message: `Attendance recorded: ${record.staffName} punched ${punchType} at ${punchTime.toLocaleTimeString()}${workHours !== null ? ` (${workHours}h worked)` : ''}`,
      record,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error recording attendance';

    await logAction(
      integration.id,
      'record_attendance',
      'failure',
      { staffId, punchType, punchTime: punchTime.toISOString() },
      null,
      msg
    );

    return { success: false, message: `Failed to record attendance: ${msg}` };
  }
}

/**
 * Get attendance records for a staff member on a specific date.
 */
export async function getStaffAttendance(
  staffId: string,
  date: Date,
  businessOwnerId: string
): Promise<{
  success: boolean;
  message: string;
  records?: AttendanceRecord[];
  totalWorkHours?: number;
}> {
  const shiftDate = normalizeToShiftDate(date);

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, businessOwnerId },
  });

  if (!staff) {
    return { success: false, message: `Staff not found: ${staffId}` };
  }

  const records = await prisma.staffAttendance.findMany({
    where: {
      staffId,
      shiftDate,
      businessOwnerId,
    },
    orderBy: { punchTime: 'asc' },
  });

  // Calculate total work hours from OUT punches that have workHours set
  const outPunches = records.filter((r) => r.punchType === 'OUT' && r.workHours !== null);
  const lastOut = outPunches.length > 0 ? outPunches[outPunches.length - 1] : null;
  const totalWorkHours = lastOut?.workHours ?? undefined;

  return {
    success: true,
    message: `Found ${records.length} punch(es) for ${staff.firstName} ${staff.lastName}`,
    records: records.map((r) => ({
      staffId: r.staffId,
      staffName: `${staff.firstName} ${staff.lastName}`,
      punchType: r.punchType,
      punchTime: r.punchTime.toISOString(),
      deviceId: r.deviceId || undefined,
      verifyMode: r.verifyMode || undefined,
    })),
    totalWorkHours: totalWorkHours !== null && totalWorkHours !== undefined ? totalWorkHours : undefined,
  };
}

/**
 * Generate a daily attendance report for all staff at a branch or entire business.
 *
 * Lists each staff member with their first IN, last OUT, total work hours,
 * and present/absent/incomplete status for the given date.
 */
export async function generateDailyReport(
  date: Date,
  businessOwnerId: string,
  branchId?: string
): Promise<AttendanceReportResult> {
  const shiftDate = normalizeToShiftDate(date);

  // Get all active staff for this business (optionally filtered by branch)
  const staffFilter: Record<string, unknown> = {
    businessOwnerId,
    status: 'active',
  };
  if (branchId) {
    staffFilter.branchId = branchId;
  }

  const allStaff = await prisma.staff.findMany({
    where: staffFilter,
    orderBy: [{ branchId: 'asc' }, { firstName: 'asc' }],
  });

  // Get all attendance records for this date
  const attendanceRecords = await prisma.staffAttendance.findMany({
    where: {
      businessOwnerId,
      shiftDate,
      ...(branchId ? { branchId } : {}),
    },
    orderBy: { punchTime: 'asc' },
  });

  // Group attendance by staffId
  const attendanceByStaff = new Map<string, typeof attendanceRecords>();
  for (const record of attendanceRecords) {
    const existing = attendanceByStaff.get(record.staffId) || [];
    existing.push(record);
    attendanceByStaff.set(record.staffId, existing);
  }

  // Build report
  const report: AttendanceReportEntry[] = [];
  let presentCount = 0;
  let absentCount = 0;

  for (const staff of allStaff) {
    const punches = attendanceByStaff.get(staff.id) || [];

    if (punches.length === 0) {
      absentCount++;
      report.push({
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        branchId: staff.branchId,
        shiftDate: shiftDate.toISOString(),
        firstIn: null,
        lastOut: null,
        totalWorkHours: null,
        punchCount: 0,
        status: 'absent',
      });
      continue;
    }

    presentCount++;

    const inPunches = punches.filter((p) => p.punchType === 'IN');
    const outPunches = punches.filter((p) => p.punchType === 'OUT');

    const firstIn = inPunches.length > 0 ? inPunches[0].punchTime : null;
    const lastOut = outPunches.length > 0 ? outPunches[outPunches.length - 1].punchTime : null;

    // Get total work hours from the last OUT punch (which has accumulated hours)
    const lastOutRecord = outPunches.length > 0 ? outPunches[outPunches.length - 1] : null;
    const totalWorkHours = lastOutRecord?.workHours ?? null;

    // Status: present if has both IN and OUT, incomplete if only IN (no OUT yet)
    const status = lastOut ? 'present' : 'incomplete';

    report.push({
      staffId: staff.id,
      staffName: `${staff.firstName} ${staff.lastName}`,
      branchId: staff.branchId,
      shiftDate: shiftDate.toISOString(),
      firstIn: firstIn?.toISOString() || null,
      lastOut: lastOut?.toISOString() || null,
      totalWorkHours,
      punchCount: punches.length,
      status,
    });
  }

  return {
    success: true,
    message: `Daily attendance report for ${shiftDate.toISOString().split('T')[0]}`,
    report,
    date: shiftDate.toISOString().split('T')[0],
    totalStaff: allStaff.length,
    presentCount,
    absentCount,
  };
}
