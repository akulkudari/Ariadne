#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <WiFi.h>
#include <ArduinoHttpClient.h>
#include <Adafruit_BMP085.h>
#include <TinyGPSPlus.h>
#include <Adafruit_LSM303_U.h>
#include <LiquidCrystal_I2C.h>  // Include the LCD library

// Initialize the LCD (I2C address 0x27, 20 columns x 4 rows)
LiquidCrystal_I2C lcd(0x27, 20, 4);

// WiFi credentials (home network)
const char* home_ssid = "WHOISINPARIS";
const char* home_password = "blackpeople";

Adafruit_LSM303_Mag_Unified mag = Adafruit_LSM303_Mag_Unified(12345);

// WiFi credentials (enterprise)
const char* enterprise_ssid = "UCSD-PROTECTED";
const char* enterprise_username = "";   // usually your login
const char* enterprise_password = "";   // your enterprise Wi-Fi password 
char macAddressStr[18];

const char* server = "";
const int port = 9000;
WiFiClient wifi;
HttpClient client = HttpClient(wifi, server, port);

// GPS
TinyGPSPlus gps;

// Heart rate variables
MAX30105 particleSensor;
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 0;

// BMP180 sensor
Adafruit_BMP085 bmp;
float currentTemperature = 0.0;

// Button pins
const int buttonK1Pin = 2;
const int buttonK2Pin = 3;
const int buttonK3Pin = 4;
const int buttonK4Pin = 5;
bool lastK1State = HIGH;
bool lastK2State = HIGH;
bool lastK3State = HIGH;
bool lastK4State = HIGH;

void connectToWiFi() {
  /*
  ==========FOR ENTERPRISE CONNECTION, UNCOMMENT THE CODE BELOW=====================
  Serial.println("Connecting to WPA2-Enterprise WiFi");
  WiFi.setEnterpriseUsername(enterprise_username);
  WiFi.setEnterprisePassword(enterprise_password);
  Wifi.begin(ssid)
  */

  Serial.print("Connecting to WiFi");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  WiFi.begin(home_ssid, home_password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    // Could add some dots on LCD as well if you want
  }
  Serial.println("\nConnected to WiFi!");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected!");

  uint8_t mac[6];
  WiFi.macAddress(mac);
  snprintf(macAddressStr, sizeof(macAddressStr), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  Serial.print("MAC Address: ");
  Serial.println(macAddressStr);
  lcd.setCursor(0, 1);
  lcd.print("MAC:");
  lcd.setCursor(0, 2);
  lcd.print(macAddressStr);
}

void sendHeartRateToServer(float bpm, const char* mac) {
  client.beginRequest();
  client.post("/health");
  client.sendHeader("Content-Type", "application/json");

  String json = "{\"device_mac\":\"";
  json += mac;
  json += "\",\"heart_rate\":";
  json += (int)bpm;
  json += "}";

  client.sendHeader("Content-Length", json.length());
  client.beginBody();
  client.print(json);
  client.endRequest();

  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  Serial.print("POST Status: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(response);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("POST Status:");
  lcd.setCursor(0, 1);
  lcd.print(statusCode);
  lcd.setCursor(0, 2);
  if (response.length() > 20) {
    lcd.print(response.substring(0, 20));
  } else {
    lcd.print(response);
  }
}

double calculateBearing(double lat1, double lon1, double lat2, double lon2) {
  lat1 = radians(lat1);
  lon1 = radians(lon1);
  lat2 = radians(lat2);
  lon2 = radians(lon2);

  double dLon = lon2 - lon1;

  double y = sin(dLon) * cos(lat2);
  double x = cos(lat1) * sin(lat2) -
             sin(lat1) * cos(lat2) * cos(dLon);
  double bearing = atan2(y, x);
  bearing = degrees(bearing);
  return fmod((bearing + 360), 360); // normalize to 0-360
}

void setup() {
  Serial.begin(115200);
  Serial1.begin(9600);  // GPS module connected to Serial1
  Serial.println("Waiting for GPS data...");

  lcd.init();  // Initialize LCD
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Waiting GPS data");

  while (!Serial);

  connectToWiFi();

  // MAX30105 setup
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30105 not found. Check wiring.");
    lcd.clear();
    lcd.print("MAX30105 error");
    while (1);
  }
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);

  // BMP180 setup
  if (!bmp.begin()) {
    Serial.println("BMP180 not found. Check wiring.");
    lcd.clear();
    lcd.print("BMP180 error");
    while (1);
  }
  //LSM303HLDC setup
  if (!mag.begin()) {
    Serial.println("LSM303 magnetometer not found. Check wiring.");
    lcd.clear();
    lcd.print("Magneto error");
    while (1);
  }

  // Buttons
  pinMode(buttonK1Pin, INPUT_PULLUP);
  pinMode(buttonK2Pin, INPUT_PULLUP);
  pinMode(buttonK3Pin, INPUT_PULLUP);
  pinMode(buttonK4Pin, INPUT_PULLUP);

  Serial.println("Setup complete. Press K1 to send BPM, K2 to view temperature, K3 to print location");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Setup complete");
  lcd.setCursor(0, 1);
  lcd.print("K1 send BPM");
  lcd.setCursor(0, 2);
  lcd.print("K2 temp K3 loc");
}

void loop() {
  // gps code
  while (Serial1.available()) {
    gps.encode(Serial1.read());
  }

  // Read IR from MAX30105
  long irValue = particleSensor.getIR();

  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++) beatAvg += rates[x];
      beatAvg /= RATE_SIZE;
    }
  }

  // Read temperature from BMP180
  currentTemperature = bmp.readTemperature();

  // ---- K1 Press: Send heart rate ----
  bool currentK1State = digitalRead(buttonK1Pin);
  if (currentK1State == LOW && lastK1State == HIGH) {
    Serial.print("K1 pressed - Avg BPM = ");
    Serial.print(beatAvg);
    Serial.print(", IR = ");
    Serial.println(irValue);

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("K1 pressed BPM:");
    lcd.setCursor(0, 1);
    lcd.print(beatAvg);
    lcd.setCursor(0, 2);
    lcd.print("IR:");
    lcd.print(irValue);

    if (beatAvg > 50 && beatAvg < 255 && irValue > 50000) {
      sendHeartRateToServer(beatAvg, macAddressStr);
    } else {
      Serial.println("Invalid or missing heart rate. Try again.");
      lcd.clear();
      lcd.print("Invalid HR");
      lcd.setCursor(0, 1);
      lcd.print("Try again");
    }
  }
  lastK1State = currentK1State;

  // ---- K2 Press: Show temperature ----
  bool currentK2State = digitalRead(buttonK2Pin);
  if (currentK2State == LOW && lastK2State == HIGH) {
    Serial.print("K2 pressed - Temperature: ");
    Serial.print(currentTemperature);
    Serial.println(" °C");

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("K2 pressed Temp:");
    lcd.setCursor(0, 1);
    lcd.print(currentTemperature);
    lcd.print(" C");
  }
  lastK2State = currentK2State;

  // ---- K3 Press: Show location and send waypoint ----
  bool currentK3State = digitalRead(buttonK3Pin);
  if (lastK3State == HIGH && currentK3State == LOW) {
    Serial.println("K3 pressed - Location: ");

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("K3 pressed Loc");

    if (gps.location.isValid()) {
      double latitude = gps.location.lat();
      double longitude = gps.location.lng();

      Serial.println("=== GPS Location ===");
      Serial.print("Latitude: ");
      Serial.println(latitude, 6);
      Serial.print("Longitude: ");
      Serial.println(longitude, 6);

      lcd.setCursor(0, 1);
      lcd.print("Lat:");
      lcd.print(latitude, 4);
      lcd.setCursor(0, 2);
      lcd.print("Lon:");
      lcd.print(longitude, 4);

      // Send POST request to /waypoints
      client.beginRequest();
      client.post("/waypoint");  // or "/waypoint" depending on your actual route
      client.sendHeader("Content-Type", "application/json");

      String json = "{\"device_mac\":\"";
      json += macAddressStr;
      json += "\",\"latitude\":";
      json += String(latitude, 6);
      json += ",\"longitude\":";
      json += String(longitude, 6);
      json += "}";

      client.sendHeader("Content-Length", json.length());
      client.beginBody();
      client.print(json);
      client.endRequest();

      int statusCode = client.responseStatusCode();
      String response = client.responseBody();

      Serial.print("Waypoint POST Status: ");
      Serial.println(statusCode);
      Serial.print("Response: ");
      Serial.println(response);

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Waypoint POST:");
      lcd.setCursor(0, 1);
      lcd.print(statusCode);
      lcd.setCursor(0, 2);
      if (response.length() > 20) {
        lcd.print(response.substring(0, 20));
      } else {
        lcd.print(response);
      }
    } else {
      Serial.println("Waiting for GPS fix...");
      lcd.clear();
      lcd.print("Waiting GPS fix");
    }

    // Wait for button to be released
    while (digitalRead(buttonK3Pin) == LOW) {
      delay(10); // Debounce delay
    }
  }
  lastK3State = currentK3State;

  // K4 button handling
  bool currentK4State = digitalRead(buttonK4Pin);
  if (lastK4State == HIGH && currentK4State == LOW) {
    if (gps.location.isValid()) {
      double lat1 = gps.location.lat();
      double lon1 = gps.location.lng();

      // Target location
      double lat2 = 32.880947;
      double lon2 = -117.237804;

      // Calculate bearing to destination
      double bearingToTarget = calculateBearing(lat1, lon1, lat2, lon2);

      // Get compass heading
      sensors_event_t event;
      mag.getEvent(&event);

      float heading = atan2(-event.magnetic.y, -event.magnetic.x);
      if (heading < 0) heading += 2 * PI;
      float headingDegrees = heading * 180 / PI;

      // Calculate turn direction
      float difference = bearingToTarget - headingDegrees;
      if (difference < -180) difference += 360;
      if (difference > 180) difference -= 360;

      Serial.print("Heading: ");
      Serial.print(headingDegrees);
      Serial.print("°, Bearing to target: ");
      Serial.print(bearingToTarget);
      Serial.print("°, Turn: ");

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Head:");
      lcd.print((int)headingDegrees);
      lcd.setCursor(0, 1);
      lcd.print("Bear:");
      lcd.print((int)bearingToTarget);
      lcd.setCursor(0, 2);
      lcd.print("Turn:");

      if (abs(difference) < 10) {
        Serial.println("You're facing the target!");
        lcd.print("Facing target!");
      } else if (difference > 0) {
        Serial.println("Turn RIGHT towards target.");
        lcd.print("Turn RIGHT");
      } else {
        Serial.println("Turn LEFT towards target.");
        lcd.print("Turn LEFT");
      }

    } else {
      Serial.println("Waiting for GPS fix...");
      lcd.clear();
      lcd.print("Waiting GPS fix");
    }
  }
  lastK4State = currentK4State;

  delay(20); // debounce
}
void setup() {
  Serial.begin(115200);
  Serial1.begin(9600);  // GPS module connected to Serial1
  Serial.println("Waiting for GPS data...");
  while (!Serial);

  connectToWiFi();

  // MAX30105 setup
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30105 not found. Check wiring.");
    while (1);
  }
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);

  // BMP180 setup
  if (!bmp.begin()) {
    Serial.println("BMP180 not found. Check wiring.");
    while (1);
  }
  //LSM303HLDC setup
   if (!mag.begin()) {
    Serial.println("LSM303 magnetometer not found. Check wiring.");
    while (1);
  }

  // Buttons
  pinMode(buttonK1Pin, INPUT_PULLUP);
  pinMode(buttonK2Pin, INPUT_PULLUP);
  pinMode(buttonK3Pin, INPUT_PULLUP);
  pinMode(buttonK4Pin, INPUT_PULLUP);



  Serial.println("Setup complete. Press K1 to send BPM, K2 to view temperature, K3 to print location");
}

void loop() {
  //gps code
  while (Serial1.available()) {
    gps.encode(Serial1.read());
  }
/*
    if (gps.location.isValid()) {
      Serial.println("=== GPS Location ===");
      Serial.print("Latitude: ");
      Serial.println(gps.location.lat(), 6);
      Serial.print("Longitude: ");
      Serial.println(gps.location.lng(), 6);
    } else {
      Serial.println("Waiting for GPS fix...");
    }
    */
  // Read IR from MAX30105
  long irValue = particleSensor.getIR();

  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++) beatAvg += rates[x];
      beatAvg /= RATE_SIZE;
    }
  }

  // Read temperature from BMP180
  currentTemperature = bmp.readTemperature();

  // ---- K1 Press: Send heart rate ----
  bool currentK1State = digitalRead(buttonK1Pin);
  if (currentK1State == LOW && lastK1State == HIGH) {
    Serial.print("K1 pressed - Avg BPM = ");
    Serial.print(beatAvg);
    Serial.print(", IR = ");
    Serial.println(irValue);

    if (beatAvg > 50 && beatAvg < 255 && irValue > 50000) {
      sendHeartRateToServer(beatAvg, macAddressStr);
    } else {
      Serial.println("Invalid or missing heart rate. Try again.");
    }
  }
  lastK1State = currentK1State;

  // ---- K2 Press: Show temperature ----
  bool currentK2State = digitalRead(buttonK2Pin);
  if (currentK2State == LOW && lastK2State == HIGH) {
    Serial.print("K2 pressed - Temperature: ");
    Serial.print(currentTemperature);
    Serial.println(" °C");
  }
  lastK2State = currentK2State;

  // ---- K3 Press: Show location and send waypoint ----
bool currentK3State = digitalRead(buttonK3Pin);
if (lastK3State == HIGH && currentK3State == LOW) {
  Serial.println("K3 pressed - Location: ");

  if (gps.location.isValid()) {
    double latitude = gps.location.lat();
    double longitude = gps.location.lng();

    Serial.println("=== GPS Location ===");
    Serial.print("Latitude: ");
    Serial.println(latitude, 6);
    Serial.print("Longitude: ");
    Serial.println(longitude, 6);

    // Send POST request to /waypoints
    client.beginRequest();
    client.post("/waypoint");  // or "/waypoint" depending on your actual route
    client.sendHeader("Content-Type", "application/json");

    String json = "{\"device_mac\":\"";
    json += macAddressStr;
    json += "\",\"latitude\":";
    json += String(latitude, 6);
    json += ",\"longitude\":";
    json += String(longitude, 6);
    json += "}";

    client.sendHeader("Content-Length", json.length());
    client.beginBody();
    client.print(json);
    client.endRequest();

    int statusCode = client.responseStatusCode();
    String response = client.responseBody();

    Serial.print("Waypoint POST Status: ");
    Serial.println(statusCode);
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.println("Waiting for GPS fix...");
  }

  // Wait for button to be released
  while (digitalRead(buttonK3Pin) == LOW) {
    delay(10); // Debounce delay
  }
}
lastK3State = currentK3State;

//K4 button handling
bool currentK4State = digitalRead(buttonK4Pin);
if (lastK4State == HIGH && currentK4State == LOW) {
  if (gps.location.isValid()) {
    double lat1 = gps.location.lat();
    double lon1 = gps.location.lng();

    // Target location
    double lat2 = 32.880947;
    double lon2 = -117.237804;

    // Calculate bearing to destination
    double bearingToTarget = calculateBearing(lat1, lon1, lat2, lon2);

    // Get compass heading
    sensors_event_t event;
    mag.getEvent(&event);

    float heading = atan2(-event.magnetic.y, -event.magnetic.x);
    if (heading < 0) heading += 2 * PI;
    float headingDegrees = heading * 180 / PI;

    // Calculate turn direction
    float difference = bearingToTarget - headingDegrees;
    if (difference < -180) difference += 360;
    if (difference > 180) difference -= 360;

    Serial.print("Heading: ");
    Serial.print(headingDegrees);
    Serial.print("°, Bearing to target: ");
    Serial.print(bearingToTarget);
    Serial.print("°, Turn: ");

    if (abs(difference) < 10) {
      Serial.println("You're facing the target!");
    } else if (difference > 0) {
      Serial.println("Turn RIGHT towards target.");
    } else {
      Serial.println("Turn LEFT towards target.");
    }

  } else {
    Serial.println("Waiting for GPS fix...");
  }
}
lastK4State = currentK4State;

  delay(20); // debounce
}
