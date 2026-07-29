# TableReserve — Run & Deploy Guide (Beginner-Friendly)

This guide assumes you know nothing about deployment. Follow every step in order.

---

# PART 1 — Run it on your own computer (free, no accounts needed)

## Prerequisites
Install these first (all free):
1. **Node.js** (v20 or later) — https://nodejs.org (download the "LTS" version, run the installer, click Next through everything)
2. **Python** (3.11 or later) — https://www.python.org/downloads/ (on Windows, check "Add Python to PATH" during install)
3. A code editor like **VS Code** — https://code.visualstudio.com (optional but recommended)

Verify installation by opening a terminal (Command Prompt / PowerShell / Terminal) and running:
```
node --version
python --version
```
Both should print a version number.

## Step 1 — Get the project files
Unzip the `tablereserve.zip` file you were given, anywhere you like, e.g. `Desktop/tablereserve`.

## Step 2 — Run the backend
Open a terminal, then:
```bash
cd Desktop/tablereserve/backend

# Create a virtual environment (keeps Python packages isolated)
python -m venv venv

# Activate it:
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy the example environment file
# On Windows:
copy .env.example .env
# On Mac/Linux:
cp .env.example .env

# Start the server
uvicorn app.main:app --reload
```
You should see `Uvicorn running on http://0.0.0.0:8000`. Leave this terminal open.

Test it worked: open http://localhost:8000/api/docs in your browser — you'll see the interactive Swagger API documentation.

## Step 2.5 — Load demo data (optional but recommended)
By default the database is empty — you'd have to manually register as an owner and add a restaurant to see anything in search. To skip that and instantly get **~200 realistic dummy restaurants** (with floor layouts, tables, and reviews already populated) for testing/demo purposes, run this **once**, in a **new terminal**, with the venv activated:
```bash
cd Desktop/tablereserve/backend
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux
python -m scripts.seed_data
```
Wait for it to print `Done. Seeded 200 restaurants...`. It also creates ready-to-use demo accounts (all with password `password123`):
- Admin: `admin@tablereserve-demo.com`
- Owners: `owner0@tablereserve-demo.com` through `owner24@tablereserve-demo.com`
- Customers: `customer0@tablereserve-demo.com` through `customer29@tablereserve-demo.com`

Every seeded restaurant also gets an auto-generated banner photo and a few interior photos (distinctive gradient graphics, not real photography — fully self-contained so nothing ever breaks or needs an API key).

**Already seeded restaurants before and they have no images?** Run this instead — it only fills in images for restaurants that don't have any yet, without touching or duplicating anything else:
```bash
python -m scripts.backfill_images
```
It works against whatever database your `.env` currently points to — your local SQLite or your live Supabase database (see "Load demo data on the live site" further down for how to point it at Supabase).

Refresh the frontend's search page — restaurants across Chennai, Bangalore, Salem, and Coimbatore should now appear immediately, each with its own photo. About 10% are left in "pending" status on purpose, so you can log in as `admin@tablereserve-demo.com` and try the restaurant-approval flow too.

This script is safe to run only once per database — running it again will skip re-seeding unless you delete `tablereserve.db` first (or set `RESEED=1` before running it, to add another 200 on top).

## Step 3 — Run the frontend
Open a **second** terminal (leave the backend running in the first one):
```bash
cd Desktop/tablereserve/frontend

# Install dependencies (only needed once)
npm install

# Copy the example environment file
# On Windows:
copy .env.example .env
# On Mac/Linux:
cp .env.example .env

# Start the app
npm run dev
```
You should see `Local: http://localhost:5173/`. Open that URL in your browser.

**You now have the full app running locally, 100% free.** Register an account, add a restaurant as an owner, etc.

## Step 4 — Make yourself an admin (one-time, to access the admin dashboard)
The admin role can't be picked at signup (for security). To create your first admin:
1. Register a normal account at http://localhost:5173/register (choose "Customer" — the role doesn't matter, you'll change it).
2. Stop the backend (Ctrl+C in its terminal).
3. In the `backend` folder, run:
```bash
python -c "
from app.core.database import SessionLocal
from app.models import models as m
db = SessionLocal()
u = db.query(m.User).filter(m.User.email == 'YOUR_EMAIL_HERE').first()
u.role = m.UserRole.admin
db.commit()
print('Done:', u.email, u.role)
"
```
Replace `YOUR_EMAIL_HERE` with the email you registered with.
4. Restart the backend (`uvicorn app.main:app --reload`) and log in again on the frontend — you'll now see the Admin Dashboard link in the navbar.

---

# PART 2 — Deploy it live for free

You'll use 3 free services:
- **Supabase** → free Postgres database (replaces local SQLite)
- **Render** → free backend hosting (FastAPI)
- **Vercel** → free frontend hosting (React)

## Step 1 — Create a free Supabase database
1. Go to https://supabase.com → click **Start your project** → sign up (free, no credit card).
2. Click **New Project**.
   - Name: `tablereserve`
   - Database Password: create a strong password and **save it somewhere** — you'll need it.
   - Region: pick the one closest to you.
   - Click **Create new project** (takes ~2 minutes to provision).
3. Once ready, go to **Project Settings** (gear icon) → **Database**.
4. Under **Connection string**, select the **URI** tab, copy the string. It looks like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres`
5. Replace `[YOUR-PASSWORD]` with the password you created in step 2. Save this full string — this is your `DATABASE_URL`.

> Free tier note: Supabase pauses free projects after 7 days of no activity. Just click "Restore" in the dashboard if that happens — no data is lost.

## Step 2 — Deploy the backend to Render
1. Push your `tablereserve` folder to a GitHub repository (if you don't have one: go to https://github.com/new, create a repo, then follow GitHub's instructions to push your code — or use GitHub Desktop app if you prefer a UI).
2. Go to https://render.com → sign up free (you can sign up with your GitHub account).
3. Click **New +** → **Web Service**.
4. Connect your GitHub repo, select it.
5. Configure:
   - **Name**: `tablereserve-api`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
6. Click **Advanced** → **Add Environment Variable** and add these one by one:
   - `DATABASE_URL` = the Supabase connection string from Part 2 Step 1
   - `JWT_SECRET_KEY` = any long random string (e.g. generate one at https://randomkeygen.com, use a "CodeIgniter Encryption Key")
   - `ENV` = `production`
   - `CORS_ORIGINS` = `https://your-app-name.vercel.app` (you'll get this exact URL in Part 2 Step 3 below — for now put a placeholder like `https://placeholder.vercel.app`, you'll update it after)
7. Click **Create Web Service**. Wait for the build to finish (~3-5 minutes).
8. Once live, copy your backend URL, e.g. `https://tablereserve-api.onrender.com`. Test it: open `https://tablereserve-api.onrender.com/api/health` — should show `{"status":"ok",...}`.

> Free tier note: Render free web services **sleep after 15 minutes of inactivity** and take ~30-50 seconds to wake up on the next request. This is normal for free hosting.

## Step 3 — Deploy the frontend to Vercel
1. Go to https://vercel.com → sign up free (with GitHub).
2. Click **Add New** → **Project** → import your `tablereserve` GitHub repo.
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (should auto-detect)
4. Click **Environment Variables**, add:
   - `VITE_API_URL` = your Render backend URL from Step 2 (e.g. `https://tablereserve-api.onrender.com`) — **no trailing slash**
5. Click **Deploy**. Wait ~2 minutes.
6. You'll get a URL like `https://tablereserve.vercel.app` — this is your live app!

## Step 4 — Connect the two (fix CORS)
1. Copy your real Vercel URL from Step 3.
2. Go back to Render → your backend service → **Environment** tab.
3. Edit `CORS_ORIGINS` to your real Vercel URL, e.g. `https://tablereserve.vercel.app`
4. Save — Render will automatically redeploy.

**Your app is now live and free for anyone to use.**

### Optional: load demo data on the live site too
Render's Shell tab now requires a paid plan, so instead run the script from your own PC, pointed temporarily at your live Supabase database:

1. Get your **pooler connection string** from Supabase (Settings → Database → Connection pooling → Transaction mode) — looks like:
   ```
   postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
2. Temporarily edit `backend\.env` (or `backend/.env` on Mac/Linux) and set `DATABASE_URL` to that string (with your real password filled in)
3. Run:
   ```bash
   cd backend
   venv\Scripts\activate       # Windows
   source venv/bin/activate    # Mac/Linux
   pip install -r requirements.txt
   python -m scripts.seed_data
   ```
   (or `python -m scripts.backfill_images` instead, if restaurants already exist on the live site and just need photos added)
4. **Change `DATABASE_URL` in `backend\.env` back to `sqlite:///./tablereserve.db`** afterward, so your local dev environment goes back to normal and isn't accidentally still pointed at production.

### Optional: add photos to restaurants that don't have any
If you seeded restaurants before the image feature existed (or added a restaurant yourself without a banner), run this — it only fills in images for restaurants missing one, without touching anything else:
```bash
python -m scripts.backfill_images
```
Same idea as above: point `.env` at whichever database (local or live Supabase) you want to update, then switch it back afterward if needed.

## Step 5 — Make yourself an admin on the live site
Same idea as local, but you'll run the promote-to-admin script against your Supabase database instead. Easiest way: in Supabase dashboard → **Table Editor** → `users` table → find your row → change the `role` column value from `customer` to `admin` directly in the table editor UI, then save.

---

# Optional: Enable Google Sign-In (still free)
The app currently supports email/password login fully. To add Google Sign-In:
1. In Supabase dashboard → **Authentication** → **Providers** → enable **Google**.
2. Follow Supabase's on-screen instructions to create a Google Cloud OAuth Client ID (free, needs a Google account) at https://console.cloud.google.com/apis/credentials.
3. Paste the Client ID/Secret into Supabase's Google provider settings.
4. This requires connecting the frontend to `@supabase/supabase-js` (already installed) for the Google button — this wiring is not included by default since it needs your personal Supabase project keys. Ask if you'd like this added once your Supabase project is set up.

# Optional: Enable real image uploads
1. In Supabase dashboard → **Storage** → create a new public bucket named `tablereserve-images`.
2. Use `@supabase/supabase-js` (already installed in the frontend) to upload files directly from the browser to that bucket, then call the existing backend endpoints (`/api/owner/restaurants/{id}/images`, `/api/users/me/picture`) with the resulting public URL.

---

# Troubleshooting
- **Backend won't start locally**: make sure your virtual environment is activated (you should see `(venv)` in your terminal prompt) before running `pip install` or `uvicorn`.
- **Frontend shows network errors**: check that `VITE_API_URL` in `frontend/.env` matches where your backend is actually running.
- **"CORS error" in browser console**: your backend's `CORS_ORIGINS` doesn't include your frontend's exact URL — double check for typos/trailing slashes.
- **Render backend is slow to respond the first time**: this is the free-tier "cold start" — wait 30-60 seconds, it wakes up.
- **Supabase project shows "paused"**: click "Restore project" in the Supabase dashboard — takes about a minute.
