import React from 'react';
import { TaskList } from '../../types/list';
import { IconButton } from '../common/IconButton';
import {
  CheckCircle2,
  List,
  Plus,
  Settings,
  Sun,
  Moon,
  Trash2,
  Edit2,
  MoreVertical,
} from 'lucide-react';

interface ListSidebarProps {
  lists: TaskList[];
  selectedListId: string;
  theme: 'light' | 'dark';
  onSelectList: (id: string) => void;
  onOpenCreateList: () => void;
  onOpenEditList: (list: TaskList) => void;
  onDeleteList: (id: string) => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  onCloseMobileDrawer?: () => void;
}

export const ListSidebar: React.FC<ListSidebarProps> = ({
  lists,
  selectedListId,
  theme,
  onSelectList,
  onOpenCreateList,
  onOpenEditList,
  onDeleteList,
  onOpenSettings,
  onToggleTheme,
  onCloseMobileDrawer,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  return (
    <aside className="w-full h-full flex flex-col bg-white dark:bg-[#202124] border-r border-[#DADCE0] dark:border-[#3C4043] select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F3F4] dark:border-[#3C4043]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A73E8] dark:bg-[#8AB4F8] flex items-center justify-center text-white dark:text-[#202124] shadow-xs">
            <CheckCircle2 size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-[#202124] dark:text-[#E8EAED]">
              ClearTasks
            </h1>
            <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] uppercase tracking-wider font-semibold">
              Tasks & Recurrence
            </p>
          </div>
        </div>

        <IconButton
          icon={theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          aria-label="Toggle dark mode"
          size="sm"
          onClick={onToggleTheme}
        />
      </div>

      {/* Task Lists Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6]">
          <span>Lists</span>
          <button
            type="button"
            onClick={onOpenCreateList}
            className="p-1 rounded-md hover:bg-[#F1F3F4] dark:hover:bg-[#303134] text-[#1A73E8] dark:text-[#8AB4F8] transition-colors"
            title="Create list"
            aria-label="Create new list"
          >
            <Plus size={16} />
          </button>
        </div>

        {lists.map((list) => {
          const isSelected = selectedListId === list.id;
          const isMenuOpen = activeMenuId === list.id;

          return (
            <div
              key={list.id}
              className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#28364D] dark:text-[#8AB4F8]'
                  : 'text-[#202124] dark:text-[#E8EAED] hover:bg-[#F1F3F4] dark:hover:bg-[#303134]'
              }`}
              onClick={() => {
                onSelectList(list.id);
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <List size={16} className="shrink-0 opacity-70" />
                <span className="truncate">{list.name}</span>
              </div>

              {/* List Actions Menu */}
              <div
                className="relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label={`Options for ${list.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : list.id);
                  }}
                  className={`p-1 rounded-full text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-[#E8EAED] hover:bg-black/5 dark:hover:bg-white/5 transition-opacity ${
                    isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <MoreVertical size={14} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-6 w-36 bg-white dark:bg-[#292A2D] rounded-xl shadow-lg border border-[#DADCE0] dark:border-[#3C4043] py-1 z-30 animate-in fade-in-50 zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuId(null);
                        onOpenEditList(list);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#202124] dark:text-[#E8EAED] hover:bg-[#F1F3F4] dark:hover:bg-[#303134]"
                    >
                      <Edit2 size={13} />
                      <span>Rename</span>
                    </button>
                    {lists.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onDeleteList(list.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#D93025] dark:text-[#F28B82] hover:bg-[#FCE8E6] dark:hover:bg-[#5C2B29]"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Quick Create list button */}
        <button
          type="button"
          onClick={onOpenCreateList}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#1A73E8] dark:text-[#8AB4F8] hover:bg-[#F1F3F4] dark:hover:bg-[#303134] transition-colors mt-2"
        >
          <Plus size={16} />
          <span>Create new list</span>
        </button>
      </div>

      {/* Footer / Settings */}
      <div className="p-3 border-t border-[#F1F3F4] dark:border-[#3C4043] flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-[#E8EAED] hover:bg-[#F1F3F4] dark:hover:bg-[#303134] transition-colors"
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>

        <span className="text-[11px] text-[#80868B] dark:text-[#5F6368] px-2 font-mono">
          v1.0.0
        </span>
      </div>
    </aside>
  );
};
