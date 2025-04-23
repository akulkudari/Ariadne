import mysql.connector


def get_db():
    return mysql.connector.connect(
        host="db", user="root", password="supersecret", database="ece140a-lab4"
    )


def init_db():
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS stock (
            id SERIAL PRIMARY KEY,
            symbol VARCHAR(10) NOT NULL,
            price FLOAT NOT NULL,
            company_name VARCHAR(255) NOT NULL
        )
    """
    )
    print("Look at database.py line 14 we ran the command to initialize the database by creating the table for youps")
    db.commit()
    cursor.close()
    db.close()
