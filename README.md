# 🚚 GoVendGo

**Real-time GPS tracking and mobile ordering for food trucks.**

Live at → **[govendgo.com](https://govendgo.com)**

GoVendGo is a full-stack SaaS platform that gives food truck operators a real-time GPS presence, mobile ordering, and Square-powered payments — all in one platform built for vendors on the go. Currently serving the Highway 99 corridor in Lynnwood/Everett, WA.

---

## Screenshots

## Screenshots

| Landing Page | Live Map | Menu |
|---|---|---|
| ![Landing Page](docs/screenshots/Landing_Page.png) | ![Clicked Truck](docs/screenshots/Clicked_Truck.png) | ![Menu](docs/screenshots/Menu.png) |

| Cart | Square Checkout | Order Confirmation |
|---|---|---|
| ![View Order](docs/screenshots/View_Order.png) | ![Square Checkout](docs/screenshots/Square_Checkout_1.png) | ![You're All Set](docs/screenshots/You're_All_Set.png) |

---

## Features

- **Live GPS tracking** — Trucks update their location in real time via ESP32 hardware over cellular (Hologram SIM). Customers see the truck move on the map as it happens.
- **Distance badges** — Haversine formula calculates how far the truck is from the customer's current location.
- **Mobile ordering** — Browse the full menu, add items to a cart, and pay securely via Square's hosted checkout — all before leaving your seat.
- **Get Directions** — One tap opens Apple Maps (iOS) or Google Maps (Android) with turn-by-turn directions to the truck.
- **Order confirmation** — After checkout, customers see a branded confirmation screen with their order summary, line items, and order timestamp.
- **Square payments** — Production-grade Square Payment Links API with sandbox/production environment switching via `NODE_ENV`.

---

## Tech Stack

### Frontend
- [Next.js 14](https://nextjs.org/) + TypeScript
- [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/) — live truck tracking map
- Deployed on [Vercel](https://vercel.com)

### Backend
- [Supabase](https://supabase.com) — Postgres database with real-time WebSocket subscriptions
- `truck_locations` table with `REPLICA IDENTITY FULL` and real-time publications enabled
- RLS policy: public read, anonymous UPDATE

### Payments
- [Square API](https://developer.squareup.com/) — Payment Links API
- Production credentials on Vercel, sandbox credentials locally via `NODE_ENV` check

### IoT / Hardware
- ESP32-WROOM-32 running MicroPython — GPS simulation over Wi-Fi (dev)
- LILYGO T-SIM7600G-H R2 — cellular GPS hardware (in progress)
- Hologram SIM — APN: `hologram`, 6MB cap, pay-as-you-go
- `mpremote` for firmware deployment

---

## Architecture

```
Customer Browser
      │
      ▼
  Next.js (Vercel)
  ├── page.tsx          — Landing page + map hero
  ├── TruckMap.tsx      — Google Maps + real-time Supabase subscription
  ├── MenuModal.tsx     — Menu, cart, checkout flow
  ├── /api/checkout     — Square Payment Links API route
  └── /order-confirmation — Post-payment confirmation page
      │
      ▼
  Supabase (Postgres + Real-time)
  ├── truck_locations   — lat/lng, recorded_at, truck_id
  └── menu_items        — name, description, price, category
      ▲
      │
  ESP32 / LILYGO (MicroPython)
  └── POST lat/lng every 30s → Supabase REST API
```

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/alexjowilson/taco-truck.git
cd taco-truck

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
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SQUARE_SANDBOX_ACCESS_TOKEN` | route.ts (local dev) |
| `SQUARE_SANDBOX_LOCATION_ID` | route.ts (local dev) |
| `SQUARE_ACCESS_TOKEN` | route.ts (production) |
| `SQUARE_LOCATION_ID` | route.ts (production) |
| `SQUARE_APP_ID` | route.ts (production) |
| `NEXT_PUBLIC_BASE_URL` | Square redirect URL |

---

## Hardware Setup (ESP32)

```bash
# Flash MicroPython firmware, then copy files
mpremote connect /dev/tty.SLAB_USBtoUART fs cp hardware/esp32/main.py :main.py
mpremote connect /dev/tty.SLAB_USBtoUART fs cp hardware/esp32/config.py :config.py
```

`config.py` contains credentials and is excluded from Git. See `config.py.example` for the required fields.

---

## Deployment

The app auto-deploys to [govendgo.com](https://govendgo.com) on every push to `main` via Vercel.

```bash
git add .
git commit -m "your message"
git push origin main
```

---

## Project Status

This project is now branded as **GoVendGo** — a platform for food truck operators to manage real-time GPS tracking and mobile ordering. The repo name reflects the original prototype name.

**Production:** Live at [govendgo.com](https://govendgo.com)  
**Payments:** Square production environment verified end-to-end  
**Hardware:** Cellular GPS swap in progress (LILYGO T-SIM7600G-H R2)

---

## License

Private — all rights reserved.
