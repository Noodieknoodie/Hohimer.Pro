"""
Test the Azure Functions API works correctly.
"""
import requests
import json
from datetime import datetime

API_URL = "http://localhost:7071/api"

def test_payment_creation():
    """Test creating and retrieving a payment."""
    print("\n=== Testing Payment API ===")
    
    # Create a quarterly payment
    payment_data = {
        "contract_id": 1,
        "client_id": 1,
        "received_date": datetime.now().strftime("%Y-%m-%d"),
        "total_assets": 750000.00,
        "actual_fee": 1875.00,
        "method": "Wire Transfer",
        "applied_period_type": "quarterly",
        "applied_period": 3,
        "applied_year": 2025
    }
    
    print(f"Creating Q{payment_data['applied_period']} {payment_data['applied_year']} payment...")
    
    resp = requests.post(f"{API_URL}/payments", json=payment_data)
    if resp.status_code != 201:
        print(f"✗ Failed to create payment: {resp.text}")
        return False
    
    created = resp.json()
    payment_id = created["payment_id"]
    print(f"✓ Created payment {payment_id}")
    
    # Get it back
    resp = requests.get(f"{API_URL}/payments/{payment_id}")
    if resp.status_code != 200:
        print(f"✗ Failed to retrieve payment")
        return False
    
    payment = resp.json()
    print(f"✓ Retrieved payment for {payment['applied_period_type']} period {payment['applied_period']}")
    
    # Clean up
    resp = requests.delete(f"{API_URL}/payments/{payment_id}")
    print(f"✓ Cleaned up test payment")
    
    return True

def test_dashboard():
    """Test dashboard endpoint aggregates data correctly."""
    print("\n=== Testing Dashboard API ===")
    
    resp = requests.get(f"{API_URL}/dashboard/1")
    if resp.status_code != 200:
        print(f"✗ Failed to get dashboard: {resp.status_code}")
        return False
    
    dashboard = resp.json()
    
    # Check structure
    required_sections = ["client", "payment_status", "compliance", "recent_payments", "metrics"]
    for section in required_sections:
        if section in dashboard:
            print(f"✓ Has {section}")
        else:
            print(f"✗ Missing {section}")
            return False
    
    print(f"✓ Payment status: {dashboard['payment_status']['status']}")
    print(f"✓ Compliance: {dashboard['compliance']['status']} ({dashboard['compliance']['color']})")
    
    return True

def test_periods_endpoint():
    """Test getting available periods for payment entry."""
    print("\n=== Testing Periods API ===")
    
    resp = requests.get(f"{API_URL}/periods", params={"client_id": 1, "contract_id": 1})
    if resp.status_code != 200:
        print(f"✗ Failed to get periods: {resp.status_code}")
        return False
    
    data = resp.json()
    periods = data.get("periods", [])
    
    if periods:
        print(f"✓ Found {len(periods)} available periods")
        latest = periods[0]
        print(f"✓ Latest available: {latest['label']}")
    else:
        print("✓ No unpaid periods available")
    
    return True

def main():
    """Run all tests."""
    print("Testing Azure Functions API...")
    print(f"URL: {API_URL}")
    
    try:
        # Quick connectivity check
        resp = requests.get(f"{API_URL}/clients")
        print(f"✓ API is running")
    except requests.exceptions.ConnectionError:
        print("✗ API not running. Start it with:")
        print("  cd api")
        print("  func start")
        return
    
    # Run tests
    tests = [
        test_payment_creation,
        test_dashboard,
        test_periods_endpoint
    ]
    
    passed = 0
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ Test failed with error: {e}")
    
    print(f"\n{'='*40}")
    print(f"Passed {passed}/{len(tests)} tests")

if __name__ == "__main__":
    main()