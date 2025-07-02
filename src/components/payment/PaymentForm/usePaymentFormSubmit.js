import { useCreatePayment, useUpdatePayment } from '../../../hooks/usePaymentData';

export const usePaymentFormSubmit = (clientId, contract, editingPayment, resetForm) => {
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();

  const handleSubmit = (formValues, setFormErrors, validateForm) => {
    const errors = validateForm(formValues);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Parse selected period
    const periodParts = formValues.selected_period.split('-');
    const period = parseInt(periodParts[0], 10);
    const year = parseInt(periodParts[1], 10);

    // Prepare payment data from form values
    const paymentData = {
      contract_id: contract.contract_id,
      client_id: clientId,
      received_date: formValues.received_date,
      total_assets: formValues.total_assets ? parseFloat(formValues.total_assets) : null,
      actual_fee: parseFloat(formValues.actual_fee),
      method: formValues.method || null,
      notes: formValues.notes || null,
      applied_period_type: contract.payment_schedule,
      applied_period: period,
      applied_year: year
    };

    // Update or create payment
    if (editingPayment) {
      updatePaymentMutation.mutate(
        { id: editingPayment.payment_id, data: paymentData },
        {
          onSuccess: () => {
            resetForm();
          },
        }
      );
    } else {
      createPaymentMutation.mutate(paymentData, {
        onSuccess: () => {
          resetForm();
        },
      });
    }
  };

  return {
    handleSubmit,
    createPaymentMutation,
    updatePaymentMutation,
    isSubmitting: createPaymentMutation.isLoading || updatePaymentMutation.isLoading,
    submitError: createPaymentMutation.error || updatePaymentMutation.error
  };
};