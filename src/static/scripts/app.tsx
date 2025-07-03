import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '../../components/ErrorBoundary';
import LaunchMenu from '../../components/LaunchMenu';
import ClientDashboard from '../../components/payment/ClientDashboard';
import UnderConstruction from '../../components/UnderConstruction';

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-light-bg">
            <Routes>
              <Route path="/" element={<LaunchMenu />} />
              <Route path="/payments" element={<ClientDashboard />} />
              <Route path="/under-construction" element={<UnderConstruction />} />
              <Route path="/agenda" element={<UnderConstruction />} />
              <Route path="/efip" element={<UnderConstruction />} />
              <Route path="/structured-notes" element={<UnderConstruction />} />
              <Route path="/ai-tools" element={<UnderConstruction />} />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;