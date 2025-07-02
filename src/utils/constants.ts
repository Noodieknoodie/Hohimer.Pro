/**
 * Application-wide constants
 */
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
export const PAYMENT_METHODS = [
  { label: 'Auto - ACH', value: 'Auto - ACH' },
  { label: 'Auto - Check', value: 'Auto - Check' },
  { label: 'Invoice - Check', value: 'Invoice - Check' },
  { label: 'Wire Transfer', value: 'Wire Transfer' },
  { label: 'Check', value: 'Check' },
];
export const STATUS_COLORS = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  exact: 'bg-blue-100 text-blue-800',
  acceptable: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  unknown: 'bg-gray-100 text-gray-800',
  gray: 'bg-gray-100 text-gray-800',
};
export const FEE_TYPES = {
  FLAT: 'flat',
  PERCENTAGE: 'percentage',
  PERCENT: 'percent'
};
export const PAYMENT_SCHEDULES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly'
};
export const PAYMENT_STATUS = {
  PAID: 'Paid',
  DUE: 'Due'
};
