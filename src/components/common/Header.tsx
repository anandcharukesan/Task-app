import React from 'react';
import { User, LogIn } from 'lucide-react';
import { UserProfile } from '../../types/user';

interface HeaderProps {
  profile: UserProfile | null;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenSettings,
  onOpenAuth,
}) => {
  return (
    <header className="pt-2 pb-1 px-4 sm:px-6 flex items-center justify-between bg-[#F0F4F9] dark:bg-[#131314] shrink-0 z-20">
      {/* Left empty balancing spacer (no hamburger) */}
      <div className="w-9" />

      {/* Centered App Title: Tasks */}
      <h1 className="text-[22px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] tracking-normal text-center font-sans">
        Tasks
      </h1>

      {/* Right User Avatar */}
      <div className="flex items-center justify-end w-9">
        {profile ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#DADCE0] dark:border-[#3C4043] focus:outline-none focus:ring-2 focus:ring-[#1A73E8] cursor-pointer shadow-xs active:scale-95 transition-transform bg-[#5F6368] flex items-center justify-center text-white"
            aria-label="Open profile settings"
            title={profile.displayName || profile.email || 'Profile'}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xs font-semibold select-none">
                {(profile.displayName || profile.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth || onOpenSettings}
            className="w-8 h-8 rounded-full bg-[#E1E3E1] dark:bg-[#2F3033] hover:bg-[#D3D6D4] text-[#444746] dark:text-[#C4C7C5] flex items-center justify-center cursor-pointer transition-colors"
            title="Sign in"
            aria-label="Sign In"
          >
            <User size={18} />
          </button>
        )}
      </div>
    </header>
  );
};
