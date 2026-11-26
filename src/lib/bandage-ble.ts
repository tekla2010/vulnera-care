/**
 * Bluetooth link to the Vulnera bandage prototype (Web Bluetooth, Chrome/Edge on Android & desktop).
 * The prototype advertises the Nordic UART service and sends one JSON object per line, e.g.
 * {"temp":35.2,"ph":7.3,"moisture":62,"score":80}\n
 */
export const BANDAGE_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
export const BANDAGE_TX_CHAR = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

export interface DeviceReading {
  tempC: number;
  ph: number;
  moisture: number;
  healingScore: number;
}

/** Parse one JSON message from the prototype. Accepts short or long key names. */
export function parseDeviceJson(text: string): DeviceReading {
  const raw = JSON.parse(text) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = raw[k];
      if (v !== undefined && v !== null && v !== "" && !Number.isNaN(Number(v))) return Number(v);
    }
    throw new Error(`Missing "${keys[0]}" in bandage data`);
  };
  return {
    tempC: pick("temp", "tempC", "temperature"),
    ph: pick("ph", "pH"),
    moisture: pick("moisture", "humidity"),
    healingScore: Math.round(pick("score", "healingScore", "healing_score")),
  };
}

/** Core values if the message has all four, otherwise null (the message is still logged). */
export function tryCoreReading(raw: Record<string, unknown>): DeviceReading | null {
  try {
    return parseDeviceJson(JSON.stringify(raw));
  } catch {
    return null;
  }
}

export const bluetoothSupported = () =>
  typeof navigator !== "undefined" && "bluetooth" in navigator;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function connectBandage(
  onMessage: (json: string) => void,
  onDisconnect: () => void,
): Promise<{ name: string; disconnect: () => void }> {
  const bt = (navigator as any).bluetooth;
  const device = await bt.requestDevice({
    filters: [{ services: [BANDAGE_SERVICE] }, { namePrefix: "Vulnera" }],
    optionalServices: [BANDAGE_SERVICE],
  });
  device.addEventListener("gattserverdisconnected", onDisconnect);
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(BANDAGE_SERVICE);
  const ch = await service.getCharacteristic(BANDAGE_TX_CHAR);
  const decoder = new TextDecoder();
  let buffer = "";
  ch.addEventListener("characteristicvaluechanged", (e: any) => {
    buffer += decoder.decode(e.target.value);
    let i: number;
    while ((i = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (line) onMessage(line);
    }
    // Also accept a full JSON object sent without a trailing newline.
    const t = buffer.trim();
    if (t.startsWith("{") && t.endsWith("}")) {
      buffer = "";
      onMessage(t);
    }
  });
  await ch.startNotifications();
  return { name: device.name ?? "Vulnera bandage", disconnect: () => device.gatt.disconnect() };
}
