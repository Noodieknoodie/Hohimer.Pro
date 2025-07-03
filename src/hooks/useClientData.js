import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { queryKeys } from '../store/queries';
/**
 * Hook to fetch all clients
 * @param {string} provider - Optional provider filter
 * @returns {Object} - Query result with clients data
 */
export const useClientList = (provider = null) => {
  return useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => api.clients.list(provider),
    staleTime: 1000 * 60 * 5,
  });
};
/**
 * Hook to fetch a single client by ID
 * @param {number} clientId - Client ID
 * @returns {Object} - Query result with client data
 */
export const useClient = (clientId) => {
  return useQuery({
    queryKey: queryKeys.clients.detail(clientId),
    queryFn: () => api.clients.get(clientId),
    enabled: !!clientId,
    staleTime: 1000 * 60,
  });
};
/**
 * Hook to fetch client contract
 * @param {number} clientId - Client ID
 * @returns {Object} - Query result with contract data
 */
export const useClientContract = (clientId) => {
  return useQuery({
    queryKey: queryKeys.clients.contract(clientId),
    queryFn: () => api.contracts.list(clientId),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 10,
  });
};
/**
 * Hook to fetch client dashboard data (replaces multiple API calls)
 * @param {number} clientId - Client ID
 * @returns {Object} - Query result with complete dashboard data
 */
export const useClientDashboard = (clientId) => {
  return useQuery({
    queryKey: queryKeys.clients.dashboard(clientId),
    queryFn: () => api.dashboard.get(clientId),
    enabled: !!clientId,
    staleTime: 1000 * 60,
  });
};
