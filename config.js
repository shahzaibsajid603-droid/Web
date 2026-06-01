// ============================================================================
// AROOSH ONLINE TUTORS - CONFIGURATION
// ============================================================================
// Centralizes all environment-specific settings in one file.
// To switch between dev/staging/production, change values here only.
//
// SECURITY NOTES:
// - The Supabase anon key is a *publishable* key safe for client-side use.
//   All data access is gated by Row Level Security (RLS) enforced server-side.
//   NEVER put the service_role key here.
// - Cloudinary uses an unsigned upload preset scoped to this app only.
//   Restrict allowed file types and max size in your Cloudinary dashboard.
// ============================================================================

const APP_CONFIG = Object.freeze({
  // Supabase
  SUPABASE_URL: 'https://xqcrkklhhwsuhnqphtxg.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_h_xLHP7xPecIqhASfg26-Q_lDPFfvKy',

  // Cloudinary (unsigned upload preset)
  CLOUDINARY_CLOUD_NAME: 'djhrlkjzw',
  CLOUDINARY_UPLOAD_PRESET: 'mwj3qjc6',

  // Admin
  ADMIN_EMAIL: 'arooshonlinetutors@gmail.com',

  // WhatsApp contact
  WHATSAPP_NUMBER: '+923001234567',

  // App metadata
  APP_NAME: 'Aroosh Online Tutors',
  APP_DESCRIPTION: 'Expert online tutoring platform — connect with qualified tutors and achieve your learning goals.',
  APP_URL: 'https://arooshonlinetutors.com',
  APP_LOGO: 'aroosh-logo-light.png'
});
