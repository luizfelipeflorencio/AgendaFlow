# 🔑 Where to Find Your Supabase Credentials

## Step-by-Step Guide to Get SUPABASE_URL and SUPABASE_ANON_KEY

### 1. 🌐 Go to Supabase Dashboard
- Open your browser and go to: **https://supabase.com**
- Click **"Sign In"** (or **"Start your project"** if you don't have an account yet)

### 2. 📋 Access Your Project
- After logging in, you'll see your **Project Dashboard**
- If you don't have a project yet, click **"New Project"**
- If you have projects, click on the project you want to use

### 3. 🔧 Find Your API Credentials
Once inside your project:

1. **Look at the left sidebar** and click on **"Settings"** (gear icon ⚙️)
2. In the Settings menu, click on **"API"**
3. You'll see a page titled **"API Settings"**

### 4. 📝 Copy Your Credentials

On the API Settings page, you'll find:

#### 🌍 Project URL
- **Label**: "Project URL" or "URL"
- **Format**: `https://xxxxxxxxxx.supabase.co`
- **Example**: `https://abcdefghij1234567890.supabase.co`
- **Copy this entire URL** ← This is your `SUPABASE_URL`

#### 🔐 API Keys Section
Look for the **"Project API keys"** section:

- **anon / public key**
  - **Label**: "anon public" or "anon"
  - **Format**: Starts with `eyJ...` (very long string)
  - **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoxMjM0NTY3ODkwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDEyMzQ1NjcsImV4cCI6MTk1NjgxMDU2N30.xyz123...`
  - **Copy this entire key** ← This is your `SUPABASE_ANON_KEY`

### 5. ✏️ Update Your .env File

Replace the placeholder values in your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key...
```

## 🖼️ Visual Reference

```
Supabase Dashboard
├── Left Sidebar
│   ├── 🏠 Home
│   ├── 📊 Table Editor
│   ├── 🔍 SQL Editor
│   ├── 📈 Database
│   ├── 🔑 Authentication
│   ├── 📁 Storage
│   ├── 🌐 Edge Functions
│   └── ⚙️ Settings ← Click Here!
│       ├── General
│       ├── 🔌 API ← Then Click Here!
│       ├── Database
│       ├── Auth
│       └── Storage
│
└── API Settings Page
    ├── 📍 Project URL: https://xxxxx.supabase.co
    └── 🔑 Project API keys
        ├── anon public: eyJhbGciOi... ← Copy This!
        └── service_role: eyJhbGciOi... (Don't use this one)
```

## ⚠️ Important Notes

1. **Use the `anon` key**, NOT the `service_role` key
2. **Never share these credentials publicly** (don't commit them to GitHub)
3. **Copy the entire URL and key** - they're quite long
4. **No quotes needed** in the .env file

## 🆘 If You Don't Have a Supabase Project Yet

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up/Login with GitHub, Google, or email
4. Click **"New Project"**
5. Choose your organization
6. Fill in:
   - **Name**: `AgendaFlow` (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
7. Click **"Create new project"**
8. Wait 1-2 minutes for setup
9. Then follow steps 3-5 above

## ✅ How to Verify It's Working

After updating your `.env` file:
1. Restart your development server: `npm run dev`
2. Look for this message in the terminal: **"🔥 Using Supabase storage"**
3. If you see **"💾 Using in-memory storage"**, check your credentials

## 🔧 Troubleshooting

- **Can't find Settings?** - Make sure you're inside a project, not on the main dashboard
- **API page is empty?** - Wait for your project to finish initializing
- **Still shows in-memory storage?** - Double-check there are no spaces or quotes around your credentials in `.env`