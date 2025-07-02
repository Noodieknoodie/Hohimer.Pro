import { useState, useEffect } from 'react';

export const usePaymentFormState = (clientId, contract, periodsData, editingPayment, setIsFormDirty) => {
  // Initial form state
  const defaultFormValues = {
    received_date: new Date().toISOString().split('T')[0],
    total_assets: '',
    actual_fee: '',
    method: '',
    notes: '',
    is_split_payment: false,
    start_period: '',
    end_period: '',
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
    if (periodsData?.periods?.length && !formValues.start_period && !editingPayment) {
      const defaultPeriod = findDefaultPeriod();
      if (defaultPeriod) {
        setFormValues(prev => ({
          ...prev,
          start_period: defaultPeriod
        }));
      }
    }
  }, [periodsData, editingPayment, contract]);

  // Populate form when editing a payment
  useEffect(() => {
    if (editingPayment) {
      const isMonthlyPayment = editingPayment.applied_start_month !== null;

      const formattedValues = {
        received_date: editingPayment.received_date,
        total_assets: editingPayment.total_assets?.toString() || '',
        actual_fee: editingPayment.actual_fee?.toString() || '',
        method: editingPayment.method || '',
        notes: editingPayment.notes || '',
        is_split_payment: editingPayment.is_split_payment || false,
        start_period: isMonthlyPayment
          ? `${editingPayment.applied_start_month}-${editingPayment.applied_start_month_year}`
          : `${editingPayment.applied_start_quarter}-${editingPayment.applied_start_quarter_year}`,
        end_period: editingPayment.is_split_payment
          ? (isMonthlyPayment
            ? `${editingPayment.applied_end_month}-${editingPayment.applied_end_month_year}`
            : `${editingPayment.applied_end_quarter}-${editingPayment.applied_end_quarter_year}`)
          : '',
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

  const handleSplitToggle = () => {
    setFormValues(prev => ({
      ...prev,
      is_split_payment: !prev.is_split_payment,
      end_period: !prev.is_split_payment ? prev.start_period : ''
    }));
  };

  return {
    formValues,
    setFormValues,
    initialFormState,
    setInitialFormState,
    resetForm,
    handleInputChange,
    handleSplitToggle
  };
};