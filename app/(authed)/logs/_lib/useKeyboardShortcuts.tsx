'use client';

import { useCallback, useEffect } from 'react';

type KeyboardShortcuts = {
  onNew?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
  onSearch?: () => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  enabled?: boolean;
};

export function useKeyboardShortcuts({
  onNew,
  onEdit,
  onDelete,
  onEscape,
  onSearch,
  onNextPage,
  onPrevPage,
  enabled = true,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Allow Escape even in inputs
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Skip other shortcuts if in input
      if (isInput) return;

      // Check for modifier keys
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;

      switch (event.key.toLowerCase()) {
        case 'n':
          if (!hasModifier && onNew) {
            event.preventDefault();
            onNew();
          }
          break;
        case 'e':
          if (!hasModifier && onEdit) {
            event.preventDefault();
            onEdit();
          }
          break;
        case 'd':
          if (!hasModifier && onDelete) {
            event.preventDefault();
            onDelete();
          }
          break;
        case '/':
          if (!hasModifier && onSearch) {
            event.preventDefault();
            onSearch();
          }
          break;
        case 'arrowright':
          if (!hasModifier && onNextPage) {
            event.preventDefault();
            onNextPage();
          }
          break;
        case 'arrowleft':
          if (!hasModifier && onPrevPage) {
            event.preventDefault();
            onPrevPage();
          }
          break;
      }
    },
    [
      enabled,
      onNew,
      onEdit,
      onDelete,
      onEscape,
      onSearch,
      onNextPage,
      onPrevPage,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export function KeyboardShortcutsHint() {
  return (
    <div className='hidden text-xs text-base-content/40 lg:flex lg:items-center lg:gap-4'>
      <span>
        <kbd className='kbd kbd-xs'>N</kbd> New
      </span>
      <span>
        <kbd className='kbd kbd-xs'>/</kbd> Search
      </span>
      <span>
        <kbd className='kbd kbd-xs'>←</kbd>
        <kbd className='kbd kbd-xs'>→</kbd> Navigate pages
      </span>
    </div>
  );
}
