# Cirage Paris — Ticket System

Internal ticket management for the Cirage Paris team.

---

## First-time setup (Windows)

1. **Move this folder** wherever you want to keep it (e.g. your Desktop or Documents)
2. **Open the folder** in File Explorer
3. **Double-click `setup.bat`**
   - This installs everything, creates the database, and starts the app
   - Takes about 2–3 minutes on first run
4. Open **http://localhost:3000** in your browser

That's it.

---

## Starting the app (after first setup)

Open a terminal in this folder and run:

```
npm run dev
```

Or double-click `start.bat` (if present).

---

## Demo accounts (seeded on first setup)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cirageparis.com | Admin123! |
| Designer | marie@cirageparis.com | Designer123! |
| Designer | sophie@cirageparis.com | Designer123! |
| Member | team@cirageparis.com | Member123! |

---

## Roles explained

| Role | What they can do |
|------|-----------------|
| **Admin** | See all tickets, edit anything, delete tickets, manage users & categories |
| **Member** | Create tickets, see tickets assigned to them or created by them, add comments |
| **Designer** | See unclaimed Design tickets (can self-assign), see their own tickets, add comments |

---

## Resetting the database

If you want to start fresh:

```
npm run db:reset
```

⚠️ This deletes all tickets, comments, and data. It re-seeds the demo accounts.

---

## Upgrading to production (Vercel)

When you're ready to put this online:

1. Create accounts at github.com, vercel.com, supabase.com, resend.com
2. Push this folder to a GitHub repo
3. Connect the repo to Vercel
4. Set environment variables in Vercel:
   - `DATABASE_URL` — from Supabase
   - `NEXTAUTH_SECRET` — a long random string
   - `NEXTAUTH_URL` — your Vercel URL (e.g. https://cirage-tickets.vercel.app)
   - `RESEND_API_KEY` — from Resend (enables real email notifications)
5. Switch Prisma provider from `sqlite` to `postgresql` in `prisma/schema.prisma`
