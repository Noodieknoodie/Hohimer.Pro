# api/utils.py

"""
Shared utilities for Azure Functions.
Common helpers for authentication, error handling, and response formatting.
"""
import json
import azure.functions as func
from typing import Any, Dict, Optional
from datetime import datetime


def json_response(data: Any, status_code: int = 200) -> func.HttpResponse:
    """Create a JSON HTTP response with proper headers."""
    return func.HttpResponse(
        json.dumps(data, default=str),
        status_code=status_code,
        mimetype="application/json",
        headers={
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        }
    )


def error_response(message: str, status_code: int = 400) -> func.HttpResponse:
    """Create a standardized error response."""
    return json_response({"error": message}, status_code)


def success_response(message: str = "Success", data: Optional[Dict] = None) -> func.HttpResponse:
    """Create a standardized success response."""
    response = {"message": message}
    if data:
        response.update(data)
    return json_response(response)


def parse_int_param(req: func.HttpRequest, param_name: str, default: int = None) -> Optional[int]:
    """Safely parse integer parameter from request."""
    value = req.params.get(param_name)
    if value:
        try:
            return int(value)
        except ValueError:
            return default
    return default


def parse_bool_param(req: func.HttpRequest, param_name: str, default: bool = False) -> bool:
    """Parse boolean parameter from request."""
    value = req.params.get(param_name, '').lower()
    if value in ('true', '1', 'yes'):
        return True
    elif value in ('false', '0', 'no'):
        return False
    return default


def get_current_period(schedule: str = 'monthly') -> Dict[str, Any]:
    """Get current period information based on payment schedule."""
    now = datetime.now()
    
    if schedule.lower() == 'monthly':
        return {
            'period': now.month,
            'year': now.year,
            'name': now.strftime('%B %Y'),
            'type': 'monthly'
        }
    else:  # quarterly
        quarter = (now.month - 1) // 3 + 1
        return {
            'period': quarter,
            'year': now.year,
            'name': f'Q{quarter} {now.year}',
            'type': 'quarterly'
        }


def format_money(amount: Optional[float]) -> Optional[str]:
    """Format money amount for display (backend formatting when needed)."""
    if amount is None:
        return None
    return f"${amount:,.2f}"


def format_percentage(rate: Optional[float]) -> Optional[str]:
    """Format percentage rate for display (backend formatting when needed)."""
    if rate is None:
        return None
    return f"{rate * 100:.4f}%"