tech stack: nodejs, express, typescript, react, vitejs, tailwindcss, docker

# Claude

backend: nodejs, express, typescript
frontend: react, vitejs, tailwindcss
deployment: docker

## TypeScript Best Practices

### strict mode
- always enable `strict: true` in `tsconfig.json` — enables `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, etc.
- set `noUncheckedIndexedAccess: true` to catch unsafe array/object index access
- set `noImplicitReturns: true` and `noFallthroughCasesInSwitch: true`

### types vs interfaces
- prefer `interface` for object shapes that may be extended (e.g. component props, API models)
- use `type` for unions, intersections, mapped types, and utility type aliases
- never use `any` — use `unknown` when the type is truly unknown and narrow it explicitly

### enums
- avoid `enum`; use `const` objects with `as const` and derive the type with `typeof`
  ```ts
  const CardType = { GAS_TRACKER: 'gas_tracker', AMAZON_PRICE: 'amazon_price' } as const;
  type CardType = typeof CardType[keyof typeof CardType];
  ```

### null and undefined
- prefer `undefined` over `null` for optional values
- use optional chaining `?.` and nullish coalescing `??` instead of manual null checks
- never use non-null assertion `!` unless you can guarantee the value is present

### functions
- always type function parameters and return types explicitly for public/exported functions
- use arrow functions for callbacks; use named functions for top-level declarations
- prefer `async/await` over raw Promises; always `await` or handle returned Promises

### error handling
- define typed error classes (e.g. `class NotFoundError extends Error`) rather than throwing plain strings
- use discriminated unions for result types when a function can succeed or fail predictably
  ```ts
  type Result<T> = { ok: true; data: T } | { ok: false; error: string };
  ```

### imports and module structure
- use named exports over default exports for better refactoring and tree-shaking
- keep type-only imports explicit: `import type { Card } from './types/card'`
- organize imports: external packages → internal modules → types

### generics
- use generics to avoid code duplication instead of reaching for `any`
- constrain generics with `extends` when the type needs specific properties
  ```ts
  function getField<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }
  ```

### React + TypeScript specifics
- type component props with an `interface`, not inline object types
- use `React.FC` sparingly; prefer plain function declarations with typed props
- type `useState` explicitly when the initial value doesn't convey the type: `useState<Card[]>([])`
- type event handlers: `(e: React.ChangeEvent<HTMLInputElement>) => void`
- use `React.ReactNode` for children props; `React.ReactElement` when a specific element is required

## Backend

### folder structure

```
server/
├── src/
│   ├── controllers/
│   │   ├── cardController.ts
│   │   ├── notificationController.ts
│   │   └── eventController.ts
│   ├── routes/
│   │   ├── cardRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   └── eventRoutes.ts
│   ├── services/
│   │   ├── cardService.ts
│   │   ├── gasTrackerService.ts
│   │   ├── amazonPriceService.ts
│   │   ├── pushoverService.ts
│   │   └── schedulerService.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── eventLogger.ts
│   ├── types/
│   │   ├── card.ts
│   │   └── pushover.ts
│   ├── middleware/
│   │   └── errorMiddleware.ts
│   ├── db/
│   │   ├── database.ts
│   │   └── migrate.ts
│   └── index.ts
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

### controllers
- handle incoming requests and send responses
- call services to perform business logic and data manipulation
- validate request data and handle errors
- example: `cardController.ts` for handling card CRUD, `notificationController.ts` for notification operations

### routes
- define API endpoints and map them to controller functions
- example: `cardRoutes.ts` for card operations, `notificationRoutes.ts` for notification operations
- use express Router to organize routes

### API endpoints
- `GET    /api/cards`                        — list all cards
- `POST   /api/cards`                        — create a new card
- `PUT    /api/cards/:id`                    — update card configuration
- `DELETE /api/cards/:id`                    — remove a card
- `PATCH  /api/cards/:id/toggle`             — enable or disable a card
- `POST   /api/notifications/test`           — send a test pushover notification
- `GET    /api/events?limit=50&cardId=:id`   — fetch recent event log entries

### services
- contain business logic and data manipulation functions
- interact with databases or external APIs
- keep controllers thin by moving complex logic to services
- promote code reusability and separation of concerns
- key services:
  - `cardService.ts` — CRUD operations for cards, persisting to the database
  - `gasTrackerService.ts` — scrapes real-time gas price data from https://toronto.citynews.ca/toronto-gta-gas-prices/ using an HTML parser (e.g. `cheerio`)
  - `amazonPriceService.ts` — scrapes/fetches product prices from Amazon URLs
  - `pushoverService.ts` — sends notifications via the Pushover API
  - `schedulerService.ts` — manages `node-cron` jobs per card; starts on enable, pauses on toggle-off, cancels on delete

### utils
- contain utility functions and helper methods
- `validation.ts` for input validation functions
- `logger.ts` — structured logger (see Logging & Events section below)
- can be used across controllers and services to avoid code duplication

### logging & events
all significant actions and system events must be logged and persisted so the dashboard has a full activity history.

**what to log**
- card created / updated / deleted
- card toggled on / off
- scheduler job started / stopped / failed
- gas price fetched (include fetched value and timestamp)
- gas price alert triggered (include threshold and actual value)
- Amazon price fetched (include product URL, old price, new price)
- Amazon price alert triggered
- Pushover notification sent (include card id, message, success/failure)
- Pushover notification failed (include error message)
- server startup / shutdown
- unhandled errors and uncaught exceptions

**log levels**
- `info` — normal operational events (job started, price fetched, notification sent)
- `warn` — non-fatal issues (scraping returned unexpected format, retrying)
- `error` — failures that affect functionality (job crashed, notification failed, DB error)
- `debug` — verbose detail for development only (raw scraped HTML, full request bodies)

**logger implementation (`utils/logger.ts`)**
- use `winston` for structured JSON logging
- in development: pretty-print to console with level colours
- in production: write JSON lines to `logs/app.log` with daily rotation (`winston-daily-rotate-file`)
- every log entry includes: `timestamp`, `level`, `message`, `cardId?`, `cardType?`, `error?`

**event persistence**
- all `info`-level and above events are also written to the SQLite `event_log` table
- schema: `{ id, timestamp, level, event, cardId?, cardType?, meta? }`
- `meta` is a JSON string for any extra context (e.g. price values, notification payload)
- events are queryable via `GET /api/events` so the frontend can display an activity feed
- events older than 30 days are pruned automatically on server startup

**API endpoint**
- `GET /api/events?limit=50&cardId=:id` — fetch recent events, optionally filtered by card

### types
- shared TypeScript interfaces and types used across the backend
- `Card` interface: `{ id, type, title, enabled, config, createdAt, updatedAt }`
- card-type-specific config shapes:
  - `GasTrackerConfig`: `{ intervalMinutes, priceThreshold, notificationsEnabled, pushoverConfig }`
  - `AmazonPriceConfig`: `{ productUrl, intervalMinutes, priceDropThreshold, priceIncreaseThreshold, notificationsEnabled, pushoverConfig }`
- `PushoverConfig`: `{ userKey, apiToken, sound?, priority? }`

### index.ts
- entry point of the backend application
- set up express server, middleware, and routes
- register global error-handling middleware for consistent error responses

### data persistence
- use SQLite (via `better-sqlite3`) for local, zero-dependency persistence
- tables:
  - `cards` — card configurations and enabled state
  - `price_history` — historical price snapshots per card (timestamp, value)
  - `event_log` — all logged events (see Logging & Events section)
- migrations managed with a simple `db/migrate.ts` script

### environment variables
- stored in `.env`, never committed to source control
- required variables:
  - `PUSHOVER_USER_KEY` — Pushover user key
  - `PUSHOVER_API_TOKEN` — Pushover application API token
  - `PORT` — server port (default: `3001`)
  - `NODE_ENV` — `development` | `production`
- use `dotenv` to load `.env` in development; document all variables in `.env.example`

### error handling
- use a global Express error-handling middleware (`errorMiddleware.ts`)
- all errors return a consistent JSON shape: `{ error: string, message: string }`
- services throw typed errors; controllers catch and forward to the middleware

### scheduler / job system
- use `node-cron` to schedule periodic jobs per card
- job lifecycle:
  - **created** — job is registered but not started
  - **enabled** — job runs on its configured interval
  - **toggled off** — job is stopped; configuration is preserved
  - **deleted** — job is cancelled and removed from memory
- `schedulerService.ts` maintains a map of `cardId → CronJob` for runtime management

## Frontend

### folder structure

```
client/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── TimerIntervalSelector.tsx
│   │   │   └── NotificationSettings.tsx
│   │   ├── layout/
│   │   │   └── Header.tsx
│   │   └── specific/
│   │       ├── Card.tsx
│   │       ├── GasTrackerCard.tsx
│   │       ├── AmazonPriceCard.tsx
│   │       └── AddCardModal.tsx
│   ├── pages/
│   │   └── Dashboard.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── cardService.ts
│   │   └── notificationService.ts
│   ├── context/
│   │   └── CardContext.tsx
│   ├── utils/
│   │   └── helpers.ts
│   ├── types/
│   │   ├── card.ts
│   │   └── api.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

### components
- **common**: reusable primitive components used across the application
  - `Button.tsx` — primary, secondary, danger variants
  - `Toggle.tsx` — enable/disable switch with visual state indication
  - `Modal.tsx` — generic modal wrapper
  - `ConfirmDialog.tsx` — confirmation prompt for destructive actions
  - `Badge.tsx` — status badge (enabled/disabled)
  - `TimerIntervalSelector.tsx` — select from predefined intervals or enter a custom one
  - `NotificationSettings.tsx` — configure Pushover notification preferences per card
- **layout**: components for the overall page structure
  - `Header.tsx` — top navigation bar with app title and global actions
  - `Sidebar.tsx` or `Footer.tsx` as needed
- **specific**: components tied to a particular feature
  - `Card.tsx` — generic card shell (title, toggle, edit button, delete button, content slot)
  - `GasTrackerCard.tsx` — renders gas price data inside the card shell
  - `AmazonPriceCard.tsx` — renders product price and tracking status inside the card shell
  - `AddCardModal.tsx` — modal for selecting card type and configuring initial settings

### design system
- use Tailwind CSS for all styling; no custom CSS unless necessary
- define a consistent color palette in `tailwind.config.ts` (primary, neutral, success, warning, danger)
- typography scale and spacing follow Tailwind defaults
- dark mode support via Tailwind's `class` strategy
- all interactive elements meet WCAG 2.1 AA contrast requirements

### dashboard layout
- clean, responsive grid layout using Tailwind's grid utilities
- cards arranged in a responsive multi-column grid (1 col on mobile, 2–3 on desktop)
- "Add Card" floating action button or header button to open `AddCardModal`
- empty state illustration when no cards are present

### card components
- generic `Card.tsx` shell used by all specific card types
- each card displays: title, enabled/disabled badge, toggle button, relevant data, edit button, delete button
- edit button opens a modal pre-filled with the card's current configuration
- delete button triggers `ConfirmDialog` before removing the card
- toggle button calls `PATCH /api/cards/:id/toggle` and updates local state immediately (optimistic update)
- cards are responsive and adapt to different screen sizes

### use cases

**Gas Tracker Card**
- scrapes current Toronto/GTA gas prices from https://toronto.citynews.ca/toronto-gta-gas-prices/ using `cheerio`
- no API key required — data is publicly available via HTML scraping
- toggle enables/disables polling and pushover notifications
- edit modal configures: fetch interval, price alert threshold, notification settings

**Amazon Price Tracker Card**
- user inputs an Amazon product URL when creating the card
- displays current tracked price and last-checked timestamp
- toggle enables/disables periodic price checks and notifications
- edit modal configures: product URL, check frequency, price drop/increase thresholds, notification settings

### state management
- use **React Context** (`CardContext`) to manage the global list of cards and their states
- context provides: `cards`, `addCard`, `updateCard`, `deleteCard`, `toggleCard`
- avoid Redux for this scope; Context + `useReducer` is sufficient
- each card's local UI state (loading, error) managed with component-level `useState`

### services layer
- `src/services/api.ts` — base `fetch` wrapper with error handling and JSON parsing
- `src/services/cardService.ts` — wraps all card-related API calls (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
- `src/services/notificationService.ts` — wraps notification test API call
- all services return typed responses using shared types from `src/types/`

### shared types
- `src/types/card.ts` — mirrors backend `Card` interface and config shapes
- `src/types/api.ts` — generic API response envelope types

### Vite dev proxy
- configure `vite.config.ts` to proxy `/api/*` requests to `http://localhost:3001` during development
- eliminates CORS issues in development without changing production behaviour

### error handling (frontend)
- API errors surfaced via a toast notification system (e.g. `react-hot-toast`)
- loading states shown with skeleton loaders inside cards
- form validation errors shown inline in modals

## Development Scripts

### running the project
- `yarn dev` at the project root starts **both** frontend and backend concurrently
- uses `concurrently` package in the root `package.json` to run both processes in a single terminal
- root `package.json` scripts:
  ```json
  {
    "scripts": {
      "dev": "concurrently \"yarn --cwd server dev\" \"yarn --cwd client dev\"",
      "build": "yarn --cwd server build && yarn --cwd client build",
      "install:all": "yarn --cwd server install && yarn --cwd client install"
    }
  }
  ```
- server runs on `http://localhost:3001`, client runs on `http://localhost:5173`
- Vite proxies `/api/*` to the server so there are no CORS issues in development

## Deployment

### Docker setup
- `server/Dockerfile` — builds the Node/Express server
- `client/Dockerfile` — builds the React app with Vite and serves static files via nginx
- `docker-compose.yml` at project root orchestrates both containers
- environment variables injected via `docker-compose.yml` `environment` section or `.env` file
- server exposes port `3001`, nginx (client) exposes port `80`
- volumes used for SQLite database persistence across container restarts

### docker-compose services
```yaml
services:
  server:
    build: ./server
    ports: ["3001:3001"]
    env_file: .env
    volumes: ["./data:/app/data"]
  client:
    build: ./client
    ports: ["80:80"]
    depends_on: [server]
```