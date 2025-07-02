import { format, parseISO } from 'date-fns';
import { MONTH_NAMES } from './constants';
/**
 * Format a date string or Date object to a human-readable format
 * @param {string|Date} dateInput - ISO date string or Date object
 * @param {string} formatStr - Optional format string
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateInput, formatStr = 'MMM d, yyyy') => {
  if (!dateInput) return 'N/A';
  try {
    const date = dateInput instanceof Date ? dateInput : parseISO(dateInput);
    return format(date, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};
/**
 * Format applied period from payment data
 * @param {Object} payment - Payment object
 * @returns {string} - Formatted period string
 */
export const formatAppliedPeriod = (payment) => {
  if (!payment) return 'N/A';
  if (payment.applied_start_quarter) {
    return `Q${payment.applied_start_quarter} ${payment.applied_start_quarter_year}`;
  }
  if (payment.applied_start_month) {
    const monthIndex = payment.applied_start_month - 1; 
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_NAMES[monthIndex]} ${payment.applied_start_month_year}`;
    }
  }
  return 'N/A';
};
/**
 * Format period range for split payments
 * @param {Object} payment - Payment object
 * @returns {string} - Formatted period range
 */
export const formatPeriodRange = (payment) => {
  if (!payment || !payment.is_split_payment) return formatAppliedPeriod(payment);
  let startPeriod, endPeriod;
  if (payment.applied_start_quarter) {
    startPeriod = `Q${payment.applied_start_quarter} ${payment.applied_start_quarter_year}`;
    endPeriod = `Q${payment.applied_end_quarter} ${payment.applied_end_quarter_year}`;
  } else if (payment.applied_start_month) {
    const startMonthIndex = payment.applied_start_month - 1;
    const endMonthIndex = payment.applied_end_month - 1;
    if (startMonthIndex >= 0 && startMonthIndex < 12 &&
      endMonthIndex >= 0 && endMonthIndex < 12) {
      startPeriod = `${MONTH_NAMES[startMonthIndex]} ${payment.applied_start_month_year}`;
      endPeriod = `${MONTH_NAMES[endMonthIndex]} ${payment.applied_end_month_year}`;
    } else {
      return 'Invalid Period';
    }
  } else {
    return 'N/A';
  }
  return `${startPeriod} - ${endPeriod}`;
};
