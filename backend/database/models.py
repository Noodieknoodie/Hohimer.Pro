"""
Pydantic models for the 401(k) Payment Tracking System database schema.
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict
from decimal import Decimal


# Custom validators
def validate_percentage(v: Optional[float]) -> Optional[float]:
    """Validate percentage is between 0 and 1."""
    if v is not None and not 0 <= v <= 1:
        raise ValueError('Percentage must be between 0 and 1 (e.g., 0.0025 for 0.25%)')
    return v


def validate_positive_amount(v: Optional[float]) -> Optional[float]:
    """Validate amount is positive."""
    if v is not None and v < 0:
        raise ValueError('Amount must be positive')
    return v


# Base models with common fields
class TimestampedModel(BaseModel):
    """Base model with temporal validity tracking."""
    valid_from: datetime = Field(default_factory=datetime.now, description="When this record became valid")
    valid_to: Optional[datetime] = Field(default=None, description="When this record became invalid (NULL for active records)")


# Client models
class ClientBase(BaseModel):
    """Base client information."""
    display_name: str = Field(..., max_length=255, description="Short name for UI display (e.g., 'AirSea America')")
    full_name: Optional[str] = Field(None, max_length=255, description="Legal plan name")
    ima_signed_date: Optional[str] = Field(None, max_length=50, description="Investment Management Agreement date")
    onedrive_folder_path: Optional[str] = Field(None, max_length=500, description="Path to client's document folder")


class ClientCreate(ClientBase):
    """Model for creating a new client."""
    pass


class ClientUpdate(BaseModel):
    """Model for updating an existing client."""
    display_name: Optional[str] = Field(None, max_length=255)
    full_name: Optional[str] = Field(None, max_length=255)
    ima_signed_date: Optional[str] = Field(None, max_length=50)
    onedrive_folder_path: Optional[str] = Field(None, max_length=500)


class Client(ClientBase, TimestampedModel):
    """Complete client model with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    client_id: int = Field(..., description="Primary key")


# Contract models
class ContractBase(BaseModel):
    """Base contract information."""
    client_id: int = Field(..., description="Foreign key to clients table")
    contract_number: Optional[str] = Field(None, max_length=100, description="Contract identifier")
    provider_name: Optional[str] = Field(None, max_length=255, description="401(k) provider (e.g., 'John Hancock', 'Voya')")
    contract_start_date: Optional[str] = Field(None, max_length=50, description="When the contract began")
    fee_type: Optional[Literal['percentage', 'flat']] = Field(None, description="Type of fee structure")
    percent_rate: Optional[float] = Field(None, description="Rate for percentage-based fees (e.g., 0.0025 for 0.25%)")
    flat_rate: Optional[float] = Field(None, description="Dollar amount for flat fees")
    payment_schedule: Optional[Literal['monthly', 'quarterly']] = Field(None, description="Payment frequency")
    num_people: Optional[int] = Field(None, description="Participant count in the plan")
    notes: Optional[str] = Field(None, description="Additional contract notes")
    
    @field_validator('percent_rate')
    @classmethod
    def validate_percent_rate(cls, v: Optional[float]) -> Optional[float]:
        return validate_percentage(v)
    
    @field_validator('flat_rate')
    @classmethod
    def validate_flat_rate(cls, v: Optional[float]) -> Optional[float]:
        return validate_positive_amount(v)
    
    @field_validator('fee_type', 'percent_rate', 'flat_rate')
    @classmethod
    def validate_fee_consistency(cls, v, info):
        """Ensure fee structure is consistent."""
        data = info.data
        if 'fee_type' in data:
            if data['fee_type'] == 'percentage' and 'percent_rate' in data and data['percent_rate'] is None:
                raise ValueError('percent_rate is required for percentage fee type')
            elif data['fee_type'] == 'flat' and 'flat_rate' in data and data['flat_rate'] is None:
                raise ValueError('flat_rate is required for flat fee type')
        return v


class ContractCreate(ContractBase):
    """Model for creating a new contract."""
    pass


class ContractUpdate(BaseModel):
    """Model for updating an existing contract."""
    contract_number: Optional[str] = Field(None, max_length=100)
    provider_name: Optional[str] = Field(None, max_length=255)
    contract_start_date: Optional[str] = Field(None, max_length=50)
    fee_type: Optional[Literal['percentage', 'flat']] = None
    percent_rate: Optional[float] = None
    flat_rate: Optional[float] = None
    payment_schedule: Optional[Literal['monthly', 'quarterly']] = None
    num_people: Optional[int] = None
    notes: Optional[str] = None


class Contract(ContractBase, TimestampedModel):
    """Complete contract model with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    contract_id: int = Field(..., description="Primary key")


# Payment models
class PaymentBase(BaseModel):
    """Base payment information."""
    contract_id: int = Field(..., description="Foreign key to contracts table")
    client_id: int = Field(..., description="Foreign key to clients table")
    received_date: Optional[str] = Field(None, max_length=50, description="When payment was received")
    total_assets: Optional[float] = Field(None, description="Plan assets for the period")
    expected_fee: Optional[float] = Field(None, description="Calculated expected amount")
    actual_fee: Optional[float] = Field(None, description="Amount actually received")
    method: Optional[str] = Field(None, max_length=50, description="Payment method (e.g., 'Auto - ACH', 'Auto - Check')")
    notes: Optional[str] = Field(None, description="Payment notes")
    applied_period_type: Optional[Literal['monthly', 'quarterly']] = Field(None, max_length=10, description="Period type this payment applies to")
    applied_period: Optional[int] = Field(None, ge=1, le=12, description="Period number (1-12 for months, 1-4 for quarters)")
    applied_year: Optional[int] = Field(None, ge=2000, le=2100, description="Year the payment applies to")
    
    @field_validator('total_assets', 'expected_fee', 'actual_fee')
    @classmethod
    def validate_amounts(cls, v: Optional[float]) -> Optional[float]:
        return validate_positive_amount(v)
    
    @field_validator('applied_period')
    @classmethod
    def validate_period_range(cls, v: Optional[int], info) -> Optional[int]:
        """Ensure period is within valid range based on period type."""
        if v is not None and 'applied_period_type' in info.data:
            period_type = info.data['applied_period_type']
            if period_type == 'quarterly' and v > 4:
                raise ValueError('Quarterly period must be between 1 and 4')
        return v


class PaymentCreate(PaymentBase):
    """Model for creating a new payment."""
    pass


class PaymentUpdate(BaseModel):
    """Model for updating an existing payment."""
    received_date: Optional[str] = Field(None, max_length=50)
    total_assets: Optional[float] = None
    expected_fee: Optional[float] = None
    actual_fee: Optional[float] = None
    method: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    applied_period_type: Optional[Literal['monthly', 'quarterly']] = None
    applied_period: Optional[int] = Field(None, ge=1, le=12)
    applied_year: Optional[int] = Field(None, ge=2000, le=2100)


class Payment(PaymentBase, TimestampedModel):
    """Complete payment model with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    payment_id: int = Field(..., description="Primary key")


# Contact models
class ContactBase(BaseModel):
    """Base contact information."""
    client_id: int = Field(..., description="Foreign key to clients table")
    contact_type: str = Field(..., max_length=50, description="Type of contact (e.g., 'primary', 'provider')")
    contact_name: Optional[str] = Field(None, max_length=255, description="Name of the contact")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    email: Optional[str] = Field(None, max_length=255, description="Email address")
    fax: Optional[str] = Field(None, max_length=50, description="Fax number")
    physical_address: Optional[str] = Field(None, max_length=500, description="Physical/street address")
    mailing_address: Optional[str] = Field(None, max_length=500, description="Mailing address")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Basic email validation."""
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v


class ContactCreate(ContactBase):
    """Model for creating a new contact."""
    pass


class ContactUpdate(BaseModel):
    """Model for updating an existing contact."""
    contact_type: Optional[str] = Field(None, max_length=50)
    contact_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    fax: Optional[str] = Field(None, max_length=50)
    physical_address: Optional[str] = Field(None, max_length=500)
    mailing_address: Optional[str] = Field(None, max_length=500)


class Contact(ContactBase, TimestampedModel):
    """Complete contact model with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    contact_id: int = Field(..., description="Primary key")


# File models
class ClientFileBase(BaseModel):
    """Base client file information."""
    client_id: int = Field(..., description="Foreign key to clients table")
    file_name: str = Field(..., max_length=255, description="Name of the file")
    onedrive_path: str = Field(..., max_length=500, description="Path to file in OneDrive")


class ClientFileCreate(ClientFileBase):
    """Model for creating a new client file."""
    pass


class ClientFile(ClientFileBase):
    """Complete client file model with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    file_id: int = Field(..., description="Primary key")
    uploaded_at: datetime = Field(default_factory=datetime.now, description="When the file was uploaded")


# Payment file link models
class PaymentFileLink(BaseModel):
    """Model for linking payments to files."""
    model_config = ConfigDict(from_attributes=True)
    
    payment_id: int = Field(..., description="Foreign key to payments table")
    file_id: int = Field(..., description="Foreign key to client_files table")
    linked_at: datetime = Field(default_factory=datetime.now, description="When the link was created")


# Metrics models
class ClientMetrics(BaseModel):
    """Cached calculations for dashboard performance."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="Primary key")
    client_id: int = Field(..., description="Foreign key to clients table")
    last_payment_date: Optional[str] = Field(None, max_length=50, description="Date of most recent payment")
    last_payment_amount: Optional[float] = Field(None, description="Amount of most recent payment")
    last_payment_quarter: Optional[int] = Field(None, ge=1, le=4, description="Quarter of most recent payment")
    last_payment_year: Optional[int] = Field(None, ge=2000, le=2100, description="Year of most recent payment")
    total_ytd_payments: Optional[float] = Field(None, description="Total payments year-to-date")
    avg_quarterly_payment: Optional[float] = Field(None, description="Average quarterly payment amount")
    last_recorded_assets: Optional[float] = Field(None, description="Most recently recorded asset value")
    last_updated: Optional[str] = Field(None, max_length=50, description="When metrics were last updated")
    next_payment_due: Optional[str] = Field(None, max_length=50, description="Next expected payment date")


# Summary models
class QuarterlySummary(BaseModel):
    """Pre-aggregated quarterly data for reporting."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="Primary key")
    client_id: int = Field(..., description="Foreign key to clients table")
    year: int = Field(..., ge=2000, le=2100, description="Year of the summary")
    quarter: int = Field(..., ge=1, le=4, description="Quarter number (1-4)")
    total_payments: Optional[float] = Field(None, description="Total payments for the quarter")
    total_assets: Optional[float] = Field(None, description="Total assets for the quarter")
    payment_count: Optional[int] = Field(None, ge=0, description="Number of payments in the quarter")
    avg_payment: Optional[float] = Field(None, description="Average payment amount")
    expected_total: Optional[float] = Field(None, description="Expected total for the quarter")
    last_updated: Optional[str] = Field(None, max_length=50, description="When summary was last updated")


class YearlySummary(BaseModel):
    """Pre-aggregated yearly data for reporting."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="Primary key")
    client_id: int = Field(..., description="Foreign key to clients table")
    year: int = Field(..., ge=2000, le=2100, description="Year of the summary")
    total_payments: Optional[float] = Field(None, description="Total payments for the year")
    total_assets: Optional[float] = Field(None, description="Total assets for the year")
    payment_count: Optional[int] = Field(None, ge=0, description="Number of payments in the year")
    avg_payment: Optional[float] = Field(None, description="Average payment amount")
    yoy_growth: Optional[float] = Field(None, description="Year-over-year growth percentage")
    last_updated: Optional[str] = Field(None, max_length=50, description="When summary was last updated")


# Response models for API endpoints
class ClientWithContract(Client):
    """Client with associated contract information."""
    contract: Optional[Contract] = None


class PaymentWithFiles(Payment):
    """Payment with associated file information."""
    files: list[ClientFile] = Field(default_factory=list)


class ClientPaymentStatus(BaseModel):
    """Current payment status for a client."""
    model_config = ConfigDict(from_attributes=True)
    
    client: Client
    contract: Optional[Contract]
    last_payment: Optional[Payment]
    status: Literal['Due', 'Paid']
    missing_periods: list[dict] = Field(default_factory=list, description="List of missing payment periods")
    next_due_period: Optional[dict] = None