# Bandage prototype → app (Bluetooth)
- BLE service (Nordic UART): 6e400001-b5a3-f393-e0a9-e50e24dcca9e
- Notify characteristic (TX): 6e400003-b5a3-f393-e0a9-e50e24dcca9e
- Device name should start with "Vulnera".
- Send one JSON object per line: {"temp":35.2,"ph":7.3,"moisture":62,"score":80}\n
- Works in Chrome/Edge on Android, Windows, Mac. Not on iPhone (Safari has no Web Bluetooth).
- "Import JSON" also accepts a .json file with one object or an array of objects.
