import React, { useState, useRef, useEffect } from 'react';
import { TaskSortOption } from '../../store/uiStore';
import { ArrowUpDown, Check } from 'lucide-react';
import { IconButton } from '../common/IconButton';

interface TaskSortMenuProps {
  currentSort: TaskSortOption;
  onChangeSort: (sort: TaskSortOption) => void;
}

export const TaskSortMenu: React.FC<TaskSortMenuProps> = ({
  currentSort,
  onChangeSort,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { label: string; value: TaskSortOption }[] = [
    { label: 'My order', value: 'my_order' },
    { label: 'Date', value: 'date' },
    { label: 'Title', value: 'title' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <IconButton
        icon={<ArrowUpDown size={18} />}
        aria-label="Sort tasks"
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
      />

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#292A2D] rounded-xl shadow-lg border border-[#DADCE0] dark:border-[#3C4043] py-1.5 z-30 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6]">
            Sort by
          </div>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChangeSort(opt.value);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#202124] dark:text-[#E8EAED] hover:bg-[#F1F3F4] dark:hover:bg-[#303134] transition-colors"
            >
              <span>{opt.label}</span>
              {currentSort === opt.value && (
                <Check size={14} className="text-[#1A73E8] dark:text-[#8AB4F8]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
