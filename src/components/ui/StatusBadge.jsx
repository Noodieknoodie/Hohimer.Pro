import React from 'react';
import { STATUS_COLORS } from '../../utils/constants';

/**
 * Status badge component for displaying statuses with appropriate colors
 * @param {string} status - Status identifier (exact, acceptable, warning, alert, unknown)
 * @param {string} label - Text label to display
 * @param {string} size - Size variant (xs, sm, md, lg)
 */
const StatusBadge = ({ status, label, size = 'md' }) => {
  const sizeClasses = {
    xs: 'px-1 py-0.5 text-xs',
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const colorClass = STATUS_COLORS[status] || STATUS_COLORS.gray;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Format the display label for clarity
  const getDisplayLabel = () => {
    if (!label || label === 'N/A') return 'N/A';

    // Show symbols for common statuses
    switch (status) {
      case 'exact':
        return '✓ Exact';
      case 'acceptable':
        return '✓ ' + label;
      case 'unknown':
        return 'N/A';
      default:
        return label;
    }
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colorClass} ${sizeClass}`}>
      {getDisplayLabel()}
    </span>
  );
};

export default StatusBadge;