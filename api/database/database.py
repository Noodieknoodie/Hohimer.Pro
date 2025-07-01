import os
import pyodbc
import struct
import logging
from pathlib import Path
from contextlib import contextmanager
from typing import Optional, Generator, List, Any, Tuple
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)


class DatabaseNotInitializedError(Exception):
    """Raised when attempting to use the database before it's initialized."""
    pass


def find_project_root() -> Path:
    """
    Find the project root directory by looking for marker files.
    
    Searches up the directory tree for common project root indicators.
    
    Returns:
        Path: The project root directory
    
    Raises:
        FileNotFoundError: If no project root markers are found
    """
    current_path = Path(__file__).resolve()
    
    # Look for these marker files that indicate project root
    markers = ['.env.local', 'package.json', '.git']
    
    for parent in current_path.parents:
        for marker in markers:
            if (parent / marker).exists():
                logger.debug(f"Found project root at {parent} (marker: {marker})")
                return parent
    
    # If no markers found, fall back to 3 levels up (original behavior)
    fallback = current_path.parent.parent.parent
    logger.warning(f"No project root markers found, using fallback: {fallback}")
    return fallback


# Load environment variables from the project root
try:
    env = os.getenv('TEAMSFX_ENV', 'local')
    env_file = f'.env.{env}' if env != 'local' else '.env.local'
    root_dir = find_project_root()
    env_path = root_dir / env_file
    
    if env_path.exists():
        load_dotenv(env_path)
        logger.info(f"Loaded environment from {env_path}")
    else:
        logger.warning(f"Environment file not found: {env_path}")
except Exception as e:
    logger.error(f"Error loading environment variables: {str(e)}")

class Database:
    """
    Database connection manager for Azure SQL Database using Azure AD authentication.
    
    This class handles connection management, authentication, and provides context
    managers for safe database operations with automatic cleanup.
    """
    
    # SQL Server specific constant for access token
    SQL_COPT_SS_ACCESS_TOKEN = 1256
    
    def __init__(self):
        """
        Initialize the Database instance with connection configuration.
        
        Loads connection parameters from environment variables and prepares
        the connection string for Azure SQL Database.
        """
        self.connection_string = self._get_connection_string()
        self._credential = None
        logger.info("Database instance initialized")
        
    def _get_connection_string(self) -> str:
        """
        Build the connection string from environment variables.
        
        Returns:
            str: Formatted connection string for Azure SQL Database
        
        Raises:
            ValueError: If required environment variables are missing
        """
        server = os.getenv("SQL_SERVER")
        database = os.getenv("SQL_DATABASE")
        
        if not server or not database:
            raise ValueError(
                "Missing required environment variables: SQL_SERVER and/or SQL_DATABASE"
            )
        
        connection_string = (
            f"Driver={{ODBC Driver 18 for SQL Server}};"
            f"Server=tcp:{server},1433;"
            f"Database={database};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
            f"Connection Timeout=30"
        )
        
        logger.debug(f"Connection string prepared for server: {server}")
        return connection_string
    
    @property
    def credential(self) -> DefaultAzureCredential:
        """
        Get or create the Azure credential instance.
        
        Uses lazy initialization to create the credential only when needed.
        
        Returns:
            DefaultAzureCredential: Azure credential for authentication
        """
        if self._credential is None:
            self._credential = DefaultAzureCredential(
                exclude_interactive_browser_credential=False
            )
        return self._credential
    
    def _get_access_token(self) -> bytes:
        """
        Get an access token for Azure SQL Database authentication.
        
        Returns:
            bytes: Formatted access token for SQL Server connection
        
        Raises:
            Exception: If token acquisition fails
        """
        try:
            token = self.credential.get_token("https://database.windows.net/.default")
            token_bytes = token.token.encode("UTF-16-LE")
            token_struct = struct.pack(f'<I{len(token_bytes)}s', len(token_bytes), token_bytes)
            return token_struct
        except Exception as e:
            logger.error(f"Failed to acquire access token: {str(e)}")
            raise
    
    def get_connection(self) -> pyodbc.Connection:
        """
        Create a new database connection using Azure AD authentication.
        
        Returns:
            pyodbc.Connection: Active database connection
        
        Raises:
            pyodbc.Error: If connection fails
            Exception: If authentication fails
        """
        try:
            token_struct = self._get_access_token()
            
            conn = pyodbc.connect(
                self.connection_string,
                attrs_before={self.SQL_COPT_SS_ACCESS_TOKEN: token_struct}
            )
            
            logger.debug("Database connection established successfully")
            return conn
            
        except pyodbc.Error as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during connection: {str(e)}")
            raise
    
    @contextmanager
    def connection(self) -> Generator[pyodbc.Connection, None, None]:
        """
        Context manager for database connections with automatic cleanup.
        
        Ensures connections are properly closed even if exceptions occur.
        
        Yields:
            pyodbc.Connection: Active database connection
        
        Example:
            with db.connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users")
        """
        conn = None
        try:
            conn = self.get_connection()
            yield conn
        except Exception as e:
            logger.error(f"Error during database operation: {str(e)}")
            raise
        finally:
            if conn:
                try:
                    conn.close()
                    logger.debug("Database connection closed")
                except Exception as e:
                    logger.warning(f"Error closing connection: {str(e)}")
    
    @contextmanager
    def cursor(self, commit: bool = True) -> Generator[pyodbc.Cursor, None, None]:
        """
        Context manager for database cursors with automatic transaction handling.
        
        Args:
            commit: Whether to commit the transaction on success (default: True)
        
        Yields:
            pyodbc.Cursor: Active database cursor
        
        Example:
            with db.cursor() as cursor:
                cursor.execute("INSERT INTO users (name) VALUES (?)", ["John"])
        """
        with self.connection() as conn:
            cursor = None
            try:
                cursor = conn.cursor()
                yield cursor
                if commit:
                    conn.commit()
                    logger.debug("Transaction committed")
            except Exception as e:
                conn.rollback()
                logger.error(f"Transaction rolled back due to error: {str(e)}")
                raise
            finally:
                if cursor:
                    try:
                        cursor.close()
                    except Exception as e:
                        logger.warning(f"Error closing cursor: {str(e)}")
    
    def execute_query(self, query: str, params: Optional[Tuple[Any, ...]] = None, 
                     commit: bool = False) -> List[Any]:
        """
        Execute a query and return all results.
        
        Args:
            query: SQL query to execute
            params: Query parameters (optional)
            commit: Whether to commit the transaction (default: False)
        
        Returns:
            list: Query results as list of rows
        
        Raises:
            pyodbc.Error: If query execution fails
        """
        with self.cursor(commit=commit) as cursor:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if cursor.description:  # SELECT query
                results = cursor.fetchall()
                logger.debug(f"Query returned {len(results)} rows")
                return results
            else:  # INSERT/UPDATE/DELETE
                logger.debug(f"Query affected {cursor.rowcount} rows")
                return []

# Global database instance
_db: Optional[Database] = None

try:
    _db = Database()
    logger.info("Global database instance created successfully")
except Exception as e:
    logger.error(f"Failed to initialize database: {str(e)}")
    _db = None


def get_db() -> Database:
    """
    Get the global database instance.
    
    Returns:
        Database: The initialized database instance
    
    Raises:
        DatabaseNotInitializedError: If the database failed to initialize
    """
    if _db is None:
        raise DatabaseNotInitializedError(
            "Database not initialized. Check your environment variables and Azure credentials. "
            "Required: SQL_SERVER and SQL_DATABASE environment variables."
        )
    return _db


# For backward compatibility
db = _db