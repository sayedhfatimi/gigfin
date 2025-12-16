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

  return (
    <div className='mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-base-content/10 pt-4 text-xs uppercase text-base-content/60'>
      <span>{`Page ${currentPage} of ${totalPages}`}</span>
      <div className='flex gap-2'>
        <button
          type='button'
          className='btn btn-xs btn-outline gap-1'
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          aria-label='Previous page'
        >
          <i className='fa-solid fa-chevron-left' aria-hidden='true' />
          Prev
        </button>
        <button
          type='button'
          className='btn btn-xs btn-outline gap-1'
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          aria-label='Next page'
        >
          Next
          <i className='fa-solid fa-chevron-right' aria-hidden='true' />
        </button>
      </div>
    </div>
  );
}
