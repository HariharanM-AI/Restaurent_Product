import { z } from "zod";

// Hex color regex (#RGB or #RRGGBB)
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.enum(["Food", "Service", "Ambiance", "Cleanliness", "Other"]).optional(),
  message: z.string().min(2, "Message must be at least 2 characters").max(1000, "Message cannot exceed 1000 characters"),
  contact: z.string().max(100).optional().nullable(),
  isAnonymous: z.boolean().default(true),
  // Anti-bot honeypot field: must be empty
  website_hp: z.string().max(0, "Spam detected").optional().or(z.literal("")),
  // Minimum time in ms from render to submit (prevent automated instant bots)
  submitDurationMs: z.number().optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const restaurantUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  tagline: z.string().max(200).optional().nullable(),
  logoUrl: z.string().max(2000).optional().nullable().or(z.literal("")),
  coverImageUrl: z.string().max(2000).optional().nullable().or(z.literal("")),
  primaryColor: z.string().regex(hexColorRegex, "Invalid primary hex color (e.g. #0F766E)").optional(),
  secondaryColor: z.string().regex(hexColorRegex, "Invalid secondary hex color (e.g. #F8FAFC)").optional(),
  themeMode: z.enum(["light", "dark"]).optional(),
  address: z.string().max(250).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().max(1000).optional().nullable().or(z.literal("")),
  openingHours: z.string().max(200).optional().nullable().or(z.literal("")),
  googleMapsUrl: z.string().max(1000).optional().nullable().or(z.literal("")),
  instagramUrl: z.string().max(1000).optional().nullable().or(z.literal("")),
  facebookUrl: z.string().max(1000).optional().nullable().or(z.literal("")),
});

export type RestaurantUpdateInput = z.infer<typeof restaurantUpdateSchema>;

export const guestActionSchema = z.object({
  type: z.enum(["MENU", "REWARDS", "REVIEW", "WIFI", "FEEDBACK", "GAME", "SOCIAL", "CUSTOM"]).default("CUSTOM"),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(200).optional().nullable(),
  icon: z.string().min(1, "Icon identifier is required").max(50),
  url: z.string().max(500).optional().nullable().or(z.literal("")),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  badge: z.string().max(30).optional().nullable(),
  metadata: z.string().optional().nullable(),
});

export type GuestActionInput = z.infer<typeof guestActionSchema>;

export const reorderActionsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "At least one action id is required"),
});

export const wifiConfigSchema = z.object({
  ssid: z.string().min(1, "SSID is required").max(64),
  password: z.string().max(64).optional().default(""),
  enabled: z.boolean().default(true),
  instructions: z.string().max(500).optional().nullable(),
});

export type WifiConfigInput = z.infer<typeof wifiConfigSchema>;

export const socialLinkSchema = z.object({
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "TIKTOK", "X", "YOUTUBE", "WEBSITE"]),
  url: z.string().url("Valid URL is required"),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

export const loyaltyCheckoutSessionSchema = z.object({
  validityMinutes: z.number().int().min(1).max(120).default(15),
});

export const claimLoyaltyTokenSchema = z.object({
  anonymousBrowserId: z.string().min(8, "Anonymous browser identifier is required"),
  customerContact: z.string().optional().nullable(),
  idempotencyKey: z.string().min(8, "Idempotency key is required"),
});

export const loyaltyMilestoneSchema = z.object({
  stampRequirement: z.number().int().min(1).max(100),
  rewardTitle: z.string().min(2).max(100),
  rewardDescription: z.string().max(300).optional().nullable(),
  validityDays: z.number().int().min(1).max(365).default(30),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export type LoyaltyMilestoneInput = z.infer<typeof loyaltyMilestoneSchema>;

export const analyticsEventSchema = z.object({
  restaurantId: z.string().min(1),
  eventType: z.enum([
    "guest_page_view",
    "menu_click",
    "rewards_click",
    "loyalty_open",
    "loyalty_stamp_earned",
    "loyalty_milestone_unlocked",
    "loyalty_reward_redeemed",
    "review_click",
    "wifi_open",
    "wifi_copy",
    "feedback_open",
    "feedback_submit",
    "game_open",
    "social_click",
  ]),
  actionId: z.string().optional().nullable(),
  anonymousSessionId: z.string().min(1),
  deviceCategory: z.enum(["mobile", "tablet", "desktop"]).optional(),
  referrer: z.string().max(500).optional().nullable(),
  source: z.enum(["qr", "nfc", "direct", "campaign"]).default("direct"),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
