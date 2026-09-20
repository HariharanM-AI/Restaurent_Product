import { describe, it, expect } from "vitest";
import {
  feedbackSchema,
  restaurantUpdateSchema,
  guestActionSchema,
  wifiConfigSchema,
  loyaltyMilestoneSchema,
} from "@/lib/validation/schemas";

describe("Input Validation Schemas", () => {
  describe("feedbackSchema", () => {
    it("accepts valid feedback", () => {
      const valid = {
        rating: 5,
        category: "Food",
        message: "The wood-fired sourdough was incredible!",
        isAnonymous: true,
      };
      const res = feedbackSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects rating out of range", () => {
      const invalid = {
        rating: 6,
        message: "Great visit",
      };
      const res = feedbackSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("rejects honeypot populated submission", () => {
      const spambot = {
        rating: 5,
        message: "Spam message",
        website_hp: "http://spamsite.com",
      };
      const res = feedbackSchema.safeParse(spambot);
      expect(res.success).toBe(false);
    });

    it("rejects empty message", () => {
      const invalid = {
        rating: 4,
        message: "",
      };
      const res = feedbackSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("restaurantUpdateSchema", () => {
    it("accepts valid hex colors and properties", () => {
      const valid = {
        name: "Barlow & Fields",
        primaryColor: "#0F766E",
        secondaryColor: "#F8FAFC",
      };
      const res = restaurantUpdateSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects invalid hex colors", () => {
      const invalid = {
        primaryColor: "not-a-color",
      };
      const res = restaurantUpdateSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("guestActionSchema", () => {
    it("accepts valid action item", () => {
      const valid = {
        title: "View Menu",
        type: "MENU",
        icon: "UtensilsCrossed",
        url: "/r/barlow/menu",
        enabled: true,
      };
      const res = guestActionSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects missing title or icon", () => {
      const invalid = {
        title: "",
        icon: "",
      };
      const res = guestActionSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("wifiConfigSchema", () => {
    it("accepts valid SSID and password", () => {
      const valid = {
        ssid: "Barlow_Guest",
        password: "secretpassword",
        enabled: true,
      };
      const res = wifiConfigSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });

  describe("loyaltyMilestoneSchema", () => {
    it("validates threshold and reward details", () => {
      const valid = {
        stampRequirement: 5,
        rewardTitle: "Free Specialty Beverage",
        validityDays: 30,
      };
      const res = loyaltyMilestoneSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });
});
