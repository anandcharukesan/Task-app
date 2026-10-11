import React, { useState, useRef, useEffect } from 'react';
import { Menu, Check, LogOut, Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import { UserProfile } from '../../types/user';

interface WebHeaderProps {
  profile: UserProfile | null;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export const WebHeader: React.FC<WebHeaderProps> = ({
  profile,
  onToggleSidebar,
  onOpenSettings,
  onOpenAuth,
  theme,
  onToggleTheme,
  onSignOut,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatarUrl]);

  // Click outside to close profile menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitial = profile?.displayName
    ? profile.displayName.trim().charAt(0).toUpperCase()
    : profile?.email
      ? profile.email.trim().charAt(0).toUpperCase()
      : 'U';

  return (
    <header className="h-16 px-4 flex items-center justify-between bg-transparent shrink-0 select-none z-30">
      {/* Left: Hamburger, Google Tasks Logo, "Tasks" Title */}
      <div className="flex items-center gap-3">
        {/* Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2.5 rounded-full hover:bg-[#E8EAED]/70 dark:hover:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
          aria-label="Main menu"
          title="Main menu"
        >
          <Menu size={20} />
        </button>

        {/* Google Tasks Logo & Title */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-[#1A73E8] flex items-center justify-center text-white shadow-xs shrink-0">
            <Check size={18} strokeWidth={3} />
          </div>
          <span className="text-[22px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] tracking-normal font-sans">
            Tasks
          </span>
        </div>
      </div>

      {/* Right: Actions and User Profile Avatar OR Sign in button */}
      <div className="flex items-center gap-2">
        {!profile ? (
          /* When NOT logged in: Quick Theme toggle, Settings, and Google Sign in button */
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2.5 rounded-full hover:bg-[#E8EAED]/70 dark:hover:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2.5 rounded-full hover:bg-[#E8EAED]/70 dark:hover:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
              title="Settings"
              aria-label="Settings"
            >
              <SettingsIcon size={20} />
            </button>

            <button
              type="button"
              onClick={onOpenAuth}
              className="bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:hover:bg-[#8AB4F8] text-white dark:text-[#062E6F] px-5 py-2 rounded-full text-sm font-medium transition-all shadow-xs hover:shadow cursor-pointer active:scale-95 ml-1"
            >
              Sign in
            </button>
          </div>
        ) : (
          /* When logged in: User Profile Avatar with dropdown */
          <div className="relative ml-1" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-8 h-8 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#1A73E8] cursor-pointer shadow-xs active:scale-95 transition-transform flex items-center justify-center bg-[#5F6368] dark:bg-[#747775]"
              aria-label="Google Account"
              title={profile.displayName || profile.email || 'Google Account'}
            >
              {profile.avatarUrl && !avatarError ? (
                <img
                  src={profile.avatarUrl}
                  alt="Google Account"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-white text-sm font-medium select-none">
                  {userInitial}
                </span>
              )}
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#282A2C] rounded-3xl shadow-2xl border border-[#DADCE0] dark:border-[#3C4043] p-4 z-50 animate-in fade-in zoom-in-95">
                {/* Profile Card Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-[#F1F3F4] dark:border-[#3C4043]">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#5F6368] text-white flex items-center justify-center text-base font-medium shrink-0">
                    {profile.avatarUrl && !avatarError ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Google Account"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                      {profile.displayName || 'Google Account'}
                    </p>
                    <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] truncate">
                      {profile.email || ''}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="py-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onToggleTheme();
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#3C4043] dark:text-[#E8EAED] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer w-full text-left"
                  >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#3C4043] dark:text-[#E8EAED] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer w-full text-left"
                  >
                    <SettingsIcon size={18} />
                    <span>Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onSignOut();
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#D93025] hover:bg-[#FCE8E6] dark:hover:bg-[#3C1E1E] transition-colors cursor-pointer w-full text-left"
                  >
                    <LogOut size={18} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
