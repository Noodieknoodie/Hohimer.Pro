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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        await response.text()
      );
      throw error;
    }

    return response.json();
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
  };

  contracts = {
    list: (clientId?: number): Promise<Contract[]> => {
      const params = clientId ? `?client_id=${clientId}` : '';
      return this.request<Contract[]>(`/contracts${params}`);
    },

    get: (id: number): Promise<Contract> => {
      return this.request<Contract>(`/contracts/${id}`);
    },
  };

  payments = {
    list: (clientId?: number, year?: number): Promise<Payment[]> => {
      const params = new URLSearchParams();
      if (clientId) params.append('client_id', clientId.toString());
      if (year) params.append('year', year.toString());
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
    available: (clientId: number, contractId: number): Promise<AvailablePeriod[]> => {
      return this.request<AvailablePeriod[]>(
        `/periods?client_id=${clientId}&contract_id=${contractId}`
      );
    },
  };
}

export const api = new ApiService();
export default api;