!!! CRITICAL UPDATE READ FIRST !!!
**What you're seeing (local SQLite):**
- Database at: `backend\data\401k_payments.db`
- Payments table has 8 fields for tracking periods:
  - `applied_start_month`, `applied_start_month_year`
  - `applied_end_month`, `applied_end_month_year`  
  - `applied_start_quarter`, `applied_start_quarter_year`
  - `applied_end_quarter`, `applied_end_quarter_year`

**What's changed (now in Azure SQL):**

1. **Location**: Database moved to Azure SQL Server (cloud-hosted, not local file)

2. **Schema simplified**: Payments table now has only 3 period fields:
   - `applied_period_type` - 'monthly' or 'quarterly'
   - `applied_period` - the period number (1-12 for months, 1-4 for quarters)
   - `applied_year` - the year

3. **No more split payments**: Each payment applies to exactly one period. The old schema allowed payments to span multiple periods (start/end), but this capability was removed for simplicity.

4. **Views updated**: `client_payment_status` view rewritten to use the new fields - simpler logic, no more checking both monthly and quarterly fields separately.

**The core concept**: Instead of tracking "this payment covers January through March", it's now just "this payment covers Q1". One payment = one period, determined by the contract's payment schedule.

**Connection changes**: Apps need to switch from SQLite connection to Azure SQL connection string. The data model is cleaner but requires this new simplified period tracking approach.


#### DATABASE CHEAT SHEET -- LEGACY ####

-- one stop shop for learning the database schemas, real samples of data, and whats currently implemented. 
--  Database Location (for production) = BASE_PATH = get_user_base_path()
OFFICE_DB_PATH = BASE_PATH / "HohimerPro" / "database" / "401k_payments.db"
-- Database Location (for development) = backend\data\401k_payments.db
-- see backend\core\config.py for more info 
==================================================
TABLES
==================================================

## Table: clients ##
Create Statement:
`sql
CREATE TABLE "clients" (
	"client_id"	INTEGER NOT NULL,
	"display_name"	TEXT NOT NULL,
	"full_name"	TEXT,
	"ima_signed_date"	TEXT,
	"onedrive_folder_path"	TEXT,
	"valid_from"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"valid_to"	DATETIME,
	PRIMARY KEY("client_id" AUTOINCREMENT)
)
`
Raw Data:
```
(1, AirSea America, THE TRUSTEES OF AIRSEA AMERICA INC 401K PLAN AND TRUST, 2020-07-31, None, 2025-03-14 04:04:16, None)
(2, Bumgardner Architects (ABC), THE BUMGARDNER ARCHITECTS A WASHINGTON CORPORATION PROFIT, 2020-08-02, None, 2025-03-14 04:04:16, None)
(3, Amplero, AMPLERO INC 401K, 2019-03-15, None, 2025-03-14 04:04:16, None)
(4, Auction Edge, AUCTION EDGE Inc 401k Profit Sharing Plan, 2019-03-07, None, 2025-03-14 04:04:16, None)
(5, BDR Interactive, BUSINESS DEVELOPMENT RESOURCES & OPPORTUNITIES INTERACTIVE, 2021-02-23, None, 2025-03-14 04:04:16, None)
...
(25, United Way, UWKC, None, None, 2025-03-14 04:04:16, None)
(26, Urban Renaissance, URBAN RENAISSANCE 401K AND TRUST, 2020-07-29, None, 2025-03-14 04:04:16, None)
(27, XFire, XFIRE INDUSTRIES INC 401K PLAN, None, None, 2025-03-14 04:04:16, None)
(28, Younker Motors, YOUNKER MOTORS, 2020-07-30, None, 2025-03-14 04:04:16, None)
(29, Youth Dynamics, YOUTH DYNAMICS, None, None, 2025-03-14 04:04:16, None)
```

## Table: contacts ##
Create Statement:
`sql
CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    contact_type TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    fax TEXT,
    physical_address TEXT,
    mailing_address TEXT,
    valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_to DATETIME,
    FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE
)
`
Raw Data:
```
(1, 1, Primary, Donald Jay, 253-395-9551, djay@asamerica.com, None, 3500 West Vally HWY, Ste B-106, Auburn, WA 98001, 3500 West Vally HWY, Ste B-106, Auburn, WA 98001, 2025-03-14 04:04:33, None)
(2, 2, Primary, Mark Simpson, 206-223-1361, marks@bumgardner.biz, None, 2111 Third Ave, Seattle, WA 98121, 2111 Third Ave, Seattle, WA 98121, 2025-03-14 04:04:33, None)
(3, 3, Primary, Doug Gelfand, 206-816-3700, dgelfand@amplero.com, None, 1218 3rd Ave #900, Seattle, WA 98101, None, 2025-03-14 04:04:33, None)
(4, 4, Primary, Robert Copeland, 206-858-4800, robertc@auctionedge.com, None, 1424 4th Ave Suite 920, Seattle, WA 98101, 1424 4th Ave Suite 920, Seattle, WA 98101, 2025-03-14 04:04:33, None)
(5, 5, Primary, Bruce Wiseman, 206-870-1880, brucewiseman@bdrco.com, None, 19604 International Blvd Ste 200, SeaTac, WA 98188, None, 2025-03-14 04:04:33, None)
...
(64, 21, Provider, Austin Del Prado, 800-333-0963, delprau@jhancock.com, None, 601 Congress St, Boston, MA 02210, None, 2025-03-14 04:04:33, None)
(65, 25, Provider, Jeff Harvey, 206-624-3790, None, None, 520 Pike Street Suite 1450 Seattle WA 98101, None, 2025-03-14 04:04:33, None)
(66, 26, Provider, Austin Del Prado, 800-333-0963, delprau@jhancock.com, None, 601 Congress St, Boston, MA 02210, None, 2025-03-14 04:04:33, None)
(67, 27, Provider, Brett Lundgren, 866-421-2137, Brett.Lundgren@capgroup.com, None, None, None, 2025-03-14 04:04:33, None)
(68, 29, Provider, Maria Viala-Wood, None, maria.vialawood@transamerica.com, None, None, None, 2025-03-14 04:04:33, None)
```
## Table: contracts ##
Create Statement:
`sql
CREATE TABLE "contracts" (
	"contract_id"	INTEGER NOT NULL,
	"client_id"	INTEGER NOT NULL,
	"contract_number"	TEXT,
	"provider_name"	TEXT,
	"contract_start_date"	TEXT,
	"fee_type"	TEXT,
	"percent_rate"	REAL,
	"flat_rate"	REAL,
	"payment_schedule"	TEXT,
	"num_people"	INTEGER,
	"notes"	TEXT,
	"valid_from"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"valid_to"	DATETIME,
	PRIMARY KEY("contract_id" AUTOINCREMENT),
	FOREIGN KEY("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE
)
`
Raw Data:
```
(1, 1, 134565, John Hancock, 2018-03-22, percentage, 0.00, None, monthly, 18, Phone: 800-333-0963 Option 1 with Contract # or Option 2, ext 154617
Fax: General Info 866-377-9577  Enrollment Forms 866-377-8846 
, 2025-03-14 04:04:26, None)
(2, 2, None, Voya, 2019-04-19, percentage, 0.00, None, monthly, 35, None, 2025-03-14 04:04:26, None)
(3, 3, 551296, Voya, None, flat, None, 666.66, monthly, None, None, 2025-03-14 04:04:26, None)
(5, 5, 231393, Ascensus Trust Company, 2019-05-2019, flat, None, 3000.00, quarterly, 93, None, 2025-03-14 04:04:26, None)
(6, 6, 29366, John Hancock, None, percentage, 0.00, None, monthly, 289, None, 2025-03-14 04:04:26, None)
...
(31, 4, None, John Hancock, None, percentage, 0.00, None, quarterly, 139, None, 2025-03-14 04:04:26, None)
(32, 7, None, Voya, None, percentage, 0.00, None, monthly, 15, None, 2025-03-14 04:04:26, None)
(33, 16, None, Empower, None, flat, None, 3500.00, quarterly, None, None, 2025-03-14 04:04:26, None)
(34, 28, None, Empower, None, percentage, 0.00, None, monthly, 43, None, 2025-03-14 04:04:26, None)
(35, 29, None, Principal, None, percentage, 0.00, None, quarterly, 15, None, 2025-03-14 04:04:26, None)
```

## Table: payments ##
Create Statement:
`sql
CREATE TABLE "payments" (
	"payment_id"	INTEGER NOT NULL,
	"contract_id"	INTEGER NOT NULL,
	"client_id"	INTEGER NOT NULL,
	"received_date"	TEXT,
	"total_assets"	INTEGER,
	"expected_fee"	REAL,
	"actual_fee"	REAL,
	"method"	TEXT,
	"notes"	TEXT,
	"valid_from"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"valid_to"	DATETIME,
	"applied_start_month"	INTEGER,
	"applied_start_month_year"	INTEGER,
	"applied_end_month"	INTEGER,
	"applied_end_month_year"	INTEGER,
	"applied_start_quarter"	INTEGER,
	"applied_start_quarter_year"	INTEGER,
	"applied_end_quarter"	INTEGER,
	"applied_end_quarter_year"	INTEGER,
	PRIMARY KEY("payment_id" AUTOINCREMENT),
	FOREIGN KEY("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE,
	FOREIGN KEY("contract_id") REFERENCES "contracts"("contract_id") ON DELETE CASCADE
)
`
Raw Data:
```
(1, 1, 1, 2019-05-03, 824305, 542.01, 547.51, Auto - Check, waiting on how John Hancock calculates fee payments, 2025-03-14 03:57:29, None, 4, 2019, 4, 2019, None, None, None, None)
(2, 1, 1, 2019-06-07, 805477, 547.28, 535.03, Auto - Check, None, 2025-03-14 03:57:29, None, 5, 2019, 5, 2019, None, None, None, None)
(3, 1, 1, 2019-07-05, 839288, 551.86, 557.54, Auto - Check, None, 2025-03-14 03:57:29, None, 6, 2019, 6, 2019, None, None, None, None)
(4, 1, 1, 2019-08-02, 842294, 572.30, 559.45, Auto - Check, None, 2025-03-14 03:57:29, None, 7, 2019, 7, 2019, None, None, None, None)
(5, 1, 1, 2019-09-06, 842118, 572.18, 559.37, Auto - Check, None, 2025-03-14 03:57:29, None, 8, 2019, 8, 2019, None, None, None, None)
...
(91, 2, 2, 2021-05-21, None, None, 1503.37, Auto - ACH, None, 2025-03-14 03:57:29, None, 4, 2021, 4, 2021, None, None, None, None)
(92, 2, 2, 2021-06-18, None, None, 1519.46, Auto - ACH, None, 2025-03-14 03:57:29, None, 5, 2021, 5, 2021, None, None, None, None)
(93, 2, 2, 2021-07-22, None, None, 1558.25, Auto - ACH, None, 2025-03-14 03:57:29, None, 6, 2021, 6, 2021, None, None, None, None)
(94, 2, 2, 2021-08-23, None, None, 1580.36, Auto - ACH, None, 2025-03-14 03:57:29, None, 7, 2021, 7, 2021, None, None, None, None)
(95, 2, 2, 2021-09-17, None, None, 1617.98, Auto - ACH, None, 2025-03-14 03:57:29, None, 8, 2021, 8, 2021, None, None, None, None)
...
...
(736, 23, 23, 2021-02-16, 1076744, 449.00, 447.55, None, test
, 2025-03-14 03:57:29, None, 1, 2021, 1, 2021, None, None, None, None)
(737, 23, 23, 2021-03-15, 1115961, 465.36, 463.82, None, None, 2025-03-14 03:57:29, None, 2, 2021, 2, 2021, None, None, None, None)
(738, 23, 23, 2021-04-12, 1154953, 481.62, 480.17, None, None, 2025-03-14 03:57:29, None, 3, 2021, 3, 2021, None, None, None, None)
(739, 23, 23, 2021-05-18, 1213106, 505.87, 504.28, None, None, 2025-03-14 03:57:29, None, 4, 2021, 4, 2021, None, None, None, None)
(740, 23, 23, 2021-06-14, 1243332, 518.47, 516.84, None, None, 2025-03-14 03:57:29, None, 5, 2021, 5, 2021, None, None, None, None)
...
(824, 27, 27, 2024-01-24, 43542, 108.86, 109.70, None, None, 2025-03-14 03:57:29, None, None, None, None, None, 4, 2023, 4, 2023)
(825, 27, 27, 2024-04-22, 46920, 117.30, 116.66, None, None, 2025-03-14 03:57:29, None, None, None, None, None, 1, 2024, 1, 2024)
(826, 27, 27, 2024-07-26, 49397, 123.49, 122.81, None, None, 2025-03-14 03:57:29, None, None, None, None, None, 2, 2024, 2, 2024)
(827, 27, 27, 2024-10-22, 56262, 140.66, 141.42, None, None, 2025-03-14 03:57:29, None, None, None, None, None, 3, 2024, 3, 2024)
(831, 34, 28, 2020-06-29, 876577, 584.68, 584.40, Auto - ACH, None, 2025-03-14 03:57:29, None, 5, 2020, 5, 2020, None, None, None, None)
```


## Table: client_metrics ##
Create Statement:
`sql
CREATE TABLE "client_metrics" (
	"id"	INTEGER NOT NULL,
	"client_id"	INTEGER NOT NULL,
	"last_payment_date"	TEXT,
	"last_payment_amount"	REAL,
	"last_payment_quarter"	INTEGER,
	"last_payment_year"	INTEGER,
	"total_ytd_payments"	REAL,
	"avg_quarterly_payment"	REAL,
	"last_recorded_assets"	REAL,
	"last_updated"	TEXT,
	"next_payment_due"	TEXT,
	UNIQUE("client_id"),
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE
)
`
Raw Data:
```
(1, 1, 2024-11-19, 909.06, 3, 2024, None, None, 1368616.00, 2025-03-11 21:29:23, 2025-06-01)
(2, 2, 2024-07-31, 1906.77, 2, 2024, None, None, None, 2025-03-11 21:29:23, 2025-06-01)
(3, 3, 2024-07-31, 666.66, 2, 2024, None, None, None, 2025-03-11 21:29:23, 2025-06-01)
(4, 4, 2024-10-23, 12150.62, 3, 2024, None, None, 9800000.00, 2025-03-11 21:29:23, 2025-06-01)
(5, 5, 2024-10-16, 3000.00, 3, 2024, None, None, None, 2025-03-11 21:29:23, 2025-06-01)
...
(25, 25, 2024-10-14, 5640.96, 3, 2024, None, None, None, 2025-03-11 21:29:23, 2025-06-01)
(26, 26, 2024-10-09, 6250.00, 3, 2024, None, None, None, 2025-03-11 21:29:23, 2025-06-01)
(27, 27, 2024-10-22, 141.42, 3, 2024, None, None, 56262.00, 2025-03-11 21:29:23, 2025-06-01)
(28, 28, 2024-11-20, 1420.06, 3, 2024, None, None, 2130101.00, 2025-03-11 21:29:23, 2025-06-01)
(29, 29, 2024-10-14, 1043.09, 3, 2024, None, None, None, 2025-03-11 21:29:23, 2025-06-01)
```

## Table: client_files ##
Create Statement:
`sql
CREATE TABLE "client_files" (
    "file_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "onedrive_path" TEXT NOT NULL,
    "uploaded_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("file_id" AUTOINCREMENT),
    FOREIGN KEY("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE
)
`
Raw Data:
```
(63, 6, John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, Bellmont Cabinets\Consulting Fee\2025\John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, 2025-02-24)
(64, 1, John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, Air Sea America\Consulting Fee\2025\John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, 2025-02-24)
(65, 23, John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, Three Sigma\Consulting Fee\2025\John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, 2025-02-24)
(66, 11, John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, Floform Countertops\Consulting Fee\2025\John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, 2025-02-24)
(67, 21, John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, Mobile Focused Media\Consulting Fee\2025\John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, 2025-02-24)
...
(90, 26, Fee Addendum 24277 5-42-07 PM.pdf, Marten Law Group\Account Documentation\Plan Documents\Fee Addendum 24277 5-42-07 PM.pdf, 2025-02-25)
(91, 10, Empower - 401K Advisor Fee -Fast Water & Younker 11.20.24.pdf, Fast Water Heater\Consulting Fee\Empower - 401K Advisor Fee -Fast Water & Younker 11.20.24.pdf, 2024-11-20)
(92, 28, Empower - 401K Advisor Fee -Fast Water & Younker 11.20.24.pdf, Younker Motors\Consulting Fee\Empower - 401K Advisor Fee -Fast Water & Younker 11.20.24.pdf, 2024-11-20)
(93, 19, Ascensus - 401k Advisor Fee-Q4-24- Opportunity Interactive - rcvd 1.22.25.pdf, Opportunity Interactive\Consulting Fee\Ascensus - 401k Advisor Fee-Q4-24- Opportunity Interactive - rcvd 1.22.25.pdf, 2025-01-22)
(94, 27, Capital Grp -Advisor Fee xFire chk rcvd 2.3.25.pdf, XFire Industries\Consulting Fee\Capital Grp -Advisor Fee xFire chk rcvd 2.3.25.pdf, 2025-02-03)
```
## Table: payment_files ##
Create Statement:
`sql
CREATE TABLE "payment_files" (
    "payment_id" INTEGER NOT NULL,
    "file_id" INTEGER NOT NULL,
    "linked_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("payment_id", "file_id"),
    FOREIGN KEY("payment_id") REFERENCES "payments"("payment_id") ON DELETE CASCADE,
    FOREIGN KEY("file_id") REFERENCES "client_files"("file_id") ON DELETE CASCADE
)
`
Raw Data:
```
(1054, 64, 2025-03-11 04:28:02)
(1055, 69, 2025-03-11 04:28:02)
(1056, 74, 2025-03-11 04:28:02)
(1057, 79, 2025-03-11 04:28:02)
(1058, 85, 2025-03-11 04:28:02)
...
(1077, 75, 2025-03-11 04:28:02)
(1078, 80, 2025-03-11 04:28:02)
(1080, 94, 2025-03-11 04:28:02)
(1081, 84, 2025-03-11 04:28:02)
(1082, 92, 2025-03-11 04:28:02)
```


## Table: quarterly_summaries ##
Create Statement:
`sql
CREATE TABLE quarterly_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    total_payments REAL,
    total_assets REAL,
    payment_count INTEGER,
    avg_payment REAL,
    expected_total REAL,
    last_updated TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    UNIQUE(client_id, year, quarter)
)
`
Raw Data:
```
(1, 1, 2019, 1, 535.03, 805477.00, 1, 535.03, 547.28, 2025-02-27 08:45:17)
(2, 1, 2020, 1, 2935.05, 894015.33, 5, 587.01, 610.73, 2025-02-27 08:45:17)
(3, 1, 2021, 1, 2139.50, 1073683.67, 3, 713.17, 736.29, 2025-02-27 08:45:17)
(4, 1, 2022, 1, 2413.40, 1211118.33, 3, 804.47, 818.97, 2025-02-27 08:45:17)
(5, 1, 2023, 1, 2309.67, 1159080.33, 3, 769.89, 0.00, 2025-02-27 08:45:17)
...
...
(393, 23, 2021, 1, 1391.54, 1115886.00, 3, 463.85, None, 2025-02-27 08:45:17)
(394, 23, 2022, 1, 1671.50, 1340300.67, 3, 557.17, None, 2025-02-27 08:45:17)
(395, 23, 2023, 1, 1731.18, 1388137.67, 3, 577.06, None, 2025-02-27 08:45:17)
(396, 23, 2024, 1, 2214.23, 1670062.00, 3, 738.08, None, 2025-02-27 08:45:17)
(397, 23, 2021, 2, 1550.90, 1243643.33, 3, 516.97, None, 2025-02-27 08:45:17)
...
(442, 27, 2024, 2, 122.81, 49397.00, 1, 122.81, None, 2025-02-27 08:45:17)
(443, 27, 2023, 3, 104.49, 41457.00, 1, 104.49, None, 2025-02-27 08:45:17)
(444, 27, 2024, 3, 141.42, 56262.00, 1, 141.42, None, 2025-02-27 08:45:17)
(445, 27, 2022, 4, 22.62, 8971.00, 1, 22.62, None, 2025-02-27 08:45:17)
(446, 27, 2023, 4, 109.70, 43542.00, 1, 109.70, None, 2025-02-27 08:45:17)
```
## Table: yearly_summaries ##
Create Statement:
`sql
CREATE TABLE yearly_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_payments REAL,
    total_assets REAL,
    payment_count INTEGER,
    avg_payment REAL,
    yoy_growth REAL,
    last_updated TEXT,
    FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    UNIQUE(client_id, year)
)
`
Raw Data:
```
(1, 1, 2019, 5051.95, 835160.94, 9, 554.74, None, 2025-02-27 08:45:17)
(2, 1, 2020, 8045.57, 940306.04, 13, 622.88, None, 2025-02-27 08:45:17)
(3, 1, 2021, 9255.88, 1161233.92, 12, 771.32, None, 2025-02-27 08:45:17)
(4, 1, 2022, 8985.65, 1131710.71, 12, 748.80, None, 2025-02-27 08:45:17)
(5, 1, 2023, 9434.78, 1183683.42, 12, 786.23, None, 2025-02-27 08:45:17)
...
(15, 3, 2021, 7999.92, None, 12, 666.66, None, 2025-02-27 08:45:17)
(16, 3, 2022, 7999.92, None, 12, 666.66, None, 2025-02-27 08:45:17)
(17, 3, 2023, 7999.92, None, 12, 666.66, None, 2025-02-27 08:45:17)
(18, 3, 2024, 3999.96, None, 6, 666.66, None, 2025-02-27 08:45:17)
(19, 4, 2019, 10038.83, 2912978.00, 3, 3346.28, None, 2025-02-27 08:45:17)
...
...
(118, 23, 2024, 7907.97, 1703680.31, 10, 785.19, None, 2025-02-27 08:45:17)
(119, 24, 2023, 3050.53, None, 3, 1016.84, None, 2025-02-27 08:45:17)
(120, 24, 2024, 4634.56, None, 3, 1544.85, None, 2025-02-27 08:45:17)
(121, 25, 2023, 21104.16, None, 4, 5276.04, None, 2025-02-27 08:45:17)
(122, 25, 2024, 16706.43, None, 3, 5568.81, None, 2025-02-27 08:45:17)
...
(134, 28, 2021, 18170.45, 2271294.25, 12, 1514.20, None, 2025-02-27 08:45:17)
(135, 28, 2022, 16387.71, 2048706.25, 12, 1365.64, None, 2025-02-27 08:45:17)
(136, 28, 2023, 16312.06, 2038999.42, 12, 1359.34, None, 2025-02-27 08:45:17)
(137, 28, 2024, 13392.76, 1967926.83, 10, 1334.18, None, 2025-02-27 08:45:17)
(138, 29, 2020, 44.25, None, 5, 8.85, None, 2025-02-27 08:45:17)
```

==================================================
VIEWS
==================================================
## View: payment_file_view ##
Create Statement:
`sql
CREATE VIEW payment_file_view AS
SELECT 
    p.payment_id,
    p.client_id,
    p.contract_id,
    p.received_date,
    p.actual_fee,
    CASE WHEN cf.file_id IS NOT NULL THEN 1 ELSE 0 END AS has_file,
    cf.file_id,
    cf.file_name,
    cf.onedrive_path
FROM 
    payments p
LEFT JOIN 
    payment_files pf ON p.payment_id = pf.payment_id
LEFT JOIN 
    client_files cf ON pf.file_id = cf.file_id
`
Raw Data:
```
(1, 1, 1, 2019-05-03, 547.51, 0, None, None, None)
(2, 1, 1, 2019-06-07, 535.03, 0, None, None, None)
(3, 1, 1, 2019-07-05, 557.54, 0, None, None, None)
(4, 1, 1, 2019-08-02, 559.45, 0, None, None, None)
(5, 1, 1, 2019-09-06, 559.37, 0, None, None, None)
(6, 1, 1, 2019-10-04, 564.44, 0, None, None, None)
(7, 1, 1, 2019-10-31, 573.23, 0, None, None, None)
(8, 1, 1, 2019-11-12, 573.23, 0, None, None, None)
(9, 1, 1, 2019-12-16, 582.15, 0, None, None, None)
(10, 1, 1, 2020-01-13, 609.54, 0, None, None, None)
...
(1068, 11, 11, 2024-12-06, 2045.32, 1, 76, John Hancock - Air Sea, Bellmont, 3sigma, FloForm, MFM chk rcvd 12.20.24.pdf, Floform Countertops\Consulting Fee\2024\John Hancock - Air Sea, Bellmont, 3sigma, FloForm, MFM chk rcvd 12.20.24.pdf)
(1069, 11, 11, 2024-11-01, 2021.47, 1, 81, John Hancock - 401K Advisor Fee Bellmont,AirSea,3Sigma,FF MFM 11.19.24.pdf, Floform Countertops\Consulting Fee\2024\John Hancock - 401K Advisor Fee Bellmont,AirSea,3Sigma,FF MFM 11.19.24.pdf)
(1070, 19, 19, 2025-01-14, 2000.00, 1, 93, Ascensus - 401k Advisor Fee-Q4-24- Opportunity Interactive - rcvd 1.22.25.pdf, Opportunity Interactive\Consulting Fee\Ascensus - 401k Advisor Fee-Q4-24- Opportunity Interactive - rcvd 1.22.25.pdf)
(1071, 21, 21, 2025-02-07, 504.31, 1, 67, John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, Mobile Focused Media\Consulting Fee\2025\John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf)
(1072, 21, 21, 2025-01-03, 492.25, 1, 72, John Hancock-401K Advisor Fee Bellmont,AirSea,3Sig,FF, MFM 1.16.25.pdf, Mobile Focused Media\Consulting Fee\2025\John Hancock-401K Advisor Fee Bellmont,AirSea,3Sig,FF, MFM 1.16.25.pdf)
(1073, 21, 21, 2024-12-06, 499.81, 1, 77, John Hancock - Air Sea, Bellmont, 3sigma, FloForm, MFM chk rcvd 12.20.24.pdf, Mobile Focused Media\Consulting Fee\2024\John Hancock - Air Sea, Bellmont, 3sigma, FloForm, MFM chk rcvd 12.20.24.pdf)
(1074, 21, 21, 2024-11-01, 481.82, 1, 82, John Hancock - 401K Advisor Fee Bellmont,AirSea,3Sigma,FF MFM 11.19.24.pdf, Mobile Focused Media\Consulting Fee\2024\John Hancock - 401K Advisor Fee Bellmont,AirSea,3Sigma,FF MFM 11.19.24.pdf)
(1075, 23, 23, 2025-02-07, 887.95, 1, 65, John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf, Three Sigma\Consulting Fee\2025\John Hancock - 401K Adivsor Fee Bellmont AirSea Benevon MFM, FlorForm, 3 Sigma 2.24.25.pdf)
(1076, 23, 23, 2025-01-03, 858.40, 1, 70, John Hancock-401K Advisor Fee Bellmont,AirSea,3Sig,FF, MFM 1.16.25.pdf, Three Sigma\Consulting Fee\2025\John Hancock-401K Advisor Fee Bellmont,AirSea,3Sig,FF, MFM 1.16.25.pdf)
(1077, 23, 23, 2024-12-06, 876.19, 1, 75, John Hancock - Air Sea, Bellmont, 3sigma, FloForm, MFM chk rcvd 12.20.24.pdf, Three Sigma\Consulting Fee\2024\John Hancock - Air Sea, Bellmont, 3sigma, FloForm, MFM chk rcvd 12.20.24.pdf)
(1078, 23, 23, 2024-11-01, 844.20, 1, 80, John Hancock - 401K Advisor Fee Bellmont,AirSea,3Sigma,FF MFM 11.19.24.pdf, Three Sigma\Consulting Fee\2024\John Hancock - 401K Advisor Fee Bellmont,AirSea,3Sigma,FF MFM 11.19.24.pdf)
(1079, 26, 26, 2025-01-02, 6250.00, 0, None, None, None)
(1080, 27, 27, 2025-01-13, 155.10, 1, 94, Capital Grp -Advisor Fee xFire chk rcvd 2.3.25.pdf, XFire Industries\Consulting Fee\Capital Grp -Advisor Fee xFire chk rcvd 2.3.25.pdf)
(1081, 28, 34, 2025-01-15, 1339.69, 1, 84, Empower - 401k Advisor FEe - Faster Water and Younker - chk rcvd 1.22.25.pdf, Younker Motors\Consulting Fee\Empower - 401k Advisor FEe - Faster Water and Younker - chk rcvd 1.22.25.pdf)
(1082, 28, 34, 2024-12-17, 1339.97, 1, 92, Empower - 401K Advisor Fee -Fast Water & Younker 11.20.24.pdf, Younker Motors\Consulting Fee\Empower - 401K Advisor Fee -Fast Water & Younker 11.20.24.pdf)
```
## View: client_payment_status ##
Create Statement:
`sql
CREATE VIEW client_payment_status AS
SELECT
    c.client_id,
    c.display_name,
    ct.payment_schedule,
    p.applied_end_month,
    p.applied_end_month_year,
    p.applied_end_quarter,
    p.applied_end_quarter_year
FROM clients c
JOIN contracts ct ON c.client_id = ct.client_id
LEFT JOIN (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY received_date DESC) as rn
    FROM payments
    WHERE valid_to IS NULL
) p ON c.client_id = p.client_id AND p.rn = 1
WHERE ct.valid_to IS NULL AND c.valid_to IS NULL
`
Raw Data:
```
(1, AirSea America, monthly, 1, 2025, None, None)
(2, Bumgardner Architects (ABC), monthly, 6, 2024, None, None)
(3, Amplero, monthly, 6, 2024, None, None)
(5, BDR Interactive, quarterly, None, None, 4, 2024)
(6, Bellmont Cabinets, monthly, 1, 2025, None, None)
...
(4, Auction Edge, quarterly, None, None, 3, 2024)
(7, Corina Bakery, monthly, 6, 2024, None, None)
(16, Lynnwood Honda, quarterly, None, None, 3, 2024)
(28, Younker Motors, monthly, 12, 2024, None, None)
(29, Youth Dynamics, quarterly, None, None, 3, 2024)
```
==================================================
TRIGGERS
==================================================
## Trigger: update_yearly_after_quarterly ##
Create Statement:
`sql
CREATE TRIGGER update_yearly_after_quarterly
    AFTER INSERT ON quarterly_summaries
    BEGIN
        INSERT OR REPLACE INTO yearly_summaries 
        (client_id, year, total_payments, total_assets, payment_count, avg_payment, yoy_growth, last_updated)
        SELECT 
            client_id, 
            year, 
            SUM(total_payments), 
            AVG(total_assets), 
            SUM(payment_count), 
            AVG(avg_payment),
            NULL,
            datetime('now')
        FROM quarterly_summaries 
        WHERE client_id = NEW.client_id 
            AND year = NEW.year
        GROUP BY client_id, year;
    END
`

## Trigger: update_quarterly_after_payment ##
Create Statement:
`sql
CREATE TRIGGER update_quarterly_after_payment
AFTER INSERT ON payments
BEGIN
    INSERT OR REPLACE INTO quarterly_summaries 
    (client_id, year, quarter, total_payments, total_assets, payment_count, avg_payment, expected_total, last_updated)
    SELECT 
        client_id, 
        applied_start_quarter_year, 
        applied_start_quarter, 
        SUM(actual_fee), 
        AVG(total_assets), 
        COUNT(*), 
        AVG(actual_fee), 
        MAX(expected_fee), 
        datetime('now')
    FROM payments 
    WHERE client_id = NEW.client_id 
      AND applied_start_quarter_year = NEW.applied_start_quarter_year 
      AND applied_start_quarter = NEW.applied_start_quarter
    GROUP BY client_id, applied_start_quarter_year, applied_start_quarter;
END
`

==================================================
INDEXES
==================================================
## Index: idx_quarterly_lookup ##
Create Statement:
`sql
CREATE INDEX idx_quarterly_lookup ON quarterly_summaries(client_id, year, quarter)
`
## Index: idx_yearly_lookup ##
Create Statement:
`sql
CREATE INDEX idx_yearly_lookup ON yearly_summaries(client_id, year)
`
## Index: idx_contacts_client_id ##
Create Statement:
`sql
CREATE INDEX idx_contacts_client_id ON contacts(client_id)
`
## Index: idx_contacts_type ##
Create Statement:
`sql
CREATE INDEX idx_contacts_type ON contacts(client_id, contact_type)
`
## Index: idx_contracts_client_id ##
Create Statement:
`sql
CREATE INDEX idx_contracts_client_id ON contracts(client_id)
`
## Index: idx_contracts_provider ##
Create Statement:
`sql
CREATE INDEX idx_contracts_provider ON contracts(provider_name)
`
## Index: idx_payments_client_id ##
Create Statement:
`sql
CREATE INDEX idx_payments_client_id ON payments(client_id)
`
## Index: idx_payments_contract_id ##
Create Statement:
`sql
CREATE INDEX idx_payments_contract_id ON payments(contract_id)
`
## Index: idx_payments_date ##
Create Statement:
`sql
CREATE INDEX idx_payments_date ON payments(client_id, received_date DESC)
`
## Index: idx_payments_applied_months ##
Create Statement:
`sql
CREATE INDEX idx_payments_applied_months ON payments (
    client_id,
    applied_start_month_year,
    applied_start_month,
    applied_end_month_year,
    applied_end_month
)
`
## Index: idx_client_metrics_lookup ##
Create Statement:
`sql
CREATE INDEX idx_client_metrics_lookup ON client_metrics(client_id)
`