import React from 'react';
import Card from '../ui/Card';
import { formatCurrency } from '../../lib/formatUtils';
import { formatDate } from '../../lib/dateUtils';
import { MONTH_NAMES } from '../../lib/constants';

const PaymentInfoCard = ({ dashboardData, isLoading }) => {
  if (isLoading) {
    return (
      <Card variant="default" elevation="default">
        <div className="pb-2">
          <h3 className="text-base font-semibold text-dark-700 border-b border-light-300 pb-2">Payment Information</h3>
        </div>
        <div className="animate-pulse mt-3">
          <div className="grid grid-cols-1 gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between py-1">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Extract data from dashboard response
  const metrics = dashboardData?.metrics || {};
  const paymentStatus = dashboardData?.payment_status || {};
  const payments = dashboardData?.recent_payments || [];
  
  // Get latest payment data
  const latestPayment = payments.length > 0 ? payments[0] : null;
  
  // Use metrics from dashboard API
  const lastRecordedAUM = metrics.last_recorded_assets;
  const currentPeriod = paymentStatus.current_period || 'N/A';
  const expectedFee = paymentStatus.expected_fee;
  const isPaid = paymentStatus.status === 'Paid';

  const details = [
    {
      label: 'AUM',
      value: lastRecordedAUM ? formatCurrency(lastRecordedAUM) : 'No AUM data',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark-400">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      label: 'Expected Fee',
      value: expectedFee ? formatCurrency(expectedFee) : 'N/A',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark-400">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      )
    },
    {
      label: 'Last Payment',
      value: paymentStatus.last_payment_date ? formatDate(paymentStatus.last_payment_date) : 'No payments recorded',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark-400">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    {
      label: 'Last Payment Amount',
      value: paymentStatus.last_payment_amount ? formatCurrency(paymentStatus.last_payment_amount) : 'N/A',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark-400">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      label: 'Current Period',
      value: currentPeriod,
      highlight: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    {
      label: 'Payment Status',
      value: paymentStatus.status || 'Due',
      highlight: !isPaid,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={!isPaid ? 'text-amber-500' : 'text-green-500'}>
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      label: 'YTD Payments',
      value: metrics.total_ytd_payments ? formatCurrency(metrics.total_ytd_payments) : 'N/A',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark-400">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      )
    },
  ];

  return (
    <Card variant="default" elevation="default">
      <div className="pb-2">
        <h3 className="text-base font-semibold text-dark-700 border-b border-light-300 pb-2">Payment Information</h3>
      </div>
      <dl className="grid grid-cols-1 gap-2 text-sm mt-4">
        {details.map((item, idx) => (
          <div
            key={idx}
            className={`
              flex justify-between items-center py-1.5 px-2 -mx-2 rounded
              ${item.highlight ? 'bg-light-200 border border-light-400' : ''}
            `}
          >
            <dt className="text-dark-500 flex items-center gap-2">
              {item.icon}
              {item.label}
            </dt>
            <dd className={`font-medium ${item.highlight ? 'text-primary-600' : 'text-dark-700'}`}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};

export default PaymentInfoCard;