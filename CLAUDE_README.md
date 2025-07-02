# 401k Payment Tracking System - Developer Guide

## What This Is

A simple Teams Tab app for tracking quarterly/monthly 401k payments from retirement plan providers. Used internally by a small financial advisory firm (~3 users) to record when client payments arrive and ensure they match expected fees.

## Architecture

```
Teams Tab (React) → Azure Functions API → Azure SQL Database
     ↓                      ↓                     ↓
Static web app      Serverless endpoints   Managed cloud DB
```

## Key Business Logic

### Payment Tracking

- Payments are recorded **after** they’re received (checks in hand)
- Each payment applies to a **single period** (Q1-Q4 or months 1-12)
- Payments can be applied retroactively to any unpaid period
- No split payments across multiple periods anymore

### Fee Calculations

- All fees in the database are already adjusted for payment frequency
- Annual rates are pre-divided by 4 (quarterly) or 12 (monthly)
- Two fee types: `flat` (fixed dollar amount) or `percentage` (% of assets)
- Expected fees auto-calculate based on contract terms

### Payment Status

- Binary status: **Paid** (green) or **Due** (yellow)
- No overdue/red status - just tracks if current period is paid
- “Current period” = one period back from today (payments in arrears)

## Database Schema

### Core Tables

- **clients** - Client records with display names
- **contracts** - Fee structures and payment schedules
- **payments** - Individual payment records with single period
- **client_metrics** - Aggregated payment summaries
- **quarterly_summaries** - Period rollups for reporting

### Key Fields

```sql
payments:
  - applied_period_type: 'monthly' or 'quarterly'
  - applied_period: 1-12 for months, 1-4 for quarters
  - applied_year: e.g., 2025
  - actual_fee: What we received
  - expected_fee: What we should have received
```

## API Endpoints

```
GET  /api/clients                 - List all clients
GET  /api/dashboard/{client_id}   - Complete client view
GET  /api/payments                - Create/read/update/delete payments  
GET  /api/periods?client_id=X     - Get unpaid periods for dropdowns
GET  /api/contracts/{id}          - Contract details
```

## Frontend State

### Key Components

- **ClientList** - Main navigation sidebar
- **ClientDashboard** - Payment history and metrics
- **PaymentForm** - Add/edit payment modal
- **ComplianceIndicator** - Green/yellow status badge

### State Management

- Zustand for global state (selected client, modals)
- React Query for API data caching
- No Redux, no complex state machines

## Development Setup

### Prerequisites

- Node.js 24.1.0
- Python 3.13.3
- Azure CLI (logged in)
- ODBC Driver 18 for SQL Server

### Environment Variables

```env
SQL_SERVER=hohimerpro-db-server.database.windows.net
SQL_DATABASE=HohimerPro-401k
SQL_AUTH=ActiveDirectory
```

### Running Locally

```bash
# Frontend (Teams Tab)
npm install
npm run dev

# Backend (Azure Functions)
cd api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
func start
```

## Common Tasks

### Adding a Payment

1. User selects client from sidebar
1. Clicks “New Payment” button
1. Selects period from dropdown (only unpaid periods shown)
1. Enters check amount and date received
1. System calculates variance from expected fee

### Viewing Status

- Dashboard shows if current period is paid
- Metrics show YTD totals and averages
- Recent payments list shows last 5 entries

## What’s NOT Included

- Document/file backend (UI components exist as placeholders, no PDF rendering)
- Payment approval workflows
- Batch processing
- Email notifications
- Complex compliance rules
- User roles/permissions (Teams handles auth)

## Migration Notes

- Old system had split payments - all converted to single periods
- Old system had complex overdue logic - removed
- Old system used local SQLite - now Azure SQL
- File associations exist in schema but backend not implemented (UI preserved)

## Testing

```bash
# Backend unit tests
cd api
pytest tests/

# Quick API test
python tests/backend_tests/test_api.py
```

## Deployment

Via Teams Toolkit in VS Code:

1. `Teams: Provision in the cloud`
1. `Teams: Deploy to the cloud`
1. `Teams: Publish to Teams`

-----

That’s it. It’s a glorified spreadsheet for tracking payments. Keep it simple.​​​​​​​​​​​​​​​​
