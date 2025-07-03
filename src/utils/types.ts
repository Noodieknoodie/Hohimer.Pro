// API Types matching backend models

export interface Client {
  client_id: number;
  display_name: string;
  full_name: string;
  ima_signed_date: string | null;
  provider_name: string;
  provider_id: string | null;
  valid_from: string;
  valid_to: string | null;
}

export interface Contract {
  contract_id: number;
  client_id: number;
  fee_type: 'percent' | 'flat';
  percent_rate: number | null;
  flat_rate: number | null;
  payment_schedule: 'monthly' | 'quarterly';
  contract_signed_date: string | null;
  valid_from: string;
  valid_to: string | null;
}

export interface Payment {
  payment_id: number;
  client_id: number;
  contract_id: number;
  payment_amount: number;
  payment_date: string;
  applied_period_type: 'monthly' | 'quarterly';
  applied_period: number;
  applied_year: number;
  created_by: string;
  created_date: string;
  modified_by: string | null;
  modified_date: string | null;
  valid_from: string;
  valid_to: string | null;
}

export interface DashboardData {
  client: Client;
  contracts: Contract[];
  payment_status: {
    current_period: number;
    current_year: number;
    period_type: 'monthly' | 'quarterly';
    expected_amount: number;
    is_paid: boolean;
    paid_amount: number | null;
    payment_id: number | null;
  };
  compliance: {
    status: 'exact' | 'acceptable' | 'warning' | 'alert';
    color: string;
    reason: string;
  };
  recent_payments: Payment[];
  metrics: {
    total_payments: number;
    total_paid: number;
    average_variance: number;
    on_time_rate: number;
    last_payment_date: string | null;
  };
}

export interface AvailablePeriod {
  period_type: 'monthly' | 'quarterly';
  period: number;
  year: number;
  label: string;
}

export interface CreatePaymentRequest {
  client_id: number;
  contract_id: number;
  payment_amount: number;
  payment_date: string;
  applied_period_type: 'monthly' | 'quarterly';
  applied_period: number;
  applied_year: number;
}

export interface UpdatePaymentRequest {
  payment_amount?: number;
  payment_date?: string;
  applied_period_type?: 'monthly' | 'quarterly';
  applied_period?: number;
  applied_year?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}