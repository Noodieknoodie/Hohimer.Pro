// src/services/api.ts
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:7071/api';

// Type definitions (same as before)
export interface Client {
  client_id: number;
  display_name: string;
  full_name?: string;
  ima_signed_date?: string;
  onedrive_folder_path?: string;
  provider_name?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  last_recorded_assets?: number;
  total_ytd_payments?: number;
  // Temporal fields from backend
  valid_from?: string;
  valid_to?: string | null;
}

export interface Contract {
  contract_id: number;
  client_id: number;
  provider_name: string;
  fee_type: 'flat' | 'percentage';
  payment_schedule: 'monthly' | 'quarterly';
  percent_rate?: number;
  flat_rate?: number;
  contract_number?: string;
  contract_start_date?: string;
  num_people?: number;
  notes?: string;
  client_name?: string;
  // Temporal fields from backend
  valid_from?: string;
  valid_to?: string | null;
}

export interface Payment {
  payment_id?: number;
  contract_id: number;
  client_id: number;
  received_date: string;
  total_assets?: number;
  actual_fee?: number;
  expected_fee?: number;
  method?: string;
  notes?: string;
  applied_period_type: 'monthly' | 'quarterly';
  applied_period: number;
  applied_year: number;
  // Additional fields from joins
  client_name?: string;
  provider_name?: string;
  fee_type?: string;
  percent_rate?: number;
  flat_rate?: number;
  payment_schedule?: string;
  has_files?: number;
  // Temporal fields from backend
  valid_from?: string;
  valid_to?: string | null;
}

// Dashboard types match exactly
export interface DashboardData {
  client: {
    client_id: number;
    display_name: string;
    full_name?: string;
    ima_signed_date?: string;
    onedrive_folder_path?: string;
  };
  contract?: {
    contract_id: number;
    provider_name: string;
    fee_type: string;
    percent_rate?: number;
    flat_rate?: number;
    payment_schedule: string;
  };
  payment_status: {
    status: 'Paid' | 'Due';
    current_period: string;
    current_period_number: number;
    current_year: number;
    last_payment_date?: string;
    last_payment_amount?: number;
    expected_fee?: number;
  };
  compliance: {
    status: 'compliant';
    color: 'green' | 'yellow';
    reason: string;
  };
  recent_payments: Array<{
    payment_id: number;
    received_date: string;
    actual_fee?: number;
    total_assets?: number;
    applied_period: number;
    applied_year: number;
    applied_period_type: string;
    period_display: string;
    has_files: number;
  }>;
  metrics: {
    total_ytd_payments?: number;
    avg_quarterly_payment?: number;
    last_recorded_assets?: number;
    next_payment_due?: string;
  };
  quarterly_summaries?: Array<{
    quarter: number;
    total_payments?: number;
    payment_count?: number;
    avg_payment?: number;
    expected_total?: number;
  }>;
}

export interface PeriodsResponse {
  periods: Array<{
    value: string;
    label: string;
    period: number;
    year: number;
    period_type: 'monthly' | 'quarterly';
  }>;
  payment_schedule: string;
}

// API client - CORRECTED to match actual backend
export const api = {
  // Client endpoints
  clients: {
    list: (provider?: string) => {
      const params = provider ? `?provider=${encodeURIComponent(provider)}` : '';
      return fetchApi<Client[]>(`${API_BASE}/clients${params}`);
    },
    
    get: (id: number) => fetchApi<Client>(`${API_BASE}/clients/${id}`),
    
    create: (client: Omit<Client, 'client_id'>) =>
      fetchApi<Client>(`${API_BASE}/clients`, {
        method: 'POST',
        body: JSON.stringify(client),
      }),
    
    update: (id: number, client: Partial<Client>) =>
      fetchApi<{message: string}>(`${API_BASE}/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(client),
      }),
    
    delete: (id: number) =>
      fetchApi<void>(`${API_BASE}/clients/${id}`, {
        method: 'DELETE',
      }),
  },

  // Contract endpoints
  contracts: {
    list: (provider?: string) => {
      const params = provider ? `?provider=${encodeURIComponent(provider)}` : '';
      return fetchApi<Contract[]>(`${API_BASE}/contracts${params}`);
    },
    
    get: (id: number) => fetchApi<Contract>(`${API_BASE}/contracts/${id}`),
    
    // This is the correct route based on the backend code
    getByClient: (clientId: number) => 
      fetchApi<Contract>(`${API_BASE}/contracts/client/${clientId}`),
    
    create: (contract: Omit<Contract, 'contract_id'>) =>
      fetchApi<Contract>(`${API_BASE}/contracts`, {
        method: 'POST',
        body: JSON.stringify(contract),
      }),
    
    update: (id: number, contract: Partial<Contract>) =>
      fetchApi<{message: string}>(`${API_BASE}/contracts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contract),
      }),
    
    delete: (id: number) =>
      fetchApi<void>(`${API_BASE}/contracts/${id}`, {
        method: 'DELETE',
      }),
  },

  // Payment endpoints
  payments: {
    list: (clientId: number, year?: number, page = 1, limit = 50) => {
      const params = new URLSearchParams({
        client_id: clientId.toString(),
        page: page.toString(),
        limit: limit.toString(),
      });
      if (year) params.append('year', year.toString());
      
      return fetchApi<Payment[]>(`${API_BASE}/payments?${params}`);
    },
    
    get: (id: number) => fetchApi<Payment>(`${API_BASE}/payments/${id}`),
    
    create: (payment: Omit<Payment, 'payment_id'>) => 
      fetchApi<Payment>(`${API_BASE}/payments`, {
        method: 'POST',
        body: JSON.stringify(payment),
      }),
    
    update: (id: number, payment: Partial<Payment>) => 
      fetchApi<{message: string}>(`${API_BASE}/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payment),
      }),
    
    delete: (id: number) => 
      fetchApi<void>(`${API_BASE}/payments/${id}`, {
        method: 'DELETE',
      }),
  },

  // Dashboard endpoint
  dashboard: {
    get: (clientId: number) => 
      fetchApi<DashboardData>(`${API_BASE}/dashboard/${clientId}`),
  },

  // Period endpoint
  periods: {
    getAvailable: (clientId: number, contractId: number) => 
      fetchApi<PeriodsResponse>(
        `${API_BASE}/periods?client_id=${clientId}&contract_id=${contractId}`
      ),
  },

  // Calculations endpoint
  calculations: {
    variance: (actualFee: number, expectedFee: number) => 
      fetchApi<{
        status: string;
        message: string;
        difference: number | null;
        percent_difference: number | null;
      }>(`${API_BASE}/calculations/variance?actual_fee=${actualFee}&expected_fee=${expectedFee}`),
  },
};

// Error handling with Azure AD auth awareness
export class ApiError extends Error {
  public isAuthError: boolean;
  
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    // Check for Azure AD authentication errors
    this.isAuthError = status === 401 || status === 403;
  }
}

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new ApiError(
        response.status, 
        errorData.error || errorData.message || `API error: ${response.statusText}`
      );
      
      // Handle Azure AD auth failures specifically
      if (error.isAuthError) {
        console.error('Azure AD authentication failed:', error.message);
        // In a Teams app, this might trigger a re-authentication flow
        // For now, we'll just throw the error with auth context
      }
      
      throw error;
    }

    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors might also be auth-related in Teams/Azure context
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new ApiError(0, 'Network error: Unable to connect to API. This may be an authentication issue.');
    }
    throw new Error('Network error: Unable to connect to API');
  }
}