import React from 'react';
import { formatDate, formatAppliedPeriod } from '../../../lib/dateUtils';
import { formatCurrency } from '../../../lib/formatUtils';
import StatusBadge from '../../ui/StatusBadge';

const PaymentTableRow = ({ 
  payment, 
  showDeleteConfirm,
  onEdit,
  onViewFile,
  onConfirmDelete,
  onCancelDelete,
  onDeleteClick,
  isDeleting
}) => {
  const expectedFee = payment.expected_fee;
  const variance = payment.variance || { status: 'unknown', message: 'N/A' };

  return (
    <tr className="hover:bg-light-200" data-payment-id={payment.payment_id}>
      <td className="py-2 px-1"></td>
      <td className="py-2 px-2 whitespace-nowrap">{formatDate(payment.received_date)}</td>
      <td className="py-2 px-2 truncate">{payment.provider_name || 'N/A'}</td>
      <td className="py-2 px-2 whitespace-nowrap">
        {formatAppliedPeriod(payment)}
      </td>
      <td className="py-2 px-2 whitespace-nowrap">
        {payment.total_assets ? formatCurrency(payment.total_assets) : 'N/A'}
      </td>
      <td className="py-2 px-2 whitespace-nowrap">
        {expectedFee !== null ? formatCurrency(expectedFee) : 'N/A'}
      </td>
      <td className="py-2 px-2 whitespace-nowrap font-medium">{formatCurrency(payment.actual_fee)}</td>
      <td className="py-2 px-2">
        <StatusBadge
          status={variance.status}
          label={variance.message}
          size="md"
        />
      </td>
      <td className="py-2 px-1">
        <div className="grid grid-cols-3 gap-1 justify-items-center">
          <div className="w-6">
            {payment.has_files && (
              <button
                onClick={() => onViewFile(payment)}
                className="text-blue-500 hover:text-blue-600 transition-colors file-indicator"
                title="View document"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </button>
            )}
          </div>
          <div className="w-6">
            <button
              onClick={() => onEdit(payment)}
              className="text-dark-500 hover:text-primary-600 transition-colors"
              aria-label="Edit payment"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
          <div className="w-6">
            {showDeleteConfirm === payment.payment_id ? (
              <div className="flex items-center">
                <button
                  className="text-dark-500 hover:text-status-success transition-colors"
                  onClick={() => onConfirmDelete(payment.payment_id)}
                  disabled={isDeleting}
                  aria-label="Confirm delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
                <button
                  className="text-dark-500 hover:text-dark-700 ml-1 transition-colors"
                  onClick={onCancelDelete}
                  aria-label="Cancel delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onDeleteClick(payment.payment_id)}
                className="text-dark-500 hover:text-status-error transition-colors"
                aria-label="Delete payment"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default PaymentTableRow;