import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
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
  return useQuery(
    [...queryKeys.clients.payments(clientId), page, limit, year],
    () => api.getPayments(clientId, params),
    {
      enabled: !!clientId,
      keepPreviousData: true,
      staleTime: 1000 * 60, 
      onError: (error) => {
        console.error(`Error fetching payments for client ${clientId}:`, error);
      }
    }
  );
};
/**
 * Hook to fetch a single payment
 * @param {number} paymentId - Payment ID
 * @returns {Object} - Query result with payment data
 */
export const usePayment = (paymentId) => {
  return useQuery(
    queryKeys.payments.detail(paymentId),
    () => api.getPayment(paymentId),
    {
      enabled: !!paymentId,
      staleTime: 1000 * 60, 
      onError: (error) => {
        console.error(`Error fetching payment ${paymentId}:`, error);
      }
    }
  );
};
/**
 * Hook to fetch available periods for a contract
 * @param {number} contractId - Contract ID
 * @param {number} clientId - Client ID
 * @returns {Object} - Query result with periods data
 */
export const useAvailablePeriods = (contractId, clientId) => {
  return useQuery(
    queryKeys.contracts.periods(contractId, clientId),
    () => api.getAvailablePeriods(contractId, clientId),
    {
      enabled: !!contractId && !!clientId,
      staleTime: 1000 * 60 * 60, 
      onError: (error) => {
        console.error(`Error fetching periods for contract ${contractId}:`, error);
      }
    }
  );
};
/**
 * Hook to create a new payment
 * @returns {Object} - Mutation object for creating payment
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (paymentData) => api.createPayment(paymentData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(queryKeys.clients.payments(data.client_id));
        queryClient.invalidateQueries(queryKeys.clients.summary(data.client_id));
        queryClient.invalidateQueries(queryKeys.clients.detail(data.client_id));
      },
      onError: (error) => {
        console.error('Error creating payment:', error);
      }
    }
  );
};
/**
 * Hook to update an existing payment
 * @returns {Object} - Mutation object for updating payment
 */
export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }) => api.updatePayment(id, data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(queryKeys.payments.detail(data.payment_id));
        queryClient.invalidateQueries(queryKeys.clients.payments(data.client_id));
        queryClient.invalidateQueries(queryKeys.clients.summary(data.client_id));
        queryClient.invalidateQueries(queryKeys.clients.detail(data.client_id));
        clearFileCache();
      },
      onError: (error) => {
        console.error('Error updating payment:', error);
      }
    }
  );
};
/**
 * Hook to delete a payment
 * @returns {Object} - Mutation object for deleting payment
 */
export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, clientId }) => api.deletePayment(id).then(() => ({ id, clientId })),
    {
      onSuccess: ({ id, clientId }) => {
        queryClient.invalidateQueries(queryKeys.clients.payments(clientId));
        queryClient.invalidateQueries(queryKeys.clients.summary(clientId));
        queryClient.invalidateQueries(queryKeys.clients.detail(clientId));
        clearFileCache();
      },
      onError: (error) => {
        console.error('Error deleting payment:', error);
      }
    }
  );
};
