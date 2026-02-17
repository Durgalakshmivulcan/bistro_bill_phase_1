import React from "react";

interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex justify-end mt-6 gap-2">
      <button
        className="border px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        «
      </button>
      <button
        className="border px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </button>

      {getPageNumbers().map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? "bg-yellow-400 font-medium"
                : "border hover:bg-gray-50"
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      )}

      <button
        className="border px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
      <button
        className="border px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        »
      </button>
    </div>
  );
};

export default Pagination;
