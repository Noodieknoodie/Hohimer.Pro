import React from 'react';
import ContractCard from './ContractCard';
import PaymentInfoCard from './PaymentInfoCard';
import ComplianceCard from './ComplianceCard';
import ErrorDisplay from '../ui/ErrorDisplay';
import { useClient, useClientContract, useClientDashboard } from '../../hooks/useClientData';
import { usePaymentHistory } from '../../hooks/usePaymentData';
import useStore from '../../store';

const ClientDashboard = ({ clientId }) => {
  const { documentViewerOpen } = useStore();

  // Fetch dashboard data (replaces multiple API calls)
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useClientDashboard(clientId);

  // Keep individual hooks for components that still need them
  const {
    data: client,
    isLoading: isClientLoading,
    error: clientError,
  } = useClient(clientId);

  const {
    data: contract,
    isLoading: isContractLoading,
    error: contractError,
  } = useClientContract(clientId);

  // Fetch latest payments for metrics calculation
  const {
    data: payments = [],
    isLoading: isPaymentsLoading,
    error: paymentsError,
  } = usePaymentHistory(clientId, { page: 1, limit: 5 });

  const isLoading = isClientLoading || isContractLoading || isPaymentsLoading || isDashboardLoading;
  const error = clientError || contractError || paymentsError || dashboardError;

  if (error) {
    return (
      <ErrorDisplay 
        title="Error loading client information"
        error={error}
      />
    );
  }

  // Determine layout based on document viewer state
  const cardLayoutClass = documentViewerOpen
    ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
    : "grid grid-cols-1 md:grid-cols-3 gap-6";

  return (
    <div className="space-y-6">
      <div className={cardLayoutClass}>
        <ContractCard
          contract={contract}
          isLoading={isLoading}
        />
        <PaymentInfoCard
          client={client}
          contract={contract}
          payments={payments}
          isLoading={isLoading}
        />
        <ComplianceCard
          dashboardData={dashboardData}
          isLoading={isDashboardLoading}
        />
      </div>
    </div>
  );
};

export default ClientDashboard;