import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { queryKeys } from '../store/queries';
/**
 * Hook to check if a payment has associated files
 * @param {number} paymentId - Payment ID
 * @param {Object} options - Additional query options
 * @returns {Object} - Query result for payment files
 */
export const usePaymentFiles = (paymentId, options = {}) => {
  const { enabled = true } = options;
  return useQuery(
    queryKeys.payments.files(paymentId),
    () => api.getPaymentFiles(paymentId),
    {
      enabled: !!paymentId && enabled,
      staleTime: 1000 * 60 * 5, 
      cacheTime: 1000 * 60 * 10, 
      retry: 1,
      onError: (error) => {
        console.error(`Error fetching files for payment ${paymentId}:`, error);
        return [];
      }
    }
  );
};
/**
 * Hook to check if a client has any associated files
 * @param {number} clientId - Client ID
 * @param {Object} options - Additional query options
 * @returns {Object} - Query result for client files check
 */
export const useClientFiles = (clientId, options = {}) => {
  const { enabled = true } = options;
  return useQuery(
    queryKeys.clients.files(clientId),
    () => api.checkClientFiles(clientId),
    {
      enabled: !!clientId && enabled,
      staleTime: 1000 * 60 * 5, 
      cacheTime: 1000 * 60 * 10, 
      retry: 1,
      onError: (error) => {
        console.error(`Error checking files for client ${clientId}:`, error);
      }
    }
  );
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
    const result = await api.checkPaymentFiles(paymentId);
    const hasFiles = !!result?.has_files;
    setPaymentFileStatus(paymentId, hasFiles);
    return hasFiles;
  } catch (error) {
    console.error(`Error checking files for payment ${paymentId}:`, error);
    return false;
  }
};
