import { describe, it, expect } from "vitest";
import { generateWifiPayload, sanitizeString } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("generateWifiPayload", () => {
    it("formats standard WPA Wi-Fi payload", () => {
      const payload = generateWifiPayload("Barlow_Guest", "secretpass123");
      expect(payload).toBe("WIFI:S:Barlow_Guest;T:WPA;P:secretpass123;;");
    });

    it("formats open network without password", () => {
      const payload = generateWifiPayload("OpenDining", "");
      expect(payload).toBe("WIFI:S:OpenDining;T:nopass;P:;;");
    });

    it("escapes special characters in SSID and password", () => {
      const payload = generateWifiPayload("Cafe;Special:5G", "p@ss;word:1");
      expect(payload).toBe("WIFI:S:Cafe\\;Special\\:5G;T:WPA;P:p@ss\\;word\\:1;;");
    });
  });

  describe("sanitizeString", () => {
    it("strips HTML and script tags", () => {
      const dirty = "<script>alert('hack')</script>Great meal<b>!</b>";
      const clean = sanitizeString(dirty);
      expect(clean).toBe("alert('hack')Great meal!");
    });
  });
});
