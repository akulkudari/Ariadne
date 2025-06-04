#include <Wire.h>
#include <TinyGPSPlus.h>
#include <LiquidCrystal_I2C.h>

// === Devices ===
const int MPU_ADDR = 0x68;
TinyGPSPlus gps;
LiquidCrystal_I2C lcd(0x27, 16, 2);  // Adjust I2C address if needed

String getUniqueID() {
  uint32_t *ptr = (uint32_t*)0x0080A00C;  // Start address of unique ID
  String uid = "";
  for (int i = 0; i < 4; i++) {
    uint32_t val = *(ptr + i);
    uid += String(val, HEX);
  }
  return uid;
}

// === Sensor Data ===
int16_t accelerometer_x, accelerometer_y, accelerometer_z;
int16_t gyro_x, gyro_y, gyro_z;
int16_t temperature;

// === Previous Sensor Values ===
int16_t prev_accel_x = 0, prev_accel_y = 0, prev_accel_z = 0;
int16_t prev_gyro_x = 0, prev_gyro_y = 0, prev_gyro_z = 0;

// === Thresholds ===
const int16_t ACCEL_THRESHOLD = 1000;
const int16_t GYRO_THRESHOLD = 100;

unsigned long lastUpdate = 0;
const unsigned long updateInterval = 10000; // 10 seconds

char tmp_str[7]; // formatted output buffer

char* convert_int16_to_str(int16_t i) {
  sprintf(tmp_str, "%6d", i);
  return tmp_str;
}

void setup() {
  Serial.begin(115200);
  Serial1.begin(9600);  // GPS
  Wire.begin();         // I2C for MPU and LCD

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");

  // Wake up MPU-6050
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // Power management register
  Wire.write(0);    // Wake it up
  Wire.endTransmission(true);

  pinMode(8, OUTPUT); // Vibration motor
}

void loop() {
  String deviceID = getUniqueID();
  while (Serial1.available()) {
    gps.encode(Serial1.read());
  }

  if (millis() - lastUpdate >= updateInterval) {
    lastUpdate = millis();

    // === Read MPU-6050 ===
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B);
    Wire.endTransmission(false);
    Wire.requestFrom(MPU_ADDR, 14, true);

    accelerometer_x = Wire.read() << 8 | Wire.read();
    accelerometer_y = Wire.read() << 8 | Wire.read();
    accelerometer_z = Wire.read() << 8 | Wire.read();
    temperature      = Wire.read() << 8 | Wire.read();
    gyro_x           = Wire.read() << 8 | Wire.read();
    gyro_y           = Wire.read() << 8 | Wire.read();
    gyro_z           = Wire.read() << 8 | Wire.read();

    bool accel_changed =
      abs(accelerometer_x - prev_accel_x) > ACCEL_THRESHOLD ||
      abs(accelerometer_y - prev_accel_y) > ACCEL_THRESHOLD ||
      abs(accelerometer_z - prev_accel_z) > ACCEL_THRESHOLD;

    bool gyro_changed =
      abs(gyro_x - prev_gyro_x) > GYRO_THRESHOLD ||
      abs(gyro_y - prev_gyro_y) > GYRO_THRESHOLD ||
      abs(gyro_z - prev_gyro_z) > GYRO_THRESHOLD;

    if (accel_changed || gyro_changed) {
      digitalWrite(8, HIGH);

      Serial.println("=== SENSOR UPDATE ===");

      // === LCD Display ===
      lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Device ID:" + deviceID.substring(0, 16));
        Serial.print("Device ID: ");
        Serial.println(deviceID);

      if (gps.location.isValid()) {
        lcd.setCursor(0, 1);
        lcd.print("Lat:");
        lcd.print(gps.location.lat(), 1);

        lcd.setCursor(0, 2);
        lcd.print("Lon:");
        lcd.print(gps.location.lng(), 1);
      } else {
        lcd.setCursor(0, 0);
        lcd.print("Waiting for GPS fix");
      }
      

      // Serial debug
      Serial.print("aX = "); Serial.print(convert_int16_to_str(accelerometer_x));
      Serial.print(" | aY = "); Serial.print(convert_int16_to_str(accelerometer_y));
      Serial.print(" | aZ = "); Serial.print(convert_int16_to_str(accelerometer_z));
      Serial.print(" | Temp = "); Serial.print(temperature / 340.00 + 36.53, 2);
      Serial.print(" | gX = "); Serial.print(convert_int16_to_str(gyro_x));
      Serial.print(" | gY = "); Serial.print(convert_int16_to_str(gyro_y));
      Serial.print(" | gZ = "); Serial.println(convert_int16_to_str(gyro_z));

      delay(1000);
      digitalWrite(8, LOW);

      // Update previous values
      prev_accel_x = accelerometer_x;
      prev_accel_y = accelerometer_y;
      prev_accel_z = accelerometer_z;
      prev_gyro_x = gyro_x;
      prev_gyro_y = gyro_y;
      prev_gyro_z = gyro_z;
    }
  }
}