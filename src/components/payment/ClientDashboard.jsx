import React from 'react';
import ContractCard from './ContractCard';
import PaymentInfoCard from './PaymentInfoCard';
import ComplianceCard from './ComplianceCard';
import ErrorDisplay from '../ui/ErrorDisplay';
import { useClientDashboard } from '../../hooks/useClientData';
import useStore from '../../store';

const ClientDashboard = ({ clientId }) => {
  const { documentViewerOpen } = useStore();

  // Fetch dashboard data - single endpoint for all dashboard needs
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useClientDashboard(clientId);

  // Extract data from dashboard response
  const client = dashboardData?.client;
  const contract = dashboardData?.contract;
  const payments = dashboardData?.recent_payments || [];
  const metrics = dashboardData?.metrics;

  const isLoading = isDashboardLoading;
  const error = dashboardError;

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
          dashboardData={dashboardData}
          isLoading={isLoading}
        />
        <ComplianceCard
          dashboardData={dashboardData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ClientDashboard;