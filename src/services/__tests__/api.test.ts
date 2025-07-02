import { api } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const mockFetch = (response: any, status = 200) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => response,
    });
  };

  describe('Clients API', () => {
    const mockClient = {
      client_id: 1,
      display_name: 'Test Client',
      full_name: 'Test Client LLC',
      ima_signed_date: '2024-01-01',
      provider_name: 'John Hancock',
      valid_from: '2024-01-01T00:00:00',
      valid_to: null,
    };

    test('list clients', async () => {
      mockFetch([mockClient]);
      
      const result = await api.clients.list();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/clients',
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual([mockClient]);
    });

    test('list clients with provider filter', async () => {
      mockFetch([mockClient]);
      
      const result = await api.clients.list('John Hancock');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/clients?provider=John%20Hancock',
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual([mockClient]);
    });

    test('get single client', async () => {
      mockFetch(mockClient);
      
      const result = await api.clients.get(1);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/clients/1',
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual(mockClient);
    });

    test('create client', async () => {
      const newClient = { display_name: 'New Client', full_name: 'New Client LLC' };
      mockFetch({ ...newClient, client_id: 2 });
      
      const result = await api.clients.create(newClient);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/clients',
        {
          method: 'POST',
          body: JSON.stringify(newClient),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toHaveProperty('client_id', 2);
    });

    test('update client', async () => {
      const updates = { display_name: 'Updated Client' };
      mockFetch({ message: 'Client updated successfully' });
      
      const result = await api.clients.update(1, updates);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/clients/1',
        {
          method: 'PUT',
          body: JSON.stringify(updates),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toEqual({ message: 'Client updated successfully' });
    });

    test('delete client', async () => {
      mockFetch(null, 204);
      
      const result = await api.clients.delete(1);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/clients/1',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toBeNull();
    });
  });

  describe('Contracts API', () => {
    const mockContract = {
      contract_id: 1,
      client_id: 1,
      provider_name: 'John Hancock',
      fee_type: 'percentage' as const,
      payment_schedule: 'quarterly' as const,
      percent_rate: 0.0025,
      valid_from: '2024-01-01T00:00:00',
      valid_to: null,
    };

    test('list contracts', async () => {
      mockFetch([mockContract]);
      
      const result = await api.contracts.list();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/contracts',
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual([mockContract]);
    });

    test('get contract by client', async () => {
      mockFetch(mockContract);
      
      const result = await api.contracts.getByClient(1);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/contracts/client/1',
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual(mockContract);
    });

    test('create contract', async () => {
      const newContract = {
        client_id: 1,
        provider_name: 'Voya',
        fee_type: 'flat' as const,
        payment_schedule: 'monthly' as const,
        flat_rate: 1000,
      };
      mockFetch({ ...newContract, contract_id: 2 });
      
      const result = await api.contracts.create(newContract);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/contracts',
        {
          method: 'POST',
          body: JSON.stringify(newContract),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toHaveProperty('contract_id', 2);
    });
  });

  describe('Payments API', () => {
    const mockPayment = {
      payment_id: 1,
      contract_id: 1,
      client_id: 1,
      received_date: '2024-03-15',
      total_assets: 1000000,
      actual_fee: 2500,
      expected_fee: 2500,
      applied_period_type: 'quarterly' as const,
      applied_period: 1,
      applied_year: 2024,
      client_name: 'Test Client',
      provider_name: 'John Hancock',
    };

    test('list payments with pagination', async () => {
      mockFetch([mockPayment]);
      
      const result = await api.payments.list(1, 2024, 2, 25);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/payments?client_id=1&page=2&limit=25&year=2024',
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual([mockPayment]);
    });

    test('create payment', async () => {
      const newPayment = {
        contract_id: 1,
        client_id: 1,
        received_date: '2024-06-15',
        total_assets: 1100000,
        actual_fee: 2750,
        applied_period_type: 'quarterly' as const,
        applied_period: 2,
        applied_year: 2024,
      };
      mockFetch({ ...newPayment, payment_id: 2 });
      
      const result = await api.payments.create(newPayment);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/payments',
        {
          method: 'POST',
          body: JSON.stringify(newPayment),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(result).toHaveProperty('payment_id', 2);
    });
  });

  describe('Dashboard API', () => {
    const mockDashboard = {
      client: {
        client_id: 1,
        display_name: 'Test Client',
        full_name: 'Test Client LLC',
      },
      contract: {
        contract_id: 1,
        provider_name: 'John Hancock',
        fee_type: 'percentage',
        percent_rate: 0.0025,
        payment_schedule: 'quarterly',
      },
      payment_status: {
        status: 'Paid' as const,
        current_period: 'Q2',
        current_period_number: 2,
        current_year: 2024,
        last_payment_date: '2024-03-15',
        last_payment_amount: 2500,
      },
      compliance: {
        status: 'compliant' as const,
        color: 'green' as const,
        reason: 'All payments up to date',
      },
      recent_payments: [],
      metrics: {
        total_ytd_payments: 5000,
        avg_quarterly_payment: 2500,
        last_recorded_assets: 1000000,
      },
    };

    test('get dashboard data', async () => {
      mockFetch(mockDashboard);
      
      const result = await api.dashboard.get(1);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/dashboard/1',
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual(mockDashboard);
    });
  });

  describe('Periods API', () => {
    const mockPeriods = {
      periods: [
        { value: '2024-1', label: 'Q1 2024', type: 'quarterly' as const },
        { value: '2024-2', label: 'Q2 2024', type: 'quarterly' as const },
      ],
      payment_schedule: 'quarterly',
    };

    test('get available periods', async () => {
      mockFetch(mockPeriods);
      
      const result = await api.periods.getAvailable(1, 1);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/periods?client_id=1&contract_id=1',
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual(mockPeriods);
    });
  });

  describe('Calculations API', () => {
    const mockVariance = {
      status: 'acceptable',
      message: 'Within 5% variance',
      difference: 50,
      percent_difference: 2,
    };

    test('calculate variance', async () => {
      mockFetch(mockVariance);
      
      const result = await api.calculations.variance(2550, 2500);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/calculations/variance?actual_fee=2550&expected_fee=2500',
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual(mockVariance);
    });
  });

  describe('Error Handling', () => {
    test('handles API error with error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid client ID' }),
      });

      await expect(api.clients.get(999)).rejects.toThrow('Invalid client ID');
    });

    test('handles API error without error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error(); },
      });

      await expect(api.clients.get(1)).rejects.toThrow('API error: Internal Server Error');
    });

    test('handles network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'));

      await expect(api.clients.get(1)).rejects.toThrow('Network error: Unable to connect to API');
    });

    test('handles 204 No Content response', async () => {
      mockFetch(null, 204);
      
      const result = await api.clients.delete(1);
      
      expect(result).toBeNull();
    });
  });

  describe('Environment Variable', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    test('uses custom API URL from environment', async () => {
      process.env.REACT_APP_API_URL = 'https://custom-api.com';
      
      // Re-import to get the new environment variable
      jest.isolateModules(() => {
        const { api: customApi } = require('../api');
        mockFetch([]);
        
        customApi.clients.list();
        
        expect(fetch).toHaveBeenCalledWith(
          'https://custom-api.com/clients',
          expect.any(Object)
        );
      });
    });
  });
});