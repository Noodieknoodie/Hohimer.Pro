# Frontend Migration Sprint List

## Sprint 1: API Alignment & Type Safety
Get the frontend talking to the backend correctly - fix the fundamental data flow mismatch.

## Tasks
- [x] Update TypeScript interfaces to match actual backend responses (remove split payment fields)
- [x] Fix api.ts endpoints to match Azure Functions URLs (/api/dashboard/{id}, not /clients/{id}/dashboard)
- [x] Remove calculateFee endpoint call - backend calculates inline
- [x] Update period structure from 8-field to 3-field system (type, period, year)
- [x] Add proper error handling for Azure AD auth failures

## Dependencies
- Backend must be running locally (func start)
- TypeScript API service exists at src/services/api.ts

## Success Criteria
- API service tests pass with correct data structures
- Can fetch client dashboard data without errors
- Period data matches backend format

---

## Sprint 2: State Management Cleanup
Remove legacy state complexity that doesn't exist in the new backend.

## Tasks
- [x] Strip split payment state from Zustand store
- [x] Remove overdue status tracking (backend only has Paid/Due)
- [x] Update selectedDocumentUrl pattern to match new structure
- [x] Remove file upload state (backend only tracks has_files boolean)
- [x] Simplify period selection state to match backend

## Dependencies
- Sprint 1 complete (correct API data structures)
- Zustand store exists at src/store/index.js

## Success Criteria
- Store only tracks state that backend actually provides
- No console errors about missing state fields
- Form state matches backend expectations

DEV NOTE:  Key findings:
  - Zustand store was already clean - no split payment or file upload state present
  - selectedDocumentUrl is already a simple string pattern
  - No file upload components exist in the codebase
  - The main state complexity was in the payment form hooks, not the global store

  Why this was exactly what's needed: The backend only supports single-period payments with 3 fields (type, period, year), so removing the 8-field split payment system from the frontend eliminates a major source of confusion and potential bugs. The binary status system (Paid/Due) matches what the backend actually tracks, preventing UI states that don't exist in the data model. This sprint ensures the frontend state management aligns perfectly with backend reality.

---

## Sprint 3: Core Component Surgery
Update the money-making components - payment form and history.

## Tasks
- [x] Simplify PaymentForm to single period entry (remove split payment controls)
- [x] Update PaymentFormFields to use /api/periods endpoint instead of client-side calculation
- [x] Remove ExpandedPaymentDetails component entirely
- [x] Update PaymentHistory to show flat table without expansion
- [x] Fix period display to use new 3-field format

## Dependencies
- Sprint 2 complete (clean state management)
- Payment components exist in src/components/payment/

## Success Criteria
- Can create a payment with single period
- Payment history displays without expansion UI
- No references to split payments in code


AGENT NOTE: Why this was exactly what's needed:
  The backend only tracks single-period payments with 3 fields, so the complex split payment UI was creating a false impression of functionality that doesn't exist. By removing the
  expansion UI and split controls, users can only enter data that the backend can actually store. The simplified form matches the backend's data model exactly, preventing confusion and errors. The flat payment history table is cleaner and faster, showing all relevant data without hiding it behind clicks.


---

## Sprint 4: Status Display Simplification
Update all status indicators to binary system.

## Tasks
- [x] Update StatusBadge to only show green (Paid) or yellow (Due)
- [x] Remove all red/overdue status logic
- [x] Update ComplianceCard to match dashboard compliance object
- [x] Fix ClientSearch status icons (remove red option)
- [x] Update color constants to remove overdue states

## Dependencies
- Backend provides binary status in dashboard endpoint
- Status components scattered throughout codebase

## Success Criteria
- No red status indicators anywhere
- Status displays match backend's binary system
- Compliance reasons show correctly

DEV NOTE:   Key changes:
  - ComplianceCard now reads payment_status.status (Paid/Due) from dashboard API
  - Removed overdue periods display and logic
  - Status icons simplified to green (Paid) or yellow (Due) only
  - Compliance reason now comes from backend's compliance.reason field

  Why this was exactly what's needed:
  The backend only tracks binary payment status (Paid/Due), so having three colors (green/yellow/red) in the UI was misleading. By removing the red "overdue" state, the UI now accurately     
   reflects what the backend tracks. The compliance card now properly consumes the dashboard API's compliance object, showing the backend's calculated reason instead of making up its own     
   logic. This prevents confusion where the UI shows "overdue" for something the backend considers simply "due".


---

## Sprint 5: Dashboard Integration
Connect the main dashboard view to the simplified backend.

## Tasks
- [x] Update ClientDashboard to consume new dashboard endpoint structure
- [x] Fix contract data display (single active contract)
- [x] Update metrics display to match backend response
- [x] Remove client-side variance calculations (use backend endpoint)
- [x] Simplify payment summary to match backend structure

## Dependencies
- Sprints 1-4 complete (correct data flow and components)
- Dashboard endpoint returns comprehensive client view

## Success Criteria
- Dashboard loads without errors
- All cards display correct data
- No loading states for non-existent endpoints


DEV NOTES :  Key changes:
  - ClientDashboard now makes ONE API call instead of FOUR
  - PaymentInfoCard uses dashboard metrics instead of calculating locally
  - Contract display already handles single active contract
  - Variance calculations already using backend (in payment objects)
  - Added YTD payments display from metrics

  Why this was exactly what's needed:
  The dashboard endpoint was designed to provide all dashboard data in one call, but the frontend was still making multiple separate API calls. By consolidating to use just the dashboard     
   endpoint, we've reduced network requests by 75% and ensured all displayed data is consistent. The metrics from the backend are pre-calculated and cached, so using them instead of
  client-side calculations improves performance and accuracy. This matches the backend's intention of providing a comprehensive dashboard view in a single, efficient API call.

---

## Sprint 6: Document Viewer Placeholder
Handle the document viewer gap gracefully.

## Tasks
- [x] Add "Coming Soon" overlay to DocumentViewer component
- [x] Keep UI shell but disable PDF loading
- [x] Update file status to only show has_files boolean
- [x] Remove file upload UI elements
- [x] Add informational message about future functionality

## Dependencies
- DocumentViewer exists but backend has no file endpoints
- Product decision on file management timeline

## Success Criteria
- Document viewer shows but doesn't try to load PDFs
- Clear user messaging about feature status
- No console errors about missing endpoints

DEV NOTES: Key changes:
  - Removed react-pdf imports and PDF rendering logic
  - Added semi-transparent overlay with "Coming Soon" message
  - Preserved the UI shell to show users what's coming
  - Removed all PDF loading, navigation, and zoom functionality
  - Simplified component to just show placeholder state

  Why this was exactly what's needed:
  As you correctly noted, this sprint was simpler than it sounded. The backend doesn't have file endpoints yet, so attempting to load PDFs would just error. By showing a clean "Coming        
  Soon" overlay, users understand the feature is planned but not yet available. The preserved UI shell gives them a preview of what to expect. This prevents confusion and errors while        
  maintaining a professional appearance.

---

## Sprint 7: Testing & Cleanup
Remove dead code and ensure reliability.

## Tasks
- [ ] Delete all split payment related files and functions
- [ ] Remove unused API endpoints from service layer
- [ ] Update component tests to match new data structures
- [ ] Delete legacy Next.js configuration
- anything else you see. 

## Dependencies
- All functionality migrated and working


## Success Criteria
- No dead code remaining
- Build completes without warnings
- No references to removed features

