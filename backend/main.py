import time
import datetime
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
from fastapi.encoders import jsonable_encoder




class HealthData(BaseModel):
    device_mac: str
    heart_rate: int

class DeviceIn(BaseModel):
    name: str
    mac: str

class LoginData(BaseModel):
    email: EmailStr
    password: str

class CommunityPost(BaseModel):
    message: str

class RegisterData(BaseModel):
    email: EmailStr
    username: str
    password: str
    password_confirm: str

class DeviceOut(BaseModel):
    id: int
    user_id: int
    name: str
    mac: str
    registered_at: str  # or datetime if you parse it accordingly

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

async def get_authenticated_user_id(sessionId: str = Cookie(None)) -> int:
    if not sessionId:
        raise HTTPException(status_code=401, detail="Session ID missing")

    conn = db.get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM sessions WHERE id = %s", (sessionId,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid session")

        user_id = row[0]

        user = await db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user_id
    finally:
        cursor.close()
        conn.close()

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
    # deviceId = data.deviceId
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



@app.post("/devices")
async def add_device(device: DeviceIn, sessionId: str = Cookie(None)):
    if not sessionId:
        raise HTTPException(status_code=401, detail="Session ID missing")

    try:
        print(sessionId)
        conn = get_db_connection()
        cursor = conn.cursor()
        print("this part works")
        user_id = await get_authenticated_user_id(sessionId)
        # Step 1: Look up user_id from sessions table using sessionId
        # Step 2: Insert device with the correct user_id
        cursor.execute(
            """
            INSERT INTO devices (user_id, name, mac)
            VALUES (%s, %s, %s)
            """,
            (user_id, device.name, device.mac)
        )
        conn.commit()
        conn.close()

        return {"message": "Device added successfully."}

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Error adding device: {str(e)}"})
    
@app.put("/devices/{device_id}")
async def update_device(
    device_id: int,
    device: DeviceIn,
    sessionId: str = Cookie(None)
):
    if not sessionId:
         raise HTTPException(status_code=401, detail="Session ID missing")

    try:
         user_id = await get_authenticated_user_id(sessionId)
         conn = get_db_connection()
         cursor = conn.cursor()
         cursor.execute(
            "SELECT id FROM devices WHERE id = %s AND user_id = %s",
            (device_id, user_id)
        )
         existing = cursor.fetchone()
         if not existing:
            raise HTTPException(status_code=404, detail="Device not found or access denied")
         
         cursor.execute(
            """
            UPDATE devices
            SET name = %s, mac = %s
            WHERE id = %s AND user_id = %s
            """,
            (device.name, device.mac, device_id, user_id)
        )
         conn.commit()
         cursor.close()
         conn.close()
         return {"message": f"Updated device {device_id}, {device.name}, {device.mac}"}

    except Exception as e:
         return JSONResponse(status_code=500, content={"detail": f"Error updating device: {str(e)}"})
    # Your update logic
    
@app.get("/devices")
async def get_devices(sessionId: str = Cookie(None)):
    user_id = await get_authenticated_user_id(sessionId)
    print(user_id)
    conn = db.get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, user_id, name, mac, registered_at FROM devices WHERE user_id = %s",
            (user_id,)
        )
        rows = cursor.fetchall()

        devices = []
        for row in rows:
            devices.append({
                "id": row[0],
                "user_id": row[1],
                "name": row[2],
                "mac": row[3],
                "registered_at": row[4].strftime("%Y-%m-%d %H:%M:%S") if row[4] else None
            })

        return devices

    finally:
        cursor.close()
        conn.close()

@app.get("/devices/{user_id}")
def get_devices_by_user(user_id: int):
    conn = db.get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, user_id, name, mac, registered_at FROM devices WHERE user_id = %s",
            (user_id,)
        )
        rows = cursor.fetchall()

        devices = []
        for row in rows:
            devices.append({
                "id": row[0],
                "user_id": row[1],
                "name": row[2],
                "mac": row[3],
                "registered_at": row[4].strftime("%Y-%m-%d %H:%M:%S") if row[4] else None
            })

        return devices

    finally:
        cursor.close()
        conn.close()


@app.post("/community")
async def add_community_post(
    request: Request,
    sessionId: str = Cookie(None)
):
    if not sessionId:
        raise HTTPException(status_code=401, detail="Unauthorized: No session ID")

    # Parse raw JSON body
    try:
        body = await request.json()
        message = body.get("message", "").strip()
        if not message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request body")

    # DB connection
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        cursor = conn.cursor()

        # Validate session
        cursor.execute("SELECT user_id FROM sessions WHERE id = %s", (sessionId,))
        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")

        user_id = session[0]
        # Get username
        cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        username = user[0]

        # Insert post
        cursor.execute(
            "INSERT INTO community_posts (user_name, message) VALUES (%s, %s)",
            (username, message)
        )
        conn.commit()

        return {"status": "success", "message": "Post added"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating post: {str(e)}")

    finally:
        cursor.close()
        conn.close()

@app.get("/health_data")
async def get_health_data(sessionId: str = Cookie(None)):
    if not sessionId:
        raise HTTPException(status_code=401, detail="Session ID missing")

    user_id = await get_authenticated_user_id(sessionId)
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get device MACs owned by user
        cursor.execute("SELECT mac FROM devices WHERE user_id = %s", (user_id,))
        macs = [row[0] for row in cursor.fetchall()]
        if not macs:
            return []

        # Use SQL IN clause for mac addresses
        format_strings = ','.join(['%s'] * len(macs))
        cursor.execute(f"""
            SELECT device_mac, heart_rate, recorded_at
            FROM health_data
            WHERE device_mac IN ({format_strings})
            ORDER BY recorded_at ASC
        """, tuple(macs))

        rows = cursor.fetchall()
        result = [
            {"device_mac": r[0], "heart_rate": r[1], "timestamp": r[2].strftime("%Y-%m-%d %H:%M:%S")}
            for r in rows
        ]
        return result
    finally:
        cursor.close()
        conn.close()

@app.post("/health")
def add_heart_rate(data: HealthData):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")

    try:
        cursor = conn.cursor()
        sql = """
            INSERT INTO health_data (device_mac, heart_rate)
            VALUES (%s, %s)
        """
        cursor.execute(sql, (data.device_mac, data.heart_rate))
        conn.commit()
        return {"message": "Heart rate added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding health data: {str(e)}")

@app.get("/community_posts")
async def get_community_posts():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, user_name, message, created_at 
            FROM community_posts 
            ORDER BY created_at DESC;
        """)
        posts = cursor.fetchall()

        # optional: turn created_at into ISO strings
        for p in posts:
            p["created_at"] = p["created_at"].isoformat()

        # *** key change here ***
        return JSONResponse(content=jsonable_encoder(posts))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve posts: {e}")
    finally:
        cursor.close()
        conn.close()

@app.get("/dashboard", response_class=FileResponse)
def dashboard_page():
    return FileResponse("frontend/src/index.js")  # or your built index.htmluvicorn main:app --host 0.0.0.0 --port 9000
