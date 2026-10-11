import React, { useRef, useEffect } from 'react';
import { Star, Plus } from 'lucide-react';
import { TaskList } from '../../types/list';

interface ListTabsProps {
  lists: TaskList[];
  selectedListId: string;
  starredCount?: number;
  taskCounts?: Record<string, number>;
  onSelectList: (id: string) => void;
  onOpenCreateList: () => void;
}

export const ListTabs: React.FC<ListTabsProps> = ({
  lists,
  selectedListId,
  starredCount = 0,
  taskCounts = {},
  onSelectList,
  onOpenCreateList,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const isStarredActive = selectedListId === 'starred';

  // Scroll active tab into view smoothly
  useEffect(() => {
    const activeEl = tabsContainerRef.current?.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedListId]);

  return (
    <div className="w-full bg-[#F0F4F9] dark:bg-[#131314] px-4 pt-1 pb-3 overflow-x-auto no-scrollbar">
      <div ref={tabsContainerRef} className="flex items-center gap-6 min-w-max border-b border-transparent">
        {/* 1. Starred / Favorites Tab */}
        <button
          type="button"
          data-active={isStarredActive ? 'true' : 'false'}
          onClick={() => onSelectList('starred')}
          className="flex flex-col items-center justify-center pt-2 pb-1 relative cursor-pointer group focus:outline-none"
          title="Starred tasks"
        >
          <div className="flex items-center gap-1.5 px-1">
            <Star
              size={18}
              className={`transition-colors ${
                isStarredActive
                  ? 'text-[#1F1F1F] dark:text-[#E3E3E3] fill-[#1F1F1F] dark:fill-[#E3E3E3]'
                  : 'text-[#444746] dark:text-[#C4C7C5] group-hover:text-[#1F1F1F] dark:group-hover:text-white'
              }`}
            />
            {starredCount > 0 && !isStarredActive && (
              <span className="text-xs text-[#5F6368] dark:text-[#9AA0A6] font-medium">
                {starredCount}
              </span>
            )}
          </div>
          {/* Active Bottom Indicator */}
          {isStarredActive && (
            <div className="absolute -bottom-1 w-5 h-[3px] bg-[#1F1F1F] dark:bg-white rounded-full" />
          )}
        </button>

        {/* 2. List Tabs (e.g. My Tasks) */}
        {lists.map((list) => {
          const isActive = selectedListId === list.id;
          const count = taskCounts[list.id] ?? 0;

          return (
            <button
              key={list.id}
              type="button"
              data-active={isActive ? 'true' : 'false'}
              onClick={() => onSelectList(list.id)}
              className="flex flex-col items-center justify-center pt-2 pb-1 relative cursor-pointer group focus:outline-none"
            >
              <div className="flex items-center gap-1.5 px-1">
                <span
                  className={`text-[15px] tracking-normal transition-colors ${
                    isActive
                      ? 'font-medium text-[#1F1F1F] dark:text-[#E3E3E3]'
                      : 'text-[#444746] dark:text-[#C4C7C5] group-hover:text-[#1F1F1F] dark:group-hover:text-white'
                  }`}
                >
                  {list.name}
                </span>
                {count > 0 && (
                  <span
                    className={`text-xs transition-colors ${
                      isActive
                        ? 'text-[#444746] dark:text-[#C4C7C5] font-medium'
                        : 'text-[#747775] dark:text-[#8E918F]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>
              {/* Active Bottom Indicator */}
              {isActive && (
                <div className="absolute -bottom-1 w-full max-w-[32px] h-[3px] bg-[#1F1F1F] dark:bg-white rounded-full" />
              )}
            </button>
          );
        })}

        {/* 3. + New list Tab */}
        <button
          type="button"
          onClick={onOpenCreateList}
          className="flex items-center gap-1.5 pt-2 pb-1 text-[15px] font-medium text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-white cursor-pointer transition-colors focus:outline-none"
        >
          <Plus size={16} />
          <span>New list</span>
        </button>
      </div>
    </div>
  );
};
