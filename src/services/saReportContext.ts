/**
 * SA Report Context — module-level state for SuperAdmin BO override.
 * When SA selects a Business Owner, all report/dashboard API calls
 * automatically include the `boId` query parameter via an interceptor in api.ts.
 */

let selectedBoId: string | null = null;

export function getSelectedBoId(): string | null {
  return (
    selectedBoId ||
    localStorage.getItem("selectedBoId") ||
    localStorage.getItem("selectedTenantId") ||
    sessionStorage.getItem("selectedBoId") ||
    sessionStorage.getItem("selectedTenantId") ||
    null
  );
}

export function setSelectedBoId(id: string | null): void {
  selectedBoId = id;
  if (id) {
    localStorage.setItem("selectedBoId", id);
    localStorage.setItem("selectedTenantId", id);
    sessionStorage.setItem("selectedBoId", id);
    sessionStorage.setItem("selectedTenantId", id);
  } else {
    localStorage.removeItem("selectedBoId");
    localStorage.removeItem("selectedTenantId");
    sessionStorage.removeItem("selectedBoId");
    sessionStorage.removeItem("selectedTenantId");
  }
}
