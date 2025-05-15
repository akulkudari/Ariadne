from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import app.database as db
from .database import init_db, get_db
import uuid, time, logging, os
from passlib.context import CryptContext

app = FastAPI()

origins = [
    "http://localhost:5173",
    "localhost:5173"
]

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
logger = logging.getLogger(__name__)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    time.sleep(20)
    await init_db()

# Method to authenticate user upon accessing a sensitive page
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

class TodoCreate(BaseModel):
    item: str

@app.get("/", tags=["root"])
async def read_root():
    return {"message": "Let's build the website!"}

@app.get("/todo", tags=["todos"])
def get_todos(conn = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("SELECT id, item FROM todos")
    todos = cursor.fetchall()
    cursor.close()
    return {"data": [{"id": row[0], "item": row[1]} for row in todos]}

@app.post("/todo", tags=["todos"])
def add_todo(todo: TodoCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO todos (user_id, item) VALUES (%s, %s)", (1, todo.item))  # assuming user_id = 1 for now
        conn.commit()
        new_id = cursor.lastrowid
        return {"data": {"message": "Todo added", "id": new_id}}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()


@app.put("/todo/{id}", tags=["todos"])
def update_todo(id: int, body: TodoCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM todos WHERE id = %s", (id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        cursor.execute("UPDATE todos SET item = %s WHERE id = %s", (body.item, id))
        conn.commit()
        return {"data": f"Todo with id {id} has been updated."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@app.delete("/todo/{id}", tags=["todos"])
def delete_todo(id: int, conn=Depends(get_db)):
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM todos WHERE id = %s", (id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Todo not found")

        cursor.execute("DELETE FROM todos WHERE id = %s", (id,))
        conn.commit()
        return {"data": f"Todo with id {id} has been removed."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()