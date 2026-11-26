import { useRef, useState } from "react";
import { Bluetooth, BluetoothOff, FileJson } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bluetoothSupported, connectBandage, parseDeviceJson, type DeviceReading } from "@/lib/bandage-ble";

export function BandageConnect({ onReading }: { onReading: (r: DeviceReading) => Promise<void> }) {
  const [device, setDevice] = useState<{ name: string; disconnect: () => void } | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handle(json: string) {
    try {
      const reading = parseDeviceJson(json);
      setLast(new Date().toLocaleTimeString());
      await onReading(reading);
    } catch (e) {
      toast.error(e instanceof Error ? `Bandage data not understood: ${e.message}` : "Bandage data not understood");
    }
  }

  async function connect() {
    if (!bluetoothSupported()) {
      toast.error("Bluetooth isn't available in this browser. Use Chrome on Android or a computer.");
      return;
    }
    try {
      const d = await connectBandage(handle, () => {
        setDevice(null);
        toast("Bandage disconnected");
      });
      setDevice(d);
      toast.success(`Connected to ${d.name}`);
    } catch (e) {
      if (e instanceof Error && e.name === "NotFoundError") return; // user closed picker
      toast.error(e instanceof Error ? e.message : "Could not connect");
    }
  }

  async function importFile(file: File) {
    const text = (await file.text()).trim();
    const items: unknown[] = text.startsWith("[") ? (JSON.parse(text) as unknown[]) : [JSON.parse(text)];
    for (const item of items) await handle(JSON.stringify(item));
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft" aria-label="Bandage connection">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Smart bandage</h2>
          <p className="text-sm text-muted-foreground">
            {device ? `Connected to ${device.name}${last ? ` · last data ${last}` : " · waiting for data"}` : "Not connected"}
          </p>
        </div>
        <div className="flex gap-2">
          {device ? (
            <Button variant="outline" className="rounded-full" onClick={() => device.disconnect()}>
              <BluetoothOff /> Disconnect
            </Button>
          ) : (
            <Button className="rounded-full" onClick={connect}>
              <Bluetooth /> Connect bandage
            </Button>
          )}
          <Button variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()}>
            <FileJson /> Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f).catch(() => toast.error("That file isn't valid bandage JSON."));
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </section>
  );
}
