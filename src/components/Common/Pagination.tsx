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
  onPageChange,
}: PaginationProps = {}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    if (currentPage > 4) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  };

  const goTo = (page: number) => {
    if (!onPageChange) return;
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-1 mt-5 text-xs">
      <button
        type="button"
        onClick={() => goTo(1)}
        disabled={currentPage === 1}
        className="h-6 min-w-6 px-1 border border-[#d4d4d4] rounded bg-white disabled:opacity-40"
      >
        {'<<'}
      </button>

      <button
        type="button"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-6 min-w-6 px-1 border border-[#d4d4d4] rounded bg-white disabled:opacity-40"
      >
        {'<'}
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          type="button"
          key={`${page}-${index}`}
          onClick={() => (typeof page === "number" ? goTo(page) : undefined)}
          disabled={page === "..."}
          className={`h-6 min-w-6 px-1 rounded border text-[11px] ${
            page === currentPage
              ? "bg-yellow-400 border-yellow-500 text-black font-semibold"
              : page === "..."
                ? "border-transparent bg-transparent cursor-default"
                : "bg-white border-[#d4d4d4]"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-6 min-w-6 px-1 border border-[#d4d4d4] rounded bg-white disabled:opacity-40"
      >
        {'>'}
      </button>

      <button
        type="button"
        onClick={() => goTo(totalPages)}
        disabled={currentPage === totalPages}
        className="h-6 min-w-6 px-1 border border-[#d4d4d4] rounded bg-white disabled:opacity-40"
      >
        {'>>'}
      </button>
    </div>
  );
};

export default Pagination;
