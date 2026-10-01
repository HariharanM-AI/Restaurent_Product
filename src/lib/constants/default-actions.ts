import { ActionType } from "@prisma/client";

export interface DefaultActionDefinition {
  type: ActionType;
  title: string;
  description: string;
  icon: string;
  urlPattern: (slug: string) => string;
  displayOrder: number;
  badge?: string | null;
  enabled: boolean;
}

export const DEFAULT_QUICK_ACTIONS_TEMPLATE: DefaultActionDefinition[] = [
  {
    type: "REWARDS",
    title: "Start Earning Rewards",
    description: "Collect digital stamps with every checkout for complimentary rewards",
    icon: "Award",
    urlPattern: (slug: string) => `/r/${slug}/rewards`,
    displayOrder: 1,
    badge: "Loyalty",
    enabled: true,
  },
  {
    type: "REVIEW",
    title: "Leave a Google Review",
    description: "Share your culinary experience with the community",
    icon: "Star",
    urlPattern: () => "https://maps.google.com",
    displayOrder: 2,
    badge: "Feedback",
    enabled: true,
  },
  {
    type: "MENU",
    title: "View Menu",
    description: "Explore seasonal farm-to-table lunch, dinner, and cocktails",
    icon: "UtensilsCrossed",
    urlPattern: (slug: string) => `/r/${slug}/menu`,
    displayOrder: 3,
    badge: "Spring 2026",
    enabled: true,
  },
  {
    type: "WIFI",
    title: "Connect to Wi-Fi",
    description: "High-speed complimentary wireless internet for guests",
    icon: "Wifi",
    urlPattern: (slug: string) => `/r/${slug}/wifi`,
    displayOrder: 4,
    badge: null,
    enabled: true,
  },
  {
    type: "FEEDBACK",
    title: "Leave Anonymous Feedback",
    description: "Send direct, private feedback to our executive chef and managers",
    icon: "MessageSquarePlus",
    urlPattern: (slug: string) => `/r/${slug}/feedback`,
    displayOrder: 5,
    badge: null,
    enabled: true,
  },
  {
    type: "GAME",
    title: "Play Sudoku",
    description: "Enjoy a relaxing classic puzzle while waiting for your course",
    icon: "Gamepad2",
    urlPattern: (slug: string) => `/r/${slug}/game`,
    displayOrder: 6,
    badge: null,
    enabled: true,
  },
];

export function getDefaultGuestActions(restaurantId: string, slug: string) {
  return DEFAULT_QUICK_ACTIONS_TEMPLATE.map((action) => ({
    restaurantId,
    type: action.type,
    title: action.title,
    description: action.description,
    icon: action.icon,
    url: action.urlPattern(slug),
    displayOrder: action.displayOrder,
    badge: action.badge || null,
    enabled: action.enabled,
  }));
}
