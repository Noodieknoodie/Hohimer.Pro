# Frontend Migration Plan - Refined Version

## Part A: Instructions for the Human User

### What You Need to Copy from Old Codebase

#### 1. Core Component Directories
Copy these directories from your old Next.js app to the new structure:

```
OLD: components/clients/*     → NEW: src/components/clients/
OLD: components/dashboard/*   → NEW: src/components/dashboard/
OLD: components/payments/*    → NEW: src/components/payments/
OLD: components/ui/*          → NEW: src/components/ui/
OLD: components/layout/*      → NEW: src/components/layout/
```

#### 2. Hooks and Utilities
```
OLD: hooks/*                  → NEW: src/hooks/
OLD: lib/formatUtils.js       → NEW: src/utils/formatters.ts
OLD: lib/dateUtils.js         → NEW: src/utils/dateUtils.ts
OLD: lib/constants.js         → NEW: src/utils/constants.ts
```

#### 3. State Management
```
OLD: store/*                  → NEW: src/store/
```

#### 4. Create These New Files

**src/static/scripts/App.tsx**:
Create a basic React app component that imports React Query for data fetching and the Teams context from m365agents. Set up a QueryClient with reasonable defaults (5 minute stale time, retry once). The component should check if Teams context is loading and show a loading message if so, otherwise wrap the app in a QueryClientProvider.

**src/static/styles/app.css**:
Create a CSS file that imports Tailwind CSS v4 using the new @import syntax. Add Teams-specific base styling using Segoe UI font family and appropriate background colors for Teams integration.

#### 5. Files to Modify When Copying
- ⚠️ DocumentViewer components - Keep UI but remove PDF rendering
- ⚠️ Layout components - Keep document panel structure

#### 6. DO NOT Copy These
- ❌ react-pdf library and PDF rendering logic
- ❌ SplitPaymentControls or split payment logic
- ❌ Next.js specific files (pages/, _app.tsx, _document.tsx)
- ❌ API routes directory
- ❌ Complex fee calculation utilities

### What to Tell the AI Assistant

After copying the files, tell the AI:
"I've copied the old frontend components into the src directory. Please proceed with the migration following the Phase B instructions in frontend_link_up_refined.md"

---

## Part B: Instructions for AI Coding Assistant

### Phase 1: Update Package Dependencies

1. **Remove Next.js dependencies** from package.json:
   - Remove: next, @next/font, etc.
   - Keep: react, react-dom, @tanstack/react-query, zustand

2. **Ensure Teams dependencies** are present:
   - @microsoft/teams-js (already installed)
   - @fluentui/react-components (for Teams-style UI if needed)

### Phase 2: Adapt Components from Next.js to React

1. **Replace Next.js imports**:
   - Change all Next.js Link components to regular anchor tags or React Router links if you add routing
   - Replace useRouter from Next.js with Zustand store or React state for navigation
   - Remove any Next.js specific hooks and utilities

2. **Update Image components**:
   - Replace Next.js Image components with regular HTML img tags
   - Remove any Next.js image optimization features

### Phase 3: Integrate with Existing API Service

1. **Update all API calls** to use the existing TypeScript API service at `src/services/api.ts`:
   - Replace all direct fetch calls with the typed API service methods
   - Change from relative API routes to using the api object methods
   - For example, fetching clients changes from calling '/api/clients' to calling api.clients.list()

2. **Update React Query hooks**:
   - Import the api service into your custom hooks
   - Update query functions to use the typed API methods
   - Maintain the same query key structure for caching
   - Pass any parameters (like provider filters) directly to the API methods

### Phase 4: Remove Split Payment Features

1. **PaymentForm.tsx modifications**:
   - Remove all split payment state variables and toggle functionality
   - Delete the SplitPaymentControls component import and usage
   - Remove start_period and end_period fields entirely
   - Replace with a single period selection using applied_period_type, applied_period, and applied_year
   - Simplify the form data structure to only track one payment period
   - Default the payment method to 'Check' and include standard fields like received_date, total_assets, actual_fee, and notes

2. **PaymentHistory.tsx simplification**:
   - Remove all expandable row functionality and state
   - Delete the ExpandedPaymentDetails component
   - Remove chevron icons used for expanding rows
   - Display the single period using the formatAppliedPeriod utility function
   - Show period as "March 2024" for monthly or "Q1 2024" for quarterly payments

### Phase 5: Implement Binary Status System

1. **Update StatusBadge component**:
   - Remove the 'overdue' status type, keeping only 'paid' and 'due'
   - Update styling to show green for paid status and yellow for due status
   - Remove any red color styling that was used for overdue
   - Simplify the component to handle only two states

2. **Update ClientList.tsx**:
   - Use the dashboard data from the API which now returns only 'Paid' or 'Due' status
   - Update status color logic to return green for 'Paid' and yellow for 'Due'
   - Remove all logic that tracks or displays overdue periods
   - Remove any arrays or lists of missing payment periods

3. **Simplify ComplianceCard.tsx**:
   - Display only the status badge using the binary status from the backend
   - Show the compliance reason text provided by the backend
   - Completely remove the "Missing Payments" section
   - Remove any logic that calculates or displays overdue information

### Phase 6: Create Period Selection Component

1. **New PeriodSelector.tsx**:
   - Create a new component that fetches available periods from the API
   - Use React Query to call the periods endpoint with client and contract IDs
   - Display periods as a dropdown/select element
   - Each period should show a user-friendly label like "Q1 2024" or "March 2024"
   - The component should handle loading and error states appropriately
   - Default to selecting the first available period (most recent unpaid)

### Phase 7: Update Formatting Utilities

1. **In src/utils/formatters.ts**:
   - Create or update formatCurrency function to handle null/undefined values and format numbers as USD currency
   - Create formatPercentage function that converts decimal rates (0.0025) to percentage strings (0.25%)
   - Add formatAppliedPeriod function that takes period type, number, and year
   - For monthly periods, convert number (1-12) to month name (January-December)
   - For quarterly periods, format as Q1, Q2, Q3, or Q4
   - Ensure all formatters handle edge cases and null values gracefully

### Phase 8: Update Document Features

1. **Keep the UI components**:
   - Preserve the DocumentViewer component structure and styling
   - Maintain the slide-out panel functionality from the right side
   - Keep the file list display if backend provides file names

2. **Remove backend integration**:
   - Remove all PDF rendering logic and the react-pdf library
   - Remove actual file fetching and loading functionality
   - Keep the UI shell but remove the content display logic

3. **Add placeholder content**:
   - Update DocumentViewer to show a "Preview functionality coming soon" message
   - Display file names if available from the backend
   - Keep the open/close functionality and animations
   - Show a gray placeholder area where the PDF would normally render
   - Maintain all the UI state management for opening and closing the viewer

### Phase 9: Wire Everything Together

1. **Update App.tsx**:
   - Import the main layout components: PageLayout, ClientList, and Dashboard
   - Use the Zustand store to manage selected client state
   - Set up the main app structure with a flex layout
   - Show ClientList on the left side
   - Conditionally render Dashboard when a client is selected
   - Wrap everything in the QueryClientProvider for data fetching

2. **Update store for simple state**:
   - Create an interface for the app state with selected client tracking
   - Add document viewer state (open/closed and selected document)
   - Include setter functions for updating client selection
   - Include setter function for controlling document viewer
   - Keep the store simple and focused on UI state only
   - Remove any complex state that's now handled by the backend

### Phase 10: Final Cleanup

1. **Update all imports** to use proper paths
2. **Remove unused dependencies** from package.json
3. **Test each major flow**:
   - Client selection
   - Dashboard display
   - Payment creation (single period only)
   - Payment history viewing

### Validation Requirements

Ensure these match the backend:
- Percentage rates: 0-1 range (0.0025 for 0.25%)
- Payment periods: 1-12 for monthly, 1-4 for quarterly
- Required fields: client_id, contract_id, received_date, applied period info

### Expected Final Structure

```
src/
  components/
    clients/
      ClientList.tsx (simplified, no overdue)
      ClientCard.tsx
    dashboard/
      Dashboard.tsx
      ComplianceCard.tsx (binary status only)
      PaymentInfoCard.tsx
      ContractCard.tsx
    payments/
      PaymentForm.tsx (single period only)
      PaymentHistory.tsx (no expansion)
      PeriodSelector.tsx (new)
    ui/
      (all basic UI components)
  hooks/
    useClients.ts
    usePayments.ts
    useDashboard.ts
  services/
    api.ts (already exists)
  static/
    scripts/
      App.tsx
      app.tsx (entry point, already exists)
    styles/
      app.css
  store/
    index.ts (simplified)
  utils/
    formatters.ts
    dateUtils.ts
    constants.ts
```

### Success Criteria

The migration is complete when:
1. ✅ No split payment UI or logic remains
2. ✅ Status is only Paid (green) or Due (yellow)
3. ✅ All API calls use the typed service
4. ✅ Payment form accepts single periods only
5. ✅ Document viewer UI preserved with placeholder content
6. ✅ Works within Teams Tab environment
7. ✅ Uses Tailwind v4 with @import syntax