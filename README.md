# Tably

A production-ready restaurant table reservation platform with an interactive graphical floor map, built with React 19 + FastAPI.

> **v3 note**: the app is now branded as **Tably** (favicon, page title, navbar all updated). The project folder/repo name stays `tablereserve` for continuity with your existing GitHub repo and deployment — only user-facing branding changed.

- **Customers**: search restaurants, view an interactive floor map, book a specific table, get in-app notifications, leave reviews, save favorites.
- **Restaurant Owners**: manage restaurants, design floor layouts (drag-and-drop tables), accept/reject/complete reservations, view dashboard analytics.
- **Admins**: approve/reject restaurants, verify owners, manage users, view system-wide analytics.

Everything in this project runs on **free tiers only** — see `RUN_INSTRUCTIONS.md` for exact steps to run it locally and deploy it for free.

## Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Zustand, React Hook Form + Zod, Framer Motion, Axios, React Leaflet
- **Backend**: FastAPI, SQLAlchemy, Pydantic, JWT auth, clean architecture (repository pattern)
- **Database**: SQLite for local development (zero setup) → Supabase Postgres for production (free tier)
- **Notifications**: fully functional in-app notifications (no external push service required)

## Demo data
To populate the app with ~200 realistic dummy restaurants (with floor layouts and reviews) instead of starting from an empty database, run the seed script — see `RUN_INSTRUCTIONS.md` → "Load demo data" for exact steps.

## Restaurant images
When an owner adds a restaurant, a **banner photo is required** and up to 8 **interior photos** are optional. Images are compressed and resized in the browser (no upload limits to worry about) and stored directly in the database as the app requires — no external storage service (Supabase Storage, S3, etc.) needed, keeping the whole stack free with zero extra setup. Profile pictures work the same way.

## Project structure
```
tablereserve/
├── backend/        FastAPI app (see backend/README.md)
├── frontend/        React app (see frontend/README.md)
└── RUN_INSTRUCTIONS.md   Full step-by-step run + deploy guide
```

## Status
The backend has been fully implemented and end-to-end tested (auth, restaurant approval workflow, floor map, booking with conflict detection, owner confirmation flow, in-app notifications, reviews/ratings, favorites, admin analytics, role-based security).

The frontend implements: auth (login/register/forgot password), restaurant search & detail with interactive SVG floor map and full booking modal, booking history, favorites, profile, owner dashboard + floor map editor + reservation management, and admin dashboard + restaurant approval + user management. It builds cleanly with `npm run build` (verified, zero TypeScript errors).

Not yet wired (left as clearly-marked extension points, see code comments): Supabase Auth Google Sign-In (needs your own Google Cloud OAuth credentials), direct Supabase Storage image upload UI (backend endpoint to register the resulting URL is done), and a drag-and-drop admin analytics revenue chart (revenue isn't modeled since no pricing/menu module was in scope).
