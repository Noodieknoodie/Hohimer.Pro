import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { queryKeys } from '../store/queries';
import { clearFileCache } from './useFileData';
/**
 * Hook to fetch payment history for a client
 * @param {number} clientId - Client ID
 * @param {Object} options - Query options including pagination and filters
 * @returns {Object} - Query result with payments data
 */
export const usePaymentHistory = (clientId, options = {}) => {
  const { page = 1, limit = 10, year = null } = options;
  const params = { page, limit };
  if (year !== null) {
    params.year = year;
  }
  return useQuery({
    queryKey: [...queryKeys.clients.payments(clientId), page, limit, year],
    queryFn: () => api.payments.list(clientId, year),
    enabled: !!clientId,
    staleTime: 1000 * 60,
  });
};
/**
 * Hook to fetch a single payment
 * @param {number} paymentId - Payment ID
 * @returns {Object} - Query result with payment data
 */
export const usePayment = (paymentId) => {
  return useQuery({
    queryKey: queryKeys.payments.detail(paymentId),
    queryFn: () => api.payments.get(paymentId),
    enabled: !!paymentId,
    staleTime: 1000 * 60,
  });
};
/**
 * Hook to fetch available periods for a contract
 * @param {number} contractId - Contract ID
 * @param {number} clientId - Client ID
 * @returns {Object} - Query result with periods data
 */
export const useAvailablePeriods = (contractId, clientId) => {
  return useQuery({
    queryKey: queryKeys.contracts.periods(contractId, clientId),
    queryFn: () => api.periods.available(clientId, contractId),
    enabled: !!contractId && !!clientId,
    staleTime: 1000 * 60 * 60,
  });
};
/**
 * Hook to create a new payment
 * @returns {Object} - Mutation object for creating payment
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentData) => api.payments.create(paymentData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.payments(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.summary(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.client_id) });
    }
  });
};
/**
 * Hook to update an existing payment
 * @returns {Object} - Mutation object for updating payment
 */
export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.payments.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(data.payment_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.payments(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.summary(data.client_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(data.client_id) });
      clearFileCache();
    }
  });
};
/**
 * Hook to delete a payment
 * @returns {Object} - Mutation object for deleting payment
 */
export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, clientId }) => api.payments.delete(id).then(() => ({ id, clientId })),
    onSuccess: ({ id, clientId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.payments(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.summary(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      clearFileCache();
    }
  });
};
