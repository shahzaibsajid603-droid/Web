# Aroosh Online Tutors

Expert online tutoring platform built with HTML, CSS, JavaScript, and Supabase.

## Features

- **Student & Tutor Signup** – Instant registration via Supabase Auth
- **Admin Dashboard** – Full control over sessions, tutors, students, announcements, and posts
- **Session Management** – Students request sessions, admins approve/manage
- **Announcements & Posts** – Admin-managed content visible to all users including guests
- **Tutor Applications** – Tutors apply, admin reviews and approves
- **User Experiences** – Community experiences with admin moderation
- **WhatsApp Integration** – Quick contact via floating button
- **Responsive Design** – Mobile-first with collapsible sidebar

## Tech Stack

- Frontend: Vanilla HTML/CSS/JavaScript (SPA with hash-based routing)
- Backend: [Supabase](https://supabase.com) (Auth, Database, Storage)
- Media: Cloudinary (image/video uploads)

## Setup

1. Create a Supabase project
2. Run the SQL from `supabase-schema.sql` in your Supabase SQL editor
3. Update the Supabase URL and anon key in `app.js` and `login.html`
4. Deploy to any static hosting (Netlify, Vercel, GitHub Pages, etc.)

See `SUPABASE-SETUP.md` for detailed database setup instructions.

## Admin Access

The admin is identified by the email configured in `ADMIN_EMAIL` constant in `app.js`. The admin account must be created through the normal signup flow on Supabase, then the profile role can be set to 'admin' in the database.
