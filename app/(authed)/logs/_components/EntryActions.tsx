'use client';

type EntryActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
  editClassName?: string;
};

export default function EntryActions({
  onEdit,
  onDelete,
  deleteDisabled = false,
  editClassName = 'btn btn-xs btn-ghost btn-square text-info',
}: EntryActionsProps) {
  return (
    <div className='flex flex-row items-center gap-2'>
      <button type='button' className={editClassName} onClick={onEdit}>
        <span className='fa-solid fa-pen' />
      </button>
      <button
        type='button'
        className='btn btn-xs btn-ghost btn-square text-error'
        onClick={onDelete}
        disabled={deleteDisabled}
      >
        <span className='fa-solid fa-trash' aria-hidden='true' />
      </button>
    </div>
  );
}
