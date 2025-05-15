import mysql.connector
from mysql.connector import Error
import os
from fastapi import HTTPException
from dotenv import load_dotenv
from typing import Optional
import pandas as pd
import time
import logging

async def setup_database(initial_users: dict = None):
    """Create `users`, `sessions`, `devices`, `todos`, and `tasks` tables and populate initial users if provided."""
    connection = None
    cursor = None

    table_schemas = {
        "users": """
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """,
        "sessions": """
            CREATE TABLE sessions (
                id VARCHAR(36) PRIMARY KEY,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """,
        "devices": """
            CREATE TABLE devices (
                id VARCHAR(255) PRIMARY KEY,
                device_name VARCHAR(255) NOT NULL,
                bt_mac_address VARCHAR(255) NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """,
        "todos": """
            CREATE TABLE todos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                item TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """,
        "tasks": """
            CREATE TABLE tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """
    }

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Drop tables in reverse dependency order
        for table in ["sessions", "devices", "todos", "tasks", "users"]:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            connection.commit()

        # Create all tables
        for name, query in table_schemas.items():
            cursor.execute(query)
            connection.commit()
            print(f"Created table: {name}")

        # Insert initial users (if provided)
        if initial_users:
            insert_query = "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)"
            for username, (email, password_hash) in initial_users.items():
                cursor.execute(insert_query, (username, email, password_hash))
            connection.commit()
            print("Inserted initial users")

    except Exception as e:
        print(f"Database setup failed: {e}")
        raise

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

async def init_db():
    """Initialize the database by creating tables and inserting optional default users."""
    print("Initializing database...")
    try:
        await setup_database(initial_users)
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Database initialization failed: {e}")

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST'),
            port=int(os.getenv('MYSQL_PORT', '3306')),
            user=os.getenv('MYSQL_USER'),
            password=os.getenv('MYSQL_PASSWORD'),
            database=os.getenv('MYSQL_DATABASE'),
            # ssl_ca = os.getenv("MYSQL_SSL_CA", "").strip(),
            # ssl_verify_identity=True
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def get_db():
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Failed to connect to the database.")
    try:
        yield conn
    finally:
        if conn.is_connected():
            conn.close()