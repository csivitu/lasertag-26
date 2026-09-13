interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <div className="slot-pagination">
      <button
        type="button"
        aria-label="Previous slot page"
        onClick={onPrevious}
        className="slot-pagination-button"
      >
        <span className="slot-pagination-arrow slot-pagination-arrow-left" />
      </button>

      <span className="slot-pagination-label">
        {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        aria-label="Next slot page"
        onClick={onNext}
        className="slot-pagination-button"
      >
        <span className="slot-pagination-arrow slot-pagination-arrow-right" />
      </button>
    </div>
  );
}
