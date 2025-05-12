import time
from fastapi import FastAPI, HTTPException, Request, Form
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


# Initialize FastAPI app
app = FastAPI()

# right after creating app:
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
logger = logging.getLogger(__name__)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    time.sleep(20)
    init_db()

async def authenticate_user(request: Request):
    session_id = request.cookies.get("sessionId")
    if not session_id:
        raise HTTPException(status_code=401, detail="Unauthorized: No session ID provided")
    
    conn = db.get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection error")  

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM sessions WHERE id = %s", (session_id,))
        valid_session = cursor.fetchone()

        if not valid_session:
            return None  # Instead of raising HTTPException, return None for handling

        user_id = valid_session[0]  # Extract the user_id from the result
        print(user_id)
        user = await db.get_user_by_id(user_id)  # Ensure this is async; otherwise, remove 'await'
        
        if not user:
            return None  # No valid user found
        
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
async def register_user(
    request: Request,
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    password_confirm: str = Form(...),
    deviceId: str = Form(...)  # Assuming you'll handle this later
):
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
        user_id, user_email, stored_password_hash = user

        # Verify the password
        pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
        if not pwd_context.verify(password, stored_password_hash):
            raise HTTPException(status_code=400, detail="Invalid email or password")
        
        # need to resolve the sessions + cookies
        
        # session_id = str(uuid.uuid4())
        # session = await db.create_session(user_id, session_id)
        # if not session:
        #     response = RedirectResponse(url=f"/login", status_code=302)
        #     return response
        # response = RedirectResponse(url=f"/dashboard", status_code=302)
        # response.set_cookie(key="sessionId", value=session_id, httponly=True, max_age=3600)
        return JSONResponse({"status": "ok"})
       
    except Error as e:
        import traceback
        error_details = traceback.format_exc()
        print("Database Error:", error_details)  # Log full error details
        raise HTTPException(status_code=500, detail=f"Error during database operation: {e}")

    finally:
        cursor.close()
        conn.close()

@app.get("/dashboard", response_class=FileResponse)
def dashboard_page():
    return FileResponse("frontend/src/index.js")  # or your built index.html