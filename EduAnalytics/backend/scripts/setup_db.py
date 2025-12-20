import psycopg2
from psycopg2 import sql

# PostgreSQL connection details
HOST = "localhost"
USER = "postgres"
PASSWORD = "postgres"  # Change if you set a different password
PORT = "5432"

try:
    # Connect to default postgres database
    conn = psycopg2.connect(
        host=HOST,
        user=USER,
        password=PASSWORD,
        port=PORT,
        database="postgres"
    )
    
    cursor = conn.cursor()
    conn.autocommit = True  # Required for CREATE DATABASE
    
    print(" Connected to PostgreSQL")
    
    # Create database
    cursor.execute("CREATE DATABASE eduanalytics;")
    print(" Database 'eduanalytics' created")
    
    # Create user
    cursor.execute("CREATE USER eduanalytics_user WITH PASSWORD 'SecurePass123!';")
    print(" User 'eduanalytics_user' created")
    
    # Grant privileges
    cursor.execute("ALTER ROLE eduanalytics_user SET client_encoding TO 'utf8';")
    cursor.execute("ALTER ROLE eduanalytics_user SET default_transaction_isolation TO 'read committed';")
    cursor.execute("ALTER ROLE eduanalytics_user SET default_transaction_deferrable TO on;")
    cursor.execute("GRANT ALL PRIVILEGES ON DATABASE eduanalytics TO eduanalytics_user;")
    print(" Privileges granted to user")
    
    cursor.close()
    conn.close()
    
    print("\n DATABASE SETUP COMPLETE!")
    print("\nCredentials:")
    print("Username: eduanalytics_user")
    print("Password: SecurePass123!")
    print("Database: eduanalytics")
    print("Host: localhost")
    print("Port: 5432")
    
except psycopg2.Error as e:
    print(f" Error: {e}")
    if "password authentication failed" in str(e):
        print("\n Trying with empty password...")
