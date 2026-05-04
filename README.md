# Pushover Dashboard

A self-hosted dashboard for tracking prices and sending [Pushover](https://pushover.net/) notifications when conditions are met.

Built with React + Vite (frontend) and Node.js + Express (backend), using SQLite for storage.

## Features

- **Gas Tracker** — scrapes Toronto/GTA average gas prices from [CityNews](https://toronto.citynews.ca/toronto-gta-gas-prices/), including upcoming price move forecast
- **Amazon Price Tracker** — monitors product prices and alerts when a target price is reached
- **Pushover notifications** — per-card configurable keys, or fall back to global env credentials
- **Flexible schedule** — check every N minutes/hours/days/weeks, with optional "at HH:MM" for daily/weekly
- **Price history** — sparkline chart + table of past readings per card
- **Event log** — view all fetches, alerts, and errors in the dashboard

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript, ts-node-dev |
| Database | SQLite via `better-sqlite3` |
| Scheduler | `node-cron` |
| Scraping | `axios` + `cheerio` |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Pushover](https://pushover.net/) account (user key + app token)

### Install

```bash
git clone https://github.com/lingchen4/pushover-dashboard.git
cd pushover-dashboard
npm run install:all
```

### Configure

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=3001
PUSHOVER_USER_KEY=your_pushover_user_key
PUSHOVER_API_TOKEN=your_pushover_app_token
```

### Run (development)

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:3001

### Build

```bash
npm run build
```

Outputs built client to `client/dist/` and compiled server to `server/dist/`.

## Docker

### Quick start

```bash
cp server/.env.example server/.env
# edit server/.env with your Pushover keys

docker compose up -d
```

The app will be available at http://localhost:3001 (Express serves both the API and the React client).

The SQLite database is persisted in `./data/` on the host.

### Build & run manually

```bash
docker build -t pushover-dashboard .
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data:/app/server/data \
  --env-file server/.env \
  -e NODE_ENV=production \
  pushover-dashboard
```

## Project Structure

```
pushover-dashboard/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── common/   # Shared UI (Modal, TimerIntervalSelector, PriceHistoryDialog…)
│       │   └── specific/ # Card components (GasTrackerCard, AmazonPriceCard…)
│       ├── context/      # CardContext (useReducer state)
│       ├── hooks/        # useTestNotification
│       ├── pages/        # Dashboard
│       └── services/     # API client helpers
└── server/          # Express + TypeScript backend
    └── src/
        ├── controllers/  # Request handlers
        ├── routes/       # Express routers
        ├── services/     # Business logic (scheduler, scrapers, notifier)
        ├── db/           # SQLite setup & migrations
        └── types/        # Shared TypeScript types
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PUSHOVER_USER_KEY` | Yes* | Global Pushover user key |
| `PUSHOVER_API_TOKEN` | Yes* | Global Pushover app token |
| `PORT` | No | Server port (default: 3001) |

*Can be overridden per card in the dashboard settings.
