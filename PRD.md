# PRD — Smart Hospitality QR/NFC Guest Experience Platform

## 1. Product Overview

### Working name
GuestLink — Smart Restaurant Guest Experience

### Product concept
A mobile-first web experience accessed from a physical restaurant table/card QR code or NFC touchpoint. The physical card acts as a gateway to a restaurant's digital guest hub.

The reference video shows a small branded table card with actions such as:
- Menu
- Rewards
- Wi-Fi
- Feedback

After opening the digital experience, the guest sees a branded restaurant profile and a vertically stacked action list including:
- Start earning rewards
- Leave a Google review
- View Menu
- Connect to Wi-Fi
- Leave Anonymous Feedback
- Play Sudoku
- Social media links

The goal is to reproduce this product experience while significantly improving the UI, motion, responsiveness, accessibility, and overall product polish.

### Product principle
Fast access first. A guest should be able to scan/tap and reach the required action in seconds without installing an app.

---

# 2. Product Goals

1. Provide a beautiful mobile-first digital guest hub.
2. Convert physical QR/NFC interactions into useful guest actions.
3. Make each restaurant/property independently configurable.
4. Support branded experiences without rebuilding the application.
5. Make common actions one tap away.
6. Add subtle, premium animations without reducing usability.
7. Provide an admin interface for restaurant owners/managers.
8. Make the system production-ready and deployable.
9. Maintain excellent performance on mobile networks.
10. Avoid emojis in the UI; use a consistent icon system.

---

# 3. Non-Goals for MVP

The MVP will NOT attempt to build:
- A complete POS system
- Full restaurant accounting
- A delivery marketplace
- A native iOS/Android application
- Complex loyalty accounting comparable to large enterprise CRM systems
- AI features
- Multi-vendor marketplace discovery
- Full reservation management

These can be considered later phases.

---

# 4. Target Users

## Primary user — Restaurant Guest
A customer sitting at or visiting a restaurant.

Needs:
- Menu
- Wi-Fi
- Rewards
- Feedback
- Review
- Social links
- Entertainment

## Secondary user — Restaurant Owner/Manager
Needs:
- Configure restaurant profile
- Configure guest actions
- Manage menu link
- Configure Wi-Fi information
- Manage rewards destination
- Configure review URL
- Configure feedback destination
- Manage social links
- View basic engagement analytics

## Tertiary user — Platform Administrator
Needs:
- Manage restaurant accounts
- Manage subscriptions
- Monitor platform health
- Manage tenants
- Review system analytics

---

# 5. Core User Journey

## Guest journey

1. Guest sees physical QR/NFC card.
2. Guest scans QR code or taps NFC.
3. Mobile web application opens.
4. Restaurant branding loads.
5. Guest sees restaurant identity and available actions.
6. Guest selects an action.
7. The relevant destination opens or an in-app interaction starts.
8. Guest can return to the guest hub without losing context.

## Example flow

Physical card
→ QR/NFC
→ Restaurant guest page
→ Action selection
→ Menu / Wi-Fi / Rewards / Review / Feedback / Game / Social

---

# 6. Reference Video Interpretation

The supplied reference video is approximately 33 seconds and vertically oriented.

Observed product behavior:
- A branded physical table/card asset is presented.
- The card contains a restaurant logo and quick-action labels/icons.
- A smartphone scans/uses the experience.
- The guest page contains a restaurant header/profile.
- Large rounded action rows are vertically stacked.
- Google review is one of the primary actions.
- Menu and Wi-Fi are prominent.
- Anonymous feedback is available.
- A lightweight game/entertainment option is available.
- Instagram/social access is visible.
- The experience is designed for mobile use.

The implementation should preserve the interaction model and information architecture while improving the visual design rather than copying the exact visual styling.

---

# 7. MVP Feature Requirements

## 7.1 Restaurant Guest Page

Required:
- Restaurant logo
- Restaurant name
- Short tagline
- Cover/background image
- Action cards
- Social links
- Optional address
- Optional phone number
- Optional opening hours
- Optional powered-by branding

Action card properties:
- Icon
- Title
- Short description
- Destination/action
- Enabled/disabled state
- Display order
- Optional badge
- Optional animation

---

## 7.2 Guest Actions

### Menu
Open restaurant menu.

Supported destinations:
- External menu URL
- PDF menu
- Internal menu page

### Loyalty / Stamps
Open the restaurant's native digital stamp card.

Core principle:
Customers should earn stamps by scanning a checkout QR code immediately after a qualifying purchase.

The loyalty experience must NOT require:
- App downloads
- Password creation
- Complicated registration
- Manual point entry by the customer
- Searching for a membership number

Customer flow:
1. Customer completes a qualifying purchase.
2. Restaurant presents a checkout loyalty QR code.
3. Customer scans the QR code with the phone camera.
4. The platform validates the one-time checkout token.
5. A stamp is added automatically to the customer's digital stamp card.
6. The customer immediately sees progress toward the next milestone.
7. When a milestone is reached, the reward becomes available.
8. Customer can redeem the reward on a future qualifying visit.

Identity:
- Use a secure anonymous loyalty wallet/browser identifier by default.
- Do not require an account before the first stamp.
- Offer optional phone/email recovery only when needed.
- If the customer later chooses to provide contact details, link them to the existing loyalty wallet rather than forcing a new account.

The customer should see immediate value after the scan:
- Current stamp count
- Progress toward next reward
- Available rewards
- Recently earned stamp
- Reward redemption instructions

Milestones must be configurable by the restaurant, for example:
- 5 stamps → Free beverage
- 10 stamps → Free dessert
- 15 stamps → Configured reward

Do not use loyalty rewards to incentivize or manipulate public reviews.

### Google Review
Open configured Google review URL.

The application should not fabricate or manipulate reviews.

### Wi-Fi
Display:
- Network name
- Password
- Connection instructions

Where browser/platform capabilities permit, provide a Wi-Fi connection action.

Security:
- Wi-Fi credentials must not be exposed publicly through indexing.
- Owner must explicitly enable guest visibility.

### Anonymous Feedback
Open a feedback form.

Fields:
- Rating
- Category
- Message
- Optional contact information

Feedback should support anonymous submission.

### Game
MVP:
- Sudoku or another lightweight browser game.

Game must:
- Load quickly
- Work without account creation
- Be playable on mobile
- Respect reduced-motion preferences

### Social
Configurable links:
- Instagram
- Facebook
- TikTok
- X
- YouTube
- Website

Only show configured platforms.

---

# 8. Native Loyalty Stamp Card

## Product principle

The loyalty system is a frictionless digital stamp card, not a traditional points-based rewards wallet.

The primary action is:

Purchase → Scan checkout QR → Stamp automatically → Progress → Milestone reward

## Customer experience

A customer must be able to earn their first stamp without:
- Installing an app
- Creating a password
- Filling out a long form
- Entering a membership number
- Waiting for staff to manually assign points

### First-time customer

```text
Purchase
  ↓
Scan checkout QR
  ↓
Secure loyalty wallet created automatically
  ↓
Stamp added
  ↓
"1 of 5 stamps"
  ↓
Continue visiting
```

### Returning customer on the same device

```text
Purchase
  ↓
Scan checkout QR
  ↓
Existing loyalty wallet recognized
  ↓
Stamp added automatically
  ↓
Progress updated
```

### Optional recovery

If the customer clears browser data, changes device, or wants to recover their wallet, offer an optional phone/email recovery flow.

Recovery must not turn the initial experience into mandatory registration.

## Checkout QR

The preferred secure implementation is a short-lived, one-time checkout QR token.

Flow:

```text
Restaurant Admin / POS
        ↓
Create checkout loyalty session
        ↓
Short-lived QR token
        ↓
Customer scans
        ↓
Backend validates token
        ↓
Eligible purchase confirmed
        ↓
Stamp transaction created
        ↓
Customer wallet updated
```

The token should:
- Be short-lived
- Be single-use
- Be tied to the restaurant
- Be tied to the checkout session
- Prevent duplicate redemption
- Be cryptographically signed or stored server-side
- Never expose private customer data

## Stamp rules

Restaurant owners can configure:
- Stamps required for each milestone
- Reward title
- Reward description
- Reward terms
- Reward validity period
- Whether multiple stamps can be earned in one day/transaction
- Qualifying purchase rules
- Reward redemption rules

## Loyalty dashboard

Restaurant admins should see:

```text
Loyalty
────────────────────────────
Active members
Stamps issued
Rewards unlocked
Rewards redeemed
Redemption rate
Returning loyalty customers
```

## Customer loyalty view

```text
The Spice House

Your Rewards

● ● ● ● ○

4 / 5 stamps

1 more visit to unlock:

Free Beverage

[View Reward Details]
```

Use animated progress/stamp feedback, while respecting reduced-motion preferences.

## Loyalty ledger

Do not store loyalty state only as a mutable balance.

Create an auditable ledger:

```text
LoyaltyWallet
    │
    └── LoyaltyStampTransaction
            ├── STAMP_EARNED
            ├── STAMP_REVERSED
            ├── MILESTONE_UNLOCKED
            ├── REWARD_REDEEMED
            └── REWARD_EXPIRED
```

Each transaction should contain:
- id
- restaurantId
- walletId
- type
- quantity
- checkoutSessionId where applicable
- rewardId where applicable
- createdAt
- metadata

## Anti-abuse

The system must prevent:
- Reusing an expired checkout QR
- Reusing a consumed checkout QR
- Creating duplicate stamps from repeated requests
- Customer-side manipulation of stamp counts
- Cross-restaurant loyalty access
- Unauthorized reward redemption

Use:
- Idempotency keys
- Database unique constraints
- Server-side transaction boundaries
- Short-lived checkout tokens
- Rate limiting
- Authorization checks

## POS integration

MVP:
- Restaurant staff can create a checkout loyalty session from the admin/staff interface.

Future:
- POS integration automatically creates a loyalty checkout session when a qualifying transaction is completed.

The loyalty engine should remain independent of the POS so integrations can be added later.

---

# 9. UI/UX Requirements

## Design direction

The interface should feel:
- Premium
- Modern
- Clean
- Hospitality-focused
- Mobile-first
- Fast
- Friendly
- Minimal

Do NOT use emojis.

Use icons instead.

Recommended icon library:
- Lucide React

Icons should:
- Have consistent stroke weight
- Have consistent sizing
- Be semantically meaningful
- Include accessible labels where necessary

---

# 9. Animation System

Animations should improve perceived quality rather than distract.

## Page entrance
- Restaurant identity fades and moves upward slightly.
- Action cards stagger into view.

## Action cards
- Subtle hover/tap scale
- Soft elevation change
- Icon transition
- Press feedback

## Navigation
- Smooth page transitions
- Shared-element-like motion where practical

## Modal / bottom sheet
- Spring-style entrance
- Backdrop fade
- Swipe/drag support where appropriate

## Loading
- Skeleton loading rather than large spinners.

## Success
Use subtle confirmation animation after:
- Feedback submission
- Reward action
- Copy Wi-Fi password

## Accessibility
Respect:
`prefers-reduced-motion`

When reduced motion is enabled:
- Remove decorative movement
- Keep essential transitions short
- Never block interaction

---

# 10. Responsive Design

Primary target:
- Mobile portrait

Secondary:
- Mobile landscape
- Tablet
- Desktop

Mobile UI should be designed first.

Recommended viewport baseline:
- 360px
- 390px
- 430px

Avoid horizontal scrolling.

Touch targets should generally be at least 44x44px.

---

# 11. Design System

## Colors

Base:
- Background: #FFFFFF
- Primary text: #0F172A
- Secondary text: #64748B
- Primary accent: #0F766E
- Border: #E2E8F0
- Surface: #F8FAFC
- Success: #16A34A
- Warning: #D97706
- Error: #DC2626

Restaurant-specific branding:
- Primary brand color
- Secondary brand color
- Logo
- Cover image

Brand customization must not compromise contrast/accessibility.

## Typography

Recommended:
- Inter
or
- Geist

Use:
- Strong restaurant name
- Medium action titles
- Compact supporting descriptions

## Radius

Use a consistent rounded system:
- Small: 8px
- Medium: 12px
- Large: 16px
- Card: 20px
- Pill: 999px

---

# 12. Information Architecture

Public:

/r/[restaurantSlug]

/r/[restaurantSlug]/menu

/r/[restaurantSlug]/feedback

/r/[restaurantSlug]/wifi

/r/[restaurantSlug]/rewards

/r/[restaurantSlug]/game

Admin:

/admin

/admin/restaurants

/admin/restaurants/[id]

/admin/restaurants/[id]/branding

/admin/restaurants/[id]/actions

/admin/restaurants/[id]/menu

/admin/restaurants/[id]/analytics

Authentication:

/login

/signup

---

# 13. Admin Requirements

Restaurant configuration:

### Branding
- Restaurant name
- Logo
- Cover image
- Brand colors
- Tagline

### Actions
Create/edit/reorder:
- Menu
- Loyalty / Stamps
- Google Review
- Wi-Fi
- Feedback
- Game
- Social links

### Loyalty
- Enable/disable loyalty program
- Configure stamp milestones
- Configure reward terms
- Configure validity
- View active loyalty wallets
- View stamps issued
- View milestones unlocked
- View rewards redeemed
- Create checkout loyalty sessions
- Reverse an erroneous stamp with an audited adjustment

### Visibility
Each action:
- Enabled
- Disabled

### Ordering
Drag-and-drop action ordering.

### Analytics
Show:
- Total visits
- Unique visits
- Action clicks
- Menu clicks
- Review clicks
- Wi-Fi clicks
- Feedback submissions
- Rewards clicks
- Social clicks
- Game launches

---

# 14. QR/NFC Requirements

Each restaurant should receive a public URL.

Example:
`https://app.example.com/r/barlow-and-fields`

Generate QR codes from the URL.

Optional later:
- Table-specific URLs
- Location-specific QR codes
- Campaign QR codes
- NFC tags

Analytics should distinguish:
- QR
- NFC
- Direct link

---

# 15. Analytics

Track events:

- guest_page_view
- menu_click
- loyalty_open
- loyalty_stamp_earned
- loyalty_milestone_unlocked
- loyalty_reward_redeemed
- review_click
- wifi_open
- wifi_copy
- feedback_open
- feedback_submit
- game_open
- social_click

Do not collect unnecessary personal information.

Analytics should support:
- Timestamp
- Restaurant
- Action
- Anonymous session identifier
- Device category
- Referrer where available

Avoid storing sensitive personal data.

---

# 16. Data Model

## Restaurant
- id
- name
- slug
- logoUrl
- coverImageUrl
- tagline
- primaryColor
- secondaryColor
- address
- phone
- website
- status
- createdAt
- updatedAt

## GuestAction
- id
- restaurantId
- type
- title
- description
- icon
- url
- enabled
- displayOrder
- metadata
- createdAt
- updatedAt

## Customer
- id
- restaurantId
- displayName
- phone
- email
- createdAt
- updatedAt

## LoyaltyWallet
- id
- restaurantId
- customerId (nullable)
- anonymousBrowserId
- status
- createdAt
- updatedAt

## LoyaltyProgram
- id
- restaurantId
- name
- enabled
- createdAt
- updatedAt

## LoyaltyMilestone
- id
- loyaltyProgramId
- stampRequirement
- rewardTitle
- rewardDescription
- validityDays
- enabled
- displayOrder

## LoyaltyCheckoutSession
- id
- restaurantId
- tokenHash
- status
- expiresAt
- consumedAt
- createdAt

## LoyaltyStampTransaction
- id
- restaurantId
- walletId
- type
- quantity
- checkoutSessionId
- milestoneId
- rewardId
- idempotencyKey
- metadata
- createdAt

## LoyaltyReward
- id
- restaurantId
- walletId
- milestoneId
- status
- unlockedAt
- redeemedAt
- expiresAt

## WifiConfig
- id
- restaurantId
- ssid
- password
- enabled

## SocialLink
- id
- restaurantId
- platform
- url
- enabled
- displayOrder

## Feedback
- id
- restaurantId
- rating
- category
- message
- contact
- isAnonymous
- createdAt

## AnalyticsEvent
- id
- restaurantId
- eventType
- actionId
- anonymousSessionId
- metadata
- createdAt

---

# 17. API Requirements

REST API or typed RPC layer.

Required endpoints/services:

Authentication:
- POST /auth/login
- POST /auth/register
- POST /auth/logout

Restaurants:
- GET /restaurants/:slug
- PATCH /restaurants/:id
- POST /restaurants/:id/logo
- POST /restaurants/:id/cover

Actions:
- GET /restaurants/:id/actions
- POST /restaurants/:id/actions
- PATCH /actions/:id
- DELETE /actions/:id
- PATCH /restaurants/:id/actions/reorder

Feedback:
- POST /restaurants/:id/feedback
- GET /restaurants/:id/feedback

Loyalty:
- POST /restaurants/:id/loyalty/checkout-sessions
- POST /loyalty/checkout/:token/claim
- GET /loyalty/wallet
- GET /loyalty/wallet/history
- GET /loyalty/rewards
- POST /loyalty/rewards/:id/redeem
- GET /restaurants/:id/loyalty
- POST /restaurants/:id/loyalty/milestones
- PATCH /restaurants/:id/loyalty/milestones/:milestoneId
- PATCH /restaurants/:id/loyalty/settings

Analytics:
- POST /analytics/events
- GET /restaurants/:id/analytics

---

# 18. Security

Required:
- Secure authentication
- Password hashing
- JWT/session security
- Role-based authorization
- Input validation
- Rate limiting
- CORS configuration
- CSRF protection where applicable
- Secure HTTP headers
- SQL injection prevention through ORM/parameterized queries
- XSS protection
- File upload validation
- MIME/type validation
- Image size limits
- Signed/private storage URLs where required
- Server-side authorization on every protected operation

Never trust restaurantId from the client.

---

# 19. Performance

Target:
- Fast first contentful render
- Optimized images
- Lazy-load non-critical content
- Minimal JavaScript on public guest page
- CDN delivery
- Compressed assets
- Responsive image sizes
- Cache public restaurant configuration safely

Recommended performance goal:
- Lighthouse mobile Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

---

# 20. Accessibility

Follow WCAG 2.2 AA principles.

Requirements:
- Keyboard accessibility
- Screen-reader labels
- Sufficient contrast
- Visible focus states
- 44px minimum touch targets
- Reduced motion support
- Semantic HTML
- Accessible dialogs
- Accessible forms
- Error messaging
- No color-only status communication

---

# 21. SEO

Public restaurant pages should have:
- Dynamic title
- Meta description
- Open Graph metadata
- Twitter/X card metadata
- Canonical URL

Optional:
- Restaurant structured data

---

# 22. Error States

Every feature needs:
- Loading state
- Empty state
- Error state
- Retry action

Examples:
- Restaurant unavailable
- Invalid restaurant slug
- Menu unavailable
- Feedback submission failure
- Wi-Fi information unavailable
- Network failure

Errors should be human-readable.

---

# 23. Testing

Unit:
- Validation
- Business logic
- Action ordering
- Analytics event creation

Integration:
- API
- Database
- Authentication
- Authorization

E2E:
- Guest landing
- Menu action
- Wi-Fi flow
- Feedback submission
- Admin login
- Restaurant configuration
- Action reorder

Browser testing:
- Chrome
- Safari
- Firefox
- Mobile Chromium/Safari where practical

Recommended tool:
- Playwright

---

# 24. Deployment Architecture

## Recommended production arrangement

Primary application:
- Frontend: Vercel
- Backend/API: Vercel-compatible serverless/API routes OR separate backend deployment if required
- Database: PostgreSQL managed service
- Object storage: Cloudflare R2 / Google Cloud Storage / S3-compatible storage
- CDN: Vercel/Cloudflare
- DNS: Cloudflare

Netlify:
- Use for an optional marketing/landing site, documentation site, or static microsites.

Important:
Do not deploy the same production application to both Vercel and Netlify without a clear reason. Pick one primary runtime to avoid routing, environment, deployment, and caching conflicts.

If the requirement is specifically "Vercel + Netlify", use:
- Vercel → main application
- Netlify → marketing website or documentation

---

# 25. Environment Variables

Never hard-code secrets.

Example:

DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
ANALYTICS_KEY=

Use separate values for:
- Local
- Preview
- Production

---

# 26. MVP Acceptance Criteria

The MVP is complete when:

1. Guest can open a restaurant page from a public URL.
2. Restaurant branding is displayed correctly.
3. Actions can be configured by an authorized admin.
4. Actions can be reordered.
5. Menu link works.
6. Google review link works.
7. Wi-Fi information works.
8. Feedback can be submitted.
9. Social links work.
10. Game launches.
11. Analytics events are recorded.
12. Public page is mobile responsive.
13. Animations are smooth.
14. Reduced-motion mode works.
15. No emojis are used.
16. Icons are consistent.
17. Protected admin routes require authentication.
18. Unauthorized users cannot edit another restaurant.
19. Error and loading states exist.
20. Automated tests pass.
21. Production build succeeds.
22. Vercel deployment succeeds.
23. Optional Netlify marketing deployment succeeds.
24. No secrets are committed to Git.

---

# 27. Phase Roadmap

## Phase 1 — MVP
- Public guest page
- Restaurant profile
- Action cards
- Menu
- Wi-Fi
- Native frictionless stamp-card loyalty
- Checkout QR loyalty sessions
- Milestone rewards
- Google Review
- Feedback
- Social links
- Game
- Basic admin
- QR URL
- Basic analytics
- Customer/loyalty wallet management

## Phase 2
- Loyalty/rewards system
- Table-specific QR
- NFC
- Advanced analytics
- Campaign tracking
- Multiple locations
- Custom domains
- Advanced branding

## Phase 3
- POS integrations
- CRM integrations
- Advanced loyalty
- Automated campaigns
- Customer segmentation
- AI-assisted feedback analysis
- Recommendation engine
- Enterprise administration

---

# 28. Antigravity Development Rules

The PRD and tech-stack document are source-of-truth documents.

Before implementation:
1. Read both documents.
2. Inspect the repository.
3. Identify existing code.
4. Create a technical implementation plan.
5. Identify missing environment variables.
6. Identify database requirements.
7. Identify deployment requirements.
8. Do not invent unspecified product behavior without documenting assumptions.

Implementation rules:
- TypeScript strict mode.
- No `any` unless justified.
- Reusable components.
- Feature-based architecture.
- Server/client boundaries must be deliberate.
- Validate all external input.
- Keep secrets server-side.
- No emojis.
- Use icons.
- Use accessible semantic HTML.
- Loyalty must be stamp-based, not points-based.
- Never require app installation for loyalty.
- Never require mandatory signup before the first stamp.
- Validate loyalty checkout tokens server-side.
- Make stamp issuance idempotent and auditable.
- Use responsive design.
- Respect reduced motion.
- Do not introduce unnecessary dependencies.
- Do not rewrite working code without reason.
- Keep changes incremental.

Before each major implementation phase:
- Run tests.
- Run lint.
- Run type-check.
- Run production build.

Never claim a feature works unless it has been tested.

---

# 29. Definition of Done

A feature is done only when:
- UI implemented
- Responsive behavior verified
- Accessibility considered
- Loading state implemented
- Error state implemented
- Validation implemented
- Tests written
- Tests passing
- Type-check passing
- Lint passing
- Production build passing
- Documentation updated
- Deployment configuration verified

