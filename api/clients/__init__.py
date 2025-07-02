# api/clients/__init__.py

"""
Azure Function for managing client endpoints.
Wraps existing database layer for serverless deployment.
"""
import azure.functions as func
import json
import sys
import os
from typing import Dict, Any

# Add backend to path to use existing database code
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from database.database import get_db
from database.models import Client, ClientCreate, ClientUpdate


async def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Handle client-related HTTP requests.
    
    Routes:
    - GET /api/clients - List all clients
    - GET /api/clients/{id} - Get specific client
    - POST /api/clients - Create new client
    - PUT /api/clients/{id} - Update client
    - DELETE /api/clients/{id} - Soft delete client
    """
    
    # Get client ID from route if present
    client_id = req.route_params.get('id')
    
    try:
        db = get_db()
        
        # GET all clients
        if req.method == "GET" and not client_id:
            # Get query parameters
            provider = req.params.get('provider')
            
            with db.cursor(commit=False) as cursor:
                query = """
                    SELECT c.client_id, c.display_name, c.full_name, 
                           c.ima_signed_date, c.onedrive_folder_path,
                           c.valid_from, c.valid_to,
                           co.provider_name,
                           m.last_payment_date, m.last_payment_amount,
                           m.last_recorded_assets, m.total_ytd_payments
                    FROM clients c
                    LEFT JOIN contracts co ON c.client_id = co.client_id 
                        AND co.valid_to IS NULL
                    LEFT JOIN client_metrics m ON c.client_id = m.client_id
                    WHERE c.valid_to IS NULL
                """
                
                params = []
                if provider:
                    query += " AND co.provider_name = ?"
                    params.append(provider)
                
                query += " ORDER BY c.display_name"
                
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                    
                columns = [column[0] for column in cursor.description]
                rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            clients = []
            for row in rows:
                client_dict = dict(zip(columns, row))
                clients.append(client_dict)
            
            return func.HttpResponse(
                json.dumps(clients, default=str),
                mimetype="application/json"
            )
        
        # GET single client
        elif req.method == "GET" and client_id:
            with db.cursor(commit=False) as cursor:
                query = """
                    SELECT c.client_id, c.display_name, c.full_name,
                           c.ima_signed_date, c.onedrive_folder_path,
                           c.valid_from, c.valid_to,
                           co.provider_name, co.fee_type, co.payment_schedule,
                           m.last_payment_date, m.last_payment_amount,
                           m.total_ytd_payments, m.avg_quarterly_payment,
                           m.last_recorded_assets, m.next_payment_due
                    FROM clients c
                    LEFT JOIN contracts co ON c.client_id = co.client_id 
                        AND co.valid_to IS NULL
                    LEFT JOIN client_metrics m ON c.client_id = m.client_id
                    WHERE c.client_id = ? AND c.valid_to IS NULL
                """
                cursor.execute(query, [int(client_id)])
                columns = [column[0] for column in cursor.description]
                row = cursor.fetchone()
            
            if not row:
                return func.HttpResponse(
                    json.dumps({"error": "Client not found"}),
                    status_code=404,
                    mimetype="application/json"
                )
            
            client_dict = dict(zip(columns, row))
            
            return func.HttpResponse(
                json.dumps(client_dict, default=str),
                mimetype="application/json"
            )
        
        # POST - Create new client
        elif req.method == "POST":
            try:
                req_body = req.get_json()
                client_create = ClientCreate(**req_body)
            except (ValueError, TypeError) as e:
                return func.HttpResponse(
                    json.dumps({"error": f"Invalid request body: {str(e)}"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            with db.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO clients (display_name, full_name, ima_signed_date, 
                                       onedrive_folder_path)
                    OUTPUT INSERTED.client_id
                    VALUES (?, ?, ?, ?)
                """, (
                    client_create.display_name,
                    client_create.full_name,
                    client_create.ima_signed_date,
                    client_create.onedrive_folder_path
                ))
                new_id = cursor.fetchone()[0]
            
            return func.HttpResponse(
                json.dumps({"client_id": new_id, **client_create.model_dump()}, default=str),
                mimetype="application/json",
                status_code=201
            )
        
        # PUT - Update client
        elif req.method == "PUT" and client_id:
            try:
                req_body = req.get_json()
                client_update = ClientUpdate(**req_body)
            except (ValueError, TypeError) as e:
                return func.HttpResponse(
                    json.dumps({"error": f"Invalid request body: {str(e)}"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            # Build dynamic update query
            update_fields = []
            params = []
            
            update_data = client_update.model_dump(exclude_unset=True)
            if not update_data:
                return func.HttpResponse(
                    json.dumps({"error": "No fields to update"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            for field, value in update_data.items():
                update_fields.append(f"{field} = ?")
                params.append(value)
            
            params.append(int(client_id))
            
            with db.cursor() as cursor:
                query = f"""
                    UPDATE clients 
                    SET {', '.join(update_fields)}
                    WHERE client_id = ? AND valid_to IS NULL
                """
                cursor.execute(query, params)
                
                if cursor.rowcount == 0:
                    return func.HttpResponse(
                        json.dumps({"error": "Client not found"}),
                        status_code=404,
                        mimetype="application/json"
                    )
            
            return func.HttpResponse(
                json.dumps({"message": "Client updated successfully"}),
                mimetype="application/json"
            )
        
        # DELETE - Soft delete client
        elif req.method == "DELETE" and client_id:
            with db.cursor() as cursor:
                cursor.execute("""
                    UPDATE clients 
                    SET valid_to = GETDATE()
                    WHERE client_id = ? AND valid_to IS NULL
                """, [int(client_id)])
                
                if cursor.rowcount == 0:
                    return func.HttpResponse(
                        json.dumps({"error": "Client not found"}),
                        status_code=404,
                        mimetype="application/json"
                    )
            
            return func.HttpResponse(status_code=204)
        
        # Method not allowed
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