import React, { useState } from 'react';
import { Plus, CheckCircle2, Star, ChevronUp, ChevronDown, CheckSquare } from 'lucide-react';
import { TaskList } from '../../types/list';

interface WebSidebarProps {
  isOpen: boolean;
  lists: TaskList[];
  selectedListId: string;
  onSelectList: (id: string) => void;
  onOpenNewTask: () => void;
  onOpenCreateList: () => void;
}

export const WebSidebar: React.FC<WebSidebarProps> = ({
  isOpen,
  lists,
  selectedListId,
  onSelectList,
  onOpenNewTask,
  onOpenCreateList,
}) => {
  const [isListsExpanded, setIsListsExpanded] = useState(true);

  if (!isOpen) return null;

  return (
    <aside className="w-64 shrink-0 flex flex-col h-[calc(100vh-64px)] px-3 py-4 select-none overflow-y-auto">
      {/* 1. "+ Create" Pill Button */}
      <div className="px-1 mb-4">
        <button
          type="button"
          onClick={onOpenNewTask}
          className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white dark:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3] border border-[#DADCE0] dark:border-[#3C4043] shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:bg-[#F8FAFD] dark:hover:bg-[#282A2C] transition-all cursor-pointer font-medium text-sm select-none active:scale-[0.98]"
        >
          <Plus size={20} className="text-[#1F1F1F] dark:text-[#E3E3E3]" strokeWidth={2.4} />
          <span>Create</span>
        </button>
      </div>

      {/* 2. Primary Navigation */}
      <nav className="flex flex-col gap-0.5">
        {/* All tasks */}
        <button
          type="button"
          onClick={() => onSelectList('all')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-full text-sm transition-colors cursor-pointer w-full text-left ${
            selectedListId === 'all'
              ? 'bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-[#C2E7FF] font-semibold'
              : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] font-normal'
          }`}
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <span className="truncate">All tasks</span>
        </button>

        {/* Starred */}
        <button
          type="button"
          onClick={() => onSelectList('starred')}
          className={`flex items-center gap-4 px-4 py-2.5 rounded-full text-sm transition-colors cursor-pointer w-full text-left ${
            selectedListId === 'starred'
              ? 'bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-[#C2E7FF] font-semibold'
              : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] font-normal'
          }`}
        >
          <Star size={18} className="shrink-0" />
          <span className="truncate">Starred</span>
        </button>

        {/* 3. Lists Section Header */}
        <div className="pt-4 pb-1">
          <div
            onClick={() => setIsListsExpanded(!isListsExpanded)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsListsExpanded(!isListsExpanded);
              }
            }}
            className="flex items-center justify-between px-4 py-1 text-xs font-semibold text-[#444746] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] cursor-pointer"
          >
            <span>Lists</span>
            <span className="p-1 hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] rounded-full transition-colors">
              {isListsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>

          {/* User Task Lists */}
          {isListsExpanded && (
            <div className="flex flex-col gap-0.5 mt-1">
              {lists.map((list) => {
                const isSelected = selectedListId === list.id;
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => onSelectList(list.id)}
                    className={`flex items-center gap-4 px-4 py-2.5 rounded-full text-sm transition-colors cursor-pointer w-full text-left ${
                      isSelected
                        ? 'bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-[#C2E7FF] font-semibold'
                        : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] font-normal'
                    }`}
                  >
                    <CheckSquare size={18} className="shrink-0" />
                    <span className="truncate">{list.name}</span>
                  </button>
                );
              })}

              {/* "+ Create new list" Action */}
              <button
                type="button"
                onClick={onOpenCreateList}
                className="flex items-center gap-4 px-4 py-2.5 rounded-full text-sm text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-colors cursor-pointer w-full text-left font-normal mt-0.5"
              >
                <Plus size={18} className="shrink-0" />
                <span className="truncate">Create new list</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};
