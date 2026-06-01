// ============================================================================
// AROOSH ONLINE TUTORS - COMPLETE APPLICATION
// ============================================================================

// Supabase Configuration
// SECURITY: ONLY the anon (public) key is used here. NEVER expose the
// service_role key on the frontend — it bypasses all RLS policies.
// All data access is gated by Row Level Security (RLS) enforced server-side.
const SUPABASE_URL = 'https://xqcrkklhhwsuhnqphtxg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_h_xLHP7xPecIqhASfg26-Q_lDPFfvKy';

// Initialize Supabase client robustly
let supabaseClient;
function initSupabaseClient() {
  if (window.supabase && window.supabase.createClient) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('[App] Supabase client initialized');
      return true;
    } catch (err) {
      console.error('Failed to create Supabase client in app.js:', err);
    }
  }
  return false;
}
if (!initSupabaseClient()) {
  console.warn('[App] Supabase SDK not ready, waiting...');
  window.addEventListener('load', () => {
    if (!supabaseClient) initSupabaseClient();
  });
}

// Global Sanitization Helper
function sanitize(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);
  // Strip script tags and event handlers first
  let cleaned = str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  return cleaned.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

// Strip dangerous content before storing in database
function sanitizeForStorage(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);
  return str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') // strip control chars
    .trim();
}



function normalizeRole(role) {
  if (!role) return 'guest';
  return String(role).toLowerCase();
}

const ADMIN_EMAIL = 'arooshonlinetutors@gmail.com';

function isAdmin(user) {
  if (!user) return false;
  return user.email === ADMIN_EMAIL || normalizeRole(user.role) === 'admin';
}



// Helper function to render avatar - returns HTML for emoji or image
function renderAvatar(avatar, size = 60, alt = 'Avatar') {
  if (!avatar) avatar = '👤';
  // Check if avatar is a base64 image or URL
  if (typeof avatar === 'string' && (avatar.startsWith('data:image') || avatar.startsWith('http'))) {
    return `<img src="${sanitize(avatar)}" alt="${sanitize(alt)}" style="width: ${size}px; height: ${size}px; object-fit: cover; border-radius: 50%; border: 2px solid var(--color-muted);">`;
  }
  // Return emoji as text
  return sanitize(avatar);
}

// Recursively sanitize all string values in an object before database storage
function sanitizeObjectStrings(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeForStorage(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObjectStrings);
  if (typeof obj === 'object') {
    const out = {};
    for (const key of Object.keys(obj)) {
      out[key] = sanitizeObjectStrings(obj[key]);
    }
    return out;
  }
  return obj;
}

// Ensure dark mode state is loaded immediately on start
const savedDarkMode = localStorage.getItem('darkMode') === 'true';
if (savedDarkMode) {
  document.body.classList.add('dark-mode');
}

// Dark Mode Toggle Export
window.toggleDarkMode = () => {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  if (typeof renderSidebar === 'function') {
    renderSidebar();
  }
};



// ============================================================================
// 1. supabaseClient DATA LAYER
// ============================================================================

class SupabaseDataLayer {
  constructor() {
    this.currentUser = null;
    this._authReady = new Promise(resolve => { this._resolveAuth = resolve; });
    this.initAuth();
  }

  async initAuth() {
    try {
      if (!supabaseClient) {
        console.error('[Auth] Supabase client not initialized');
        this.currentUser = null;
        return;
      }
      // Check for existing session
      const { data: { session } } = await supabaseClient.auth.getSession();
      console.log('[Auth] Session check:', session ? 'found' : 'none');
      if (session) {
        await this.loadUserProfile(session.user.id);
        console.log('[Auth] Profile loaded, currentUser:', this.currentUser);
        this._redirectToDashboardIfOnHome();
      } else {
        this.currentUser = null;
      }
      if (this._resolveAuth) { this._resolveAuth(); this._resolveAuth = null; }

      // Listen for auth changes
      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] State change:', event);
        if (session) {
          await this.loadUserProfile(session.user.id);
          if (typeof renderSidebar === 'function') renderSidebar();
          if (event === 'SIGNED_IN') {
            this._redirectToDashboardIfOnHome();
          }
        } else {
          this.currentUser = null;
          if (typeof renderSidebar === 'function') renderSidebar();
        }
      });
    } catch (err) {
      console.error('[Auth] initAuth error:', err);
      this.currentUser = null;
    } finally {
      if (this._resolveAuth) { this._resolveAuth(); this._resolveAuth = null; }
    }
  }

  _redirectToDashboardIfOnHome() {
    const hash = window.location.hash.slice(1) || '/';
    if (hash !== '/' && hash !== '') return;
    const role = normalizeRole(this.currentUser?.role);
    if (role === 'student') window.location.hash = '#/student-dashboard';
    else if (role === 'tutor') window.location.hash = '#/tutor-dashboard';
    else if (role === 'admin') window.location.hash = '#/admin';
  }

  async loadUserProfile(userId) {
    const buildFallbackProfile = async () => {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const email = user?.email || '';
        const detectedRole = (email === ADMIN_EMAIL) ? 'admin' : (user?.user_metadata?.role || 'student');
        return {
          id: userId,
          email: email,
          name: user?.user_metadata?.name || 'User',
          role: detectedRole,
          avatar: detectedRole === 'admin' ? '🛡️' : '👤',
          isFallback: true
        };
      } catch (fallbackError) {
        console.warn('Could not build fallback profile from auth user:', fallbackError);
        return {
          id: userId,
          email: '',
          name: 'User',
          role: 'student',
          avatar: '👤',
          isFallback: true
        };
      }
    };

    try {
      let { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch failed, continuing with fallback profile:', error);
        this.currentUser = await buildFallbackProfile();
        return;
      }

      if (!data) {
        console.warn('Profile not found. Executing self-healing profile creation...');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError) {
          console.warn('Could not read auth user, continuing with fallback profile:', userError);
          this.currentUser = await buildFallbackProfile();
          return;
        }

        const name = user.user_metadata?.name || 'User';
        const role = (user.email === ADMIN_EMAIL) ? 'admin' : (user.user_metadata?.role || 'student');
        const normalizedRole = normalizeRole(role);

      const { data: newProfile, error: insertError } = await supabaseClient
          .from('profiles')
          .insert({
            id: userId,
            email: user.email,
            name: name,
            role: normalizedRole,
            avatar: normalizedRole === 'admin' ? '🛡️' : '👤'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Self-healing profile insert failed (RLS or other):', insertError);
          data = await buildFallbackProfile();
        } else {
          data = newProfile;
          console.log('Self-healing profile creation succeeded:', data);
        }
      }

      if (data) data.role = normalizeRole(data.role);
      this.currentUser = data || await buildFallbackProfile();
    } catch (error) {
      console.warn('Profile loading failed, continuing with fallback profile:', error);
      this.currentUser = await buildFallbackProfile();
    }
  }

  // Authentication
  async signUp(email, password, name, role = 'student') {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { name, role }
        }
      });

      if (error) throw error;

      // Create profile
      if (data.user) {
        await supabaseClient.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          name,
          role
        });
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      await supabaseClient.auth.signOut();
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
  }

  getData() {
    if (!this._cache) {
      try {
        const raw = localStorage.getItem('appData');
        this._cache = raw ? JSON.parse(raw) : {};
      } catch (e) {
        this._cache = {};
      }
    }
    if (!this._cache.users) this._cache.users = [];
    if (!this._cache.posts) this._cache.posts = [];
    if (!this._cache.feedback) this._cache.feedback = [];
    if (!this._cache.experiences) this._cache.experiences = [];
    if (!this._cache.announcements) this._cache.announcements = [];
    if (!this._cache.tutorApplications) this._cache.tutorApplications = [];
    return this._cache;
  }

  // Users
  async getTutors() {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'tutor');

      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (error) {
      console.error('Error fetching tutors:', error);
    }
    // Fallback to localStorage if Supabase fails or is empty
    const localData = this.getData();
    return (localData.users || []).filter(u => u.role === 'tutor');
  }

  async getTutorById(id) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'tutor')
        .single();

      if (error) throw error;
      if (data) return data;
    } catch (error) {
      console.error('Error fetching tutor:', error);
    }
    // Fallback to localStorage
    const localData = this.getData();
    return (localData.users || []).find(u => u.id === id && u.role === 'tutor') || null;
  }

  async getBookings() {
    try {
      const { data, error } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          student:profiles!bookings_student_id_fkey(name, email),
          tutor:profiles!bookings_tutor_id_fkey(name, email)
        `);

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  async addBooking(booking) {
    try {
      const { data, error } = await supabaseClient
        .from('bookings')
        .insert({
          ...sanitizeObjectStrings(booking),
          student_id: booking.student_id || this.currentUser.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding booking:', error);
      return null;
    }
  }

  async updateBookingStatus(bookingId, status) {
    try {
      const { data, error } = await supabaseClient
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      return null;
    }
  }

  async getAssignments() {
    try {
      const { data, error } = await supabaseClient
        .from('assignments')
        .select(`
          *,
          student:profiles!assignments_student_id_fkey(name),
          tutor:profiles!assignments_tutor_id_fkey(name)
        `)
        .or(`student_id.eq.${this.currentUser.id},tutor_id.eq.${this.currentUser.id}`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  }

  async addAssignment(assignment) {
    try {
      const { data, error } = await supabaseClient
        .from('assignments')
        .insert({
          ...sanitizeObjectStrings(assignment),
          tutor_id: this.currentUser.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding assignment:', error);
      return null;
    }
  }

  async getReviews() {
    try {
      const { data, error } = await supabaseClient
        .from('reviews')
        .select(`
          *,
          student:profiles!reviews_student_id_fkey(name),
          tutor:profiles!reviews_tutor_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  async addMessage(message) {
    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .insert({
          ...sanitizeObjectStrings(message),
          sender_id: this.currentUser.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  async getMessages() {
    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(name),
          receiver:profiles!messages_receiver_id_fkey(name)
        `)
        .or(`sender_id.eq.${this.currentUser.id},receiver_id.eq.${this.currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  
  // Announcements
  async getAnnouncements() {
    try {
      const { data, error } = await supabaseClient
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }

  async addAnnouncement(announcement) {
    try {
      const { data, error } = await supabaseClient
        .from('announcements')
        .insert({
          ...sanitizeObjectStrings(announcement),
          author_id: this.currentUser.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding announcement:', error);
      return null;
    }
  }

  // Posts
  async getPosts() {
    try {
      const { data, error } = await supabaseClient
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  async addPost(post) {
    try {
      const { data, error } = await supabaseClient
        .from('posts')
        .insert({
          ...sanitizeObjectStrings(post),
          author_id: this.currentUser.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding post:', error);
      return null;
    }
  }

  // Feedback
  async getFeedback() {
    try {
      const { data, error } = await supabaseClient
        .from('feedback')
        .select(`
          *,
          user:profiles!feedback_user_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  }

  async addFeedback(feedback) {
    try {
      const { data, error } = await supabaseClient
        .from('feedback')
        .insert({
          ...sanitizeObjectStrings(feedback),
          user_id: this.currentUser.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding feedback:', error);
      return null;
    }
  }

  // Tutor Applications
  async getTutorApplications() {
    try {
      const { data, error } = await supabaseClient
        .from('tutor_applications')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tutor applications:', error);
      return [];
    }
  }

  async addTutorApplication(application) {
    try {
      const { data, error } = await supabaseClient
        .from('tutor_applications')
        .insert(sanitizeObjectStrings(application))
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding tutor application:', error);
      return null;
    }
  }

  // Helper methods
  getLeaderboard() {
    // This would need to be implemented based on your specific criteria
    return { students: [], tutors: [] };
  }

  // Additional user management methods
  async getUsers() {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getStudents() {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  async updateUser(id, updates) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .update(sanitizeObjectStrings(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async approveTutorApplication(appId) {
    try {
      // Get application details
      const { data: app, error: fetchError } = await supabaseClient
        .from('tutor_applications')
        .select('*')
        .eq('id', appId)
        .single();

      if (fetchError) throw fetchError;

      // Update application status
      const { error: updateError } = await supabaseClient
        .from('tutor_applications')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', appId);

      if (updateError) throw updateError;

      return { success: true, application: app };
    } catch (error) {
      console.error('Error approving tutor application:', error);
      return { success: false, error: error.message };
    }
  }

  async rejectTutorApplication(appId) {
    try {
      const { data, error } = await supabaseClient
        .from('tutor_applications')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', appId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rejecting tutor application:', error);
      return null;
    }
  }

  // Experiences
  async addExperience(experience) {
    try {
      const { data, error } = await supabaseClient
        .from('experiences')
        .insert({
          ...experience,
          user_id: this.currentUser.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding experience:', error);
      return null;
    }
  }

  async approveExperience(experienceId) {
    try {
      const { data, error } = await supabaseClient
        .from('experiences')
        .update({ status: 'approved' })
        .eq('id', experienceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error approving experience:', error);
      return null;
    }
  }

  async deleteExperience(experienceId) {
    try {
      const { error } = await supabaseClient
        .from('experiences')
        .delete()
        .eq('id', experienceId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting experience:', error);
      return { success: false, error: error.message };
    }
  }


  // ── Async CRUD methods (Supabase) ─────────────────────────────────────────

  async getAllAnnouncements() { return this.getAnnouncements(); }
  async getAllPosts() { return this.getPosts(); }

  async deleteAnnouncement(id) {
    try {
      const { error } = await supabaseClient.from('announcements').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) { console.error('deleteAnnouncement:', e); return { success: false }; }
  }

  async updateAnnouncement(id, updates) {
    try {
      const { data, error } = await supabaseClient.from('announcements')
        .update(sanitizeObjectStrings(updates)).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (e) { console.error('updateAnnouncement:', e); return null; }
  }

  async deletePost(id) {
    try {
      const { error } = await supabaseClient.from('posts').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) { console.error('deletePost:', e); return { success: false }; }
  }

  async updatePost(id, updates) {
    try {
      const { data, error } = await supabaseClient.from('posts')
        .update(sanitizeObjectStrings(updates)).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (e) { console.error('updatePost:', e); return null; }
  }

  async deleteBooking(id) {
    try {
      const { error } = await supabaseClient.from('bookings').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) { console.error('deleteBooking:', e); return { success: false }; }
  }

  async updateBooking(id, updates) {
    try {
      const { data, error } = await supabaseClient.from('bookings')
        .update(sanitizeObjectStrings(updates)).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (e) { console.error('updateBooking:', e); return null; }
  }

  async deleteUser(id) {
    try {
      const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) { console.error('deleteUser:', e); return { success: false }; }
  }

  async addUser(user) {
    try {
      const { data, error } = await supabaseClient.from('profiles')
        .insert(sanitizeObjectStrings(user)).select().single();
      if (error) throw error;
      return data;
    } catch (e) { console.error('addUser:', e); return null; }
  }


  async getStudentById(id) {
    try {
      const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', id).eq('role', 'student').maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) { console.error('getStudentById:', e); return null; }
  }

  async updateFeedbackStatus(id, status, response = null) {
    try {
      const updates = { status };
      if (response) updates.response = response;
      const { data, error } = await supabaseClient.from('feedback')
        .update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (e) { console.error('updateFeedbackStatus:', e); return null; }
  }

  async deleteFeedback(id) {
    try {
      const { error } = await supabaseClient.from('feedback').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) { console.error('deleteFeedback:', e); return { success: false }; }
  }

  async getExperiences() {
    try {
      const { data, error } = await supabaseClient.from('experiences')
        .select('*, user:profiles!experiences_user_id_fkey(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) { console.error('getExperiences:', e); return []; }
  }
}


let appData = null;

function initializeApp() {
  if (!supabaseClient) {
    console.error('[App] Cannot initialize app - Supabase client not ready');
    return false;
  }
  if (!appData) {
    appData = new SupabaseDataLayer();
    console.log('[App] SupabaseDataLayer initialized');
  }
  return true;
}

// Initialize app when Supabase client is ready
if (supabaseClient) {
  initializeApp();
} else {
  window.addEventListener('load', () => {
    if (!appData) {
      setTimeout(() => {
        if (supabaseClient && !appData) {
          initializeApp();
        }
      }, 100);
    }
  });
}


// ============================================================================
// CLOUDINARY UPLOAD UTILITY
// ============================================================================
const CLOUDINARY_CLOUD_NAME = 'djhrlkjzw';
const CLOUDINARY_UPLOAD_PRESET = 'mwj3qjc6';

async function uploadToCloudinary(file, folder = 'aroosh') {
  if (!file) return null;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: 'POST', body: formData }
    );
    if (!res.ok) throw new Error('Cloudinary upload failed: ' + res.status);
    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error('[Cloudinary] Upload error:', err);
    UI.showAlert('File upload failed. Please try again.', 'error');
    return null;
  }
}

// ============================================================================
// 2. ROUTER
// ============================================================================

class Router {
  constructor() {
    this.routes = {};
    this.currentPage = null;
    window.addEventListener('hashchange', () => this.handleRouteChange());
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  async navigate(path) {
    const targetHash = '#' + path;
    if (window.location.hash === targetHash) {
      await this.handleRouteChange();
    } else {
      window.location.hash = path;
    }
  }

  async handleRouteChange() {
    const hash = window.location.hash.slice(1) || '/';
    // Handle query strings gracefully
    const pathOnly = hash.split('?')[0];
    const normalizedPath = '/' + pathOnly.replace(/^\/+/, '');
    const [path, ...params] = normalizedPath.split('/').filter(Boolean);

    let handler = null;
    let matchPath = null;

    // Check query params routes or exact routes
    if (this.routes[normalizedPath]) {
      handler = this.routes[normalizedPath];
      matchPath = normalizedPath;
    } else {
      // Try pattern matching
      for (let route in this.routes) {
        if (route.includes(':')) {
          const pattern = route.replace(/:[^/]+/g, '[^/]+');
          const regex = new RegExp('^' + pattern + '$');
          if (regex.test(normalizedPath)) {
            handler = this.routes[route];
            matchPath = route;
            break;
          }
        }
      }
    }

    if (handler) {
      this.currentPage = matchPath;
      window.scrollTo(0, 0); // Quick UX Win: Scroll to top on every route change
      try {
        await handler(hash);
      } catch (err) {
        console.error('[Router] Error in route handler:', err);
      }
      if (typeof renderSidebar === 'function') {
        renderSidebar();
      }
      if (typeof injectFooter === 'function') {
        injectFooter();
      }
    } else {
      this.navigate('/');
    }
  }

  async start() {
    await this.handleRouteChange();
  }
}

const router = new Router();

// ============================================================================
// 3. UI UTILITIES
// ============================================================================

const UI = {
  setContent(html) {
    const app = document.getElementById('app');
    if (!app) return;
    app.classList.remove('animate-fade-in');
    app.innerHTML = html;
    void app.offsetWidth; // Force DOM reflow to restart fade-in animation
    app.classList.add('animate-fade-in');
  },

  showModal(content, title = '') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal">
        ${title ? `<div class="modal-header"><h2 class="modal-title">${title}</h2><button class="modal-close">&times;</button></div>` : ''}
        <div class="modal-body">${content}</div>
      </div>
    `;

    overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
    return overlay;
  },

  showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    const icons = { success: '✓', error: '✕', warning: '!' };
    alert.innerHTML = `
      <span class="alert-icon">${icons[type]}</span>
      <span>${sanitize(message)}</span>
    `;
    document.body.insertBefore(alert, document.body.firstChild);
    setTimeout(() => alert.remove(), 3000);
  },

  renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= rating ? '★' : '☆';
    }
    return `<span class="stars"><span class="star-filled">${stars.substring(0, rating)}</span><span class="star-empty">${stars.substring(rating)}</span></span>`;
  },

  getStatusBadge(status) {
    const badges = {
      'pending': '<span class="badge badge-warning">Pending</span>',
      'confirmed': '<span class="badge badge-success">Confirmed</span>',
      'completed': '<span class="badge badge-success">Completed</span>',
      'cancelled': '<span class="badge badge-danger">Cancelled</span>',
      'graded': '<span class="badge badge-success">Graded</span>',
      'submitted': '<span class="badge badge-primary">Submitted</span>',
      'approved': '<span class="badge badge-success">Approved</span>',
      'rejected': '<span class="badge badge-danger">Rejected</span>',
      'open': '<span class="badge badge-danger">Open</span>',
      'in_review': '<span class="badge badge-warning">In Review</span>',
      'resolved': '<span class="badge badge-success">Resolved</span>'
    };
    return badges[status] || '';
  },

  animateCountUp(el, endVal, suffix = '', duration = 1500) {
    if (!el) return;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // Easing out quadratic
      const currentVal = Math.floor(easeProgress * endVal);
      el.textContent = currentVal + suffix;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = endVal + suffix;
      }
    }
    requestAnimationFrame(update);
  }
};

// ============================================================================
// 4. PAGE RENDERERS
// ============================================================================

// Hero Particle Animation Function
function initHeroParticles() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  let animationFrameId = null;

  // Resize canvas to match display size
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  resizeCanvas();

  // Create particles
  const particles = [];
  const particleCount = 80;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 1, // 1-5px
      speedX: (Math.random() - 0.5) * 0.5, // Random drift speed
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.1 // 0.1-0.6
    });
  }

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Move particle
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(13, 148, 136, ${p.opacity})`;
      ctx.fill();
    }

    // Draw connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          const opacity = (1 - distance / 120) * 0.3;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(13, 148, 136, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  animate();

  // Handle window resize
  const handleResize = () => {
    resizeCanvas();
  };
  window.addEventListener('resize', handleResize);

  // Cleanup function
  function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener('resize', handleResize);
  }

  return cleanup;
}

// AUTH / ROLE GUARDS
function requireRole(allowedRoles) {
  const user = appData.getCurrentUser();
  const role = normalizeRole(user?.role);
  if (!allowedRoles.includes(role)) {
    if (role === 'guest') {
      UI.showAlert('Please sign in to access this page.', 'warning');
      router.navigate('/');
    } else if (role === 'student') {
      UI.showAlert('Access denied. Redirecting to your dashboard.', 'warning');
      router.navigate('/student-dashboard');
    } else if (role === 'tutor') {
      UI.showAlert('Access denied. Redirecting to your dashboard.', 'warning');
      router.navigate('/tutor-dashboard');
    } else {
      router.navigate('/');
    }
    return false;
  }
  return true;
}

// PAGE 1: HOME
async function renderHome() {
  if (!appData) {
    console.error('[Home] appData not initialized');
    return;
  }
  let user, announcements, posts, experiences;
  try {
    user = appData.getCurrentUser();
    announcements = await appData.getAnnouncements() || [];
    posts = await appData.getPosts() || [];
    const allExperiences = await appData.getExperiences() || [];
    experiences = allExperiences.filter(e => e.status === 'approved');
  } catch(dataErr) {
    console.error('[Home] Data fetch error:', dataErr);
    user = appData.getCurrentUser();
    announcements = []; posts = []; experiences = [];
  }
  const isGuest = !user;

  const html = `
    <div class="hero" style="position: relative; overflow: hidden;">
      <canvas id="hero-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;"></canvas>
      <div class="hero-shapes" style="position: relative; z-index: 1;">
        <div class="hero-shape hero-shape-1"></div>
        <div class="hero-shape hero-shape-2"></div>
        <div class="hero-shape hero-shape-3"></div>
      </div>
      <div class="container" style="position: relative; z-index: 1;">
        <div class="hero-content" style="position: relative; z-index: 1; ">
          <h1 style="">Expert Online Tutoring for Every Subject</h1>
          <p style="">Connect with qualified tutors, learn at your own pace, and achieve your learning goals</p>
          <div class="hero-cta">
            <button class="btn btn-secondary" onclick="router.navigate('/tutors')" style="">Find Tutors</button>
            <button class="btn btn-outline" onclick="router.navigate('/role-selection')" style="">Sign Up Free</button>
          </div>
          <div class="hero-stats" style="">
            <div class="stat-card">
              <div class="stat-number" id="statTutors" style="">0+</div>
              <div class="stat-label" style="font-family: 'Inter', sans-serif; font-weight: 500;">Expert Tutors</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="statStudents" style="">0K+</div>
              <div class="stat-label" style="font-family: 'Inter', sans-serif; font-weight: 500;">Active Students</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="statSubjects" style="">0+</div>
              <div class="stat-label" style="font-family: 'Inter', sans-serif; font-weight: 500;">Subjects</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Announcements Section -->
    <section style="padding: 2rem 0; background: var(--color-surface); border-bottom: 1px solid var(--color-muted);">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 1.5rem;">📢 Announcements</h2>
        ${announcements.length > 0 ? `
        <div style="display: grid; gap: 1rem;">
          ${announcements.slice(0, 5).map(ann => `
            <div class="card" style="padding: 1.5rem; border-left: 4px solid ${ann.priority === 'high' ? 'var(--color-danger)' : ann.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-success)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <h3 style="margin: 0; font-size: 1.1rem;">${sanitize(ann.title)}</h3>
                <span class="badge badge-${ann.priority === 'high' ? 'danger' : ann.priority === 'medium' ? 'warning' : 'success'}" style="font-size: 0.75rem;">${ann.priority || 'normal'}</span>
              </div>
              <p class="text-muted" style="margin: 0; font-size: 0.95rem;">${sanitize(ann.content)}</p>
              <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--color-text-secondary);">${new Date(ann.created_at || ann.createdAt).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
        ` : `<p class="text-center text-muted" style="padding: 2rem 0;">No announcements yet. Check back later!</p>`}
      </div>
    </section>

    <!-- Posts Section -->
    <section style="padding: 3rem 0; border-bottom: 1px solid var(--color-muted);">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 2rem;">📝 Latest Posts</h2>
        ${posts.length > 0 ? `
        <div class="grid-3">
          ${posts.slice(0, 6).map(post => `
            <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column;">
              <span class="badge badge-secondary" style="align-self: flex-start; margin-bottom: 0.75rem; font-size: 0.8rem;">${sanitize(post.category || 'General')}</span>
              <h3 style="margin: 0 0 0.75rem 0; font-size: 1.1rem;">${sanitize(post.title)}</h3>
              <p class="text-muted" style="margin: 0 0 1rem 0; font-size: 0.9rem; flex-grow: 1;">${sanitize((post.content || '').substring(0, 100))}${post.content && post.content.length > 100 ? '...' : ''}</p>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary);">${new Date(post.created_at || post.createdAt).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
        ` : `<p class="text-center text-muted" style="padding: 2rem 0;">No posts yet. Check back later!</p>`}
      </div>
    </section>

    <!-- Category Subjects Grid Section -->
    <section class="subjects" style="padding: 3rem 0; border-bottom: 1px solid var(--color-muted);">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 2rem; ">Explore Subjects</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1.5rem;">
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Math')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📐</div>
            <h4 style="margin: 0; font-size: 1.1rem; ">Math</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Science')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔬</div>
            <h4 style="margin: 0; font-size: 1.1rem; ">Science</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=English')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📚</div>
            <h4 style="margin: 0; font-size: 1.1rem; ">English</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Languages')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🗣️</div>
            <h4 style="margin: 0; font-size: 1.1rem; ">Languages</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Technology')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">💻</div>
            <h4 style="margin: 0; font-size: 1.1rem; ">Technology</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Arts')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎨</div>
            <h4 style="margin: 0; font-size: 1.1rem; ">Arts</h4>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works bg-surface" style="padding: 4rem 0; border-bottom: 1px solid var(--color-muted);">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 3rem; ">How It Works</h2>
        <div class="grid-3">
          <div class="step-card text-center" style="padding: 2rem; background: var(--color-background); border-radius: var(--radius-xl); border: 1px solid var(--color-muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem; ">1. Search Tutors</h3>
            <p class="text-muted" style="font-size: 0.95rem; margin-bottom: 0;">Browse expert educators and pre-filter by specific categories or rating.</p>
          </div>
          <div class="step-card text-center" style="padding: 2rem; background: var(--color-background); border-radius: var(--radius-xl); border: 1px solid var(--color-muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem; ">2. Book a Session</h3>
            <p class="text-muted" style="font-size: 0.95rem; margin-bottom: 0;">Schedule instantly using our brand-new 3-step checkout stepper forms.</p>
          </div>
          <div class="step-card text-center" style="padding: 2rem; background: var(--color-background); border-radius: var(--radius-xl); border: 1px solid var(--color-muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem; ">3. Learn & Grow</h3>
            <p class="text-muted" style="font-size: 0.95rem; margin-bottom: 0;">Submit homework, participate in discussions, and complete leaderboard challenges.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Student Testimonials Section -->
    <section class="testimonials" style="padding: 4rem 0;">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 3rem; ">What Our Students Say</h2>
        <div class="grid-3">
          <div class="card testimonial-card" style="padding: 2rem; border-top: 4px solid var(--color-primary); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="stars" style="color: #fbbf24; margin-bottom: 1rem; font-size: 1.25rem;">★★★★★</div>
              <p style="font-style: italic; margin-bottom: 1.5rem; color: var(--color-text-secondary); line-height: 1.6;">"Aroosh Tutors completely transformed my high school grades. My physics teacher explains complex things so simply!"</p>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="font-size: 2rem;">👤</div>
              <div>
                <strong style="display: block;">Aisha Khan</strong>
                <span class="text-muted" style="font-size: 0.85rem;">High School Student</span>
              </div>
            </div>
          </div>
          <div class="card testimonial-card" style="padding: 2rem; border-top: 4px solid var(--color-primary); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="stars" style="color: #fbbf24; margin-bottom: 1rem; font-size: 1.25rem;">★★★★★</div>
              <p style="font-style: italic; margin-bottom: 1.5rem; color: var(--color-text-secondary); line-height: 1.6;">"The new in-memory caching and live dashboards are incredibly fast. The booking flow took less than a minute."</p>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="font-size: 2rem;">👤</div>
              <div>
                <strong style="display: block;">Rahul Kumar</strong>
                <span class="text-muted" style="font-size: 0.85rem;">College Student</span>
              </div>
            </div>
          </div>
          <div class="card testimonial-card" style="padding: 2rem; border-top: 4px solid var(--color-primary); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="stars" style="color: #fbbf24; margin-bottom: 1rem; font-size: 1.25rem;">★★★★★</div>
              <p style="font-style: italic; margin-bottom: 1.5rem; color: var(--color-text-secondary); line-height: 1.6;">"I love the XP system, the leaderboard, and the interactive features. It makes learning feel like a fun game!"</p>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="font-size: 2rem;">👤</div>
              <div>
                <strong style="display: block;">Zara Ali</strong>
                <span class="text-muted" style="font-size: 0.85rem;">Parent of Student</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- User Experiences Section -->
    <section class="experiences" style="padding: 4rem 0; border-top: 1px solid var(--color-muted); background: var(--color-surface);">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 3rem; ">💬 User Experiences</h2>
        ${experiences.length > 0 ? `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
          ${experiences.slice(0, 6).map(exp => `
            <div class="card" style="display: flex; flex-direction: column; transition: var(--transition-base);">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1.1rem;">${sanitize(exp.name)}</h4>
                  <p class="text-muted" style="margin: 0.25rem 0 0 0; font-size: 0.85rem;">${sanitize(exp.subject)}</p>
                </div>
                <div class="stars" style="color: #fbbf24; font-size: 1rem;">${'★'.repeat(exp.rating || 5)}</div>
              </div>
              <p style="font-style: italic; color: var(--color-text-secondary); line-height: 1.6; flex-grow: 1;">"${sanitize(exp.experience)}"</p>
              <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--color-text-secondary);">
                ${new Date(exp.created_at || exp.createdAt).toLocaleDateString()}
              </div>
            </div>
          `).join('')}
        </div>
        <div style="text-align: center; margin-top: 2rem;">
          <button class="btn btn-outline" onclick="router.navigate('/experiences')">View All Experiences</button>
        </div>
        ` : `
        <div class="card text-center" style="padding: 3rem;">
          <p class="text-secondary" style="font-size: 1.1rem;">No experiences yet. Be the first to share your story!</p>
          <button class="btn btn-primary mt-lg" onclick="router.navigate('/experiences')">Share Your Experience</button>
        </div>
        `}
      </div>
    </section>

    <!-- Call to Action -->
    ${isGuest ? `
    <section class="bg-light" style="padding: 3rem 0; border-top: 1px solid var(--color-muted);">
      <div class="container">
        <div class="card" style="text-align: center; padding: 3rem;">
          <h2 style="">Ready to Start?</h2>
          <p class="text-muted" style="margin-bottom: 1.5rem; ">Join thousands of students and tutors on Aroosh</p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary btn-lg" onclick="window.location.href='login.html'" style="">Get Started</button>
          </div>
        </div>
      </div>
    </section>
    ` : ''}
  `;
  UI.setContent(html);

  // Initialize hero particle animation
  setTimeout(() => {
    const cleanup = initHeroParticles();
    if (cleanup) {
      window.addEventListener('hashchange', cleanup, { once: true });
    }
  }, 0);

  // Scroll reveal + parallax + counters
  requestAnimationFrame(() => {
    initScrollReveal();
    initHeroParallax();
    initCounterAnimations();
  });

  // Stats Count-up Trigger
  setTimeout(() => {
    UI.animateCountUp(document.getElementById('statTutors'), 500, '+');
    UI.animateCountUp(document.getElementById('statStudents'), 10, 'K+');
    UI.animateCountUp(document.getElementById('statSubjects'), 50, '+');
  }, 50);
}

// PAGE 2: ROLE SELECTION
function renderRoleSelection() {
  if (!appData) {
    console.error('[RoleSelection] appData not initialized');
    return;
  }
  const html = `
    <div class="container" style="padding: 3rem 0;">
      <h1 class="text-center mb-lg">Choose Your Role</h1>
      <p class="text-center text-muted" style="max-width: 600px; margin: 0 auto var(--spacing-2xl);">
        Select whether you're a student looking for tutoring or a tutor ready to teach
      </p>

      <div class="role-cards">
        <div class="role-card">
          <div class="role-icon">👨‍🎓</div>
          <h2>I'm a Student</h2>
          <ul class="role-benefits">
            <li>Find qualified tutors in your subjects</li>
            <li>Flexible scheduling and pricing</li>
            <li>View tutor profiles and reviews</li>
            <li>Track assignments and progress</li>
          </ul>
          <button class="btn btn-primary btn-lg" onclick="window.location.href='signup-student.html'">Get Started as Student</button>
        </div>

        <div class="role-card">
          <div class="role-icon">👨‍🏫</div>
          <h2>I'm a Tutor</h2>
          <ul class="role-benefits">
            <li>Connect with students worldwide</li>
            <li>Flexible teaching schedule</li>
            <li>Build your tutoring business</li>
          </ul>
          <button class="btn btn-primary btn-lg" onclick="window.location.href='signup-tutor.html'">Get Started as Tutor</button>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);
}

// PAGE 3: STUDENT SIGN UP
function renderStudentSignUp() {
  if (!appData) {
    console.error('[StudentSignUp] appData not initialized');
    return;
  }
  const html = `
    <div class="container-sm" style="padding: 2rem var(--spacing-md); max-width: 580px;">
      <h1 class="text-center mb-lg">Create Student Account</h1>

      <div class="card">
        <form id="studentSignupForm">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" placeholder="Your full name" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" placeholder="your@email.com" required>
          </div>

          <div class="form-group">
            <label class="form-label">Profile Picture <span class="text-muted" style="font-size: 0.85rem;">(optional)</span></label>
            <input type="file" id="studentProfilePic" class="form-input" accept="image/*" style="padding: 0.5rem;">
            <div id="studentPicPreview" style="margin-top: 0.5rem; display: none;">
              <img src="" alt="Preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 2px solid var(--color-muted);">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Grade Level</label>
            <select class="form-select" required>
              <option value="">Select grade level</option>
              <option value="Elementary">Elementary School</option>
              <option value="Middle School">Middle School</option>
              <option value="High School">High School</option>
              <option value="College">College</option>
              <option value="Adult">Adult Learner</option>
              <option value="">--- International Standards ---</option>
              <option value="IB MYP">IB Middle Years Programme (MYP)</option>
              <option value="IB DP">IB Diploma Programme (DP)</option>
              <option value="IGCSE">IGCSE (International GCSEs)</option>
              <option value="A-Levels">A-Levels / AS-Levels</option>
              <option value="AP">AP (Advanced Placement)</option>
              <option value="International Baccalaureate">International Baccalaureate</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Subject Interests</label>
            <div class="form-checkbox-group">
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Math"> Math
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="English"> English
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Science"> Science
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="History"> History
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Languages"> Languages
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Arts"> Arts
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Technology"> Technology
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" placeholder="Create a password" required>
          </div>

          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input type="password" class="form-input" placeholder="Confirm password" required>
          </div>

          <button type="submit" class="btn btn-primary btn-lg btn-block">Create Account</button>
        </form>
      </div>
    </div>
  `;
  UI.setContent(html);

  document.getElementById('studentSignupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[type="text"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const gradeLevel = form.querySelector('select').value;
    const interests = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const picInput = document.getElementById('studentProfilePic');

    if (!name || !email || !gradeLevel) {
      UI.showAlert('Please fill in all required fields.', 'warning');
      return;
    }

    const data = appData.getData();
    if (!data.users) data.users = [];
    const exists = data.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      UI.showAlert('Email is already registered!', 'warning');
      return;
    }

    let avatar = '👤';
    if (picInput.files && picInput.files[0]) {
      avatar = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(picInput.files[0]);
      });
    }

    const newStudent = {
      id: 'user' + Date.now(),
      name,
      email,
      role: 'student',
      gradeLevel,
      interests,
      avatar
    };

    data.users.push(newStudent);
    appData._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));

    appData.setCurrentUser(newStudent);
    renderSidebar();

    UI.showAlert('Account created! Welcome to Aroosh\'s Tutors!', 'success');
    setTimeout(() => router.navigate('/student-dashboard'), 1000);
  });

  // Profile picture preview
  document.getElementById('studentProfilePic')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('studentPicPreview');
    const img = preview?.querySelector('img');
    if (file && img) {
      const reader = new FileReader();
      reader.onload = (ev) => { img.src = ev.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(file);
    }
  });
}

// PAGE 4: TUTOR SIGN UP
function renderTutorSignUp() {
  if (!appData) {
    console.error('[TutorSignUp] appData not initialized');
    return;
  }
  const html = `
    <div class="container-sm" style="padding: 2rem var(--spacing-md); max-width: 580px;">
      <h1 class="text-center mb-lg">Become a Tutor</h1>

      <div class="card mb-lg" style="border-left: 4px solid var(--color-info, var(--color-secondary));">
        <div style="padding: 0.5rem 0;">
          <p style="margin: 0; font-size: 0.95rem;"><strong>Note:</strong> Your tutor application will be reviewed by the admin. You will be notified once approved.</p>
        </div>
      </div>

      <div class="card">
        <form id="tutorSignupForm">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" placeholder="Your full name" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" placeholder="your@email.com" required>
          </div>

          <div class="form-group">
            <label class="form-label">Profile Picture <span class="text-muted" style="font-size: 0.85rem;">(optional)</span></label>
            <input type="file" id="tutorProfilePic" class="form-input" accept="image/*" style="padding: 0.5rem;">
            <div id="tutorPicPreview" style="margin-top: 0.5rem; display: none;">
              <img src="" alt="Preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 2px solid var(--color-muted);">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea class="form-textarea" placeholder="Tell students about your experience and teaching style" required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Teaching Experience</label>
            <select class="form-select" required>
              <option value="">Select experience</option>
              <option value="<1yr">Less than 1 year</option>
              <option value="1-3yr">1-3 years</option>
              <option value="3-5yr">3-5 years</option>
              <option value="5-10yr">5-10 years</option>
              <option value="10+yr">10+ years</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Qualifications</label>
            <input type="text" class="form-input" placeholder="e.g., B.Sc Mathematics, M.Ed" required>
          </div>

          <div class="form-group">
            <label class="form-label">Subjects You Teach</label>
            <div class="form-checkbox-group">
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Math"> Math
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="English"> English
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Science"> Science
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="History"> History
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Languages"> Languages
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Arts"> Arts
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Technology"> Technology
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Physics"> Physics
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Chemistry"> Chemistry
              </div>
              <div class="form-checkbox-item">
                <input type="checkbox" class="form-checkbox" value="Biology"> Biology
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" placeholder="Create a password" required>
          </div>

          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input type="password" class="form-input" placeholder="Confirm password" required>
          </div>

          <button type="submit" class="btn btn-primary btn-lg btn-block">Apply as Tutor</button>
        </form>
      </div>
    </div>
  `;
  UI.setContent(html);

  document.getElementById('tutorSignupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[placeholder="Your full name"]').value.trim();
    const email = form.querySelector('input[placeholder="your@email.com"]').value.trim();
    const bio = form.querySelector('textarea').value.trim();
    const experience = form.querySelector('select').value;
    const qualifications = form.querySelector('input[placeholder="e.g., B.Sc Mathematics, M.Ed"]').value.trim();
    const subjects = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

    if (!name || !email || !bio || !experience || !qualifications) {
      UI.showAlert('Please fill in all required fields.', 'warning');
      return;
    }

    if (subjects.length === 0) {
      UI.showAlert('Please select at least one subject.', 'warning');
      return;
    }

    const application = {
      name,
      email,
      qualifications,
      experience,
      subjects,
      status: 'pending'
    };

    const result = await appData.addTutorApplication(application);
    if (result) {
      UI.showAlert('Application submitted! You will be notified once the admin reviews and approves your application.', 'success');
      setTimeout(() => router.navigate('/'), 2000);
    } else {
      UI.showAlert('Failed to submit application. Please try again.', 'danger');
    }
  });

  // Profile picture preview
  document.getElementById('tutorProfilePic')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('tutorPicPreview');
    const img = preview?.querySelector('img');
    if (file && img) {
      const reader = new FileReader();
      reader.onload = (ev) => { img.src = ev.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(file);
    }
  });
}

// PAGE 5: FIND TUTORS
// [DECLARED GLOBALLY SO SKELETON HANDLER WORKS PERFECTLY]
async function renderFindTutors() {
  if (!appData) {
    console.error('[FindTutors] appData not initialized');
    return;
  }

  try {
    // Quick UX: Pre-selected subject parser
    const hash = window.location.hash;
    let preselectedSubject = '';
    if (hash.includes('?subject=')) {
      preselectedSubject = decodeURIComponent(hash.split('?subject=')[1]);
    }

    // Show loading state immediately
    const skeletonHtml = `
      <div class="container" style="padding: 2rem 0;">
        <h1 class="mb-lg">Find Your Perfect Tutor</h1>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          <div class="skeleton" style="height: 40px; border-radius: var(--radius-md);"></div>
          <div class="skeleton" style="height: 40px; border-radius: var(--radius-md);"></div>
          <div class="skeleton" style="height: 40px; border-radius: var(--radius-md);"></div>
        </div>
        <div class="grid-3">
          ${[1, 2, 3, 4, 5, 6].map(() => `
            <div class="card skeleton-card" style="min-height: 350px;">
              <div class="skeleton" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1.5rem;"></div>
              <div class="skeleton" style="width: 60%; height: 20px; margin: 0 auto 1rem;"></div>
              <div class="skeleton" style="width: 90%; height: 15px; margin: 0 auto 1rem;"></div>
              <div class="skeleton" style="width: 40%; height: 15px; margin: 0 auto 1.5rem;"></div>
              <div class="skeleton" style="width: 100%; height: 40px; border-radius: var(--radius-md);"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    UI.setContent(skeletonHtml);

    // Fetch tutors
    let tutors = [];
    try {
      tutors = await appData.getTutors() || [];
    } catch (err) {
      console.error('[FindTutors] Error fetching tutors:', err);
      tutors = [];
    }

    // Check if user navigated away
    const currentHash = window.location.hash || '#/';
    if (!currentHash.includes('/tutors')) return;

    const actualHtml = `
      <div class="container" style="padding: 2rem 0;">
        <h1 class="mb-lg">Find Your Perfect Tutor</h1>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          <div class="form-group" style="margin-bottom: 0;">
            <input type="text" id="searchInput" class="form-input" placeholder="Search by name...">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <select id="subjectFilter" class="form-select">
              <option value="">All Subjects</option>
              <option value="Math" ${preselectedSubject === 'Math' ? 'selected' : ''}>Math</option>
              <option value="English" ${preselectedSubject === 'English' ? 'selected' : ''}>English</option>
              <option value="Science" ${preselectedSubject === 'Science' ? 'selected' : ''}>Science</option>
              <option value="History" ${preselectedSubject === 'History' ? 'selected' : ''}>History</option>
              <option value="Languages" ${preselectedSubject === 'Languages' ? 'selected' : ''}>Languages</option>
              <option value="Arts" ${preselectedSubject === 'Arts' ? 'selected' : ''}>Arts</option>
              <option value="Technology" ${preselectedSubject === 'Technology' ? 'selected' : ''}>Technology</option>
              <option value="Physics" ${preselectedSubject === 'Physics' ? 'selected' : ''}>Physics</option>
              <option value="Chemistry" ${preselectedSubject === 'Chemistry' ? 'selected' : ''}>Chemistry</option>
              <option value="Biology" ${preselectedSubject === 'Biology' ? 'selected' : ''}>Biology</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <select id="sortBy" class="form-select">
              <option value="">Sort By</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <button id="searchBtn" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
              <span>🔍</span>
              <span>Search</span>
            </button>
          </div>
        </div>

        <div id="tutorsGrid" class="grid-3">
          <!-- Tutors dynamically loaded -->
        </div>
      </div>
    `;
    UI.setContent(actualHtml);

    const filters = {
      search: '',
      subject: preselectedSubject,
      sort: ''
    };

    const updateDisplay = () => {
      let filtered = [...tutors];
      if (filters.search) {
        filtered = filtered.filter(t => t.name?.toLowerCase().includes(filters.search.toLowerCase()));
      }
      if (filters.subject) {
        filtered = filtered.filter(t => t.subjects?.includes(filters.subject));
      }
      if (filters.sort === 'rating') {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      const grid = document.getElementById('tutorsGrid');
      if (!grid) return;

      if (filtered.length === 0) {
        grid.style.display = 'block';
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon" style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
            <h3 style="margin-bottom: 0.5rem;">No Tutors Found</h3>
            <p class="text-muted" style="max-width: 400px; margin: 0 auto;">We couldn't find any tutors matching your current filter criteria. Try adjusting your query!</p>
          </div>
        `;
        return;
      }

      grid.style.display = 'grid';
      grid.innerHTML = filtered.map(tutor => {
        const availBadge = (tutor.is_available ?? tutor.isAvailable ?? true) 
          ? `<span class="badge badge-success" style="font-size: 11px; padding: 4px 8px; margin-bottom: 0.5rem; display: inline-block;">● Available Today</span>`
          : `<span class="badge badge-secondary" style="font-size: 11px; padding: 4px 8px; margin-bottom: 0.5rem; display: inline-block; background: #94a3b8; color: white;">● Unavailable</span>`;

        const subPills = (tutor.subjects || []).map(s => `<span class="subject-tag" style="margin: 2px; font-size: 11px; padding: 2px 6px;">${sanitize(s)}</span>`).join('');

        return `
          <div class="tutor-card animate-fade-in-up card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div class="tutor-avatar" style="margin: 0; font-size: 2.5rem; width: 60px; height: 60px; background: var(--color-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden;">${renderAvatar(tutor.avatar, 60, tutor.name)}</div>
                ${availBadge}
              </div>
              <div class="tutor-content" style="padding: 0;">
                <div class="tutor-name" style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${sanitize(tutor.name)}</div>
                <p class="tutor-bio" style="font-size: 0.9rem; color: var(--color-text-secondary); margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; height: 4.2em; line-height: 1.4;">${sanitize(tutor.bio)}</p>
                <div style="margin-bottom: 1rem; display: flex; flex-wrap: wrap;">
                  ${subPills}
                </div>
              </div>
            </div>
            <div>
              <div class="tutor-meta" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-muted); display: flex; justify-content: flex-start; align-items: center;">
                <div class="rating-display" style="font-size: 0.85rem;">
                  ${UI.renderStars(Math.round(tutor.rating || 0))}
                  <span class="rating-count" style="font-size: 11px;">(${sanitize(tutor.totalReviews || 0)})</span>
                </div>
              </div>
              <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0.5rem 0;">
                ${sanitize((tutor.years_of_experience ?? tutor.yearsOfExperience ?? 0) || 0)} yrs exp • ${sanitize(tutor.experienceLevel || 'N/A')}
              </div>
              <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="router.navigate('/tutors/${tutor.id}')">Profile</button>
                <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="bookSession('${tutor.id}', '${sanitize(tutor.name)}')">Quick Book</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    updateDisplay();

    const searchInputEl = document.getElementById('searchInput');
    if (searchInputEl) {
      searchInputEl.addEventListener('input', (e) => {
        filters.search = e.target.value.trim();
        updateDisplay();
      });
    }

    const subjectFilterEl = document.getElementById('subjectFilter');
    if (subjectFilterEl) {
      subjectFilterEl.addEventListener('change', (e) => {
        filters.subject = e.target.value;
        updateDisplay();
      });
    }

    const sortByEl = document.getElementById('sortBy');
    if (sortByEl) {
      sortByEl.addEventListener('change', (e) => {
        filters.sort = e.target.value;
        updateDisplay();
      });
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          filters.search = searchInput.value.trim();
          updateDisplay();
        }
      });
    }
  } catch (error) {
    console.error('[FindTutors] Critical error:', error);
    UI.showAlert('Failed to load tutors. Please try again.', 'error');
    // Show empty state on error
    UI.setContent(`
      <div class="container" style="padding: 2rem 0;">
        <h1 class="mb-lg">Find Your Perfect Tutor</h1>
        <div class="card text-center" style="padding: 3rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
          <h3 style="margin-bottom: 0.5rem;">Unable to Load Tutors</h3>
          <p class="text-muted">Something went wrong while loading the tutor list. Please refresh the page and try again.</p>
          <button class="btn btn-primary" onclick="router.navigate('/tutors')" style="margin-top: 1rem;">Retry</button>
        </div>
      </div>
    `);
  }
}

// PAGE 6: TUTOR PROFILE
async function renderTutorProfile(hash) {
  if (!appData) {
    console.error('[TutorProfile] appData not initialized');
    return;
  }
  const tutorId = hash.split('/')[2];
  const tutor = await appData.getTutorById(tutorId);
  const reviewsResult = await appData.getReviews() || [];
  const reviews = (Array.isArray(reviewsResult) ? reviewsResult : []).filter(r => r.tutorId === tutorId);

  if (!tutor) {
    router.navigate('/tutors');
    return;
  }

  const html = `
    <div class="container profile-container-mobile" style="padding: 2rem 0;">
      <button class="btn btn-ghost mb-lg" onclick="router.navigate('/tutors')">&larr; Back to Tutors</button>

      <div class="profile-header">
        <div class="profile-avatar" style="font-size: 4rem; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; overflow: hidden;">${renderAvatar(tutor.avatar, 100, tutor.name)}</div>
        <div class="profile-info">
          <div class="profile-name">${sanitize(tutor.name)}</div>
          <div class="rating-display" style="margin-bottom: 1rem;">
            ${UI.renderStars(Math.round(tutor.rating))}
            <span class="rating-count">(${sanitize(tutor.totalReviews)} reviews)</span>
          </div>
          <div class="profile-meta">
            <div class="profile-meta-item">
              <div class="profile-meta-label">Experience</div>
              <div class="profile-meta-value">${sanitize((tutor.years_of_experience ?? tutor.yearsOfExperience ?? 0))} years</div>
            </div>
            <div class="profile-meta-item">
              <div class="profile-meta-label">Status</div>
              <div class="profile-meta-value" style="color: ${(tutor.is_available ?? tutor.isAvailable ?? true) ? '#10B981' : '#EF4444'};">
                ${(tutor.is_available ?? tutor.isAvailable ?? true) ? '● Available Today' : '● Unavailable'}
              </div>
            </div>
          </div>
          <div class="profile-actions">
            <button class="btn btn-primary" onclick="bookSession('${tutorId}', '${sanitize(tutor.name)}')">Book Session</button>
            <button class="btn btn-secondary" onclick="sendMessage('${tutorId}', '${sanitize(tutor.name)}')">Message</button>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">About</div>
        <p>${sanitize(tutor.bio)}</p>
        <div style="margin-top: 1rem;">
          <strong>Qualifications:</strong> ${sanitize(tutor.qualifications)}
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">Subjects</div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          ${tutor.subjects.map(subject => `<span class="subject-tag">${sanitize(subject)}</span>`).join('')}
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">Reviews (${reviews.length})</div>
        ${reviews.length > 0 ? `
          ${reviews.map(review => `
            <div class="review-item">
              <div class="review-avatar">👤</div>
              <div class="review-content">
                <div class="review-header">
                  <div class="review-name">Verified Student</div>
                  <div>${UI.renderStars(review.rating)}</div>
                </div>
                <p class="review-text">${sanitize(review.comment)}</p>
              </div>
            </div>
          `).join('')}
        ` : `<p class="text-muted">No reviews yet</p>`}
      </div>
    </div>

    <!-- Mobile Sticky Book Bar -->
    <div class="mobile-sticky-book-bar">
      <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${UI.renderStars(Math.round(tutor.rating))}</div>
      <button class="btn btn-primary" onclick="bookSession('${tutorId}', '${sanitize(tutor.name)}')">Book Now</button>
    </div>
  `;
  UI.setContent(html);
}

// Global Multi-step Booking Stepper Controller
window.bookSession = async (tutorId, tutorName) => {
  const user = appData.getCurrentUser();
  if (!user) {
    UI.showAlert('Please log in to book a session.', 'warning');
    setTimeout(() => router.navigate('/login'), 1200);
    return;
  }
  const tutor = await appData.getTutorById(tutorId);
  const subjects = tutor ? tutor.subjects : [];
  
  let currentStep = 1;
  let date = '';
  let time = '';
  let subject = '';
  let duration = '60';
  let notes = '';

  const renderModalContent = () => {
    let stepContent = '';
    if (currentStep === 1) {
      stepContent = `
        <div class="stepper-header" style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
          <span style="font-weight: 700; color: var(--color-primary);">Step 1: Time & Subject</span>
          <span style="color: var(--color-text-secondary); font-size: 0.85rem;">Next: Step 2</span>
        </div>
        <div class="form-group">
          <label class="form-label">Select Date</label>
          <input type="date" class="form-input" id="stepDate" value="${sanitize(date)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Select Time</label>
          <input type="time" class="form-input" id="stepTime" value="${sanitize(time)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <select class="form-select" id="stepSubject" required>
            <option value="">Select subject</option>
            ${subjects.map(s => `<option value="${sanitize(s)}" ${s === subject ? 'selected' : ''}>${sanitize(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Duration (minutes)</label>
          <input type="number" class="form-input" id="stepDuration" value="${sanitize(duration)}" min="30" max="180" required>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-primary" style="flex: 1;" onclick="goToStep(2)">Next Step &rarr;</button>
          <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="closeBookingModal()">Cancel</button>
        </div>
      `;
    } else if (currentStep === 2) {
      stepContent = `
        <div class="stepper-header" style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
          <span style="color: var(--color-text-secondary); font-size: 0.85rem;">&larr; Back</span>
          <span style="font-weight: 700; color: var(--color-primary);">Step 2: Add Notes</span>
          <span style="color: var(--color-text-secondary); font-size: 0.85rem;">Next: Step 3</span>
        </div>
        <div class="form-group">
          <label class="form-label">Session Notes (Optional)</label>
          <textarea class="form-textarea" id="stepNotes" rows="4" placeholder="Mention any homework topics or specific challenges you have...">${sanitize(notes)}</textarea>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="goToStep(1)">&larr; Back</button>
          <button type="button" class="btn btn-primary" style="flex: 1;" onclick="goToStep(3)">Review Details &rarr;</button>
        </div>
      `;
    } else if (currentStep === 3) {
      stepContent = `
        <div class="stepper-header" style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
          <span style="color: var(--color-text-secondary); font-size: 0.85rem;">&larr; Back</span>
          <span style="font-weight: 700; color: var(--color-primary);">Step 3: Confirmation</span>
        </div>
        <div style="background: var(--color-background); padding: 1.25rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; border: 1px solid var(--color-muted);">
          <p style="margin-bottom: 0.5rem;"><strong>Tutor:</strong> ${sanitize(tutorName)}</p>
          <p style="margin-bottom: 0.5rem;"><strong>Subject:</strong> ${sanitize(subject)}</p>
          <p style="margin-bottom: 0.5rem;"><strong>Date:</strong> ${sanitize(date)}</p>
          <p style="margin-bottom: 0.5rem;"><strong>Time:</strong> ${sanitize(time)}</p>
          <p style="margin-bottom: 0.5rem;"><strong>Duration:</strong> ${sanitize(duration)} minutes</p>
          ${notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${sanitize(notes)}</p>` : ''}
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="goToStep(2)">&larr; Back</button>
          <button type="button" class="btn btn-success" style="flex: 1;" onclick="confirmBooking()">Confirm & Book</button>
        </div>
      `;
    }

    const html = `
      <div id="bookingStepper" style="min-width: 290px;">
        <div class="stepper-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <div class="stepper-circle ${currentStep >= 1 ? 'active' : ''}">1</div>
          <div class="stepper-line ${currentStep >= 2 ? 'active' : ''}"></div>
          <div class="stepper-circle ${currentStep >= 2 ? 'active' : ''}">2</div>
          <div class="stepper-line ${currentStep >= 3 ? 'active' : ''}"></div>
          <div class="stepper-circle ${currentStep >= 3 ? 'active' : ''}">3</div>
        </div>
        ${stepContent}
      </div>
    `;

    return html;
  };

  const modal = UI.showModal(renderModalContent(), `Book a Session`);

  window.closeBookingModal = () => {
    modal.remove();
  };

  window.goToStep = (step) => {
    if (currentStep === 1) {
      date = document.getElementById('stepDate').value;
      time = document.getElementById('stepTime').value;
      subject = document.getElementById('stepSubject').value;
      duration = document.getElementById('stepDuration').value;

      if (!date || !time || !subject) {
        UI.showAlert('Please complete all step 1 details.', 'warning');
        return;
      }
    } else if (currentStep === 2) {
      notes = document.getElementById('stepNotes').value;
    }

    currentStep = step;
    modal.querySelector('.modal-body').innerHTML = renderModalContent();
  };

  window.confirmBooking = () => {
    const student = appData.getCurrentUser();
    if (!student) {
      UI.showAlert('Please login or switch role to Student first.', 'warning');
      modal.remove();
      return;
    }

    const newBooking = {
      student_id: student.id,
      tutor_id: tutorId,
      scheduled_at: new Date(`${date}T${time}`).toISOString(),
      duration: parseInt(duration),
      subject: subject,
      status: 'pending',
      notes: notes
    };

    appData.addBooking(newBooking);
    UI.showAlert('Session successfully requested! Waiting for admin approval.', 'success');
    modal.remove();

    if (router.currentPage === '/student-dashboard') {
      renderStudentDashboard();
    }
  };
};

function sendMessage(tutorId, tutorName) {
  const html = `
    <div>
      <h3>Message ${tutorName}</h3>
      <form id="messageForm">
        <div class="form-group">
          <label class="form-label">Your Message</label>
          <textarea class="form-textarea" id="messageText" placeholder="Type your message..." required></textarea>
        </div>
        <div style="display: flex; gap: 1rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Send</button>
          <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  const modal = UI.showModal(html, 'Send Message');
  document.getElementById('messageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentUser = appData.getCurrentUser() || { id: 'user1' };
    const text = document.getElementById('messageText').value.trim();
    if (text) {
      appData.addMessage({
        senderId: currentUser.id,
        recipientId: tutorId,
        content: text,
        timestamp: new Date().toISOString(),
        read: false,
        threadId: [currentUser.id, tutorId].sort()[0] + '__' + [currentUser.id, tutorId].sort()[1] + '__general',
        sessionId: null,
        attachments: []
      });
    }
    UI.showAlert('Message sent!', 'success');
    modal.remove();
  });
}

// PAGE 7: STUDENT DASHBOARD
async function renderStudentDashboard() {
  if (!appData) {
    console.error('[StudentDashboard] appData not initialized');
    return;
  }
  if (!requireRole(['student'])) return;
  const user = appData.getCurrentUser();

  // 600ms Skeleton Loader
  const skeletonHtml = `
    <div class="container" style="padding: 2rem 0;">
      <div class="skeleton" style="width: 40%; height: 36px; margin-bottom: 2rem; border-radius: var(--radius-md);"></div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="skeleton" style="height: 100px; border-radius: var(--radius-lg);"></div>
        <div class="skeleton" style="height: 100px; border-radius: var(--radius-lg);"></div>
        <div class="skeleton" style="height: 100px; border-radius: var(--radius-lg);"></div>
      </div>
      <div class="card skeleton" style="height: 250px; border-radius: var(--radius-lg);"></div>
    </div>
  `;
  UI.setContent(skeletonHtml);

  setTimeout(async () => {
    if (router.currentPage !== '/student-dashboard') return;

    const allBookings = await appData.getBookings() || [];
    const bookings = (Array.isArray(allBookings) ? allBookings : []).filter(b => (b.student_id || b.studentId) === user?.id);
    const completedSessions = bookings.filter(b => b.status === 'completed').length;
    const upcomingSessions = bookings.filter(b => b.status === 'confirmed').length;

    // Search nearest upcoming confirmed booking
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    confirmedBookings.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    
    let countdownCard = '';
    const now = new Date();
    const nextSession = confirmedBookings.find(b => new Date(`${b.date}T${b.time}`) > now);
    
    if (nextSession) {
      const nextTime = new Date(`${nextSession.date}T${nextSession.time}`);
      const diffMs = nextTime - now;
      const diffMins = Math.floor(diffMs / 1000 / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let countdownText = '';
      if (diffDays > 0) {
        countdownText = `🔥 Starts in ${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
      } else if (diffHours > 0) {
        countdownText = `⚡ Starts in ${diffHours}h ${diffMins % 60}m`;
      } else if (diffMins > 0) {
        countdownText = `⏳ Starts in ${diffMins} mins!`;
      } else {
        countdownText = `🎬 Starts now!`;
      }

      countdownCard = `
        <div class="card card-accent" style="margin-bottom: 2rem; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%); color: white; border: none; padding: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; display: block; margin-bottom: 0.25rem;">Next Scheduled Class</span>
            <h3 style="color: white; margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 800;">${countdownText}</h3>
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;"><strong>${sanitize(nextSession.subject)}</strong> with Tutor on ${sanitize(nextSession.date)} at ${sanitize(nextSession.time)}</p>
          </div>
          <div style="font-size: 3rem; animation: bounce 2s infinite;">⏰</div>
        </div>
      `;
    }

    // Streak and points (simplified without leaderboard)
    const streak = 12;
    const points = 2320;

    const streakRingHtml = `
      <div class="card" style="margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; padding: 1.5rem;">
        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">Learning Streak</h3>
          <p class="text-muted" style="margin: 0; font-size: 0.9rem;">Maintain your streak by taking weekly sessions!</p>
          <div style="margin-top: 1rem; font-size: 1.1rem; font-weight: 600;">Total Score: <span style="color: var(--color-primary); font-weight: 800;">${points} XP</span></div>
        </div>
        <div class="streak-ring-container" style="position: relative; width: 100px; height: 100px;">
          <svg width="100" height="100" viewBox="0 0 100 100" style="transform: rotate(-90deg);">
            <circle cx="50" cy="50" r="40" stroke="var(--color-muted)" stroke-width="8" fill="transparent" />
            <circle cx="50" cy="50" r="40" stroke="var(--color-primary)" stroke-width="8" fill="transparent"
              stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * Math.min(streak, 30)) / 30}"
              stroke-linecap="round" />
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <span style="font-size: 1.35rem; font-weight: 800; display: block; color: var(--color-primary); margin-top: -4px;">🔥${streak}</span>
            <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--color-text-secondary); font-weight: 600; display: block;">Days</span>
          </div>
        </div>
      </div>
    `;

    const actualHtml = `
      <div class="container" style="padding: 2rem 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <h1 style="margin: 0;">Welcome back, ${user ? sanitize(user.name) : 'Student'}!</h1>
          <button class="btn btn-outline" onclick="window.location.href='setup-student-profile.html'">
            ✏️ Edit Profile
          </button>
        </div>

        ${countdownCard}

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          ${streakRingHtml}
          <div class="card" style="margin-bottom: 2rem; display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem;">
            <div>
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">Class Overview</h3>
              <p class="text-muted" style="margin: 0; font-size: 0.9rem;">Overview of your session activity.</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center; margin-top: 1rem;">
              <div style="background: var(--color-background); padding: 0.75rem; border-radius: var(--radius-md);">
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary);">${bookings.length}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Total</div>
              </div>
              <div style="background: #e6f4ea; padding: 0.75rem; border-radius: var(--radius-md);">
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-success);">${upcomingSessions}</div>
                <div style="font-size: 0.75rem; color: var(--color-success);">Confirmed</div>
              </div>
              <div style="background: #fef3c7; padding: 0.75rem; border-radius: var(--radius-md);">
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-warning);">${completedSessions}</div>
                <div style="font-size: 0.75rem; color: #b45309;">Done</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="mb-lg">Your Sessions</h2>
          ${bookings.length > 0 ? `
            <div class="session-list">
              ${bookings.map(booking => {
                const tutorUser = appData.getUsers().find(u => u.id === booking.tutorId);
                const tutorName = tutorUser ? sanitize(tutorUser.name) : 'Tutor';
                return `
                <div class="session-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--color-muted);">
                  <div class="session-info">
                    <div class="session-title" style="font-weight: 600; font-size: 1.05rem;">${sanitize(booking.subject)} Session with ${tutorName}</div>
                    <div class="session-meta text-muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
                      <span style="margin-right: 1rem;">📅 ${sanitize(booking.date)}</span>
                      <span style="margin-right: 1rem;">⏰ ${sanitize(booking.time)}</span>
                      <span>⏱️ ${sanitize(booking.duration)} mins</span>
                    </div>
                  </div>
                  <div class="session-actions" style="display: flex; align-items: center; gap: 0.5rem;">
                    ${UI.getStatusBadge(booking.status)}
                    <button class="btn btn-sm btn-secondary" onclick="openChatWith('${booking.tutorId}', '${booking.id}')">Message</button>
                    ${booking.status === 'completed' ? `<button class="btn btn-sm btn-primary" onclick="leaveReview('${booking.id}')">Leave Review</button>` : ''}
                  </div>
                </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon" style="font-size: 4rem; margin-bottom: 1rem;">📅</div>
              <h3 style="margin-bottom: 0.5rem;">No Bookings Found</h3>
              <p class="text-muted" style="max-width: 400px; margin: 0 auto 1.5rem;">You haven't scheduled any tutoring sessions yet. Find a tutor and start your learning journey!</p>
              <button class="btn btn-primary" onclick="router.navigate('/tutors')">Browse Tutors</button>
            </div>
          `}
        </div>

        <div class="card" style="margin-top: 2rem;">
          <h2 class="mb-lg">Send Feedback</h2>
          <p class="text-muted" style="margin-bottom: 1.5rem;">Have suggestions, found a bug, or want to share your experience? Let us know!</p>
          <form id="feedbackForm">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Type</label>
                <select class="form-input" id="feedbackType">
                  <option value="general">General Feedback</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="bug">Bug Report</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Subject</label>
                <input type="text" class="form-input" id="feedbackSubject" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Message</label>
              <textarea class="form-textarea" id="feedbackMessage" rows="4" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Submit Feedback</button>
          </form>
        </div>
      </div>
    `;

    UI.setContent(actualHtml);

    document.getElementById('feedbackForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const feedback = {
        userId: user?.id || 'user1',
        userName: user?.name || 'Student',
        type: document.getElementById('feedbackType').value,
        subject: document.getElementById('feedbackSubject').value,
        message: document.getElementById('feedbackMessage').value
      };
      appData.addFeedback(feedback);
      UI.showAlert('Feedback submitted successfully!', 'success');
      document.getElementById('feedbackForm').reset();
    });
  }, 150);
}

function leaveReview(bookingId) {
  const html = `
    <div>
      <h3>Leave a Review</h3>
      <form id="reviewForm">
        <div class="form-group">
          <label class="form-label">Rating</label>
          <div style="display: flex; gap: 0.5rem; font-size: 2rem; margin-bottom: 1rem;">
            ${[1, 2, 3, 4, 5].map(i => `<button type="button" class="star-btn" data-rating="${i}" style="background: none; border: none; cursor: pointer;">★</button>`).join('')}
          </div>
          <input type="hidden" id="rating" value="5" required>
        </div>
        <div class="form-group">
          <label class="form-label">Your Comment</label>
          <textarea class="form-textarea" id="comment" placeholder="Share your feedback..." required></textarea>
        </div>
        <div style="display: flex; gap: 1rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Submit Review</button>
          <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  const modal = UI.showModal(html, 'Leave a Review');

  let selectedRating = 5;
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      selectedRating = parseInt(btn.dataset.rating);
      document.getElementById('rating').value = selectedRating;
      document.querySelectorAll('.star-btn').forEach((b, i) => {
        b.style.color = (i + 1) <= selectedRating ? '#fbbf24' : '#ccc';
      });
    });
    btn.style.color = (parseInt(btn.dataset.rating) <= selectedRating) ? '#fbbf24' : '#ccc';
  });

  document.getElementById('reviewForm').addEventListener('submit', (e) => {
    e.preventDefault();
    UI.showAlert('Review submitted successfully!', 'success');
    modal.remove();
    renderStudentDashboard();
  });
}

// PAGE 8: TUTOR DASHBOARD
async function renderTutorDashboard() {
  if (!appData) {
    console.error('[TutorDashboard] appData not initialized');
    return;
  }
  if (!requireRole(['tutor'])) return;
  const user = appData.getCurrentUser();

  // 600ms Skeleton Loader
  const skeletonHtml = `
    <div class="container" style="padding: 2rem 0;">
      <div class="skeleton" style="width: 40%; height: 36px; margin-bottom: 2rem; border-radius: var(--radius-md);"></div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="skeleton" style="height: 100px; border-radius: var(--radius-lg);"></div>
        <div class="skeleton" style="height: 100px; border-radius: var(--radius-lg);"></div>
      </div>
      <div class="card skeleton" style="height: 250px; border-radius: var(--radius-lg);"></div>
    </div>
  `;
  UI.setContent(skeletonHtml);

  setTimeout(async () => {
    if (router.currentPage !== '/tutor-dashboard') return;

    const bookingsResult = await appData.getBookings() || [];
    const bookings = Array.isArray(bookingsResult) ? bookingsResult : [];
    const tutorBookings = bookings.filter(b => (b.tutor_id || b.tutorId) === user?.id);
    
    const pending = tutorBookings.filter(b => b.status === 'pending');
    const active = tutorBookings.filter(b => b.status === 'confirmed');
    const completed = tutorBookings.filter(b => b.status === 'completed');


    // Priority Sort Bookings (Pending -> Confirmed -> Completed)
    const priorityBookings = [...pending, ...active, ...completed, ...tutorBookings.filter(b => b.status === 'cancelled')];

    const actualHtml = `
      <div class="container" style="padding: 2rem 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <h1 style="margin: 0;">Tutor Dashboard</h1>
          <button class="btn btn-outline" onclick="window.location.href='setup-tutor-profile.html'">
            ✏️ Edit Profile
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          <div class="card" style="padding: 1.25rem; text-align: center; border-left: 4px solid var(--color-primary);">
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--color-text-primary);">${tutorBookings.length}</div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem;">Total Bookings</div>
          </div>
          <div class="card" style="padding: 1.25rem; text-align: center; border-left: 4px solid var(--color-warning);">
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--color-warning);">${pending.length}</div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem;">Pending Requests</div>
          </div>
          <div class="card" style="padding: 1.25rem; text-align: center; border-left: 4px solid var(--color-success);">
            <div style="font-size: 1.75rem; font-weight: 800; color: var(--color-success);">${active.length}</div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem;">Confirmed Classes</div>
          </div>
        </div>

        ${pending.length > 0 ? `
          <div class="card animate-fade-in-up" style="margin-bottom: 2rem; border: 1px solid #f59e0b; background-color: rgba(245, 158, 11, 0.03);">
            <h3 style="color: #d97706; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">⚠️ Priority Actions: Pending Session Requests</h3>
            <div class="session-list">
              ${pending.map(booking => {
                const studentUser = appData.getUsers().find(u => u.id === booking.studentId);
                const studentName = studentUser ? sanitize(studentUser.name) : 'Student';
                return `
                <div class="session-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--color-muted);">
                  <div class="session-info">
                    <div style="font-weight: 700; font-size: 1.05rem;">${sanitize(booking.subject)} Session Request from ${studentName}</div>
                    <div class="session-meta text-muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
                      <span style="margin-right: 1rem;">📅 ${sanitize(booking.date)}</span>
                      <span style="margin-right: 1rem;">⏰ ${sanitize(booking.time)}</span>
                      <span>⏱️ ${sanitize(booking.duration)} mins</span>
                    </div>
                  </div>
                  <div class="session-actions" style="display: flex; align-items: center; gap: 0.5rem;">
                    <button class="btn btn-sm btn-success" onclick="respondRequest('${booking.id}', 'accept')">Accept</button>
                    <button class="btn btn-sm btn-danger" onclick="respondRequest('${booking.id}', 'reject')">Decline</button>
                    <button class="btn btn-sm btn-secondary" onclick="openChatWith('${booking.studentId}', '${booking.id}')">Message</button>
                  </div>
                </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <div class="card animate-fade-in-up">
          <h2 class="mb-lg">All Assigned Sessions</h2>
          ${tutorBookings.length > 0 ? `
            <div class="session-list">
              ${priorityBookings.filter(b => b.status !== 'pending').map(booking => {
                const studentUser = appData.getUsers().find(u => u.id === booking.studentId);
                const studentName = studentUser ? sanitize(studentUser.name) : 'Student';
                return `
                <div class="session-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--color-muted);">
                  <div class="session-info">
                    <div style="font-weight: 600; font-size: 1.05rem;">${sanitize(booking.subject)} Session with ${studentName}</div>
                    <div class="session-meta text-muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
                      <span style="margin-right: 1rem;">📅 ${sanitize(booking.date)}</span>
                      <span style="margin-right: 1rem;">⏰ ${sanitize(booking.time)}</span>
                      <span style="margin-right: 1rem;">⏱️ ${sanitize(booking.duration)} mins</span>
                    </div>
                  </div>
                  <div class="session-actions" style="display: flex; align-items: center; gap: 0.5rem;">
                    ${UI.getStatusBadge(booking.status)}
                    <button class="btn btn-sm btn-secondary" onclick="openChatWith('${booking.studentId}', '${booking.id}')">Message</button>
                  </div>
                </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon" style="font-size: 4rem; margin-bottom: 1rem;">📋</div>
              <h3 style="margin-bottom: 0.5rem;">No Active Sessions</h3>
              <p class="text-muted" style="max-width: 400px; margin: 0 auto;">You have no booked tutoring classes at the moment. Share your tutor profile to attract student bookings!</p>
            </div>
          `}
        </div>
      </div>
    `;

    UI.setContent(actualHtml);
  }, 150);
}

// Global Respond Event Handler
window.respondRequest = (bookingId, action) => {
  const status = action === 'accept' ? 'confirmed' : 'cancelled';
  appData.updateBookingStatus(bookingId, status);
  const msg = action === 'accept' ? 'Session request accepted successfully!' : 'Session request declined.';
  const type = action === 'accept' ? 'success' : 'warning';
  UI.showAlert(msg, type);
  renderTutorDashboard();
};

// PAGE 9: MESSAGES/CHAT
window.activeChatContactId = null;
window.activeChatSessionId = null;

function getChatCurrentUserId() {
  return appData.getCurrentUser()?.id || 'user1';
}

async function getChatContacts() {
  const currentUserId = getChatCurrentUserId();
  const [users, allBookings, allMessages] = await Promise.all([
    appData.getUsers(),
    appData.getBookings(),
    appData.getMessages()
  ]);
  const safeUsers = users || [];
  const seen = new Set();
  const results = [];

  const bookings = (allBookings || []).filter(b =>
    (b.student_id || b.studentId) === currentUserId ||
    (b.tutor_id || b.tutorId) === currentUserId
  );

  bookings.forEach(booking => {
    const studentId = booking.student_id || booking.studentId;
    const tutorId   = booking.tutor_id   || booking.tutorId;
    const contactId = studentId === currentUserId ? tutorId : studentId;
    const contact = safeUsers.find(u => u.id === contactId) ||
      { id: contactId, name: contactId, role: studentId === currentUserId ? 'tutor' : 'student' };
    const key = `${contactId}:${booking.id || (booking.date+'_'+booking.subject)}`;
    if (!seen.has(key)) { seen.add(key); results.push({ contact, booking }); }
  });

  (allMessages || []).forEach(msg => {
    if (msg.sessionId || msg.session_id) return;
    const otherUserId = msg.senderId === currentUserId ? msg.recipientId
      : (msg.recipientId === currentUserId ? msg.senderId : null);
    if (!otherUserId) return;
    const key = `${otherUserId}:general`;
    if (!seen.has(key)) {
      seen.add(key);
      const contact = safeUsers.find(u => u.id === otherUserId) ||
        { id: otherUserId, name: otherUserId, role: 'unknown' };
      results.push({ contact, booking: { id: null, subject: 'Direct Message', date: '' } });
    }
  });

  return results;
}

function getChatThreadId(contactId, sessionId) {
  const users = [getChatCurrentUserId(), contactId].sort();
  return users[0] + '__' + users[1] + '__' + (sessionId || 'general');
}

function formatMessageTime(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

async function getChatThread(contactId, sessionId) {
  const currentUserId = getChatCurrentUserId();
  const threadId = getChatThreadId(contactId, sessionId);
  const allMessages = await appData.getMessages() || [];
  return allMessages.filter(msg =>
    msg.threadId === threadId ||
    (!msg.threadId && !sessionId && (
      (msg.senderId === currentUserId && msg.recipientId === contactId) ||
      (msg.senderId === contactId && msg.recipientId === currentUserId)
    ))
  ).sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
}

function getInitial(name) {
  if (!name) return '?';
  return String(name).trim().charAt(0).toUpperCase();
}

async function renderChatMessages(contactId) {
  const currentUserId = getChatCurrentUserId();
  const thread = contactId ? await getChatThread(contactId, window.activeChatSessionId) : [];
  const users = (await appData.getUsers()) || [];
  const currentUser = appData.getCurrentUser() || users.find(u => u.id === currentUserId) || { name: 'You' };
  const contact = users.find(u => u.id === contactId) || { name: 'Contact' };

  if (!contactId || thread.length === 0) {
    return `
      <div class="empty-state" style="border: none; background: transparent; text-align:center; padding: 2rem 1rem;">
        <div class="empty-state-icon" style="font-size: 3.5rem; margin-bottom: 0.5rem;">💬</div>
        <h4>No conversation history. Send a message to start!</h4>
      </div>
    `;
  }

  let lastTime = '';
  let html = '';
  thread.forEach(msg => {
    const isSent = msg.senderId === currentUserId;
    const time = formatMessageTime(msg.timestamp);
    if (time !== lastTime) {
      html += `<div class="timestamp">${sanitize(time)}</div>`;
      lastTime = time;
    }
    const author = isSent ? currentUser : contact;
    const avatar = `<div class="msg-av">${sanitize(getInitial(author.name))}<div class="online-dot"></div></div>`;
    const attachmentsHtml = (msg.attachments || []).map(att => `
      <div style="margin-top: 6px;">
        <a href="${att.dataUrl}" download="${sanitize(att.name)}" style="color: inherit; text-decoration: underline;">📎 ${sanitize(att.name)}</a>
      </div>
    `).join('');
    const tick = isSent ? '<span class="tick">✓✓</span>' : '';
    html += `
      <div class="msg-row ${isSent ? 'sent' : ''}">
        ${avatar}
        <div class="bubble ${isSent ? 'sent' : 'recv'}">
          ${msg.content ? `<div>${sanitize(msg.content)}</div>` : ''}
          ${attachmentsHtml}
          ${tick}
        </div>
      </div>
    `;
  });
  return html;
}

async function refreshChatThread() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  chatMessages.innerHTML = renderChatMessages(window.activeChatContactId);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function renderChat() {
  if (!appData) {
    console.error('[Chat] appData not initialized');
    return;
  }
  if (!requireRole(['student', 'tutor', 'admin'])) return;
  const contacts = await getChatContacts();
  if ((!window.activeChatContactId || !contacts.some(c => c.contact.id === window.activeChatContactId && c.booking.id === window.activeChatSessionId)) && contacts.length > 0) {
    window.activeChatContactId = contacts[0].contact.id;
    window.activeChatSessionId = contacts[0].booking.id;
  }

  const active = contacts.find(c => c.contact.id === window.activeChatContactId && c.booking.id === window.activeChatSessionId) || contacts[0];
  const activeContact = active?.contact;
  const activeBooking = active?.booking || {};
  const currentUserName = appData.getCurrentUser()?.name || 'You';

  const html = `
    <div class="chat-container">
      <div class="chat-sidebar">
        <ul class="chat-list" id="chatList">
          ${contacts.length > 0 ? contacts.map(({ contact, booking }) => `
            <li class="chat-item ${contact.id === window.activeChatContactId && booking.id === window.activeChatSessionId ? 'active' : ''}" onclick="selectChat('${contact.id}', '${booking.id}', this)">
              <div class="chat-item-name">${sanitize(contact.name)}</div>
              <div class="chat-item-message">${sanitize(booking.subject || 'Session')} • ${sanitize(booking.date || '')}</div>
            </li>
          `).join('') : `
            <li class="chat-item" style="opacity: 0.6; cursor: default;">
              <div class="chat-item-name">No session contacts yet</div>
              <div class="chat-item-message">Book or receive sessions to chat</div>
            </li>
          `}
        </ul>
      </div>

      <div class="chat-main">
        <div class="chat-card">
          ${activeContact ? `
            <div class="chat-header">
              <div class="header-row1">
                <button class="back-btn" onclick="history.back()" aria-label="Back">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span class="session-title">${sanitize(activeBooking.subject || 'Session')} — ${sanitize(activeContact.name)}</span>
                ${activeBooking.status ? `<span class="time-chip">${sanitize(activeBooking.status)}</span>` : ''}
                <div class="avatars">
                  <div class="av">${sanitize(getInitial(currentUserName))}</div>
                  <div class="av">${sanitize(getInitial(activeContact.name))}</div>
                </div>
              </div>

              ${(activeBooking.date || activeBooking.time) ? `
                <div class="time-block">
                  <div class="time-slot">
                    <div class="time-num">${sanitize(activeBooking.time || '—')}</div>
                    <div class="time-date">${sanitize(activeBooking.date || '')}</div>
                  </div>
                  <div class="time-arrow">›</div>
                  <div class="time-slot">
                    <div class="time-num">${sanitize(activeBooking.duration ? activeBooking.duration + ' min' : 'Session')}</div>
                    <div class="time-date">${sanitize(activeBooking.status || '')}</div>
                  </div>
                  <div class="header-dots">···</div>
                </div>
              ` : ''}

              <div class="header-tags">
                ${activeBooking.subject ? `<span class="htag">📚 ${sanitize(activeBooking.subject)}</span>` : ''}
                <span class="htag">💬 Direct Chat</span>
                ${activeContact.role ? `<span class="htag">🎓 ${sanitize(activeContact.role)}</span>` : ''}
              </div>
            </div>
          ` : ''}

          <div class="messages" id="chatMessages">
            ${renderChatMessages(window.activeChatContactId)}
          </div>

          <div class="chat-input">
            <input class="input-field" type="text" id="messageInput" placeholder="Type a message…" />
            <div class="input-actions">
              <button class="act-btn" title="Attach file" onclick="document.getElementById('chatAttachment').click()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <input type="file" id="chatAttachment" style="display: none;" onchange="showSelectedAttachmentName()" />
              <button class="act-btn" title="Emoji" onclick="insertEmoji()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </button>
              <button class="send-btn" onclick="sendChatMessage()">
                Send
                <span class="send-divider"></span>
                <span class="send-chevron">▾</span>
              </button>
            </div>
            <div id="attachmentName" class="text-muted text-sm" style="padding: 0.25rem 0 0;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);
  refreshChatThread();

  document.getElementById('messageInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
}

window.selectChat = (contactId, sessionId, element) => {
  window.activeChatContactId = contactId;
  // Treat the string 'null' (from template literals) as an actual null
  window.activeChatSessionId = (sessionId === 'null' || sessionId === 'undefined') ? null : sessionId;
  document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  refreshChatThread();
};

// Navigate to Chat with a specific contact pre-selected (used by dashboard buttons)
window.openChatWith = (contactId, sessionId) => {
  window.activeChatContactId = contactId;
  window.activeChatSessionId = (sessionId === 'null' || sessionId === 'undefined' || !sessionId) ? null : sessionId;
  router.navigate('/chat');
};

window.insertEmoji = () => {
  const input = document.getElementById('messageInput');
  if (!input) return;
  input.value = (input.value || '') + '😊';
  input.focus();
};

window.showSelectedAttachmentName = () => {
  const file = document.getElementById('chatAttachment')?.files?.[0];
  const label = document.getElementById('attachmentName');
  if (label) label.textContent = file ? `Attached: ${file.name}` : '';
};

window.sendChatMessage = async () => {
  const input = document.getElementById('messageInput');
  const fileInput = document.getElementById('chatAttachment');
  const file = fileInput?.files?.[0];
  if (input && (input.value.trim() || file) && window.activeChatContactId) {
    const attachments = [];
    if (file) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      attachments.push({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl });
    }
    const newMsg = {
      senderId: getChatCurrentUserId(),
      recipientId: window.activeChatContactId,
      content: input.value.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      threadId: getChatThreadId(window.activeChatContactId, window.activeChatSessionId),
      sessionId: window.activeChatSessionId,
      attachments
    };
    appData.addMessage(newMsg);
    input.value = '';
    if (fileInput) fileInput.value = '';
    const attachmentName = document.getElementById('attachmentName');
    if (attachmentName) attachmentName.textContent = '';
    refreshChatThread();
  }
};

// PAGE 10: ASSIGNMENTS
function renderAssignments() {
  if (!appData) {
    console.error('[Assignments] appData not initialized');
    return;
  }
  if (!requireRole(['student', 'tutor', 'admin'])) return;
  const assignments = appData.getAssignments();

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Assignments</h1>

      <div class="assignment-grid">
        <div class="assignment-list" id="assignmentList">
          ${assignments.length > 0 ? assignments.map((assign, idx) => `
            <div class="assignment-item ${idx === 0 ? 'active' : ''}" onclick="selectAssignment(${idx})">
              <h4>${sanitize(assign.title)}</h4>
              <p class="text-muted text-sm">${sanitize(assign.tutorId)}</p>
              <p class="text-sm">${UI.getStatusBadge(assign.status)}</p>
            </div>
          `).join('') : `
            <div class="empty-state" style="border: none; padding: 2rem 0;">
              <div class="empty-state-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">📝</div>
              <h4>No Homework Assignments</h4>
            </div>
          `}
        </div>

        <div class="assignment-detail" id="assignmentDetail">
          ${assignments.length > 0 ? `
            <div id="assignmentContent">
              ${renderAssignmentDetail(assignments[0])}
            </div>
          ` : `
            <div class="assignment-detail-empty" style="text-align: center; padding: 3rem 1rem;">
              <div class="empty-state-icon" style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
              <h3 style="margin-bottom: 0.5rem;">All Caught Up!</h3>
              <p class="text-muted" style="max-width: 400px; margin: 0 auto;">You have no pending assignments or graded homework items. Great job staying up to date!</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);
}

function renderAssignmentDetail(assignment) {
  return `
    <h2>${sanitize(assignment.title)}</h2>
    <p>${sanitize(assignment.description)}</p>
    <div style="margin: 1.5rem 0;">
      <strong>Due Date:</strong> ${sanitize(assignment.dueDate)}<br>
      <strong>Status:</strong> ${UI.getStatusBadge(assignment.status)}
    </div>

    ${assignment.status === 'pending' ? `
      <div class="file-upload-area">
        <div class="file-upload-icon">📁</div>
        <p>Drag and drop your file here or click to browse</p>
        <input type="file" style="display: none;" id="fileInput" />
      </div>
    ` : ''}

    ${assignment.status === 'graded' ? `
      <div style="margin-top: 1.5rem;">
        <h3>Your Grade: <span style="color: var(--color-primary); font-weight: 800;">${sanitize(assignment.grade)}/100</span></h3>
        <div class="feedback-box">
          <div class="feedback-title">Feedback</div>
          <div class="feedback-text">${sanitize(assignment.feedback)}</div>
        </div>
      </div>
    ` : ''}

    ${assignment.status === 'submitted' ? `
      <div style="margin-top: 1.5rem;">
        <p><strong>✓ Submitted on:</strong> ${sanitize(assignment.submittedDate)}</p>
        <p class="text-muted">Awaiting tutor review...</p>
      </div>
    ` : ''}
  `;
}

window.selectAssignment = (idx) => {
  const assignments = appData.getAssignments();
  document.querySelectorAll('.assignment-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  const content = document.getElementById('assignmentContent');
  if (content && assignments[idx]) {
    content.innerHTML = renderAssignmentDetail(assignments[idx]);
  }
};

// PAGE 11: SCHEDULE CALENDAR
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

window._scheduleYear = null;
window._scheduleMonth = null;
window._selectedDay = null;
window._timeSlots = [
  { date: '2026-05-25', start: '14:00', end: '17:00' },
  { date: '2026-05-27', start: '15:00', end: '18:00' },
  { date: '2026-05-29', start: '13:00', end: '16:00' }
];

function formatTime12(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function buildCalendarHTML(year, month) {
  const today = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  let calendarDays = '';
  for (let i = 0; i < firstDay; i++) {
    calendarDays += '<div class="calendar-day disabled"></div>';
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = i === window._selectedDay && month === window._scheduleMonth && year === window._scheduleYear;
    let cls = 'calendar-day';
    if (isToday && !isSelected) cls += ' today';
    if (isSelected) cls += ' selected';
    calendarDays += `<div class="${cls}" data-day="${i}">${i}</div>`;
  }

  return `
    <div class="calendar-header">
      <h3>${MONTH_NAMES[month]} ${year}</h3>
      <div class="calendar-nav">
        <button type="button" class="btn btn-sm btn-secondary" id="cal-prev-btn">\u2190</button>
        <button type="button" class="btn btn-sm btn-secondary" id="cal-next-btn">\u2192</button>
      </div>
    </div>
    <div class="calendar-grid" id="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
      ${calendarDays}
    </div>
  `;
}

function formatSlotDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  var dayName = DAY_NAMES[d.getDay()].slice(0, 3);
  var monthName = MONTH_NAMES[d.getMonth()].slice(0, 3);
  return dayName + ', ' + monthName + ' ' + d.getDate() + ', ' + d.getFullYear();
}

function getSelectedDateStr() {
  if (window._selectedDay === null) return null;
  var m = String(window._scheduleMonth + 1).padStart(2, '0');
  var d = String(window._selectedDay).padStart(2, '0');
  return window._scheduleYear + '-' + m + '-' + d;
}

function buildTimeSlotsHTML() {
  if (window._timeSlots.length === 0) {
    return '<p class="text-muted">No time slots added yet.</p>';
  }
  return window._timeSlots.map((slot, i) => `
    <div class="availability-item">
      <div class="availability-time">
        <div class="availability-time-badge">${formatSlotDate(slot.date)} ${formatTime12(slot.start)} - ${formatTime12(slot.end)}</div>
      </div>
      <button type="button" class="btn btn-sm btn-danger" data-remove-slot="${i}">Remove</button>
    </div>
  `).join('');
}

function refreshCalendar() {
  const calEl = document.querySelector('.calendar');
  if (!calEl) return;
  calEl.innerHTML = buildCalendarHTML(window._scheduleYear, window._scheduleMonth);
  attachCalendarListeners();
}

function refreshSlots() {
  const listEl = document.querySelector('.availability-list');
  if (!listEl) return;
  listEl.innerHTML = buildTimeSlotsHTML();
  attachSlotListeners();
}

function attachCalendarListeners() {
  var prev = document.getElementById('cal-prev-btn');
  var next = document.getElementById('cal-next-btn');
  if (prev) prev.addEventListener('click', function() {
    window._selectedDay = null;
    window._scheduleMonth--;
    if (window._scheduleMonth < 0) { window._scheduleMonth = 11; window._scheduleYear--; }
    refreshCalendar();
  });
  if (next) next.addEventListener('click', function() {
    window._selectedDay = null;
    window._scheduleMonth++;
    if (window._scheduleMonth > 11) { window._scheduleMonth = 0; window._scheduleYear++; }
    refreshCalendar();
  });

  var grid = document.getElementById('calendar-grid');
  if (grid) grid.addEventListener('click', function(e) {
    var dayEl = e.target.closest('.calendar-day[data-day]');
    if (!dayEl || dayEl.classList.contains('disabled')) return;
    window._selectedDay = parseInt(dayEl.getAttribute('data-day'), 10);
    refreshCalendar();
    var dateLabel = document.getElementById('selectedDateLabel');
    if (dateLabel) dateLabel.textContent = formatSlotDate(getSelectedDateStr());
  });
}

function attachSlotListeners() {
  document.querySelectorAll('[data-remove-slot]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(btn.getAttribute('data-remove-slot'), 10);
      window._timeSlots.splice(idx, 1);
      refreshSlots();
      UI.showAlert('Time slot removed.', 'success');
    });
  });
}

function renderSchedule() {
  if (!appData) {
    console.error('[Schedule] appData not initialized');
    return;
  }
  if (!requireRole(['student', 'tutor', 'admin'])) return;
  const today = new Date();
  window._scheduleYear = today.getFullYear();
  window._scheduleMonth = today.getMonth();
  window._selectedDay = null;

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">My Schedule</h1>

      <div class="grid-2">
        <div>
          <div class="calendar">
            ${buildCalendarHTML(window._scheduleYear, window._scheduleMonth)}
          </div>
        </div>

        <div>
          <div class="card">
            <h3 class="mb-lg">Available Time Slots</h3>
            <div class="availability-list">
              ${buildTimeSlotsHTML()}
            </div>

            <h3 class="mt-lg mb-md">Add Availability</h3>
            <form id="addAvailabilityForm">
              <div class="form-group">
                <label class="switcher-label" style="margin-bottom: 4px; display: block;">Date</label>
                <div id="selectedDateLabel" class="form-input" style="background: var(--color-background); color: var(--color-text-secondary); cursor: default;">Select a date on the calendar \u2190</div>
              </div>
              <div class="form-group">
                <input type="time" id="slotStart" class="form-input" required>
              </div>
              <div class="form-group">
                <input type="time" id="slotEnd" class="form-input" required>
              </div>
              <div class="form-group">
                <label><input type="checkbox"> Recurring Weekly</label>
              </div>
              <button type="submit" class="btn btn-primary btn-block">Add Slot</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);

  attachCalendarListeners();
  attachSlotListeners();

  document.getElementById('addAvailabilityForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    var dateStr = getSelectedDateStr();
    var start = document.getElementById('slotStart').value;
    var end = document.getElementById('slotEnd').value;
    if (!dateStr) {
      UI.showAlert('Please select a date on the calendar first.', 'error');
      return;
    }
    if (!start || !end) return;
    if (start >= end) {
      UI.showAlert('End time must be after start time.', 'error');
      return;
    }
    window._timeSlots.push({ date: dateStr, start: start, end: end });
    refreshSlots();
    UI.showAlert('Time slot added successfully!', 'success');
    document.getElementById('slotStart').value = '';
    document.getElementById('slotEnd').value = '';
  });
}

// PAGE 12: LEADERBOARD
function renderLeaderboard() {
  if (!appData) {
    console.error('[Leaderboard] appData not initialized');
    return;
  }
  const leaderboard = appData.getLeaderboard();

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Leaderboard</h1>

      <div class="grid-4">
        <div class="leaderboard-stat">
          <div class="leaderboard-stat-value">#2</div>
          <div class="leaderboard-stat-label">Your Rank</div>
        </div>
        <div class="leaderboard-stat">
          <div class="leaderboard-stat-value">2,320</div>
          <div class="leaderboard-stat-label">Total XP</div>
        </div>
        <div class="leaderboard-stat">
          <div class="leaderboard-stat-value">🔥 12</div>
          <div class="leaderboard-stat-label">Daily Streak</div>
        </div>
        <div class="leaderboard-stat">
          <div class="leaderboard-stat-value">Level 8</div>
          <div class="leaderboard-stat-label">Level</div>
        </div>
      </div>

      <div style="margin-top: 2rem; margin-bottom: 1rem;">
        <div class="progress-bar" style="margin-bottom: 0.5rem; background: var(--color-muted); border-radius: 10px; height: 12px; overflow: hidden;">
          <div class="progress-fill" style="width: 75%; background: var(--color-primary); height: 100%;"></div>
        </div>
        <p class="text-sm text-muted">Next level: 180 points remaining</p>
      </div>

      <div class="tab-container">
        <button class="tab active" onclick="switchLeaderboardTab(0)">Student Leaderboard</button>
        <button class="tab" onclick="switchLeaderboardTab(1)">Tutor Leaderboard</button>
      </div>

      <div id="studentTab" class="tab-content active">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Points</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            ${leaderboard.students.map(student => `
              <tr>
                <td><span class="leaderboard-rank leaderboard-rank-${student.rank}">${student.rank}</span></td>
                <td>${sanitize(student.name)}</td>
                <td><strong>${sanitize(student.points)}</strong></td>
                <td>🔥 ${sanitize(student.streak)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div id="tutorTab" class="tab-content">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Points</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            ${leaderboard.tutors.map(tutor => `
              <tr>
                <td><span class="leaderboard-rank leaderboard-rank-${tutor.rank}">${tutor.rank}</span></td>
                <td>${sanitize(tutor.name)}</td>
                <td><strong>${sanitize(tutor.points)}</strong></td>
                <td>🔥 ${sanitize(tutor.streak)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 3rem;">
        <h2 class="mb-lg">Badges & Achievements</h2>
        <div class="badges-grid">
          <div class="badge-item earned">
            <div class="badge-emoji">📚</div>
            <div class="badge-name">Book Worm</div>
            <div class="badge-description">Complete 10 sessions</div>
            <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #10B981; font-weight: 700;">✓ Earned</div>
          </div>
          <div class="badge-item earned">
            <div class="badge-emoji">⚡</div>
            <div class="badge-name">Quick Learner</div>
            <div class="badge-description">Complete 5 assignments in a week</div>
            <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #10B981; font-weight: 700;">✓ Earned</div>
          </div>
          <div class="badge-item">
            <div class="badge-emoji">🏆</div>
            <div class="badge-name">Top Performer</div>
            <div class="badge-description">Reach top 10 in leaderboard</div>
          </div>
          <div class="badge-item">
            <div class="badge-emoji">💯</div>
            <div class="badge-name">Perfect Score</div>
            <div class="badge-description">Get 100% on 3 assignments</div>
          </div>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);
}

window.switchLeaderboardTab = (tabIndex) => {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach((t, i) => t.classList.toggle('active', i === tabIndex));
  contents.forEach((c, i) => c.classList.toggle('active', i === tabIndex));
};



// PAGE 17: ADMIN DASHBOARD
async function renderAdminDashboard() {
  if (!appData) {
    console.error('[AdminDashboard] appData not initialized');
    return;
  }
  const user = appData.getCurrentUser();
  if (!isAdmin(user)) {
    UI.showAlert('Access Denied. Admin privilege required.', 'danger');
    router.navigate('/');
    return;
  }

  const tutorApplications = await appData.getTutorApplications() || [];
  const pendingApps = tutorApplications.filter(a => a.status === 'pending');
  const students = await appData.getStudents() || [];
  const tutors = await appData.getTutors() || [];
  const bookings = await appData.getBookings() || [];

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Admin Dashboard</h1>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">👥</div>
          <div class="kpi-content">
            <h3>${students.length + tutors.length}</h3>
            <div class="kpi-label">Total Users</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">👨‍🏫</div>
          <div class="kpi-content">
            <h3>${tutors.length}</h3>
            <div class="kpi-label">Active Tutors</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📚</div>
          <div class="kpi-content">
            <h3>${bookings.length}</h3>
            <div class="kpi-label">Total Bookings</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">👨‍🎓</div>
          <div class="kpi-content">
            <h3>${students.length}</h3>
            <div class="kpi-label">Total Students</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⭐</div>
          <div class="kpi-content">
            <h3>${tutors.length > 0 ? (tutors.reduce((sum, t) => sum + (t.rating || 0), 0) / tutors.length).toFixed(1) : '0.0'}</h3>
            <div class="kpi-label">Avg Rating</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📋</div>
          <div class="kpi-content">
            <h3>${pendingApps.length}</h3>
            <div class="kpi-label">Pending Approvals</div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="mb-lg">Recent Bookings</h3>
          <div>
            ${bookings.length > 0 ? bookings.slice(0, 3).map(booking => `
              <div class="session-item" style="margin-bottom: 1rem;">
                <div class="session-info">
                  <div class="session-title">${booking.subject} Session - ${booking.student?.name || 'Student'} & ${booking.tutor?.name || 'Tutor'}</div>
                  <div class="session-meta"><span>${new Date(booking.created_at).toLocaleDateString()}</span></div>
                </div>
                <div>${UI.getStatusBadge(booking.status)}</div>
              </div>
            `).join('') : '<p class="text-muted">No bookings yet</p>'}
          </div>
        </div>

        <div class="card">
          <h3 class="mb-lg">Pending Tutor Approvals</h3>
          <div>
            ${pendingApps.length > 0 ? pendingApps.slice(0, 2).map(app => `
              <div class="approval-card" style="flex-direction: column; align-items: flex-start; margin-bottom: 1rem;">
                <div style="width: 100%;">
                  <div class="approval-name" style="font-weight: 700;">${sanitize(app.name)}</div>
                  <div class="approval-email text-muted" style="font-size: 0.85rem;">${sanitize(app.email)}</div>
                  <div class="approval-subjects" style="margin-top: 0.5rem;">
                    ${app.subjects.map(s => `<span class="subject-tag">${sanitize(s)}</span>`).join('')}
                  </div>
                </div>
                <div class="approval-actions" style="width: 100%; margin-top: 1rem; display: flex; gap: 0.5rem;">
                  <button class="btn btn-sm btn-success" onclick="approveApplicationDashboard('${app.id}')">Approve</button>
                  <button class="btn btn-sm btn-danger" onclick="rejectApplicationDashboard('${app.id}')">Reject</button>
                </div>
              </div>
            `).join('') : '<p class="text-muted">No pending tutor approvals</p>'}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 2rem;">
        <h3 class="mb-lg">All Students (${students.length})</h3>
        <div>
          ${students.length > 0 ? students.map(student => `
            <div class="session-item" style="margin-bottom: 1rem;">
              <div class="session-info">
                <div class="session-title">${sanitize(student.name || 'Unnamed')}</div>
                <div class="session-meta">
                  <span>${sanitize(student.email || '—')}</span>
                  ${student.gradeLevel ? `<span class="badge badge-secondary">${sanitize(student.gradeLevel)}</span>` : ''}
                </div>
              </div>
              <button class="btn btn-sm btn-outline" onclick="router.navigate('/admin/manage-students')">Manage</button>
            </div>
          `).join('') : '<p class="text-muted">No students yet</p>'}
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);
}

window.approveApplicationDashboard = async (appId) => {
  const result = await appData.approveTutorApplication(appId);
  if (result?.success) {
    UI.showAlert('Application approved! Tutor added to platform.', 'success');
  } else {
    UI.showAlert('Error approving application: ' + (result?.error || 'Unknown error'), 'danger');
  }
  await renderAdminDashboard();
};

window.rejectApplicationDashboard = async (appId) => {
  const result = await appData.rejectTutorApplication(appId);
  if (result) {
    UI.showAlert('Application rejected successfully.', 'warning');
  } else {
    UI.showAlert('Error rejecting application.', 'danger');
  }
  await renderAdminDashboard();
};

// PAGE 18: ADMIN ANALYTICS
function renderAdminAnalytics() {
  if (!appData) {
    console.error('[AdminAnalytics] appData not initialized');
    return;
  }
  const user = appData.getCurrentUser();
  if (!isAdmin(user)) {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Platform Analytics</h1>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">👥</div>
          <div class="kpi-content"><h3>1,250</h3><div class="kpi-label">Total Users</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">👨‍🏫</div>
          <div class="kpi-content"><h3>450</h3><div class="kpi-label">Active Tutors</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">💬</div>
          <div class="kpi-content"><h3>12.5K</h3><div class="kpi-label">Messages Sent</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📈</div>
          <div class="kpi-content"><h3>+18%</h3><div class="kpi-label">Growth Rate</div></div>
        </div>
      </div>

      <div class="grid-2 mt-2xl">
        <div class="card">
          <h3 class="mb-lg">Weekly Bookings Trend</h3>
          <div class="bar-chart">
            <div class="bar-item"><div class="bar" style="height: 60%; background: var(--color-primary);"></div><div class="bar-label">Wk 1</div></div>
            <div class="bar-item"><div class="bar" style="height: 75%; background: var(--color-primary);"></div><div class="bar-label">Wk 2</div></div>
            <div class="bar-item"><div class="bar" style="height: 85%; background: var(--color-primary);"></div><div class="bar-label">Wk 3</div></div>
            <div class="bar-item"><div class="bar" style="height: 90%; background: var(--color-primary);"></div><div class="bar-label">Wk 4</div></div>
            <div class="bar-item"><div class="bar" style="height: 95%; background: var(--color-primary);"></div><div class="bar-label">Wk 5</div></div>
          </div>
        </div>

        <div class="card">
          <h3 class="mb-lg">Monthly User Growth</h3>
          <div class="bar-chart">
            <div class="bar-item"><div class="bar" style="height: 40%; background: var(--color-primary);"></div><div class="bar-label">Jan</div></div>
            <div class="bar-item"><div class="bar" style="height: 55%; background: var(--color-primary);"></div><div class="bar-label">Feb</div></div>
            <div class="bar-item"><div class="bar" style="height: 70%; background: var(--color-primary);"></div><div class="bar-label">Mar</div></div>
            <div class="bar-item"><div class="bar" style="height: 85%; background: var(--color-primary);"></div><div class="bar-label">Apr</div></div>
            <div class="bar-item"><div class="bar" style="height: 100%; background: var(--color-primary);"></div><div class="bar-label">May</div></div>
          </div>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);
}

// PAGE 19: ADMIN APPROVALS (Sessions + Tutor Applications)
async function renderAdminApprovals() {
  if (!appData) { console.error('[AdminApprovals] appData not initialized'); return; }
  const user = appData.getCurrentUser();
  if (!isAdmin(user)) {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const [apps, allBookings] = await Promise.all([
    appData.getTutorApplications(),
    appData.getBookings()
  ]);
  const pendingApps = (apps || []).filter(a => a.status === 'pending');
  const pendingBookings = (allBookings || []).filter(b => b.status === 'pending');

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <div class="page-header-banner" style="margin-bottom: 2rem;">
        <div style="position: relative; z-index: 1;">
          <h1>Approvals</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 0;">Review and approve session requests and tutor applications</p>
        </div>
      </div>

      <!-- PENDING SESSION BOOKINGS -->
      <div class="card" style="margin-bottom: 2rem;">
        <h2 style="margin-bottom: 1.5rem; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="width:10px;height:10px;background:var(--gradient-amber, linear-gradient(135deg,#d97706,#f59e0b));border-radius:50%;display:inline-block;"></span>
          Pending Session Requests <span class="badge badge-warning" style="margin-left: 0.5rem;">${pendingBookings.length}</span>
        </h2>
        ${pendingBookings.length > 0 ? pendingBookings.map(b => `
          <div class="session-item" style="margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
            <div style="flex: 1; min-width: 200px;">
              <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.4rem;">${sanitize(b.subject || 'Session')}</div>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem; font-size: 0.9rem;">
                <span>👨‍🎓 <strong>${b.student?.name || sanitize(b.student_id || 'Student')}</strong></span>
                <span>•</span>
                <span>👩‍🏫 <strong>${b.tutor?.name || sanitize(b.tutor_id || 'Tutor')}</strong></span>
              </div>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary);">
                📅 ${b.scheduled_at ? new Date(b.scheduled_at).toLocaleString() : 'Time not set'}
                ${b.duration ? ` • ⏱ ${b.duration} min` : ''}
              </div>
              ${b.notes ? `<p style="margin: 0.4rem 0 0; font-size: 0.85rem; color: var(--color-text-secondary);">${sanitize(b.notes)}</p>` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem; flex-direction: column; min-width: 120px;">
              <button class="btn btn-sm btn-success" onclick="approveBookingRequest('${b.id}')">✓ Approve</button>
              <button class="btn btn-sm btn-danger" onclick="rejectBookingRequest('${b.id}')">✕ Reject</button>
            </div>
          </div>
        `).join('') : '<p class="text-muted" style="padding: 1rem 0;">No pending session requests.</p>'}
      </div>

      <!-- TUTOR APPLICATIONS -->
      <div class="card">
        <h2 style="margin-bottom: 1.5rem; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="width:10px;height:10px;background:linear-gradient(135deg,#8a307f,#a855a0);border-radius:50%;display:inline-block;"></span>
          Tutor Applications <span class="badge badge-primary" style="margin-left: 0.5rem;">${pendingApps.length}</span>
        </h2>
        <div class="grid-2">
          <div>
            ${pendingApps.length > 0 ? pendingApps.map((app, idx) => `
              <div class="approval-card card mb-md" onclick="selectApplication(${idx})" style="cursor: pointer; padding: 1rem; margin-bottom: 0.75rem;">
                <div class="approval-name" style="font-weight: 700;">${sanitize(app.name)}</div>
                <div class="approval-email text-muted" style="font-size: 0.85rem;">${sanitize(app.email)}</div>
                <div style="margin-top: 0.5rem;">${UI.getStatusBadge(app.status)}</div>
              </div>
            `).join('') : '<p class="text-muted">No pending tutor applications.</p>'}
          </div>
          <div id="appDetail" class="card">
            <div class="assignment-detail-empty"><p>Select an application to view details</p></div>
          </div>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);

  window.selectApplication = (idx) => {
    const app = pendingApps[idx];
    if (!app) return;
    const detail = document.getElementById('appDetail');
    if (!detail) return;
    detail.innerHTML = `
      <h2>${sanitize(app.name)}</h2>
      <div style="margin: 1.5rem 0; line-height: 1.8;">
        <p><strong>Email:</strong> ${sanitize(app.email)}</p>
        <p><strong>Experience:</strong> ${sanitize(app.experience)}</p>
        <p><strong>Qualifications:</strong> ${sanitize(app.qualifications)}</p>
      </div>
      <div style="margin: 1.5rem 0;">
        <strong>Subjects:</strong>
        <div style="margin-top: 0.5rem;">${(app.subjects || []).map(s => `<span class="subject-tag">${sanitize(s)}</span>`).join('')}</div>
      </div>
      <div style="margin: 1.5rem 0;">
        <strong>Bio Statement:</strong>
        <p>${sanitize(app.bio)}</p>
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-success" style="flex: 1;" onclick="approveApplication('${app.id}')">Approve</button>
        <button class="btn btn-danger" style="flex: 1;" onclick="rejectApplication('${app.id}')">Reject</button>
      </div>
    `;
  };
}

window.approveBookingRequest = async (bookingId) => {
  const result = await appData.updateBookingStatus(bookingId, 'confirmed');
  if (result) { UI.showAlert('Session approved! Both parties notified.', 'success'); await renderAdminApprovals(); }
  else UI.showAlert('Failed to approve session.', 'danger');
};

window.rejectBookingRequest = async (bookingId) => {
  if (confirm('Reject this session request?')) {
    const result = await appData.updateBookingStatus(bookingId, 'cancelled');
    if (result) { UI.showAlert('Session rejected.', 'warning'); await renderAdminApprovals(); }
    else UI.showAlert('Failed to reject session.', 'danger');
  }
};

window.approveApplication = async (appId) => {
  const result = await appData.approveTutorApplication(appId);
  if (result?.success) { UI.showAlert('Application approved!', 'success'); }
  else { UI.showAlert('Error approving: ' + (result?.error || 'Unknown'), 'danger'); }
  await renderAdminApprovals();
};

window.rejectApplication = async (appId) => {
  const result = await appData.rejectTutorApplication(appId);
  if (result) { UI.showAlert('Application rejected.', 'warning'); }
  else { UI.showAlert('Error rejecting application.', 'danger'); }
  await renderAdminApprovals();
};

// PAGE 20: ADMIN SESSIONS
async function renderAdminSessions() {
  if (!appData) {
    console.error('[AdminSessions] appData not initialized');
    return;
  }
  const user = appData.getCurrentUser();
  if (!isAdmin(user)) {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const bookings = await appData.getBookings() || [];
  const students = await appData.getStudents() || [];
  const tutors = await appData.getTutors() || [];

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Manage Sessions</h1>

      <div class="card" style="margin-bottom: 2rem;">
        <h3 class="mb-lg">Create New Session</h3>
        <form id="createSessionForm">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Student</label>
              <select class="form-input" id="sessionStudent" required>
                <option value="">Select Student</option>
                ${students.map(s => `<option value="${s.id}">${sanitize(s.name)} (${sanitize(s.email)})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tutor</label>
              <select class="form-input" id="sessionTutor" required>
                <option value="">Select Tutor</option>
                ${tutors.map(t => `<option value="${t.id}">${sanitize(t.name)} (${sanitize(t.email)})</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Subject</label>
              <input type="text" class="form-input" id="sessionSubject" placeholder="e.g., Math, Science" required>
            </div>
            <div class="form-group">
              <label class="form-label">Duration (minutes)</label>
              <input type="number" class="form-input" id="sessionDuration" value="60" min="30" step="30" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Scheduled Date & Time</label>
            <input type="datetime-local" class="form-input" id="sessionDateTime" required>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" id="sessionNotes" rows="3" placeholder="Any additional notes..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Create Session</button>
        </form>
      </div>

      <div class="card">
        <h3 class="mb-lg">All Sessions (${bookings.length})</h3>
        ${bookings.length > 0 ? bookings.map(booking => `
          <div class="session-item" style="margin-bottom: 1rem;">
            <div class="session-info">
              <div class="session-title">${sanitize(booking.subject)} - ${booking.student?.name || 'Student'} & ${booking.tutor?.name || 'Tutor'}</div>
              <div class="session-meta">
                <span>${new Date(booking.scheduled_at).toLocaleString()}</span>
                <span>${booking.duration} min</span>
              </div>
              ${booking.notes ? `<p class="text-muted" style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">${sanitize(booking.notes)}</p>` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem; flex-direction: column;">
              <div>${UI.getStatusBadge(booking.status)}</div>
              <button class="btn btn-sm btn-outline" onclick="editSessionAdmin('${booking.id}')">✏️ Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteSessionAdmin('${booking.id}')">🗑 Delete</button>
              ${booking.status === 'pending' ? `
                <button class="btn btn-sm btn-success" onclick="approveSession('${booking.id}')">✓ Approve</button>
              ` : ''}
            </div>
          </div>
        `).join('') : '<p class="text-muted">No sessions yet</p>'}
      </div>
    </div>
  `;
  UI.setContent(html);

  document.getElementById('createSessionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('sessionStudent').value;
    const tutorId = document.getElementById('sessionTutor').value;
    const subject = document.getElementById('sessionSubject').value;
    const duration = parseInt(document.getElementById('sessionDuration').value);
    const scheduledAt = document.getElementById('sessionDateTime').value;
    const notes = document.getElementById('sessionNotes').value;

    const booking = {
      student_id: studentId,
      tutor_id: tutorId,
      subject,
      duration,
      scheduled_at: new Date(scheduledAt).toISOString(),
      notes,
      status: 'pending'
    };

    const result = await appData.addBooking(booking);
    if (result) {
      UI.showAlert('Session created successfully! Waiting for admin approval.', 'success');
      renderAdminSessions();
    } else {
      UI.showAlert('Failed to create session.', 'danger');
    }
  });
}

window.approveSession = async (bookingId) => {
  const result = await appData.updateBookingStatus(bookingId, 'confirmed');
  if (result) {
    UI.showAlert('Session approved! Student and tutor have been notified.', 'success');
    renderAdminSessions();
  } else {
    UI.showAlert('Failed to approve session.', 'danger');
  }
};


window.editSessionAdmin = async (bookingId) => {
  const bookings = await appData.getBookings() || [];
  const b = bookings.find(x => x.id === bookingId);
  if (!b) return;
  const students = await appData.getStudents() || [];
  const tutors = await appData.getTutors() || [];
  const scheduledVal = b.scheduled_at ? new Date(b.scheduled_at).toISOString().slice(0,16) : '';
  const html = `
    <form id="editSessionAdminForm">
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Student</label>
          <select class="form-input" id="eSStudent">
            ${students.map(s => `<option value="${s.id}" ${s.id === (b.student_id||b.studentId) ? 'selected' : ''}>${sanitize(s.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tutor</label>
          <select class="form-input" id="eSTutor">
            ${tutors.map(t => `<option value="${t.id}" ${t.id === (b.tutor_id||b.tutorId) ? 'selected' : ''}>${sanitize(t.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Subject</label>
          <input type="text" class="form-input" id="eSSubject" value="${sanitize(b.subject||'')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Duration (min)</label>
          <input type="number" class="form-input" id="eSDuration" value="${b.duration||60}" min="30" step="30">
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Scheduled At</label>
          <input type="datetime-local" class="form-input" id="eSDateTime" value="${scheduledVal}">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-input" id="eSStatus">
            <option value="pending" ${b.status==='pending'?'selected':''}>Pending</option>
            <option value="confirmed" ${b.status==='confirmed'?'selected':''}>Confirmed</option>
            <option value="completed" ${b.status==='completed'?'selected':''}>Completed</option>
            <option value="cancelled" ${b.status==='cancelled'?'selected':''}>Cancelled</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="eSNotes" rows="2">${sanitize(b.notes||'')}</textarea>
      </div>
      <button type="submit" class="btn btn-primary">Save Changes</button>
    </form>
  `;
  const modal = UI.showModal(html, 'Edit Session');
  document.getElementById('editSessionAdminForm')?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const updates = {
      student_id: document.getElementById('eSStudent').value,
      tutor_id: document.getElementById('eSTutor').value,
      subject: document.getElementById('eSSubject').value,
      duration: parseInt(document.getElementById('eSDuration').value),
      scheduled_at: new Date(document.getElementById('eSDateTime').value).toISOString(),
      status: document.getElementById('eSStatus').value,
      notes: document.getElementById('eSNotes').value
    };
    const result = await appData.updateBooking(bookingId, updates);
    if (result) { UI.showAlert('Session updated!', 'success'); modal.remove(); await renderAdminSessions(); }
    else UI.showAlert('Failed to update session.', 'danger');
  });
};

window.deleteSessionAdmin = async (bookingId) => {
  if (confirm('Permanently delete this session?')) {
    const result = await appData.deleteBooking(bookingId);
    if (result?.success) { UI.showAlert('Session deleted.', 'success'); await renderAdminSessions(); }
    else UI.showAlert('Failed to delete session.', 'danger');
  }
};

window.cancelSession = async (bookingId) => {
  if (confirm('Are you sure you want to cancel this session?')) {
    const result = await appData.updateBookingStatus(bookingId, 'cancelled');
    if (result) {
      UI.showAlert('Session cancelled! Student and tutor have been notified.', 'warning');
      renderAdminSessions();
    } else {
      UI.showAlert('Failed to cancel session.', 'danger');
    }
  }
};

// PAGE 21: ADMIN ANNOUNCEMENTS & POSTS
async function renderAdminAnnouncements() {
  if (!appData) {
    console.error('[AdminAnnouncements] appData not initialized');
    return;
  }
  const user = appData.getCurrentUser();
  if (!isAdmin(user)) {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const announcements = await appData.getAllAnnouncements() || [];
  const posts = await appData.getAllPosts() || [];

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Announcements & Posts</h1>

      <div class="tabs" style="margin-bottom: 2rem;">
        <button class="tab active" onclick="switchAnnouncementTab(0)">Announcements</button>
        <button class="tab" onclick="switchAnnouncementTab(1)">Posts</button>
      </div>

      <!-- Announcements Tab -->
      <div class="tab-content active" id="announcements-tab">
        <div class="card" style="margin-bottom: 2rem;">
          <h3 class="mb-lg">Create Announcement</h3>
          <form id="announcementForm">
            <div class="form-group">
              <label class="form-label">Title</label>
              <input type="text" class="form-input" id="announcementTitle" required>
            </div>
            <div class="form-group">
              <label class="form-label">Content</label>
              <textarea class="form-textarea" id="announcementContent" rows="4" required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-input" id="announcementPriority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary">Create Announcement</button>
          </form>
        </div>

        <div class="card">
          <h3 class="mb-lg">All Announcements</h3>
          ${announcements.length > 0 ? announcements.map(ann => `
            <div class="session-item" style="margin-bottom: 1rem;">
              <div class="session-info">
                <div class="session-title">${sanitize(ann.title)}</div>
                <div class="session-meta">
                  <span>${new Date(ann.created_at || ann.createdAt).toLocaleDateString()}</span>
                  <span class="badge badge-${ann.priority === 'high' ? 'danger' : ann.priority === 'medium' ? 'warning' : 'success'}">${ann.priority}</span>
                  <span class="badge badge-${ann.isActive ? 'success' : 'secondary'}">${ann.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p class="text-muted" style="margin-top: 0.5rem; font-size: 0.9rem;">${sanitize(ann.content)}</p>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-outline" onclick="editAnnouncement('${ann.id}')">Edit</button>
                <button class="btn btn-sm btn-outline" onclick="toggleAnnouncement('${ann.id}')">${ann.isActive ? 'Deactivate' : 'Activate'}</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAnnouncement('${ann.id}')">Delete</button>
              </div>
            </div>
          `).join('') : '<p class="text-muted">No announcements yet</p>'}
        </div>
      </div>

      <!-- Posts Tab -->
      <div class="tab-content" id="posts-tab">
        <div class="card" style="margin-bottom: 2rem;">
          <h3 class="mb-lg">Create Post</h3>
          <form id="postForm">
            <div class="form-group">
              <label class="form-label">Title</label>
              <input type="text" class="form-input" id="postTitle" required>
            </div>
            <div class="form-group">
              <label class="form-label">Content</label>
              <textarea class="form-textarea" id="postContent" rows="4" required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-input" id="postCategory">
                <option value="Study Tips">Study Tips</option>
                <option value="News">News</option>
                <option value="Events">Events</option>
                <option value="Updates">Updates</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Media (Image, Video, PDF, Document)</label>
              <input type="file" class="form-input" id="postMedia" accept="image/*,video/*,application/pdf,.doc,.docx,.txt">
              <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">Supported formats: Images (JPG, PNG, GIF), Videos (MP4, WebM), PDF, Documents (DOC, DOCX, TXT)</p>
            </div>
            <button type="submit" class="btn btn-primary">Create Post</button>
          </form>
        </div>

        <div class="card">
          <h3 class="mb-lg">All Posts</h3>
          ${posts.length > 0 ? posts.map(post => `
            <div class="session-item" style="margin-bottom: 1rem;">
              <div class="session-info">
                <div class="session-title">${sanitize(post.title)}</div>
                <div class="session-meta">
                  <span>${new Date(post.created_at || post.createdAt).toLocaleDateString()}</span>
                  <span class="badge badge-secondary">${sanitize(post.category)}</span>
                  <span class="badge badge-${post.isActive ? 'success' : 'secondary'}">${post.isActive ? 'Active' : 'Inactive'}</span>
                  ${post.mediaType ? `<span class="badge badge-primary">📎 Media</span>` : ''}
                </div>
                ${post.mediaUrl && post.mediaType ? `
                  <div style="margin-top: 0.5rem;">
                    ${post.mediaType.startsWith('image') ? `<img src="${post.mediaUrl}" alt="Post media" style="max-width: 200px; max-height: 150px; border-radius: var(--radius-md); object-fit: cover;">` : ''}
                    ${post.mediaType.startsWith('video') ? `<video src="${post.mediaUrl}" controls style="max-width: 200px; max-height: 150px; border-radius: var(--radius-md);"></video>` : ''}
                    ${post.mediaType === 'application/pdf' ? `<a href="${post.mediaUrl}" target="_blank" class="btn btn-sm btn-outline">📄 View PDF</a>` : ''}
                    ${post.mediaType.includes('document') || post.mediaType.includes('text') ? `<a href="${post.mediaUrl}" target="_blank" class="btn btn-sm btn-outline">📄 View Document</a>` : ''}
                  </div>
                ` : ''}
                <p class="text-muted" style="margin-top: 0.5rem; font-size: 0.9rem;">${sanitize(post.content)}</p>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-outline" onclick="editPost('${post.id}')">Edit</button>
                <button class="btn btn-sm btn-outline" onclick="togglePost('${post.id}')">${post.isActive ? 'Deactivate' : 'Activate'}</button>
                <button class="btn btn-sm btn-danger" onclick="deletePost('${post.id}')">Delete</button>
              </div>
            </div>
          `).join('') : '<p class="text-muted">No posts yet</p>'}
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);

  document.getElementById('announcementForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const announcement = {
      title: document.getElementById('announcementTitle').value,
      content: document.getElementById('announcementContent').value,
      priority: document.getElementById('announcementPriority').value,
      type: 'announcement',
      createdBy: user.id,
      isActive: true
    };
    await appData.addAnnouncement(announcement);
    UI.showAlert('Announcement created!', 'success');
    await renderAdminAnnouncements();
  });

  document.getElementById('postForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mediaFile = document.getElementById('postMedia').files[0];
    let mediaUrl = null;
    let mediaType = null;

    if (mediaFile) {
      UI.showAlert('Uploading file...', 'success');
      mediaUrl = await uploadToCloudinary(mediaFile, 'Aroosh Online Tutors/posts');
      mediaType = mediaFile.type;
      if (!mediaUrl) { return; } // Upload failed, error shown by uploadToCloudinary
    }

    const post = {
      title: document.getElementById('postTitle').value,
      content: document.getElementById('postContent').value,
      category: document.getElementById('postCategory').value,
      mediaType: mediaType,
      mediaUrl: mediaUrl,
      type: 'post',
      createdBy: user.id,
      isActive: true
    };
    await appData.addPost(post);
    UI.showAlert('Post created!', 'success');
    await renderAdminAnnouncements();
  });
}

window.switchAnnouncementTab = (tabIndex) => {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach((t, i) => t.classList.toggle('active', i === tabIndex));
  contents.forEach((c, i) => c.classList.toggle('active', i === tabIndex));
};

window.toggleAnnouncement = async (id) => {
  const announcements = await appData.getAllAnnouncements() || [];
  const ann = announcements.find(a => a.id === id);
  if (ann) {
    appData.updateAnnouncement(id, { isActive: !ann.isActive });
    UI.showAlert(`Announcement ${ann.isActive ? 'deactivated' : 'activated'}!`, 'success');
    renderAdminAnnouncements();
  }
};

window.deleteAnnouncement = async (id) => {
  if (confirm('Are you sure you want to delete this announcement?')) {
    await appData.deleteAnnouncement(id);
    UI.showAlert('Announcement deleted!', 'success');
    renderAdminAnnouncements();
  }
};

window.editAnnouncement = async (id) => {
  const announcements = await appData.getAllAnnouncements() || [];
  const ann = announcements.find(a => a.id === id);
  if (ann) {
    const html = `
      <div>
        <h3>Edit Announcement</h3>
        <form id="editAnnouncementForm">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" class="form-input" id="editAnnouncementTitle" value="${sanitize(ann.title)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Content</label>
            <textarea class="form-textarea" id="editAnnouncementContent" rows="4" required>${sanitize(ann.content)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-input" id="editAnnouncementPriority">
              <option value="low" ${ann.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${ann.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${ann.priority === 'high' ? 'selected' : ''}>High</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Update Announcement</button>
        </form>
      </div>
    `;
    const modal = UI.showModal(html, 'Edit Announcement');
    document.getElementById('editAnnouncementForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      appData.updateAnnouncement(id, {
        title: document.getElementById('editAnnouncementTitle').value,
        content: document.getElementById('editAnnouncementContent').value,
        priority: document.getElementById('editAnnouncementPriority').value
      });
      UI.showAlert('Announcement updated!', 'success');
      modal.remove();
      renderAdminAnnouncements();
    });
  }
};

window.togglePost = async (id) => {
  const posts = await appData.getAllPosts() || [];
  const post = posts.find(p => p.id === id);
  if (post) {
    appData.updatePost(id, { isActive: !post.isActive });
    UI.showAlert(`Post ${post.isActive ? 'deactivated' : 'activated'}!`, 'success');
    renderAdminAnnouncements();
  }
};

window.deletePost = async (id) => {
  if (confirm('Are you sure you want to delete this post?')) {
    await appData.deletePost(id);
    UI.showAlert('Post deleted!', 'success');
    renderAdminAnnouncements();
  }
};

window.editPost = async (id) => {
  const posts = await appData.getAllPosts() || [];
  const post = posts.find(p => p.id === id);
  if (post) {
    const html = `
      <div>
        <h3>Edit Post</h3>
        <form id="editPostForm">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" class="form-input" id="editPostTitle" value="${sanitize(post.title)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Content</label>
            <textarea class="form-textarea" id="editPostContent" rows="4" required>${sanitize(post.content)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-input" id="editPostCategory">
              <option value="Study Tips" ${post.category === 'Study Tips' ? 'selected' : ''}>Study Tips</option>
              <option value="News" ${post.category === 'News' ? 'selected' : ''}>News</option>
              <option value="Events" ${post.category === 'Events' ? 'selected' : ''}>Events</option>
              <option value="Updates" ${post.category === 'Updates' ? 'selected' : ''}>Updates</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Media (Image, Video, PDF, Document)</label>
            <input type="file" class="form-input" id="editPostMedia" accept="image/*,video/*,application/pdf,.doc,.docx,.txt">
            <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">Leave empty to keep existing media</p>
            ${post.mediaUrl ? `
              <div style="margin-top: 0.5rem;">
                ${post.mediaType.startsWith('image') ? `<img src="${post.mediaUrl}" alt="Current media" style="max-width: 150px; max-height: 100px; border-radius: var(--radius-md); object-fit: cover;">` : ''}
                ${post.mediaType.startsWith('video') ? `<video src="${post.mediaUrl}" controls style="max-width: 150px; max-height: 100px; border-radius: var(--radius-md);"></video>` : ''}
                ${post.mediaType === 'application/pdf' || post.mediaType.includes('document') || post.mediaType.includes('text') ? `<span class="badge badge-secondary">📎 File attached</span>` : ''}
                <button type="button" class="btn btn-sm btn-danger" style="margin-left: 0.5rem;" onclick="removePostMedia('${id}')">Remove</button>
              </div>
            ` : ''}
          </div>
          <button type="submit" class="btn btn-primary">Update Post</button>
        </form>
      </div>
    `;
    const modal = UI.showModal(html, 'Edit Post');
    document.getElementById('editPostForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mediaFile = document.getElementById('editPostMedia').files[0];
      let mediaUrl = post.mediaUrl;
      let mediaType = post.mediaType;

      if (mediaFile) {
        mediaUrl = await uploadToCloudinary(mediaFile, 'Aroosh Online Tutors/posts');
        mediaType = mediaFile.type;
        if (!mediaUrl) { return; }
      }

      appData.updatePost(id, {
        title: document.getElementById('editPostTitle').value,
        content: document.getElementById('editPostContent').value,
        category: document.getElementById('editPostCategory').value,
        mediaType: mediaType,
        mediaUrl: mediaUrl
      });
      UI.showAlert('Post updated!', 'success');
      modal.remove();
      renderAdminAnnouncements();
    });
  }
};

window.removePostMedia = async (id) => {
  await appData.updatePost(id, { mediaType: null, mediaUrl: null });
  UI.showAlert('Media removed!', 'success');
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
  renderAdminAnnouncements();
};

// PAGE 22: ADMIN FEEDBACK
async function renderAdminFeedback() {
  if (!appData) {
    console.error('[AdminFeedback] appData not initialized');
    return;
  }
  const user = appData.getCurrentUser();
  if (!isAdmin(user)) {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const feedback = await appData.getFeedback() || [];

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">User Feedback</h1>

      <div class="card">
        <h3 class="mb-lg">All Feedback</h3>
        ${feedback.length > 0 ? feedback.map(fb => `
          <div class="session-item" style="margin-bottom: 1rem;">
            <div class="session-info">
              <div class="session-title">${sanitize(fb.subject)}</div>
              <div class="session-meta">
                <span>${sanitize(fb.userName)}</span>
                <span>${new Date(fb.created_at || fb.createdAt).toLocaleDateString()}</span>
                <span class="badge badge-${fb.type === 'bug' ? 'danger' : 'secondary'}">${fb.type}</span>
                <span class="badge badge-${fb.status === 'pending' ? 'warning' : fb.status === 'resolved' ? 'success' : 'secondary'}">${fb.status}</span>
              </div>
              <p class="text-muted" style="margin-top: 0.5rem; font-size: 0.9rem;">${sanitize(fb.message)}</p>
              ${fb.response ? `<div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--color-surface); border-radius: var(--radius-sm);"><strong>Response:</strong> ${sanitize(fb.response)}</div>` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem; flex-direction: column;">
              ${fb.status === 'pending' ? `
                <button class="btn btn-sm btn-primary" onclick="respondToFeedback('${fb.id}')">Respond</button>
                <button class="btn btn-sm btn-success" onclick="resolveFeedback('${fb.id}')">Mark Resolved</button>
              ` : ''}
              <button class="btn btn-sm btn-danger" onclick="deleteFeedback('${fb.id}')">Delete</button>
            </div>
          </div>
        `).join('') : '<p class="text-muted">No feedback yet</p>'}
      </div>
    </div>
  `;
  UI.setContent(html);
}

window.respondToFeedback = async (id) => {
  const feedback = await appData.getFeedback() || [];
  const fb = feedback.find(f => f.id === id);
  if (fb) {
    const html = `
      <div>
        <h3>Respond to Feedback</h3>
        <p class="text-muted mb-lg">${sanitize(fb.message)}</p>
        <form id="feedbackResponseForm">
          <div class="form-group">
            <label class="form-label">Response</label>
            <textarea class="form-textarea" id="feedbackResponse" rows="4" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Send Response</button>
        </form>
      </div>
    `;
    const modal = UI.showModal(html, 'Respond to Feedback');
    document.getElementById('feedbackResponseForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await appData.updateFeedbackStatus(id, 'resolved', document.getElementById('feedbackResponse').value);
      UI.showAlert('Response sent!', 'success');
      modal.remove();
      await renderAdminFeedback();
    });
  }
};

window.resolveFeedback = async (id) => {
  await appData.updateFeedbackStatus(id, 'resolved');
  UI.showAlert('Feedback marked as resolved!', 'success');
  renderAdminFeedback();
};

window.deleteFeedback = async (id) => {
  if (confirm('Are you sure you want to delete this feedback?')) {
    await appData.deleteFeedback(id);
    UI.showAlert('Feedback deleted!', 'success');
    renderAdminFeedback();
  }
};

// PAGE 23: ADMIN MANAGE TUTORS
async function renderAdminManageTutors() {
  if (!appData) {
    console.error('[AdminManageTutors] appData not initialized');
    return;
  }
  const user = appData.getCurrentUser();
  if (!isAdmin(user)) {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const tutors = await appData.getTutors() || [];

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Manage Tutors</h1>

      <div class="card" style="margin-bottom: 2rem;">
        <h3 class="mb-lg">Add New Tutor</h3>
        <form id="addTutorForm">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" id="tutorName" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="tutorEmail" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea class="form-textarea" id="tutorBio" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Qualifications</label>
            <input type="text" class="form-input" id="tutorQualifications" required>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Years of Experience</label>
              <input type="number" class="form-input" id="tutorExperience" required>
            </div>
            <div class="form-group">
              <label class="form-label">Experience Level</label>
              <select class="form-input" id="tutorLevel">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Subjects (comma separated)</label>
            <input type="text" class="form-input" id="tutorSubjects" placeholder="Math, Science, Physics" required>
          </div>
          <button type="submit" class="btn btn-primary">Add Tutor</button>
        </form>
      </div>

      <div class="card">
        <h3 class="mb-lg">All Tutors</h3>
        ${tutors.length > 0 ? tutors.map(tutor => `
          <div class="session-item" style="margin-bottom: 1rem;">
            <div class="session-info">
              <div class="session-title">${sanitize(tutor.name)}</div>
              <div class="session-meta">
                <span>${sanitize(tutor.email)}</span>
                <span class="badge badge-secondary">${tutor.experienceLevel}</span>
                <span class="badge badge-${(tutor.is_available ?? tutor.isAvailable ?? true) ? 'success' : 'danger'}">${(tutor.is_available ?? tutor.isAvailable ?? true) ? 'Available' : 'Unavailable'}</span>
              </div>
              <p class="text-muted" style="margin-top: 0.5rem; font-size: 0.9rem;">${sanitize(tutor.bio)}</p>
              <div style="margin-top: 0.5rem;">
                ${tutor.subjects.map(s => `<span class="subject-tag">${sanitize(s)}</span>`).join('')}
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-direction: column;">
              <button class="btn btn-sm btn-outline" onclick="editTutor('${tutor.id}')">Edit</button>
              <button class="btn btn-sm btn-outline" onclick="toggleTutorAvailability('${tutor.id}')">${(tutor.is_available ?? tutor.isAvailable ?? true) ? 'Set Unavailable' : 'Set Available'}</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUser('${tutor.id}')">Delete</button>
            </div>
          </div>
        `).join('') : '<p class="text-muted">No tutors yet</p>'}
      </div>
    </div>
  `;
  UI.setContent(html);

  document.getElementById('addTutorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const tutor = {
        name: document.getElementById('tutorName').value,
        email: document.getElementById('tutorEmail').value,
        bio: document.getElementById('tutorBio').value,
        qualifications: document.getElementById('tutorQualifications').value,
        yearsOfExperience: parseInt(document.getElementById('tutorExperience').value),
        experienceLevel: document.getElementById('tutorLevel').value,
        subjects: document.getElementById('tutorSubjects').value.split(',').map(s => s.trim()),
        role: 'tutor',
        avatar: '👨‍🏫',
        rating: 5.0,
        totalReviews: 0,
        isAvailable: true,
        availability: []
      };
      const result = await appData.addUser(tutor);
      if (result) {
        UI.showAlert('Tutor added successfully!', 'success');
        await renderAdminManageTutors();
      } else {
        UI.showAlert('Error adding tutor. Please try again.', 'danger');
      }
    } catch (error) {
      console.error('Error in addTutorForm:', error);
      UI.showAlert('Error: ' + error.message, 'danger');
    }
  });
}

window.editTutor = async (id) => {
  const tutor = await appData.getTutorById(id);
  if (tutor) {
    const html = `
      <div>
        <h3>Edit Tutor</h3>
        <form id="editTutorForm">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" id="editTutorName" value="${sanitize(tutor.name)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="editTutorEmail" value="${sanitize(tutor.email)}" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea class="form-textarea" id="editTutorBio" rows="3" required>${sanitize(tutor.bio)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Qualifications</label>
            <input type="text" class="form-input" id="editTutorQualifications" value="${sanitize(tutor.qualifications)}" required>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Years of Experience</label>
              <input type="number" class="form-input" id="editTutorExperience" value="${(tutor.years_of_experience ?? tutor.yearsOfExperience ?? 0)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Experience Level</label>
              <select class="form-input" id="editTutorLevel">
                <option value="Beginner" ${tutor.experienceLevel === 'Beginner' ? 'selected' : ''}>Beginner</option>
                <option value="Intermediate" ${tutor.experienceLevel === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                <option value="Expert" ${tutor.experienceLevel === 'Expert' ? 'selected' : ''}>Expert</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Subjects (comma separated)</label>
            <input type="text" class="form-input" id="editTutorSubjects" value="${tutor.subjects.join(', ')}" required>
          </div>
          <button type="submit" class="btn btn-primary">Update Tutor</button>
        </form>
      </div>
    `;
    const modal = UI.showModal(html, 'Edit Tutor');
    document.getElementById('editTutorForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const result = await appData.updateUser(id, {
          name: document.getElementById('editTutorName').value,
          email: document.getElementById('editTutorEmail').value,
          bio: document.getElementById('editTutorBio').value,
          qualifications: document.getElementById('editTutorQualifications').value,
          yearsOfExperience: parseInt(document.getElementById('editTutorExperience').value),
          experienceLevel: document.getElementById('editTutorLevel').value,
          subjects: document.getElementById('editTutorSubjects').value.split(',').map(s => s.trim())
        });
        if (result) {
          UI.showAlert('Tutor updated successfully!', 'success');
          modal.remove();
          await renderAdminManageTutors();
        } else {
          UI.showAlert('Error updating tutor.', 'danger');
        }
      } catch (error) {
        console.error('Error updating tutor:', error);
        UI.showAlert('Error: ' + error.message, 'danger');
      }
    });
  }
};

window.toggleTutorAvailability = async (id) => {
  try {
    const tutor = await appData.getTutorById(id);
    if (tutor) {
      const result = await appData.updateUser(id, { isAvailable: !(tutor.is_available ?? tutor.isAvailable ?? true) });
      if (result) {
        UI.showAlert(`Tutor ${(tutor.is_available ?? tutor.isAvailable ?? true) ? 'set to unavailable' : 'set to available'}!`, 'success');
        await renderAdminManageTutors();
      } else {
        UI.showAlert('Error updating tutor availability.', 'danger');
      }
    }
  } catch (error) {
    console.error('Error toggling tutor availability:', error);
    UI.showAlert('Error: ' + error.message, 'danger');
  }
};

window.deleteUser = async (id) => {
  if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    try {
      const deletedUser = appData.getUsers().find(u => u.id === id);
      const result = await appData.deleteUser(id);
      if (result) {
        UI.showAlert('User deleted successfully!', 'success');
        if (deletedUser?.role === 'student') {
          await renderAdminManageStudents();
        } else {
          await renderAdminManageTutors();
        }
      } else {
        UI.showAlert('Error deleting user.', 'danger');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      UI.showAlert('Error: ' + error.message, 'danger');
    }
  }
};

// PAGE 24: ADMIN MANAGE STUDENTS
async function renderAdminManageStudents() {
  if (!appData) {
    console.error('[AdminManageStudents] appData not initialized');
    return;
  }
  const user = appData.getCurrentUser();
  if (!isAdmin(user)) {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const students = await appData.getStudents() || [];

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Manage Students</h1>

      <div class="card" style="margin-bottom: 2rem;">
        <h3 class="mb-lg">Add New Student</h3>
        <form id="addStudentForm">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" id="studentName" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="studentEmail" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Grade Level</label>
            <select class="form-input" id="studentGrade">
              <option value="Elementary">Elementary</option>
              <option value="Middle School">Middle School</option>
              <option value="High School">High School</option>
              <option value="College">College</option>
              <option value="Adult">Adult</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Interests (comma separated)</label>
            <input type="text" class="form-input" id="studentInterests" placeholder="Math, Science, English" required>
          </div>
          <button type="submit" class="btn btn-primary">Add Student</button>
        </form>
      </div>

      <div class="card">
        <h3 class="mb-lg">All Students</h3>
        ${students.length > 0 ? students.map(student => `
          <div class="session-item" style="margin-bottom: 1rem;">
            <div class="session-info">
              <div class="session-title">${sanitize(student.name || 'Unnamed')}</div>
              <div class="session-meta">
                <span>${sanitize(student.email || '—')}</span>
                ${student.gradeLevel ? `<span class="badge badge-secondary">${sanitize(student.gradeLevel)}</span>` : ''}
              </div>
              ${(student.interests || []).length > 0 ? `
              <div style="margin-top: 0.5rem;">
                ${(student.interests || []).map(i => `<span class="subject-tag">${sanitize(i)}</span>`).join('')}
              </div>` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem; flex-direction: column;">
              <button class="btn btn-sm btn-outline" onclick="editStudent('${student.id}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUser('${student.id}')">Delete</button>
            </div>
          </div>
        `).join('') : '<p class="text-muted">No students yet</p>'}
      </div>
    </div>
  `;
  UI.setContent(html);

  document.getElementById('addStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const student = {
        name: document.getElementById('studentName').value,
        email: document.getElementById('studentEmail').value,
        gradeLevel: document.getElementById('studentGrade').value,
        interests: document.getElementById('studentInterests').value.split(',').map(s => s.trim()),
        role: 'student',
        avatar: '👤'
      };
      const result = await appData.addUser(student);
      if (result) {
        UI.showAlert('Student added successfully!', 'success');
        await renderAdminManageStudents();
      } else {
        UI.showAlert('Error adding student. Please try again.', 'danger');
      }
    } catch (error) {
      console.error('Error in addStudentForm:', error);
      UI.showAlert('Error: ' + error.message, 'danger');
    }
  });
}

window.editStudent = async (id) => {
  const student = await appData.getStudentById(id);
  if (student) {
    const html = `
      <div>
        <h3>Edit Student</h3>
        <form id="editStudentForm">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" id="editStudentName" value="${sanitize(student.name || '')}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="editStudentEmail" value="${sanitize(student.email || '')}" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Grade Level</label>
            <select class="form-input" id="editStudentGrade">
              <option value="Elementary" ${student.gradeLevel === 'Elementary' ? 'selected' : ''}>Elementary</option>
              <option value="Middle School" ${student.gradeLevel === 'Middle School' ? 'selected' : ''}>Middle School</option>
              <option value="High School" ${student.gradeLevel === 'High School' ? 'selected' : ''}>High School</option>
              <option value="College" ${student.gradeLevel === 'College' ? 'selected' : ''}>College</option>
              <option value="Adult" ${student.gradeLevel === 'Adult' ? 'selected' : ''}>Adult</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Interests (comma separated)</label>
            <input type="text" class="form-input" id="editStudentInterests" value="${(student.interests || []).join(', ')}" required>
          </div>
          <button type="submit" class="btn btn-primary">Update Student</button>
        </form>
      </div>
    `;
    const modal = UI.showModal(html, 'Edit Student');
    document.getElementById('editStudentForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const result = await appData.updateUser(id, {
          name: document.getElementById('editStudentName').value,
          email: document.getElementById('editStudentEmail').value,
          gradeLevel: document.getElementById('editStudentGrade').value,
          interests: document.getElementById('editStudentInterests').value.split(',').map(s => s.trim())
        });
        if (result) {
          UI.showAlert('Student updated successfully!', 'success');
          modal.remove();
          await renderAdminManageStudents();
        } else {
          UI.showAlert('Error updating student.', 'danger');
        }
      } catch (error) {
        console.error('Error updating student:', error);
        UI.showAlert('Error: ' + error.message, 'danger');
      }
    });
  }
};

// ============================================================================
// WHATSAPP FLOATING BUTTON COMPONENT
// ============================================================================

class WhatsAppComponent {
  constructor(config = {}) {
    this.phoneNumber = config.phoneNumber || '+1234567890';
    this.maxChars = 1000;
    this.init();
  }

  init() {
    this.cacheElements();
    this.attachEventListeners();
    this.setupKeyboardShortcuts();
  }

  cacheElements() {
    this.button = document.getElementById('whatsapp-button');
    this.modal = document.getElementById('whatsapp-modal');
    this.overlay = document.getElementById('whatsapp-modal-overlay');
    this.form = document.getElementById('whatsapp-form');
    this.nameInput = document.getElementById('whatsapp-name');
    this.emailInput = document.getElementById('whatsapp-email');
    this.messageInput = document.getElementById('whatsapp-message');
    this.charCounter = document.getElementById('whatsapp-char-counter');
    this.sendBtn = document.getElementById('whatsapp-send-btn');
    this.closeBtn = document.getElementById('whatsapp-close-btn');
  }

  attachEventListeners() {
    this.button?.addEventListener('click', () => this.openModal());
    this.closeBtn?.addEventListener('click', () => this.closeModal());
    this.overlay?.addEventListener('click', () => this.closeModal());
    this.modal?.addEventListener('click', (e) => e.stopPropagation());
    this.sendBtn?.addEventListener('click', () => this.handleSend());

    this.messageInput?.addEventListener('input', () => this.updateCharCount());
    this.messageInput?.addEventListener('keypress', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        this.handleSend();
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  openModal() {
    this.modal?.classList.add('active');
    this.overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.nameInput?.focus(), 300);
  }

  closeModal() {
    this.modal?.classList.remove('active');
    this.overlay?.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => this.clearForm(), 300);
  }

  clearForm() {
    this.form?.reset();
    this.updateCharCount();
  }

  updateCharCount() {
    if (!this.messageInput || !this.charCounter) return;
    const count = this.messageInput.value.length;
    this.charCounter.textContent = count;

    if (count > this.maxChars) {
      this.messageInput.value = this.messageInput.value.substring(0, this.maxChars);
      this.charCounter.textContent = this.maxChars;
    }
  }

  validateForm() {
    const name = this.nameInput?.value.trim();
    const message = this.messageInput?.value.trim();

    if (!name) {
      this.showValidationError('Name is required');
      return false;
    }
    if (!message) {
      this.showValidationError('Message is required');
      return false;
    }
    return true;
  }

  showValidationError(msg) {
    console.warn('Validation Warning:', msg);
  }

  createWhatsAppMessage() {
    const name = this.nameInput?.value.trim() || 'User';
    const email = this.emailInput?.value.trim() || '';
    const message = this.messageInput?.value.trim() || '';

    let formatted = `*From: ${name}*\n`;
    if (email) formatted += `*Email: ${email}*\n\n`;
    else formatted += '\n';
    formatted += `*Message:*\n${message}`;
    return formatted;
  }

  async handleSend() {
    if (!this.validateForm()) return;

    this.sendBtn.disabled = true;
    this.sendBtn.textContent = 'Preparing...';

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const textMsg = this.createWhatsAppMessage();
      const encoded = encodeURIComponent(textMsg);
      const url = `https://wa.me/${this.phoneNumber.replace(/\D/g, '')}?text=${encoded}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      this.showSuccess();
      setTimeout(() => this.closeModal(), 800);
    } catch (e) {
      console.error(e);
    } finally {
      if (this.sendBtn) {
        this.sendBtn.disabled = false;
        this.sendBtn.textContent = 'Send via WhatsApp';
      }
    }
  }

  showSuccess() {
    if (!this.sendBtn) return;
    const originalText = this.sendBtn.textContent;
    this.sendBtn.textContent = '✓ Opened!';
    setTimeout(() => {
      this.sendBtn.textContent = originalText;
    }, 2000);
  }
}


// ============================================================================
// PAGE 25: USER EXPERIENCES
// ============================================================================

async function renderUserExperiences() {
  if (!appData) {
    console.error('[UserExperiences] appData not initialized');
    return;
  }
  const allExp = await appData.getExperiences() || [];
  const experiences = allExp.filter(e => e.status === 'approved');
  const currentUser = appData.getCurrentUser();

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <div style="margin-bottom: 3rem;">
        <h1 class="mb-md">User Experiences</h1>
        <p class="text-secondary" style="font-size: 1.1rem; margin-bottom: 2rem;">Read what our users have to say about their learning journey with us</p>
      </div>

      ${currentUser ? `
        <div class="card mb-xl" style="background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%); color: white; border: none;">
          <h3 style="color: white; margin-bottom: 1rem;">Share Your Experience</h3>
          <form id="experienceForm">
            <div class="form-group">
              <label class="form-label" style="color: white;">Your Name</label>
              <input type="text" class="form-input" id="experienceName" placeholder="Your name" value="${sanitize(currentUser.name || '')}" required>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" style="color: white;">Subject/Topic</label>
                <input type="text" class="form-input" id="experienceSubject" placeholder="e.g., Mathematics, English" required>
              </div>
              <div class="form-group">
                <label class="form-label" style="color: white;">Rating</label>
                <select class="form-input" id="experienceRating" required>
                  <option value="">Select Rating</option>
                  <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
                  <option value="4">⭐⭐⭐⭐ - Very Good</option>
                  <option value="3">⭐⭐⭐ - Good</option>
                  <option value="2">⭐⭐ - Fair</option>
                  <option value="1">⭐ - Poor</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" style="color: white;">Your Experience</label>
              <textarea class="form-textarea" id="experienceText" placeholder="Share your learning experience, what you learned, and how it helped you..." rows="4" maxlength="500" required></textarea>
              <div style="margin-top: 0.5rem; color: rgba(255,255,255,0.8); font-size: 0.9rem;">
                <span id="experienceCharCount">0</span>/500 characters
              </div>
            </div>
            <button type="submit" class="btn" style="background: white; color: var(--color-primary); font-weight: 600; padding: 0.75rem 2rem; border-radius: var(--radius-lg);">
              Submit Experience
            </button>
          </form>
        </div>
      ` : `
        <div class="card mb-xl" style="background: var(--color-muted); padding: 2rem; border-radius: var(--radius-lg);">
          <p class="text-center" style="margin: 0;"><strong>Sign in or create an account</strong> to share your experience</p>
        </div>
      `}

      <div>
        <h2 class="mb-lg" style="font-size: 1.5rem;">Experiences from Our Community</h2>
        ${experiences.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
            ${experiences.map(exp => `
              <div class="card" style="display: flex; flex-direction: column; transition: var(--transition-base);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                  <div>
                    <h3 style="margin: 0; font-size: 1.1rem;">${sanitize(exp.name)}</h3>
                    <p style="margin: 0.25rem 0 0 0; color: var(--color-text-secondary); font-size: 0.9rem;">${sanitize(exp.subject)}</p>
                  </div>
                  <div style="display: flex; gap: 0.25rem;">
                    ${Array(5).fill(0).map((_, i) => `<span style="color: ${i < parseInt(exp.rating) ? '#FFA500' : '#ddd'};">★</span>`).join('')}
                  </div>
                </div>
                <p style="flex: 1; margin-bottom: 1rem; line-height: 1.6; color: var(--color-text-secondary);">"${sanitize(exp.experience)}"</p>
                <div style="padding-top: 1rem; border-top: 1px solid var(--color-muted); font-size: 0.85rem; color: var(--color-text-secondary);">
                  ${new Date(exp.created_at || exp.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="card text-center" style="padding: 3rem;">
            <p class="text-secondary" style="font-size: 1.1rem;">No experiences yet. Be the first to share!</p>
          </div>
        `}
      </div>
    </div>
  `;

  UI.setContent(html);

  if (currentUser) {
    const textArea = document.getElementById('experienceText');
    const charCount = document.getElementById('experienceCharCount');

    textArea?.addEventListener('input', (e) => {
      charCount.textContent = e.target.value.length;
    });

    document.getElementById('experienceForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const experience = {
        name: document.getElementById('experienceName').value,
        subject: document.getElementById('experienceSubject').value,
        rating: document.getElementById('experienceRating').value,
        experience: document.getElementById('experienceText').value,
        userId: currentUser.id
      };

      appData.addExperience(experience);
      UI.showAlert('Thank you! Your experience has been submitted and is awaiting admin approval.', 'success');
      renderUserExperiences();
    });
  }
}

// PAGE 26: ADMIN MANAGE EXPERIENCES
async function renderAdminExperiences() {
  if (!appData) {
    console.error('[AdminExperiences] appData not initialized');
    return;
  }
  const user = appData.getCurrentUser();
  if (!isAdmin(user)) {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const experiences = await appData.getExperiences() || [];
  const approved = experiences.filter(e => e.status === 'approved');
  const pending = experiences.filter(e => e.status === 'pending');

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Manage User Experiences</h1>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div class="card" style="background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%); color: white; text-align: center; padding: 2rem;">
          <div style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">${experiences.length}</div>
          <div style="font-size: 0.9rem; opacity: 0.9;">Total Experiences</div>
        </div>
        <div class="card" style="background: linear-gradient(135deg, var(--color-success) 0%, #06B6D4 100%); color: white; text-align: center; padding: 2rem;">
          <div style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">${approved.length}</div>
          <div style="font-size: 0.9rem; opacity: 0.9;">Approved</div>
        </div>
        <div class="card" style="background: linear-gradient(135deg, var(--color-warning) 0%, #F97316 100%); color: white; text-align: center; padding: 2rem;">
          <div style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">${pending.length}</div>
          <div style="font-size: 0.9rem; opacity: 0.9;">Pending Review</div>
        </div>
      </div>

      ${pending.length > 0 ? `
        <div class="card mb-xl">
          <h3 class="mb-lg" style="color: var(--color-warning);">⏳ Pending Experiences (${pending.length})</h3>
          ${pending.map(exp => `
            <div style="padding: 1.5rem; background: var(--color-background); border-radius: var(--radius-lg); margin-bottom: 1rem; border-left: 4px solid var(--color-warning);">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1.1rem;">${sanitize(exp.name)}</h4>
                  <p style="margin: 0.25rem 0 0 0; color: var(--color-text-secondary); font-size: 0.9rem;">${sanitize(exp.subject)}</p>
                </div>
                <span style="display: flex; gap: 0.25rem; font-size: 1.2rem;">
                  ${Array(5).fill(0).map((_, i) => `<span style="color: ${i < parseInt(exp.rating) ? '#FFA500' : '#ddd'};">★</span>`).join('')}
                </span>
              </div>
              <p style="margin: 1rem 0; line-height: 1.6; color: var(--color-text-primary);">"${sanitize(exp.experience)}"</p>
              <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-muted); display: flex; gap: 1rem; justify-content: space-between; align-items: center;">
                <small style="color: var(--color-text-secondary);">Submitted: ${new Date(exp.created_at || exp.createdAt).toLocaleDateString()}</small>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn btn-sm btn-success" onclick="approveExperience('${exp.id}')">✓ Approve</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteExperienceAdmin('${exp.id}')">✕ Reject</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="card">
        <h3 class="mb-lg" style="color: var(--color-success);">✓ Approved Experiences (${approved.length})</h3>
        ${approved.length > 0 ? approved.map(exp => `
          <div style="padding: 1.5rem; background: var(--color-background); border-radius: var(--radius-lg); margin-bottom: 1rem; border-left: 4px solid var(--color-success);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div>
                <h4 style="margin: 0; font-size: 1.1rem;">${sanitize(exp.name)}</h4>
                <p style="margin: 0.25rem 0 0 0; color: var(--color-text-secondary); font-size: 0.9rem;">${sanitize(exp.subject)}</p>
              </div>
              <span style="display: flex; gap: 0.25rem; font-size: 1.2rem;">
                ${Array(5).fill(0).map((_, i) => `<span style="color: ${i < parseInt(exp.rating) ? '#FFA500' : '#ddd'};">★</span>`).join('')}
              </span>
            </div>
            <p style="margin: 1rem 0; line-height: 1.6; color: var(--color-text-primary);">"${sanitize(exp.experience)}"</p>
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-muted); display: flex; gap: 1rem; justify-content: space-between; align-items: center;">
              <small style="color: var(--color-text-secondary);">Approved: ${new Date(exp.created_at || exp.createdAt).toLocaleDateString()}</small>
              <button class="btn btn-sm btn-danger" onclick="deleteExperienceAdmin('${exp.id}')">🗑 Remove</button>
            </div>
          </div>
        `).join('') : '<p class="text-muted">No approved experiences yet</p>'}
      </div>
    </div>
  `;

  UI.setContent(html);
}

window.approveExperience = async (experienceId) => {
  await appData.approveExperience(experienceId);
  UI.showAlert('Experience approved and published!', 'success');
  renderAdminExperiences();
};

window.deleteExperienceAdmin = async (experienceId) => {
  if (confirm('Are you sure you want to delete this experience? This action cannot be undone.')) {
    await appData.deleteExperience(experienceId);
    UI.showAlert('Experience deleted!', 'success');
    renderAdminExperiences();
  }
};

// ============================================================================
// FOOTER COMPONENT
// ============================================================================

function getFooterHTML() {
  const year = new Date().getFullYear();
  return `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-col footer-brand-col">
            <div class="footer-logo">
              <img src="aroosh-logo-dark.png" alt="Aroosh Online Tutors" class="logo-img footer-logo-img">
            </div>
            <p class="footer-tagline">Expert online tutoring for every subject. Flexible scheduling, personalized learning, and real results.</p>
            <div class="footer-social">
              <a href="https://wa.me/923354979890" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" class="footer-social-link">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              </a>
              <a href="mailto:contact@arooshtutors.com" aria-label="Email" class="footer-social-link">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </a>
            </div>
          </div>

          <div class="footer-col">
            <h4 class="footer-heading">Quick Links</h4>
            <ul class="footer-links">
              <li><a href="#/" onclick="router.navigate('/')">Home</a></li>
              <li><a href="#/tutors" onclick="router.navigate('/tutors')">Find Tutors</a></li>
              <li><a href="#/experiences" onclick="router.navigate('/experiences')">User Experiences</a></li>

            </ul>
          </div>

          <div class="footer-col">
            <h4 class="footer-heading">For Students</h4>
            <ul class="footer-links">
              <li><a href="signup-student.html">Sign Up as Student</a></li>

            </ul>
          </div>

          <div class="footer-col">
            <h4 class="footer-heading">For Tutors</h4>
            <ul class="footer-links">
              <li><a href="signup-tutor.html">Sign Up as Tutor</a></li>
              <li><a href="#/schedule" onclick="router.navigate('/schedule')">Schedule & Slots</a></li>
              <li><a href="#/chat" onclick="router.navigate('/chat')">Messages</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-divider"></div>

        <div class="footer-bottom">
          <p class="footer-copyright">&copy; ${year} Aroosh Online Tutors. All rights reserved.</p>
          <div class="footer-legal" style="display: flex; gap: 1rem; justify-content: center; margin-top: 0.5rem;">
            <a href="#" onclick="event.preventDefault(); window.open('privacy-policy.html', '_blank'); return false;" style="color: var(--color-text-secondary); font-size: 0.85rem; text-decoration: none; pointer-events: auto; cursor: pointer;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text-secondary)'">Privacy Policy</a>
            <a href="#" onclick="event.preventDefault(); window.open('terms-of-service.html', '_blank'); return false;" style="color: var(--color-text-secondary); font-size: 0.85rem; text-decoration: none; pointer-events: auto; cursor: pointer;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text-secondary)'">Terms of Service</a>
          </div>
          <p class="footer-credit">Made by <strong>M Shahzaib Sajid</strong></p>
        </div>
      </div>
    </footer>
  `;
}

function injectFooter() {
  const app = document.getElementById('app');
  if (!app) return;
  const existing = app.querySelector('.site-footer');
  if (existing) existing.remove();
  app.insertAdjacentHTML('beforeend', getFooterHTML());
}

// ============================================================================
// 5. ROUTER REGISTRATION
// ============================================================================


// ============================================================================
// SCROLL REVEAL ENGINE
// ============================================================================
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-stagger')
    .forEach(el => observer.observe(el));
}

function initHeroParallax() {
  const shapes = document.querySelectorAll('.hero-blob');
  if (!shapes.length) return;
  const onScroll = () => {
    const scrollY = window.scrollY;
    shapes.forEach((el, i) => {
      el.style.transform = `translateY(${scrollY * (0.06 + i * 0.03)}px)`;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  const cleanup = () => window.removeEventListener('scroll', onScroll);
  window.addEventListener('hashchange', cleanup, { once: true });
}

function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const duration = 1200;
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        el.textContent = Math.floor(start).toLocaleString() + suffix;
        if (start >= target) clearInterval(timer);
      }, 16);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));
}

// PUBLIC PAGES: Announcements & Posts (visible to all users including guests)
async function renderPublicAnnouncements() {
  if (!appData) { console.error('[Announcements] appData not initialized'); return; }
  let announcements = [];
  try { announcements = await appData.getAnnouncements() || []; } catch(e) { console.error(e); }

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="text-center mb-lg">📢 Announcements</h1>
      <p class="text-center text-muted mb-2xl">Important updates and notices from the admin team.</p>
      ${announcements.length > 0 ? `
      <div style="display: grid; gap: 1rem; max-width: 800px; margin: 0 auto;">
        ${announcements.map(ann => `
          <div class="card" style="padding: 1.5rem; border-left: 4px solid ${ann.priority === 'high' ? 'var(--color-danger)' : ann.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-success)'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <h3 style="margin: 0; font-size: 1.1rem;">${sanitize(ann.title)}</h3>
              <span class="badge badge-${ann.priority === 'high' ? 'danger' : ann.priority === 'medium' ? 'warning' : 'success'}" style="font-size: 0.75rem;">${ann.priority || 'normal'}</span>
            </div>
            <p class="text-muted" style="margin: 0; font-size: 0.95rem;">${sanitize(ann.content)}</p>
            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--color-text-secondary);">
              Posted: ${new Date(ann.created_at || ann.createdAt).toLocaleDateString()}
              ${ann.author ? ' by ' + sanitize(ann.author.name || '') : ''}
            </div>
          </div>
        `).join('')}
      </div>
      ` : `<div class="text-center" style="padding: 3rem;"><p class="text-muted">No announcements yet. Check back later!</p></div>`}
    </div>
  `;
  UI.setContent(html);
}

async function renderPublicPosts() {
  if (!appData) { console.error('[Posts] appData not initialized'); return; }
  let posts = [];
  try { posts = await appData.getPosts() || []; } catch(e) { console.error(e); }

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="text-center mb-lg">📝 Posts</h1>
      <p class="text-center text-muted mb-2xl">Articles, tips, and updates from the Aroosh community.</p>
      ${posts.length > 0 ? `
      <div class="grid-3" style="max-width: 1000px; margin: 0 auto;">
        ${posts.map(post => `
          <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column;">
            <span class="badge badge-secondary" style="align-self: flex-start; margin-bottom: 0.75rem; font-size: 0.8rem;">${sanitize(post.category || 'General')}</span>
            <h3 style="margin: 0 0 0.75rem 0; font-size: 1.1rem;">${sanitize(post.title)}</h3>
            <p class="text-muted" style="margin: 0 0 1rem 0; font-size: 0.9rem; flex-grow: 1;">${sanitize((post.content || '').substring(0, 200))}${post.content && post.content.length > 200 ? '...' : ''}</p>
            <div style="font-size: 0.85rem; color: var(--color-text-secondary);">
              ${new Date(post.created_at || post.createdAt).toLocaleDateString()}
              ${post.author ? ' by ' + sanitize(post.author.name || '') : ''}
            </div>
          </div>
        `).join('')}
      </div>
      ` : `<div class="text-center" style="padding: 3rem;"><p class="text-muted">No posts yet. Check back later!</p></div>`}
    </div>
  `;
  UI.setContent(html);
}

router.register('/', renderHome);
router.register('/announcements', renderPublicAnnouncements);
router.register('/posts', renderPublicPosts);
router.register('/role-selection', renderRoleSelection);
router.register('/login', () => { window.location.href = 'login.html'; });
router.register('/signup-student', () => { window.location.href = 'signup-student.html'; });
router.register('/signup-tutor', () => { window.location.href = 'signup-tutor.html'; });
router.register('/setup-student-profile', () => { window.location.href = 'setup-student-profile.html'; });
router.register('/setup-tutor-profile', () => { window.location.href = 'setup-tutor-profile.html'; });
router.register('/privacy-policy', () => { window.location.href = 'privacy-policy.html'; });
router.register('/terms-of-service', () => { window.location.href = 'terms-of-service.html'; });
router.register('/tutors', renderFindTutors);
router.register('/tutors/:id', (hash) => renderTutorProfile(hash));
router.register('/student-dashboard', renderStudentDashboard);
router.register('/tutor-dashboard', renderTutorDashboard);
router.register('/chat', renderChat);
router.register('/schedule', renderSchedule);

router.register('/admin', renderAdminDashboard);
router.register('/admin/approvals', renderAdminApprovals);
router.register('/admin/sessions', renderAdminSessions);
router.register('/admin/announcements', renderAdminAnnouncements);
router.register('/admin/feedback', renderAdminFeedback);
router.register('/admin/manage-tutors', renderAdminManageTutors);
router.register('/admin/manage-students', renderAdminManageStudents);
router.register('/experiences', renderUserExperiences);
router.register('/leaderboard', renderLeaderboard);
router.register('/assignments', renderAssignments);
router.register('/admin/experiences', renderAdminExperiences);

// ============================================================================
// 6. COLLAPSIBLE SIDEBAR MENU REDESIGNED
// ============================================================================

function renderSidebar() {
  const currentUser = appData.getCurrentUser();
  const role = normalizeRole(currentUser?.role);
  const currentHash = window.location.hash || '#/';

  const isActive = (hash) => {
    if (hash === '#/') {
      return currentHash === '#/' || currentHash === '';
    }
    return currentHash.startsWith(hash);
  };

  const guestLinks = [
    { label: 'Home', icon: '🏠', hash: '#/' },
    { label: 'Announcements', icon: '📢', hash: '#/announcements' },
    { label: 'Posts', icon: '📝', hash: '#/posts' },
    { label: 'Find Tutors', icon: '🔍', hash: '#/tutors' },
    { label: 'Experiences', icon: '⭐', hash: '#/experiences' },
    { label: 'Sign In / Sign Up', icon: '🔐', hash: '#/login' }
  ];

  const studentLinks = [
    { label: 'Home', icon: '🏠', hash: '#/' },
    { label: 'Announcements', icon: '📢', hash: '#/announcements' },
    { label: 'Posts', icon: '📝', hash: '#/posts' },
    { label: 'Find Tutors', icon: '🔍', hash: '#/tutors' },
    { label: 'My Sessions', icon: '📅', hash: '#/student-dashboard' },
    { label: 'Messages', icon: '💬', hash: '#/chat' },
    { label: 'Experiences', icon: '⭐', hash: '#/experiences' }
  ];

  const tutorLinks = [
    { label: 'Home', icon: '🏠', hash: '#/' },
    { label: 'Announcements', icon: '📢', hash: '#/announcements' },
    { label: 'Posts', icon: '📝', hash: '#/posts' },
    { label: 'Browse Tutors', icon: '👥', hash: '#/tutors' },
    { label: 'Schedule & Slots', icon: '📆', hash: '#/schedule' },
    { label: 'Messages', icon: '💬', hash: '#/chat' },
    { label: 'My Dashboard', icon: '📋', hash: '#/tutor-dashboard' },
    { label: 'Experiences', icon: '⭐', hash: '#/experiences' }
  ];

  const adminLinks = [
    { label: 'Home', icon: '🏠', hash: '#/' },
    { label: 'Admin Panel', icon: '🛡️', hash: '#/admin' },
    { label: 'Approvals', icon: '✅', hash: '#/admin/approvals' },
    { label: 'Manage Sessions', icon: '📅', hash: '#/admin/sessions' },
    { label: 'Announcements & Posts', icon: '📢', hash: '#/admin/announcements' },
    { label: 'User Feedback', icon: '💬', hash: '#/admin/feedback' },
    { label: 'User Experiences', icon: '⭐', hash: '#/admin/experiences' },
    { label: 'Manage Tutors', icon: '👨‍🏫', hash: '#/admin/manage-tutors' },
    { label: 'Manage Students', icon: '👨‍🎓', hash: '#/admin/manage-students' },
    { label: 'All Tutors List', icon: '👥', hash: '#/tutors' }
  ];

  let activeLinks = [];
  if (role === 'student') activeLinks = studentLinks;
  else if (role === 'tutor') activeLinks = tutorLinks;
  else if (role === 'admin') activeLinks = adminLinks;
  else activeLinks = guestLinks;

  // Detect incomplete profile for authenticated users
  let setupHtml = '';
  if (role === 'student') {
    const missing = !currentUser?.subjects?.length || !currentUser?.experience_level || !currentUser?.bio;
    if (missing) {
      const active = isActive('#/setup-student-profile') ? 'class="active"' : '';
      setupHtml = `
        <div class="sidebar-setup" style="margin: 0 12px 12px; padding: 12px; background: linear-gradient(135deg, rgba(245,158,11,.12), rgba(245,158,11,.05)); border: 1px solid rgba(245,158,11,.35); border-radius: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 6px;">⚠️ Profile Incomplete</div>
          <div style="font-size: 12px; color: #78350f; margin-bottom: 10px; line-height: 1.4;">Complete your profile to unlock all features.</div>
          <a href="setup-student-profile.html" ${active} style="display: block; padding: 8px 12px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; border-radius: 8px; text-align: center; font-size: 13px; font-weight: 700; text-decoration: none; box-shadow: 0 2px 8px rgba(138,48,127,.3);">
            <span style="margin-right:4px;">✏️</span> Complete Profile
          </a>
        </div>
      `;
    }
  } else if (role === 'tutor') {
    const missing = !currentUser?.qualifications || !currentUser?.bio;
    if (missing) {
      const active = isActive('#/setup-tutor-profile') ? 'class="active"' : '';
      setupHtml = `
        <div class="sidebar-setup" style="margin: 0 12px 12px; padding: 12px; background: linear-gradient(135deg, rgba(245,158,11,.12), rgba(245,158,11,.05)); border: 1px solid rgba(245,158,11,.35); border-radius: 10px;">
          <div style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 6px;">⚠️ Profile Incomplete</div>
          <div style="font-size: 12px; color: #78350f; margin-bottom: 10px; line-height: 1.4;">Complete your tutor profile to start accepting bookings.</div>
          <a href="setup-tutor-profile.html" ${active} style="display: block; padding: 8px 12px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; border-radius: 8px; text-align: center; font-size: 13px; font-weight: 700; text-decoration: none; box-shadow: 0 2px 8px rgba(138,48,127,.3);">
            <span style="margin-right:4px;">✏️</span> Complete Profile
          </a>
        </div>
      `;
    }
  }

  let menuHtml = activeLinks.map(link => {
    const active = isActive(link.hash) ? 'class="active"' : '';
    return `
      <li>
        <a href="${link.hash}" ${active}>
          <span class="sidebar-menu-icon">${link.icon}</span>
          <span class="sidebar-menu-label">${link.label}</span>
        </a>
      </li>
    `;
  }).join('');

  // Add Edit Profile link for students and tutors
  if (role === 'student' || role === 'tutor') {
    const profileLink = role === 'student' ? 'setup-student-profile.html' : 'setup-tutor-profile.html';
    menuHtml += `
      <li style="border-top: 1px solid var(--color-muted); margin-top: 0.5rem; padding-top: 0.5rem;">
        <a href="${profileLink}" style="color: var(--color-primary); font-weight: 600;">
          <span class="sidebar-menu-icon" style="font-size: 1.2rem;">✏️</span>
          <span class="sidebar-menu-label">Edit Profile</span>
        </a>
      </li>
    `;
  }

  if (role !== 'guest') {
    menuHtml += `
      <li>
        <a href="javascript:void(0)" onclick="logout()">
          <span class="sidebar-menu-icon">🚪</span>
          <span class="sidebar-menu-label">Logout</span>
        </a>
      </li>
    `;
  }

  const sidebarEl = document.getElementById('sidebar');
  if (!sidebarEl) return;

  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (isCollapsed) {
    sidebarEl.classList.add('collapsed');
  } else {
    sidebarEl.classList.remove('collapsed');
  }

  const rawAvatar = currentUser?.avatar || (role === 'tutor' ? '👨‍🏫' : role === 'admin' ? '🛡️' : '👤');
  const name = currentUser?.name || 'Guest User';
  const roleDisplay = role.toUpperCase();
  const badgeClass = role === 'guest' ? 'secondary' : 'primary';

  const isDark = document.body.classList.contains('dark-mode');
  const darkIcon = isDark ? '☀️' : '🌙';

  // Dynamic brand block handles desktop collapsed formatting beautifully
  const brandControls = isCollapsed 
    ? `
      <button id="sidebar-toggle" class="sidebar-toggle-btn" aria-label="Expand Sidebar">
        <span class="toggle-icon">▶</span>
      </button>
    `
    : `
      <div class="sidebar-logo" id="adminLogoTrigger" style="cursor: pointer;">
        <img src="aroosh-logo-light.png" alt="Aroosh Online Tutors" class="logo-img logo-light">
        <img src="aroosh-logo-dark.png" alt="Aroosh Online Tutors" class="logo-img logo-dark">
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <button onclick="window.toggleDarkMode()" class="btn btn-ghost btn-sm" style="padding: 4px; font-size: 16px; border: none; background: transparent; cursor: pointer;" title="Toggle Dark/Light Mode">${darkIcon}</button>
        <button id="sidebar-toggle" class="sidebar-toggle-btn" aria-label="Collapse Sidebar">
          <span class="toggle-icon">◀</span>
        </button>
      </div>
    `;

  sidebarEl.innerHTML = `
    <div class="sidebar-brand">
      ${brandControls}
    </div>

    <div class="sidebar-profile">
      <div class="sidebar-avatar" style="font-size: 2rem; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; overflow: hidden;">${renderAvatar(rawAvatar, 50, name)}</div>
      <div class="sidebar-profile-info">
        <div class="sidebar-name">${name}</div>
        <span class="sidebar-role badge badge-${badgeClass}">${roleDisplay}</span>
      </div>
    </div>

    ${setupHtml}
    <ul class="sidebar-menu">
      ${menuHtml}
    </ul>

    <div class="sidebar-footer" style="padding: 1rem; border-top: 1px solid var(--color-muted); margin-top: auto;">

      <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
        <a href="#" onclick="event.preventDefault(); window.location.href='privacy-policy.html'; return false;" style="color: var(--color-text-secondary); font-size: 0.75rem; text-decoration: none; opacity: 0.8; pointer-events: auto; cursor: pointer;" onmouseover="this.style.opacity='1'; this.style.color='var(--color-primary)'" onmouseout="this.style.opacity='0.8'; this.style.color='var(--color-text-secondary)'">Privacy Policy</a>
        <a href="#" onclick="event.preventDefault(); window.location.href='terms-of-service.html'; return false;" style="color: var(--color-text-secondary); font-size: 0.75rem; text-decoration: none; opacity: 0.8; pointer-events: auto; cursor: pointer;" onmouseover="this.style.opacity='1'; this.style.color='var(--color-primary)'" onmouseout="this.style.opacity='0.8'; this.style.color='var(--color-text-secondary)'">Terms of Service</a>
      </div>
    </div>
  `;

  // Attach Desktop Sidebar Collapse Event Listener
  document.getElementById('sidebar-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebarEl.classList.toggle('collapsed');
    const currentlyCollapsed = sidebarEl.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', currentlyCollapsed ? 'true' : 'false');
    // Re-render sidebar brand buttons immediately to avoid layout discrepancies
    renderSidebar();
  });

  // Admin access removed from frontend

  // Mobile Hamburger & Overlay controllers
  const mobileHamburger = document.getElementById('mobile-hamburger');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  if (mobileHamburger && sidebarOverlay) {
    mobileHamburger.onclick = (e) => {
      e.stopPropagation();
      sidebarEl.classList.toggle('active');
      sidebarOverlay.classList.toggle('active');
    };

    sidebarOverlay.onclick = () => {
      sidebarEl.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    };

    sidebarEl.querySelectorAll('.sidebar-menu a').forEach(link => {
      link.addEventListener('click', () => {
        sidebarEl.classList.remove('active');
        sidebarOverlay.classList.remove('active');
      });
    });
  }
}


// switchRole removed - was a dev-only tool that allowed client-side role impersonation

window.logout = async () => {
  try {
    // Sign out from supabaseClient
    await appData.signOut();
    // Redirect to home page (guest view)
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if there's an error
    window.location.href = 'index.html';
  }
};

// ============================================================================
// 7. APP INITIALIZATION
// ============================================================================

// ============================================================================
// COOKIE CONSENT BANNER
// ============================================================================
function initCookieConsent() {
  const STORAGE_KEY = 'aroosh_cookie_consent';
  const consent = localStorage.getItem(STORAGE_KEY);
  if (consent) {
    if (consent === 'accepted') loadGoogleAnalytics();
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.innerHTML = `
    <div style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:var(--color-surface);border-top:1px solid var(--color-muted);padding:16px 24px;box-shadow:0 -4px 20px rgba(0,0,0,.15);display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;font-family:var(--font);animation:fadeUp .4s ease both;">
      <span style="font-size:13px;color:var(--color-text-secondary);line-height:1.5;">We use cookies to enhance your experience and analyze site traffic via Google Analytics. You can choose to Accept or Decline.</span>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button id="cookie-accept" style="padding:8px 18px;border-radius:var(--radius-md);border:none;background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));color:#fff;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(138,48,127,.3);font-family:var(--font);">Accept</button>
        <button id="cookie-decline" style="padding:8px 18px;border-radius:var(--radius-md);border:1.5px solid var(--color-muted);background:var(--color-background);color:var(--color-text-primary);font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);">Decline</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    banner.remove();
    loadGoogleAnalytics();
  });

  document.getElementById('cookie-decline').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    banner.remove();
  });
}

function loadGoogleAnalytics() {
  if (window.gtagLoaded) return;
  window.gtagLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  // TODO: Replace GA_MEASUREMENT_ID with your real Google Analytics ID
  script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID'); // TODO: Replace with real ID
}

// ============================================================================
// APP INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize WhatsApp
  window.whatsappComponent = new WhatsAppComponent({
    phoneNumber: '+923354979890'
  });

  // Ensure app is initialized before proceeding
  if (!appData) {
    console.warn('[App] appData not initialized, waiting...');
    setTimeout(async () => {
      if (appData) {
        await startApp();
      } else {
        console.error('[App] Failed to initialize appData');
      }
    }, 200);
  } else {
    await startApp();
  }
});

async function startApp() {
  // Wait for auth session check (max 3s) before rendering anything
  if (appData) {
    const authTimeout = new Promise(resolve => setTimeout(resolve, 3000));
    await Promise.race([appData._authReady, authTimeout]);
  }
  renderSidebar();
  try {
    await router.start();
  } catch(routerErr) {
    console.error('[App] Router start error:', routerErr);
    // Show a friendly fallback if home page crashes
    const appDiv = document.getElementById('app');
    if (appDiv && !appDiv.innerHTML.trim()) {
      appDiv.innerHTML = `<div class="container" style="padding:3rem;text-align:center;">
        <h2>Loading...</h2><p>Please refresh the page.</p>
        <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
      </div>`;
    }
  }
  initCookieConsent();

  // Always hide loading screen regardless of whether router succeeded
  const loadingScreen = document.getElementById('loading-screen');
  function hideLoadingScreen() {
    if (!loadingScreen) return;
    loadingScreen.classList.add('fade-out');
    setTimeout(() => { if (loadingScreen && loadingScreen.parentNode) loadingScreen.remove(); }, 400);
  }
  setTimeout(hideLoadingScreen, 600);
  setTimeout(() => { if (loadingScreen && loadingScreen.parentNode) loadingScreen.remove(); }, 4000);

  // Auth redirect
  setTimeout(() => {
    if (!appData) {
      console.warn('[App] appData still not initialized in redirect check');
      return;
    }
    const user = appData.getCurrentUser();
    console.log('[App] Redirect check — currentUser:', user);
    if (user) {
      const hash = window.location.hash.slice(1) || '/';
      if (hash === '/' || hash === '') {
        const role = user.role;
        console.log('[App] Redirecting to dashboard for role:', role);
        if (role === 'student') router.navigate('/student-dashboard');
        else if (role === 'tutor') router.navigate('/tutor-dashboard');
        else if (role === 'admin') router.navigate('/admin');
      }
    }
  }, 300);

  // Loading screen handled above
}

