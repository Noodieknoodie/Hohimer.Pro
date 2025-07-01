# api/payments/__init__.py

"""
Azure Function for managing payment endpoints.
Handles payment CRUD operations using the new simplified schema.
"""
import azure.functions as func
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from database.database import get_db
from database.models import Payment, PaymentCreate, PaymentUpdate


async def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Handle payment-related HTTP requests.
    
    Routes:
    - GET /api/payments?client_id={id} - List payments for a client
    - GET /api/payments/{id} - Get specific payment
    - POST /api/payments - Create new payment
    - PUT /api/payments/{id} - Update payment
    - DELETE /api/payments/{id} - Soft delete payment
    """
    
    payment_id = req.route_params.get('id')
    
    try:
        db = get_db()
        
        # GET payments with filters
        if req.method == "GET" and not payment_id:
            client_id = req.params.get('client_id')
            year = req.params.get('year')
            page = int(req.params.get('page', 1))
            limit = int(req.params.get('limit', 50))
            offset = (page - 1) * limit
            
            if not client_id:
                return func.HttpResponse(
                    json.dumps({"error": "client_id parameter required"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            with db.cursor(commit=False) as cursor:
                query = """
                    SELECT p.payment_id, p.contract_id, p.client_id, p.received_date,
                           p.total_assets, p.expected_fee, p.actual_fee, p.method, p.notes,
                           p.applied_period_type, p.applied_period, p.applied_year,
                           p.valid_from, p.valid_to,
                           c.display_name as client_name, 
                           co.provider_name, co.fee_type, co.percent_rate, 
                           co.flat_rate, co.payment_schedule,
                           CASE WHEN pf.payment_id IS NOT NULL THEN 1 ELSE 0 END as has_files
                    FROM payments p
                    JOIN clients c ON p.client_id = c.client_id
                    LEFT JOIN contracts co ON p.contract_id = co.contract_id
                    LEFT JOIN payment_files pf ON p.payment_id = pf.payment_id
                    WHERE p.client_id = ? AND p.valid_to IS NULL
                """
                
                params = [int(client_id)]
                
                if year:
                    query += " AND p.applied_year = ?"
                    params.append(int(year))
                
                # Group by all non-aggregate columns to handle multiple files
                query += """
                    GROUP BY p.payment_id, p.contract_id, p.client_id, p.received_date,
                             p.total_assets, p.expected_fee, p.actual_fee, p.method, p.notes,
                             p.applied_period_type, p.applied_period, p.applied_year,
                             p.valid_from, p.valid_to, c.display_name, 
                             co.provider_name, co.fee_type, co.percent_rate, 
                             co.flat_rate, co.payment_schedule
                    ORDER BY p.received_date DESC
                    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                """
                params.extend([offset, limit])
                
                cursor.execute(query, params)
                columns = [column[0] for column in cursor.description]
                rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            payments = []
            for row in rows:
                payment_dict = dict(zip(columns, row))
                
                # Calculate expected fee if not stored
                if payment_dict['expected_fee'] is None:
                    if payment_dict['fee_type'] == 'percentage' and payment_dict['percent_rate'] and payment_dict['total_assets']:
                        payment_dict['expected_fee'] = payment_dict['total_assets'] * payment_dict['percent_rate']
                    elif payment_dict['fee_type'] == 'flat' and payment_dict['flat_rate']:
                        payment_dict['expected_fee'] = payment_dict['flat_rate']
                
                payments.append(payment_dict)
            
            return func.HttpResponse(
                json.dumps(payments, default=str),
                mimetype="application/json"
            )
        
        # GET single payment
        elif req.method == "GET" and payment_id:
            with db.cursor(commit=False) as cursor:
                query = """
                    SELECT p.payment_id, p.contract_id, p.client_id, p.received_date,
                           p.total_assets, p.expected_fee, p.actual_fee, p.method, p.notes,
                           p.applied_period_type, p.applied_period, p.applied_year,
                           p.valid_from, p.valid_to,
                           c.display_name as client_name, 
                           co.provider_name, co.fee_type, co.percent_rate, 
                           co.flat_rate, co.payment_schedule,
                           CASE WHEN COUNT(pf.file_id) > 0 THEN 1 ELSE 0 END as has_files
                    FROM payments p
                    JOIN clients c ON p.client_id = c.client_id
                    LEFT JOIN contracts co ON p.contract_id = co.contract_id
                    LEFT JOIN payment_files pf ON p.payment_id = pf.payment_id
                    WHERE p.payment_id = ? AND p.valid_to IS NULL
                    GROUP BY p.payment_id, p.contract_id, p.client_id, p.received_date,
                             p.total_assets, p.expected_fee, p.actual_fee, p.method, p.notes,
                             p.applied_period_type, p.applied_period, p.applied_year,
                             p.valid_from, p.valid_to, c.display_name, 
                             co.provider_name, co.fee_type, co.percent_rate, 
                             co.flat_rate, co.payment_schedule
                """
                cursor.execute(query, [int(payment_id)])
                columns = [column[0] for column in cursor.description]
                row = cursor.fetchone()
            
            if not row:
                return func.HttpResponse(
                    json.dumps({"error": "Payment not found"}),
                    status_code=404,
                    mimetype="application/json"
                )
            
            payment_dict = dict(zip(columns, row))
            
            # Calculate expected fee if not stored
            if payment_dict['expected_fee'] is None:
                if payment_dict['fee_type'] == 'percentage' and payment_dict['percent_rate'] and payment_dict['total_assets']:
                    payment_dict['expected_fee'] = payment_dict['total_assets'] * payment_dict['percent_rate']
                elif payment_dict['fee_type'] == 'flat' and payment_dict['flat_rate']:
                    payment_dict['expected_fee'] = payment_dict['flat_rate']
            
            return func.HttpResponse(
                json.dumps(payment_dict, default=str),
                mimetype="application/json"
            )
        
        # POST - Create new payment
        elif req.method == "POST":
            try:
                req_body = req.get_json()
                payment_create = PaymentCreate(**req_body)
            except (ValueError, TypeError) as e:
                return func.HttpResponse(
                    json.dumps({"error": f"Invalid request body: {str(e)}"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            with db.cursor() as cursor:
                # Insert payment using new schema
                cursor.execute("""
                    INSERT INTO payments (
                        contract_id, client_id, received_date, total_assets,
                        expected_fee, actual_fee, method, notes,
                        applied_period_type, applied_period, applied_year
                    )
                    OUTPUT INSERTED.payment_id
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    payment_create.contract_id,
                    payment_create.client_id,
                    payment_create.received_date,
                    payment_create.total_assets,
                    payment_create.expected_fee,
                    payment_create.actual_fee,
                    payment_create.method,
                    payment_create.notes,
                    payment_create.applied_period_type,
                    payment_create.applied_period,
                    payment_create.applied_year
                ))
                new_id = cursor.fetchone()[0]
                
                # Note: Triggers will handle updating client_metrics and summaries automatically
            
            return func.HttpResponse(
                json.dumps({"payment_id": new_id, **payment_create.model_dump()}, default=str),
                mimetype="application/json",
                status_code=201
            )
        
        # PUT - Update payment
        elif req.method == "PUT" and payment_id:
            try:
                req_body = req.get_json()
                payment_update = PaymentUpdate(**req_body)
            except (ValueError, TypeError) as e:
                return func.HttpResponse(
                    json.dumps({"error": f"Invalid request body: {str(e)}"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            # Build dynamic update query
            update_fields = []
            params = []
            
            update_data = payment_update.model_dump(exclude_unset=True)
            if not update_data:
                return func.HttpResponse(
                    json.dumps({"error": "No fields to update"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            for field, value in update_data.items():
                update_fields.append(f"{field} = ?")
                params.append(value)
            
            params.append(int(payment_id))
            
            with db.cursor() as cursor:
                query = f"""
                    UPDATE payments 
                    SET {', '.join(update_fields)}
                    WHERE payment_id = ? AND valid_to IS NULL
                """
                cursor.execute(query, params)
                
                if cursor.rowcount == 0:
                    return func.HttpResponse(
                        json.dumps({"error": "Payment not found"}),
                        status_code=404,
                        mimetype="application/json"
                    )
                
                # Note: Triggers will handle updating summaries automatically
            
            return func.HttpResponse(
                json.dumps({"message": "Payment updated successfully"}),
                mimetype="application/json"
            )
        
        # DELETE - Soft delete payment
        elif req.method == "DELETE" and payment_id:
            with db.cursor() as cursor:
                cursor.execute("""
                    UPDATE payments 
                    SET valid_to = GETDATE()
                    WHERE payment_id = ? AND valid_to IS NULL
                """, [int(payment_id)])
                
                if cursor.rowcount == 0:
                    return func.HttpResponse(
                        json.dumps({"error": "Payment not found"}),
                        status_code=404,
                        mimetype="application/json"
                    )
                
                # Note: Triggers will handle updating summaries automatically
            
            return func.HttpResponse(status_code=204)
        
        else:
            return func.HttpResponse(
                json.dumps({"error": "Method not allowed"}),
                status_code=405,
                mimetype="application/json"
            )
            
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )