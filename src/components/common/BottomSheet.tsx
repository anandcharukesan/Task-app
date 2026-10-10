import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl mx-auto bg-white dark:bg-[#292A2D] rounded-t-3xl shadow-2xl border-t border-[#DADCE0] dark:border-[#3C4043] z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250 ease-out"
      >
        {/* Handle bar */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-10 h-1.25 bg-[#DADCE0] dark:bg-[#5F6368] rounded-full cursor-grab" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#DADCE0] dark:border-[#3C4043]">
            <h3 className="text-base font-semibold text-[#202124] dark:text-[#E8EAED]">
              {title}
            </h3>
            <IconButton icon={<X size={18} />} aria-label="Close" onClick={onClose} size="sm" />
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
