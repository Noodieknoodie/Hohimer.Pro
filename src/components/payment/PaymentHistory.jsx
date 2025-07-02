import React from 'react';
import { usePaymentHistory, useDeletePayment } from '../../hooks/usePaymentData';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import ErrorDisplay from '../ui/ErrorDisplay';
import ConfirmDialog from '../ui/ConfirmDialog';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PaymentTableRow from './PaymentHistory/PaymentTableRow';
import { usePaymentTableState } from './PaymentHistory/usePaymentTableState';
import useStore from '../../store';

const PaymentHistory = ({ clientId, editingPayment, onEditingPaymentChange }) => {
  const { setDocumentViewerOpen, setSelectedDocumentUrl } = useStore();
  
  const {
    page,
    year,
    showDeleteConfirm,
    setPage,
    setYear,
    confirmDelete,
    cancelDelete,
    getAvailableYears
  } = usePaymentTableState();

  const {
    data: payments = [],
    isLoading,
    error,
    isPreviousData,
  } = usePaymentHistory(clientId, { page, limit: 10, year });

  const deletePaymentMutation = useDeletePayment();

  const handleEdit = (payment) => {
    onEditingPaymentChange && onEditingPaymentChange(payment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (paymentId) => {
    deletePaymentMutation.mutate({ id: paymentId, clientId });
    cancelDelete();
  };

  const handleViewFile = (payment) => {
    if (payment.has_files) {
      setSelectedDocumentUrl(`/api/files/payment/${payment.payment_id}`);
      setDocumentViewerOpen(true);
    }
  };

  const availableYears = getAvailableYears();

  if (error) {
    return (
      <ErrorDisplay 
        title="Error loading payment history"
        error={error}
      />
    );
  }

  return (
    <div className="animate-fade-in mt-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-dark-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark-500 mr-2">
            <path d="M19 5H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z"></path>
            <line x1="8" y1="2" x2="8" y2="5"></line>
            <line x1="16" y1="2" x2="16" y2="5"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Payment History
        </h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-dark-500">Filter by Year:</label>
          <select
            className="border border-light-500 rounded-md text-sm p-1.5 bg-white shadow-sm focus:ring-1 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200"
            value={year || ''}
            onChange={(e) => setYear(e.target.value === '' ? null : e.target.value)}
          >
            <option value="">All Years</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-5">
          <LoadingSpinner />
        </div>
      ) : payments.length === 0 ? (
        <EmptyState 
          title="No payment records found"
          className="bg-white border border-light-300 p-5 rounded-lg text-center shadow-sm"
        />
      ) : (
        <Card className="p-0 overflow-hidden" elevation="default" variant="default">
          <div className="overflow-x-auto -mx-1">
            <table className="min-w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-light-200 border-b border-light-300">
                  <th className="w-[2%] py-2.5 px-1 text-left text-xs font-medium text-dark-600 uppercase tracking-wider"></th>
                  <th className="w-[11%] py-2.5 px-2 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">Date</th>
                  <th className="w-[17%] py-2.5 px-2 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">Provider</th>
                  <th className="w-[12%] py-2.5 px-2 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">Period</th>
                  <th className="w-[12%] py-2.5 px-2 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">AUM</th>
                  <th className="w-[13%] py-2.5 px-2 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">Expected</th>
                  <th className="w-[13%] py-2.5 px-2 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">Actual</th>
                  <th className="w-[14%] py-2.5 px-2 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">Variance</th>
                  <th className="w-[6%] py-2.5 px-1 text-center text-xs font-medium text-dark-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-light-300">
                {payments.map((payment) => (
                  <PaymentTableRow
                    key={payment.payment_id}
                    payment={payment}
                    showDeleteConfirm={showDeleteConfirm}
                    onEdit={handleEdit}
                    onViewFile={handleViewFile}
                    onConfirmDelete={handleDelete}
                    onCancelDelete={cancelDelete}
                    onDeleteClick={confirmDelete}
                    isDeleting={deletePaymentMutation.isLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-2 bg-light-200 border-t border-light-300">
            <div className="text-sm text-dark-500">
              Showing {payments.length} payments
            </div>
            <nav className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(Math.max(page - 1, 1))}
                disabled={page === 1 || isPreviousData}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (payments.length === 10 && !isPreviousData) {
                    setPage(page + 1);
                  }
                }}
                disabled={payments.length < 10 || isPreviousData}
              >
                Next
              </Button>
            </nav>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        title="Confirm Delete"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => handleDelete(showDeleteConfirm)}
        onCancel={cancelDelete}
        isLoading={deletePaymentMutation.isLoading}
      />
    </div>
  );
};

export default PaymentHistory;