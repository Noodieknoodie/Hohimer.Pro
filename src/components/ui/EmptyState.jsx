import React from 'react';

const EmptyState = ({ 
  title, 
  message, 
  icon = null,
  className = '',
  bgColor = 'bg-gray-50',
  textColor = 'text-gray-500'
}) => (
  <div className={`flex-1 flex items-center justify-center p-4 ${bgColor} ${textColor} ${className}`}>
    <div className="text-center">
      {icon}
      <p className="font-medium mb-1">{title}</p>
      {message && <p className="text-sm">{message}</p>}
    </div>
  </div>
);

export default EmptyState;