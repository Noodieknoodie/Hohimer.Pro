"""
Connection pooling implementation for the database module.

This is an optional enhancement that can be used for high-traffic applications
where connection pooling would provide performance benefits.
"""

import logging
from queue import Queue, Empty
from threading import Lock
from typing import Optional
from contextlib import contextmanager
import pyodbc

from .database import Database

logger = logging.getLogger(__name__)


class ConnectionPool:
    """
    Thread-safe connection pool for database connections.
    
    This implementation uses a simple queue-based approach with a maximum
    pool size. Connections are validated before being returned to ensure
    they're still alive.
    """
    
    def __init__(self, database: Database, min_size: int = 2, max_size: int = 10):
        """
        Initialize the connection pool.
        
        Args:
            database: Database instance to create connections
            min_size: Minimum number of connections to maintain
            max_size: Maximum number of connections allowed
        """
        self.database = database
        self.min_size = min_size
        self.max_size = max_size
        self._pool = Queue(maxsize=max_size)
        self._all_connections = set()
        self._lock = Lock()
        
        # Initialize minimum connections
        self._initialize_pool()
        
    def _initialize_pool(self):
        """Create initial connections for the pool."""
        for _ in range(self.min_size):
            try:
                conn = self.database.get_connection()
                self._pool.put(conn)
                self._all_connections.add(conn)
                logger.debug(f"Added connection to pool, total: {len(self._all_connections)}")
            except Exception as e:
                logger.error(f"Failed to create initial connection: {str(e)}")
    
    def _validate_connection(self, conn: pyodbc.Connection) -> bool:
        """
        Check if a connection is still valid.
        
        Args:
            conn: Connection to validate
            
        Returns:
            bool: True if connection is valid, False otherwise
        """
        try:
            # Simple validation query
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except Exception:
            return False
    
    def get_connection(self, timeout: Optional[float] = None) -> pyodbc.Connection:
        """
        Get a connection from the pool.
        
        Args:
            timeout: Maximum time to wait for a connection (seconds)
            
        Returns:
            pyodbc.Connection: Database connection
            
        Raises:
            TimeoutError: If no connection available within timeout
            Exception: If unable to create new connection
        """
        try:
            # Try to get existing connection from pool
            conn = self._pool.get(timeout=timeout)
            
            # Validate the connection
            if self._validate_connection(conn):
                logger.debug("Retrieved valid connection from pool")
                return conn
            else:
                # Connection is dead, remove it
                with self._lock:
                    self._all_connections.discard(conn)
                logger.warning("Removed invalid connection from pool")
                
                # Recursively try to get another connection
                return self.get_connection(timeout=timeout)
                
        except Empty:
            # No connections available, try to create new one
            with self._lock:
                if len(self._all_connections) < self.max_size:
                    try:
                        conn = self.database.get_connection()
                        self._all_connections.add(conn)
                        logger.info(f"Created new connection, total: {len(self._all_connections)}")
                        return conn
                    except Exception as e:
                        logger.error(f"Failed to create new connection: {str(e)}")
                        raise
                else:
                    raise TimeoutError("Connection pool exhausted and timeout reached")
    
    def return_connection(self, conn: pyodbc.Connection):
        """
        Return a connection to the pool.
        
        Args:
            conn: Connection to return
        """
        if conn in self._all_connections and self._validate_connection(conn):
            try:
                self._pool.put_nowait(conn)
                logger.debug("Returned connection to pool")
            except Exception:
                # Pool is full, close the connection
                conn.close()
                with self._lock:
                    self._all_connections.discard(conn)
                logger.debug("Pool full, closed excess connection")
        else:
            # Invalid connection, close it
            try:
                conn.close()
            except Exception:
                pass
            with self._lock:
                self._all_connections.discard(conn)
            logger.debug("Closed invalid connection")
    
    @contextmanager
    def connection(self, timeout: Optional[float] = None):
        """
        Context manager for pooled connections.
        
        Args:
            timeout: Maximum time to wait for connection
            
        Yields:
            pyodbc.Connection: Database connection
        """
        conn = None
        try:
            conn = self.get_connection(timeout=timeout)
            yield conn
        finally:
            if conn:
                self.return_connection(conn)
    
    def close_all(self):
        """Close all connections in the pool."""
        with self._lock:
            while not self._pool.empty():
                try:
                    conn = self._pool.get_nowait()
                    conn.close()
                except Exception:
                    pass
            
            # Close any connections that might be in use
            for conn in self._all_connections:
                try:
                    conn.close()
                except Exception:
                    pass
            
            self._all_connections.clear()
            logger.info("Closed all connections in pool")


# Example usage:
# from backend.database import db
# pool = ConnectionPool(db, min_size=2, max_size=10)
# 
# with pool.connection() as conn:
#     cursor = conn.cursor()
#     cursor.execute("SELECT * FROM users")
#     results = cursor.fetchall()