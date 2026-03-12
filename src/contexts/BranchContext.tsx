import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getBranches, BranchResponse } from '../services/branchService';
import { getSelectedBoId } from '../services/saReportContext';

const BRANCH_STORAGE_KEY = 'bb_selected_branch_id';

export type FranchiseAccessLevel = 'franchise_admin' | 'branch_manager' | 'staff';

interface BranchContextType {
  currentBranchId: string;
  currentBranch: BranchResponse | null;
  availableBranches: BranchResponse[];
  setCurrentBranch: (id: string) => void;
  loading: boolean;
  accessLevel: FranchiseAccessLevel;
  isAllLocationsSelected: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

interface BranchProviderProps {
  children: React.ReactNode;
}

/**
 * Extracts branch IDs the current user has access to.
 * - BusinessOwner (Franchise Admin): all their branches
 * - Staff with "Branch Manager" role: their single assigned branch
 * - Staff: their single assigned branch only
 * - SuperAdmin: all branches (fetched from API)
 */
function getUserBranchIds(user: any): string[] | null {
  if (!user) return null;
  if (user.userType === 'BusinessOwner' && user.branches?.length) {
    return user.branches.map((b: any) => b.id);
  }
  if (user.userType === 'Staff' && user.branch?.id) {
    return [user.branch.id];
  }
  // SuperAdmin — no restriction, fetch all
  return null;
}

/**
 * Determines the franchise access level for the current user.
 * - franchise_admin: BusinessOwner or SuperAdmin (can see all locations)
 * - branch_manager: Staff with "Branch Manager" role (single location, management access)
 * - staff: Regular staff (single location, limited access)
 */
function getUserAccessLevel(user: any): FranchiseAccessLevel {
  if (!user) return 'staff';
  if (user.userType === 'SuperAdmin' || user.userType === 'BusinessOwner') {
    return 'franchise_admin';
  }
  if (user.userType === 'Staff') {
    const roleName = user.role?.name?.toLowerCase() || '';
    if (roleName.includes('manager') || roleName.includes('admin')) {
      return 'branch_manager';
    }
    return 'staff';
  }
  return 'staff';
}

export function BranchProvider({ children }: BranchProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [availableBranches, setAvailableBranches] = useState<BranchResponse[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch branches when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setAvailableBranches([]);
      setCurrentBranchId('');
      setLoading(false);
      return;
    }

    // SuperAdmin branch listing is tenant-scoped on backend.
    // If no BO is selected, skip branch fetch to avoid noisy tenant context errors.
    if (user.userType === 'SuperAdmin' && !getSelectedBoId()) {
      setAvailableBranches([]);
      setCurrentBranchId('');
      setLoading(false);
      return;
    }

    const fetchBranches = async () => {
      setLoading(true);
      try {
        const response = await getBranches({ status: 'active' });
        const allBranches: BranchResponse[] = (response.data as any)?.branches || [];

        // Filter to user's assigned branches if applicable
        const userBranchIds = getUserBranchIds(user);
        const branches = userBranchIds
          ? allBranches.filter((b) => userBranchIds.includes(b.id))
          : allBranches;

        setAvailableBranches(branches);

        // Restore persisted branch or pick default
        const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
        if (stored && branches.some((b) => b.id === stored)) {
          setCurrentBranchId(stored);
        } else if (branches.length > 0) {
          // Default to main branch or first branch
          const main = branches.find((b) => b.isMainBranch);
          setCurrentBranchId(main ? main.id : branches[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
        // Fallback to user's branch info if API fails
        if (user.userType === 'Staff' && user.branch?.id) {
          setCurrentBranchId(user.branch.id);
        } else if (user.userType === 'BusinessOwner' && user.branches?.length) {
          const main = user.branches.find((b: any) => b.isMainBranch);
          setCurrentBranchId(main ? main.id : user.branches[0].id);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [isAuthenticated, user]);

  const setCurrentBranch = useCallback((id: string) => {
    setCurrentBranchId(id);
    localStorage.setItem(BRANCH_STORAGE_KEY, id);
  }, []);

  const currentBranch = availableBranches.find((b) => b.id === currentBranchId) || null;
  const accessLevel = getUserAccessLevel(user);
  const isAllLocationsSelected = currentBranchId === 'all';

  const value: BranchContextType = {
    currentBranchId,
    currentBranch,
    availableBranches,
    setCurrentBranch,
    loading,
    accessLevel,
    isAllLocationsSelected,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch(): BranchContextType {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}

export { BranchContext };
