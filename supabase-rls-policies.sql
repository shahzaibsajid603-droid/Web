-- ============================================================================
-- AROOSH ONLINE TUTORS - SUPABASE RLS & SCHEMA UPDATES
-- Run this in Supabase Dashboard > SQL Editor > New query
-- ============================================================================

-- 1. Schema additions
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- 3. Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Announcements policies (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admin can insert announcements" ON announcements;
CREATE POLICY "Only admin can insert announcements" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admin can update announcements" ON announcements;
CREATE POLICY "Only admin can update announcements" ON announcements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admin can delete announcements" ON announcements;
CREATE POLICY "Only admin can delete announcements" ON announcements
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Posts policies (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view active posts" ON posts;
CREATE POLICY "Anyone can view active posts" ON posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admin can insert posts" ON posts;
CREATE POLICY "Only admin can insert posts" ON posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admin can update posts" ON posts;
CREATE POLICY "Only admin can update posts" ON posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admin can delete posts" ON posts;
CREATE POLICY "Only admin can delete posts" ON posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = student_id OR auth.uid() = tutor_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Students can request bookings" ON bookings;
CREATE POLICY "Students can request bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admin can manage all bookings" ON bookings;
CREATE POLICY "Admin can manage all bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin can delete bookings" ON bookings;
CREATE POLICY "Admin can delete bookings" ON bookings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Tutor Applications policies
DROP POLICY IF EXISTS "Anyone can submit tutor application" ON tutor_applications;
CREATE POLICY "Anyone can submit tutor application" ON tutor_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view all applications" ON tutor_applications;
CREATE POLICY "Admin can view all applications" ON tutor_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin can update applications" ON tutor_applications;
CREATE POLICY "Admin can update applications" ON tutor_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. Experiences policies (public read approved, admin manage)
DROP POLICY IF EXISTS "Anyone can view approved experiences" ON experiences;
CREATE POLICY "Anyone can view approved experiences" ON experiences
  FOR SELECT USING (
    status = 'approved' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can submit experiences" ON experiences;
CREATE POLICY "Users can submit experiences" ON experiences
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin can update experiences" ON experiences;
CREATE POLICY "Admin can update experiences" ON experiences
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 9. Feedback policies
DROP POLICY IF EXISTS "Users can submit feedback" ON feedback;
CREATE POLICY "Users can submit feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin can view all feedback" ON feedback;
CREATE POLICY "Admin can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 10. Set admin role for your account
UPDATE profiles SET role = 'admin' WHERE email = 'arooshonlinetutors@gmail.com';
