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
  editClassName = 'btn btn-xs btn-outline',
}: EntryActionsProps) {
  return (
    <div className='flex flex-row items-center gap-2'>
      <button type='button' className={editClassName} onClick={onEdit}>
        Edit
      </button>
      <button
        type='button'
        className='btn btn-xs btn-outline btn-error'
        onClick={onDelete}
        disabled={deleteDisabled}
      >
        Delete
      </button>
    </div>
  );
}
