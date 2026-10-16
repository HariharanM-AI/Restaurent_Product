import { describe, it, expect } from "vitest";
import { toHref } from "@/components/guest/social-footer";

describe("Guest social buttons only use admin-entered links", () => {
  it("keeps http(s) links and adds https:// to bare domains", () => {
    expect(toHref("https://Hari_Cafe.com")).toBe("https://Hari_Cafe.com");
    expect(toHref("  instagram.com/hari_cafe ")).toBe("https://instagram.com/hari_cafe");
  });

  it("gives no link (button does nothing) for empty or unsafe values", () => {
    expect(toHref("")).toBeNull();
    expect(toHref("   ")).toBeNull();
    expect(toHref(null)).toBeNull();
    expect(toHref("javascript:alert(1)")).toBeNull();
    expect(toHref("@hari_cafe")).toBeNull();
  });
});
