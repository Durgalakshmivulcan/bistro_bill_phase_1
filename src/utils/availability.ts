import { ProductAvailabilitySchedule } from '../services/productService';

const DAYS_MAP: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

/**
 * Check if a product is currently available based on its availability schedule.
 * Returns true if no schedule is set (always available).
 */
export function isProductAvailableNow(
  schedule?: ProductAvailabilitySchedule[]
): boolean {
  if (!schedule || schedule.length === 0) return true;

  const now = new Date();
  const currentDay = DAYS_MAP[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const todaySchedule = schedule.find((s) => s.dayOfWeek === currentDay);

  // If no entry for today, product is unavailable
  if (!todaySchedule) return false;

  // If explicitly marked as not available
  if (!todaySchedule.isAvailable) return false;

  // If available all day (no time range specified)
  if (!todaySchedule.startTime || !todaySchedule.endTime) return true;

  // Check if current time is within the range
  return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
}

/**
 * Format a 24h time string (HH:mm) to 12h format (h:mm AM/PM)
 */
export function formatTime12h(time24: string): string {
  const [hourStr, minuteStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minuteStr} ${period}`;
}
