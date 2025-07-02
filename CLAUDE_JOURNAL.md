# CLAUDE JOURNAL

## PROJECT OVERVIEW

**401(k) Payment Tracking System** - A Microsoft Teams Tab application that tracks advisor fee payments for 401(k) retirement plans.

**TECH STACK**:
- **Platform**: Microsoft Teams Tab (Teams Toolkit)
- **Backend**: Python/FastAPI deployed as Azure Functions in `/api` directory  
- **Database**: Azure SQL Database with Azure AD auth
- **Frontend**: React with Tailwind CSS v4 (migrating from Next.js)
- **Testing**: Backend - Pytest (48 passing), Frontend - Jest configured

**BUSINESS CONTEXT**: 
- Tracks ~30-50 active 401(k) plan clients
- ~1,000 payments annually  
- Providers: John Hancock, Voya, Empower, Principal, Ascensus
- Payment types: Percentage (0.25% of assets) or flat fee
- Schedules: Monthly/quarterly, collected in arrears

---

## CURRENT PROJECT STATE

### ✅ COMPLETED

**Database Layer** (`/api/database/`)
- Azure AD authentication with DefaultAzureCredential
- Connection management with context managers
- Full Pydantic models for all 9 tables
- Comprehensive validation (rates, periods, emails)
- Transaction support with automatic rollback

**Azure Functions API** (`/api/`)
- All HTTP triggers configured with function.json files
- Fixed import paths (was `../../backend`, now `..`)
- Endpoints: clients, contracts, payments, dashboard, periods, calculations
- RESTful design with proper HTTP status codes
- Direct database access via context managers

**Frontend Infrastructure**
- TypeScript API service layer (`/src/services/api.ts`)
- Complete type definitions matching backend models
- Error handling with custom ApiError class
- React Query integration ready
- Jest testing configured with 19 passing API tests
- Vite build system with Teams integration

**Test Suites**
- Backend: 48 passing Pytest tests
- Frontend API: 19 passing Jest tests
- Mock fixtures and integration test support

**Project Structure**
- `/api/` - Backend Azure Functions
- `/api/.venv/` - Python virtual environment
- `/src/` - Frontend React app
- `/venv/` - Teams Toolkit config files
- Teams manifest and configuration ready

### 🚧 IN PROGRESS

**Frontend Migration** 
- Migration plan created (`frontend_link_up_refined.md`)
- Waiting for old frontend components to be copied
- Will adapt from Next.js to React SPA
- Remove split payments and overdue status
- Simplify to binary status (Paid/Due only)

### 📋 TODO

1. **Frontend Components** - Copy and adapt from old codebase
2. **Authentication** - Integrate Teams auth with API
3. **Dashboard Views** - Client list, payment forms, history
4. **Deployment** - Teams Toolkit provision and publish

---

## KEY FILES

**Backend**
- `/api/database/database.py` - Core DB operations
- `/api/database/models.py` - All Pydantic models
- `/api/calculations/function.json` - Newly added for variance endpoint
- `/api/requirements.txt` - Python dependencies

**Frontend**
- `/src/services/api.ts` - Complete TypeScript API client
- `/src/services/__tests__/api.test.ts` - API service tests
- `/src/static/scripts/app.tsx` - Teams Tab entry point
- `/package.json` - Updated with Jest and testing deps

**Documentation**
- `/DEVELOPER.md` - Complete database schema
- `/CLAUDE_README.md` - Developer guide
- `/TODO_FRONTEND.md` - Frontend requirements
- `/frontend_link_up_refined.md` - Migration plan
- `/api/CLAUDE.md` - Backend coding standards

**Configuration**
- `/api/local.settings.json` - Azure Functions config
- `/venv/.env.local` - Teams app environment
- `/jest.config.js` - Jest test configuration
- `/postcss.config.js` - Tailwind v4 setup

---

## RUNNING THE PROJECT

**Backend Tests**:
```powershell
cd api
.\.venv\Scripts\Activate.ps1
cd ..\tests
pytest
```

**Frontend Tests**:
```bash
npm test
# or for specific test file:
npm test -- --testPathPattern=api.test.ts
```

**Azure Functions** (Backend API):
```powershell
cd api
func start
```

**Frontend Development** (Teams Tab):
```bash
npm run dev:teamsfx
```

**Environment Variables Required**:
- `SQL_SERVER` - Azure SQL server name
- `SQL_DATABASE` - Database name
- `REACT_APP_API_URL` - API endpoint (defaults to http://localhost:7071/api)
- Azure AD credentials (automatic via DefaultAzureCredential)

---

## DATABASE SCHEMA

**9 Tables**: clients, contracts, payments, contacts, client_files, payment_files, client_metrics, quarterly_summaries, yearly_summaries

**2 Views**: client_payment_status, payment_file_view

**Key Features**:
- Temporal tracking (valid_from/valid_to for soft deletes)
- Supports percentage (0.0025 = 0.25%) and flat fee contracts
- Payment period validation (1-12 monthly, 1-4 quarterly)
- All payments in arrears (one period behind current)
- Automated metrics via database triggers
- No split payments (simplified from old system)

---

## RECENT CHANGES

**2025-07-02**:
- Created missing `calculations/function.json` for variance endpoint
- Fixed all Azure Function import paths from `../../backend` to `..`
- Added temporal fields (valid_from/to) to frontend TypeScript interfaces
- Created comprehensive API service test suite (19 tests)
- Configured Jest testing framework for frontend
- Created detailed frontend migration plan documents

**Key Simplifications from Old System**:
- Removed split payment functionality (single period only)
- Removed overdue status (binary: Paid or Due)
- PDF viewer UI preserved but no backend implementation (placeholder only)
- Simplified from Next.js to React SPA for Teams



Azure Functions API Implementation
From the tests, I can see you've successfully built:
1. Database Layer ✅

Azure SQL connection using DefaultAzureCredential for authentication
Pydantic models with proper validation for all tables
Simplified payment structure - single period instead of complex split ranges
No more Period class - just applied_period_type, applied_period, applied_year

2. Working API Endpoints ✅
python# Payment CRUD
POST   /api/payments         # Create payment (returns 201)
GET    /api/payments/{id}    # Get single payment
DELETE /api/payments/{id}    # Soft delete

# Dashboard aggregation
GET    /api/dashboard/{client_id}    # Returns unified data:
  - client info
  - payment_status (current/due/overdue)
  - compliance (status, color, reason)  
  - recent_payments
  - metrics (from triggers)

# Available periods  
GET    /api/periods?client_id=X&contract_id=Y
  - Returns unpaid periods for payment form dropdown
3. Key Simplifications ✅

Period handling: Just "quarterly" + 3 + 2025 instead of start/end ranges
Metrics automated: Database triggers update client_metrics table
Pre-calculated views: client_payment_status view for status logic
No manual calculations: Everything happens in SQL

4. Architecture
Teams Tab (React) → Azure Functions API → Azure SQL
                     ↓
                  Azure Identity Auth
The tests prove the core API is working - creating payments, retrieving aggregated dashboard data, and getting available periods. This is a much cleaner foundation than the old hacky SQLite version!





