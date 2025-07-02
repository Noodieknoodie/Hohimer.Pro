# api/contracts/__init__.py


"""
Azure Function for managing contract endpoints.
Handles contract CRUD operations.
"""
import azure.functions as func
import json
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from database.database import get_db
from database.models import Contract, ContractCreate, ContractUpdate


async def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Handle contract-related HTTP requests.
    
    Routes:
    - GET /api/contracts - List all contracts
    - GET /api/contracts/{id} - Get specific contract
    - GET /api/contracts/client/{client_id} - Get contract for a client
    - POST /api/contracts - Create new contract
    - PUT /api/contracts/{id} - Update contract
    - DELETE /api/contracts/{id} - Soft delete contract
    """
    
    contract_id = req.route_params.get('id')
    client_id = req.route_params.get('client_id')
    
    try:
        db = get_db()
        
        # GET all contracts
        if req.method == "GET" and not contract_id and not client_id:
            provider = req.params.get('provider')
            
            with db.cursor(commit=False) as cursor:
                query = """
                    SELECT co.*, c.display_name as client_name
                    FROM contracts co
                    JOIN clients c ON co.client_id = c.client_id
                    WHERE co.valid_to IS NULL
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
            
            contracts = [dict(zip(columns, row)) for row in rows]
            
            return func.HttpResponse(
                json.dumps(contracts, default=str),
                mimetype="application/json"
            )
        
        # GET contract by client_id
        elif req.method == "GET" and client_id:
            with db.cursor(commit=False) as cursor:
                cursor.execute("""
                    SELECT co.*, c.display_name as client_name
                    FROM contracts co
                    JOIN clients c ON co.client_id = c.client_id
                    WHERE co.client_id = ? AND co.valid_to IS NULL
                """, [int(client_id)])
                
                columns = [column[0] for column in cursor.description]
                row = cursor.fetchone()
            
            if not row:
                return func.HttpResponse(
                    json.dumps({"error": "Contract not found for this client"}),
                    status_code=404,
                    mimetype="application/json"
                )
            
            contract = dict(zip(columns, row))
            
            return func.HttpResponse(
                json.dumps(contract, default=str),
                mimetype="application/json"
            )
        
        # GET single contract by id
        elif req.method == "GET" and contract_id:
            with db.cursor(commit=False) as cursor:
                cursor.execute("""
                    SELECT co.*, c.display_name as client_name
                    FROM contracts co
                    JOIN clients c ON co.client_id = c.client_id
                    WHERE co.contract_id = ? AND co.valid_to IS NULL
                """, [int(contract_id)])
                
                columns = [column[0] for column in cursor.description]
                row = cursor.fetchone()
            
            if not row:
                return func.HttpResponse(
                    json.dumps({"error": "Contract not found"}),
                    status_code=404,
                    mimetype="application/json"
                )
            
            contract = dict(zip(columns, row))
            
            return func.HttpResponse(
                json.dumps(contract, default=str),
                mimetype="application/json"
            )
        
        # POST - Create new contract
        elif req.method == "POST":
            try:
                req_body = req.get_json()
                contract_create = ContractCreate(**req_body)
            except (ValueError, TypeError) as e:
                return func.HttpResponse(
                    json.dumps({"error": f"Invalid request body: {str(e)}"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            with db.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO contracts (
                        client_id, contract_number, provider_name, contract_start_date,
                        fee_type, percent_rate, flat_rate, payment_schedule,
                        num_people, notes
                    )
                    OUTPUT INSERTED.contract_id
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    contract_create.client_id,
                    contract_create.contract_number,
                    contract_create.provider_name,
                    contract_create.contract_start_date,
                    contract_create.fee_type,
                    contract_create.percent_rate,
                    contract_create.flat_rate,
                    contract_create.payment_schedule,
                    contract_create.num_people,
                    contract_create.notes
                ))
                new_id = cursor.fetchone()[0]
            
            return func.HttpResponse(
                json.dumps({"contract_id": new_id, **contract_create.model_dump()}, default=str),
                mimetype="application/json",
                status_code=201
            )
        
        # PUT - Update contract
        elif req.method == "PUT" and contract_id:
            try:
                req_body = req.get_json()
                contract_update = ContractUpdate(**req_body)
            except (ValueError, TypeError) as e:
                return func.HttpResponse(
                    json.dumps({"error": f"Invalid request body: {str(e)}"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            # Build dynamic update query
            update_fields = []
            params = []
            
            update_data = contract_update.model_dump(exclude_unset=True)
            if not update_data:
                return func.HttpResponse(
                    json.dumps({"error": "No fields to update"}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            for field, value in update_data.items():
                update_fields.append(f"{field} = ?")
                params.append(value)
            
            params.append(int(contract_id))
            
            with db.cursor() as cursor:
                query = f"""
                    UPDATE contracts 
                    SET {', '.join(update_fields)}
                    WHERE contract_id = ? AND valid_to IS NULL
                """
                cursor.execute(query, params)
                
                if cursor.rowcount == 0:
                    return func.HttpResponse(
                        json.dumps({"error": "Contract not found"}),
                        status_code=404,
                        mimetype="application/json"
                    )
            
            return func.HttpResponse(
                json.dumps({"message": "Contract updated successfully"}),
                mimetype="application/json"
            )
        
        # DELETE - Soft delete contract
        elif req.method == "DELETE" and contract_id:
            with db.cursor() as cursor:
                cursor.execute("""
                    UPDATE contracts 
                    SET valid_to = GETDATE()
                    WHERE contract_id = ? AND valid_to IS NULL
                """, [int(contract_id)])
                
                if cursor.rowcount == 0:
                    return func.HttpResponse(
                        json.dumps({"error": "Contract not found"}),
                        status_code=404,
                        mimetype="application/json"
                    )
            
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