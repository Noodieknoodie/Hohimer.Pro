import React from 'react';
import Card from './Card';
import Button from './Button';

const ConfirmDialog = ({ 
  isOpen = true,
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  onConfirm, 
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-dark-800 bg-opacity-75 flex items-center justify-center z-50">
      <Card className="max-w-md w-full" elevation="default">
        <div className="p-4">
          <h3 className="text-lg font-medium mb-2 text-dark-700">{title}</h3>
          <p className="mb-3 text-dark-500">{message}</p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmDialog;