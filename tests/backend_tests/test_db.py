import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'backend', 'database'))
from database import db

def test_connection():
    print("Testing Azure SQL Database connection...")
    print(f"Server: {db.connection_string}")
    print("-" * 50)
    
    try:
        # Test 1: Basic connection
        print("1. Testing connection...")
        conn = db.get_connection()
        print("✓ Connection successful!")
        
        # Test 2: Get database version
        print("\n2. Testing query execution...")
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"✓ Database version: {version[:50]}...")
        
        # Test 3: List all tables
        print("\n3. Listing tables in database...")
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        """)
        tables = cursor.fetchall()
        
        if tables:
            print(f"✓ Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("⚠ No tables found in database")
        
        # Test 4: Show current user
        print("\n4. Checking current user...")
        cursor.execute("SELECT CURRENT_USER")
        user = cursor.fetchone()[0]
        print(f"✓ Connected as: {user}")
        
        conn.close()
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Connection failed!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        
        if "login failed" in str(e).lower():
            print("\n💡 Troubleshooting tips:")
            print("1. Make sure you're signed into Azure CLI: az login")
            print("2. Verify your account has access to the database")
            print("3. Check firewall rules on the SQL server")
        elif "driver" in str(e).lower():
            print("\n💡 Troubleshooting tips:")
            print("1. Install ODBC Driver 18: https://go.microsoft.com/fwlink/?linkid=2249006")
            print("2. Restart your terminal after installation")

if __name__ == "__main__":
    test_connection()