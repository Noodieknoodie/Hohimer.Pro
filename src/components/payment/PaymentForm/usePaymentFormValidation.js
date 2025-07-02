import { useState } from 'react';

export const usePaymentFormValidation = () => {
  const [formErrors, setFormErrors] = useState({});

  const validateForm = (formValues) => {
    const errors = {};

    if (!formValues.received_date) {
      errors.received_date = 'Received date is required';
    }

    if (!formValues.actual_fee) {
      errors.actual_fee = 'Payment amount is required';
    } else if (isNaN(parseFloat(formValues.actual_fee))) {
      errors.actual_fee = 'Payment amount must be a number';
    }

    if (!formValues.start_period) {
      errors.start_period = 'Applied period is required';
    }

    if (formValues.is_split_payment && !formValues.end_period) {
      errors.end_period = 'End period is required for split payments';
    }

    return errors;
  };

  const clearFieldError = (field) => {
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const clearAllErrors = () => {
    setFormErrors({});
  };

  return {
    formErrors,
    setFormErrors,
    validateForm,
    clearFieldError,
    clearAllErrors
  };
};