# 🎬 ScreenCast — Free Screen Recording for Performance Marketers

Record your screen, share with clients, get feedback with timestamped comments.

## 🚀 Quick Setup (15 minutes)

### Prerequisites
- MacBook with VS Code & Node.js installed (you already have this!)
- Chrome or Edge browser
- A Supabase account (you already have this!)

---

### Step 1: Create a New Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Name it: `screencast-app` (or whatever you like)
4. Set a database password (save it somewhere!)
5. Region: Choose closest to you (Mumbai for India)
6. Click **"Create new project"** — wait 2 minutes for setup

> ⚠️ This is a SEPARATE project from your billing CTM. They don't interfere.

---

### Step 2: Set Up the Database

1. In your new Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `supabase-schema.sql` from this project
4. Copy ALL the SQL and paste it into the editor
5. Click **"Run"** (or Cmd+Enter)
6. You should see "Success. No rows returned" — that's correct!

---

### Step 3: Create Storage Bucket

1. In Supabase, click **"Storage"** in the left sidebar
2. Click **"New Bucket"**
3. Bucket name: `recordings`
4. Toggle **"Public bucket"** → **ON** (important!)
5. Click **"Create bucket"**

---

### Step 4: Get Your Supabase Keys

1. In Supabase, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** → looks like `https://abc123.supabase.co`
   - **anon / public key** → a long string starting with `eyJ...`

---

### Step 5: Set Up the Project on Your Mac

Open **Terminal** and run these commands one by one:

```bash
# Go to Documents (keeps it separate from your other projects)
cd ~/Documents

# Create the project folder
mkdir screencast-app
```

Now **copy all the project files** (that you downloaded from Claude) into this folder.

Your folder should look like:
```
~/Documents/screencast-app/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── postcss.config.js
├── supabase-schema.sql
├── .env.example
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── record/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── v/
│   │       └── [id]/
│   │           └── page.tsx
│   ├── components/
│   │   └── Recorder.tsx
│   └── lib/
│       └── supabase.ts
└── README.md
```

---

### Step 6: Create Environment File

```bash
cd ~/Documents/screencast-app

# Copy the example env file
cp .env.example .env.local
```

Now open `.env.local` in VS Code and fill in your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ScreenCast
```

---

### Step 7: Install & Run

```bash
cd ~/Documents/screencast-app

# Install dependencies
npm install

# Start the app
npm run dev
```

You should see:
```
▲ Next.js 14.x
- Local: http://localhost:3000
```

Open **http://localhost:3000** in Chrome!

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              → Landing page
│   ├── record/page.tsx       → Recording page
│   ├── dashboard/page.tsx    → All your recordings
│   └── v/[id]/page.tsx       → Shared video player (what viewers see)
├── components/
│   └── Recorder.tsx          → Core recording logic
└── lib/
    └── supabase.ts           → Database client & types
```

---

## 🎯 What You Can Do Right Now

1. **Record** → Go to `/record`, click "Start Recording", pick your screen
2. **Preview** → After stopping, watch the preview
3. **Upload** → Click "Upload & Get Link" to save to Supabase
4. **Share** → Copy the link and send it to anyone
5. **Watch** → Anyone with the link sees the video + can add comments
6. **Dashboard** → Go to `/dashboard` to see all your recordings

---

## 🚀 Deploy to Vercel (Get Your .vercel.app Domain)

When you're ready to put this online:

1. Push code to GitHub (create a new repo — NOT the same as billing CTM)
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repo
5. Add Environment Variables (same as .env.local)
6. Click "Deploy"

Your app will be live at: `screencast-app.vercel.app`

> This is completely separate from any other Vercel project you have.

---

## ⚠️ Important Notes

- **Browser support:** Works best in Chrome/Edge. Safari has limited screen recording support.
- **Storage:** Supabase free tier gives 1GB storage. That's roughly 20-40 videos for testing.
- **No auth yet:** Anyone can record. We'll add login in the next phase.
- **Video format:** Records in WebM. Plays in all modern browsers.

---

## 🔜 Coming in Phase 2

- [ ] User authentication (login/signup)
- [ ] Cloudflare R2 for unlimited storage
- [ ] AI transcription (Whisper API)
- [ ] AI-generated summaries & chapters
- [ ] Action item extraction
- [ ] Client email generation
- [ ] Viewer analytics (who watched, drop-off)
- [ ] Video trimming/editing
