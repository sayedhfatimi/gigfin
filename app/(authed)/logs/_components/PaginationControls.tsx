type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const clampPage = (page: number, totalPages: number) => {
  if (!totalPages) {
    return 1;
  }
  return Math.max(1, Math.min(page, totalPages));
};

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage <= 1) {
      return;
    }
    onPageChange(clampPage(currentPage - 1, totalPages));
  };

  const handleNext = () => {
    if (currentPage >= totalPages) {
      return;
    }
    onPageChange(clampPage(currentPage + 1, totalPages));
  };

  // Generate visible page numbers with ellipsis
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className='mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-base-content/10 pt-4'>
      <span className='text-xs text-base-content/60'>
        Page {currentPage} of {totalPages}
      </span>
      {/* Mobile: Simple prev/next only */}
      <div className='flex items-center gap-2 sm:hidden'>
        <button
          type='button'
          className='btn btn-sm btn-ghost'
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          aria-label='Previous page'
        >
          <i className='fa-solid fa-chevron-left' aria-hidden='true' />
          <span className='text-xs'>Prev</span>
        </button>
        <button
          type='button'
          className='btn btn-sm btn-ghost'
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          aria-label='Next page'
        >
          <span className='text-xs'>Next</span>
          <i className='fa-solid fa-chevron-right' aria-hidden='true' />
        </button>
      </div>
      {/* Desktop: Full page numbers */}
      <div className='hidden sm:flex join'>
        <button
          type='button'
          className='join-item btn btn-sm btn-ghost'
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          aria-label='Previous page'
        >
          <i className='fa-solid fa-chevron-left' aria-hidden='true' />
        </button>
        {getVisiblePages().map((page, index) => {
          // Use position-based key for ellipsis (before or after current page)
          const key =
            page === 'ellipsis'
              ? `ellipsis-${index < 2 ? 'start' : 'end'}`
              : page;
          return page === 'ellipsis' ? (
            <span
              key={key}
              className='join-item btn btn-sm btn-ghost btn-disabled'
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type='button'
              className={`join-item btn btn-sm ${
                page === currentPage ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
        <button
          type='button'
          className='join-item btn btn-sm btn-ghost'
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          aria-label='Next page'
        >
          <i className='fa-solid fa-chevron-right' aria-hidden='true' />
        </button>
      </div>
    </div>
  );
}
