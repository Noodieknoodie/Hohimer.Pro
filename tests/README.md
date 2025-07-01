# 401(k) Payment Tracking System - Tests

This directory contains comprehensive tests for the backend models and database operations.

## Test Structure

```
tests/
├── __init__.py
├── pytest.ini              # pytest configuration
├── README.md              # This file
└── backend_tests/
    ├── __init__.py
    └── test_models_and_crud.py  # Comprehensive model and CRUD tests
```

## Running Tests

### Install Test Dependencies

```bash
pip install pytest pytest-mock
```

### Run All Tests

```bash
# From the project root
pytest tests/

# Or from the tests directory
pytest

# With verbose output
pytest -v

# Run specific test class
pytest tests/backend_tests/test_models_and_crud.py::TestClientModels -v

# Run integration tests only (requires database)
pytest -m integration
```

### Test Categories

1. **Pydantic Model Validation Tests**
   - Test valid model creation
   - Test validation errors for invalid data
   - Test validators (percentage ranges, positive amounts, email format)
   - Test date string validation
   - Test edge cases (empty strings, null values, boundaries)

2. **Database CRUD Operation Tests**
   - Test Create operations for all tables
   - Test Read operations with filtering
   - Test Update operations
   - Test Delete operations (soft delete)
   - Test parameterized queries for security
   - Test transaction handling and rollback

3. **Integration Tests**
   - Connect to actual database
   - Display first 5 rows from each table
   - Verify table structures
   - Test view structures

4. **Edge Case Tests**
   - Empty string handling
   - Null value handling
   - Boundary value testing
   - Invalid foreign key handling
   - Maximum length strings
   - Special character handling
   - Numeric precision

## Test Coverage

The test suite covers:

- **Models**: Client, Contract, Payment, Contact, ClientFile, PaymentFileLink, ClientMetrics, QuarterlySummary, YearlySummary
- **Validation**: All Pydantic validators and field constraints
- **Database Operations**: CRUD operations with proper parameterization
- **Security**: SQL injection prevention through parameterized queries
- **Error Handling**: Transaction rollback, foreign key violations, validation errors

## Environment Setup

For integration tests that connect to the actual database, ensure these environment variables are set:

```bash
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=your-database-name
```

Integration tests will be skipped if these variables are not available.

## Writing New Tests

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Use descriptive test names that explain what is being tested
3. Include both positive and negative test cases
4. Mock database connections for unit tests
5. Use fixtures for common test setup
6. Document complex test scenarios

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Unit tests can run without database access, while integration tests require proper database credentials.