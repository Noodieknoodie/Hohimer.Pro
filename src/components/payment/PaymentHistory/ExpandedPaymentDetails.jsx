import React from 'react';
import { formatPeriodRange } from '../../../lib/dateUtils';
import { formatCurrency } from '../../../lib/formatUtils';

const ExpandedPaymentDetails = ({ payment }) => {
  if (!payment.is_split_payment) {
    return null;
  }

  return (
    <tr>
      <td className="py-0"></td>
      <td colSpan="8" className="py-0">
        <div className="bg-light-200 p-2 my-1 rounded-md">
          <h4 className="text-sm font-medium text-dark-700 mb-2">
            {formatPeriodRange(payment)}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {payment.periods?.map((period, i) => (
              <div
                key={i}
                className="bg-white p-2 rounded border border-light-300 shadow-sm"
              >
                <div className="text-xs text-dark-500">
                  {period.period}
                </div>
                <div className="text-sm font-medium">
                  {formatCurrency(period.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default ExpandedPaymentDetails;