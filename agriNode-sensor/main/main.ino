/**
 * AgriNode Sensor Firmware
 * 
 * Hardware:
 * - Wemos D1 Mini (ESP8266)
 * - BME280 sensor (temperature, humidity, pressure)
 * - BH1750 light sensor
 * - Soil moisture sensor
 * 
 * Connections:
 * - BME280: SDA=D2, SCL=D1
 * - BH1750: SDA=D2, SCL=D1, ADDR=D3
 * - Moisture Sensor: A0
 * 
 * Features:
 * - Read sensor data
 * - Send data to agriNode-Gateway
 * - Use deep sleep for power efficiency
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* WIFI_SSID = "Connecto Patronum";
const char* WIFI_PASSWORD = "!Kl3pp3rg4sse3EG!";

// API endpoint
const char* API_ENDPOINT = "http://192.168.178.95:5066/api/sensor-data";
const char* API_KEY = "YOUR_API_KEY"; // If required by your gateway
const char* SENSOR_ID = "SENSOR_1"; // Unique identifier for this sensor node

// Sleep time in seconds (15 minutes = 900 seconds)
const uint32_t SLEEP_TIME_SECONDS = 900;

// Pin definitions
const int MOISTURE_SENSOR_PIN = A0;
const int BH1750_ADDR_PIN = D3;

// I2C pins
const int SDA_PIN = D2;
const int SCL_PIN = D1;

// Sensor objects
Adafruit_BME280 bme;
BH1750 lightMeter;

// Function prototypes
bool initializeSensors();
void readSensorData(float &temperature, float &humidity, float &pressure, float &light, int &moisture);
bool sendDataToGateway(float temperature, float humidity, float pressure, float light, int moisture);
void goToSleep();

void setup() {
  Serial.begin(115200);
  Serial.println("\n\nAgriNode Sensor Node Starting...");

  // Configure BH1750 ADDR pin
  pinMode(BH1750_ADDR_PIN, OUTPUT);
  digitalWrite(BH1750_ADDR_PIN, HIGH);  // Set address pin high
  
  // Initialize I2C with the specified pins
  Wire.begin(SDA_PIN, SCL_PIN);
  
  // Initialize sensors - using regular if/else control flow instead of exceptions
  if (!initializeSensors()) {
    Serial.println("Failed to initialize one or more sensors. Going to sleep to retry.");
    goToSleep();
    return;
  }
  
  // Read sensor data
  float temperature = 0.0, humidity = 0.0, pressure = 0.0, light = 0.0;
  int moisture = 0;
  readSensorData(temperature, humidity, pressure, light, moisture);
  
  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  Serial.print("Connecting to WiFi");
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi connection failed. Going to sleep to retry.");
    goToSleep();
    return;
  }
  
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Send data to gateway
  if (!sendDataToGateway(temperature, humidity, pressure, light, moisture)) {
    Serial.println("Failed to send data to gateway. Going to sleep to retry.");
    goToSleep();
    return;
  }
  
  Serial.println("Data sent successfully. Going to sleep...");
  goToSleep();
}

void loop() {
  // This will not be used as the device will be in deep sleep
}

bool initializeSensors() {
  bool success = true;
  
  // Initialize BME280
  if (!bme.begin(0x76)) {  // Try the default BME280 address
    if (!bme.begin(0x77)) {  // Try the alternative address
      Serial.println("Could not find a valid BME280 sensor, check wiring!");
      success = false;
    }
  }
  
  // Initialize BH1750
  if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("Could not find a valid BH1750 sensor, check wiring!");
    success = false;
  }
  
  return success;
}

void readSensorData(float &temperature, float &humidity, float &pressure, float &light, int &moisture) {
  // Read BME280 data
  temperature = bme.readTemperature();
  humidity = bme.readHumidity();
  pressure = bme.readPressure() / 100.0F; // Convert to hPa
  
  // Read BH1750 data (light intensity in lux)
  light = lightMeter.readLightLevel();
  
  // Read soil moisture (analog value)
  moisture = analogRead(MOISTURE_SENSOR_PIN);
  
  // Log sensor readings
  Serial.println("Sensor Readings:");
  Serial.print("Temperature: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("Humidity: "); Serial.print(humidity); Serial.println(" %");
  Serial.print("Pressure: "); Serial.print(pressure); Serial.println(" hPa");
  Serial.print("Light: "); Serial.print(light); Serial.println(" lux");
  Serial.print("Soil Moisture: "); Serial.println(moisture);
}

bool sendDataToGateway(float temperature, float humidity, float pressure, float light, int moisture) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  // Create JSON document for the data
  DynamicJsonDocument doc(256);
  doc["sensor_id"] = SENSOR_ID;
  doc["air_temperature"] = temperature;
  doc["air_humidity"] = humidity;
  //doc["pressure"] = pressure;
  doc["brightness"] = light;
  doc["soil_moisture"] = moisture;
  doc["battery_level"] = 100; // ToDo: Implement battery level reading
  
  // Serialize JSON to string
  String jsonData;
  serializeJson(doc, jsonData);
  
  // Create HTTP client
  WiFiClient client;
  HTTPClient http;
  
  // Begin HTTP request
  http.begin(client, API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  
  // Add Bearer token authentication
  String authHeader = String("Bearer ") + API_KEY;
  http.addHeader("Authorization", authHeader);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    http.end();
    return true;
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
    http.end();
    return false;
  }
}

void goToSleep() {
  // Turn off WiFi to save power
  WiFi.disconnect();
  WiFi.mode(WIFI_OFF);
  
  // Calculate sleep time in microseconds
  uint64_t sleepTimeUS = SLEEP_TIME_SECONDS * 1000000ULL;
  
  Serial.print("Going to sleep for ");
  Serial.print(SLEEP_TIME_SECONDS);
  Serial.println(" seconds");
  
  // Configure GPIO16 to wake up from deep sleep
  pinMode(D0, WAKEUP_PULLUP);
  
  // Enter deep sleep mode
  ESP.deepSleep(sleepTimeUS);
}