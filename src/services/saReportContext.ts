/**
 * SA Report Context — module-level state for SuperAdmin BO override.
 * When SA selects a Business Owner, all report/dashboard API calls
 * automatically include the `boId` query parameter via an interceptor in api.ts.
 */

let selectedBoId: string | null = null;

export function getSelectedBoId(): string | null {
  return selectedBoId;
}

export function setSelectedBoId(id: string | null): void {
  selectedBoId = id;
}
