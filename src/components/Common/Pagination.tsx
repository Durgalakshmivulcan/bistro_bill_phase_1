import { ChevronLeft, ChevronRight } from "lucide-react";

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
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSize = true,
}: PaginationProps = {}) => {
  // Calculate range of items being displayed
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === "number" && onPageChange) {
      onPageChange(page);
    }
  };

  if (totalPages === 0) {
    return null; // Don't show pagination if no items
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-sm">
      {/* Items count and page size selector */}
      <div className="flex items-center gap-4">
        <span className="text-gray-600">
          Showing {startItem} to {endItem} of {totalItems} results
        </span>

        {showPageSize && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm bg-white"
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

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageClick(page)}
              disabled={page === "..."}
              className={`
                px-3 py-1 rounded min-w-[36px]
                ${
                  page === currentPage
                    ? "bg-bb-primary font-semibold"
                    : page === "..."
                    ? "cursor-default"
                    : "border hover:bg-gray-50"
                }
                ${page === "..." ? "border-0" : ""}
              `}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
