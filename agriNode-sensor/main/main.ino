/**
 * AgriNode Sensor Firmware
 * 
 * Hardware:
 * - Wemos D1 Mini (ESP8266)
 * - BME280 sensor (temperature, humidity, pressure)
 * - BH1750 light sensor
 * - Soil moisture sensor
 * - INA219 current/voltage sensor (for battery monitoring)
 * - Battery Shield with TP4056
 * - 2N7000 MOSFET for RST-D0 control
 * 
 * Connections:
 * - BME280: SDA=D2, SCL=D1
 * - BH1750: SDA=D2, SCL=D1, ADDR=D3
 * - Moisture Sensor: A0
 * - INA219: SDA=D2, SCL=D1
 *          Vin+ to Battery Shield 3V output
 *          Vin- to WEMOS GND
 * - MOSFET: Gate=D5, Source=GND, Drain=RST-D0 connection
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>
#include <Adafruit_INA219.h>
#include <ArduinoJson.h>

// Current firmware version
const char* FIRMWARE_VERSION = "1.0.1";

// WiFi credentials
const char* WIFI_SSID = "Connecto Patronum";
const char* WIFI_PASSWORD = "!Kl3pp3rg4sse3EG!";

// API configuration
const char* API_BASE_URL = "http://<your-gateway-url>/api";
const char* FIRMWARE_ENDPOINT = "/firmware";
const char* SENSOR_DATA_ENDPOINT = "/sensor-data";
const char* API_KEY = "<your-api-key>"; // API key for authentication>";
const char* SENSOR_ID = "SENSOR_1"; // Unique identifier for this sensor node

// Sleep time in seconds (15 minutes = 900 seconds)
const uint32_t SLEEP_TIME_SECONDS = 900;

// Pin definitions
const int MOISTURE_SENSOR_PIN = A0;
const int BH1750_ADDR_PIN = D3;
const int MOSFET_PIN = D5;  // Controls RST-D0 connection via MOSFET

// I2C pins
const int SDA_PIN = D2;
const int SCL_PIN = D1;

// Sensor objects
Adafruit_BME280 bme;
BH1750 lightMeter;
Adafruit_INA219 ina219;

// Battery Shield voltage thresholds (measuring regulated 3V output)
const float OUTPUT_NOMINAL = 3.0;    // Nominal output voltage
const float OUTPUT_MIN = 2.7;        // Minimum acceptable voltage
const float OUTPUT_MAX = 3.3;        // Maximum expected voltage

// Function prototypes
bool initializeSensors();
void readSensorData(float &temperature, float &humidity, float &pressure, float &light, int &moisture);
bool sendDataToGateway(float temperature, float humidity, float pressure, float light, int moisture);
float getBatteryLevel();
void goToSleep();
bool checkForFirmwareUpdate();
void enterUpdateMode();
void exitUpdateMode();
void performUpdate(String firmwareUrl);
void sendUpdateStatus(bool success, String message);

// Variables for OTA update
bool updateMode = false;
String updateUrl = "";

void setup() {
  Serial.begin(115200);
  Serial.println("\n\nAgriNode Sensor Node Starting...");
  Serial.print("Current firmware version: ");
  Serial.println(FIRMWARE_VERSION);

  // Initialize MOSFET pin for RST-D0 control
  pinMode(MOSFET_PIN, OUTPUT);
  digitalWrite(MOSFET_PIN, LOW); // Keep RST-D0 connected initially

  // Configure BH1750 ADDR pin
  pinMode(BH1750_ADDR_PIN, OUTPUT);
  digitalWrite(BH1750_ADDR_PIN, HIGH);  // Set address pin high
  
  // Initialize I2C with the specified pins
  Wire.begin(SDA_PIN, SCL_PIN);
  
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

  // Configure ArduinoOTA
  String hostname = "AgriNode-" + String(SENSOR_ID);
  ArduinoOTA.setHostname(hostname.c_str());
  
  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else {  // U_FS
      type = "filesystem";
    }
    Serial.println("Start updating " + type);
  });
  
  ArduinoOTA.onEnd([]() {
    Serial.println("\nUpdate End");
  });
  
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });

  ArduinoOTA.begin();
  
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
  
  // Send data to gateway
  if (!sendDataToGateway(temperature, humidity, pressure, light, moisture)) {
    Serial.println("Failed to send data to gateway. Going to sleep to retry.");
    goToSleep();
    return;
  }
  
  Serial.println("Data sent successfully.");
  
  // Check for firmware updates
  Serial.println("Checking for firmware updates...");
  if (checkForFirmwareUpdate()) {
    Serial.println("Update available, starting update process...");
    enterUpdateMode();
    performUpdate(updateUrl);
    // Note: If update is successful, device will restart automatically
    // If update fails, we continue to sleep
    exitUpdateMode();
  } else {
    Serial.println("No firmware update available.");
  }
  
  Serial.println("Going to sleep...");
  goToSleep();
}

void loop() {
  // Handle OTA updates
  ArduinoOTA.handle();
  
  // Give WiFi and background tasks some processing time
  delay(1);
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
  
  // Initialize INA219
  if (!ina219.begin()) {
    Serial.println("Could not find a valid INA219 sensor, check wiring!");
    success = false;
  } else {
    // Kalibriere den INA219 für präzise 3V Messungen
    // Verwende die 16V Range mit 400mA für beste Auflösung
    ina219.setCalibration_16V_400mA();
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

float getBatteryLevel() {
  float busVoltage = ina219.getBusVoltage_V();
  float shuntVoltage = ina219.getShuntVoltage_mV() / 1000.0;
  float outputVoltage = busVoltage + shuntVoltage;
  float batteryPercentage;
  
  // Berechne den Batterieprozentsatz basierend auf der 3V Ausgangsspannung
  // Wenn die Spannung unter OUTPUT_MIN fällt, deutet das auf eine schwache Batterie hin
  if (outputVoltage >= OUTPUT_NOMINAL) {
    batteryPercentage = 100.0;
  } else if (outputVoltage <= OUTPUT_MIN) {
    batteryPercentage = 0.0;
  } else {
    // Lineare Interpolation zwischen OUTPUT_MIN und OUTPUT_NOMINAL
    batteryPercentage = (outputVoltage - OUTPUT_MIN) / (OUTPUT_NOMINAL - OUTPUT_MIN) * 100.0;
  }

  Serial.print("Output Voltage: "); 
  Serial.print(outputVoltage); 
  Serial.println(" V");
  Serial.print("Bus Voltage: "); 
  Serial.print(busVoltage); 
  Serial.println(" V");
  Serial.print("Shunt Voltage: "); 
  Serial.print(shuntVoltage * 1000); 
  Serial.println(" mV");
  Serial.print("Battery Level: "); 
  Serial.print(batteryPercentage); 
  Serial.println("%");
  
  return batteryPercentage;
}

bool sendDataToGateway(float temperature, float humidity, float pressure, float light, int moisture) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send data: WiFi not connected");
    return false;
  }
  
  // Get battery level
  float batteryLevel = getBatteryLevel();
  
  // Create JSON document for sensor data
  DynamicJsonDocument doc(256);
  doc["sensor_id"] = SENSOR_ID;
  doc["timestamp"] = ""; // Server will set the timestamp
  doc["air_temperature"] = temperature;
  doc["air_humidity"] = humidity;
  doc["soil_moisture"] = moisture;
  doc["brightness"] = light;
  doc["battery_level"] = batteryLevel;
  
  // Serialize JSON to string
  String jsonData;
  serializeJson(doc, jsonData);
  
  // Create HTTP client
  WiFiClient client;
  HTTPClient http;
  
  // Send sensor data
  String sensorDataUrl = String(API_BASE_URL) + SENSOR_DATA_ENDPOINT;
  Serial.println("Sending sensor data to: " + sensorDataUrl);
  
  http.begin(client, sensorDataUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + API_KEY);
  
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode == 201) {
    Serial.println("Sensor data sent successfully");
    http.end();
    return true;
  } else {
    Serial.print("Failed to send sensor data. HTTP Error: ");
    Serial.println(httpResponseCode);
    Serial.println(http.getString());
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

bool checkForFirmwareUpdate() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot check for updates: WiFi not connected");
    return false;
  }

  // Create HTTP client
  WiFiClient client;
  HTTPClient http;

  // Build the update check URL
  String updateCheckUrl = String(API_BASE_URL) + FIRMWARE_ENDPOINT + "/check-update?currentVersion=" + FIRMWARE_VERSION;
  Serial.println("Checking for updates at: " + updateCheckUrl);

  // Begin HTTP request to check for updates
  http.begin(client, updateCheckUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + API_KEY);
  
  Serial.println("Sending update check request...");
  int httpResponseCode = http.GET();
  
  Serial.print("HTTP Response code: ");
  Serial.println(httpResponseCode);

  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Response: " + response);

    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, response);

    if (error) {
      Serial.print("JSON parsing failed: ");
      Serial.println(error.c_str());
      http.end();
      return false;
    }

    bool success = doc["success"].as<bool>();
    if (!success) {
      Serial.println("Update check was not successful");
      http.end();
      return false;
    }

    if (doc["data"]["updateAvailable"].as<bool>()) {
      updateUrl = String(API_BASE_URL) + doc["data"]["updateUrl"].as<const char*>();
      Serial.println("Firmware update available at: " + updateUrl);
      http.end();
      return true;
    } else {
      Serial.println("No firmware update available");
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  return false;
}

void enterUpdateMode() {
  updateMode = true;
  Serial.println("Entering update mode...");
}

void exitUpdateMode() {
  updateMode = false;
  Serial.println("Exiting update mode...");
}

void performUpdate(String firmwareUrl) {
  if (WiFi.status() != WL_CONNECTED) {
    sendUpdateStatus(false, "WiFi not connected");
    return;
  }

  Serial.println("Downloading firmware from: " + firmwareUrl);

  // Create HTTP client for firmware download
  WiFiClient client;
  HTTPClient http;

  http.begin(client, firmwareUrl);
  http.addHeader("Authorization", String("Bearer ") + API_KEY);
  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    // Get update size and start OTA process
    int contentLength = http.getSize();
    if (contentLength <= 0) {
      sendUpdateStatus(false, "Invalid firmware size");
      http.end();
      return;
    }

    Serial.printf("Firmware size: %d bytes\n", contentLength);
    
    // Start OTA update
    if (!Update.begin(contentLength)) {
      sendUpdateStatus(false, "Not enough space for update");
      http.end();
      return;
    }

    // Create buffer for firmware chunks
    uint8_t buff[128] = { 0 };
    WiFiClient* stream = http.getStreamPtr();
    size_t written = 0;

    // Write firmware in chunks
    while (http.connected() && written < contentLength) {
      size_t availableSize = stream->available();
      if (availableSize) {
        size_t readBytes = stream->readBytes(buff, min((size_t)128, availableSize));
        if (Update.write(buff, readBytes) != readBytes) {
          sendUpdateStatus(false, "Write error during update");
          http.end();
          return;
        }
        written += readBytes;
        Serial.printf("Progress: %d%%\n", (written * 100) / contentLength);
      }
      delay(1); // Give some time to background tasks
    }

    if (written == contentLength && Update.end(true)) {
      sendUpdateStatus(true, "Update successful");
      Serial.println("Update complete. Rebooting...");
      delay(1000);
      ESP.restart();
    } else {
      sendUpdateStatus(false, "Update failed");
    }
  } else {
    Serial.printf("Firmware download failed, code: %d\n", httpResponseCode);
    sendUpdateStatus(false, "Failed to download firmware");
  }

  http.end();
}

void sendUpdateStatus(bool success, String message) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  // Create HTTP client
  WiFiClient client;
  HTTPClient http;

  String updateStatusUrl = String(API_BASE_URL) + FIRMWARE_ENDPOINT + "/update-status";
  http.begin(client, updateStatusUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + API_KEY);

  DynamicJsonDocument doc(256);
  doc["sensor_id"] = SENSOR_ID;
  doc["success"] = success;
  doc["message"] = message;
  doc["version"] = success ? doc["new_version"] : FIRMWARE_VERSION;

  String jsonData;
  serializeJson(doc, jsonData);

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode == 200) {
    Serial.println("Update status sent successfully");
  } else {
    Serial.printf("Failed to send update status, code: %d\n", httpResponseCode);
  }

  http.end();
}