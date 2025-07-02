import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientDashboard from '../../components/payment/ClientDashboard';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-light-bg">
        <ClientDashboard />
      </div>
    </QueryClientProvider>
  );
}

export default App;