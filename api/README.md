# api/README.md

# Azure Functions API

This directory contains the serverless API endpoints for the 401k Payment Tracking System.

## Structure

```
api/
├── clients/          # Client CRUD operations
├── payments/         # Payment management
├── dashboard/        # Dashboard aggregated data
├── contracts/        # Contract management
├── periods/          # Available periods for payments
├── files/           # File management (TODO)
├── host.json        # Global function configuration
├── local.settings.json  # Local development settings
├── requirements.txt  # Python dependencies
└── utils.py         # Shared utilities
```

## Local Development

1. **Install Azure Functions Core Tools**:
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. **Install Python dependencies**:
   ```bash
   cd api
   pip install -r requirements.txt
   ```

3. **Run locally**:
   ```bash
   func start
   ```

   The API will be available at `http://localhost:7071/api/`

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/{id}` - Get specific client
- `POST /api/clients` - Create new client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Soft delete client

### Contracts
- `GET /api/contracts` - List all contracts
- `GET /api/contracts/{id}` - Get specific contract
- `GET /api/contracts/client/{client_id}` - Get contract for a client
- `POST /api/contracts` - Create new contract
- `PUT /api/contracts/{id}` - Update contract
- `DELETE /api/contracts/{id}` - Soft delete contract

### Payments
- `GET /api/payments?client_id={id}` - List payments for client
- `GET /api/payments/{id}` - Get specific payment
- `POST /api/payments` - Create new payment
- `PUT /api/payments/{id}` - Update payment
- `DELETE /api/payments/{id}` - Soft delete payment

### Dashboard
- `GET /api/dashboard/{client_id}` - Get complete dashboard data

### Periods
- `GET /api/periods?client_id={id}&contract_id={id}` - Get available periods for payment entry

## Environment Variables

Required in `local.settings.json` for local development:
- `SQL_SERVER` - Azure SQL server name
- `SQL_DATABASE` - Database name
- `TEAMSFX_ENV` - Environment (local/dev/prod)

## Authentication

Currently set to `anonymous` for development. In production, this will use Azure AD authentication integrated with Teams.

## Database Integration

The functions use the existing database layer from `/backend/database/` which provides:
- Azure AD authentication
- Pydantic model validation
- Connection management
- Error handling

## Adding New Endpoints

1. Create a new folder under `/api/endpoint-name/`
2. Add `__init__.py` with your function code
3. Add `function.json` with binding configuration
4. Import and use existing database models from `backend.database.models`
5. Use `backend.database.get_db()` for database access

## Deployment

These functions deploy automatically with Azure Static Web Apps or can be deployed separately to Azure Functions.