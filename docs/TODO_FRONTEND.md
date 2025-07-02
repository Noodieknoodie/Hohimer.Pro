The frontend needs to handle several formatting and display functions that were previously scattered throughout the old backend. Here's what must be implemented:
Period Display Formatting: The backend returns periods as "3-2024" format. The frontend must convert these to human-readable formats like "March 2024" for monthly or "Q1 2024" for quarterly payments. This formatting appears in payment history tables, period selectors, and dashboard displays.
Currency and Percentage Formatting: All monetary values come from the backend as raw floats. The frontend must format these as "$1,234.56" for display. Similarly, percentage rates arrive as decimals (0.0025) and need formatting to "0.25%" for user display.
Variance Status Visualization: While the backend calculates variance status (exact/acceptable/warning/alert), the frontend must map these to appropriate colors and styling. The old app used green for acceptable, yellow for warning, and red for alert variances in the payment history table.
Payment Method Dropdown: The frontend needs to provide the standard payment method options: "Auto - ACH", "Auto - Check", "Invoice - Check", "Wire Transfer", and "Check". These aren't validated by the backend.
Compliance Status Display: The dashboard now only returns green (paid) or yellow (due) status - no red. The frontend must reflect this simplified two-state system in the sidebar client list and dashboard cards.
File Indicators: The backend returns a simple has_files boolean. The frontend should show a document icon next to payments that have associated files, and maintain the document viewer UI panel as a placeholder for future functionality. No actual PDF rendering backend is implemented yet.
Form Validation: The payment form needs client-side validation for required fields (received_date, actual_fee, period selection) since the backend expects valid data. The old backend's validation rules should be implemented in React.
Period Selection Logic: The frontend must properly display available periods from the backend and default to the most recent unpaid period, understanding that all payments are in arrears (one period back from current).
The frontend essentially becomes responsible for all presentation logic while the backend handles data and business calculations. This clean separation means the frontend can be swapped out (web, mobile, etc.) without touching backend logic.



Payment Entry Form Changes
Looking at the old PaymentForm components, here's what needs to be removed/changed:
REMOVE Split Payment Toggle: The entire split payment functionality is gone. Delete:

The toggle switch UI
handleSplitToggle function
is_split_payment state
Start/End period selection - just ONE period dropdown now
SplitPaymentControls component entirely

SIMPLIFY Period Selection:

Just one dropdown labeled "Payment Period"
No conditional rendering based on split status
No filtered end periods logic
Remove all the period range validation

REMOVE Expected Fee Calculation:
The old form called a /calculate-fee endpoint. This is now handled inline by the payments endpoint when you fetch payment data. Remove:

The useQuery for fee calculation
The expected fee display card in the form

SIMPLIFY Payment Data Structure:
Old form had to handle complex period mapping:
javascript// OLD - complex with split logic
applied_start_month, applied_end_month, 
applied_start_quarter, applied_end_quarter, etc.
Now it's just:
javascript// NEW - simple single period
applied_period_type: "monthly", // or "quarterly"
applied_period: 3,              // month or quarter number
applied_year: 2024
REMOVE Variance Display: The form no longer needs to show real-time variance calculation. That's only shown in the payment history table after saving.
The form becomes MUCH simpler - just date, amount, assets (optional), method (optional), notes, and ONE period selector. That's it.






============


## **Frontend Conversion Guide for AI Assistant**

### **Client List/Sidebar Component**

**REMOVE**: 
- All "overdue" status calculations and red indicators
- Complex period tracking logic
- The `compliance_reason` display showing "Overdue: March, April" etc.

**SIMPLIFY**:
- Status icons: Only green (paid) and yellow (due) - no red
- Remove `overdue_periods` array handling
- Status comes directly from backend as "Due" or "Paid"

**KEEP**:
- Search functionality
- Provider grouping toggle
- Client selection mechanism

### **Dashboard Components**

**REBUILD ComplianceCard**:
- Delete all logic checking for "Overdue" status
- Remove the "Missing Payments" section entirely
- Simplify to just show current period status with green/yellow indicator
- The backend `compliance.color` is now only "green" or "yellow"

**MODIFY PaymentInfoCard**:
- Remove client-side calculation of `getCurrentPeriod()` - backend provides this
- Remove `isCurrentPeriodPaid()` calculation - use `payment_status.status` from backend
- Expected fee now comes from backend, no calculation needed

**KEEP ContractCard**: 
- Works as-is, just displays contract data

### **Payment History Table**

**REMOVE**:
- All split payment expansion rows (`ExpandedPaymentDetails` component)
- Period breakdown displays
- The expand/collapse chevron for split payments
- `is_split_payment` checks everywhere

**MODIFY**:
- Period display: Backend gives you `applied_period` and `applied_year` - format as "March 2024" or "Q1 2024"
- Variance: Call new `/api/calculations/variance` endpoint or calculate client-side
- File indicator: Use `/api/files/payment/{id}` to check `has_files`

**KEEP**:
- Basic table structure
- Edit/Delete actions
- Pagination

### **API Service Layer (lib/api.js)**

**REMOVE**:
- `/calculate-fee` endpoint (backend calculates inline now)
- `/calculate-variance` endpoint if you do it client-side
- Split payment period logic in `createPayment`/`updatePayment`

**MODIFY**:
- Payment creation/update now sends:
  ```javascript
  {
    applied_period_type: "monthly",
    applied_period: 3,
    applied_year: 2024
    // NOT the old 8-field period system
  }
  ```

**ADD**:
- `/api/calculations/variance?actual_fee=X&expected_fee=Y`
- `/api/files/payment/{id}` for file checking

### **State Management**

**REMOVE**:
- Split payment state
- Overdue periods tracking
- Complex payment status calculations

**SIMPLIFY**:
- Payment status is just "Due" or "Paid"
- No arrays of missing periods to track

### **Utility Functions (lib/formatUtils.js, dateUtils.js)**

**ADD/MODIFY formatAppliedPeriod()**:
```javascript
// Takes the new simple format
function formatAppliedPeriod(period_type, period, year) {
  if (period_type === 'monthly') {
    return `${MONTH_NAMES[period-1]} ${year}`;
  } else {
    return `Q${period} ${year}`;
  }
}
```

**REMOVE**:
- `formatPeriodRange()` - no more ranges
- `calculateExpectedFee()` - backend does this
- Complex period arithmetic functions

**KEEP**:
- `formatCurrency()`
- `formatPercentage()`
- Basic date formatting

### **Document Viewer Component**

**KEEP THE UI**:
- Keep the document viewer panel/sidebar UI as a placeholder
- Show file names if backend provides them
- Display a "Preview not available" message or similar placeholder content
- Keep the slide-out panel functionality

**REMOVE THE BACKEND**:
- Remove PDF rendering logic (react-pdf)
- Remove actual file fetching/display
- No backend integration for now

### **Period Selection (PaymentFormFields)**

**COMPLETE REWRITE**:
- One dropdown, not two
- No "split payment" toggle
- Available periods come from `/api/periods` endpoint
- Default to first item (most recent unpaid)
- Send single period to backend, not start/end

### **Constants**

**KEEP**:
- `MONTH_NAMES` array
- `PAYMENT_METHODS` array

**REMOVE**:
- Any split payment related constants
- Overdue status constants

### **New Features to Add**

**None required** - this is a simplification, not adding features. The new system is intentionally simpler.

### **Testing Considerations**

The AI assistant should:
1. Start with API integration - ensure new endpoints work
2. Remove split payment UI first - it touches everything
3. Simplify status to 2-state (Due/Paid) throughout
4. Test period selection carefully - the arrears logic is critical
5. Keep document viewer UI but show placeholder content

### **Dependencies to Remove**
- react-pdf and related PDF rendering packages (but keep the UI components)
- Any complex date manipulation libraries if only used for split periods

The overall theme is **SIMPLIFICATION**. The new backend handles more logic, periods are single not ranges, and status is binary not ternary. The frontend becomes a cleaner display layer.