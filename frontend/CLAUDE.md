# Frontend CLAUDE.md

React frontend rules:

1. **Component Architecture**:
   - Functional components only
   - Keep under 300 lines or split
   - Hooks at top level, complete dependency arrays
   - Extract repeated logic to custom hooks

2. **State Management**:
   - Local state by default, elevate only when needed
   - Immutable updates always
   - Use selectors for derived state
   - Functional setState for prev-dependent updates

3. **API Integration**:
   - Centralized API client
   - Loading states for all async ops
   - Consistent error handling with user feedback
   - Proper request cancellation on unmount

4. **Forms**:
   - Split large forms into steps/groups
   - Validation on submit + during input
   - Disable submit during submission
   - Track dirty state for navigation warnings

5. **UI/UX**:
   - Reusable components for consistency
   - Handle loading/error/empty states explicitly
   - Semantic HTML, keyboard nav, proper contrast
   - Responsive breakpoints

6. **Performance**: Use React.memo, useMemo, useCallback where appropriate to prevent unnecessary renders.