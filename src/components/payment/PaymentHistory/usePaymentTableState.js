import { useState } from 'react';

export const usePaymentTableState = () => {
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const confirmDelete = (paymentId) => {
    setShowDeleteConfirm(paymentId);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // Generate available years for filter
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const availableYears = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      availableYears.push(y);
    }
    return availableYears;
  };

  return {
    // State
    page,
    year,
    showDeleteConfirm,
    
    // Setters
    setPage,
    setYear,
    
    // Actions
    confirmDelete,
    cancelDelete,
    
    // Utilities
    getAvailableYears
  };
};