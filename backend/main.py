import time
import traceback
from fastapi import FastAPI, HTTPException, Request, Form, Cookie
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import Error
import uuid, time, logging, os
from passlib.context import CryptContext
import backend.database as db
from backend.database import init_db, get_db_connection
from .database import init_db
from pydantic import BaseModel, EmailStr


class LoginData(BaseModel):
    email: EmailStr
    password: str

class RegisterData(BaseModel):
    email: EmailStr
    username: str
    password: str
    password_confirm: str
    deviceId: str

# Initialize FastAPI app
app = FastAPI()

# right after creating app:
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
logger = logging.getLogger(__name__)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # must match frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    time.sleep(20)
    init_db()

@app.get("/user_auth")
async def authenticate_user(sessionId: str = Cookie(None)):
    
    if not sessionId:
        return RedirectResponse(url="/", status_code=302)
    print(sessionId)
    conn = db.get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM sessions WHERE id = %s", (sessionId,))
        valid_session = cursor.fetchone()
        if not valid_session:
            return RedirectResponse(url="/", status_code=302)
        
        user_id = valid_session[0]
        user = await db.get_user_by_id(user_id)  # Make sure this is async if implemented that way
        
        if not user:
            return RedirectResponse(url="/", status_code=302)

        return user_id  # Return authenticated user_id

    finally:
        cursor.close()
        conn.close()



@app.get("/", response_class=FileResponse)
def root():
    return FileResponse("frontend/src/index.js")

@app.get("/register", response_class=FileResponse)
def register_page():
    return FileResponse("frontend/src/registration.js")


@app.post("/register")
async def register_user(data: RegisterData):
    email = data.email
    username = data.username
    password = data.password
    password_confirm = data.password_confirm
    deviceId = data.deviceId
    conn = db.get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        cursor = conn.cursor()

        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        user = cursor.fetchone()
        if user:
            raise HTTPException(status_code=400, detail="User already exists")

        # Check password confirmation
        if password != password_confirm:
            raise HTTPException(status_code=400, detail="Passwords do not match")

        # Hash the password
        pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
        password_hash = pwd_context.hash(password)

        # Insert the new user
        insert_query = """
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
        """
        cursor.execute(insert_query, (username, email, password_hash))
        conn.commit()

        return {"message": "User registered successfully"}

    except Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    finally:
        cursor.close()
        conn.close()            

@app.get("/login", response_class=FileResponse)
def login_page():
    return FileResponse("frontend/src/login.js")

@app.post("/login")
async def userlogin(request: Request, creds: LoginData):
    """Login endpoint to authenticate the user."""
    email = creds.email
    password = creds.password
    conn = db.get_db_connection()    
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    try:
        cursor = conn.cursor()
        # Query to find the user by email
        cursor.execute("SELECT id, email, password_hash FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        # Check if the user exists
        if user is None:
            raise HTTPException(status_code=400, detail="Invalid email or password")

        # Extract the user data (id, email, password_hash)
        user_id, user_email, password_input = user

        # Verify the password
        pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
        if not pwd_context.verify(password, password_input):
            raise HTTPException(status_code=400, detail="Invalid email or password")
        
        # need to resolve the sessions + cookies
        
        session_id = str(uuid.uuid4())
        session = await db.create_session(user_id, session_id)
        if not session:
             response = RedirectResponse(url=f"/login", status_code=302)
             return response
        response = JSONResponse({"status": "ok"})
        response.set_cookie(
            key="sessionId",
            value=session_id,
            httponly=True,
            max_age=3600,
            samesite="Lax",  # or "None" + secure if cross-site
            secure=False # True in production (with HTTPS)
        )
        return response    
    except Error as e:
        import traceback
        error_details = traceback.format_exc()
        print("Database Error:", error_details)  # Log full error details
        raise HTTPException(status_code=500, detail=f"Error during database operation: {e}")

    finally:
        cursor.close()
        conn.close()


@app.delete("/login")
async def logout(sessionId: str = Cookie(None)):
    try:
        if not sessionId:
            raise HTTPException(status_code=400, detail="No session found")
        print(sessionId)
        await db.delete_session(sessionId)
        response = JSONResponse({"status": "logged out"})
        response.delete_cookie(key="sessionId")
        return response

    except HTTPException:
        # re-raise HTTP errors so FastAPI can handle them properly
        raise

    except Exception:
        error_details = traceback.format_exc()
        print("Logout Error:", error_details)
        raise HTTPException(status_code=500, detail="An error occurred during logout.")
    
@app.get("/community_posts")
async def get_community_posts():
    conn = db.get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT user_name, message, created_at 
            FROM community_posts 
            ORDER BY created_at DESC
        """)
        posts = cursor.fetchall()
        return JSONResponse(content={"posts": posts})
    
    except Exception as e:
        import traceback
        print("Error fetching community posts:", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to fetch community posts")
    
    finally:
        cursor.close()
        conn.close()

@app.get("/dashboard", response_class=FileResponse)
def dashboard_page():
    return FileResponse("frontend/src/index.js")  # or your built index.html