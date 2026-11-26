// Vulnera bandage prototype — ESP32 (Arduino IDE). Sends JSON over BLE (Nordic UART).
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>
#define SERVICE_UUID "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define TX_UUID      "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
BLECharacteristic* tx; bool connected = false;
class CB : public BLEServerCallbacks {
  void onConnect(BLEServer*) { connected = true; }
  void onDisconnect(BLEServer* s) { connected = false; s->getAdvertising()->start(); }
};
void setup() {
  BLEDevice::init("Vulnera Bandage");
  BLEDevice::setMTU(185);
  BLEServer* server = BLEDevice::createServer(); server->setCallbacks(new CB());
  BLEService* svc = server->createService(SERVICE_UUID);
  tx = svc->createCharacteristic(TX_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  tx->addDescriptor(new BLE2902());
  svc->start();
  BLEAdvertising* adv = BLEDevice::getAdvertising(); adv->addServiceUUID(SERVICE_UUID); adv->start();
}
void loop() {
  if (connected) {
    // Replace these with your real sensor reads.
    float temp = 34.0 + random(0, 20) / 10.0, ph = 7.0 + random(0, 5) / 10.0;
    int moisture = 58 + random(0, 8), score = 80;
    char json[96];
    snprintf(json, sizeof(json), "{\"temp\":%.1f,\"ph\":%.1f,\"moisture\":%d,\"score\":%d}\n", temp, ph, moisture, score);
    tx->setValue((uint8_t*)json, strlen(json)); tx->notify();
  }
  delay(10000);
}
