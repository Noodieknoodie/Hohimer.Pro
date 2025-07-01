"""
Azure Function for variance calculations.
Compares actual vs expected fees.
"""
import azure.functions as func
import json

async def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Calculate variance between actual and expected fees.
    Route: GET /api/calculations/variance?actual_fee={amount}&expected_fee={amount}
    """
    try:
        actual = float(req.params.get('actual_fee', 0))
        expected = float(req.params.get('expected_fee', 0))
    except (ValueError, TypeError):
        return func.HttpResponse(
            json.dumps({"error": "Invalid fee amounts"}),
            status_code=400,
            mimetype="application/json"
        )
    
    if expected == 0:
        return func.HttpResponse(
            json.dumps({
                "status": "unknown",
                "message": "N/A",
                "difference": None,
                "percent_difference": None
            }),
            mimetype="application/json"
        )
    
    difference = actual - expected
    percent_diff = (difference / expected) * 100
    
    # Determine status based on percentage difference
    if abs(difference) < 0.01:
        status = "exact"
        message = "Exact Match"
    elif abs(percent_diff) <= 5:
        status = "acceptable"
        message = f"${difference:,.2f} ({percent_diff:.1f}%)"
    elif abs(percent_diff) <= 15:
        status = "warning"
        message = f"${difference:,.2f} ({percent_diff:.1f}%)"
    else:
        status = "alert"
        message = f"${difference:,.2f} ({percent_diff:.1f}%)"
    
    return func.HttpResponse(
        json.dumps({
            "status": status,
            "message": message,
            "difference": difference,
            "percent_difference": percent_diff
        }),
        mimetype="application/json"
    )