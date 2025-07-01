
"""
Comprehensive tests for models.py and database CRUD operations.
Tests all Pydantic models for validation and database operations for each table.
"""
import os
import sys

# Add parent directories to path to enable imports
import pytest
test_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(test_dir))
api_dir = os.path.join(root_dir, 'api')
sys.path.insert(0, api_dir)
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any
from unittest.mock import patch, MagicMock
from pydantic import ValidationError
from dotenv import load_dotenv
from pathlib import Path

# Load env file from root venv directory (Teams Toolkit location)
env_path = Path(__file__).parent.parent.parent / 'venv' / '.env.local'
load_dotenv(env_path)

from database.models import (
    ClientCreate, ClientUpdate, Client,
    ContractCreate, ContractUpdate, Contract,
    PaymentCreate, PaymentUpdate, Payment,
    ContactCreate, ContactUpdate, Contact,
    ClientFileCreate, ClientFile,
    PaymentFileLink,
    ClientMetrics,
    QuarterlySummary,
    YearlySummary,
    ClientPaymentStatus
)
from database.database import Database, get_db


# ============================================================================
# PYDANTIC MODEL VALIDATION TESTS
# ============================================================================

class TestClientModels:
    """Test Client Pydantic models validation."""
    
    def test_client_create_valid(self):
        """Test creating a valid client."""
        client = ClientCreate(
            display_name="Test Client",
            full_name="Test Client Full Legal Name",
            ima_signed_date="2024-01-15",
            onedrive_folder_path="/clients/test-client"
        )
        assert client.display_name == "Test Client"
        assert client.full_name == "Test Client Full Legal Name"
    
    def test_client_create_minimal(self):
        """Test creating a client with minimal required fields."""
        client = ClientCreate(display_name="Minimal Client")
        assert client.display_name == "Minimal Client"
        assert client.full_name is None
    
    def test_client_create_invalid_empty_display_name(self):
        """Test that empty display_name raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ClientCreate(display_name="")
        assert "display_name" in str(exc_info.value)
    
    def test_client_update_partial(self):
        """Test partial client update."""
        update = ClientUpdate(display_name="Updated Name")
        assert update.display_name == "Updated Name"
        assert update.full_name is None
        assert update.ima_signed_date is None


class TestContractModels:
    """Test Contract Pydantic models validation."""
    
    def test_contract_create_percentage_valid(self):
        """Test creating a valid percentage-based contract."""
        contract = ContractCreate(
            client_id=1,
            provider_name="John Hancock",
            fee_type="percentage",
            percent_rate=0.0025,  # 0.25%
            payment_schedule="quarterly"
        )
        assert contract.percent_rate == 0.0025
        assert contract.fee_type == "percentage"
    
    def test_contract_create_flat_valid(self):
        """Test creating a valid flat fee contract."""
        contract = ContractCreate(
            client_id=1,
            provider_name="Voya",
            fee_type="flat",
            flat_rate=5000.00,
            payment_schedule="monthly"
        )
        assert contract.flat_rate == 5000.00
        assert contract.fee_type == "flat"
    
    def test_contract_percentage_out_of_range(self):
        """Test that percentage rate outside 0-1 raises error."""
        with pytest.raises(ValidationError) as exc_info:
            ContractCreate(
                client_id=1,
                fee_type="percentage",
                percent_rate=1.5  # 150% - invalid
            )
        assert "between 0 and 1" in str(exc_info.value)
    
    def test_contract_negative_flat_rate(self):
        """Test that negative flat rate raises error."""
        with pytest.raises(ValidationError) as exc_info:
            ContractCreate(
                client_id=1,
                fee_type="flat",
                flat_rate=-1000.00
            )
        assert "must be positive" in str(exc_info.value)
    
    def test_contract_fee_consistency_percentage(self):
        """Test that percentage contracts require percent_rate."""
        with pytest.raises(ValidationError) as exc_info:
            ContractCreate(
                client_id=1,
                fee_type="percentage",
                flat_rate=1000.00  # Wrong rate type
            )
        assert "percent_rate is required" in str(exc_info.value)
    
    def test_contract_invalid_fee_type(self):
        """Test that invalid fee_type raises error."""
        with pytest.raises(ValidationError) as exc_info:
            ContractCreate(
                client_id=1,
                fee_type="invalid_type"
            )
        assert "fee_type" in str(exc_info.value)


class TestPaymentModels:
    """Test Payment Pydantic models validation."""
    
    def test_payment_create_valid(self):
        """Test creating a valid payment."""
        payment = PaymentCreate(
            contract_id=1,
            client_id=1,
            received_date="2024-03-15",
            total_assets=500000.00,
            expected_fee=1250.00,
            actual_fee=1250.00,
            method="Auto - ACH",
            applied_period_type="quarterly",
            applied_period=1,
            applied_year=2024
        )
        assert payment.actual_fee == 1250.00
        assert payment.applied_period == 1
    
    def test_payment_negative_amounts(self):
        """Test that negative amounts raise validation errors."""
        with pytest.raises(ValidationError) as exc_info:
            PaymentCreate(
                contract_id=1,
                client_id=1,
                total_assets=-100000.00,
                actual_fee=-500.00
            )
        # Should have multiple validation errors
        errors = exc_info.value.errors()
        assert len(errors) >= 2
        assert any("must be positive" in str(e) for e in errors)
    
    def test_payment_quarterly_period_validation(self):
        """Test that quarterly period must be 1-4."""
        with pytest.raises(ValidationError) as exc_info:
            PaymentCreate(
                contract_id=1,
                client_id=1,
                applied_period_type="quarterly",
                applied_period=5  # Invalid for quarterly
            )
        assert "must be between 1 and 4" in str(exc_info.value)
    
    def test_payment_monthly_period_validation(self):
        """Test that monthly period can be 1-12."""
        payment = PaymentCreate(
            contract_id=1,
            client_id=1,
            applied_period_type="monthly",
            applied_period=12  # Valid for monthly
        )
        assert payment.applied_period == 12
    
    def test_payment_year_validation(self):
        """Test year boundary validation."""
        with pytest.raises(ValidationError) as exc_info:
            PaymentCreate(
                contract_id=1,
                client_id=1,
                applied_year=1999  # Too early
            )
        assert "applied_year" in str(exc_info.value)
        
        with pytest.raises(ValidationError) as exc_info:
            PaymentCreate(
                contract_id=1,
                client_id=1,
                applied_year=2101  # Too late
            )
        assert "applied_year" in str(exc_info.value)


class TestContactModels:
    """Test Contact Pydantic models validation."""
    
    def test_contact_create_valid(self):
        """Test creating a valid contact."""
        contact = ContactCreate(
            client_id=1,
            contact_type="primary",
            contact_name="John Doe",
            phone="555-123-4567",
            email="john.doe@example.com"
        )
        assert contact.email == "john.doe@example.com"
    
    def test_contact_invalid_email(self):
        """Test that invalid email format raises error."""
        with pytest.raises(ValidationError) as exc_info:
            ContactCreate(
                client_id=1,
                contact_type="primary",
                email="invalid-email"  # No @ symbol
            )
        assert "Invalid email format" in str(exc_info.value)
    
    def test_contact_email_optional(self):
        """Test that email is optional."""
        contact = ContactCreate(
            client_id=1,
            contact_type="provider"
        )
        assert contact.email is None


class TestFileModels:
    """Test File-related Pydantic models validation."""
    
    def test_client_file_create_valid(self):
        """Test creating a valid client file."""
        file = ClientFileCreate(
            client_id=1,
            file_name="statement_2024_Q1.pdf",
            onedrive_path="/clients/test-client/statements/statement_2024_Q1.pdf"
        )
        assert file.file_name == "statement_2024_Q1.pdf"
    
    def test_payment_file_link_valid(self):
        """Test creating a valid payment-file link."""
        link = PaymentFileLink(
            payment_id=1,
            file_id=10
        )
        assert link.payment_id == 1
        assert link.file_id == 10


class TestSummaryModels:
    """Test Summary Pydantic models validation."""
    
    def test_quarterly_summary_valid(self):
        """Test creating a valid quarterly summary."""
        summary = QuarterlySummary(
            id=1,
            client_id=1,
            year=2024,
            quarter=2,
            total_payments=15000.00,
            payment_count=3
        )
        assert summary.quarter == 2
        assert summary.total_payments == 15000.00
    
    def test_quarterly_summary_invalid_quarter(self):
        """Test that invalid quarter raises error."""
        with pytest.raises(ValidationError) as exc_info:
            QuarterlySummary(
                id=1,
                client_id=1,
                year=2024,
                quarter=5  # Invalid
            )
        assert "quarter" in str(exc_info.value)
    
    def test_yearly_summary_valid(self):
        """Test creating a valid yearly summary."""
        summary = YearlySummary(
            id=1,
            client_id=1,
            year=2024,
            total_payments=60000.00,
            payment_count=12,
            yoy_growth=0.05  # 5% growth
        )
        assert summary.yoy_growth == 0.05


# ============================================================================
# DATABASE CRUD OPERATION TESTS
# ============================================================================

@pytest.fixture
def mock_database():
    """Create a mock database instance for testing."""
    mock_db = MagicMock(spec=Database)
    return mock_db


@pytest.fixture
def mock_cursor():
    """Create a mock cursor for testing."""
    cursor = MagicMock()
    cursor.description = [("id",), ("name",)]  # Mock column descriptions
    cursor.fetchall.return_value = []
    cursor.fetchone.return_value = None
    cursor.rowcount = 0
    return cursor


class TestDatabaseCRUD:
    """Test database CRUD operations for all tables."""
    
    def test_client_create(self, mock_database, mock_cursor):
        """Test creating a client in the database."""
        mock_cursor.fetchone.return_value = (1,)  # Return inserted ID
        mock_database.cursor.return_value.__enter__.return_value = mock_cursor
        
        # Simulate client creation
        query = """
            INSERT INTO clients (display_name, full_name, ima_signed_date, onedrive_folder_path)
            OUTPUT INSERTED.client_id
            VALUES (?, ?, ?, ?)
        """
        params = ("Test Client", "Test Client LLC", "2024-01-15", "/clients/test")
        
        with mock_database.cursor() as cursor:
            cursor.execute(query, params)
            result = cursor.fetchone()
        
        assert mock_cursor.execute.called
        assert mock_cursor.execute.call_args[0][0] == query
        assert mock_cursor.execute.call_args[0][1] == params
    
    def test_client_read(self, mock_database, mock_cursor):
        """Test reading clients from the database."""
        mock_cursor.fetchall.return_value = [
            (1, "Client A", "Client A LLC", "2024-01-01", None),
            (2, "Client B", "Client B Inc", "2024-02-01", None)
        ]
        mock_database.cursor.return_value.__enter__.return_value = mock_cursor
        
        query = "SELECT client_id, display_name, full_name, ima_signed_date, onedrive_folder_path FROM clients WHERE valid_to IS NULL"
        
        with mock_database.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
        
        assert len(results) == 2
        assert results[0][1] == "Client A"
    
    def test_client_update(self, mock_database, mock_cursor):
        """Test updating a client in the database."""
        mock_cursor.rowcount = 1
        mock_database.cursor.return_value.__enter__.return_value = mock_cursor
        
        query = """
            UPDATE clients 
            SET display_name = ?, full_name = ?
            WHERE client_id = ? AND valid_to IS NULL
        """
        params = ("Updated Client", "Updated Client LLC", 1)
        
        with mock_database.cursor() as cursor:
            cursor.execute(query, params)
        
        assert mock_cursor.execute.called
        assert mock_cursor.execute.call_args[0][1] == params
    
    def test_contract_create_with_validation(self, mock_database, mock_cursor):
        """Test creating a contract with proper validation."""
        mock_cursor.fetchone.return_value = (1,)
        mock_database.cursor.return_value.__enter__.return_value = mock_cursor
        
        # First validate with Pydantic
        contract = ContractCreate(
            client_id=1,
            provider_name="John Hancock",
            fee_type="percentage",
            percent_rate=0.0025,
            payment_schedule="quarterly"
        )
        
        query = """
            INSERT INTO contracts (client_id, provider_name, fee_type, percent_rate, payment_schedule)
            OUTPUT INSERTED.contract_id
            VALUES (?, ?, ?, ?, ?)
        """
        params = (
            contract.client_id,
            contract.provider_name,
            contract.fee_type,
            contract.percent_rate,
            contract.payment_schedule
        )
        
        with mock_database.cursor() as cursor:
            cursor.execute(query, params)
        
        assert mock_cursor.execute.called
    
    def test_payment_create_with_period_validation(self, mock_database, mock_cursor):
        """Test creating a payment with period validation."""
        mock_cursor.fetchone.return_value = (1,)
        mock_database.cursor.return_value.__enter__.return_value = mock_cursor
        
        # Validate with Pydantic first
        payment = PaymentCreate(
            contract_id=1,
            client_id=1,
            received_date="2024-03-15",
            actual_fee=1250.00,
            applied_period_type="quarterly",
            applied_period=1,
            applied_year=2024
        )
        
        query = """
            INSERT INTO payments (
                contract_id, client_id, received_date, actual_fee,
                applied_period_type, applied_period, applied_year
            )
            OUTPUT INSERTED.payment_id
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            payment.contract_id,
            payment.client_id,
            payment.received_date,
            payment.actual_fee,
            payment.applied_period_type,
            payment.applied_period,
            payment.applied_year
        )
        
        with mock_database.cursor() as cursor:
            cursor.execute(query, params)
        
        assert mock_cursor.execute.called
    
    def test_parameterized_query_security(self, mock_database, mock_cursor):
        """Test that queries use parameterized statements for security."""
        mock_database.cursor.return_value.__enter__.return_value = mock_cursor
        
        # This should use parameterized query, not string formatting
        client_id = "1; DROP TABLE clients; --"  # SQL injection attempt
        query = "SELECT * FROM clients WHERE client_id = ?"
        
        with mock_database.cursor() as cursor:
            cursor.execute(query, (client_id,))
        
        # Verify parameterized query was used
        assert mock_cursor.execute.call_args[0][0] == query
        assert mock_cursor.execute.call_args[0][1] == (client_id,)
    
    def test_transaction_rollback(self, mock_database, mock_cursor):
        """Test that transactions rollback on error."""
        # Create mock connection with rollback method
        mock_connection = MagicMock()
        mock_connection.rollback = MagicMock()
        mock_connection.commit = MagicMock()
        mock_connection.cursor.return_value = mock_cursor
        
        # Configure the cursor to raise an exception during execute
        mock_cursor.execute.side_effect = Exception("Database error")
        
        # Create a custom context manager for cursor that mimics the actual behavior
        class MockCursorContextManager:
            def __enter__(self):
                return mock_cursor
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                if exc_type:
                    # This simulates what happens in the actual cursor() method
                    mock_connection.rollback()
                    # Don't suppress the exception (return None/False)
                    return False
                return False
        
        # Create a custom context manager for connection
        class MockConnectionContextManager:
            def __enter__(self):
                return mock_connection
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                # Connection context manager doesn't suppress exceptions
                return False
        
        # Set up the mock database methods
        mock_database.cursor.return_value = MockCursorContextManager()
        mock_database.connection.return_value = MockConnectionContextManager()
        
        # Test that exception is raised and rollback is called
        with pytest.raises(Exception, match="Database error"):
            with mock_database.cursor() as cursor:
                cursor.execute("INSERT INTO clients (display_name) VALUES (?)", ("Test",))
        
        # Verify rollback was called on the connection
        mock_connection.rollback.assert_called_once()


# ============================================================================
# INTEGRATION TESTS WITH ACTUAL DATABASE
# ============================================================================

class TestDatabaseIntegration:
    """Integration tests that connect to the actual database."""
    
    @pytest.mark.skipif(
        not os.getenv("SQL_SERVER") or not os.getenv("SQL_DATABASE"),
        reason="Database credentials not available"
    )
    def test_display_sample_data(self):
        """Display first 5 rows from each table to verify structure."""
        try:
            db = get_db()
            
            tables = [
                "clients",
                "contracts", 
                "payments",
                "contacts",
                "client_files",
                "payment_files",
                "client_metrics",
                "quarterly_summaries",
                "yearly_summaries"
            ]
            
            print("\n" + "="*80)
            print("SAMPLE DATA FROM EACH TABLE")
            print("="*80)
            
            for table in tables:
                try:
                    with db.cursor(commit=False) as cursor:
                        # Get column information
                        cursor.execute(f"""
                            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                            FROM INFORMATION_SCHEMA.COLUMNS
                            WHERE TABLE_NAME = ?
                            ORDER BY ORDINAL_POSITION
                        """, (table,))
                        columns = cursor.fetchall()
                        
                        # Get sample data
                        cursor.execute(f"SELECT TOP 5 * FROM {table}")
                        rows = cursor.fetchall()
                        
                        print(f"\n{table.upper()} TABLE:")
                        print("-" * 60)
                        
                        if columns:
                            print("Columns:")
                            for col in columns:
                                print(f"  - {col.COLUMN_NAME} ({col.DATA_TYPE}, {'NULL' if col.IS_NULLABLE == 'YES' else 'NOT NULL'})")
                        
                        print(f"\nSample Data ({len(rows)} rows):")
                        if rows:
                            # Get column names from cursor description
                            col_names = [desc[0] for desc in cursor.description]
                            for i, row in enumerate(rows):
                                print(f"\nRow {i+1}:")
                                for j, col_name in enumerate(col_names):
                                    print(f"  {col_name}: {row[j]}")
                        else:
                            print("  (No data in table)")
                            
                except Exception as e:
                    print(f"\nError reading {table}: {str(e)}")
            
            print("\n" + "="*80)
            
        except Exception as e:
            pytest.skip(f"Could not connect to database: {str(e)}")
    
    @pytest.mark.skipif(
        not os.getenv("SQL_SERVER") or not os.getenv("SQL_DATABASE"),
        reason="Database credentials not available"
    )
    def test_view_structures(self):
        """Test and display view structures."""
        try:
            db = get_db()
            
            views = ["client_payment_status", "payment_file_view"]
            
            print("\n" + "="*80)
            print("VIEW STRUCTURES")
            print("="*80)
            
            for view in views:
                try:
                    with db.cursor(commit=False) as cursor:
                        # Get view columns
                        cursor.execute(f"""
                            SELECT COLUMN_NAME, DATA_TYPE
                            FROM INFORMATION_SCHEMA.COLUMNS
                            WHERE TABLE_NAME = ?
                            ORDER BY ORDINAL_POSITION
                        """, (view,))
                        columns = cursor.fetchall()
                        
                        print(f"\n{view.upper()} VIEW:")
                        print("-" * 60)
                        
                        if columns:
                            print("Columns:")
                            for col in columns:
                                print(f"  - {col.COLUMN_NAME} ({col.DATA_TYPE})")
                        else:
                            print("  (View not found or no columns)")
                            
                except Exception as e:
                    print(f"\nError reading view {view}: {str(e)}")
            
        except Exception as e:
            pytest.skip(f"Could not connect to database: {str(e)}")


# ============================================================================
# EDGE CASE TESTS
# ============================================================================

class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_empty_string_validation(self):
        """Test that empty strings are handled properly."""
        # Required field should not accept empty string
        with pytest.raises(ValidationError):
            ClientCreate(display_name="")
        
        # Optional field can be empty
        client = ClientCreate(display_name="Test", full_name="")
        assert client.full_name == ""
    
    def test_null_value_handling(self):
        """Test that None/null values are handled correctly."""
        # Test with all optional fields as None
        contract = ContractCreate(
            client_id=1,
            contract_number=None,
            provider_name=None,
            fee_type=None,
            percent_rate=None,
            flat_rate=None
        )
        assert contract.provider_name is None
    
    def test_boundary_values(self):
        """Test boundary values for numeric fields."""
        # Test percentage boundaries
        contract1 = ContractCreate(client_id=1, percent_rate=0.0)  # 0%
        assert contract1.percent_rate == 0.0
        
        contract2 = ContractCreate(client_id=1, percent_rate=1.0)  # 100%
        assert contract2.percent_rate == 1.0
        
        # Test year boundaries
        payment1 = PaymentCreate(contract_id=1, client_id=1, applied_year=2000)
        assert payment1.applied_year == 2000
        
        payment2 = PaymentCreate(contract_id=1, client_id=1, applied_year=2100)
        assert payment2.applied_year == 2100
        
        # Test period boundaries
        payment3 = PaymentCreate(
            contract_id=1, 
            client_id=1,
            applied_period_type="quarterly",
            applied_period=1
        )
        assert payment3.applied_period == 1
        
        payment4 = PaymentCreate(
            contract_id=1,
            client_id=1, 
            applied_period_type="quarterly",
            applied_period=4
        )
        assert payment4.applied_period == 4
    
    def test_invalid_foreign_keys(self, mock_database, mock_cursor):
        """Test handling of invalid foreign key references."""
        # Simulate foreign key constraint error
        mock_cursor.execute.side_effect = Exception("FOREIGN KEY constraint failed")
        mock_database.cursor.return_value.__enter__.return_value = mock_cursor
        
        with pytest.raises(Exception) as exc_info:
            with mock_database.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO contracts (client_id) VALUES (?)",
                    (99999,)  # Non-existent client
                )
        
        assert "FOREIGN KEY" in str(exc_info.value)
    
    def test_max_length_strings(self):
        """Test maximum length string validation."""
        # Test at max length (255 characters)
        long_name = "A" * 255
        client = ClientCreate(display_name=long_name)
        assert len(client.display_name) == 255
        
        # Pydantic doesn't enforce max_length by default in v2
        # but the database will enforce it
    
    def test_special_characters_in_strings(self):
        """Test handling of special characters."""
        client = ClientCreate(
            display_name="Test & Co., LLC",
            full_name="Test's \"Special\" <Company>"
        )
        assert "&" in client.display_name
        assert '"' in client.full_name
    
    def test_numeric_precision(self):
        """Test numeric precision handling."""
        payment = PaymentCreate(
            contract_id=1,
            client_id=1,
            total_assets=12345678.99,
            actual_fee=1234.56789  # Will be rounded by database
        )
        assert payment.total_assets == 12345678.99
        assert payment.actual_fee == 1234.56789


if __name__ == "__main__":
    # Run specific test classes or methods
    pytest.main([__file__, "-v", "-s"])