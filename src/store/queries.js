import { QueryClient } from '@tanstack/react-query';
/**
 * Configured QueryClient for application-wide use
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        if (error?.message?.includes('API error') && error.message.includes('4')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        console.error('Query error:', error);
      }
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error?.message?.includes('API error') && error.message.includes('4')) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000)
    }
  },
});
/**
 * Centralized query keys for better cache management
 */
export const queryKeys = {
  clients: {
    all: ['clients'],
    detail: (id) => ['clients', id],
    contract: (id) => ['clients', id, 'contract'],
    payments: (id) => ['clients', id, 'payments'],
    summary: (id) => ['clients', id, 'summary'],
    files: (id) => ['clients', id, 'files'],
    dashboard: (id) => ['clients', id, 'dashboard'],
  },
  payments: {
    all: ['payments'],
    detail: (id) => ['payments', id],
    files: (id) => ['payments', id, 'files'],
  },
  contracts: {
    all: ['contracts'],
    detail: (id) => ['contracts', id],
    periods: (id, clientId) => ['contracts', id, 'periods', clientId],
  },
};
