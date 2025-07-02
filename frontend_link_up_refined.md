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
```tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeamsContext } from './m365agents';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  const { context, loading } = useTeamsContext();
  
  if (loading) {
    return <div>Loading Teams context...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* PageLayout and main app content will go here */}
    </QueryClientProvider>
  );
}
```

**src/static/styles/app.css**:
```css
@import "tailwindcss";

/* Teams-specific styling */
@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
    font-family: 'Segoe UI', system-ui, sans-serif;
  }
}
```

#### 5. DO NOT Copy These
- ❌ Any DocumentViewer or PDF-related components
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
   ```typescript
   // OLD
   import Link from 'next/link';
   import { useRouter } from 'next/router';
   
   // NEW
   import { Link } from 'react-router-dom'; // or use regular <a> tags
   // For navigation, use Zustand store or React state
   ```

2. **Update Image components**:
   ```typescript
   // OLD
   import Image from 'next/image';
   
   // NEW
   // Use regular <img> tags
   ```

### Phase 3: Integrate with Existing API Service

1. **Update all API calls** to use `src/services/api.ts`:
   ```typescript
   // OLD
   const response = await fetch('/api/clients');
   const data = await response.json();
   
   // NEW
   import { api } from '@/services/api';
   const data = await api.clients.list();
   ```

2. **Update React Query hooks**:
   ```typescript
   // In src/hooks/useClients.ts
   import { useQuery } from '@tanstack/react-query';
   import { api } from '@/services/api';
   
   export function useClients(provider?: string) {
     return useQuery({
       queryKey: ['clients', provider],
       queryFn: () => api.clients.list(provider),
     });
   }
   ```

### Phase 4: Remove Split Payment Features

1. **PaymentForm.tsx modifications**:
   ```typescript
   // REMOVE all of this:
   - is_split_payment state
   - handleSplitToggle function
   - SplitPaymentControls component
   - start_period/end_period fields
   
   // REPLACE with:
   const [formData, setFormData] = useState({
     client_id: clientId,
     contract_id: contractId,
     received_date: '',
     total_assets: '',
     actual_fee: '',
     applied_period_type: contract?.payment_schedule || 'quarterly',
     applied_period: 0,
     applied_year: new Date().getFullYear(),
     method: 'Check',
     notes: ''
   });
   ```

2. **PaymentHistory.tsx simplification**:
   ```typescript
   // REMOVE:
   - Expandable row logic
   - ExpandedPaymentDetails component
   - Chevron icons
   
   // Period display becomes:
   <td>{formatAppliedPeriod(
     payment.applied_period_type,
     payment.applied_period,
     payment.applied_year
   )}</td>
   ```

### Phase 5: Implement Binary Status System

1. **Update StatusBadge component**:
   ```typescript
   type StatusType = 'paid' | 'due'; // Remove 'overdue'
   
   const statusStyles = {
     paid: 'bg-green-100 text-green-800',
     due: 'bg-yellow-100 text-yellow-800',
     // Remove overdue styles
   };
   ```

2. **Update ClientList.tsx**:
   ```typescript
   // Use dashboard data from API
   const getStatusColor = (status: string) => {
     return status === 'Paid' ? 'text-green-600' : 'text-yellow-600';
   };
   
   // Remove all overdue period tracking
   ```

3. **Simplify ComplianceCard.tsx**:
   ```typescript
   // Just display the status from backend
   <StatusBadge status={dashboardData.payment_status.status} />
   <p>{dashboardData.compliance.reason}</p>
   // Remove Missing Payments section entirely
   ```

### Phase 6: Create Period Selection Component

1. **New PeriodSelector.tsx**:
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   import { api } from '@/services/api';
   
   export function PeriodSelector({ 
     clientId, 
     contractId, 
     value, 
     onChange 
   }: Props) {
     const { data: periods } = useQuery({
       queryKey: ['periods', clientId, contractId],
       queryFn: () => api.periods.getAvailable(clientId, contractId),
     });
     
     return (
       <select value={value} onChange={onChange}>
         {periods?.periods.map(period => (
           <option key={period.value} value={period.value}>
             {period.label}
           </option>
         ))}
       </select>
     );
   }
   ```

### Phase 7: Update Formatting Utilities

1. **In src/utils/formatters.ts**:
   ```typescript
   export function formatCurrency(amount: number | null | undefined): string {
     if (amount == null) return '-';
     return new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: 'USD',
     }).format(amount);
   }
   
   export function formatPercentage(rate: number | null | undefined): string {
     if (rate == null) return '-';
     return `${(rate * 100).toFixed(2)}%`;
   }
   
   export function formatAppliedPeriod(
     type: 'monthly' | 'quarterly',
     period: number,
     year: number
   ): string {
     if (type === 'monthly') {
       const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
       return `${months[period - 1]} ${year}`;
     }
     return `Q${period} ${year}`;
   }
   ```

### Phase 8: Remove Document Features

1. **Delete entirely**:
   - DocumentViewer component
   - Any PDF rendering logic
   - File upload components

2. **Replace with simple indicator**:
   ```typescript
   {payment.has_files && (
     <DocumentIcon className="w-4 h-4 text-gray-500" />
   )}
   ```

### Phase 9: Wire Everything Together

1. **Update App.tsx**:
   ```typescript
   import PageLayout from '@/components/layout/PageLayout';
   import ClientList from '@/components/clients/ClientList';
   import Dashboard from '@/components/dashboard/Dashboard';
   import { useStore } from '@/store';
   
   export default function App() {
     const { selectedClientId } = useStore();
     
     return (
       <QueryClientProvider client={queryClient}>
         <PageLayout>
           <div className="flex h-full">
             <ClientList />
             {selectedClientId && <Dashboard clientId={selectedClientId} />}
           </div>
         </PageLayout>
       </QueryClientProvider>
     );
   }
   ```

2. **Update store for simple state**:
   ```typescript
   interface AppState {
     selectedClientId: number | null;
     setSelectedClient: (id: number | null) => void;
   }
   
   export const useStore = create<AppState>((set) => ({
     selectedClientId: null,
     setSelectedClient: (id) => set({ selectedClientId: id }),
   }));
   ```

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
5. ✅ No document viewing, just indicators
6. ✅ Works within Teams Tab environment
7. ✅ Uses Tailwind v4 with @import syntax