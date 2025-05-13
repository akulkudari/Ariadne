import mysql.connector
from mysql.connector import Error
import os
from fastapi import HTTPException
from dotenv import load_dotenv
from typing import Optional
import pandas as pd
import time
import logging


load_dotenv()
logger = logging.getLogger(__name__)

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'db'),
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
    

def init_db():
    conn = get_db_connection()
    if not conn:
        raise RuntimeError("Could not connect to database")

    try:
        cursor = conn.cursor()
        # users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email    VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        # sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(36) PRIMARY KEY,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        conn.commit()
        print("Database initialized successfully")
    except Error as e:
        print(f"Error initializing database: {e}")
        raise
    finally:
        cursor.close()
        conn.close()
   


async def get_user_by_email(email: str) -> Optional[dict]:
    """Retrieve user from database by username."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

def create_tables():
   """Creates tables for storing sensor data."""
   queries = {
       "temperature": """
           CREATE TABLE IF NOT EXISTS temperature (
               id INT AUTO_INCREMENT PRIMARY KEY,
               value FLOAT NOT NULL,
               unit VARCHAR(10) NOT NULL,
               mac_address VARCHAR(255) NOT NULL,
               timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
           );
       """,
       "humidity": """
           CREATE TABLE IF NOT EXISTS humidity (
               id INT AUTO_INCREMENT PRIMARY KEY,
               value FLOAT NOT NULL,
               unit VARCHAR(10) NOT NULL,
               mac_address VARCHAR(255) NOT NULL,
               timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
           );
       """,
       "light": """
           CREATE TABLE IF NOT EXISTS light (
               id INT AUTO_INCREMENT PRIMARY KEY,
               value FLOAT NOT NULL,
               unit VARCHAR(10) NOT NULL,
               mac_address VARCHAR(255) NOT NULL,
               timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
           );
       """,
   }

async def get_user_by_id(user_id: int) -> Optional[dict]:
    """
    Retrieve user from database by ID.

    Args:
        user_id: The ID of the user to retrieve

    Returns:
        Optional[dict]: User data if found, None otherwise
    """
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

async def create_session(user_id: int, session_id: str) -> bool:
    """Create a new session in the database."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO sessions (id, user_id) VALUES (%s, %s)", (session_id, user_id)
        )
        connection.commit()
        return True
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

async def get_session(session_id: str) -> Optional[dict]:
    """Retrieve session from database."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT *
            FROM sessions s
            WHERE s.id = %s
        """,
            (session_id,),
        )
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

async def delete_session(session_id: str) -> bool:
    """Delete a session from the database."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("DELETE FROM sessions WHERE id = %s", (session_id,))
        connection.commit()
        return True
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()