import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UsePaginationProps {
  defaultPage?: number;
  defaultPageSize?: number;
  persistInUrl?: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetPagination: () => void;
}

/**
 * Custom hook for managing pagination state with optional URL persistence
 *
 * @param defaultPage - Initial page number (default: 1)
 * @param defaultPageSize - Initial page size (default: 25)
 * @param persistInUrl - Whether to persist pagination state in URL query params (default: true)
 *
 * @returns Pagination state and setters
 *
 * @example
 * const { page, pageSize, setPage, setPageSize } = usePagination({
 *   defaultPage: 1,
 *   defaultPageSize: 25,
 *   persistInUrl: true
 * });
 */
export const usePagination = ({
  defaultPage = 1,
  defaultPageSize = 25,
  persistInUrl = true,
}: UsePaginationProps = {}): PaginationState => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL params if available and persistInUrl is true
  const getInitialPage = () => {
    if (!persistInUrl) return defaultPage;
    const pageParam = searchParams.get('page');
    return pageParam ? Math.max(1, parseInt(pageParam, 10)) : defaultPage;
  };

  const getInitialPageSize = () => {
    if (!persistInUrl) return defaultPageSize;
    const limitParam = searchParams.get('limit');
    return limitParam ? Math.max(1, parseInt(limitParam, 10)) : defaultPageSize;
  };

  const [page, setPageState] = useState(getInitialPage);
  const [pageSize, setPageSizeState] = useState(getInitialPageSize);

  // Update URL params when pagination state changes
  useEffect(() => {
    if (!persistInUrl) return;

    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', page.toString());
      newParams.set('limit', pageSize.toString());
      return newParams;
    }, { replace: true }); // Use replace to avoid cluttering browser history
  }, [page, pageSize, persistInUrl, setSearchParams]);

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, newPage));
  }, []);

  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeState(Math.max(1, newPageSize));
    // Reset to page 1 when page size changes
    setPageState(1);
  }, []);

  const resetPagination = useCallback(() => {
    setPageState(defaultPage);
    setPageSizeState(defaultPageSize);
  }, [defaultPage, defaultPageSize]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPagination,
  };
};
