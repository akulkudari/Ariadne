#include "Wire.h" // I2C communication library

const int MPU_ADDR = 0x68; // MPU-6050 I2C address

// Raw sensor data
int16_t accelerometer_x, accelerometer_y, accelerometer_z;
int16_t gyro_x, gyro_y, gyro_z;
int16_t temperature;

// Previous sensor data for comparison
int16_t prev_accel_x = 0, prev_accel_y = 0, prev_accel_z = 0;
int16_t prev_gyro_x = 0, prev_gyro_y = 0, prev_gyro_z = 0;

// Thresholds to suppress noise
const int16_t ACCEL_THRESHOLD = 1000;  // Adjust as needed
const int16_t GYRO_THRESHOLD = 100;

char tmp_str[7]; // For formatted output

char* convert_int16_to_str(int16_t i) {
  sprintf(tmp_str, "%6d", i);
  return tmp_str;
}

void setup() {
  Serial.begin(9600);
  Wire.begin();
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // Power management register
  Wire.write(0);    // Wake up the MPU-6050
  Wire.endTransmission(true);
}

void loop() {
  // Request data from MPU
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B); // Start at ACCEL_XOUT_H
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true); // Read 14 bytes

  // Read sensor values
  accelerometer_x = Wire.read() << 8 | Wire.read();
  accelerometer_y = Wire.read() << 8 | Wire.read();
  accelerometer_z = Wire.read() << 8 | Wire.read();
  temperature      = Wire.read() << 8 | Wire.read();
  gyro_x           = Wire.read() << 8 | Wire.read();
  gyro_y           = Wire.read() << 8 | Wire.read();
  gyro_z           = Wire.read() << 8 | Wire.read();

  // Check if the change exceeds thresholds
  bool accel_changed =
    abs(accelerometer_x - prev_accel_x) > ACCEL_THRESHOLD ||
    abs(accelerometer_y - prev_accel_y) > ACCEL_THRESHOLD ||
    abs(accelerometer_z - prev_accel_z) > ACCEL_THRESHOLD;

  bool gyro_changed =
    abs(gyro_x - prev_gyro_x) > GYRO_THRESHOLD ||
    abs(gyro_y - prev_gyro_y) > GYRO_THRESHOLD ||
    abs(gyro_z - prev_gyro_z) > GYRO_THRESHOLD;

  if (accel_changed || gyro_changed) {
    Serial.print("aX = "); Serial.print(convert_int16_to_str(accelerometer_x));
    Serial.print(" | aY = "); Serial.print(convert_int16_to_str(accelerometer_y));
    Serial.print(" | aZ = "); Serial.print(convert_int16_to_str(accelerometer_z));
    Serial.print(" | tmp = "); Serial.print(temperature / 340.00 + 36.53);
    Serial.print(" | gX = "); Serial.print(convert_int16_to_str(gyro_x));
    Serial.print(" | gY = "); Serial.print(convert_int16_to_str(gyro_y));
    Serial.print(" | gZ = "); Serial.println(convert_int16_to_str(gyro_z));

    // Update previous values
    prev_accel_x = accelerometer_x;
    prev_accel_y = accelerometer_y;
    prev_accel_z = accelerometer_z;
    prev_gyro_x = gyro_x;
    prev_gyro_y = gyro_y;
    prev_gyro_z = gyro_z;
  }

  delay(10000); // Sample every 10ms (adjust as needed)
}