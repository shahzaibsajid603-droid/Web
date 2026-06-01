# Supabase Integration Setup Guide

Your Aroosh Online Tutors app has been successfully migrated from localStorage to Supabase! Follow these steps to complete the setup.

## 🚀 Quick Setup Steps

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/login with your GitHub account
4. Create a new project:
   - **Organization**: Choose or create one
   - **Project Name**: `aroosh-tutors` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the closest region to your users

### 2. Get Your Supabase Credentials
Once your project is created, go to **Project Settings** → **API** and copy:
- **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
- **anon public** API key

### 3. Update Your App Configuration
Open `app.js` and replace the placeholder values:

```javascript
// Replace these lines at the top of app.js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';        // Paste your Project URL here
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Paste your anon key here
```

### 4. Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` 
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

### 5. Enable Authentication
1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:5500`
3. Under **Redirect URLs**, add: `http://localhost:5500`
4. Enable **Email** auth provider (should be enabled by default)

### 6. Test Your Setup
1. Start your local server: `npx http-server -p 5500`
2. Open your browser to `http://localhost:5500`
3. Try signing up as a new user
4. Check if data appears in your Supabase database tables

## 📊 Database Tables Created

Your schema includes these tables:
- `profiles` - User profiles (students, tutors, admins)
- `bookings` - Tutor booking sessions  
- `reviews` - Tutor reviews and ratings
- `assignments` - Homework and assignments
- `messages` - Private messaging system
- `announcements` - Admin announcements
- `posts` - Community posts/blogging
- `feedback` - User feedback system
- `disputes` - Dispute management
- `refunds` - Refund requests
- `tutor_applications` - Tutor sign-up applications
- `experiences` - User experience sharing

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Tutors can only manage their bookings
- Admins have full access
- Authentication handled by Supabase Auth

## 🛠️ Key Changes Made

### Before (localStorage):
```javascript
// Old way
const data = JSON.parse(localStorage.getItem('appData'));
data.users.push(newUser);
localStorage.setItem('appData', JSON.stringify(data));
```

### After (Supabase):
```javascript
// New way
const { data, error } = await supabase
  .from('profiles')
  .insert(newUser)
  .select()
  .single();
```

## 🔄 Authentication Methods

Your app now supports:
- **Sign Up**: `appData.signUp(email, password, name, role)`
- **Sign In**: `appData.signIn(email, password)`  
- **Sign Out**: `appData.signOut()`
- **Current User**: `appData.getCurrentUser()`

## 📝 Important Notes

1. **Async/Await**: All database operations are now async and return promises
2. **Error Handling**: Each method includes proper error handling
3. **Real-time**: You can easily add real-time subscriptions later
4. **Scalable**: Your app can now handle multiple users simultaneously

## 🐛 Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure your domain is added to allowed origins
2. **Auth Errors**: Check that email/password auth is enabled
3. **Schema Errors**: Ensure you ran the complete SQL schema
4. **Permission Errors**: Verify RLS policies are correctly set

### Debug Tips:
- Check browser console for errors
- Use Supabase dashboard to verify data
- Test with the SQL Editor first

## 🚀 Next Steps

1. **Custom Domain**: Add your custom domain to Supabase
2. **Real-time Updates**: Add real-time subscriptions for live messaging
3. **File Storage**: Use Supabase Storage for profile pictures and files
4. **Edge Functions**: Add serverless functions for complex operations

## 📞 Support

If you encounter issues:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the browser console for specific error messages
3. Verify your API keys are correct
4. Ensure the database schema was properly applied

---

**🎉 Congratulations!** Your tutoring platform is now running on Supabase with a professional, scalable backend!
