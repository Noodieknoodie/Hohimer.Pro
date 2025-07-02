import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { queryKeys } from '../store/queries';
/**
 * Hook to fetch all clients
 * @param {string} provider - Optional provider filter
 * @returns {Object} - Query result with clients data
 */
export const useClientList = (provider = null) => {
  return useQuery(
    queryKeys.clients.all,
    () => api.getClients(provider ? { provider } : undefined),
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5, 
    }
  );
};
/**
 * Hook to fetch a single client by ID
 * @param {number} clientId - Client ID
 * @returns {Object} - Query result with client data
 */
export const useClient = (clientId) => {
  return useQuery(
    queryKeys.clients.detail(clientId),
    () => api.getClient(clientId),
    {
      enabled: !!clientId,
      staleTime: 1000 * 60, 
      onError: (error) => {
        console.error(`Error fetching client ${clientId}:`, error);
      },
    }
  );
};
/**
 * Hook to fetch client contract
 * @param {number} clientId - Client ID
 * @returns {Object} - Query result with contract data
 */
export const useClientContract = (clientId) => {
  return useQuery(
    queryKeys.clients.contract(clientId),
    () => api.getClientContract(clientId),
    {
      enabled: !!clientId,
      staleTime: 1000 * 60 * 10, 
      onError: (error) => {
        console.error(`Error fetching contract for client ${clientId}:`, error);
      },
    }
  );
};
/**
 * Hook to fetch client dashboard data (replaces multiple API calls)
 * @param {number} clientId - Client ID
 * @returns {Object} - Query result with complete dashboard data
 */
export const useClientDashboard = (clientId) => {
  return useQuery(
    queryKeys.clients.dashboard(clientId),
    () => api.getClientDashboard(clientId),
    {
      enabled: !!clientId,
      staleTime: 1000 * 60, 
      onError: (error) => {
        console.error(`Error fetching dashboard for client ${clientId}:`, error);
      },
    }
  );
};
