export type Role = "PLATFORM_ADMIN" | "OWNER" | "MANAGER" | "STAFF";

export type ActionType =
  | "MENU"
  | "REWARDS"
  | "REVIEW"
  | "WIFI"
  | "FEEDBACK"
  | "GAME"
  | "SOCIAL"
  | "CUSTOM";

export type SocialPlatform =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "TIKTOK"
  | "X"
  | "YOUTUBE"
  | "WEBSITE";

export type RestaurantStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type LoyaltyTransactionType =
  | "STAMP_EARNED"
  | "STAMP_REVERSED"
  | "MILESTONE_UNLOCKED"
  | "REWARD_REDEEMED"
  | "REWARD_EXPIRED";

export type CheckoutSessionStatus = "ACTIVE" | "CONSUMED" | "EXPIRED" | "CANCELLED";

export type RewardStatus = "AVAILABLE" | "REDEEMED" | "EXPIRED";

export interface RestaurantData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  tagline?: string | null;
  primaryColor: string;
  secondaryColor: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  openingHours?: string | null;
  googleMapsUrl?: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GuestActionData {
  id: string;
  restaurantId: string;
  type: string;
  title: string;
  description?: string | null;
  icon: string;
  url?: string | null;
  enabled: boolean;
  displayOrder: number;
  badge?: string | null;
  metadata?: string | null;
}

export interface WifiConfigData {
  id: string;
  restaurantId: string;
  ssid: string;
  password?: string;
  enabled: boolean;
  instructions?: string | null;
}

export interface SocialLinkData {
  id: string;
  restaurantId: string;
  platform: string;
  url: string;
  enabled: boolean;
  displayOrder: number;
}

export interface LoyaltyMilestoneData {
  id: string;
  loyaltyProgramId: string;
  stampRequirement: number;
  rewardTitle: string;
  rewardDescription?: string | null;
  validityDays: number;
  enabled: boolean;
  displayOrder: number;
}

export interface LoyaltyWalletData {
  id: string;
  restaurantId: string;
  customerId?: string | null;
  anonymousBrowserId: string;
  status: string;
  currentStamps: number;
  totalLifetimeStamps: number;
  unlockedRewards: LoyaltyRewardData[];
  nextMilestone?: LoyaltyMilestoneData | null;
  stampsNeededForNext?: number;
  milestones?: LoyaltyMilestoneData[];
}

export interface LoyaltyRewardData {
  id: string;
  restaurantId: string;
  walletId: string;
  milestoneId: string;
  rewardTitle: string;
  rewardDescription?: string | null;
  status: string;
  unlockedAt: Date | string;
  redeemedAt?: Date | string | null;
  expiresAt?: Date | string | null;
}

export interface GuestHubBundle {
  restaurant: RestaurantData;
  actions: GuestActionData[];
  wifi?: WifiConfigData | null;
  socialLinks: SocialLinkData[];
  loyaltyProgram?: {
    enabled: boolean;
    name: string;
    milestones: LoyaltyMilestoneData[];
  } | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
