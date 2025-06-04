/*
The below Arduino code file when flashed onto a Nano 33 IOT board, will monitor the user's heartrate via a
connected MAX30101 Pulse Oximeter, and will send that data to the backend with the MAC ADDress of the device 
as an identifier. 
*/

#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
// #include <WiFiNINA.h>  // For Nano 33 IoT
#include <WiFi.h>
#include <ArduinoHttpClient.h>

// WiFi credentials
const char* ssid = "Wifiname";
const char* password = "your-password";

char macAddressStr[18]; // String to hold MAC address like "AA:BB:CC:DD:EE:FF"

const char* server = "192.168.1.20"; // Your backend IP
const int port = 9000;

WiFiClient wifi;
HttpClient client = HttpClient(wifi, server, port);

MAX30105 particleSensor;

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;

float beatsPerMinute = 0;
int beatAvg = 0;

// Timer to control serial printing & HTTP post
unsigned long lastPrintTime = 0;
const unsigned long printInterval = 3000; // 10 seconds

void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
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

// Function to send JSON POST to backend
void sendHeartRateToServer(float bpm, const char* mac) {
  client.beginRequest();
  client.post("/health");           // Your backend route
  client.sendHeader("Content-Type", "application/json");

  // Prepare JSON body
  // Example: {"device_mac":"AA:BB:CC:DD:EE:FF","heart_rate":72}
  String json = "{\"device_mac\":\"";
  json += mac;
  json += "\",\"heart_rate\":";
  json += (int)bpm; // round down to int bpm
  json += "}";

  client.sendHeader("Content-Length", json.length());
  client.beginBody();
  client.print(json);
  client.endRequest();

  // Read response status
  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  Serial.print("POST Status: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(response);
}

void setup()
{
  Serial.begin(115200);
  Serial.println("Initializing...");

  connectToWiFi();

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30105 was not found. Please check wiring/power.");
    while (1);
  }

  Serial.println("Place your index finger on the sensor with steady pressure.");

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);
}

void loop()
{
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

  // Every 10 seconds, print & send data
  if (millis() - lastPrintTime >= printInterval) {
    lastPrintTime = millis();

    Serial.print("IR=");
    Serial.print(irValue);
    Serial.print(", MAC=");
    Serial.print(macAddressStr);
    Serial.print(", BPM=");
    Serial.print(beatsPerMinute);
    Serial.print(", Avg BPM=");
    Serial.print(beatAvg);

    if (irValue < 50000)
      Serial.print(" No finger?");

    Serial.println();

    // Send heart rate & MAC address to backend
    if (beatsPerMinute > 50 && beatsPerMinute < 255 && (irValue > 50000)) { // sanity check
      sendHeartRateToServer(beatAvg, macAddressStr);
    }
  }
}