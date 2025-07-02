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

    // Prepare payment data from form values
    const paymentData = {
      contract_id: contract.contract_id,
      client_id: clientId,
      received_date: formValues.received_date,
      total_assets: formValues.total_assets ? parseFloat(formValues.total_assets) : null,
      actual_fee: parseFloat(formValues.actual_fee),
      method: formValues.method || null,
      notes: formValues.notes || null,
    };

    // Parse period values
    const isMonthly = contract.payment_schedule === 'monthly';
    const startPeriodParts = formValues.start_period.split('-');

    if (isMonthly) {
      // Set monthly fields
      paymentData.applied_start_month = parseInt(startPeriodParts[0], 10);
      paymentData.applied_start_month_year = parseInt(startPeriodParts[1], 10);

      if (formValues.is_split_payment && formValues.end_period) {
        const endPeriodParts = formValues.end_period.split('-');
        paymentData.applied_end_month = parseInt(endPeriodParts[0], 10);
        paymentData.applied_end_month_year = parseInt(endPeriodParts[1], 10);
      } else {
        // Single month payment
        paymentData.applied_end_month = paymentData.applied_start_month;
        paymentData.applied_end_month_year = paymentData.applied_start_month_year;
      }
    } else {
      // Set quarterly fields
      paymentData.applied_start_quarter = parseInt(startPeriodParts[0], 10);
      paymentData.applied_start_quarter_year = parseInt(startPeriodParts[1], 10);

      if (formValues.is_split_payment && formValues.end_period) {
        const endPeriodParts = formValues.end_period.split('-');
        paymentData.applied_end_quarter = parseInt(endPeriodParts[0], 10);
        paymentData.applied_end_quarter_year = parseInt(endPeriodParts[1], 10);
      } else {
        // Single quarter payment
        paymentData.applied_end_quarter = paymentData.applied_start_quarter;
        paymentData.applied_end_quarter_year = paymentData.applied_start_quarter_year;
      }
    }

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