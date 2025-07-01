# 401(k) Payment Tracking System - Developer Reference

## Overview

The 401(k) Payment Tracking System is a Teams Tab application that tracks advisor fee payments for 401(k) plans. It replaces manual Excel-based tracking with a streamlined Azure SQL database and web interface, ensuring accurate record-keeping and compliance.

THIS IS A SMALL SCALE APP THAT WILL NOT HAVE CONCURRENT USERS  
A MICROAPP FOR A LOCAL SMALL FINANCIAL ADVISORY FIRM  
CLIENTS ARE COMPANIES WHO OFFER 401k PLANS TO THEIR EMPLOYEES  
PROVIDERS ARE THE CUSTODIANS WHO THE PLANS LIVE AT  
WE ARE THE ONES WHO MANAGE THE ACCOUNTS AND CHOOSE INVESTMENTS, ETC.

## Architecture

- **Platform**: Microsoft Teams Tab (Agent 365 Toolkit)
- **Database**: Azure SQL Database
- **api**: Python/Azure Functions
- **src**: React/Next.js with Tailwind CSS
- **Environment**: Cloud-hosted via Azure

**Use Azure Functions with HTTP triggers only. Pydantic models are used for validation.**  
**Do not implement document preview functionality. The viewer can be non-functional — skip all PDF rendering work.**

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

**All payments are in arrears** — fees are collected after the service period ends.

For a given date (e.g., March 13, 2025):
- **Monthly contracts**: Collecting for February 2025 (current month - 1)
- **Quarterly contracts**: Collecting for Q4 2024 (current quarter - 1)

### Expected Fee Calculation

Expected fees depend on the contract type:
- **Flat fee contracts**: Expected fee = contract's `flat_rate`
- **Percentage fee contracts**: Expected fee = `percent_rate × total_assets`
  - If current period assets are unavailable, fallback to most recent known assets
  - Show visual indicator when fallback occurs

### Payment Status Determination

- **Due**: No payment recorded for the current collection period
- **Paid**: Payment exists for the current collection period
- No overdue status — any unpaid period is simply "Due"

### Missing Payments Identification

Lists all unpaid periods between the last paid period and the current collection period.

Example: If current collection period is Q1 2025 and last payment was for Q2 2024:  
Missing = Q3 2024, Q4 2024, Q1 2025

### Date Formatting Conventions

- Displayed dates: "Month Day, Year" (e.g., "March 13, 2025")
- Currency: "$X,XXX.XX" format
- Database storage: ISO format (YYYY-MM-DD)

## Data Characteristics

- **Client Volume**: ~30-50 active clients
- **Payment Volume**: ~1,000 payments annually
- **Providers**: Primarily John Hancock, Voya, Empower, Principal, Ascensus
- **Payment Methods**: Mostly automated (ACH/Check), some manual
- **Asset Range**: $40K to $10M+ per plan

## Key Implementation Notes

1. **Period Tracking**: Payment records use a simplified three-field system: `applied_period_type`, `applied_period`, and `applied_year`. Each payment maps to exactly one period.
2. **Temporal Data**: Most tables include `valid_from` and `valid_to` fields for historical tracking. Only records with `valid_to IS NULL` are considered active.
3. **Triggers**: Database triggers automatically update quarterly and yearly summary tables when new payments are recorded.
4. **Real-time Updates**: The frontend is expected to update UI state instantly upon any data change — no manual refresh required.
5. **File Integration**: OneDrive folder paths are stored for clients, but the system only tracks metadata (file presence, names). Rendering or access is handled externally.

## Connection Details

The application connects to Azure SQL Database. Use standard Azure SQL connection strings with appropriate authentication.

_See `api/database/database_schema_dump.txt` for full schema._
