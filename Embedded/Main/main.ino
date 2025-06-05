#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <WiFi.h>
#include <ArduinoHttpClient.h>
#include <Adafruit_BMP085.h>
#include <TinyGPSPlus.h>

// WiFi credentials (home network)
const char* home_ssid = "WHOISINPARIS";
const char* home_password = "blackpeople";

//WiFi credentials (enterprise)
const char* enterprise_ssid = "UCSD-PROTECTED";
const char* enterprise_username = "akudari";   // usually your login
const char* enterprise_password = "142399Triton!";   // your enterprise Wi-Fi password 
char macAddressStr[18];

const char* server = "192.168.1.20";
const int port = 9000;
WiFiClient wifi;
HttpClient client = HttpClient(wifi, server, port);

//GPS

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
const int buttonK1Pin = 3;
const int buttonK2Pin = 2;
const int buttonK3Pin = 4;
bool lastK1State = HIGH;
bool lastK2State = HIGH;
bool lastK3State = HIGH;

void connectToWiFi() {

  /*
  ==========FOR ENTERPRISE CONNECTION, UNCOMMENT THE CODE BELOW=====================
  Serial.println("Connecting to WPA2-Enterprise WiFi");
  WiFi.setEnterpriseUsername(enterprise_username);
  WiFi.setEnterprisePassword(enterprise_password);
  Wifi.begin(ssid)
  */

  Serial.print("Connecting to WiFi");
  
  WiFi.begin(home_ssid, home_password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");

  uint8_t mac[6];
  WiFi.macAddress(mac);
  snprintf(macAddressStr, sizeof(macAddressStr), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  Serial.print("MAC Address: ");
  Serial.println(macAddressStr);
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

  // Buttons
  pinMode(buttonK1Pin, INPUT_PULLUP);
  pinMode(buttonK2Pin, INPUT_PULLUP);
  pinMode(buttonK3Pin, INPUT_PULLUP);


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

  delay(20); // debounce
}