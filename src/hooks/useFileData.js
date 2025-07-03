import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { queryKeys } from '../store/queries';
/**
 * Hook to check if a payment has associated files
 * @param {number} paymentId - Payment ID
 * @param {Object} options - Additional query options
 * @returns {Object} - Query result for payment files
 */
export const usePaymentFiles = (paymentId, options = {}) => {
  const { enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.payments.files(paymentId),
    queryFn: () => Promise.resolve([]), // TODO: Implement api.payments.files when backend ready
    enabled: !!paymentId && enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10, // v5 uses gcTime instead of cacheTime
    retry: 1,
  });
};
/**
 * Hook to check if a client has any associated files
 * @param {number} clientId - Client ID
 * @param {Object} options - Additional query options
 * @returns {Object} - Query result for client files check
 */
export const useClientFiles = (clientId, options = {}) => {
  const { enabled = true } = options;
  return useQuery({
    queryKey: queryKeys.clients.files(clientId),
    queryFn: () => Promise.resolve({ has_files: false }), // TODO: Implement api.clients.files when backend ready
    enabled: !!clientId && enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10, // v5 uses gcTime instead of cacheTime
    retry: 1,
  });
};
/**
 * Cache for payment file status to reduce API calls
 */
const paymentFileCache = new Map();
/**
 * Set file status for a payment in the cache
 * @param {number} paymentId - Payment ID
 * @param {boolean} hasFiles - Whether the payment has files
 */
export const setPaymentFileStatus = (paymentId, hasFiles) => {
  paymentFileCache.set(paymentId, !!hasFiles);
};
/**
 * Get file status for a payment from the cache
 * @param {number} paymentId - Payment ID
 * @returns {boolean|undefined} - True if has files, false if not, undefined if not in cache
 */
export const getPaymentFileStatus = (paymentId) => {
  return paymentFileCache.has(paymentId) 
    ? paymentFileCache.get(paymentId) 
    : undefined;
};
/**
 * Clear file status cache
 */
export const clearFileCache = () => {
  paymentFileCache.clear();
};
/**
 * Check if a payment has files with cache support
 * @param {number} paymentId - Payment ID
 * @returns {Promise<boolean>} - Promise resolving to true if payment has files
 */
export const checkPaymentHasFiles = async (paymentId) => {
  if (paymentFileCache.has(paymentId)) {
    return paymentFileCache.get(paymentId);
  }
  try {
    // TODO: Implement api.payments.checkFiles when backend ready
    const hasFiles = false; // Placeholder
    setPaymentFileStatus(paymentId, hasFiles);
    return hasFiles;
  } catch (error) {
    return false;
  }
};
