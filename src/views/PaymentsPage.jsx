import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '../components/layout/PageLayout';
import ClientDashboard from '../components/payment/ClientDashboard';
import PaymentForm from '../components/payment/PaymentForm';
import PaymentHistory from '../components/payment/PaymentHistory';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import api from '../services/api';
import useStore from '../store';

const PaymentsPage = () => {
  const { selectedClientId, setSelectedClientId } = useStore();
  const [editingPayment, setEditingPayment] = useState(null);

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.clients.list()
  });

  useEffect(() => {
    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].client_id);
    }
  }, [clients, selectedClientId, setSelectedClientId]);

  if (!selectedClientId) {
    return (
      <PageLayout clients={clients} isLoading={isLoading}>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          Select a client from the sidebar
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout clients={clients} isLoading={isLoading}>
      <div className="space-y-6">
        <ClientDashboard clientId={selectedClientId} />
        <PaymentForm 
          clientId={selectedClientId} 
          editingPayment={editingPayment}
          onEditingPaymentChange={setEditingPayment}
        />
        <PaymentHistory 
          clientId={selectedClientId}
          editingPayment={editingPayment}
          onEditingPaymentChange={setEditingPayment}
        />
      </div>
    </PageLayout>
  );
};

export default PaymentsPage;