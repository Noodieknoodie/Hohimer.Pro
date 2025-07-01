#!/usr/bin/env python3
"""
Simple test runner to execute tests without pytest.
This is for demonstration purposes when pytest is not installed.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend_tests.test_models_and_crud import (
    TestClientModels,
    TestContractModels,
    TestPaymentModels,
    TestContactModels
)

def run_simple_tests():
    """Run a few simple validation tests."""
    print("Running Model Validation Tests...")
    print("=" * 60)
    
    # Test Client Models
    print("\nTesting Client Models:")
    try:
        test = TestClientModels()
        test.test_client_create_valid()
        print("✓ Client creation with valid data - PASSED")
    except Exception as e:
        print(f"✗ Client creation with valid data - FAILED: {e}")
    
    try:
        test.test_client_create_invalid_empty_display_name()
        print("✗ Empty display name validation - FAILED (should have raised error)")
    except Exception:
        print("✓ Empty display name validation - PASSED")
    
    # Test Contract Models
    print("\nTesting Contract Models:")
    try:
        test = TestContractModels()
        test.test_contract_create_percentage_valid()
        print("✓ Contract percentage creation - PASSED")
    except Exception as e:
        print(f"✗ Contract percentage creation - FAILED: {e}")
    
    try:
        test.test_contract_percentage_out_of_range()
        print("✗ Percentage validation - FAILED (should have raised error)")
    except Exception:
        print("✓ Percentage validation - PASSED")
    
    # Test Payment Models
    print("\nTesting Payment Models:")
    try:
        test = TestPaymentModels()
        test.test_payment_create_valid()
        print("✓ Payment creation with valid data - PASSED")
    except Exception as e:
        print(f"✗ Payment creation with valid data - FAILED: {e}")
    
    try:
        test.test_payment_quarterly_period_validation()
        print("✗ Quarterly period validation - FAILED (should have raised error)")
    except Exception:
        print("✓ Quarterly period validation - PASSED")
    
    # Test Contact Models
    print("\nTesting Contact Models:")
    try:
        test = TestContactModels()
        test.test_contact_create_valid()
        print("✓ Contact creation with valid data - PASSED")
    except Exception as e:
        print(f"✗ Contact creation with valid data - FAILED: {e}")
    
    try:
        test.test_contact_invalid_email()
        print("✗ Email validation - FAILED (should have raised error)")
    except Exception:
        print("✓ Email validation - PASSED")
    
    print("\n" + "=" * 60)
    print("Basic validation tests completed!")
    print("\nNote: For comprehensive testing including database operations,")
    print("install pytest and run: pytest tests/")

if __name__ == "__main__":
    run_simple_tests()