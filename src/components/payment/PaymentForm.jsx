import React, { useState } from 'react';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { useClientContract } from '../../hooks/useClientData';
import { useAvailablePeriods } from '../../hooks/usePaymentData';
import PaymentFormFields from './PaymentFormFields';
import ConfirmDialog from '../ui/ConfirmDialog';
import FormActions from './PaymentForm/FormActions';
import { usePaymentFormState } from './PaymentForm/usePaymentFormState';
import { usePaymentFormValidation } from './PaymentForm/usePaymentFormValidation';
import { usePaymentFormSubmit } from './PaymentForm/usePaymentFormSubmit';
const PaymentForm = ({ clientId, editingPayment, onEditingPaymentChange }) => {
  const { data: contract, isLoading: isContractLoading } = useClientContract(clientId);
  const { data: periodsData, isLoading: isPeriodsLoading } = useAvailablePeriods(
    contract?.contract_id,
    clientId,
    { enabled: !!contract?.contract_id && !!clientId }
  );

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Custom hooks for form management
  const {
    formValues,
    resetForm,
    handleInputChange,
    handleSplitToggle
  } = usePaymentFormState(clientId, contract, periodsData, editingPayment, setIsFormDirty);

  const {
    formErrors,
    setFormErrors,
    validateForm,
    clearFieldError,
    clearAllErrors
  } = usePaymentFormValidation();

  const {
    handleSubmit,
    isSubmitting,
    submitError
  } = usePaymentFormSubmit(clientId, contract, editingPayment, () => {
    resetForm();
    clearAllErrors();
  });

  // Enhanced input change handler with error clearing
  const handleInputChangeWithValidation = (field, value) => {
    handleInputChange(field, value);
    clearFieldError(field);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(formValues, setFormErrors, validateForm);
  };

  const handleReset = () => {
    if (isFormDirty) {
      setShowConfirmDialog(true);
    } else {
      resetForm();
      clearAllErrors();
    }
  };

  const clearEditingPayment = () => {
    if (onEditingPaymentChange) {
      onEditingPaymentChange(null);
    }
  };

  const handleCancelEdit = () => {
    if (isFormDirty) {
      setShowConfirmDialog(true);
    } else {
      clearEditingPayment();
    }
  };

  const handleConfirmReset = () => {
    resetForm();
    clearAllErrors();
    setShowConfirmDialog(false);
    if (editingPayment) {
      clearEditingPayment();
    }
  };

  const isDisabled = !clientId || !contract;

  return (
    <div className={`animate-fade-in relative ${editingPayment ? 'form-focus' : ''}`}>
      <Card className="p-4 mb-4 relative z-10" elevation={editingPayment ? "raised" : "default"}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-dark-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark-500 mr-2">
              <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {editingPayment ? 'Edit Payment' : 'Record New Payment'}
          </h2>

          {editingPayment && (
            <button
              onClick={handleCancelEdit}
              className="text-sm text-dark-500 hover:text-dark-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel Edit
            </button>
          )}
        </div>

        {isContractLoading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : !contract ? (
          <EmptyState 
            title="Select a client"
            message="Please select a client to add payment details"
            className="py-6"
          />
        ) : (
          <>
            <ConfirmDialog
              isOpen={showConfirmDialog}
              title="Unsaved Changes"
              message="You have unsaved changes. Are you sure you want to clear the form?"
              confirmText="Clear Form"
              cancelText="Cancel"
              confirmVariant="danger"
              onConfirm={handleConfirmReset}
              onCancel={() => setShowConfirmDialog(false)}
            />

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <PaymentFormFields
                formValues={formValues}
                handleInputChange={handleInputChangeWithValidation}
                handleSplitToggle={handleSplitToggle}
                periodOptions={periodsData}
                isDisabled={isDisabled}
                isPeriodsLoading={isPeriodsLoading}
                contract={contract}
                formErrors={formErrors}
              />

              <FormActions
                editingPayment={editingPayment}
                isSubmitting={isSubmitting}
                submitError={submitError}
                onReset={handleReset}
                onSubmit={handleFormSubmit}
              />
            </form>
          </>
        )}
      </Card>

      {editingPayment && (
        <div className="fixed inset-0 bg-dark-800 bg-opacity-30 z-0" />
      )}
    </div>
  );
};

export default PaymentForm;