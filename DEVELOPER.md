PROJECT CONTEXT:


# 401(k) Payment Tracking System - Developer Reference

## Overview

The 401(k) Payment Tracking System is a Teams Tab application that tracks advisor fee payments for 401(k) plans. It replaces manual Excel-based tracking with a streamlined Azure SQL database and web interface, ensuring accurate record-keeping and compliance.

THIS IS A SMALL SCALE APP THAT WILL NOT HAVE CONCURRENT USERS 
A MICROAPP FOR A LOCAL SMALL FINANCIAL ADVISORY FIRM
CLIENTS ARE COMPANIES WHO OFFER 401k PLANS TO THEIR EMPLOYEES 
PROVIDERS ARE THE CUTODIANS WHO THE PLANS LIVE AT
WE ARE THE ONES WHO MANAGE THE ACCOUNTS AND CHOOSE INVESTMENTS, ETC.

## Architecture

- **Platform**: Microsoft Teams Tab (Agent 365 Toolkit)
- **Database**: Azure SQL Database
- **Backend**: Python/FastAPI
- **Frontend**: React/Next.js with Tailwind CSS
- **Environment**: Cloud-hosted via Azure

## Database Schema

### Core Tables

#### clients
Stores client information and plan details.
- `client_id` - Primary key
- `display_name` - Short name for UI display (e.g., "AirSea America")
- `full_name` - Legal plan name (e.g., "THE TRUSTEES OF AIRSEA AMERICA INC 401K PLAN AND TRUST")
- `ima_signed_date` - Investment Management Agreement date
- `onedrive_folder_path` - Path to client's document folder
- `valid_from`, `valid_to` - Temporal validity tracking

#### contracts
Defines fee agreements between the firm and clients.
- `contract_id` - Primary key
- `client_id` - Foreign key to clients
- `provider_name` - 401(k) provider (e.g., "John Hancock", "Voya")
- `fee_type` - Either "percentage" or "flat"
- `percent_rate` - Rate for percentage-based fees (stored as decimal, e.g., 0.0025 for 0.25%)
- `flat_rate` - Dollar amount for flat fees
- `payment_schedule` - Either "monthly" or "quarterly"
- `num_people` - Participant count in the plan

#### payments
Records actual fee payments received. Each payment applies to exactly one period.
- `payment_id` - Primary key
- `contract_id`, `client_id` - Foreign keys
- `received_date` - When payment was received
- `total_assets` - Plan assets for the period (used for percentage fee calculations)
- `expected_fee` - Calculated expected amount
- `actual_fee` - Amount actually received
- `method` - Payment method (e.g., "Auto - ACH", "Auto - Check")
- **Period Tracking Fields**:
  - `applied_period_type` - Either "monthly" or "quarterly"
  - `applied_period` - Period number (1-12 for months, 1-4 for quarters)
  - `applied_year` - Year the payment applies to

#### Supporting Tables
- `contacts` - Primary and provider contacts for each client
- `client_files` - Tracks uploaded documents (checks, statements)
- `payment_files` - Links payments to their supporting documents
- `client_metrics` - Cached calculations for dashboard performance
- `quarterly_summaries`, `yearly_summaries` - Pre-aggregated data for reporting

### Views

#### client_payment_status
Provides current payment status for each client by joining clients, contracts, and their most recent payment. Used to determine which periods are paid/unpaid.

#### payment_file_view
Joins payments with their linked files for easy document access.

## Business Logic

### Payment Periods

**All payments are in arrears** - fees are collected after the service period ends.

For a given date (e.g., March 13, 2025):
- **Monthly contracts**: Collecting for February 2025 (current month - 1)
- **Quarterly contracts**: Collecting for Q4 2024 (current quarter - 1)

### Expected Fee Calculation

Expected fees depend on the contract type:
- **Flat fee contracts**: Expected fee = contract's flat_rate
- **Percentage fee contracts**: Expected fee = contract's percent_rate × payment's total_assets
  - If current period assets unavailable, use most recent historical assets
  - Display indicator when using historical assets

### Payment Status Determination

- **Due**: No payment recorded for the current collection period
- **Paid**: Payment exists for the current collection period
- No "overdue" status - all unpaid periods are simply "Due"

### Missing Payments Identification

Lists all unpaid periods between the last paid period and current collection period.

Example: If current collection period is Q1 2025 and last payment was for Q2 2024:
- Missing: Q3 2024, Q4 2024, Q1 2025

### Date Formatting Conventions
- Display dates: "Month Day, Year" (e.g., "March 13, 2025")
- Currency: "$X,XXX.XX" format
- Database dates: ISO format (YYYY-MM-DD)

## Data Characteristics

- **Client Volume**: ~30-50 active clients
- **Payment Volume**: ~1,000 payments annually
- **Providers**: Primarily John Hancock, Voya, Empower, Principal, Ascensus
- **Payment Methods**: Mostly automated (ACH/Check), some manual
- **Asset Range**: $40K to $10M+ per plan

## Key Implementation Notes

1. **Period Tracking**: The simplified three-field approach (type/period/year) replaced a complex eight-field system that allowed split payments. Each payment now maps to exactly one period.

2. **Temporal Data**: Most tables include `valid_from` and `valid_to` fields for historical tracking, though currently only active records (valid_to IS NULL) are used.

3. **Triggers**: Database triggers automatically update quarterly and yearly summaries when payments are inserted.

4. **Real-time Updates**: UI should refresh immediately when data changes - no manual refresh required.

5. **File Integration**: OneDrive paths are stored but file access is handled separately. The system tracks metadata only.

## Connection Details

The application connects to Azure SQL Database. Connection configuration should use standard Azure SQL connection strings with appropriate authentication.



======== FULL SCHEMA ========

=== TABLES ===


--- client_files ---
  - file_id: int(10) [PRIMARY KEY, NOT NULL]
  - client_id: int(10) [FK -> clients.client_id, NOT NULL]
  - file_name: nvarchar(255) [NOT NULL]
  - onedrive_path: nvarchar(500) [NOT NULL]
  - uploaded_at: datetime [DEFAULT (getdate())]

--- client_metrics ---
  - id: int(10) [PRIMARY KEY, NOT NULL]
  - client_id: int(10) [FK -> clients.client_id, NOT NULL]
  - last_payment_date: nvarchar(50)
  - last_payment_amount: float(53)
  - last_payment_quarter: int(10)
  - last_payment_year: int(10)
  - total_ytd_payments: float(53)
  - avg_quarterly_payment: float(53)
  - last_recorded_assets: float(53)
  - last_updated: nvarchar(50)
  - next_payment_due: nvarchar(50)

--- clients ---
  - client_id: int(10) [PRIMARY KEY, NOT NULL]
  - display_name: nvarchar(255) [NOT NULL]
  - full_name: nvarchar(255)
  - ima_signed_date: nvarchar(50)
  - onedrive_folder_path: nvarchar(500)
  - valid_from: datetime [DEFAULT (getdate())]
  - valid_to: datetime

--- contacts ---
  - contact_id: int(10) [PRIMARY KEY, NOT NULL]
  - client_id: int(10) [FK -> clients.client_id, NOT NULL]
  - contact_type: nvarchar(50) [NOT NULL]
  - contact_name: nvarchar(255)
  - phone: nvarchar(50)
  - email: nvarchar(255)
  - fax: nvarchar(50)
  - physical_address: nvarchar(500)
  - mailing_address: nvarchar(500)
  - valid_from: datetime [DEFAULT (getdate())]
  - valid_to: datetime

--- contracts ---
  - contract_id: int(10) [PRIMARY KEY, NOT NULL]
  - client_id: int(10) [FK -> clients.client_id, NOT NULL]
  - contract_number: nvarchar(100)
  - provider_name: nvarchar(255)
  - contract_start_date: nvarchar(50)
  - fee_type: nvarchar(50)
  - percent_rate: float(53)
  - flat_rate: float(53)
  - payment_schedule: nvarchar(50)
  - num_people: int(10)
  - notes: nvarchar(-1)
  - valid_from: datetime [DEFAULT (getdate())]
  - valid_to: datetime

--- payment_files ---
  - payment_id: int(10) [PRIMARY KEY, FK -> payments.payment_id, NOT NULL]
  - file_id: int(10) [PRIMARY KEY, FK -> client_files.file_id, NOT NULL]
  - linked_at: datetime [DEFAULT (getdate())]

--- payments ---
  - payment_id: int(10) [PRIMARY KEY, NOT NULL]
  - contract_id: int(10) [FK -> contracts.contract_id, NOT NULL]
  - client_id: int(10) [FK -> clients.client_id, NOT NULL]
  - received_date: nvarchar(50)
  - total_assets: float(53)
  - expected_fee: float(53)
  - actual_fee: float(53)
  - method: nvarchar(50)
  - notes: nvarchar(-1)
  - valid_from: datetime [DEFAULT (getdate())]
  - valid_to: datetime
  - applied_period_type: nvarchar(10)
  - applied_period: int(10)
  - applied_year: int(10)

--- quarterly_summaries ---
  - id: int(10) [PRIMARY KEY, NOT NULL]
  - client_id: int(10) [FK -> clients.client_id, NOT NULL]
  - year: int(10) [NOT NULL]
  - quarter: int(10) [NOT NULL]
  - total_payments: float(53)
  - total_assets: float(53)
  - payment_count: int(10)
  - avg_payment: float(53)
  - expected_total: float(53)
  - last_updated: nvarchar(50)

--- yearly_summaries ---
  - id: int(10) [PRIMARY KEY, NOT NULL]
  - client_id: int(10) [FK -> clients.client_id, NOT NULL]
  - year: int(10) [NOT NULL]
  - total_payments: float(53)
  - total_assets: float(53)
  - payment_count: int(10)
  - avg_payment: float(53)
  - yoy_growth: float(53)
  - last_updated: nvarchar(50)

=== INDEXES ===

- client_metrics: idx_client_metrics_lookup (NONCLUSTERED)
- contacts: idx_contacts_client_id (NONCLUSTERED)
- contacts: idx_contacts_type (NONCLUSTERED)
- contracts: idx_contracts_client_id (NONCLUSTERED)
- contracts: idx_contracts_provider (NONCLUSTERED)
- payments: idx_payments_client_id (NONCLUSTERED)
- payments: idx_payments_contract_id (NONCLUSTERED)
- payments: idx_payments_date (NONCLUSTERED)
- quarterly_summaries: idx_quarterly_lookup (NONCLUSTERED)
- yearly_summaries: idx_yearly_lookup (NONCLUSTERED)

=== TRIGGERS ===

- payments: update_quarterly_after_payment
- quarterly_summaries: update_yearly_after_quarterly

=== VIEWS ===

- client_payment_status
- database_firewall_rules
- payment_file_view