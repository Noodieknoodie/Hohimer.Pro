import { useState, useEffect } from 'react';

export const usePaymentFormState = (clientId, contract, periodsData, editingPayment, setIsFormDirty) => {
  // Initial form state
  const defaultFormValues = {
    received_date: new Date().toISOString().split('T')[0],
    total_assets: '',
    actual_fee: '',
    method: '',
    notes: '',
    selected_period: '',
  };

  const [formValues, setFormValues] = useState(defaultFormValues);
  const [initialFormState, setInitialFormState] = useState(defaultFormValues);

  // Reset form when client changes or when editing payment changes
  useEffect(() => {
    if (clientId && !editingPayment) {
      resetForm();
    }
  }, [clientId]);

  // Find default period (previous month/quarter)
  const findDefaultPeriod = () => {
    if (!periodsData?.periods?.length || !contract?.payment_schedule) {
      return '';
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-indexed
    const currentYear = today.getFullYear();

    if (contract.payment_schedule === 'monthly') {
      // Default to previous month
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const periodValue = `${prevMonth}-${prevYear}`;

      const foundPeriod = periodsData.periods.find(p => p.value === periodValue);
      return foundPeriod ? foundPeriod.value : periodsData.periods[0].value;
    } else {
      // Default to previous quarter
      const currentQuarter = Math.ceil(currentMonth / 3);
      const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
      const prevYear = currentQuarter === 1 ? currentYear - 1 : currentYear;
      const periodValue = `${prevQuarter}-${prevYear}`;

      const foundPeriod = periodsData.periods.find(p => p.value === periodValue);
      return foundPeriod ? foundPeriod.value : periodsData.periods[0].value;
    }
  };

  // Set default period when periods data is loaded
  useEffect(() => {
    if (periodsData?.periods?.length && !formValues.selected_period && !editingPayment) {
      const defaultPeriod = findDefaultPeriod();
      if (defaultPeriod) {
        setFormValues(prev => ({
          ...prev,
          selected_period: defaultPeriod
        }));
      }
    }
  }, [periodsData, editingPayment, contract]);

  // Populate form when editing a payment
  useEffect(() => {
    if (editingPayment) {
      const formattedValues = {
        received_date: editingPayment.received_date,
        total_assets: editingPayment.total_assets?.toString() || '',
        actual_fee: editingPayment.actual_fee?.toString() || '',
        method: editingPayment.method || '',
        notes: editingPayment.notes || '',
        selected_period: `${editingPayment.applied_period}-${editingPayment.applied_year}`,
      };

      setFormValues(formattedValues);
      setInitialFormState({ ...formattedValues });
      setIsFormDirty && setIsFormDirty(false);
    }
  }, [editingPayment, setIsFormDirty]);

  // Check if form is dirty on any input change
  useEffect(() => {
    const isDirty = JSON.stringify(formValues) !== JSON.stringify(initialFormState);
    setIsFormDirty && setIsFormDirty(isDirty);
  }, [formValues, initialFormState, setIsFormDirty]);

  const resetForm = () => {
    setFormValues({ ...defaultFormValues });
    setInitialFormState({ ...defaultFormValues });
    setIsFormDirty && setIsFormDirty(false);
  };

  const handleInputChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return {
    formValues,
    setFormValues,
    initialFormState,
    setInitialFormState,
    resetForm,
    handleInputChange
  };
};