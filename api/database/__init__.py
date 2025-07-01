"""
Database module for Azure SQL Database connection management.

This module provides a singleton database instance with context managers
for safe connection and cursor management.
"""

from .database import db, Database, get_db, DatabaseNotInitializedError

__all__ = ['db', 'Database', 'get_db', 'DatabaseNotInitializedError']