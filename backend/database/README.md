# Database Module

Production-ready database module for Azure SQL Database with Azure AD authentication.

## Features

- ✅ Azure AD authentication with token-based access
- ✅ Context managers for safe connection and cursor management
- ✅ Automatic transaction handling with rollback on errors
- ✅ Comprehensive error handling and logging
- ✅ Type hints and detailed docstrings
- ✅ Optional connection pooling for high-traffic scenarios
- ✅ Batch operation support

## Basic Usage

```python
from backend.database import db

# Using context managers (recommended)
with db.cursor() as cursor:
    cursor.execute("SELECT * FROM users WHERE active = ?", [1])
    results = cursor.fetchall()

# Using the convenient execute_query method
results = db.execute_query(
    "SELECT * FROM products WHERE price > ?",
    (100,)
)

# Insert with auto-commit
with db.cursor(commit=True) as cursor:
    cursor.execute(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        ["John Doe", "john@example.com"]
    )
```

## Context Managers

### Connection Context Manager
```python
with db.connection() as conn:
    # Connection is automatically closed after use
    cursor = conn.cursor()
    # Perform operations
```

### Cursor Context Manager
```python
# Auto-commit on success, auto-rollback on error
with db.cursor(commit=True) as cursor:
    cursor.execute("UPDATE users SET active = 1 WHERE id = ?", [user_id])
```

## Connection Pooling (Optional)

For high-traffic applications:

```python
from backend.database import db
from backend.database.pool import ConnectionPool

# Create a connection pool
pool = ConnectionPool(db, min_size=2, max_size=10)

# Use pooled connections
with pool.connection() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
```

## Error Handling

All database operations include comprehensive error handling:

```python
try:
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM users")
        results = cursor.fetchall()
except Exception as e:
    logger.error(f"Database operation failed: {str(e)}")
    # Connection and cursor are automatically cleaned up
```

## Environment Variables

Required environment variables:
- `SQL_SERVER`: Azure SQL Database server name
- `SQL_DATABASE`: Database name
- `TEAMSFX_ENV`: Environment name (defaults to 'local')

## Testing

See `tests/test_database.py` for unit tests with mocking examples.