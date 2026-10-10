import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { TaskList } from '../../types/list';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingList?: TaskList | null;
  onSave: (name: string) => Promise<unknown>;
}

export const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  editingList,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingList) {
      setName(editingList.name);
    } else {
      setName('');
    }
  }, [editingList, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSave(name.trim());
      setName('');
      onClose();
    } catch (err) {
      console.error('Failed to save list:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingList ? 'Rename list' : 'Create new list'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="List name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Grocery, Project Alpha"
          autoFocus
          required
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="text" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!name.trim() || isSubmitting}
          >
            {editingList ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
