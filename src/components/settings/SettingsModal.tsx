import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { isSupabaseConfigured } from '../../services/supabase';
import { UserProfile } from '../../types/user';
import { Database, ShieldCheck, User, Moon, Sun, LogOut, LogIn } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSignOut?: () => void;
  onOpenAuth?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  theme,
  onToggleTheme,
  onSignOut,
  onOpenAuth,
}) => {
  const isConnectedToSupabase = isSupabaseConfigured();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings & Account" maxWidth="md">
      <div className="flex flex-col gap-5 text-sm text-[#202124] dark:text-[#E8EAED]">
        {/* User Account Info */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-[#202124] border border-[#DADCE0] dark:border-[#3C4043]">
          <div className="flex items-center gap-3 min-w-0">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-11 h-11 rounded-full object-cover border border-[#DADCE0] dark:border-[#3C4043]"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-semibold text-base">
                {profile ? (
                  (profile.displayName || profile.email || 'U').charAt(0).toUpperCase()
                ) : (
                  <User size={20} />
                )}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-semibold text-sm truncate">
                {profile ? profile.displayName || 'Active Account' : 'Not Signed In'}
              </h4>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] truncate">
                {profile ? profile.email : 'Sign in to sync your tasks across devices'}
              </p>
            </div>
          </div>

          <div>
            {profile ? (
              onSignOut && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  icon={<LogOut size={14} />}
                >
                  Sign Out
                </Button>
              )
            ) : (
              onOpenAuth && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  icon={<LogIn size={14} />}
                >
                  Sign In
                </Button>
              )
            )}
          </div>
        </div>

        {/* Database & Supabase Status */}
        <div className="p-3.5 rounded-xl border border-[#DADCE0] dark:border-[#3C4043] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] flex items-center gap-1.5">
              <Database size={14} />
              Backend Storage
            </span>
            <div className="flex items-center gap-1 text-xs">
              {isConnectedToSupabase ? (
                <span className="inline-flex items-center gap-1 text-[#188038] dark:text-[#81C995] font-medium">
                  <ShieldCheck size={14} />
                  Supabase Connected
                </span>
              ) : (
                <span className="text-[#5F6368] dark:text-[#9AA0A6]">
                  Offline / Local Persistence
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] leading-relaxed">
            {isConnectedToSupabase
              ? 'Connected to your Supabase project. Realtime sync and Row-Level Security policies are active.'
              : 'Tasks and recurrence rules are saved in local browser storage.'}
          </p>
        </div>

        {/* Theme Setting */}
        <div className="flex items-center justify-between py-2 border-t border-[#F1F3F4] dark:border-[#3C4043]">
          <div>
            <div className="font-medium text-sm">Theme Appearance</div>
            <div className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
              Current theme: {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={onToggleTheme}
            icon={theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
        </div>

        {/* Done Button */}
        <div className="flex justify-end pt-3 border-t border-[#DADCE0] dark:border-[#3C4043]">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
