import { describe, expect, it } from "vitest";
import { parseDeviceJson } from "@/lib/bandage-ble";
describe("parseDeviceJson", () => {
  it("reads the prototype JSON", () => {
    expect(parseDeviceJson('{"temp":35.2,"ph":7.3,"moisture":62,"score":80}')).toEqual({ tempC: 35.2, ph: 7.3, moisture: 62, healingScore: 80 });
  });
  it("rejects missing values", () => {
    expect(() => parseDeviceJson('{"temp":35}')).toThrow();
  });
});
