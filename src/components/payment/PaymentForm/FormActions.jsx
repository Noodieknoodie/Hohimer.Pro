import React from 'react';
import Button from '../../ui/Button';
import ErrorDisplay from '../../ui/ErrorDisplay';

const FormActions = ({ 
  editingPayment, 
  isSubmitting, 
  submitError,
  onReset, 
  onSubmit 
}) => {
  return (
    <>
      {submitError && (
        <ErrorDisplay 
          title="Submission Error"
          error={submitError}
        />
      )}

      <div className="flex justify-end gap-3 mt-3">
        <Button
          variant="secondary"
          type="button"
          onClick={onReset}
          disabled={isSubmitting}
        >
          {editingPayment ? 'Cancel' : 'Clear Form'}
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? 'Submitting...' : editingPayment ? 'Update Payment' : 'Record Payment'}
        </Button>
      </div>
    </>
  );
};

export default FormActions;