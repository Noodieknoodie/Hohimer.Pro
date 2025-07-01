"""
Example usage of the improved database module.

This file demonstrates best practices for using the database connections
with proper error handling and context managers.
"""

from backend.database import get_db, DatabaseNotInitializedError
import logging

# Configure logging for the example
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def example_select_query():
    """Example of executing a SELECT query using context managers."""
    try:
        db = get_db()
        # Using the cursor context manager
        with db.cursor(commit=False) as cursor:
            cursor.execute("SELECT TOP 10 * FROM users WHERE active = ?", [1])
            results = cursor.fetchall()
            
            for row in results:
                logger.info(f"User: {row}")
                
    except DatabaseNotInitializedError as e:
        logger.error(f"Database not available: {str(e)}")
    except Exception as e:
        logger.error(f"Query failed: {str(e)}")


def example_insert_with_transaction():
    """Example of inserting data with automatic transaction handling."""
    try:
        db = get_db()
        # The cursor context manager will automatically commit on success
        with db.cursor(commit=True) as cursor:
            cursor.execute(
                "INSERT INTO users (name, email, active) VALUES (?, ?, ?)",
                ["John Doe", "john@example.com", 1]
            )
            logger.info(f"Inserted user, ID: {cursor.lastrowid}")
            
    except Exception as e:
        logger.error(f"Insert failed: {str(e)}")
        # Transaction is automatically rolled back on error


def example_batch_operation():
    """Example of performing batch operations efficiently."""
    users_to_insert = [
        ("Alice", "alice@example.com", 1),
        ("Bob", "bob@example.com", 1),
        ("Charlie", "charlie@example.com", 0),
    ]
    
    try:
        db = get_db()
        with db.cursor(commit=True) as cursor:
            cursor.executemany(
                "INSERT INTO users (name, email, active) VALUES (?, ?, ?)",
                users_to_insert
            )
            logger.info(f"Inserted {cursor.rowcount} users")
            
    except Exception as e:
        logger.error(f"Batch insert failed: {str(e)}")


def example_manual_transaction():
    """Example of manual transaction control for complex operations."""
    try:
        db = get_db()
        with db.connection() as conn:
            cursor = conn.cursor()
            
            try:
                # Start transaction
                cursor.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", [100, 1])
                cursor.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", [100, 2])
                
                # Verify the transfer
                cursor.execute("SELECT SUM(balance) FROM accounts WHERE id IN (1, 2)")
                total = cursor.fetchone()[0]
                
                if total > 0:  # Some validation
                    conn.commit()
                    logger.info("Transaction completed successfully")
                else:
                    conn.rollback()
                    logger.warning("Transaction rolled back due to validation failure")
                    
            except Exception as e:
                conn.rollback()
                logger.error(f"Transaction failed: {str(e)}")
                raise
            finally:
                cursor.close()
                
    except Exception as e:
        logger.error(f"Connection failed: {str(e)}")


def example_using_execute_query():
    """Example using the convenient execute_query method."""
    try:
        db = get_db()
        # For SELECT queries
        results = db.execute_query(
            "SELECT * FROM users WHERE created_at > ?",
            ("2024-01-01",)
        )
        logger.info(f"Found {len(results)} recent users")
        
        # For INSERT/UPDATE/DELETE with commit
        db.execute_query(
            "UPDATE users SET last_login = GETDATE() WHERE id = ?",
            (123,),
            commit=True
        )
        logger.info("Updated user last login")
        
    except Exception as e:
        logger.error(f"Query execution failed: {str(e)}")


if __name__ == "__main__":
    # Test the database connection
    try:
        db = get_db()
        logger.info("Database module loaded successfully")
        # You can run the examples here
        # example_select_query()
        # example_insert_with_transaction()
    except DatabaseNotInitializedError as e:
        logger.error(f"Database initialization failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")