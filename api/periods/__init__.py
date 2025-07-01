# api/periods/__init__.py

"""
Azure Function for getting available payment periods.
Used by payment forms to show which periods can be selected.
"""
import azure.functions as func
import json
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from database.database import get_db


async def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Get available periods for payment entry.
    
    Route: GET /api/periods?client_id={id}&contract_id={id}
    
    Returns list of periods that haven't been paid yet.
    """
    
    client_id = req.params.get('client_id')
    contract_id = req.params.get('contract_id')
    
    if not client_id or not contract_id:
        return func.HttpResponse(
            json.dumps({"error": "client_id and contract_id required"}),
            status_code=400,
            mimetype="application/json"
        )
    
    try:
        db = get_db()
        
        with db.cursor(commit=False) as cursor:
            # Get contract payment schedule
            cursor.execute("""
                SELECT payment_schedule
                FROM contracts
                WHERE contract_id = ? AND client_id = ? AND valid_to IS NULL
            """, [int(contract_id), int(client_id)])
            
            row = cursor.fetchone()
            if not row:
                return func.HttpResponse(
                    json.dumps({"error": "Contract not found"}),
                    status_code=404,
                    mimetype="application/json"
                )
            
            payment_schedule = row[0]
            is_monthly = payment_schedule.lower() == 'monthly'
            
            # Get all paid periods for this client
            cursor.execute("""
                SELECT DISTINCT applied_period, applied_year
                FROM payments
                WHERE client_id = ? 
                  AND valid_to IS NULL
                  AND applied_period_type = ?
                ORDER BY applied_year DESC, applied_period DESC
            """, [int(client_id), payment_schedule.lower()])
            
            paid_periods = set()
            for row in cursor.fetchall():
                paid_periods.add((row[0], row[1]))
            
            # Get the earliest payment to determine start range
            cursor.execute("""
                SELECT MIN(applied_year) as first_year,
                       MIN(CASE WHEN applied_year = (SELECT MIN(applied_year) FROM payments WHERE client_id = ?)
                                THEN applied_period END) as first_period
                FROM payments
                WHERE client_id = ? AND valid_to IS NULL
            """, [int(client_id), int(client_id)])
            
            row = cursor.fetchone()
            if row and row[0]:
                start_year = row[0]
                start_period = row[1] if row[1] else 1
            else:
                # No payments yet, start from beginning of current year
                start_year = datetime.now().year
                start_period = 1
            
            # Generate available periods
            current_date = datetime.now()
            current_year = current_date.year
            
            if is_monthly:
                current_period = current_date.month
                max_period = 12
                period_names = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ]
            else:
                current_period = (current_date.month - 1) // 3 + 1
                max_period = 4
                period_names = ['Q1', 'Q2', 'Q3', 'Q4']
            
            available_periods = []
            
            # Generate periods from start to current
            year = start_year
            period = start_period
            
            while year < current_year or (year == current_year and period <= current_period):
                if (period, year) not in paid_periods:
                    period_label = f"{period_names[period-1]} {year}"
                    available_periods.append({
                        'value': f"{period}-{year}",
                        'label': period_label,
                        'period': period,
                        'year': year,
                        'period_type': payment_schedule.lower()
                    })
                
                # Move to next period
                period += 1
                if period > max_period:
                    period = 1
                    year += 1
                
                # Safety check to prevent infinite loop
                if year > current_year + 1:
                    break
            
            # Sort by most recent first
            available_periods.reverse()
        
        return func.HttpResponse(
            json.dumps({
                'periods': available_periods,
                'payment_schedule': payment_schedule
            }, default=str),
            mimetype="application/json"
        )
        
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )