import React from 'react';

const ErrorDisplay = ({ title, message, error }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    <h3 className="font-medium mb-1">{title}</h3>
    <p>{error?.message || message}</p>
  </div>
);

export default ErrorDisplay;