# SkyBook — Flight Management PWA

A production-like Flight Management web application built as a technical internship assignment.

**Live Demo:** https://front-end-assessment-ashen.vercel.app/

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & API | Next.js 14 (App Router, Server Components) |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth + Realtime) |
| State Management | Zustand with `persist` middleware |
| Styling | Tailwind CSS |
| PWA | next-pwa |

---

## Features

- **Flight Search** — search by route, date, and passenger count; results fetched in Server Components (no API key exposure)
- **Interactive Seat Map** — color-coded grid with live Supabase Realtime sync; supports first, business, and economy zones
- **Booking Flow** — passenger form → atomic seat-lock RPC → PNR confirmation
- **My Bookings** — list all bookings with status badges; cancel or reschedule any active booking
- **Reschedule** — pick an alternative flight on the same route; additional fee charged if new flight is pricier
- **Cancel** — 2-hour departure window enforced at DB trigger level and RPC level
- **PWA** — installable, offline fallback page, Lighthouse ≥ 90 PWA score

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd FrontEndAssessment
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project URL and anon key (from Supabase Dashboard → Settings → API).

### 3. Run Supabase migrations

In your Supabase project, open the **SQL Editor** and run the migration files **in order**:

1. `supabase/migrations/001_schema.sql` — tables + RLS
2. `supabase/migrations/002_rpc.sql` — `reserve_seat`, `cancel_booking`, `reschedule_booking` RPCs
3. `supabase/migrations/003_triggers.sql` — 2-hour cancellation trigger
4. `supabase/migrations/004_seed.sql` — 8 flights across 4 routes with full seat maps

Alternatively, if you have the Supabase CLI installed:
```bash
supabase db push
```

### 4. Create a test user

Go to Supabase Dashboard → Authentication → Users → **Add user**, or use the sign-up page in the app.

**Test credentials:**
- Email: `testuser@skybook.com`
- Password: `SkyBook@2026`

### 5. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Supabase Project Configuration

| Setting | Value |
|---|---|
| Auth providers | Email (enabled) |
| Email confirmations | Can be disabled for testing in Supabase Dashboard → Auth → Settings |
| RLS | Enabled on all tables |
| Realtime | Enable on `seats` table (Dashboard → Database → Replication) |

---

## Zustand Store Structure

### `useFlightStore` (`src/store/flightStore.ts`)

Manages the entire booking flow. **Persisted to `localStorage`** with `partialize` to exclude sensitive fields.

| State field | Persisted | Notes |
|---|---|---|
| `searchQuery` | ✅ | Route, date, passenger count |
| `selectedFlight` | ✅ | Flight object |
| `selectedSeat` | ✅ | Optimistic seat selection |
| `bookingStep` | ✅ | Current step in flow |
| `passengerForm.full_name` | ✅ | Safe to persist |
| `passengerForm.nationality` | ✅ | Safe to persist |
| `passengerForm.dob` | ✅ | Safe to persist |
| `passport_no` | ❌ | **Never persisted** — lives only in React `useState` |

**Why `passport_no` is excluded:** Passport numbers are sensitive PII. Storing them in `localStorage` risks exposure to other browser scripts across sessions. The form collects it into local React state only, passes it directly to the `reserve_seat` RPC, then discards it after submission.

**`resetBooking()`** clears all booking state — called on booking cancellation and logout.

### `useUserStore` (`src/store/userStore.ts`)

Stores only the session token. Cleared on logout via `clearSession()`.

---

## Database Schema

```
flights      — routes, times, pricing, status
seats        — per-flight seat map with class and availability
bookings     — user → flight → seat, PNR, status, total price
passengers   — passenger details linked to booking
reschedules  — reschedule history with fee charged
```

### Safety mechanisms

| Mechanism | What it prevents |
|---|---|
| `reserve_seat` RPC with `SELECT ... FOR UPDATE` | Double-booking race conditions |
| `cancel_booking` RPC | Cancellations of others' bookings; 2-hour window |
| DB trigger `enforce_cancellation_window` | Direct SQL bypass of the 2-hour cancellation rule |
| RLS policies on all tables | Users accessing other users' data |
| `SECURITY DEFINER` on all RPCs | Client-side bypass of seat-lock logic |

---

## PWA

Configured with `next-pwa`. Build for production to activate the service worker:

```bash
npm run build && npm start
```

- **StaleWhileRevalidate** — Supabase API calls (flight search results)
- **CacheFirst** — static assets (JS, CSS, fonts, images)
- **Offline fallback** — `/offline` page shown when no connectivity
- **Install banner** — shown on first mobile visit via `beforeinstallprompt`

_[Add Lighthouse PWA screenshot here after production build]_

---

## Deployment (Vercel)

```bash
vercel deploy --prod
```

Set in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
