import React from 'react';
import Card from '../ui/Card';
import { formatCurrency, generateFeeReferences } from '../../lib/formatUtils';

const ComplianceCard = ({ dashboardData, isLoading }) => {
  if (isLoading) {
    return (
      <Card variant="default" elevation="default">
        <div className="pb-2">
          <h3 className="text-base font-semibold text-dark-700 border-b border-light-300 pb-2">Payment Status</h3>
        </div>
        <div className="animate-pulse flex flex-col md:flex-row gap-4 mt-3">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Use data from dashboard API
  const paymentStatus = dashboardData?.payment_status?.status || 'Due';
  const currentPeriod = dashboardData?.payment_status?.current_period || 'N/A';
  const compliance = dashboardData?.compliance;
  const contract = dashboardData?.contract;
  const client = dashboardData?.client;

  // Payment status background color (binary: green or yellow)
  const getStatusBgColor = () => {
    if (paymentStatus === 'Paid') return 'bg-green-50 border-green-200 text-green-700';
    return 'bg-yellow-50 border-yellow-200 text-yellow-700'; // Due
  };

  // Payment status text
  const getStatusText = () => {
    if (paymentStatus === 'Paid') return 'Up to Date';
    return 'Payment Due';
  };

  // Get last recorded AUM for fee reference calculations
  const lastRecordedAUM = dashboardData?.recent_payments?.find(p => p.total_assets)?.total_assets || null;
  const feeReferences = contract ? generateFeeReferences(contract, lastRecordedAUM) : null;

  return (
    <Card variant="default" elevation="default">
      <div className="pb-2">
        <h3 className="text-base font-semibold text-dark-700 border-b border-light-300 pb-2">Payment Status</h3>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {/* Payment Status Indicator */}
        <div className="flex-1">
          <div className={`rounded border p-3 ${getStatusBgColor()}`}>
            <div className="flex items-center gap-2">
              <StatusIcon status={paymentStatus === 'Paid' ? "green" : "yellow"} />
              <span className="font-medium">{getStatusText()}</span>
            </div>
            {/* Current Period Status */}
            <div className="mt-2 text-sm">
              <span className="font-medium">Current Period:</span> {currentPeriod}
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white bg-opacity-50">
                {paymentStatus}
              </span>
            </div>
            {/* Compliance Reason from backend */}
            {compliance?.reason && (
              <div className="mt-2 text-sm italic">
                {compliance.reason}
              </div>
            )}
          </div>

          {/* Contract info */}
          {contract && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-dark-500">
                <span className="font-medium">Schedule:</span> {contract.payment_schedule === 'monthly' ? 'Monthly' : 'Quarterly'}
              </div>
              <div className="text-dark-500">
                <span className="font-medium">Fee Type:</span> {contract.fee_type === 'flat' ? 'Flat' : 'Percentage'}
              </div>
            </div>
          )}
        </div>

        {/* Fee Reference */}
        {feeReferences && (
          <div className="mt-2 border-t border-light-300 pt-3">
            <h4 className="text-sm font-medium text-dark-600 mb-2">Fee Reference</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-light-200 p-2 rounded text-center">
                <div className="text-xs text-dark-500">Monthly</div>
                <div className="font-medium text-dark-700">{feeReferences.monthly}</div>
              </div>
              <div className="bg-light-200 p-2 rounded text-center">
                <div className="text-xs text-dark-500">Quarterly</div>
                <div className="font-medium text-dark-700">{feeReferences.quarterly}</div>
              </div>
              <div className="bg-light-200 p-2 rounded text-center">
                <div className="text-xs text-dark-500">Annual</div>
                <div className="font-medium text-dark-700">{feeReferences.annual}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Status Icon Component (binary: green or yellow only)
const StatusIcon = ({ status }) => {
  if (status === 'green') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    );
  }
  // Default to yellow for 'Due' status
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
};

export default ComplianceCard;