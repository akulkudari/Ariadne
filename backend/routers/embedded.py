from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SensorData(BaseModel):
    latitude: float
    longitude: float
    altitude: float
    satellites: int
    accel_x: int
    accel_y: int
    accel_z: int
    gyro_x: int
    gyro_y: int
    gyro_z: int
    temperature: float

@router.post("/arduino/data")
async def receive_arduino_data(data: SensorData):
    print(f"Received data from Arduino: {data}")
    # Here you could store data in a database, trigger alerts, etc.
    return {"message": "Arduino data received successfully"}
