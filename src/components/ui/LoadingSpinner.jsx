import React from 'react';

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

export default LoadingSpinner;