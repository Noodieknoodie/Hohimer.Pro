"""
Unit tests for the database module.

These tests verify the database connection and context managers work correctly.
Note: These are basic structure tests. In production, you'd use mocking for 
database connections to avoid requiring actual database access during tests.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import pyodbc
import struct

# Import after sys.path modification if needed
from backend.database.database import Database


class TestDatabase(unittest.TestCase):
    """Test cases for the Database class."""
    
    def setUp(self):
        """Set up test environment variables."""
        self.env_patcher = patch.dict('os.environ', {
            'SQL_SERVER': 'test-server.database.windows.net',
            'SQL_DATABASE': 'test-database'
        })
        self.env_patcher.start()
        
    def tearDown(self):
        """Clean up patches."""
        self.env_patcher.stop()
    
    def test_connection_string_generation(self):
        """Test that connection string is properly formatted."""
        db = Database()
        expected = (
            "Driver={ODBC Driver 18 for SQL Server};"
            "Server=tcp:test-server.database.windows.net,1433;"
            "Database=test-database;"
            "Encrypt=yes;"
            "TrustServerCertificate=no;"
            "Connection Timeout=30"
        )
        self.assertEqual(db.connection_string, expected)
    
    def test_missing_environment_variables(self):
        """Test that missing environment variables raise ValueError."""
        with patch.dict('os.environ', {}, clear=True):
            with self.assertRaises(ValueError) as context:
                Database()
            self.assertIn("Missing required environment variables", str(context.exception))
    
    @patch('backend.database.database.DefaultAzureCredential')
    def test_credential_lazy_initialization(self, mock_credential_class):
        """Test that credential is created only when accessed."""
        db = Database()
        
        # Credential should not be created yet
        mock_credential_class.assert_not_called()
        
        # Access credential property
        _ = db.credential
        
        # Now it should be created
        mock_credential_class.assert_called_once_with(
            exclude_interactive_browser_credential=False
        )
    
    @patch('backend.database.database.pyodbc.connect')
    @patch('backend.database.database.DefaultAzureCredential')
    def test_get_connection_success(self, mock_credential_class, mock_connect):
        """Test successful connection creation."""
        # Setup mocks
        mock_credential = Mock()
        mock_token = Mock()
        mock_token.token = "test-token"
        mock_credential.get_token.return_value = mock_token
        mock_credential_class.return_value = mock_credential
        
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        # Create database and get connection
        db = Database()
        conn = db.get_connection()
        
        # Verify token was requested
        mock_credential.get_token.assert_called_once_with(
            "https://database.windows.net/.default"
        )
        
        # Verify connection was created
        mock_connect.assert_called_once()
        self.assertEqual(conn, mock_connection)
    
    @patch('backend.database.database.pyodbc.connect')
    @patch('backend.database.database.DefaultAzureCredential')
    def test_connection_context_manager(self, mock_credential_class, mock_connect):
        """Test connection context manager properly handles cleanup."""
        # Setup mocks
        mock_credential = Mock()
        mock_token = Mock()
        mock_token.token = "test-token"
        mock_credential.get_token.return_value = mock_token
        mock_credential_class.return_value = mock_credential
        
        mock_connection = Mock()
        mock_connect.return_value = mock_connection
        
        # Create database
        db = Database()
        
        # Use context manager
        with db.connection() as conn:
            self.assertEqual(conn, mock_connection)
        
        # Verify connection was closed
        mock_connection.close.assert_called_once()
    
    @patch('backend.database.database.pyodbc.connect')
    @patch('backend.database.database.DefaultAzureCredential')
    def test_cursor_context_manager_with_commit(self, mock_credential_class, mock_connect):
        """Test cursor context manager with auto-commit."""
        # Setup mocks
        mock_credential = Mock()
        mock_token = Mock()
        mock_token.token = "test-token"
        mock_credential.get_token.return_value = mock_token
        mock_credential_class.return_value = mock_credential
        
        mock_connection = Mock()
        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_connection
        
        # Create database
        db = Database()
        
        # Use cursor context manager
        with db.cursor(commit=True) as cursor:
            self.assertEqual(cursor, mock_cursor)
        
        # Verify commit was called
        mock_connection.commit.assert_called_once()
        mock_cursor.close.assert_called_once()
    
    @patch('backend.database.database.pyodbc.connect')
    @patch('backend.database.database.DefaultAzureCredential')
    def test_cursor_context_manager_rollback_on_error(self, mock_credential_class, mock_connect):
        """Test cursor context manager rolls back on error."""
        # Setup mocks
        mock_credential = Mock()
        mock_token = Mock()
        mock_token.token = "test-token"
        mock_credential.get_token.return_value = mock_token
        mock_credential_class.return_value = mock_credential
        
        mock_connection = Mock()
        mock_cursor = Mock()
        mock_connection.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_connection
        
        # Create database
        db = Database()
        
        # Use cursor context manager with simulated error
        with self.assertRaises(Exception):
            with db.cursor(commit=True) as cursor:
                raise Exception("Test error")
        
        # Verify rollback was called, not commit
        mock_connection.rollback.assert_called_once()
        mock_connection.commit.assert_not_called()
        mock_cursor.close.assert_called_once()


if __name__ == '__main__':
    unittest.main()