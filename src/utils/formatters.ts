/**
 * Formatting utilities for the frontend.
 * This file contains only presentation/formatting functions, no business logic.
 */
import { FEE_TYPES } from './constants';
/**
 * Format a number as currency
 * @param {number} value - Number to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
/**
 * Format a number as percentage
 * @param {number} value - Number to format (as a decimal, e.g. 0.42 for 42%)
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
/**
 * Generate fee references for different payment frequencies
 * NOTE: This is display logic for fee reference tables.
 * TODO: Consider moving to backend API for Sprint 4+
 * 
 * @param {Object} contract - Contract object
 * @param {number} baseAssets - Base asset amount for percentage calculations (optional)
 * @returns {Object|null} - Object with monthly, quarterly, and annual rates
 */
export const generateFeeReferences = (contract, baseAssets = null) => {
  if (!contract) return null;
  let monthlyRate, quarterlyRate, annualRate;
  if (contract.fee_type === FEE_TYPES.FLAT) {
    if (contract.payment_schedule === 'monthly') {
      monthlyRate = contract.flat_rate;
      quarterlyRate = monthlyRate * 3;
      annualRate = monthlyRate * 12;
    } else {
      quarterlyRate = contract.flat_rate;
      monthlyRate = quarterlyRate / 3;
      annualRate = quarterlyRate * 4;
    }
    return {
      monthly: formatCurrency(monthlyRate),
      quarterly: formatCurrency(quarterlyRate),
      annual: formatCurrency(annualRate)
    };
  } else if (contract.percent_rate) {
    const percentRate = contract.percent_rate;
    if (baseAssets) {
      if (contract.payment_schedule === 'monthly') {
        monthlyRate = baseAssets * percentRate;
        quarterlyRate = monthlyRate * 3;
        annualRate = monthlyRate * 12;
      } else {
        quarterlyRate = baseAssets * percentRate;
        monthlyRate = quarterlyRate / 3;
        annualRate = quarterlyRate * 4;
      }
      return {
        monthly: formatCurrency(monthlyRate),
        quarterly: formatCurrency(quarterlyRate),
        annual: formatCurrency(annualRate)
      };
    } else {
      if (contract.payment_schedule === 'monthly') {
        monthlyRate = percentRate * 100;
        quarterlyRate = monthlyRate * 3;
        annualRate = monthlyRate * 12;
      } else {
        quarterlyRate = percentRate * 100;
        monthlyRate = quarterlyRate / 3;
        annualRate = quarterlyRate * 4;
      }
      return {
        monthly: `${monthlyRate.toFixed(3)}%`,
        quarterly: `${quarterlyRate.toFixed(3)}%`,
        annual: `${annualRate.toFixed(3)}%`
      };
    }
  }
  return null;
};
