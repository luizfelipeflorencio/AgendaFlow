# Supabase Integration Setup Guide

## 🚀 Overview
This guide will help you integrate Supabase with your AgendaFlow project, replacing the in-memory storage with a real PostgreSQL database.

## 📋 Prerequisites
- A Supabase account (free tier is sufficient)
- Node.js and npm installed
- Your AgendaFlow project set up

## 🔧 Step-by-Step Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `AgendaFlow` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
6. Click "Create new project"
7. Wait for the project to be set up (usually takes 1-2 minutes)

### 2. Get Your Supabase Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Anon (public) key** (starts with `eyJ...`)

### 3. Update Your Environment Variables
1. Open the `.env` file in your project root
2. Replace the placeholder values:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

### 4. Set Up the Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase-setup.sql` into the editor
4. Click "Run" to execute the SQL commands
5. Verify that the tables were created by going to **Table Editor**

### 5. Test the Integration
1. Make sure your `.env` file has the correct Supabase credentials
2. Restart your development server:
```bash
npm run dev
```
3. Look for the console message: "🔥 Using Supabase storage"
4. Test the application by:
   - Creating a new appointment
   - Logging into the manager dashboard
   - Verifying data persists across server restarts

## 🔍 Verification Checklist

### Database Tables Created ✓
- [ ] `appointments` table exists
- [ ] `managers` table exists  
- [ ] `time_slots` table exists
- [ ] Default data is inserted (admin user, time slots)

### Application Integration ✓
- [ ] Server shows "🔥 Using Supabase storage" message
- [ ] Can create new appointments
- [ ] Can view appointments in manager dashboard
- [ ] Data persists after server restart
- [ ] Login works with admin/admin

### Error Troubleshooting ✓
- [ ] No TypeScript errors when running `npm run check`
- [ ] No console errors in browser
- [ ] API endpoints respond correctly

## 🛠️ Troubleshooting

### Common Issues:

#### 1. "Missing SUPABASE_URL environment variable"
- Ensure your `.env` file has the correct `SUPABASE_URL`
- Restart your development server after updating `.env`

#### 2. "Failed to create appointment"
- Check your Supabase project is active
- Verify RLS policies are set up correctly
- Check the browser network tab for API errors

#### 3. Data not persisting
- Confirm you're using the Supabase storage (look for the 🔥 message)
- Check if your `.env` variables are loaded correctly
- Verify database tables exist in Supabase

#### 4. Authentication issues
- Ensure the default admin user was created
- Check the managers table in Supabase dashboard
- Verify the username/password in the login form

## 📊 Database Management

### Viewing Data
- Go to Supabase Dashboard → **Table Editor**
- Select a table to view/edit data
- Use **SQL Editor** for complex queries

### Backup & Recovery
- Supabase automatically backs up your database
- You can export data from **Table Editor** if needed

### Performance Monitoring
- Monitor usage in **Settings** → **Usage**
- Check logs in **Logs** section for errors

## 🔐 Security Considerations

### Current Setup (Development)
- Uses permissive RLS policies for ease of development
- Admin password is stored in plain text

### Production Recommendations
1. **Implement proper authentication**:
   - Use Supabase Auth or JWT tokens
   - Hash passwords with bcrypt
   
2. **Tighten RLS policies**:
   - Restrict access based on authenticated users
   - Add role-based permissions

3. **Environment Security**:
   - Use strong session secrets
   - Keep Supabase keys secure
   - Enable additional security features in Supabase

## 🚀 Next Steps

1. **Test thoroughly** - Create appointments, use manager dashboard
2. **Customize time slots** - Add/remove available times via database
3. **Enhance security** - Implement proper authentication
4. **Deploy** - Consider Vercel, Netlify, or Railway for hosting
5. **Monitor** - Set up alerts and monitoring in Supabase

## 📞 Support

If you encounter issues:
1. Check the Supabase [documentation](https://supabase.com/docs)
2. Review the console logs for error messages
3. Verify your environment configuration
4. Test database connectivity in Supabase dashboard

---

🎉 **Congratulations!** Your AgendaFlow project is now powered by Supabase!