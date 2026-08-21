// =============================================================
//  AI-Driven IoT Smart Remote Patient Monitoring System
//  Firmware for NodeMCU ESP8266 + MAX30102
//  Author: Madhusri Project
//  Board : NodeMCU 1.0 (ESP-12E Module)
// =============================================================

// ── Libraries ────────────────────────────────────────────────
#include <Wire.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include "MAX30105.h"       // SparkFun MAX3010x library
#include "spo2_algorithm.h" // SparkFun SpO2 algorithm
#include "heartRate.h"      // SparkFun beat-detection

// ── USER CONFIG — edit these before flashing ─────────────────
const char* WIFI_SSID       = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD   = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL     = "http://192.168.1.100:5000/api/vitals"; // Flask server IP

// Blynk (secondary / backup alert channel)
#define BLYNK_PRINT Serial
#include <BlynkSimpleEsp8266.h>
const char* BLYNK_AUTH     = "YOUR_BLYNK_AUTH_TOKEN";

// ── Threshold Constants ───────────────────────────────────────
const int   HR_HIGH         = 100;   // bpm
const int   HR_LOW          = 50;    // bpm
const float SPO2_LOW        = 92.0;  // %

// ── Timing Constants ─────────────────────────────────────────
const unsigned long SEND_INTERVAL    = 2000;  // ms between transmissions
const unsigned long ALERT_COOLDOWN   = 60000; // ms between push notifications
const unsigned long WIFI_RETRY_DELAY = 5000;  // ms between Wi-Fi reconnect attempts

// ── Blynk Virtual Pins ────────────────────────────────────────
#define VPIN_HR     V0
#define VPIN_SPO2   V1
#define VPIN_STATUS V2

// ── MAX30102 Object ───────────────────────────────────────────
MAX30105 particleSensor;

// ── SpO2 / HR Buffers (SparkFun algorithm needs 100 samples) ──
const byte BUFFER_LENGTH = 100;
uint32_t irBuffer[BUFFER_LENGTH];
uint32_t redBuffer[BUFFER_LENGTH];

int32_t  spo2Raw    = 0;
int8_t   spo2Valid  = 0;
int32_t  heartRate  = 0;
int8_t   hrValid    = 0;

// ── Moving-Average Smoothing ──────────────────────────────────
const byte MA_SIZE = 5;
float hrHistory[MA_SIZE]   = {0};
float spo2History[MA_SIZE] = {0};
byte  maIndex = 0;
bool  bufferFull = false;

float smoothedHR   = 0.0;
float smoothedSpO2 = 0.0;

// ── Timing State ─────────────────────────────────────────────
unsigned long lastSendTime  = 0;
unsigned long lastAlertTime = 0;

// ── IR threshold for finger detection ────────────────────────
const long IR_THRESHOLD = 50000;

// =============================================================
//  SETUP
// =============================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n[BOOT] Smart Patient Monitor starting...");

  initSensor();
  connectWiFi();
  Blynk.config(BLYNK_AUTH);
  Blynk.connect(3000); // non-blocking timeout 3s

  Serial.println("[BOOT] System ready. Monitoring...");
}

// =============================================================
//  MAIN LOOP
// =============================================================
void loop() {
  Blynk.run();
  maintainWiFi();
  collectSamples();

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer, BUFFER_LENGTH, redBuffer,
    &spo2Raw, &spo2Valid, &heartRate, &hrValid
  );

  bool fingerDetected = (irBuffer[BUFFER_LENGTH - 1] > IR_THRESHOLD);

  if (fingerDetected && hrValid && spo2Valid && heartRate > 20 && heartRate < 250) {
    applyMovingAverage((float)heartRate, (float)spo2Raw);
  } else {
    Serial.println("[SENSOR] Waiting for valid finger placement...");
    return;
  }

  String status = checkThresholds(smoothedHR, smoothedSpO2);

  Serial.printf("[VITALS] HR: %.0f bpm | SpO2: %.1f%% | Status: %s\n",
                smoothedHR, smoothedSpO2, status.c_str());

  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    String timestamp = getTimestamp();

    sendToBackend(timestamp, smoothedHR, smoothedSpO2, status);

    Blynk.virtualWrite(VPIN_HR,     smoothedHR);
    Blynk.virtualWrite(VPIN_SPO2,   smoothedSpO2);
    Blynk.virtualWrite(VPIN_STATUS, status);

    if (status == "CRITICAL" && (now - lastAlertTime >= ALERT_COOLDOWN)) {
      lastAlertTime = now;
      String alertMsg = "Alert: Abnormal Vitals — HR: " +
                        String((int)smoothedHR) + " bpm, SpO2: " +
                        String(smoothedSpO2, 1) + "%";
      Blynk.logEvent("critical_alert", alertMsg);
      Serial.println("[ALERT] " + alertMsg);
    }
  }
}

// =============================================================
//  SENSOR INITIALIZATION (with retry)
// =============================================================
void initSensor() {
  Serial.println("[SENSOR] Initialising MAX30102...");
  Wire.begin(D2, D1); // SDA=D2(GPIO4), SCL=D1(GPIO5)

  while (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[SENSOR] ERROR: MAX30102 not found. Retrying in 2s...");
    delay(2000);
  }

  byte ledBrightness = 60;
  byte sampleAverage = 4;
  byte ledMode       = 2;    // Red + IR
  int  sampleRate    = 100;
  int  pulseWidth    = 411;
  int  adcRange      = 4096;

  particleSensor.setup(ledBrightness, sampleAverage, ledMode,
                       sampleRate, pulseWidth, adcRange);
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);

  Serial.println("[SENSOR] MAX30102 initialised successfully.");
}

// =============================================================
//  COLLECT 100 SAMPLES (sliding window — shift 25, read 25)
// =============================================================
void collectSamples() {
  for (byte i = 25; i < BUFFER_LENGTH; i++) {
    redBuffer[i - 25] = redBuffer[i];
    irBuffer[i - 25]  = irBuffer[i];
  }
  for (byte i = 75; i < BUFFER_LENGTH; i++) {
    while (!particleSensor.available()) particleSensor.check();
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i]  = particleSensor.getIR();
    particleSensor.nextSample();
  }
}

// =============================================================
//  MOVING AVERAGE SMOOTHING
// =============================================================
void applyMovingAverage(float hr, float spo2) {
  hrHistory[maIndex]   = hr;
  spo2History[maIndex] = spo2;
  maIndex = (maIndex + 1) % MA_SIZE;
  if (maIndex == 0) bufferFull = true;

  byte count = bufferFull ? MA_SIZE : maIndex;
  float hrSum = 0, spo2Sum = 0;
  for (byte i = 0; i < count; i++) {
    hrSum   += hrHistory[i];
    spo2Sum += spo2History[i];
  }
  smoothedHR   = hrSum   / count;
  smoothedSpO2 = spo2Sum / count;
}

// =============================================================
//  THRESHOLD-BASED ANOMALY DETECTION
// =============================================================
String checkThresholds(float hr, float spo2) {
  if (hr > HR_HIGH || hr < HR_LOW || spo2 < SPO2_LOW) {
    return "CRITICAL";
  }
  return "NORMAL";
}

// =============================================================
//  WI-FI CONNECTION
// =============================================================
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Connection FAILED — will retry in loop.");
  }
}

void maintainWiFi() {
  static unsigned long lastRetry = 0;
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastRetry >= WIFI_RETRY_DELAY) {
      lastRetry = now;
      Serial.println("[WiFi] Reconnecting...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }
}

// =============================================================
//  SEND DATA TO FLASK BACKEND
// =============================================================
void sendToBackend(String timestamp, float hr, float spo2, String status) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Skipping — WiFi not connected.");
    return;
  }
  WiFiClient client;
  HTTPClient http;
  http.begin(client, BACKEND_URL);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"timestamp\":\"" + timestamp +
                   "\",\"heart_rate\":" + String((int)hr) +
                   ",\"spo2\":" + String(spo2, 1) +
                   ",\"status\":\"" + status + "\"}";

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("[HTTP] POST → %d\n", httpCode);
  } else {
    Serial.printf("[HTTP] POST failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

// =============================================================
//  TIMESTAMP (millis-based — replace with NTP for real time)
// =============================================================
String getTimestamp() {
  unsigned long ms = millis();
  unsigned long s  = ms / 1000;
  unsigned long m  = s  / 60;
  unsigned long h  = m  / 60;
  char buf[24];
  snprintf(buf, sizeof(buf), "T+%02lu:%02lu:%02lu", h % 24, m % 60, s % 60);
  return String(buf);
}
