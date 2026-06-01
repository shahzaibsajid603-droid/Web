-- Aroosh Online Tutors - Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
  avatar TEXT DEFAULT '👤',
  bio TEXT,
  qualifications TEXT,
  subjects TEXT[], -- Array of subjects
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  years_of_experience INTEGER,
  experience_level TEXT,
  availability JSONB, -- Flexible availability schedule
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  tutor_id UUID REFERENCES profiles(id),
  subject TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- Duration in minutes
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  student_id UUID REFERENCES profiles(id),
  tutor_id UUID REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded', 'overdue')),
  grade INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table (for community/blogging)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  tags TEXT[],
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutor applications table
CREATE TABLE IF NOT EXISTS tutor_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  qualifications TEXT,
  experience TEXT,
  subjects TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  reporter_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  requester_id UUID REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experiences table
CREATE TABLE IF NOT EXISTS experiences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- Helper: check if the current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STRICT RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Allow public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Bookings policies
CREATE POLICY "Bookings select own or admin" ON bookings FOR SELECT USING (
  student_id = auth.uid() OR tutor_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Bookings insert by student" ON bookings FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Bookings update by participant" ON bookings FOR UPDATE USING (
  student_id = auth.uid() OR tutor_id = auth.uid() OR public.is_admin()
);

-- Messages policies
CREATE POLICY "Messages select own or admin" ON messages FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Messages insert by sender" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Reviews policies
CREATE POLICY "Allow public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviews insert by student" ON reviews FOR INSERT WITH CHECK (student_id = auth.uid());

-- Assignments policies
CREATE POLICY "Assignments select own or admin" ON assignments FOR SELECT USING (
  student_id = auth.uid() OR tutor_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Assignments insert by tutor" ON assignments FOR INSERT WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "Assignments update by participant" ON assignments FOR UPDATE USING (
  student_id = auth.uid() OR tutor_id = auth.uid() OR public.is_admin()
);

-- Announcements policies
CREATE POLICY "Allow public read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Announcements insert by admin" ON announcements FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Announcements update by admin" ON announcements FOR UPDATE USING (public.is_admin());
CREATE POLICY "Announcements delete by admin" ON announcements FOR DELETE USING (public.is_admin());

-- Posts policies
CREATE POLICY "Allow public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Posts insert by author" ON posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Posts update by author" ON posts FOR UPDATE USING (author_id = auth.uid() OR public.is_admin());
CREATE POLICY "Posts delete by author" ON posts FOR DELETE USING (author_id = auth.uid() OR public.is_admin());

-- Disputes policies
CREATE POLICY "Disputes select own or admin" ON disputes FOR SELECT USING (
  reporter_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Disputes insert by reporter" ON disputes FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Disputes update by admin" ON disputes FOR UPDATE USING (public.is_admin());

-- Refunds policies
CREATE POLICY "Refunds select own or admin" ON refunds FOR SELECT USING (
  requester_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Refunds insert by requester" ON refunds FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Refunds update by admin" ON refunds FOR UPDATE USING (public.is_admin());

-- Feedback policies
CREATE POLICY "Feedback select own or admin" ON feedback FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Feedback insert by user" ON feedback FOR INSERT WITH CHECK (user_id = auth.uid());

-- Experiences policies
CREATE POLICY "Allow public read approved experiences" ON experiences FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Experiences insert by user" ON experiences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Experiences update by admin" ON experiences FOR UPDATE USING (public.is_admin());

-- Tutor applications policies
CREATE POLICY "Applications select by admin" ON tutor_applications FOR SELECT USING (public.is_admin());
CREATE POLICY "Applications insert by anyone" ON tutor_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Applications update by admin" ON tutor_applications FOR UPDATE USING (public.is_admin());

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROLE-BASED ACCESS CONTROL (RLS) - EXPLICIT ANON POLICIES
-- ============================================================================

-- Explicit policies so unauthenticated (guest/anon) visitors can browse tutors
CREATE POLICY IF NOT EXISTS "Allow anon read all profiles" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Allow authenticated read all profiles" ON profiles FOR SELECT TO authenticated USING (true);

-- Ensure the role column accepts only valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'tutor', 'admin'));
  END IF;
END $$;

-- ============================================================================
-- AUTO-CREATE PROFILE TRIGGER (runs after user signs up via Supabase Auth)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    '👤'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing auth users that don't have one
INSERT INTO public.profiles (id, email, name, role, avatar)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'User'),
  COALESCE(au.raw_user_meta_data->>'role', 'student'),
  '👤'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
