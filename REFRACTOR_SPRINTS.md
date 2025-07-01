# REFACTOR SPRINTS

## Sprint 1: Fix Period String Parsing Bug

### Goal
Replace all string-based period handling with a proper Period object system. This fixes REAL BUGS in production where period comparisons and date arithmetic fail.

### Current State
- Periods stored as strings: "3-2024" for monthly, "Q1-2024" for quarterly
- `payment_service.py::get_available_periods()` - 180 lines of string manipulation chaos
- Period comparisons done with string operations (breaks when comparing "12-2023" to "1-2024")
- Every file using `split('-')` to parse periods
- Date arithmetic done by manually building strings

### Sprint Instructions

1. **First, document all current period bugs**:
   - Create `tests-refractor/SPRINT1-period-bugs.py`
   - Write tests that FAIL with current string implementation:
     - Test period comparison: "12-2023" should be < "1-2024"
     - Test period arithmetic: adding 1 month to "12-2023" should give "1-2024"
     - Test quarter boundaries: "Q4-2023" + 1 quarter = "Q1-2024"
   - These tests document the bugs we're fixing

2. **Create `backend/models/period.py`**:
   ```python
   class Period:
       # Handles both monthly and quarterly periods
       # Internal storage: year + month/quarter as integers
       # String representation for display only
       # Comparison operators work correctly
       # Arithmetic operations (add/subtract months/quarters)
   ```

3. **Create `backend/services/period_service.py`**:
   - Move ALL period logic from `payment_service.py` 
   - `get_available_periods()` returns Period objects, not strings
   - `get_next_period()`, `get_previous_period()` using Period arithmetic
   - `periods_between()` for range calculations
   - `parse_period_string()` for migrating existing data

4. **Update all services to use Period objects**:
   - Search for every `split('-')` in the codebase
   - Replace string manipulation with Period object methods
   - Update function signatures to accept/return Period objects
   - Keep string representation only for API responses and display

5. **Update database interactions**:
   - Periods still stored as strings in DB (for now)
   - Use `Period.from_string()` when reading from DB
   - Use `period.to_string()` when writing to DB
   - This allows incremental migration

6. **Run bug fix tests**:
   - Run the tests from step 1 - they should now PASS
   - This proves we fixed the period bugs

### Dependencies to Watch
- Frontend still expects string periods in API responses
- Keep string serialization for JSON responses
- Payment history queries need period comparisons to work correctly

### Files That Will Be Modified
- CREATE: `backend/models/period.py`
- CREATE: `backend/services/period_service.py`
- MODIFY: `backend/services/payment_service.py` (remove 180 lines of string chaos)
- MODIFY: Every file with `split('-')` operations
- CREATE: `tests-refractor/SPRINT1-period-bugs.py`

### Success Criteria
- Period comparison bugs: FIXED
- Period arithmetic bugs: FIXED
- All existing functionality works with Period objects
- No more string splitting for period logic

---

## Sprint 2: Backend Repository Consolidation + Dashboard Endpoint

### Goal
Eliminate the duplicate payment status and fee calculation logic scattered across client_service.py, payment_service.py, and contract_service.py by creating centralized repositories. Create a single dashboard endpoint that returns fully calculated data.

### Current State
- `client_service.py`: Lines 73-194 contain `get_client_payment_status()` with 121 lines of payment status logic
- `client_service.py`: Lines 35-44 and 62-71 duplicate compliance mapping
- `payment_service.py`: Lines 198-205 have `calculate_expected_fee()`
- `contract_service.py`: Lines 37-95 have another `calculate_expected_fee()` that's more complex
- SQL queries are embedded directly in service functions across 8 different files

### Sprint Instructions

1. **First, write a test to capture current behavior**:
   - Create `tests-refractor/SPRINT1-pre.py`
   - Test the current payment status logic from `client_service.get_client_payment_status()`
   - Test both fee calculation functions with same inputs
   - Log all outputs to ensure we maintain exact behavior

2. **Create `backend/repositories/payment_repository.py`**:
   - Start by searching for ALL instances of `calculate_expected_fee` across the codebase using grep
   - Copy the MORE COMPLEX version from `contract_service.py` as the single source of truth
   - Look at the function parameters - it needs contract data and payment data
   - Make sure to handle both fee types: PERCENTAGE (percent_rate * total_assets) and FLAT (flat_rate)
   - Delete the simpler version in `payment_service.py` lines 198-205
   - Update `payment_service.py` line 289 to import and use the repository version

3. **Create `backend/repositories/client_repository.py`**:
   - Move the ENTIRE `get_client_payment_status()` function from `client_service.py` (lines 73-194)
   - Also move the compliance mapping logic that's duplicated in lines 35-44
   - Create a single `map_payment_status_to_compliance()` function
   - Update `client_service.py` to import from repository for both `get_all_clients()` and `get_client_by_id()`

4. **Extract common SQL queries**:
   - In `payment_repository.py`, create a constant `PAYMENT_BASE_QUERY` with the SELECT and JOIN structure from `payment_service.py` lines 17-47
   - Update both `get_client_payments()` and `get_payment_by_id()` to use this base query
   - The only difference should be the WHERE clause

5. **Write post-refactor test**:
   - Create `tests-refractor/SPRINT1-post.py`
   - Run exact same test cases as pre-refactor
   - Compare outputs to ensure identical behavior

6. **Create unified dashboard endpoint**:
   - Create `GET /api/clients/{client_id}/dashboard` in `backend/api/clients.py`
   - This endpoint returns EVERYTHING the frontend needs:
     - Client info with calculated metrics
     - Payment status (compliant/overdue/etc)
     - Recent payments with all calculated fields
     - Expected vs actual fee comparisons
     - Next payment due information
   - Frontend should NOT need to call multiple endpoints or do any calculations

7. **Clean up**:
   - Delete the old functions from their original locations
   - Remove any imports that are no longer needed
   - Search for any other calls to the old functions and update them

### Dependencies to Watch
- When moving `get_client_payment_status()`, make sure you also move its helper logic for date calculations
- The compliance mapping is used in multiple places - make sure all references are updated
- Check that `payment_service.enhance_payment_with_details()` still works after moving fee calculation

### What NOT to Change
- Don't modify the actual calculation logic - just move it
- Don't change function signatures unless absolutely necessary
- Don't optimize the SQL queries yet - just extract them

### Files That Will Be Modified
- CREATE: `backend/repositories/payment_repository.py`
- CREATE: `backend/repositories/client_repository.py`
- CREATE: `backend/repositories/__init__.py`
- MODIFY: `backend/services/client_service.py` (remove ~150 lines)
- MODIFY: `backend/services/payment_service.py` (remove ~10 lines, update imports)
- MODIFY: `backend/services/contract_service.py` (remove ~58 lines)
- ADD: Dashboard endpoint to `backend/api/clients.py`

### Success Criteria
- All tests pass with identical outputs
- No duplicate payment status or fee calculation logic remains
- All SQL queries for payments are in the repository
- Single dashboard endpoint provides all frontend data needs

---

## Sprint 3: Frontend Business Logic Removal

### Goal
Move all fee calculations, period calculations, and business logic from the frontend to backend API endpoints.

### Current State
- `frontend/src/lib/feeUtils.js` has `calculateExpectedFee()` 
- `frontend/src/lib/dateUtils.js` has period calculation logic
- Business rules are duplicated between frontend and backend

### Sprint Instructions

1. **Create new API endpoints**:
   - Add `POST /api/payments/calculate-fee` endpoint that takes contract and asset data
   - Add `POST /api/payments/calculate-periods` endpoint for period calculations
   - Add `GET /api/payments/next-due` endpoint for next payment due calculations
   - These should use the repositories from Sprint 2

2. **Update frontend to use API**:
   - Replace all calls to `calculateExpectedFee()` with API calls
   - Replace period calculation logic with API calls
   - Remove the business logic functions entirely

3. **Update payment form**:
   - Find where `PaymentForm` component calculates fees
   - Replace with API call to get expected fee
   - Make sure loading states are handled

4. **Update dashboard to use new endpoint**:
   - Update frontend to use the single `/api/clients/{id}/dashboard` endpoint
   - Remove multiple API calls that fetch partial data
   - Remove any frontend calculations that dashboard endpoint now provides

5. **Clean up**:
   - Delete `frontend/src/lib/feeUtils.js`
   - Remove business logic from `frontend/src/lib/dateUtils.js` (keep formatting functions)
   - Remove any other business calculations from components

### Dependencies
- Make sure the API endpoints return data in the same format the frontend expects
- Handle loading states when making API calls
- Consider caching with React Query to avoid excessive API calls

### Files That Will Be Modified
- CREATE: New endpoints in `backend/api/payments.py`
- DELETE: `frontend/src/lib/feeUtils.js`
- MODIFY: `frontend/src/lib/dateUtils.js` (remove calculation logic)
- MODIFY: `frontend/src/components/payment/PaymentForm.jsx`
- MODIFY: Any other components using these utils

---

## Sprint 4: Model Simplification

### Goal
Reduce the 15+ model classes down to essential ones by eliminating unnecessary inheritance and redundant classes.

### Current State
- `backend/models/` has separate files for clients, contracts, payments, files
- Multiple versions: `Payment`, `PaymentBase`, `PaymentCreate`, `PaymentWithDetails`
- `Client`, `ClientMetrics`, `ClientSummary` have overlapping fields
- Unnecessary Pydantic inheritance hierarchies

### Sprint Instructions

1. **Analyze current model usage**:
   - Use grep to find all imports from `backend.models`
   - List which models are actually used in API endpoints
   - Identify which fields are used in each context

2. **Create simplified `backend/models/schemas.py`**:
   - Start with these base models only:
     ```python
     class Client(BaseModel):
         # Combine fields from Client + ClientMetrics
         # Use Optional[] for fields that aren't always present
     
     class Contract(BaseModel):
         # Single contract model
     
     class Payment(BaseModel):
         # Combine Payment + PaymentWithDetails
         # Use Optional[] for computed fields
     
     class File(BaseModel):
         # Single file model
     ```

3. **Update API endpoints**:
   - Find every endpoint that returns model data
   - Update to use the new simplified models
   - For create/update operations, use the same model with Optional fields

4. **Handle special cases**:
   - `ClientMetrics` fields should be Optional in the main Client model
   - `PaymentWithDetails` computed fields should be Optional in Payment model
   - Remove separate Create/Update models - use the same model with Optional

5. **Clean up**:
   - Delete all the old model files
   - Update all imports to use `from backend.models.schemas import ...`
   - Remove any model transformation code that's no longer needed

### Files That Will Be Modified
- CREATE: `backend/models/schemas.py`
- DELETE: All existing files in `backend/models/` except `__init__.py`
- UPDATE: All files that import from `backend.models`

### What to Watch For
- Some API endpoints might be transforming between model types - this code can be deleted
- Validation rules should be preserved in the new models
- Make sure all Pydantic field validators are moved to the new models

---

## Sprint 5: Component Consolidation

### Goal
Delete duplicate components and split large components into manageable pieces.

### Current State
- Two DocumentViewer components: `document/DocumentViewer.jsx` (working) and `payment/DocumentViewer.jsx` (stub)
- PaymentForm.jsx is 380 lines with mixed concerns
- Multiple components tracking same state

### Sprint Instructions

1. **Delete duplicate DocumentViewer**:
   - First, use grep to find all imports of DocumentViewer
   - Verify that `payment/DocumentViewer.jsx` is indeed just a stub
   - Delete `frontend/src/components/payment/DocumentViewer.jsx`
   - Update `frontend/src/layouts/PageLayout.jsx` to import from `../components/document/DocumentViewer`

2. **Split PaymentForm monster**:
   - Create `frontend/src/components/payment/PaymentForm/` directory
   - Extract validation logic to `PaymentForm/usePaymentValidation.js`
   - Extract form submission logic to `PaymentForm/usePaymentSubmit.js`
   - Extract period selection logic to `PaymentForm/PeriodSelector.jsx`
   - Keep main form as orchestrator only

3. **Consolidate state management**:
   - Find all places where form dirty state is tracked
   - Remove local state tracking if it's already in global store
   - Use single source of truth for each piece of state

4. **Clean up imports**:
   - Update all imports to use the new component locations
   - Remove any unused imports

### What to Watch For
- Make sure all DocumentViewer features still work after consolidation
- Ensure form validation still works after extraction
- Test that form dirty detection still works

### Files That Will Be Modified
- DELETE: `frontend/src/components/payment/DocumentViewer.jsx`
- CREATE: `frontend/src/components/payment/PaymentForm/` directory with new files
- MODIFY: `frontend/src/components/payment/PaymentForm.jsx` (reduce by ~200 lines)
- MODIFY: `frontend/src/layouts/PageLayout.jsx`

---

## Sprint 6: State Management & API Cleanup

### Goal
Standardize on React Query for all data fetching and remove redundant API handling code.

### Current State
- Custom retry logic in `api.js`
- React Query retry in some hooks
- Manual health checks in components
- Multiple ways of handling loading/error states

### Sprint Instructions

1. **Standardize API client**:
   - Remove `fetchWithRetry` function from `frontend/src/lib/api.js`
   - Configure React Query default options for retry behavior
   - Remove manual retry logic everywhere

2. **Remove redundant health checks**:
   - Find all manual API health checks in components
   - Remove them - let React Query handle connection errors
   - Update error boundaries to handle API errors consistently

3. **Consolidate data fetching hooks**:
   - Make sure all API calls go through React Query
   - Remove any direct fetch calls in components
   - Standardize error handling in all hooks

4. **Clean up loading states**:
   - Use React Query's isLoading consistently
   - Remove manual loading state management
   - Ensure skeleton screens work properly

### Files That Will Be Modified
- MODIFY: `frontend/src/lib/api.js` (remove retry logic)
- MODIFY: `frontend/src/pages/_app.js` (configure React Query)
- MODIFY: All components with manual health checks
- MODIFY: All custom hooks using API

---

## Sprint 7: Final Cleanup & Dead Code Removal

### Goal
Remove all dead code, unused imports, orphaned files, and any remaining redundancy.

### Current State
- Unused imports from refactoring
- Commented out code blocks
- Functions with zero references
- Orphaned test files

### Sprint Instructions

1. **Find and remove dead code**:
   - Use grep to find all `TODO`, `FIXME`, `HACK` comments - evaluate and remove
   - Search for commented-out code blocks and delete them
   - Find all console.log statements and remove them

2. **Clean up imports**:
   - In each file, check every import
   - Remove unused imports
   - Consolidate multiple imports from same module

3. **Find orphaned code**:
   - For each function in services, search for references
   - Delete functions with zero references
   - Delete files that are no longer imported anywhere

4. **Remove redundant files**:
   - Check for backup files (*.bak, *.old)
   - Remove any duplicate configuration files
   - Clean up test files that test deleted code

5. **Update dependencies**:
   - Remove unused packages from package.json
   - Remove unused Python packages from requirements.txt
   - Make sure all used packages are properly listed

6. **Final verification**:
   - Run the application end-to-end
   - Verify all features still work
   - Run any existing tests

### What to Watch For
- Don't delete files that are dynamically imported
- Keep configuration files even if they seem unused
- Some "dead" code might be used by scripts or tools

### Files That Will Be Modified
- ALL FILES (removing imports/dead code)
- DELETE: Any orphaned files found
- MODIFY: package.json, requirements.txt

---

## Post-Sprint Documentation

After completing each sprint, update `REFACTOR_LOG.md` with:
- What was removed and why (with line counts)
- What was consolidated (before/after locations)
- Any suspicious code left and why
- Patterns noticed for future cleanup
- Test results showing functionality preserved

Remember: The goal is a working application with 30%+ less code that's actually maintainable.