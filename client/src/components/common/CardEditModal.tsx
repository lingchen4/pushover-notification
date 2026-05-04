import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormField } from './FormField';

interface CardEditModalProps {
  open: boolean;
  onClose: () => void;
  cardTitle: string;
  formTitle: string;
  onFormTitleChange: (title: string) => void;
  onSave: () => void;
  onTestNotification: () => void;
  testingNotif: boolean;
  children: ReactNode;
}

export function CardEditModal({
  open,
  onClose,
  cardTitle,
  formTitle,
  onFormTitleChange,
  onSave,
  onTestNotification,
  testingNotif,
  children,
}: Readonly<CardEditModalProps>) {
  return (
    <Modal open={open} onClose={onClose} title={`Edit — ${cardTitle}`}>
      <div className="space-y-4">
        <FormField
          id="card-title"
          label="Card Title"
          type="text"
          value={formTitle}
          onChange={(e) => onFormTitleChange(e.target.value)}
        />
        {children}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={onTestNotification} disabled={testingNotif}>
            {testingNotif ? 'Sending…' : 'Test Notification'}
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 sm:flex-none" onClick={onSave}>Save</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
