import psycopg2

try:
    conn = psycopg2.connect(
        host='localhost',
        user='postgres',
        password='',
        port='5432',
        database='postgres'
    )
    print('Connected to PostgreSQL')
    
    cursor = conn.cursor()
    conn.autocommit = True
    
    cursor.execute('CREATE DATABASE eduanalytics;')
    print('Database created')
    
    cursor.execute("CREATE USER eduanalytics_user WITH PASSWORD 'SecurePass123!';")
    print('User created')
    
    cursor.execute("ALTER ROLE eduanalytics_user SET client_encoding TO 'utf8';")
    cursor.execute("ALTER ROLE eduanalytics_user SET default_transaction_isolation TO 'read committed';")
    cursor.execute("ALTER ROLE eduanalytics_user SET default_transaction_deferrable TO on;")
    cursor.execute("GRANT ALL PRIVILEGES ON DATABASE eduanalytics TO eduanalytics_user;")
    print('Privileges granted')
    
    cursor.close()
    conn.close()
    
    print('\nDATABASE SETUP COMPLETE!')
    print('Username: eduanalytics_user')
    print('Password: SecurePass123!')
    
except Exception as e:
    print(f'Error: {e}')
