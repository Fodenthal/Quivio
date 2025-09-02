# Supabase Authentication Setup Guide (Official Docs Compliant)

This guide follows the [official Supabase Next.js SSR documentation](https://supabase.com/docs/guides/auth/server-side/nextjs) exactly.

## 1. Environment Variables Setup

### Create `.env.local` in `apps/web/`
```env
# Note: Use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (not ANON_KEY) per official docs
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
```

**Important**: The official docs use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, not `ANON_KEY`.

## 2. Supabase Dashboard Configuration

### Email Template Configuration
1. Go to **Authentication > Email Templates** in your Supabase dashboard
2. In the **Confirm signup** template, change the confirmation URL to:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

### Authentication Settings
1. Go to **Authentication > Settings**
2. Set **Site URL** to: `http://localhost:3000` (for development)
3. Add **Redirect URLs**: `http://localhost:3000/**`
4. Enable **Email confirmations** (recommended)

## 3. Database Schema Setup

Run these SQL commands in your Supabase SQL editor:

### User Profiles Table
```sql
-- Create user profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. Implementation Summary

### What's Been Created:

1. **✅ Supabase Utils** (`src/utils/supabase/`)
   - `client.ts` - Browser client for Client Components
   - `server.ts` - Server client for Server Components/Actions
   - `middleware.ts` - Token refresh logic

2. **✅ Middleware** (`middleware.ts`)
   - Automatic auth token refresh
   - Protected route handling (only `/profile`, `/dashboard`, `/settings`)
   - Maintains anonymous access to game pages

3. **✅ Auth Routes**
   - `/login` - Login page with Server Actions
   - `/auth/confirm` - Email confirmation handler
   - `/error` - Auth error page

4. **✅ Server Actions** (`app/login/actions.ts`)
   - `login()` and `signup()` functions
   - Proper redirect handling
   - Server-side auth operations

## 5. Verification Steps

1. **Environment Setup**:
   ```bash
   cd apps/web
   # Create .env.local with your Supabase credentials
   pnpm dev
   ```

2. **Test Auth Flow**:
   - Visit `http://localhost:3000/login`
   - Try creating an account (will send confirmation email)
   - Check Supabase dashboard for new user in auth.users table

3. **Test Anonymous Access**:
   - Visit `http://localhost:3000/` (should work without auth)
   - Create/join games as guest (should work as before)

4. **Test Protected Routes**:
   - Visit `http://localhost:3000/profile` (should redirect to login)

## 6. Next Steps

After verifying this foundation works:

### Phase 2: Integration with Existing App
- Update `UserDisplayName` component to show auth state
- Add "Sign In" link to header for anonymous users  
- Show user menu for authenticated users

### Phase 3: Enhanced Features
- User profile management page
- Game history tracking
- Settings persistence

## 7. Key Differences from Previous Implementation

✅ **Correct Package**: Using `@supabase/ssr` for proper SSR support
✅ **Server Actions**: Auth operations use Next.js Server Actions, not client-side calls
✅ **Dual Client Pattern**: Separate clients for browser vs server contexts
✅ **Middleware**: Proper token refresh via middleware
✅ **Route Handlers**: Email confirmation via Route Handler
✅ **Protected Routes**: Only specific routes require auth, game remains accessible

This implementation now correctly follows the official Supabase documentation for Next.js SSR authentication.
