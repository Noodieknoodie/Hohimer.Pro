# api/dashboard/__init__.py

"""
Azure Function for client dashboard data.
Leverages database views and new schema for aggregated client information.
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
    Get comprehensive dashboard data for a client.
    
    Route: GET /api/dashboard/{client_id}
    
    Returns:
    - Client information
    - Contract details  
    - Payment status (from view)
    - Recent payments
    - Compliance status
    - Summary metrics
    """
    
    client_id = req.route_params.get('client_id')
    
    if not client_id:
        return func.HttpResponse(
            json.dumps({"error": "client_id required"}),
            status_code=400,
            mimetype="application/json"
        )
    
    try:
        db = get_db()
        dashboard_data = {}
        
        with db.cursor(commit=False) as cursor:
            # Get client and contract info
            cursor.execute("""
                SELECT c.client_id, c.display_name, c.full_name, c.ima_signed_date,
                       c.onedrive_folder_path,
                       co.contract_id, co.provider_name, co.fee_type, 
                       co.percent_rate, co.flat_rate, co.payment_schedule,
                       m.last_payment_date, m.last_payment_amount,
                       m.total_ytd_payments, m.avg_quarterly_payment,
                       m.last_recorded_assets, m.next_payment_due
                FROM clients c
                LEFT JOIN contracts co ON c.client_id = co.client_id 
                    AND co.valid_to IS NULL
                LEFT JOIN client_metrics m ON c.client_id = m.client_id
                WHERE c.client_id = ? AND c.valid_to IS NULL
            """, [int(client_id)])
            
            columns = [column[0] for column in cursor.description]
            row = cursor.fetchone()
            
            if not row:
                return func.HttpResponse(
                    json.dumps({"error": "Client not found"}),
                    status_code=404,
                    mimetype="application/json"
                )
            
            client_data = dict(zip(columns, row))
            
            # Structure the response
            dashboard_data['client'] = {
                'client_id': client_data['client_id'],
                'display_name': client_data['display_name'],
                'full_name': client_data['full_name'],
                'ima_signed_date': client_data['ima_signed_date'],
                'onedrive_folder_path': client_data['onedrive_folder_path']
            }
            
            if client_data['contract_id']:
                dashboard_data['contract'] = {
                    'contract_id': client_data['contract_id'],
                    'provider_name': client_data['provider_name'],
                    'fee_type': client_data['fee_type'],
                    'percent_rate': client_data['percent_rate'],
                    'flat_rate': client_data['flat_rate'],
                    'payment_schedule': client_data['payment_schedule']
                }
            else:
                dashboard_data['contract'] = None
            
            # Get payment status from the view
            cursor.execute("""
                SELECT client_id, display_name, payment_schedule, fee_type,
                       flat_rate, percent_rate, last_payment_date, last_payment_amount,
                       applied_period, applied_year, applied_period_type,
                       current_period, current_year, last_recorded_assets,
                       expected_fee, payment_status
                FROM client_payment_status
                WHERE client_id = ?
            """, [int(client_id)])
            
            status_columns = [column[0] for column in cursor.description]
            status_row = cursor.fetchone()
            
            if status_row:
                status_data = dict(zip(status_columns, status_row))
                
                # Determine period display based on type
                if status_data['applied_period_type'] == 'monthly':
                    months = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December']
                    current_period_name = f"{months[status_data['current_period']-1]} {status_data['current_year']}"
                else:
                    current_period_name = f"Q{status_data['current_period']} {status_data['current_year']}"
                
                dashboard_data['payment_status'] = {
                    'status': status_data['payment_status'],
                    'current_period': current_period_name,
                    'current_period_number': status_data['current_period'],
                    'current_year': status_data['current_year'],
                    'last_payment_date': status_data['last_payment_date'],
                    'last_payment_amount': status_data['last_payment_amount'],
                    'expected_fee': status_data['expected_fee']
                }
                
                # Determine compliance based on payment status
                if status_data['payment_status'] == 'Overdue':
                    dashboard_data['compliance'] = {
                        'status': 'non_compliant',
                        'color': 'red',
                        'reason': 'Payment overdue'
                    }
                elif status_data['payment_status'] == 'Due':
                    dashboard_data['compliance'] = {
                        'status': 'compliant',
                        'color': 'yellow', 
                        'reason': 'Payment due for current period'
                    }
                else:  # Paid
                    dashboard_data['compliance'] = {
                        'status': 'compliant',
                        'color': 'green',
                        'reason': 'All payments up to date'
                    }
            else:
                # No payment status data
                dashboard_data['payment_status'] = {
                    'status': 'Due',
                    'current_period': None,
                    'reason': 'No payment history'
                }
                dashboard_data['compliance'] = {
                    'status': 'compliant',
                    'color': 'yellow',
                    'reason': 'No payment history'
                }
            
            # Get recent payments
            cursor.execute("""
                SELECT TOP 5 
                    p.payment_id, p.received_date, p.actual_fee, p.total_assets,
                    p.applied_period, p.applied_year, p.applied_period_type,
                    CASE WHEN COUNT(pf.file_id) > 0 THEN 1 ELSE 0 END as has_files
                FROM payments p
                LEFT JOIN payment_files pf ON p.payment_id = pf.payment_id
                WHERE p.client_id = ? AND p.valid_to IS NULL
                GROUP BY p.payment_id, p.received_date, p.actual_fee, p.total_assets,
                         p.applied_period, p.applied_year, p.applied_period_type
                ORDER BY p.received_date DESC
            """, [int(client_id)])
            
            payment_columns = [column[0] for column in cursor.description]
            recent_payments = []
            
            for payment_row in cursor.fetchall():
                payment_dict = dict(zip(payment_columns, payment_row))
                
                # Format period for display
                if payment_dict['applied_period_type'] == 'monthly':
                    months = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December']
                    payment_dict['period_display'] = f"{months[payment_dict['applied_period']-1]} {payment_dict['applied_year']}"
                else:
                    payment_dict['period_display'] = f"Q{payment_dict['applied_period']} {payment_dict['applied_year']}"
                
                recent_payments.append(payment_dict)
            
            dashboard_data['recent_payments'] = recent_payments
            
            # Add metrics from client_metrics
            dashboard_data['metrics'] = {
                'total_ytd_payments': client_data['total_ytd_payments'],
                'avg_quarterly_payment': client_data['avg_quarterly_payment'], 
                'last_recorded_assets': client_data['last_recorded_assets'],
                'next_payment_due': client_data['next_payment_due']
            }
            
            # Get summary data if needed
            current_year = datetime.now().year
            cursor.execute("""
                SELECT quarter, total_payments, payment_count, avg_payment, expected_total
                FROM quarterly_summaries
                WHERE client_id = ? AND year = ?
                ORDER BY quarter
            """, [int(client_id), current_year])
            
            quarterly_columns = [column[0] for column in cursor.description]
            quarterly_summaries = []
            
            for q_row in cursor.fetchall():
                quarterly_summaries.append(dict(zip(quarterly_columns, q_row)))
            
            dashboard_data['quarterly_summaries'] = quarterly_summaries
        
        return func.HttpResponse(
            json.dumps(dashboard_data, default=str),
            mimetype="application/json"
        )
        
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )