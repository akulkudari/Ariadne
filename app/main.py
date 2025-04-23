import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .database import get_db, init_db

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


@app.get("/stocks")
def get_stocks():
    db = get_db()
    cursor = db.cursor(dictionary=True)

    # TODO: fill this out
    query = ""

    cursor.execute(query)
    stocks = cursor.fetchall()
    cursor.close()
    db.close()
    return stocks


@app.post("/stocks")
def create_stock(stock: StockCreate):
    db = get_db()
    cursor = db.cursor()

    # TODO: fill this out
    query = f""""""

    cursor.execute(query)
    db.commit()

    # Get the inserted record
    cursor.execute(f"SELECT * FROM stock WHERE id = {cursor.lastrowid}")
    new_stock = cursor.fetchone()

    cursor.close()
    db.close()
    return new_stock


@app.get("/stocks/{stock_id}")
def get_stock(stock_id: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)

    # TODO: fill this out
    query = ""

    cursor.execute(query)
    stock = cursor.fetchone()
    cursor.close()
    db.close()

    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock


@app.delete("/stocks/{stock_id}")
def delete_stock(stock_id: int):
    db = get_db()
    cursor = db.cursor()

    # Check if stock exists
    # TODO: fille this out
    query = f""

    cursor.execute(query)
    if cursor.fetchone() is None:
        cursor.close()
        db.close()
        raise HTTPException(status_code=404, detail="Stock not found")

    # delete the stock
    # TODO: fill this out
    query = f""

    cursor.execute(query)
    db.commit()
    cursor.close()
    db.close()
    return {"message": "Stock deleted"}
