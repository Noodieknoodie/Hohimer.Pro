# Frontend Migration Plan

## Part A: Instructions for the Human User

### Step 1: Prepare Raw Materials from Old Codebase

From your old frontend repository, you need to copy these specific directories and files:

1. **Copy the entire components directory structure**:
   ```
   OLD_REPO/components/ → NEW_REPO/src/components/
   ```
   This should include:
   - `clients/` - ClientList, ClientCard, ClientSearch
   - `dashboard/` - Dashboard, ComplianceCard, PaymentInfoCard, ContractCard  
   - `payments/` - PaymentForm, PaymentHistory, PaymentFormFields
   - `ui/` - Button, Card, Input, Select, DatePicker, StatusBadge, etc.
   - `layout/` - PageLayout, Header, Sidebar

2. **Copy hooks directory**:
   ```
   OLD_REPO/hooks/ → NEW_REPO/src/hooks/
   ```
   Include all custom hooks like useClients, usePayments, etc.

3. **Copy utility files**:
   ```
   OLD_REPO/lib/formatUtils.js → NEW_REPO/src/utils/formatters.ts
   OLD_REPO/lib/dateUtils.js → NEW_REPO/src/utils/dateUtils.ts
   OLD_REPO/lib/constants.js → NEW_REPO/src/utils/constants.ts
   ```

4. **Copy the store directory** (for Zustand state):
   ```
   OLD_REPO/store/ → NEW_REPO/src/store/
   ```

5. **Create the main App component**:
   Create a new file at `src/static/scripts/App.tsx` with this basic structure:
   ```tsx
   import React from 'react';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   
   const queryClient = new QueryClient();
   
   export default function App() {
     return (
       <QueryClientProvider client={queryClient}>
         {/* Main app content will go here */}
       </QueryClientProvider>
     );
   }
   ```

6. **Create the CSS file**:
   Create `src/static/styles/app.css`:
   ```css
   @import "tailwindcss";
   ```

### Step 2: Files to Copy but Modify

**Copy these but they'll need updates**:
- DocumentViewer components (keep UI, remove PDF rendering)
- Layout components with document viewer (keep structure)

**Skip these entirely** - they contain complexity we're removing:
- SplitPaymentControls component
- Complex period calculation utilities
- PDF rendering libraries/logic
- Next.js specific files (pages/, api/, next.config.js)

### Step 3: Note File Modifications Needed

When copying, be aware these files will need significant changes:
- PaymentForm.tsx - remove split payment logic
- PaymentHistory.tsx - remove expandable split details
- ComplianceCard.tsx - remove overdue status
- API integration files - will use new api.ts service

### Summary for Human

1. Copy `components/`, `hooks/`, `lib/` (as `utils/`), and `store/` directories
2. Create basic App.tsx and app.css files
3. Skip document viewer and split payment components
4. The AI assistant will handle all the code modifications

---

## Part B: Instructions for AI Coding Assistant (Claude Code)

Once the raw materials are in place, perform these modifications in order:

### Phase 1: Remove Split Payment Logic

1. **In PaymentForm component**:
   - Remove `is_split_payment` state and toggle
   - Remove `SplitPaymentControls` import and usage
   - Change from start/end period to single `applied_period` dropdown
   - Remove period range validation
   - Update form submission to use new API format:
     ```typescript
     {
       applied_period_type: 'monthly' | 'quarterly',
       applied_period: number,
       applied_year: number
     }
     ```

2. **In PaymentHistory component**:
   - Remove expandable row functionality
   - Remove `ExpandedPaymentDetails` component
   - Remove chevron icons for expansion
   - Display single period instead of range

3. **In payment-related hooks**:
   - Update mutation payloads to match new API
   - Remove split payment field mapping

### Phase 2: Simplify Status System

1. **In ClientList/Sidebar**:
   - Remove all "overdue" status logic
   - Change status colors to only green (paid) and yellow (due)
   - Remove `overdue_periods` array handling
   - Simplify status display to use backend's binary status

2. **In ComplianceCard**:
   - Remove "Missing Payments" section
   - Remove red color states
   - Display only "Paid" or "Due" status from backend
   - Simplify logic to show current period status

3. **In StatusBadge component**:
   - Remove "overdue" variant
   - Keep only "paid" (green) and "due" (yellow) variants

### Phase 3: Update API Integration

1. **Replace all API calls** to use the new `src/services/api.ts`:
   ```typescript
   import { api } from '@/services/api';
   
   // Example replacements:
   // OLD: await apiClient.get('/api/clients')
   // NEW: await api.clients.list()
   ```

2. **Update React Query hooks** to use new API:
   ```typescript
   useQuery({
     queryKey: ['clients'],
     queryFn: () => api.clients.list()
   })
   ```

3. **Remove these endpoints** (no longer exist):
   - `/calculate-fee` - backend calculates automatically
   - Any split payment specific endpoints

### Phase 4: Adapt to Teams Environment

1. **In App.tsx**:
   - Import and use existing Teams context from `app.tsx`
   - Set up routing for single-page app (no Next.js router)
   - Apply Teams-appropriate styling

2. **Update Layout components**:
   - Remove Next.js Link components, use regular navigation
   - Ensure responsive design for Teams sidebar width
   - Keep document viewer panel but update to show placeholder content

3. **Style Updates**:
   - Convert Tailwind v3 classes to v4 where needed
   - Remove `tailwind.config.js` dependencies
   - Use CSS variables for theme customization

### Phase 5: Simplify Form Components

1. **In PaymentFormFields**:
   - Remove start/end period selectors
   - Implement single period dropdown using `/api/periods` endpoint
   - Remove expected fee calculation display
   - Simplify to: date, amount, assets, method, notes, period

2. **Period formatting**:
   - Create/update `formatAppliedPeriod` function:
     ```typescript
     function formatAppliedPeriod(type: string, period: number, year: number) {
       if (type === 'monthly') {
         return `${MONTH_NAMES[period-1]} ${year}`;
       }
       return `Q${period} ${year}`;
     }
     ```

### Phase 6: Update Document Handling

1. **Keep the UI structure**:
   - DocumentViewer component (modify to show placeholder)
   - Slide-out panel functionality
   - File list display if available

2. **Remove the backend integration**:
   - PDF rendering logic
   - react-pdf dependency
   - Actual file fetching

3. **Add placeholder content**:
   ```typescript
   // In DocumentViewer component
   <div className="p-4">
     <h3>Document Preview</h3>
     <p className="text-gray-500">
       Preview functionality coming soon
     </p>
     {/* Show file list if available */}
   </div>
   ```

### Phase 7: Update Utilities

1. **In formatters.ts**:
   - Keep `formatCurrency` and `formatPercentage`
   - Remove complex period calculations
   - Add period display formatting

2. **In dateUtils.ts**:
   - Simplify to basic date formatting
   - Remove period range calculations
   - Keep arrears period logic

### Phase 8: State Management

1. **Update Zustand store**:
   - Keep document viewer state (open/closed, selected file)
   - Simplify client selection state
   - Remove split payment related state

2. **Simplify form state**:
   - Use react-hook-form or single state object
   - Remove complex validation for splits

### Phase 9: Final Integration

1. **Connect all components** in App.tsx:
   - Set up main layout with sidebar
   - Implement client selection flow
   - Wire up dashboard display

2. **Test critical paths**:
   - Client selection and dashboard loading
   - Payment creation (single period)
   - Payment history display
   - Status indicators (green/yellow only)

3. **Clean up**:
   - Remove unused imports
   - Delete commented split payment code
   - Update TypeScript types to match new API

### Key Principles for AI Assistant

1. **When in doubt, simplify** - This is a simplification project
2. **Binary status only** - No overdue, just Paid/Due
3. **Single periods only** - No ranges, no splits
4. **Use new API service** - Don't recreate API calls
5. **Preserve good UX** - Keep loading states, error handling
6. **Teams-first design** - Consider Teams context always

### Expected Outcome

A significantly simpler frontend that:
- Works as a Teams Tab
- Uses the new backend API
- Has no split payment complexity
- Shows only Paid/Due status
- Focuses on core payment tracking functionality