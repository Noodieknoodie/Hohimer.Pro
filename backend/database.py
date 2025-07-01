import os
import pyodbc
import struct
from azure.identity import DefaultAzureCredential
from typing import Optional
from dotenv import load_dotenv

# Load from root directory based on Teams Toolkit environment
env = os.getenv('TEAMSFX_ENV', 'local')
env_file = f'.env.{env}' if env != 'local' else '.env.local'
root_dir = Path(__file__).parent.parent  # Go up from backend to root
load_dotenv(root_dir / env_file)

class Database:
    def __init__(self):
        self.connection_string = self._get_connection_string()
        
    def _get_connection_string(self):
        server = os.getenv("SQL_SERVER", "hohimerpro-db-server.database.windows.net")
        database = os.getenv("SQL_DATABASE", "HohimerPro-401k")
        
        return (
            f"Driver={{ODBC Driver 18 for SQL Server}};"
            f"Server=tcp:{server},1433;"
            f"Database={database};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
            f"Connection Timeout=30"
        )
    
    def get_connection(self):
        credential = DefaultAzureCredential(exclude_interactive_browser_credential=False)
        token_bytes = credential.get_token("https://database.windows.net/.default").token.encode("UTF-16-LE")
        token_struct = struct.pack(f'<I{len(token_bytes)}s', len(token_bytes), token_bytes)
        SQL_COPT_SS_ACCESS_TOKEN = 1256
        
        conn = pyodbc.connect(
            self.connection_string,
            attrs_before={SQL_COPT_SS_ACCESS_TOKEN: token_struct}
        )
        return conn

# Global database instance
db = Database()