import React from 'react';
import Select from '../ui/Select';

/**
 * Period selection controls for split payments
 */
const SplitPaymentControls = ({
  isSplitPayment,
  startPeriod,
  endPeriod,
  periodOptions,
  handleSplitToggle,
  handlePeriodChange,
  isDisabled,
  errors
}) => {
  const filteredEndPeriods = React.useMemo(() => {
    if (!startPeriod || !periodOptions) {
      return periodOptions || [];
    }

    // Only show periods that are after or equal to the start period
    const startParts = startPeriod.split('-');
    if (startParts.length !== 2) return periodOptions;

    const startMonth = parseInt(startParts[0], 10);
    const startYear = parseInt(startParts[1], 10);

    return periodOptions.filter(period => {
      const parts = period.value.split('-');
      if (parts.length !== 2) return true;

      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);

      return (year > startYear) || (year === startYear && month >= startMonth);
    });
  }, [startPeriod, periodOptions]);

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Applied Period</label>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Single</span>
          <button
            type="button"
            className={`h-5 w-10 rounded-full relative ${isSplitPayment ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            onClick={handleSplitToggle}
            disabled={isDisabled || !startPeriod}
            aria-label={isSplitPayment ? 'Switch to single period' : 'Switch to split period'}
          >
            <div
              className={`absolute w-3 h-3 rounded-full bg-white top-1 transition-transform ${isSplitPayment ? 'translate-x-5' : 'translate-x-1'
                }`}
            ></div>
          </button>
          <span className="text-sm text-gray-500">Split</span>
        </div>
      </div>

      <div className={`${isSplitPayment ? 'grid grid-cols-2 gap-2' : 'w-full'}`}>
        <Select
          options={periodOptions || []}
          value={startPeriod}
          onChange={(value) => handlePeriodChange('start_period', value)}
          placeholder="Select period"
          disabled={isDisabled}
          required
          error={errors?.start_period}
        />

        {isSplitPayment && (
          <Select
            options={filteredEndPeriods}
            value={endPeriod}
            onChange={(value) => handlePeriodChange('end_period', value)}
            placeholder="End period"
            disabled={isDisabled || !startPeriod}
            required
            error={errors?.end_period}
          />
        )}
      </div>
    </div>
  );
};

export default SplitPaymentControls;