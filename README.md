# 🚚 GoVendGo

**Real-time GPS tracking and mobile ordering for food trucks.**

🌐 **Live at [govendgo.com](https://govendgo.com)**

---

GoVendGo is a production-grade, full-stack SaaS platform built from scratch — featuring live cellular GPS hardware, real-time map updates, a complete mobile ordering flow, and Square-powered payments verified end-to-end. Currently serving food truck operators on the Highway 99 corridor in Lynnwood/Everett, WA.

**Built with:** Next.js 14 · Supabase real-time · Google Maps · Square API · MicroPython on ESP32 · Cellular GPS (LILYGO T-SIM7600G-H R2) · Deployed on Vercel

---

## 🟢 Project Status

| | |
|---|---|
| **Production URL** | [govendgo.com](https://govendgo.com) |
| **Payments** | Square production environment — verified end-to-end with real transaction |
| **GPS** | LILYGO T-SIM7600G-H R2 over Verizon LTE — real coordinates posting every 30s |
| **Database** | Supabase Postgres with real-time WebSocket subscriptions |
| **Deployment** | Auto-deploys on push to `main` via Vercel |

---

## Screenshots

| Landing Page | Live Map | Menu |
|---|---|---|
| ![Landing Page](docs/screenshots/Landing_Page.png) | ![Clicked Truck](docs/screenshots/Clicked_Truck.png) | ![Menu](docs/screenshots/Menu.png) |

| Cart | Square Checkout | Order Confirmation |
|---|---|---|
| ![View Order](docs/screenshots/View_Order.png) | ![Square Checkout](docs/screenshots/Square_Checkout_1.png) | ![You're All Set](docs/screenshots/Youre_All_Set.png) |

---

## Features

- **Live cellular GPS tracking** — Trucks post their location every 30 seconds via LILYGO T-SIM7600G-H R2 hardware over Verizon LTE. Supabase real-time pushes updates to every connected browser instantly — no polling.
- **Relative timestamps** — InfoWindow shows how recently the truck location was updated (e.g. "30s ago", "2m ago").
- **Haversine distance badges** — Calculates and displays how far the truck is from the customer's current location in real time.
- **Mobile ordering** — Full menu browsing, cart management, and Square-hosted checkout — all before the customer leaves their seat.
- **iOS/Android-aware directions** — One tap opens Apple Maps on iOS or Google Maps on Android with turn-by-turn routing to the truck.
- **Order confirmation** — Post-payment screen shows a branded summary with line items, total, and order timestamp. Survives Square's external redirect via `localStorage`.
- **Square Payment Links API** — Production-grade checkout with automatic sandbox/production switching via `NODE_ENV`.

---

## Architecture

```
Customer Browser
      │
      ▼
  Next.js 14 (Vercel — govendgo.com)
  ├── page.tsx               — Landing page + map hero
  ├── TruckMap.tsx           — Google Maps + Supabase real-time subscription
  ├── MenuModal.tsx          — Menu, cart, checkout flow
  ├── /api/checkout          — Square Payment Links API route
  └── /order-confirmation    — Post-payment confirmation page
      │
      ▼
  Supabase (Postgres + Real-time WebSockets)
  ├── truck_locations        — lat/lng, recorded_at, truck_id
  └── menu_items             — name, description, price, category
      ▲
      │
  LILYGO T-SIM7600G-H R2 (MicroPython)
  └── POST real GPS lat/lng every 30s → Supabase REST API
       └── Hologram SIM over Verizon LTE (production)
```

---

## Tech Stack

### Frontend
- [Next.js 14](https://nextjs.org/) + TypeScript
- [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/) — live truck tracking map
- Cormorant Garamond + DM Sans typography
- Deployed on [Vercel](https://vercel.com)

### Backend
- [Supabase](https://supabase.com) — Postgres + real-time WebSocket subscriptions
- `REPLICA IDENTITY FULL` on `truck_locations` for real-time UPDATE events
- RLS: public read, anonymous INSERT + UPDATE with upsert on `truck_id`

### Payments
- [Square API](https://developer.squareup.com/) — Payment Links API (`square` npm package)
- `NODE_ENV === 'production'` switches between sandbox (local) and production (Vercel) credentials automatically

### IoT / Hardware
- **LILYGO T-SIM7600G-H R2** — cellular GPS hardware, live on Verizon LTE
- **MicroPython v1.28.0** — AT command HTTP stack, RTC sync via `AT+CCLK`, real GPS reads
- **Hologram SIM** — APN: `hologram`, 6MB cap, pay-as-you-go
- `mpremote` for firmware deployment over serial

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/alexjowilson/taquero.git
cd taquero

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase, Google Maps, and Square sandbox keys

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Used In |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | TruckMap.tsx |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client + config.py |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client + config.py |
| `SQUARE_SANDBOX_ACCESS_TOKEN` | route.ts (local dev) |
| `SQUARE_SANDBOX_LOCATION_ID` | route.ts (local dev) |
| `SQUARE_ACCESS_TOKEN` | route.ts (production) |
| `SQUARE_LOCATION_ID` | route.ts (production) |
| `SQUARE_APP_ID` | route.ts (production) |
| `NEXT_PUBLIC_BASE_URL` | Square redirect URL |

---

## Hardware Setup

```bash
# Deploy firmware files to the board
mpremote connect /dev/tty.usbserial-5B212339991 fs cp hardware/esp32/main.py :main.py
mpremote connect /dev/tty.usbserial-5B212339991 fs cp hardware/esp32/config.py :config.py
```

`config.py` contains credentials and is excluded from Git. See `config.py.example` for required fields.

> **Note:** The serial port `/dev/tty.usbserial-5B212339991` is specific to the LILYGO board. Auto-detection fails — always specify the port explicitly. If the port is locked, run `pkill -f screen` to release it.

---

## Deployment

Auto-deploys to [govendgo.com](https://govendgo.com) on every push to `main` via Vercel.

```bash
git add .
git commit -m "your message"
git push origin main
```

---

## About

GoVendGo is a real-time food truck platform for GPS tracking and mobile ordering. Built as a production SaaS product targeting food truck operators on the Highway 99 corridor in the Lynnwood/Everett, WA area.

Built by [Alex Wilson](https://github.com/alexjowilson).
