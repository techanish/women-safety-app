# Quick Setup Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- GitHub account (for Clerk)
- Supabase account
- Fast2SMS account (free tier available)

## Step 1: Clone and Install
```bash
cd women-safety-app
npm install
```

## Step 2: Environment Configuration

Create `.env` file in root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
VITE_CLERK_API_URL=https://api.clerk.com
FAST2SMS_API_KEY=your_fast2sms_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_ENV=development
```

## Step 3: Supabase Setup

### 3.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and ANON_KEY

### 3.2 Create Tables
Run in Supabase SQL editor:

```sql
-- SOS Logs Table
CREATE TABLE sos_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT,
  event_type TEXT NOT NULL,
  location JSONB,
  contact_count INTEGER,
  timestamp TIMESTAMP NOT NULL,
  synced_at TIMESTAMP NOT NULL,
  recording_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_sos_logs_clerk_user_id ON sos_logs(clerk_user_id);
CREATE INDEX idx_sos_logs_timestamp ON sos_logs(timestamp);

-- User Profiles Table (Optional)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  aadhar_number TEXT,
  profile_photo_url TEXT,
  address TEXT,
  blood_group TEXT,
  language_preference TEXT DEFAULT 'English',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Deploy Edge Function
Create folder: `supabase/functions/sync-offline-sos/`

Create `index.ts` (copy from project)

Deploy:
```bash
supabase functions deploy sync-offline-sos \
  --project-id your-project-id
```

## Step 4: Clerk Setup

### 4.1 Create Clerk Account
1. Go to [clerk.com](https://clerk.com)
2. Create new application
3. Choose "Phone number" authentication
4. Get publishable key

### 4.2 Configure OTP
- Set OTP length to 6 digits
- SMS provider: Clerk's default or custom

## Step 5: Fast2SMS Setup

### 5.1 Create Account
1. Go to [fast2sms.com](https://fast2sms.com)
2. Register and verify
3. Add SMS credits
4. Get API key from dashboard

### 5.2 Configure in Supabase
Set as environment variable in edge function

## Step 6: Google Maps Setup

### 6.1 Get API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Maps JavaScript API
4. Create API key (Browser restriction)
5. Copy key to `.env`

## Step 7: Run Development Server
```bash
npm run dev
```

Server runs on `http://localhost:5173`

## Step 8: Test Features

### Test Offline SOS
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Offline" checkbox
4. Tap SOS button
5. Go online - should auto-sync

### Test Safe Zones
1. Open Settings > Location
2. Add safe zone with your location
3. Navigate away
4. Check auto-disable safe mode

### Test Voice Commands
1. Settings > SOS Triggers > Voice Commands (ON)
2. Say "Help me" or "बचाओ"
3. Check SOS triggers automatically

### Test Profile
1. Go to Settings > Profile
2. Fill all required fields
3. Save
4. Refresh page - data persists

## Step 9: Build for Production
```bash
npm run build
npm run preview
```

## Deployment Options

### Option 1: Vercel
```bash
vercel
```

### Option 2: Netlify
```bash
netlify deploy
```

### Option 3: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

```bash
docker build -t women-safety-app .
docker run -p 5173:5173 women-safety-app
```

## Troubleshooting

### "Cannot find module '@/components/...'"
- Check import paths
- Ensure vite.config.ts has alias
- Clear node_modules: `rm -rf node_modules && npm install`

### "Geolocation not available"
- Use HTTPS or localhost
- Check browser permissions
- Desktop: Open DevTools, allow location

### "Clerk not configured"
- Check .env file exists
- Restart dev server: `npm run dev`
- Check publishable key format

### "IndexedDB errors"
- Check browser storage quota
- Clear IndexedDB: DevTools > Application > IndexedDB > Delete
- Check privacy mode (use regular mode for testing)

## Next Steps

1. Customize colors in `tailwind.config.ts`
2. Update app name in `index.html`
3. Add app icon in `public/`
4. Configure PWA manifest in `public/manifest.json`
5. Set up CI/CD pipeline
6. Configure monitoring/analytics

## Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Fast2SMS API](https://fast2sms.com/dev/bulk)
- [Google Maps API](https://developers.google.com/maps)
- [IndexedDB Docs](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## Security Checklist

- [ ] Never commit `.env` file
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Set CORS policies on Supabase
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Enable rate limiting on edge functions
- [ ] Implement proper logging

---

**Happy coding! 🚀**
