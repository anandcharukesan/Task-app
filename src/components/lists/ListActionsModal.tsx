import React from 'react';

interface ListActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listName: string;
  isDefaultList: boolean;
  hasCompletedTasks: boolean;
  onRename: () => void;
  onDelete: () => void;
  onDeleteCompleted: () => void;
}

export const ListActionsModal: React.FC<ListActionsModalProps> = ({
  isOpen,
  onClose,
  listName: _listName,
  isDefaultList,
  hasCompletedTasks,
  onRename,
  onDelete,
  onDeleteCompleted,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Background Overlay */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Drawer flush with bottom */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1F20] rounded-t-3xl pt-6 pb-8 px-6 shadow-2xl z-10 animate-in slide-in-from-bottom duration-250 select-none">
        <div className="flex flex-col gap-6 text-[#1F1F1F] dark:text-[#E3E3E3]">
          {/* 1. Rename list */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRename();
            }}
            className="text-left text-base text-[#1F1F1F] dark:text-[#E3E3E3] hover:text-[#1A73E8] transition-colors cursor-pointer focus:outline-none"
          >
            Rename list
          </button>

          {/* 2. Delete list */}
          <div className="flex flex-col">
            <button
              type="button"
              disabled={isDefaultList}
              onClick={() => {
                if (isDefaultList) return;
                onClose();
                onDelete();
              }}
              className={`text-left text-base transition-colors focus:outline-none ${
                isDefaultList
                  ? 'text-[#9AA0A6] dark:text-[#747775] cursor-not-allowed'
                  : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:text-red-600 cursor-pointer'
              }`}
            >
              Delete list
            </button>
            {isDefaultList && (
              <span className="text-xs text-[#747775] dark:text-[#8E918F] mt-1">
                Default list can't be deleted
              </span>
            )}
          </div>

          {/* 3. Delete all completed tasks */}
          <button
            type="button"
            disabled={!hasCompletedTasks}
            onClick={() => {
              if (!hasCompletedTasks) return;
              onClose();
              onDeleteCompleted();
            }}
            className={`text-left text-base transition-colors focus:outline-none ${
              hasCompletedTasks
                ? 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:text-red-600 cursor-pointer'
                : 'text-[#9AA0A6] dark:text-[#747775] cursor-not-allowed'
            }`}
          >
            Delete all completed tasks
          </button>
        </div>
      </div>
    </div>
  );
};
