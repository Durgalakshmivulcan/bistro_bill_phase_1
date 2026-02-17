import { useState, useEffect } from 'react';
import { getMyMenuVisibility } from '../services/menuVisibilityService';

/**
 * Hook to fetch visible menu keys for the current user.
 * Returns null while loading (show all items) or on error (graceful degradation).
 */
export function useMenuVisibility(): string[] | null {
  const [visibleKeys, setVisibleKeys] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchVisibility() {
      try {
        const response = await getMyMenuVisibility();
        if (!cancelled && response.success && response.data) {
          setVisibleKeys(response.data.visibleMenuKeys);
        }
      } catch {
        // Graceful degradation: if API fails, visibleKeys stays null → show all items
      }
    }

    fetchVisibility();

    return () => {
      cancelled = true;
    };
  }, []);

  return visibleKeys;
}
