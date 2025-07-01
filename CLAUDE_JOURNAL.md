# CLAUDE JOURNAL

## PROJECT OVERVIEW

**401(k) Payment Tracking System** - A Microsoft Teams Tab application that tracks advisor fee payments for 401(k) retirement plans.

**TECH STACK**:
- **Platform**: Microsoft Teams Tab (Teams Toolkit)
- **Backend**: Python/FastAPI in `/api` directory  
- **Database**: Azure SQL Database with Azure AD auth
- **Frontend**: React/Next.js with Tailwind CSS
- **Testing**: Pytest with 48 passing tests

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

**Test Suite** (`/tests/backend_tests/`)
- 48 passing tests covering models, CRUD, and edge cases
- Mock fixtures for unit testing
- Integration tests (skipped without DB credentials)
- All imports updated for new `/api` structure

**Project Structure**
- `/api/` - Backend code (moved from `/backend/`)
- `/api/.venv/` - Python virtual environment
- `/venv/` - Teams Toolkit config files
- Azure Functions config (`host.json`, `local.settings.json`)

### 🚧 READY TO BUILD

1. **Azure Functions HTTP triggers**
2. **Frontend Components** - MIGRATE OVER AND SET IT UP TO WORK WITH NEW
3. **Authentication** - Integrate Teams auth with API
4. **File Upload** - SKIPPING 
5. **Dashboard** - Metrics and payment summaries TBD

---

## KEY FILES

**Backend**
- `/api/database/database.py` - Core DB operations
- `/api/database/models.py` - All Pydantic models
- `/api/requirements.txt` - Python dependencies

**Documentation**
- `/DEVELOPER.md` - Complete database schema
- `/api/CLAUDE.md` - Backend coding standards
- `/frontend/CLAUDE.md` - Frontend guidelines

**Configuration**
- `/api/local.settings.json` - Azure Functions config
- `/venv/.env.local` - Teams app environment

---

## RUNNING THE PROJECT

**Backend Tests**:
```powershell
cd api
.\.venv\Scripts\Activate.ps1
cd ..\tests
pytest
```

**Azure Functions**:
```powershell
cd api
func start
```

**Environment Variables Required**:
- `SQL_SERVER` - Azure SQL server name
- `SQL_DATABASE` - Database name
- Azure AD credentials (automatic via DefaultAzureCredential)

---

## DATABASE SCHEMA

**9 Tables**: clients, contracts, payments, contacts, client_files, payment_files, client_metrics, quarterly_summaries, yearly_summaries

**2 Views**: client_payment_status, payment_file_view

**Key Features**:
- Temporal tracking (valid_from/valid_to)
- Supports percentage and flat fee contracts
- Payment period validation
- All payments in arrears


