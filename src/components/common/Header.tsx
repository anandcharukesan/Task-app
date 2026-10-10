import React from 'react';
import { Menu, Search, X, LogIn } from 'lucide-react';
import { IconButton } from './IconButton';
import { TaskSortMenu } from '../tasks/TaskSortMenu';
import { TaskSortOption } from '../../store/uiStore';
import { UserProfile } from '../../types/user';

interface HeaderProps {
  currentListName: string;
  searchQuery: string;
  sortBy: TaskSortOption;
  profile: UserProfile | null;
  onToggleSidebar: () => void;
  onSearchChange: (query: string) => void;
  onChangeSort: (sort: TaskSortOption) => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentListName,
  searchQuery,
  sortBy,
  profile,
  onToggleSidebar,
  onSearchChange,
  onChangeSort,
  onOpenSettings,
  onOpenAuth,
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-[#DADCE0] dark:border-[#3C4043] bg-white dark:bg-[#202124] shrink-0 z-20">
      {/* Left section: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <IconButton
          icon={<Menu size={20} />}
          aria-label="Toggle navigation drawer"
          onClick={onToggleSidebar}
          size="md"
        />
        <h2 className="text-lg font-semibold tracking-tight text-[#202124] dark:text-[#E8EAED] truncate max-w-[180px] sm:max-w-xs">
          {currentListName}
        </h2>
      </div>

      {/* Center Search Input */}
      <div className="flex-1 max-w-md mx-3">
        <div className="relative flex items-center">
          <Search
            size={16}
            className="absolute left-3 text-[#5F6368] dark:text-[#9AA0A6] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 bg-[#F1F3F4] dark:bg-[#292A2D] text-[#202124] dark:text-[#E8EAED] placeholder:text-[#80868B] dark:placeholder:text-[#9AA0A6] rounded-full border border-transparent focus:border-[#1A73E8] focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 text-[#5F6368] hover:text-[#202124] dark:text-[#9AA0A6] p-0.5"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <TaskSortMenu currentSort={sortBy} onChangeSort={onChangeSort} />

        {profile ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#DADCE0] dark:border-[#3C4043] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            aria-label="Open profile settings"
            title={profile.displayName || profile.email || undefined}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#1A73E8] text-white flex items-center justify-center text-xs font-semibold">
                {(profile.displayName || profile.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth || onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
