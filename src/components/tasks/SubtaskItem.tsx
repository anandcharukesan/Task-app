import React, { useState } from 'react';
import { Subtask } from '../../types/task';
import { Checkbox } from '../common/Checkbox';
import { IconButton } from '../common/IconButton';
import { Trash2 } from 'lucide-react';

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (completed: boolean) => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  onToggle,
  onUpdateTitle,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);

  const handleBlur = () => {
    setIsEditing(false);
    if (title.trim() && title !== subtask.title) {
      onUpdateTitle(title.trim());
    } else {
      setTitle(subtask.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="group flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[#F1F3F4] dark:hover:bg-[#303134] transition-colors">
      <Checkbox
        size="sm"
        checked={subtask.completed}
        onChange={onToggle}
        aria-label={`Mark subtask "${subtask.title}" as ${subtask.completed ? 'incomplete' : 'completed'}`}
      />
      {isEditing ? (
        <input
          type="text"
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 text-xs bg-transparent border-b border-[#1A73E8] text-[#202124] dark:text-[#E8EAED] outline-none"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-xs cursor-text transition-colors ${
            subtask.completed
              ? 'line-through text-[#80868B] dark:text-[#9AA0A6]'
              : 'text-[#202124] dark:text-[#E8EAED]'
          }`}
        >
          {subtask.title}
        </span>
      )}
      <IconButton
        icon={<Trash2 size={14} />}
        aria-label="Delete subtask"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 text-[#5F6368] hover:text-[#D93025]"
      />
    </div>
  );
};
