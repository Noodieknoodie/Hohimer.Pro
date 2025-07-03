//src/api.ts
import { 
  Client, 
  Contract, 
  Payment, 
  DashboardData, 
  AvailablePeriod,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  ApiError
} from '../utils/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7071';

  class ApiService {
    private async request<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> {
      // Always prepend /api to every endpoint
      const url = `${API_BASE}/api${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      try {
        const response = await fetch(url, config);

        if (!response.ok) {
          let errorMessage = `API request failed: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If response isn't JSON, use default message
          }

          const error = new ApiError(errorMessage, response.status, response.statusText);
          throw error;
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return null as T;
        }

        return response.json();
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw error;
        }
        // Network error
        throw new ApiError('Network error: Unable to connect to API', 0, error.message);
      }
    }
  

  clients = {
    list: (provider?: string): Promise<Client[]> => {
      const params = provider ? `?provider=${encodeURIComponent(provider)}` : '';
      return this.request<Client[]>(`/clients${params}`);
    },

    get: (id: number): Promise<Client> => {
      return this.request<Client>(`/clients/${id}`);
    },

    search: (query: string): Promise<Client[]> => {
      return this.request<Client[]>(`/clients/search?q=${encodeURIComponent(query)}`);
    },

    create: (client: any): Promise<Client> => {
      return this.request<Client>('/clients', {
        method: 'POST',
        body: JSON.stringify(client),
      });
    },

    update: (id: number, updates: any): Promise<any> => {
      return this.request<any>(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: (id: number): Promise<void> => {
      return this.request<void>(`/clients/${id}`, {
        method: 'DELETE',
      });
    },
  };

  contracts = {
    list: (clientId?: number): Promise<Contract[]> => {
      const params = clientId ? `?client_id=${clientId}` : '';
      return this.request<Contract[]>(`/contracts${params}`);
    },

    get: (id: number): Promise<Contract> => {
      return this.request<Contract>(`/contracts/${id}`);
    },

    getByClient: (clientId: number): Promise<Contract> => {
      return this.request<Contract>(`/contracts/client/${clientId}`);
    },

    create: (contract: any): Promise<Contract> => {
      return this.request<Contract>('/contracts', {
        method: 'POST',
        body: JSON.stringify(contract),
      });
    },
  };

  payments = {
    list: (clientId?: number, year?: number, page: number = 1, limit: number = 10): Promise<Payment[]> => {
      const params = new URLSearchParams();
      if (clientId) params.append('client_id', clientId.toString());
      if (year) params.append('year', year.toString());
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return this.request<Payment[]>(`/payments${queryString}`);
    },

    get: (id: number): Promise<Payment> => {
      return this.request<Payment>(`/payments/${id}`);
    },

    create: (payment: CreatePaymentRequest): Promise<Payment> => {
      return this.request<Payment>('/payments', {
        method: 'POST',
        body: JSON.stringify(payment),
      });
    },

    update: (id: number, payment: UpdatePaymentRequest): Promise<Payment> => {
      return this.request<Payment>(`/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payment),
      });
    },

    delete: (id: number): Promise<void> => {
      return this.request<void>(`/payments/${id}`, {
        method: 'DELETE',
      });
    },
  };

  dashboard = {
    get: (clientId: number): Promise<DashboardData> => {
      return this.request<DashboardData>(`/dashboard/${clientId}`);
    },
  };

  periods = {
    available: (clientId: number, contractId: number): Promise<{periods: AvailablePeriod[], payment_schedule: string}> => {
      return this.request<{periods: AvailablePeriod[], payment_schedule: string}>(
        `/periods?client_id=${clientId}&contract_id=${contractId}`
      );
    },
  };

  calculations = {
    variance: (actual: number, expected: number): Promise<any> => {
      return this.request<any>(
        `/calculations/variance?actual_fee=${actual}&expected_fee=${expected}`
      );
    },
  };
}

export const api = new ApiService();
export default api;