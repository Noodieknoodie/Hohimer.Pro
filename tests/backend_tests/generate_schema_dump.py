import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'backend'))
from database import db

def fetch_schema():
    conn = db.get_connection()
    cursor = conn.cursor()

    output = []

    # Tables with full schema
    output.append("=== TABLES ===\n")
    cursor.execute("""
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    """)
    tables = cursor.fetchall()
    
    for (table,) in tables:
        output.append(f"\n--- {table} ---")
        
        # Get column details
        cursor.execute("""
            SELECT 
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.CHARACTER_MAXIMUM_LENGTH,
                c.NUMERIC_PRECISION,
                c.NUMERIC_SCALE,
                c.IS_NULLABLE,
                c.COLUMN_DEFAULT,
                CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PK' ELSE '' END as IS_PK,
                CASE WHEN fk.COLUMN_NAME IS NOT NULL THEN 'FK -> ' + fk.REFERENCED_TABLE_NAME + '.' + fk.REFERENCED_COLUMN_NAME ELSE '' END as FK_INFO
            FROM INFORMATION_SCHEMA.COLUMNS c
            LEFT JOIN (
                SELECT ku.TABLE_NAME, ku.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku 
                    ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
            LEFT JOIN (
                SELECT 
                    ku.TABLE_NAME,
                    ku.COLUMN_NAME,
                    ccu.TABLE_NAME AS REFERENCED_TABLE_NAME,
                    ccu.COLUMN_NAME AS REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku 
                    ON rc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
                    ON rc.UNIQUE_CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
            ) fk ON c.TABLE_NAME = fk.TABLE_NAME AND c.COLUMN_NAME = fk.COLUMN_NAME
            WHERE c.TABLE_NAME = ?
            ORDER BY c.ORDINAL_POSITION
        """, (table,))
        
        columns = cursor.fetchall()
        for col in columns:
            col_name, data_type, char_len, num_prec, num_scale, nullable, default, is_pk, fk_info = col
            
            # Build column definition
            col_def = f"  - {col_name}: {data_type}"
            
            # Add length/precision info
            if char_len:
                col_def += f"({char_len})"
            elif num_prec:
                if num_scale:
                    col_def += f"({num_prec},{num_scale})"
                else:
                    col_def += f"({num_prec})"
            
            # Add constraints
            constraints = []
            if is_pk:
                constraints.append("PRIMARY KEY")
            if fk_info:
                constraints.append(fk_info)
            if nullable == 'NO':
                constraints.append("NOT NULL")
            if default:
                constraints.append(f"DEFAULT {default}")
            
            if constraints:
                col_def += f" [{', '.join(constraints)}]"
            
            output.append(col_def)

    # Indexes
    output.append("\n=== INDEXES ===\n")
    cursor.execute("""
        SELECT t.name AS table_name,
               ind.name AS index_name,
               ind.type_desc AS index_type
        FROM sys.indexes ind
        INNER JOIN sys.tables t ON ind.object_id = t.object_id
        WHERE ind.is_primary_key = 0 AND ind.is_unique_constraint = 0 AND ind.name IS NOT NULL
        ORDER BY t.name, ind.name
    """)
    for table_name, index_name, index_type in cursor.fetchall():
        output.append(f"- {table_name}: {index_name} ({index_type})")

    # Triggers
    output.append("\n=== TRIGGERS ===\n")
    cursor.execute("""
        SELECT name, OBJECT_NAME(parent_id) AS table_name
        FROM sys.triggers
        WHERE is_ms_shipped = 0
        ORDER BY table_name, name
    """)
    for trigger_name, table_name in cursor.fetchall():
        output.append(f"- {table_name}: {trigger_name}")

    # Views
    output.append("\n=== VIEWS ===\n")
    cursor.execute("""
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.VIEWS
        ORDER BY TABLE_NAME
    """)
    for (view_name,) in cursor.fetchall():
        output.append(f"- {view_name}")

    conn.close()
    return "\n".join(output)

def write_to_file(schema_text):
    filepath = os.path.join(os.path.dirname(__file__), "database_schema.txt")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(schema_text)
    print(f"\n✅ Schema written to {filepath}")

if __name__ == "__main__":
    print("🔍 Extracting schema...")
    try:
        schema = fetch_schema()
        write_to_file(schema)
    except Exception as e:
        print(f"\n❌ Failed to fetch schema: {type(e).__name__} - {e}")
