import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
}

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSize = false,
}: PaginationProps = {}) => {
  const hasExplicitPagination = typeof totalPages === "number";
  const resolvedCurrentPage = currentPage ?? 1;
  const resolvedTotalPages = hasExplicitPagination ? Math.max(totalPages ?? 1, 1) : 11;
  const resolvedTotalItems =
    typeof totalItems === "number"
      ? totalItems
      : resolvedTotalPages * (itemsPerPage ?? pageSizeOptions[0] ?? 10);
  const resolvedItemsPerPage =
    itemsPerPage ?? Math.max(Math.ceil(resolvedTotalItems / resolvedTotalPages), 1);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (resolvedTotalPages <= 9) {
      for (let i = 1; i <= resolvedTotalPages; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    if (resolvedCurrentPage > 4) {
      pages.push("...");
    }

    const start = Math.max(2, resolvedCurrentPage - 1);
    const end = Math.min(resolvedTotalPages - 1, resolvedCurrentPage + 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    if (resolvedCurrentPage < resolvedTotalPages - 3) {
      pages.push("...");
    }

    pages.push(resolvedTotalPages);
    return pages;
  };

  const goTo = (page: number) => {
    if (!onPageChange) return;
    if (page < 1 || page > resolvedTotalPages || page === resolvedCurrentPage) return;
    onPageChange(page);
  };

  const startItem =
    resolvedTotalItems === 0 ? 0 : (resolvedCurrentPage - 1) * resolvedItemsPerPage + 1;
  const endItem = Math.min(resolvedCurrentPage * resolvedItemsPerPage, resolvedTotalItems);

  return (
    <div className="mt-5 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-[#6b6b6b]">
        <span>
          Showing {startItem} to {endItem} of {resolvedTotalItems} results
        </span>
        {showPageSize && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            <select
              value={resolvedItemsPerPage}
              onChange={(event) => onItemsPerPageChange(Number(event.target.value))}
              className="h-7 rounded border border-[#d4d4d4] bg-white px-2 text-xs text-[#444]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => goTo(1)}
          disabled={!onPageChange || resolvedCurrentPage === 1}
          className="flex h-6 min-w-6 items-center justify-center rounded border border-[#d4d4d4] bg-white px-1 text-[#666] disabled:opacity-40"
          aria-label="First page"
        >
          <ChevronsLeft size={12} />
        </button>

        <button
          type="button"
          onClick={() => goTo(resolvedCurrentPage - 1)}
          disabled={!onPageChange || resolvedCurrentPage === 1}
          className="flex h-6 min-w-6 items-center justify-center rounded border border-[#d4d4d4] bg-white px-1 text-[#666] disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={12} />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            type="button"
            key={`${page}-${index}`}
            onClick={() => (typeof page === "number" ? goTo(page) : undefined)}
            disabled={page === "..." || !onPageChange}
            className={`h-6 min-w-6 rounded border px-1 text-[11px] ${
              page === resolvedCurrentPage
                ? "border-yellow-500 bg-yellow-400 font-semibold text-black"
                : page === "..."
                  ? "cursor-default border-transparent bg-transparent text-[#888]"
                  : "border-[#d4d4d4] bg-white text-[#666]"
            } disabled:opacity-100`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goTo(resolvedCurrentPage + 1)}
          disabled={!onPageChange || resolvedCurrentPage === resolvedTotalPages}
          className="flex h-6 min-w-6 items-center justify-center rounded border border-[#d4d4d4] bg-white px-1 text-[#666] disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={12} />
        </button>

        <button
          type="button"
          onClick={() => goTo(resolvedTotalPages)}
          disabled={!onPageChange || resolvedCurrentPage === resolvedTotalPages}
          className="flex h-6 min-w-6 items-center justify-center rounded border border-[#d4d4d4] bg-white px-1 text-[#666] disabled:opacity-40"
          aria-label="Last page"
        >
          <ChevronsRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
