import React from 'react';
import DatePicker from '../ui/DatePicker';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { PAYMENT_METHODS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatUtils';

/**
 * Form fields for payment entry/editing
 */
const PaymentFormFields = ({
  formValues,
  handleInputChange,
  periodOptions,
  isDisabled,
  isPeriodsLoading,
  contract,
  formErrors
}) => {
  // Format period options from the raw data
  const formattedPeriodOptions = periodOptions?.periods?.map(period => ({
    label: period.label,
    value: period.value
  })) || [];

  // Calculate expected fee based on contract type
  const calculateExpectedFee = () => {
    if (!contract) return null;
    
    if (contract.fee_type === 'flat') {
      return contract.flat_rate;
    } else if (contract.fee_type === 'percentage' && formValues.total_assets) {
      const assets = parseFloat(formValues.total_assets);
      if (!isNaN(assets) && contract.percent_rate) {
        return assets * contract.percent_rate;
      }
    }
    return null;
  };

  const expectedFee = calculateExpectedFee();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <DatePicker
          label="Received Date"
          value={formValues.received_date}
          onChange={(value) => handleInputChange('received_date', value)}
          required
          disabled={isDisabled}
          error={formErrors.received_date}
        />

        <Select
          label="Applied Period"
          options={formattedPeriodOptions}
          value={formValues.selected_period}
          onChange={(value) => handleInputChange('selected_period', value)}
          placeholder={isPeriodsLoading ? "Loading periods..." : "Select period"}
          required
          disabled={isDisabled || isPeriodsLoading}
          error={formErrors.selected_period}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Input
          label="Assets Under Management"
          type="text"
          value={formValues.total_assets}
          onChange={(value) => handleInputChange('total_assets', value)}
          placeholder="Enter AUM (optional)"
          prefix="$"
          disabled={isDisabled}
        />

        <Input
          label="Payment Amount"
          type="text"
          value={formValues.actual_fee}
          onChange={(value) => handleInputChange('actual_fee', value)}
          placeholder="Enter payment amount"
          prefix="$"
          required
          disabled={isDisabled}
          error={formErrors.actual_fee}
        />

        <Select
          label="Payment Method"
          options={PAYMENT_METHODS}
          value={formValues.method}
          onChange={(value) => handleInputChange('method', value)}
          placeholder="Select method (optional)"
          disabled={isDisabled}
        />
      </div>

      <div className="space-y-3 p-3 bg-gray-50 rounded-md">
        <Input
          label="Notes"
          type="text"
          value={formValues.notes}
          onChange={(value) => handleInputChange('notes', value)}
          placeholder="Enter any notes about this payment"
          disabled={isDisabled}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {/* Expected Fee Card */}
          {contract && (
            <div className="p-2 bg-blue-50 rounded text-sm">
              <div className="font-medium text-blue-800">Expected Fee:</div>
              <div className="text-blue-600">
                {expectedFee !== null
                  ? formatCurrency(expectedFee)
                  : (contract?.fee_type === 'percentage' ? 'Needs AUM data' : 'N/A')}
              </div>
              <div className="text-xs text-blue-500 mt-1">
                {contract?.fee_type === 'flat' 
                  ? 'Flat fee as specified in contract'
                  : contract?.percent_rate 
                    ? `${(contract.percent_rate * 100).toFixed(2)}% of AUM`
                    : 'Enter AUM to calculate expected fee'}
              </div>
            </div>
          )}

          {/* Next Payment Due - Moved to backend calculations */}
        </div>
      </div>
    </>
  );
};

export default PaymentFormFields;