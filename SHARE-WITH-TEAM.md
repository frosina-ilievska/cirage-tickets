# Share with team using ngrok

ngrok creates a temporary public URL that tunnels directly to your local machine.
Anyone with the link can access the app — no server, no deployment needed.

---

## One-time setup (5 minutes)

**1. Create a free ngrok account**
Go to https://ngrok.com → Sign up (free)

**2. Download ngrok**
On the ngrok dashboard → "Download" → pick "Windows"
Unzip and place `ngrok.exe` anywhere (e.g. your Desktop)

**3. Connect your account**
On the ngrok dashboard, copy your authtoken. It looks like:
`ngrok config add-authtoken YOUR_TOKEN_HERE`

Open Command Prompt and paste that command. Run it once.

---

## Every time you want to share

**Step 1 — Start the app** (if not already running):
Open the `cirage-tickets` folder → double-click `setup.bat`
Wait for `✓ Ready` in the terminal.

**Step 2 — Open a second terminal window** and run:
```
ngrok http 3000
```

**Step 3 — Copy the URL**
ngrok shows something like:
```
Forwarding  https://a1b2-87-123-45-67.ngrok-free.app → http://localhost:3000
```
Share that `https://...ngrok-free.app` URL with your team.

---

## Notes

- The URL changes every time you restart ngrok (free plan)
- The app is only online while your computer is on and both terminals are running
- Anyone with the link can access it — it's not password-protected at the network level,
  but they still need to log in with a valid account
- Session ends when you close the ngrok terminal
