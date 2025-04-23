import time
from fastapi import FastAPI, HTTPException, Request, Form
from fastapi.responses import FileResponse, RedirectResponse
from mysql.connector import Error
from pydantic import BaseModel
from .database import init_db
import app.database as db

# Initialize FastAPI app
app = FastAPI()


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    time.sleep(20)
    init_db()


# Pydantic model for request validation
class StockCreate(BaseModel):
    symbol: str
    price: float
    company_name: str

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
    return FileResponse("app/static/index.html")

@app.get("/login", response_class=FileResponse)
def login_page():
    return FileResponse("app/static/login.html")

@app.post("/login")
async def userlogin(request: Request, email: str = Form(...), password: str = Form(...)):
    """Login endpoint to authenticate the user."""
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
            return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid email or password"})
        session_id = str(uuid.uuid4())
        session = await db.create_session(user_id, session_id)
        if not session:
            response = RedirectResponse(url=f"/login", status_code=302)
            return response
        response = RedirectResponse(url=f"/dashboard", status_code=302)
        response.set_cookie(key="sessionId", value=session_id, httponly=True, max_age=3600)
        return response

    except Error as e:
        import traceback
        error_details = traceback.format_exc()
        print("Database Error:", error_details)  # Log full error details
        raise HTTPException(status_code=500, detail=f"Error during database operation: {e}")

    finally:
        cursor.close()
        conn.close()