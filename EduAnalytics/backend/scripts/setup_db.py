import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

# MySQL connection details (admin user) — can be provided via environment variables
HOST = os.getenv("DB_HOST", "localhost")
USER = os.getenv("DB_ADMIN_USER", "root")
PASSWORD = os.getenv("DB_ADMIN_PASSWORD", "")  # Set this env var if root/admin has a password
PORT = int(os.getenv("DB_PORT", 3306))

DB_NAME = os.getenv("DB_NAME", "eduanalytics")
APP_USER = os.getenv("DB_APP_USER", "eduanalytics_user")
APP_PASS = os.getenv("DB_APP_PASS", "SecurePass123!")

try:
    # Connect to MySQL server
    conn = pymysql.connect(host=HOST, user=USER, password=PASSWORD, port=PORT, autocommit=True)
    cursor = conn.cursor()

    print(" Connected to MySQL server")

    # Create database
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    print(f" Database '{DB_NAME}' created or already exists")

    # Create user and grant privileges
    cursor.execute(f"CREATE USER IF NOT EXISTS '{APP_USER}'@'localhost' IDENTIFIED BY '{APP_PASS}';")
    cursor.execute(f"GRANT ALL PRIVILEGES ON {DB_NAME}.* TO '{APP_USER}'@'localhost';")
    cursor.execute("FLUSH PRIVILEGES;")
    print(f" User '{APP_USER}' created/granted privileges")

    cursor.close()
    conn.close()

    print("\n DATABASE SETUP COMPLETE!")
    print("\nCredentials:")
    print(f"Username: {APP_USER}")
    print(f"Password: {APP_PASS}")
    print(f"Database: {DB_NAME}")
    print("Host: localhost")
    print(f"Port: {PORT}")

except pymysql.MySQLError as e:
    print(f" Error: {e}")
