# Backend CLAUDE.md

1. **Router Setup**: One registration per router. Group related endpoints. Use plural nouns for collections.

2. **Database Operations**:
   - Use context managers for connections
   - Parameterized queries only (no f-strings in SQL)
   - Explicit transactions for related updates
   - Batch operations over loops

3. **API Structure**:
   - Pydantic models for request/response validation
   - Consistent error responses with proper status codes
   - Dependencies for shared requirements (auth, db)
   - Clear query parameter descriptions

4. **Python Standards**:
   - Imports: stdlib → third-party → local
   - Functions under 30 lines
   - Type hints everywhere
   - Extract SQL to constants

5. **Middleware**: Register in order, CORS first if used.