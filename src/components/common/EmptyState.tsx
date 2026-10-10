import React from 'react';
import { CheckCircle2, ListPlus } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  type?: 'tasks' | 'completed' | 'search';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'tasks',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const defaults = {
    tasks: {
      title: 'A fresh start',
      description: 'Anything to add? Tap + to add a task to your list.',
      icon: <CheckCircle2 size={44} className="text-[#1A73E8] dark:text-[#8AB4F8] opacity-80" />,
    },
    completed: {
      title: 'No completed tasks yet',
      description: 'Tasks marked as completed will appear here.',
      icon: <CheckCircle2 size={44} className="text-[#5F6368] dark:text-[#9AA0A6] opacity-60" />,
    },
    search: {
      title: 'No matching tasks found',
      description: 'Try adjusting your search terms or view all lists.',
      icon: <ListPlus size={44} className="text-[#5F6368] dark:text-[#9AA0A6] opacity-60" />,
    },
  }[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none">
      <div className="mb-4 p-4 rounded-full bg-[#E8F0FE] dark:bg-[#28364D]/50">
        {defaults.icon}
      </div>
      <h3 className="text-base font-semibold text-[#202124] dark:text-[#E8EAED] mb-1">
        {title || defaults.title}
      </h3>
      <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] max-w-sm mb-5 leading-relaxed">
        {description || defaults.description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
