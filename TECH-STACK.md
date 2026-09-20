# TECH STACK — GuestLink Smart Hospitality Platform

## 1. Architecture

Recommended architecture:

Frontend / Full-stack web:
- Next.js
- React
- TypeScript
- Tailwind CSS

Backend:
- Next.js Route Handlers for MVP APIs
- Server Actions where appropriate
- Separate NestJS service only when backend complexity requires it

Database:
- PostgreSQL
- Prisma ORM

Authentication:
- Auth.js or Clerk
- Prefer Auth.js if maximum control and vendor independence are required.

Validation:
- Zod

UI:
- Tailwind CSS
- shadcn/ui
- Radix UI primitives

Icons:
- Lucide React

Animation:
- Motion for React
- CSS transitions for simple interactions

Testing:
- Playwright
- Vitest

Linting/formatting:
- ESLint
- Prettier

Package manager:
- pnpm

---

# 2. Frontend

## Next.js

Use:
- App Router
- Server Components by default
- Client Components only where interaction/state is required
- Route handlers for API endpoints
- Dynamic routes for restaurant pages

Suggested structure:

src/
  app/
    (public)/
      r/
        [restaurantSlug]/
          page.tsx
          menu/
          feedback/
          wifi/
          rewards/
          game/
    admin/
    api/
  components/
    ui/
    guest/
    admin/
  features/
    restaurant/
    guest-actions/
    feedback/
    analytics/
    auth/
  lib/
    db/
    auth/
    validation/
    analytics/
  hooks/
  types/

---

# 3. Styling

Tailwind CSS.

Design tokens:

--background: #FFFFFF
--foreground: #0F172A
--muted: #64748B
--primary: #0F766E
--border: #E2E8F0
--surface: #F8FAFC
--success: #16A34A
--warning: #D97706
--destructive: #DC2626

Restaurant-specific theme variables should be injected dynamically.

Do not hard-code brand colors throughout components.

---

# 4. Component System

Use shadcn/ui + Radix primitives for:
- Button
- Dialog
- Sheet
- Dropdown
- Input
- Textarea
- Select
- Toast
- Tooltip
- Tabs
- Card

Custom product components:
- RestaurantHeader
- GuestActionCard
- GuestActionList
- SocialLinks
- WifiCard
- FeedbackForm
- RewardCard
- GameLauncher
- RestaurantTheme
- QRPreview
- AdminActionEditor
- AnalyticsCard

---

# 5. Animation

Primary:
- Motion for React

Use animation for:
- Page entrance
- Action card stagger
- Modal/sheet transitions
- Press feedback
- Success states

Avoid:
- Excessive parallax
- Continuous animations
- Large layout shifts
- Animation on every element

Respect:
`prefers-reduced-motion`

---

# 6. Backend

For MVP use Next.js Route Handlers.

Example:

app/api/restaurants/[id]/route.ts
app/api/restaurants/[id]/actions/route.ts
app/api/restaurants/[id]/feedback/route.ts
app/api/analytics/events/route.ts

If the application grows into a large multi-service platform, migrate domain-heavy backend services to NestJS.

Do not introduce NestJS on day one unless the project genuinely requires it.

---

# 7. Database

PostgreSQL.

ORM:
Prisma

Core tables:

User
Restaurant
RestaurantMember
GuestAction
Customer
LoyaltyProgram
LoyaltyMilestone
LoyaltyWallet
LoyaltyCheckoutSession
LoyaltyStampTransaction
LoyaltyReward
WifiConfig
SocialLink
Feedback
AnalyticsEvent

Suggested relationship:

User
  └── RestaurantMember
        └── Restaurant
              ├── GuestAction
              ├── WifiConfig
              ├── SocialLink
              ├── Feedback
              └── AnalyticsEvent

Use UUID/CUID identifiers.

Use database indexes for:
- Restaurant slug
- Restaurant ID
- Analytics event type
- Analytics createdAt
- Feedback restaurantId
- GuestAction restaurantId + displayOrder

---

# 8. Multi-Tenant Security

Every restaurant-owned record must be scoped by restaurantId.

Never trust a client-provided restaurantId.

Authorization flow:

request
→ authenticate user
→ identify membership
→ verify restaurant access
→ execute operation

Roles:

PLATFORM_ADMIN
OWNER
MANAGER
STAFF

Guests require no account for public guest pages.

---

# 9. Authentication

Recommended:
Auth.js

Requirements:
- Secure sessions
- Password hashing if credentials authentication is used
- OAuth optional
- Session expiration
- Secure cookies
- Role checks
- Protected admin routes

Never store plaintext passwords.

---

# 10. Validation

Zod schemas for:
- Authentication
- Restaurant updates
- Guest actions
- Feedback
- Wi-Fi configuration
- Social links
- Analytics events

Validate:
- String length
- URL format
- Enum values
- IDs
- Optional fields
- Uploaded file metadata

---

# 11. File Storage

For restaurant:
- Logo
- Cover image
- Menu PDF/images

Recommended:
- Cloudflare R2 or Google Cloud Storage

Do not store large binary files directly in PostgreSQL.

Use:
- Signed upload URLs
- MIME validation
- File size limits
- Image dimension limits
- Filename sanitization

---

# 12. Analytics

MVP:
Custom AnalyticsEvent table.

Later optional:
- PostHog
- Plausible
- Google Analytics

Avoid sending unnecessary personal information.

Track anonymous sessions rather than personally identifying guests.

---

# 13. QR Codes

Library:
- `qrcode`

Two QR concepts are required.

1. Public guest QR

Used for the main restaurant guest hub:

https://app.example.com/r/{restaurantSlug}

2. Checkout loyalty QR

A short-lived, one-time token generated for a qualifying checkout.

Example:

https://app.example.com/loyalty/claim/{token}

Checkout tokens must:
- Expire quickly
- Be single-use
- Be restaurant-scoped
- Be validated server-side
- Be protected against replay
- Never contain customer PII

Optional source values for public QR:
- qr
- nfc
- direct
- campaign

---

# 14. Wi-Fi

Store Wi-Fi data securely.

Possible display:
Network: RestaurantGuest
Password: ********

Allow guest to:
- Reveal password
- Copy password

Optional:
Generate Wi-Fi configuration QR payload.

Never expose Wi-Fi configuration through search engine indexing.

---

# 15. Feedback

Feedback API must have:
- Rate limiting
- Input validation
- Spam protection
- Length limits

Recommended:
- Honeypot field
- IP-based rate limiting
- Optional CAPTCHA if abuse occurs

Do not require a guest account for anonymous feedback.

---

# 16. Rate Limiting

Recommended:
Upstash Redis

Use for:
- Login
- Feedback submission
- Analytics ingestion
- Public API endpoints

---

# 17. Caching

Use Next.js caching/revalidation for public restaurant configuration.

Possible strategy:
- Cache public restaurant page
- Revalidate after admin changes
- Do not cache sensitive admin data publicly

---

# 18. Deployment

## Vercel

Primary application deployment:
- Next.js frontend
- Route handlers
- Server-side rendering
- Preview deployments

Set:
- Production
- Preview
- Development

environment variables separately.

## Netlify

Use Netlify for:
- Marketing website
- Documentation
- Static promotional site

Do not create two independent production runtimes for the same application unless there is a documented architectural reason.

---

# 19. Database Hosting

Recommended options:
- Neon
- Supabase PostgreSQL
- Railway PostgreSQL

Preferred architecture:
Vercel
→ PostgreSQL
→ Object Storage

---

# 20. Environment Variables

`.env.local`

Example:

DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

Public variables must use:
`NEXT_PUBLIC_`

Never put secrets in:
- React components
- client-side environment variables
- Git
- README files
- screenshots
- logs

---

# 21. Development Tools

Required:
- Node.js LTS
- pnpm
- Git
- VS Code / Antigravity
- Docker optional for local PostgreSQL/Redis

Commands:

pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

---

# 22. Testing Stack

Unit:
Vitest

Component:
React Testing Library

E2E:
Playwright

Critical E2E flows:
1. Guest opens restaurant page.
2. Guest opens menu.
3. Guest opens Wi-Fi.
4. Guest copies Wi-Fi password.
5. Guest submits feedback.
6. Guest opens Google review.
7. Guest opens game.
8. Guest opens social link.
9. Customer scans a valid loyalty checkout QR.
10. First scan creates a wallet and awards exactly one stamp.
11. Repeated scan of the same QR does not award another stamp.
12. Concurrent claim requests cannot create duplicate stamps.
13. Milestone reward unlocks at the configured threshold.
14. Reward redemption is authorized and recorded.
15. Admin logs in.
16. Admin updates branding.
17. Admin creates action.
18. Admin configures loyalty milestones.
19. Admin creates a checkout loyalty session.
20. Admin reorders actions.
21. Unauthorized admin access is rejected.

---

# 23. CI/CD

Recommended GitHub Actions pipeline:

Pull Request:
- Install dependencies
- Lint
- Type-check
- Unit tests
- Build
- Playwright smoke tests

Production:
- Merge to main
- Vercel deployment
- Database migration check
- Post-deployment smoke test

---

# 24. Git Strategy

Branches:

main
develop
feature/*
fix/*
chore/*

Commit style:

feat:
fix:
refactor:
test:
docs:
chore:

Do not commit:
- `.env`
- secrets
- generated credentials
- production database dumps

---

# 25. Security Headers

Configure:
- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Frame restrictions as appropriate

---

# 26. Performance Targets

Public guest page:
- Lighthouse Performance: 90+
- LCP: target < 2.5s
- CLS: < 0.1
- INP: target < 200ms

Optimize:
- Images
- Fonts
- JavaScript
- Third-party scripts
- Animation
- Database queries

---

# 27. Recommended Dependencies

Core:
- next
- react
- react-dom
- typescript

UI:
- tailwindcss
- lucide-react
- motion
- clsx
- tailwind-merge

Components:
- shadcn/ui
- radix-ui

Backend:
- prisma
- @prisma/client
- zod

Auth:
- next-auth / Auth.js

Testing:
- vitest
- @testing-library/react
- @playwright/test

Utilities:
- qrcode
- date-fns

Optional:
- @upstash/redis
- @upstash/ratelimit

---

# 28. Architecture Decision

Start as a modular Next.js monolith.

Do NOT start with microservices.

Reason:
- Faster development
- Lower deployment complexity
- Easier debugging
- Lower infrastructure cost
- Excellent fit for MVP
- Can extract services later

Suggested evolution:

Phase 1:
Next.js + PostgreSQL + Prisma + frictionless stamp-card loyalty

Phase 2:
Next.js + PostgreSQL + Redis + object storage + POS integrations

Phase 3:
Next.js + NestJS services + queues + event infrastructure

---

# 29. Antigravity Rules

Antigravity must:

1. Read PRD.md first.
2. Read TECH-STACK.md second.
3. Inspect the existing repository.
4. Never overwrite existing working functionality without inspection.
5. Create an implementation plan before large changes.
6. Ask for clarification only when a missing decision blocks implementation.
7. Use TypeScript strict mode.
8. Avoid `any`.
9. Use reusable components.
10. Keep public and admin code separated.
11. Validate all input.
12. Never expose secrets.
13. Never use emojis.
14. Use Lucide icons.
15. Use Motion for purposeful animation.
16. Support reduced motion.
17. Write tests for important behavior.
18. Run lint/typecheck/tests/build after meaningful changes.
19. Report exact files changed.
20. Report exact commands executed.
21. Report exact errors when something fails.
22. Never claim success without verification.

---

# 30. Final Deployment Model

Recommended:

                ┌──────────────────────┐
                │      Guest/User      │
                └──────────┬───────────┘
                           │
                      QR / NFC
                           │
                           ▼
                ┌──────────────────────┐
                │       Vercel         │
                │      Next.js App     │
                └──────────┬───────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        PostgreSQL      Object Store   Redis
        Database        Images/Menu    Rate Limit

                ┌──────────────────────┐
                │       Netlify       │
                │ Marketing / Docs    │
                └──────────────────────┘

This separation keeps the primary application on Vercel while still satisfying the Vercel + Netlify deployment requirement.
