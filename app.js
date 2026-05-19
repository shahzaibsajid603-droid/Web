// ============================================================================
// AROOSH'S ONLINE TUTORS - COMPLETE APPLICATION REDESIGNED
// ============================================================================

// Global Sanitization Helper
function sanitize(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);
  return str.replace(/[&<>"']/g, (m) => {
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
// 1. DATA LAYER & MOCK DATA
// ============================================================================

class AppData {
  constructor() {
    this._cache = null;
    this.initData();
  }

  initData() {
    if (!localStorage.getItem('appData')) {
      const mockData = {
        currentUser: null,
        users: [
          {
            id: 'user1',
            name: 'Rahul Kumar',
            email: 'rahul@example.com',
            role: 'student',
            gradeLevel: 'High School',
            interests: ['Math', 'Science'],
            avatar: '👤'
          },
          {
            id: 'tutor1',
            name: 'Priya Singh',
            email: 'priya@example.com',
            role: 'tutor',
            bio: 'Experienced math tutor with 5+ years of teaching. Visual and Kinesthetic learner advocate.',
            experience: '5-10yr',
            qualifications: 'B.Sc Mathematics, M.Ed',
            hourlyRate: 25,
            subjects: ['Math', 'Physics'],
            avatar: '👨‍🏫',
            rating: 4.8,
            totalReviews: 42,
            isAvailable: true,
            yearsOfExperience: 7,
            experienceLevel: 'Expert',
            availability: []
          },
          {
            id: 'tutor2',
            name: 'Amit Patel',
            bio: 'English & Literature specialist, helps with essays and writing. Focuses on auditory feedback.',
            hourlyRate: 22,
            experienceLevel: 'Intermediate',
            yearsOfExperience: 3,
            rating: 4.6,
            totalReviews: 28,
            isAvailable: true,
            subjects: ['English', 'History'],
            avatar: '👨‍🏫',
            email: 'amit@example.com',
            qualifications: 'B.A English',
            role: 'tutor',
            availability: []
          },
          {
            id: 'tutor3',
            name: 'Sophia Chen',
            bio: 'Science tutor, specialized in Biology and Chemistry. Hands-on learning techniques.',
            hourlyRate: 28,
            experienceLevel: 'Expert',
            yearsOfExperience: 8,
            rating: 4.9,
            totalReviews: 56,
            isAvailable: false,
            subjects: ['Science', 'Chemistry', 'Biology'],
            avatar: '👩‍🏫',
            email: 'sophia@example.com',
            qualifications: 'B.Sc Biology, B.Ed',
            role: 'tutor',
            availability: []
          },
          {
            id: 'tutor4',
            name: 'Mohammed Al-Rashid',
            bio: 'Languages specialist - Arabic, Spanish, French.',
            hourlyRate: 20,
            experienceLevel: 'Intermediate',
            yearsOfExperience: 4,
            rating: 4.7,
            totalReviews: 35,
            isAvailable: true,
            subjects: ['Languages', 'Arabic', 'Spanish'],
            avatar: '👨‍🏫',
            email: 'mohammed@example.com',
            qualifications: 'B.A Linguistics',
            role: 'tutor',
            availability: []
          },
          {
            id: 'tutor5',
            name: 'Emma Wilson',
            bio: 'Technology & coding tutor, specializes in web development and visual diagrams.',
            hourlyRate: 35,
            experienceLevel: 'Expert',
            yearsOfExperience: 9,
            rating: 4.9,
            totalReviews: 63,
            isAvailable: true,
            subjects: ['Technology', 'Programming'],
            avatar: '👩‍💻',
            email: 'emma@example.com',
            qualifications: 'B.Tech Computer Science',
            role: 'tutor',
            availability: []
          },
          {
            id: 'tutor6',
            name: 'David Martinez',
            bio: 'Arts & design tutor, creative coaching for all skill levels.',
            hourlyRate: 18,
            experienceLevel: 'Beginner',
            yearsOfExperience: 2,
            rating: 4.5,
            totalReviews: 18,
            isAvailable: true,
            subjects: ['Arts', 'Design'],
            avatar: '🎨',
            email: 'david@example.com',
            qualifications: 'B.A Fine Arts',
            role: 'tutor',
            availability: []
          },
          {
            id: 'admin1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            avatar: '🛡️'
          }
        ],
        bookings: [
          {
            id: 'booking1',
            studentId: 'user1',
            tutorId: 'tutor1',
            date: new Date().toISOString().split('T')[0],
            time: '14:00',
            duration: 60,
            subject: 'Math',
            status: 'confirmed',
            notes: 'Need help with calculus'
          },
          {
            id: 'booking2',
            studentId: 'user1',
            tutorId: 'tutor2',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '15:00',
            duration: 45,
            subject: 'English',
            status: 'pending',
            notes: 'Essay review'
          },
          {
            id: 'booking3',
            studentId: 'user1',
            tutorId: 'tutor3',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '10:00',
            duration: 60,
            subject: 'Chemistry',
            status: 'completed',
            notes: 'Periodic table assignment review'
          },
          {
            id: 'booking4',
            studentId: 'user1',
            tutorId: 'tutor4',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '16:00',
            duration: 30,
            subject: 'Spanish',
            status: 'confirmed',
            notes: 'Conversation practice and grammar review'
          },
          {
            id: 'booking5',
            studentId: 'user1',
            tutorId: 'tutor1',
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '11:00',
            duration: 60,
            subject: 'Math',
            status: 'cancelled',
            notes: 'Was rescheduled due to conflict'
          }
        ],
        reviews: [
          {
            id: 'review1',
            bookingId: 'booking3',
            tutorId: 'tutor3',
            studentId: 'user1',
            rating: 5,
            comment: 'Excellent tutor! Very knowledgeable and patient.',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            id: 'review2',
            bookingId: 'booking1',
            tutorId: 'tutor1',
            studentId: 'user1',
            rating: 5,
            comment: 'Great session! Helped me understand complex formulas.',
            date: new Date().toISOString().split('T')[0]
          }
        ],
        assignments: [
          {
            id: 'assign1',
            studentId: 'user1',
            tutorId: 'tutor1',
            title: 'Calculus Practice Set',
            description: 'Solve the 20 problems in Section 3.2 of the textbook',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
            grade: null,
            feedback: null
          },
          {
            id: 'assign2',
            studentId: 'user1',
            tutorId: 'tutor2',
            title: 'Essay on Literature',
            description: 'Write a 500-word essay on your favorite book',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'submitted',
            grade: null,
            feedback: null,
            submittedDate: new Date().toISOString().split('T')[0]
          },
          {
            id: 'assign3',
            studentId: 'user1',
            tutorId: 'tutor3',
            title: 'Chemistry Lab Report',
            description: 'Complete lab experiment and write a detailed report',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'graded',
            grade: 88,
            feedback: 'Good work! Your methodology was sound. Next time, include more analysis.',
            submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ],
        messages: [
          {
            id: 'msg1',
            senderId: 'user1',
            recipientId: 'tutor1',
            content: 'Hi, when can we schedule our next session?',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            read: true
          },
          {
            id: 'msg2',
            senderId: 'tutor1',
            recipientId: 'user1',
            content: 'How about next Tuesday at 2 PM?',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            read: true
          },
          {
            id: 'msg3',
            senderId: 'user1',
            recipientId: 'tutor2',
            content: 'Thank you for the essay feedback!',
            timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
            read: true
          },
          {
            id: 'msg4',
            senderId: 'tutor2',
            recipientId: 'user1',
            content: 'You\'re welcome! Keep up the good work.',
            timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            read: false
          }
        ],
        tutorApplications: [
          {
            id: 'app1',
            name: 'Neha Verma',
            email: 'neha@example.com',
            bio: 'Physics teacher with 2 years experience',
            experience: '1-3yr',
            qualifications: 'B.Sc Physics, B.Ed',
            subjects: ['Physics'],
            hourlyRate: 20,
            status: 'pending',
            appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            id: 'app2',
            name: 'James Thompson',
            email: 'james@example.com',
            bio: 'University student tutoring high school subjects',
            experience: '<1yr',
            qualifications: 'B.A In Progress',
            subjects: ['Math', 'English'],
            hourlyRate: 15,
            status: 'pending',
            appliedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            id: 'app3',
            name: 'Dr. Lisa Chang',
            email: 'lisa@example.com',
            bio: 'PhD in Chemistry, published researcher',
            experience: '10+yr',
            qualifications: 'Ph.D Chemistry',
            subjects: ['Chemistry', 'Science'],
            hourlyRate: 45,
            status: 'approved',
            appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ],
        leaderboard: {
          students: [
            { rank: 1, name: 'Aisha Khan', points: 2450, streak: 15 },
            { rank: 2, name: 'Rahul Kumar', points: 2320, streak: 12 },
            { rank: 3, name: 'Zara Ali', points: 2150, streak: 10 },
            { rank: 4, name: 'Vikram Singh', points: 1980, streak: 8 },
            { rank: 5, name: 'Priya Patel', points: 1850, streak: 7 },
            { rank: 6, name: 'Mohammed Habib', points: 1720, streak: 6 },
            { rank: 7, name: 'Chen Wei', points: 1530, streak: 4 }
          ],
          tutors: [
            { rank: 1, name: 'Priya Singh', points: 3200, streak: 20 },
            { rank: 2, name: 'Emma Wilson', points: 3050, streak: 18 },
            { rank: 3, name: 'Sophia Chen', points: 2920, streak: 16 },
            { rank: 4, name: 'Amit Patel', points: 2450, streak: 12 },
            { rank: 5, name: 'David Martinez', points: 2100, streak: 10 },
            { rank: 6, name: 'Mohammed Al-Rashid', points: 1950, streak: 8 }
          ]
        },
        disputes: [
          {
            id: 'disp1',
            caseNumber: 'CASE-001',
            status: 'open',
            filedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            claimedAmount: 25,
            studentName: 'Rahul Kumar',
            tutorName: 'Priya Singh',
            reason: 'Session quality',
            description: 'Session was cut short, did not receive full service',
            evidence: ['screenshot1.png'],
            resolution: null
          },
          {
            id: 'disp2',
            caseNumber: 'CASE-002',
            status: 'in_review',
            filedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            claimedAmount: 22,
            studentName: 'Zara Ali',
            tutorName: 'Amit Patel',
            reason: 'No show',
            description: 'Tutor did not appear for scheduled session',
            evidence: ['email_confirmation.pdf'],
            resolution: null
          },
          {
            id: 'disp3',
            caseNumber: 'CASE-003',
            status: 'resolved',
            filedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            claimedAmount: 18,
            studentName: 'Vikram Singh',
            tutorName: 'David Martinez',
            reason: 'Technical issues',
            description: 'Connection problems during session',
            evidence: [],
            resolution: 'Refund approved - full session amount refunded'
          }
        ],
        refunds: [
          {
            id: 'ref1',
            studentName: 'Vikram Singh',
            amount: 18,
            reason: 'Technical issues',
            sessionDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'approved'
          },
          {
            id: 'ref2',
            studentName: 'Priya Patel',
            amount: 25,
            reason: 'Session cancelled by tutor',
            sessionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending'
          },
          {
            id: 'ref3',
            studentName: 'Mohammed Habib',
            amount: 22,
            reason: 'Unsatisfactory service',
            sessionDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'rejected'
          }
        ],
        announcements: [
          {
            id: 'ann1',
            title: 'Welcome to Aroosh Tutors!',
            content: 'We are excited to launch our new tutoring platform. Connect with expert tutors and achieve your learning goals.',
            type: 'announcement',
            priority: 'high',
            createdAt: new Date().toISOString(),
            createdBy: 'admin1',
            isActive: true
          },
          {
            id: 'ann2',
            title: 'New Math Tutor Available',
            content: 'Dr. Lisa Chen has joined our platform with expertise in advanced mathematics and calculus.',
            type: 'announcement',
            priority: 'medium',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'admin1',
            isActive: true
          }
        ],
        posts: [
          {
            id: 'post1',
            title: 'Tips for Effective Online Learning',
            content: 'Discover the best strategies for maximizing your online tutoring sessions. Create a dedicated study space, minimize distractions, and come prepared with questions.',
            type: 'post',
            category: 'Study Tips',
            mediaType: null,
            mediaUrl: null,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'admin1',
            isActive: true
          },
          {
            id: 'post2',
            title: 'Summer Learning Programs',
            content: 'Enroll in our special summer courses to get ahead before the next academic year. Special discounts available for early registrations!',
            type: 'post',
            category: 'News',
            mediaType: null,
            mediaUrl: null,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'admin1',
            isActive: true
          }
        ],
        feedback: [
          {
            id: 'fb1',
            userId: 'user1',
            userName: 'Rahul Kumar',
            type: 'general',
            subject: 'Platform Suggestion',
            message: 'It would be great to have a video call feature directly in the platform.',
            status: 'pending',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            response: null
          },
          {
            id: 'fb2',
            userId: 'user1',
            userName: 'Rahul Kumar',
            type: 'bug',
            subject: 'Login Issue',
            message: 'Sometimes the login page takes too long to load.',
            status: 'resolved',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            response: 'Thank you for reporting. We have optimized the login page loading time.'
          }
        ]
      };
      this._cache = null;
      localStorage.setItem('appData', JSON.stringify(mockData));
    }
  }

  getData() {
    if (this._cache) {
      return this._cache;
    }
    this._cache = JSON.parse(localStorage.getItem('appData')) || {};
    return this._cache;
  }

  setCurrentUser(user) {
    const data = this.getData();
    data.currentUser = user;
    this._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));
  }

  getCurrentUser() {
    const data = this.getData();
    return data.currentUser;
  }

  getTutors() {
    const data = this.getData();
    return (data.users || []).filter(u => u.role === 'tutor');
  }

  getTutorById(id) {
    return this.getTutors().find(t => t.id === id);
  }

  getBookings() {
    const data = this.getData();
    return data.bookings || [];
  }

  getAssignments() {
    const data = this.getData();
    return data.assignments || [];
  }

  getReviews() {
    const data = this.getData();
    return data.reviews || [];
  }

  getMessages() {
    const data = this.getData();
    return data.messages || [];
  }

  addMessage(message) {
    const data = this.getData();
    if (!data.messages) data.messages = [];
    data.messages.push({...message, id: 'msg' + Date.now()});
    this._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));
  }

  getLeaderboard() {
    const data = this.getData();
    return data.leaderboard || { students: [], tutors: [] };
  }

  getDisputesList() {
    const data = this.getData();
    return data.disputes || [];
  }

  getRefundsList() {
    const data = this.getData();
    return data.refunds || [];
  }

  getTutorApplications() {
    const data = this.getData();
    return data.tutorApplications || [];
  }

  addBooking(booking) {
    const data = this.getData();
    if (!data.bookings) data.bookings = [];
    data.bookings.push({ ...booking, id: 'booking' + Date.now() });
    this._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));
  }

  updateBookingStatus(bookingId, status) {
    const data = this.getData();
    if (data.bookings) {
      const booking = data.bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = status;
        this._cache = null;
        localStorage.setItem('appData', JSON.stringify(data));
      }
    }
  }

  addAssignment(assignment) {
    const data = this.getData();
    if (!data.assignments) data.assignments = [];
    data.assignments.push({ ...assignment, id: 'assign' + Date.now() });
    this._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));
  }

  updateDisputeStatus(disputeId, status, resolution = null) {
    const data = this.getData();
    if (data.disputes) {
      const dispute = data.disputes.find(d => d.id === disputeId);
      if (dispute) {
        dispute.status = status;
        if (resolution) dispute.resolution = resolution;
        this._cache = null;
        localStorage.setItem('appData', JSON.stringify(data));
      }
    }
  }

  updateRefundStatus(refundId, status) {
    const data = this.getData();
    if (data.refunds) {
      const refund = data.refunds.find(r => r.id === refundId);
      if (refund) {
        refund.status = status;
        this._cache = null;
        localStorage.setItem('appData', JSON.stringify(data));
      }
    }
  }

  approveTutorApplication(appId) {
    const data = this.getData();
    if (data.tutorApplications) {
      const app = data.tutorApplications.find(a => a.id === appId);
      if (app) {
        app.status = 'approved';
        if (!data.users) data.users = [];
        const exists = data.users.find(u => u.email === app.email);
        if (!exists) {
          data.users.push({
            id: 'user' + Date.now(),
            name: app.name,
            email: app.email,
            role: 'tutor',
            bio: app.bio,
            experience: app.experience,
            qualifications: app.qualifications,
            hourlyRate: app.hourlyRate,
            subjects: app.subjects,
            avatar: '👨‍🏫',
            rating: 5.0,
            totalReviews: 0,
            isAvailable: true,
            yearsOfExperience: parseInt(app.experience) || 3
          });
        }
        this._cache = null;
        localStorage.setItem('appData', JSON.stringify(data));
      }
    }
  }

  rejectTutorApplication(appId) {
    const data = this.getData();
    if (data.tutorApplications) {
      const app = data.tutorApplications.find(a => a.id === appId);
      if (app) {
        app.status = 'rejected';
        this._cache = null;
        localStorage.setItem('appData', JSON.stringify(data));
      }
    }
  }

  // Announcements CRUD
  getAnnouncements() {
    const data = this.getData();
    return (data.announcements || []).filter(a => a.isActive);
  }

  getAllAnnouncements() {
    const data = this.getData();
    return data.announcements || [];
  }

  addAnnouncement(announcement) {
    const data = this.getData();
    if (!data.announcements) data.announcements = [];
    data.announcements.push({ ...announcement, id: 'ann' + Date.now(), createdAt: new Date().toISOString() });
    this._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));
  }

  updateAnnouncement(id, updates) {
    const data = this.getData();
    if (data.announcements) {
      const announcement = data.announcements.find(a => a.id === id);
      if (announcement) {
        Object.assign(announcement, updates);
        this._cache = null;
        localStorage.setItem('appData', JSON.stringify(data));
      }
    }
  }

  deleteAnnouncement(id) {
    const data = this.getData();
    if (data.announcements) {
      data.announcements = data.announcements.filter(a => a.id !== id);
      this._cache = null;
      localStorage.setItem('appData', JSON.stringify(data));
    }
  }

  // Posts CRUD
  getPosts() {
    const data = this.getData();
    return (data.posts || []).filter(p => p.isActive);
  }

  getAllPosts() {
    const data = this.getData();
    return data.posts || [];
  }

  addPost(post) {
    const data = this.getData();
    if (!data.posts) data.posts = [];
    data.posts.push({ ...post, id: 'post' + Date.now(), createdAt: new Date().toISOString() });
    this._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));
  }

  updatePost(id, updates) {
    const data = this.getData();
    if (data.posts) {
      const post = data.posts.find(p => p.id === id);
      if (post) {
        Object.assign(post, updates);
        this._cache = null;
        localStorage.setItem('appData', JSON.stringify(data));
      }
    }
  }

  deletePost(id) {
    const data = this.getData();
    if (data.posts) {
      data.posts = data.posts.filter(p => p.id !== id);
      this._cache = null;
      localStorage.setItem('appData', JSON.stringify(data));
    }
  }

  // Feedback CRUD
  getFeedback() {
    const data = this.getData();
    return data.feedback || [];
  }

  addFeedback(feedback) {
    const data = this.getData();
    if (!data.feedback) data.feedback = [];
    data.feedback.push({ ...feedback, id: 'fb' + Date.now(), createdAt: new Date().toISOString(), status: 'pending' });
    this._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));
  }

  updateFeedbackStatus(id, status, response = null) {
    const data = this.getData();
    if (data.feedback) {
      const feedback = data.feedback.find(f => f.id === id);
      if (feedback) {
        feedback.status = status;
        if (response) feedback.response = response;
        this._cache = null;
        localStorage.setItem('appData', JSON.stringify(data));
      }
    }
  }

  deleteFeedback(id) {
    const data = this.getData();
    if (data.feedback) {
      data.feedback = data.feedback.filter(f => f.id !== id);
      this._cache = null;
      localStorage.setItem('appData', JSON.stringify(data));
    }
  }

  // User Management CRUD
  getUsers() {
    const data = this.getData();
    return data.users || [];
  }

  getStudents() {
    const data = this.getData();
    return (data.users || []).filter(u => u.role === 'student');
  }

  updateUser(id, updates) {
    const data = this.getData();
    if (data.users) {
      const user = data.users.find(u => u.id === id);
      if (user) {
        Object.assign(user, updates);
        this._cache = null;
        localStorage.setItem('appData', JSON.stringify(data));
      }
    }
  }

  deleteUser(id) {
    const data = this.getData();
    if (data.users) {
      data.users = data.users.filter(u => u.id !== id);
      this._cache = null;
      localStorage.setItem('appData', JSON.stringify(data));
    }
  }

  addUser(user) {
    const data = this.getData();
    if (!data.users) data.users = [];
    data.users.push({ ...user, id: 'user' + Date.now() });
    this._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));
  }
}

const appData = new AppData();

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

  navigate(path) {
    window.location.hash = path;
  }

  handleRouteChange() {
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
      handler(hash);
      if (typeof renderSidebar === 'function') {
        renderSidebar();
      }
    } else {
      this.navigate('/');
    }
  }

  start() {
    this.handleRouteChange();
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

// PAGE 1: HOME
function renderHome() {
  const announcements = appData.getAnnouncements();
  const posts = appData.getPosts();

  const html = `
    <div class="hero" style="position: relative; overflow: hidden;">
      <canvas id="hero-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;"></canvas>
      <div class="hero-shapes" style="position: relative; z-index: 1;">
        <div class="hero-shape hero-shape-1"></div>
        <div class="hero-shape hero-shape-2"></div>
        <div class="hero-shape hero-shape-3"></div>
      </div>
      <div class="container" style="position: relative; z-index: 1;">
        <div class="hero-content" style="position: relative; z-index: 1;">
          <h1>Expert Online Tutoring for Every Subject</h1>
          <p>Connect with qualified tutors, learn at your own pace, and achieve your learning goals</p>
          <div class="hero-cta">
            <button class="btn btn-secondary" onclick="router.navigate('/tutors')">Find Tutors</button>
            <button class="btn btn-outline" onclick="router.navigate('/role-selection')">Sign Up Free</button>
          </div>
          <div class="hero-stats">
            <div class="stat-card">
              <div class="stat-number" id="statTutors">0+</div>
              <div class="stat-label">Expert Tutors</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="statStudents">0K+</div>
              <div class="stat-label">Active Students</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" id="statSubjects">0+</div>
              <div class="stat-label">Subjects</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Announcements Section -->
    ${announcements.length > 0 ? `
    <section style="padding: 2rem 0; background: var(--color-surface); border-bottom: 1px solid var(--color-muted);">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 1.5rem;">📢 Announcements</h2>
        <div style="display: grid; gap: 1rem;">
          ${announcements.slice(0, 3).map(ann => `
            <div class="card" style="padding: 1.5rem; border-left: 4px solid ${ann.priority === 'high' ? 'var(--color-danger)' : ann.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-success)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <h3 style="margin: 0; font-size: 1.1rem;">${sanitize(ann.title)}</h3>
                <span class="badge badge-${ann.priority === 'high' ? 'danger' : ann.priority === 'medium' ? 'warning' : 'success'}" style="font-size: 0.75rem;">${ann.priority}</span>
              </div>
              <p class="text-muted" style="margin: 0; font-size: 0.95rem;">${sanitize(ann.content)}</p>
              <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--color-text-secondary);">${new Date(ann.createdAt).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <!-- Posts Section -->
    ${posts.length > 0 ? `
    <section style="padding: 3rem 0; border-bottom: 1px solid var(--color-muted);">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 2rem;">📝 Latest Posts</h2>
        <div class="grid-3">
          ${posts.slice(0, 3).map(post => `
            <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column;">
              <span class="badge badge-secondary" style="align-self: flex-start; margin-bottom: 0.75rem; font-size: 0.8rem;">${sanitize(post.category)}</span>
              <h3 style="margin: 0 0 0.75rem 0; font-size: 1.1rem;">${sanitize(post.title)}</h3>
              <p class="text-muted" style="margin: 0 0 1rem 0; font-size: 0.9rem; flex-grow: 1;">${sanitize(post.content.substring(0, 100))}...</p>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary);">${new Date(post.createdAt).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <!-- Category Subjects Grid Section -->
    <section class="subjects" style="padding: 3rem 0; border-bottom: 1px solid var(--color-muted);">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 2rem;">Explore Subjects</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1.5rem;">
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Math')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📐</div>
            <h4 style="margin: 0; font-size: 1.1rem;">Math</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Science')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔬</div>
            <h4 style="margin: 0; font-size: 1.1rem;">Science</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=English')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📚</div>
            <h4 style="margin: 0; font-size: 1.1rem;">English</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Languages')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🗣️</div>
            <h4 style="margin: 0; font-size: 1.1rem;">Languages</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Technology')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">💻</div>
            <h4 style="margin: 0; font-size: 1.1rem;">Technology</h4>
          </div>
          <div class="subject-card text-center" onclick="router.navigate('/tutors?subject=Arts')" style="cursor: pointer; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-muted); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎨</div>
            <h4 style="margin: 0; font-size: 1.1rem;">Arts</h4>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works bg-surface" style="padding: 4rem 0; border-bottom: 1px solid var(--color-muted);">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 3rem;">How It Works</h2>
        <div class="grid-3">
          <div class="step-card text-center" style="padding: 2rem; background: var(--color-background); border-radius: var(--radius-xl); border: 1px solid var(--color-muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">1. Search Tutors</h3>
            <p class="text-muted" style="font-size: 0.95rem; margin-bottom: 0;">Browse expert educators and pre-filter by specific categories, price, or rating.</p>
          </div>
          <div class="step-card text-center" style="padding: 2rem; background: var(--color-background); border-radius: var(--radius-xl); border: 1px solid var(--color-muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">2. Book a Session</h3>
            <p class="text-muted" style="font-size: 0.95rem; margin-bottom: 0;">Schedule instantly using our brand-new 3-step checkout stepper forms.</p>
          </div>
          <div class="step-card text-center" style="padding: 2rem; background: var(--color-background); border-radius: var(--radius-xl); border: 1px solid var(--color-muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">3. Learn & Grow</h3>
            <p class="text-muted" style="font-size: 0.95rem; margin-bottom: 0;">Participate in video calls, submit homework, and complete leaderboard challenges.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Student Testimonials Section -->
    <section class="testimonials" style="padding: 4rem 0;">
      <div class="container">
        <h2 class="section-title text-center" style="margin-bottom: 3rem;">What Our Students Say</h2>
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
              <p style="font-style: italic; margin-bottom: 1.5rem; color: var(--color-text-secondary); line-height: 1.6;">"I love the XP system, the leaderboard, and the interactive AI chatbot. It makes learning feel like a fun game!"</p>
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

    <!-- Call to Action -->
    <section class="bg-light" style="padding: 3rem 0; border-top: 1px solid var(--color-muted);">
      <div class="container">
        <div class="card" style="text-align: center; padding: 3rem;">
          <h2>Ready to Start Learning?</h2>
          <p class="text-muted" style="margin-bottom: 1.5rem;">Join thousands of active students improving their school performance today</p>
          <button class="btn btn-primary btn-lg" onclick="router.navigate('/role-selection')">Get Started Now</button>
        </div>
      </div>
    </section>
  `;
  UI.setContent(html);

  // Initialize hero particle animation
  setTimeout(() => {
    const cleanup = initHeroParticles();
    if (cleanup) {
      window.addEventListener('hashchange', cleanup, { once: true });
    }
  }, 0);

  // Stats Count-up Trigger
  setTimeout(() => {
    UI.animateCountUp(document.getElementById('statTutors'), 500, '+');
    UI.animateCountUp(document.getElementById('statStudents'), 10, 'K+');
    UI.animateCountUp(document.getElementById('statSubjects'), 50, '+');
  }, 50);
}

// PAGE 2: ROLE SELECTION
function renderRoleSelection() {
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
          <button class="btn btn-primary btn-lg" onclick="router.navigate('/signup/student')">Sign Up as Student</button>
        </div>

        <div class="role-card">
          <div class="role-icon">👨‍🏫</div>
          <h2>I'm a Tutor</h2>
          <ul class="role-benefits">
            <li>Connect with students worldwide</li>
            <li>Set your own hourly rate</li>
            <li>Flexible teaching schedule</li>
            <li>Build your tutoring business</li>
          </ul>
          <button class="btn btn-primary btn-lg" onclick="router.navigate('/signup/tutor')">Sign Up as Tutor</button>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);
}

// PAGE 3: STUDENT SIGN UP
function renderStudentSignUp() {
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
            <label class="form-label">Grade Level</label>
            <select class="form-select" required>
              <option value="">Select grade level</option>
              <option value="Elementary">Elementary School</option>
              <option value="Middle School">Middle School</option>
              <option value="High School">High School</option>
              <option value="College">College</option>
              <option value="Adult">Adult Learner</option>
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

  document.getElementById('studentSignupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[type="text"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const gradeLevel = form.querySelector('select').value;
    const interests = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    
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

    const newStudent = {
      id: 'user' + Date.now(),
      name,
      email,
      role: 'student',
      gradeLevel,
      interests,
      avatar: '👤'
    };

    data.users.push(newStudent);
    appData._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));

    appData.setCurrentUser(newStudent);
    renderSidebar();

    UI.showAlert('Account created! Welcome to Aroosh\'s Tutors!', 'success');
    setTimeout(() => router.navigate('/student-dashboard'), 1000);
  });
}

// PAGE 4: TUTOR SIGN UP
function renderTutorSignUp() {
  const html = `
    <div class="container-sm" style="padding: 2rem var(--spacing-md); max-width: 580px;">
      <h1 class="text-center mb-lg">Become a Tutor</h1>

      <div class="card mb-lg" style="border-left: 4px solid var(--color-warning);">
        <div style="padding: 0.5rem 0;">
          <p style="margin: 0; font-size: 0.95rem;"><strong>Instant Application Approval:</strong> Your registration will be approved immediately for ease of demonstration.</p>
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
            <label class="form-label">Hourly Rate ($)</label>
            <input type="number" class="form-input" placeholder="25" min="10" max="200" required>
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

  document.getElementById('tutorSignupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[placeholder="Your full name"]').value.trim();
    const email = form.querySelector('input[placeholder="your@email.com"]').value.trim();
    const bio = form.querySelector('textarea').value.trim();
    const experience = form.querySelector('select').value;
    const qualifications = form.querySelector('input[placeholder="e.g., B.Sc Mathematics, M.Ed"]').value.trim();
    const hourlyRate = parseInt(form.querySelector('input[type="number"]').value);
    const subjects = Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

    if (!name || !email || !bio || !experience || !qualifications || !hourlyRate) {
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

    const newTutor = {
      id: 'tutor' + Date.now(),
      name,
      email,
      role: 'tutor',
      bio,
      experience,
      qualifications,
      hourlyRate,
      subjects,
      avatar: '👨‍🏫',
      rating: 5.0,
      totalReviews: 0,
      isAvailable: true,
      yearsOfExperience: parseInt(experience) || 3,
      experienceLevel: 'Expert',
      availability: []
    };

    data.users.push(newTutor);

    if (!data.tutorApplications) data.tutorApplications = [];
    data.tutorApplications.push({
      id: 'app' + Date.now(),
      name,
      email,
      bio,
      experience,
      qualifications,
      hourlyRate,
      subjects,
      status: 'approved',
      appliedDate: new Date().toISOString().split('T')[0]
    });

    appData._cache = null;
    localStorage.setItem('appData', JSON.stringify(data));

    appData.setCurrentUser(newTutor);
    renderSidebar();

    UI.showAlert('Account created! Welcome to Aroosh\'s Tutors!', 'success');
    setTimeout(() => router.navigate('/tutor-dashboard'), 1000);
  });
}

// PAGE 5: FIND TUTORS
// [DECLARED GLOBALLY SO SKELETON HANDLER WORKS PERFECTLY]
function renderFindTutors() {
  const tutors = appData.getTutors();
  
  // Quick UX: Pre-selected subject parser
  const hash = window.location.hash;
  let preselectedSubject = '';
  if (hash.includes('?subject=')) {
    preselectedSubject = decodeURIComponent(hash.split('?subject=')[1]);
  }

  // 600ms Skeleton Loader
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

  setTimeout(() => {
    // Check if the user navigated away within 600ms
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
              <option value="price">Lowest Price</option>
            </select>
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
        filtered = filtered.filter(t => t.name.toLowerCase().includes(filters.search.toLowerCase()));
      }
      if (filters.subject) {
        filtered = filtered.filter(t => t.subjects.includes(filters.subject));
      }
      if (filters.sort === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (filters.sort === 'price') {
        filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
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
        const availBadge = tutor.isAvailable 
          ? `<span class="badge badge-success" style="font-size: 11px; padding: 4px 8px; margin-bottom: 0.5rem; display: inline-block;">● Available Today</span>`
          : `<span class="badge badge-secondary" style="font-size: 11px; padding: 4px 8px; margin-bottom: 0.5rem; display: inline-block; background: #94a3b8; color: white;">● Unavailable</span>`;

        const subPills = tutor.subjects.map(s => `<span class="subject-tag" style="margin: 2px; font-size: 11px; padding: 2px 6px;">${sanitize(s)}</span>`).join('');

        return `
          <div class="tutor-card animate-fade-in-up card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div class="tutor-avatar" style="margin: 0; font-size: 2.5rem; width: 60px; height: 60px; background: var(--color-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center;">${sanitize(tutor.avatar)}</div>
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
              <div class="tutor-meta" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-muted); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div class="rating-display" style="font-size: 0.85rem;">
                    ${UI.renderStars(Math.round(tutor.rating))}
                    <span class="rating-count" style="font-size: 11px;">(${sanitize(tutor.totalReviews)})</span>
                  </div>
                </div>
                <div class="tutor-rate" style="font-weight: 700; color: var(--color-primary); font-size: 1.15rem;">$${sanitize(tutor.hourlyRate)}/hr</div>
              </div>
              <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0.5rem 0;">
                ${sanitize(tutor.yearsOfExperience)} yrs exp • ${sanitize(tutor.experienceLevel)}
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

    document.getElementById('searchInput').addEventListener('input', (e) => {
      filters.search = e.target.value;
      updateDisplay();
    });

    document.getElementById('subjectFilter').addEventListener('change', (e) => {
      filters.subject = e.target.value;
      updateDisplay();
    });

    document.getElementById('sortBy').addEventListener('change', (e) => {
      filters.sort = e.target.value;
      updateDisplay();
    });
  }, 600);
}

// PAGE 6: TUTOR PROFILE
function renderTutorProfile(hash) {
  const tutorId = hash.split('/')[2];
  const tutor = appData.getTutorById(tutorId);
  const reviews = appData.getReviews().filter(r => r.tutorId === tutorId);

  if (!tutor) {
    router.navigate('/tutors');
    return;
  }

  const html = `
    <div class="container profile-container-mobile" style="padding: 2rem 0;">
      <button class="btn btn-ghost mb-lg" onclick="router.navigate('/tutors')">&larr; Back to Tutors</button>

      <div class="profile-header">
        <div class="profile-avatar">${sanitize(tutor.avatar)}</div>
        <div class="profile-info">
          <div class="profile-name">${sanitize(tutor.name)}</div>
          <div class="rating-display" style="margin-bottom: 1rem;">
            ${UI.renderStars(Math.round(tutor.rating))}
            <span class="rating-count">(${sanitize(tutor.totalReviews)} reviews)</span>
          </div>
          <div class="profile-meta">
            <div class="profile-meta-item">
              <div class="profile-meta-label">Hourly Rate</div>
              <div class="profile-meta-value">$${sanitize(tutor.hourlyRate)}</div>
            </div>
            <div class="profile-meta-item">
              <div class="profile-meta-label">Experience</div>
              <div class="profile-meta-value">${sanitize(tutor.yearsOfExperience)} years</div>
            </div>
            <div class="profile-meta-item">
              <div class="profile-meta-label">Status</div>
              <div class="profile-meta-value" style="color: ${tutor.isAvailable ? '#10B981' : '#EF4444'};">
                ${tutor.isAvailable ? '● Available Today' : '● Unavailable'}
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
      <div>
        <div style="font-weight: 800; font-size: 1.25rem; color: var(--color-primary);">$${sanitize(tutor.hourlyRate)}/hr</div>
        <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${UI.renderStars(Math.round(tutor.rating))}</div>
      </div>
      <button class="btn btn-primary" onclick="bookSession('${tutorId}', '${sanitize(tutor.name)}')">Book Now</button>
    </div>
  `;
  UI.setContent(html);
}

// Global Multi-step Booking Stepper Controller
window.bookSession = (tutorId, tutorName) => {
  const tutor = appData.getTutorById(tutorId);
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
          <input type="date" class="form-input" id="stepDate" value="${date}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Select Time</label>
          <input type="time" class="form-input" id="stepTime" value="${time}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <select class="form-select" id="stepSubject" required>
            <option value="">Select subject</option>
            ${subjects.map(s => `<option value="${s}" ${s === subject ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Duration (minutes)</label>
          <input type="number" class="form-input" id="stepDuration" value="${duration}" min="30" max="180" required>
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
          <textarea class="form-textarea" id="stepNotes" rows="4" placeholder="Mention any homework topics or specific challenges you have...">${notes}</textarea>
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
      studentId: student.id,
      tutorId: tutorId,
      date: date,
      time: time,
      duration: parseInt(duration),
      subject: subject,
      status: 'pending',
      notes: notes
    };

    appData.addBooking(newBooking);
    UI.showAlert('Session successfully requested!', 'success');
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
    UI.showAlert('Message sent!', 'success');
    modal.remove();
  });
}

// PAGE 7: STUDENT DASHBOARD
function renderStudentDashboard() {
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

  setTimeout(() => {
    if (router.currentPage !== '/student-dashboard') return;

    const bookings = appData.getBookings().filter(b => b.studentId === (user?.id || 'user1'));
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

    // Leaderboard streak and points
    const studentLeaderboard = appData.getLeaderboard().students;
    const currentStudent = studentLeaderboard.find(s => s.name === (user?.name || 'Rahul Kumar'));
    const streak = currentStudent ? currentStudent.streak : 12;
    const points = currentStudent ? currentStudent.points : 2320;

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
        <h1 class="mb-lg">Welcome back, ${user ? sanitize(user.name) : 'Student'}!</h1>

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
              ${bookings.map(booking => `
                <div class="session-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--color-muted);">
                  <div class="session-info">
                    <div class="session-title" style="font-weight: 600; font-size: 1.05rem;">${sanitize(booking.subject)} Session with Tutor</div>
                    <div class="session-meta text-muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
                      <span style="margin-right: 1rem;">📅 ${sanitize(booking.date)}</span>
                      <span style="margin-right: 1rem;">⏰ ${sanitize(booking.time)}</span>
                      <span>⏱️ ${sanitize(booking.duration)} mins</span>
                    </div>
                  </div>
                  <div class="session-actions" style="display: flex; align-items: center; gap: 1rem;">
                    ${UI.getStatusBadge(booking.status)}
                    ${booking.status === 'completed' ? `<button class="btn btn-sm btn-primary" onclick="leaveReview('${booking.id}')">Leave Review</button>` : ''}
                  </div>
                </div>
              `).join('')}
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
  }, 600);
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
function renderTutorDashboard() {
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

  setTimeout(() => {
    if (router.currentPage !== '/tutor-dashboard') return;

    const bookings = appData.getBookings();
    const tutorBookings = bookings.filter(b => b.tutorId === (user?.id || 'tutor1'));
    
    const tutorUser = appData.getTutorById(user?.id || 'tutor1');
    const rate = tutorUser ? tutorUser.hourlyRate : 25;
    
    const pending = tutorBookings.filter(b => b.status === 'pending');
    const active = tutorBookings.filter(b => b.status === 'confirmed');
    const completed = tutorBookings.filter(b => b.status === 'completed');
    
    // Earnings summary card: complete bookings * rate
    const totalEarnings = completed.reduce((sum, b) => sum + (b.duration / 60) * rate, 0);

    const earningsCardHtml = `
      <div class="card" style="margin-bottom: 2rem; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; border: none; padding: 1.5rem; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; display: block; margin-bottom: 0.25rem;">Total Earnings</span>
          <h3 style="color: white; margin: 0 0 0.5rem 0; font-size: 2.25rem; font-weight: 800;">$${totalEarnings.toFixed(2)}</h3>
          <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">Calculated from ${completed.length} completed tutoring sessions at $${rate}/hr</p>
        </div>
        <div style="font-size: 3.5rem; opacity: 0.9;">💰</div>
      </div>
    `;

    // Priority Sort Bookings (Pending -> Confirmed -> Completed)
    const priorityBookings = [...pending, ...active, ...completed, ...tutorBookings.filter(b => b.status === 'cancelled')];

    const actualHtml = `
      <div class="container" style="padding: 2rem 0;">
        <h1 class="mb-lg">Tutor Dashboard</h1>

        ${earningsCardHtml}

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
              ${pending.map(booking => `
                <div class="session-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--color-muted);">
                  <div class="session-info">
                    <div style="font-weight: 700; font-size: 1.05rem;">${sanitize(booking.subject)} Session Request</div>
                    <div class="session-meta text-muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
                      <span style="margin-right: 1rem;">📅 ${sanitize(booking.date)}</span>
                      <span style="margin-right: 1rem;">⏰ ${sanitize(booking.time)}</span>
                      <span>⏱️ ${sanitize(booking.duration)} mins</span>
                    </div>
                  </div>
                  <div class="session-actions" style="display: flex; align-items: center; gap: 0.5rem;">
                    <button class="btn btn-sm btn-success" onclick="respondRequest('${booking.id}', 'accept')">Accept</button>
                    <button class="btn btn-sm btn-danger" onclick="respondRequest('${booking.id}', 'reject')">Decline</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="card animate-fade-in-up">
          <h2 class="mb-lg">All Assigned Sessions</h2>
          ${tutorBookings.length > 0 ? `
            <div class="session-list">
              ${priorityBookings.filter(b => b.status !== 'pending').map(booking => `
                <div class="session-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--color-muted);">
                  <div class="session-info">
                    <div style="font-weight: 600; font-size: 1.05rem;">${sanitize(booking.subject)} Session</div>
                    <div class="session-meta text-muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
                      <span style="margin-right: 1rem;">📅 ${sanitize(booking.date)}</span>
                      <span style="margin-right: 1rem;">⏰ ${sanitize(booking.time)}</span>
                      <span style="margin-right: 1rem;">⏱️ ${sanitize(booking.duration)} mins</span>
                      <span>Rate: $${rate}/hr</span>
                    </div>
                  </div>
                  <div class="session-actions" style="display: flex; align-items: center; gap: 1rem;">
                    ${UI.getStatusBadge(booking.status)}
                  </div>
                </div>
              `).join('')}
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
  }, 600);
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
function renderChat() {
  const messages = appData.getMessages();
  const contacts = [
    { id: 'tutor1', name: 'Priya Singh', role: 'Tutor', avatar: '👨‍🏫' },
    { id: 'tutor2', name: 'Amit Patel', role: 'Tutor', avatar: '👨‍🏫' },
    { id: 'tutor3', name: 'Sophia Chen', role: 'Tutor', avatar: '👩‍🏫' }
  ];

  const html = `
    <div class="chat-container">
      <div class="chat-sidebar">
        <ul class="chat-list" id="chatList">
          ${contacts.map(contact => `
            <li class="chat-item ${contact.id === 'tutor1' ? 'active' : ''}" onclick="selectChat('${contact.id}', this)">
              <div class="chat-item-name">${sanitize(contact.name)}</div>
              <div class="chat-item-message">${sanitize(contact.role)}</div>
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="chat-main">
        <div class="chat-messages" id="chatMessages">
          ${messages.length > 0 ? messages.slice(0, 8).map(msg => `
            <div class="message ${msg.senderId === 'user1' ? 'sent' : 'received'}">
              <div class="message-bubble">${sanitize(msg.content)}</div>
            </div>
          `).join('') : `
            <div class="empty-state" style="border: none; background: transparent;">
              <div class="empty-state-icon" style="font-size: 3.5rem; margin-bottom: 0.5rem;">💬</div>
              <h4>No conversation history. Send a message to start!</h4>
            </div>
          `}
        </div>

        <div class="chat-input">
          <input type="text" id="messageInput" placeholder="Type a message..." />
          <button class="btn btn-primary" onclick="sendChatMessage()">Send</button>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);
}

window.selectChat = (contactId, element) => {
  document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  UI.showAlert('Switched conversation thread.', 'success');
};

window.sendChatMessage = () => {
  const input = document.getElementById('messageInput');
  if (input && input.value.trim()) {
    const newMsg = {
      senderId: 'user1',
      recipientId: 'tutor1',
      content: input.value,
      timestamp: new Date().toISOString(),
      read: false
    };
    appData.addMessage(newMsg);
    input.value = '';
    renderChat();
  }
};

// PAGE 10: ASSIGNMENTS
function renderAssignments() {
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
function renderSchedule() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const getDaysInMonth = (m) => new Date(year, m + 1, 0).getDate();
  const getFirstDay = (m) => new Date(year, m, 1).getDay();

  const daysInMonth = getDaysInMonth(month);
  const firstDay = getFirstDay(month);

  let calendarDays = '';
  for (let i = 0; i < firstDay; i++) {
    calendarDays += '<div class="calendar-day disabled"></div>';
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === today.getDate();
    calendarDays += `<div class="calendar-day ${isToday ? 'today' : ''}">${i}</div>`;
  }

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">My Schedule</h1>

      <div class="grid-2">
        <div>
          <div class="calendar">
            <div class="calendar-header">
              <h3>${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month]} ${year}</h3>
              <div class="calendar-nav">
                <button class="btn btn-sm btn-secondary">←</button>
                <button class="btn btn-sm btn-secondary">→</button>
              </div>
            </div>

            <div class="calendar-grid">
              <div class="calendar-day-header">Sun</div>
              <div class="calendar-day-header">Mon</div>
              <div class="calendar-day-header">Tue</div>
              <div class="calendar-day-header">Wed</div>
              <div class="calendar-day-header">Thu</div>
              <div class="calendar-day-header">Fri</div>
              <div class="calendar-day-header">Sat</div>
              ${calendarDays}
            </div>
          </div>
        </div>

        <div>
          <div class="card">
            <h3 class="mb-lg">Available Time Slots</h3>
            <div class="availability-list">
              <div class="availability-item">
                <div class="availability-time">
                  <div class="availability-time-badge">Mon 2:00 PM - 5:00 PM</div>
                </div>
                <button class="btn btn-sm btn-danger">Remove</button>
              </div>
              <div class="availability-item">
                <div class="availability-time">
                  <div class="availability-time-badge">Wed 3:00 PM - 6:00 PM</div>
                </div>
                <button class="btn btn-sm btn-danger">Remove</button>
              </div>
              <div class="availability-item">
                <div class="availability-time">
                  <div class="availability-time-badge">Fri 1:00 PM - 4:00 PM</div>
                </div>
                <button class="btn btn-sm btn-danger">Remove</button>
              </div>
            </div>

            <h3 class="mt-lg mb-md">Add Availability</h3>
            <form id="addAvailabilityForm">
              <div class="form-group">
                <select class="form-select" required>
                  <option value="">Select Day</option>
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </div>
              <div class="form-group">
                <input type="time" class="form-input" placeholder="Start Time" required>
              </div>
              <div class="form-group">
                <input type="time" class="form-input" placeholder="End Time" required>
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

  document.getElementById('addAvailabilityForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    UI.showAlert('Time slot added successfully!', 'success');
    e.target.reset();
  });
}

// PAGE 12: VIDEO CALL
function renderVideoCall() {
  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Video Call Session</h1>

      <div class="video-timer">Session Duration: <span id="timer">00:00</span></div>

      <div class="video-container">
        <div style="color: white; text-align: center;">
          <p style="font-size: 18px; margin-bottom: 1rem;">🎥 Live Classroom Active</p>
          <p style="font-size: 14px; opacity: 0.8;">Connecting to student/tutor...</p>
        </div>
      </div>

      <div class="video-controls">
        <button class="video-control-btn" style="background-color: #10B981;" title="Unmute">🔊</button>
        <button class="video-control-btn" style="background-color: #10B981;" title="Start Video">📹</button>
        <button class="video-control-btn" style="background-color: var(--color-primary);" title="Share Screen">🖥️</button>
        <button class="video-control-btn" style="background-color: #EF4444;" title="End Call">📞</button>
      </div>
    </div>
  `;
  UI.setContent(html);

  let seconds = 0;
  const interval = setInterval(() => {
    const el = document.getElementById('timer');
    if (!el) {
      clearInterval(interval);
      return;
    }
    seconds++;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

// PAGE 13: LEADERBOARD
function renderLeaderboard() {
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

// PAGE 14: AI CHATBOT
function renderAIChatbot() {
  const html = `
    <div class="container-sm" style="padding: 2rem 0; max-width: 620px;">
      <h1 class="text-center mb-lg">AI Tutor Assistant</h1>

      <div class="ai-chat-container">
        <div class="ai-messages" id="aiMessages">
          <div class="ai-message ai">
            <div class="ai-bubble">Hi! 👋 I'm your AI tutor assistant. Ask me questions about bookings, pricing, grading, or platform policies!</div>
          </div>
        </div>

        <div class="ai-suggestions" id="aiSuggestions">
          <button class="ai-suggestion" onclick="askAI('How do I book a session?')">How do I book a session?</button>
          <button class="ai-suggestion" onclick="askAI('What\\'s your pricing?')">What's your pricing?</button>
          <button class="ai-suggestion" onclick="askAI('How does grading work?')">How does grading work?</button>
          <button class="ai-suggestion" onclick="askAI('Can I get a refund?')">Can I get a refund?</button>
        </div>

        <div class="chat-input">
          <input type="text" id="aiInput" placeholder="Ask AI a question..." />
          <button class="btn btn-primary" onclick="sendAIMessage()">Send</button>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);
}

const aiResponses = {
  'book': 'To book a session: 1) Browse tutors, 2) Select dynamic subject categories or search profiles, 3) Click "Quick Book" or "View Profile", 4) Work through the 3-step form stepper, 5) Confirm booking. Simple and quick!',
  'pricing': 'Tutor charges vary between $15 and $50/hour depending on experience level. Pre-filter by price using the sortBy dropdown!',
  'grading': 'AI auto-grading evaluates uploaded assignments immediately. Scores are graded from 100, outlining clear strengths and potential improvements.',
  'refund': 'Admins review disputes and approve refunds where sessions were cancelled or experienced technical difficulties. Feel free to request assistance.',
  'contact': 'Reach our 24/7 help desk at support@aroosh.com or raise a ticket inside the platform.',
  'payment': 'All credit/debit card, bank transfer, and PayPal transactions are fully encrypted.'
};

window.askAI = (question) => {
  const messages = document.getElementById('aiMessages');
  const input = document.getElementById('aiInput');
  if (!messages) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'ai-message user';
  userMsg.innerHTML = `<div class="ai-bubble">${sanitize(question)}</div>`;
  messages.appendChild(userMsg);

  if (input) input.value = '';

  const typingMsg = document.createElement('div');
  typingMsg.className = 'ai-message ai';
  typingMsg.innerHTML = `
    <div class="ai-bubble">
      <div class="ai-loading">
        <div class="ai-spinner"></div>
        <span>AI is analyzing...</span>
      </div>
    </div>
  `;
  messages.appendChild(typingMsg);
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    const lowerQ = question.toLowerCase();
    let response = aiResponses['contact'];
    
    if (lowerQ.includes('book')) response = aiResponses['book'];
    else if (lowerQ.includes('price') || lowerQ.includes('cost')) response = aiResponses['pricing'];
    else if (lowerQ.includes('grade') || lowerQ.includes('grading')) response = aiResponses['grading'];
    else if (lowerQ.includes('refund')) response = aiResponses['refund'];
    else if (lowerQ.includes('payment')) response = aiResponses['payment'];

    typingMsg.innerHTML = `<div class="ai-bubble">${response}</div>`;
    const sug = document.getElementById('aiSuggestions');
    if (sug) sug.style.display = 'none';
    messages.scrollTop = messages.scrollHeight;
  }, 1000);
};

window.sendAIMessage = () => {
  const input = document.getElementById('aiInput');
  if (input && input.value.trim()) {
    window.askAI(input.value);
  }
};

// PAGE 15: AI TUTOR MATCHING
function renderAITutorMatching() {
  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="text-center mb-lg">AI Tutor Matching</h1>
      <p class="text-center text-muted mb-2xl" style="max-width: 600px; margin-left: auto; margin-right: auto;">
        Answer a few details to automatically match with the best tutor fit
      </p>

      <div class="grid-2">
        <div class="card">
          <form id="matchingQuiz">
            <div class="form-group">
              <label class="form-label">Preferred Learning Style</label>
              <select class="form-select" required>
                <option value="">Select style...</option>
                <option value="Visual">Visual (diagrams, graphs, visual examples)</option>
                <option value="Auditory">Auditory (discussions, oral explanations)</option>
                <option value="Reading">Reading/Writing focused tutorials</option>
                <option value="Kinesthetic">Kinesthetic (hands-on code, practical exercises)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Subject</label>
              <select class="form-select" required>
                <option value="">Select subject...</option>
                <option value="Math">Math</option>
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Languages">Languages</option>
                <option value="Arts">Arts</option>
                <option value="Technology">Technology</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Hourly Budget Limit ($)</label>
              <input type="number" class="form-input" placeholder="30" min="10" max="150" required>
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block">Find Best AI Match</button>
          </form>
        </div>

        <div id="results" style="display: none;">
          <h2>Matched Tutors</h2>
          <div id="matchedTutors"></div>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);

  document.getElementById('matchingQuiz')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const tutors = appData.getTutors();
    const resultsDiv = document.getElementById('results');
    const form = document.getElementById('matchingQuiz').parentElement;

    const matched = tutors.slice(0, 3).map((tutor, idx) => `
      <div class="card mb-lg" style="border-left: 4px solid var(--color-success);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <div>
            <h3>${sanitize(tutor.name)}</h3>
            <div style="font-size: 1.75rem; color: var(--color-success); font-weight: 800;">${95 - idx * 5}% Match</div>
          </div>
          <div style="font-size: 3rem;">${sanitize(tutor.avatar)}</div>
        </div>
        <p><strong>Reasoning:</strong> Matches your style with ${sanitize(tutor.yearsOfExperience)} years tutoring expertise.</p>
        <p><strong>Rate:</strong> $${sanitize(tutor.hourlyRate)}/hr</p>
        <div class="rating-display" style="margin-bottom: 1rem;">
          ${UI.renderStars(Math.round(tutor.rating))}
          <span class="rating-count">(${sanitize(tutor.totalReviews)} reviews)</span>
        </div>
        <button class="btn btn-primary btn-block" onclick="router.navigate('/tutors/${tutor.id}')">View Profile & Book</button>
      </div>
    `).join('');

    form.style.display = 'none';
    resultsDiv.innerHTML = `<h2 style="margin-bottom: 1.5rem;">Your Matched Tutors</h2>` + matched;
    resultsDiv.style.display = 'block';
  });
}

// PAGE 16: AI AUTO-GRADING
function renderAIGrading() {
  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">AI Auto-Grading</h1>

      <div class="grid-2">
        <div>
          <div class="card">
            <h3 class="mb-lg">Upload Homework File</h3>
            <div class="file-upload-area" id="dropZone" style="cursor: pointer; text-align: center; border: 2px dashed var(--color-muted); padding: 2rem; border-radius: var(--radius-lg);">
              <div class="file-upload-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">📄</div>
              <p>Drop file here or click to upload (PDF, DOCX, TXT)</p>
              <input type="file" id="fileInput" style="display: none;" accept=".pdf,.docx,.txt" />
            </div>

            <h3 class="mt-2xl mb-lg">Recent AI Autograded Submissions</h3>
            <div class="assignment-list">
              <div class="assignment-item" onclick="selectSubmission(0)">
                <h4>Math Calculus Sheet</h4>
                <p class="text-sm text-muted">Grade: 88/100</p>
              </div>
              <div class="assignment-item" onclick="selectSubmission(1)">
                <h4>Science lab report</h4>
                <p class="text-sm text-muted">Grade: 92/100</p>
              </div>
              <div class="assignment-item" onclick="selectSubmission(2)">
                <h4>Literature Essay Draft</h4>
                <p class="text-sm text-muted">Grade: 85/100</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="card" id="submissionDetail">
            <div class="assignment-detail-empty">
              <p>Select submission item to inspect AI grading summary</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  UI.setContent(html);

  const submissions = [
    { title: 'Math Calculus Sheet', score: 88, strengths: ['Step-by-step working clearly documented', 'Correct trigonometric formulas used'], improvements: ['Minor arithmetic mistake in Q14', 'Provide explanations for visual graphs'] },
    { title: 'Science lab report', score: 92, strengths: ['Excellent scientific analysis of data points', 'Pristine lab abstract and formatting'], improvements: ['Provide additional bibliographical references'] },
    { title: 'Literature Essay Draft', score: 85, strengths: ['Strong thesis and introduction', 'Solid literary examples used'], improvements: ['Conclusion paragraph could be expanded', 'Double check spelling / proofread'] }
  ];

  window.selectSubmission = (idx) => {
    const sub = submissions[idx];
    const detail = document.getElementById('submissionDetail');
    if (!detail) return;
    detail.innerHTML = `
      <h2 style="text-align: center; color: var(--color-primary); margin-bottom: 0.5rem; font-size: 3.5rem; font-weight: 800;">${sub.score}/100</h2>
      <p style="text-align: center; color: var(--color-text-secondary); margin-bottom: 2rem;">Graded automatically by AI System</p>

      <div style="margin-bottom: 2rem;">
        <h3 style="color: #10B981; margin-bottom: 0.5rem;">✓ Major Strengths</h3>
        ${sub.strengths.map(s => `<div style="padding: 0.25rem 0; font-size: 0.95rem;">• ${s}</div>`).join('')}
      </div>

      <div>
        <h3 style="color: #f59e0b; margin-bottom: 0.5rem;">⚠️ Improvement Areas</h3>
        ${sub.improvements.map(i => `<div style="padding: 0.25rem 0; font-size: 0.95rem;">• ${i}</div>`).join('')}
      </div>
    `;
  };

  const zone = document.getElementById('dropZone');
  const input = document.getElementById('fileInput');
  zone?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      UI.showAlert('File uploaded! AI grading is starting...', 'success');
      setTimeout(() => {
        UI.showAlert('AI Auto-grading complete! Grade: ' + Math.floor(Math.random() * 15 + 80) + '/100', 'success');
      }, 1500);
    }
  });
}

// PAGE 17: ADMIN DASHBOARD
function renderAdminDashboard() {
  const user = appData.getCurrentUser();
  if (!user || user.role !== 'admin') {
    UI.showAlert('Access Denied. Admin privilege required.', 'danger');
    router.navigate('/');
    return;
  }

  const pendingApps = appData.getTutorApplications().filter(a => a.status === 'pending');

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Admin Dashboard</h1>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">👥</div>
          <div class="kpi-content">
            <h3>1,250</h3>
            <div class="kpi-label">Total Users</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">👨‍🏫</div>
          <div class="kpi-content">
            <h3>450</h3>
            <div class="kpi-label">Active Tutors</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📚</div>
          <div class="kpi-content">
            <h3>8,932</h3>
            <div class="kpi-label">Total Bookings</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-content">
            <h3>$125K</h3>
            <div class="kpi-label">Total Revenue</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⭐</div>
          <div class="kpi-content">
            <h3>4.8</h3>
            <div class="kpi-label">Avg Rating</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📈</div>
          <div class="kpi-content">
            <h3>+24%</h3>
            <div class="kpi-label">Growth</div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 class="mb-lg">Recent Bookings</h3>
          <div>
            <div class="session-item" style="margin-bottom: 1rem;">
              <div class="session-info">
                <div class="session-title">Math Session - Rahul & Priya</div>
                <div class="session-meta"><span>2 hours ago</span></div>
              </div>
              <div>${UI.getStatusBadge('completed')}</div>
            </div>
            <div class="session-item" style="margin-bottom: 1rem;">
              <div class="session-info">
                <div class="session-title">English Session - Zara & Amit</div>
                <div class="session-meta"><span>5 hours ago</span></div>
              </div>
              <div>${UI.getStatusBadge('confirmed')}</div>
            </div>
            <div class="session-item">
              <div class="session-info">
                <div class="session-title">Science Session - Vikram & Sophia</div>
                <div class="session-meta"><span>1 day ago</span></div>
              </div>
              <div>${UI.getStatusBadge('completed')}</div>
            </div>
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
    </div>
  `;
  UI.setContent(html);
}

window.approveApplicationDashboard = (appId) => {
  appData.approveTutorApplication(appId);
  UI.showAlert('Application approved instantly! Tutor added to platform.', 'success');
  renderAdminDashboard();
};

window.rejectApplicationDashboard = (appId) => {
  appData.rejectTutorApplication(appId);
  UI.showAlert('Application rejected successfully.', 'warning');
  renderAdminDashboard();
};

// PAGE 18: ADMIN ANALYTICS
function renderAdminAnalytics() {
  const user = appData.getCurrentUser();
  if (!user || user.role !== 'admin') {
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

// PAGE 19: ADMIN TUTOR APPROVALS
function renderAdminApprovals() {
  const user = appData.getCurrentUser();
  if (!user || user.role !== 'admin') {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const pendingApps = appData.getTutorApplications().filter(a => a.status === 'pending');

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Tutor Applications</h1>

      <div class="grid-2">
        <div>
          <h3 class="mb-lg">Applications list</h3>
          ${pendingApps.length > 0 ? pendingApps.map((app, idx) => `
            <div class="approval-card card mb-md" onclick="selectApplication(${idx})" style="cursor: pointer; padding: 1rem;">
              <div>
                <div class="approval-name" style="font-weight: 700;">${sanitize(app.name)}</div>
                <div class="approval-email text-muted" style="font-size: 0.85rem;">${sanitize(app.email)}</div>
              </div>
              <div style="margin-top: 0.5rem;">${UI.getStatusBadge(app.status)}</div>
            </div>
          `).join('') : '<p class="text-muted">No pending tutor applications.</p>'}
        </div>

        <div id="appDetail" class="card">
          <div class="assignment-detail-empty"><p>Select an application to view detailed credentials</p></div>
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
        <p><strong>Hourly Rate:</strong> $${sanitize(app.hourlyRate)}/hr</p>
      </div>
      <div style="margin: 1.5rem 0;">
        <strong>Subjects:</strong>
        <div style="margin-top: 0.5rem;">
          ${app.subjects.map(s => `<span class="subject-tag">${sanitize(s)}</span>`).join('')}
        </div>
      </div>
      <div style="margin: 1.5rem 0;">
        <strong>Tutor Bio Statement:</strong>
        <p>${sanitize(app.bio)}</p>
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-success" style="flex: 1;" onclick="approveApplication('${app.id}')">Approve Application</button>
        <button class="btn btn-danger" style="flex: 1;" onclick="rejectApplication('${app.id}')">Reject</button>
      </div>
    `;
  };
}

window.approveApplication = (appId) => {
  appData.approveTutorApplication(appId);
  UI.showAlert('Application approved successfully!', 'success');
  renderAdminApprovals();
};

window.rejectApplication = (appId) => {
  appData.rejectTutorApplication(appId);
  UI.showAlert('Application rejected.', 'warning');
  renderAdminApprovals();
};

// PAGE 20: ADMIN DISPUTES
function renderAdminDisputes() {
  const user = appData.getCurrentUser();
  if (!user || user.role !== 'admin') {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const disputes = appData.getDisputesList();
  const refunds = appData.getRefundsList();

  const html = `
    <div class="container" style="padding: 2rem 0;">
      <h1 class="mb-lg">Disputes & Refunds</h1>

      <div class="tab-container">
        <button class="tab active" onclick="switchDisputeTab(0)">Disputes (${disputes.length})</button>
        <button class="tab" onclick="switchDisputeTab(1)">Refunds (${refunds.length})</button>
      </div>

      <div id="disputeTab" class="tab-content active">
        ${disputes.map(dispute => `
          <div class="card mb-lg" style="padding: 1.5rem; border-left: 4px solid var(--color-primary);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <h3 style="margin: 0;">${sanitize(dispute.caseNumber)}</h3>
                <p class="text-muted" style="margin: 0; font-size: 0.85rem;">Filed: ${sanitize(dispute.filedDate)}</p>
              </div>
              <div>${UI.getStatusBadge(dispute.status)}</div>
            </div>
            <div style="background-color: var(--color-background); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--color-muted);">
              <p style="margin-bottom: 0.25rem;"><strong>Claimed:</strong> $${sanitize(dispute.claimedAmount)}</p>
              <p style="margin-bottom: 0.25rem;"><strong>Student:</strong> ${sanitize(dispute.studentName)}</p>
              <p style="margin-bottom: 0.25rem;"><strong>Tutor:</strong> ${sanitize(dispute.tutorName)}</p>
              <p style="margin-bottom: 0.25rem;"><strong>Reason:</strong> ${sanitize(dispute.reason)}</p>
              <p style="margin: 0;"><strong>Description:</strong> ${sanitize(dispute.description)}</p>
            </div>
            ${dispute.status === 'open' ? `
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-success" onclick="resolveDispute('${dispute.id}', 'approve')">Approve & Refund</button>
                <button class="btn btn-sm btn-danger" onclick="resolveDispute('${dispute.id}', 'reject')">Reject Dispute</button>
              </div>
            ` : `
              <p style="margin: 0; font-size: 0.9rem;"><strong>Resolution:</strong> ${sanitize(dispute.resolution)}</p>
            `}
          </div>
        `).join('')}
      </div>

      <div id="refundTab" class="tab-content">
        ${refunds.map(refund => `
          <div class="card mb-lg" style="padding: 1.5rem; border-left: 4px solid var(--color-primary);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <h3 style="margin: 0;">${sanitize(refund.studentName)}</h3>
                <p class="text-muted" style="margin: 0; font-size: 0.85rem;">Session: ${sanitize(refund.sessionDate)}</p>
              </div>
              <div>${UI.getStatusBadge(refund.status)}</div>
            </div>
            <div style="background-color: var(--color-background); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--color-muted);">
              <p style="margin-bottom: 0.25rem;"><strong>Amount:</strong> $${sanitize(refund.amount)}</p>
              <p style="margin: 0;"><strong>Reason:</strong> ${sanitize(refund.reason)}</p>
            </div>
            ${refund.status === 'pending' ? `
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-success" onclick="approveRefund('${refund.id}')">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="rejectRefund('${refund.id}')">Reject</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
  UI.setContent(html);
}

window.switchDisputeTab = (tabIndex) => {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach((t, i) => t.classList.toggle('active', i === tabIndex));
  contents.forEach((c, i) => c.classList.toggle('active', i === tabIndex));
};

window.resolveDispute = (id, action) => {
  const status = action === 'approve' ? 'resolved' : 'rejected';
  const resolution = action === 'approve' ? 'Refund Approved' : 'Dispute Rejected';
  appData.updateDisputeStatus(id, status, resolution);
  const msg = action === 'approve' ? 'Dispute resolved - refund approved!' : 'Dispute rejected.';
  UI.showAlert(msg, action === 'approve' ? 'success' : 'warning');
  renderAdminDisputes();
};

window.approveRefund = (id) => {
  appData.updateRefundStatus(id, 'approved');
  UI.showAlert('Refund successfully approved!', 'success');
  renderAdminDisputes();
};

window.rejectRefund = (id) => {
  appData.updateRefundStatus(id, 'rejected');
  UI.showAlert('Refund rejected.', 'warning');
  renderAdminDisputes();
};

// PAGE 21: ADMIN ANNOUNCEMENTS & POSTS
function renderAdminAnnouncements() {
  const user = appData.getCurrentUser();
  if (!user || user.role !== 'admin') {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const announcements = appData.getAllAnnouncements();
  const posts = appData.getAllPosts();

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
                  <span>${new Date(ann.createdAt).toLocaleDateString()}</span>
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
                  <span>${new Date(post.createdAt).toLocaleDateString()}</span>
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

  document.getElementById('announcementForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const announcement = {
      title: document.getElementById('announcementTitle').value,
      content: document.getElementById('announcementContent').value,
      priority: document.getElementById('announcementPriority').value,
      type: 'announcement',
      createdBy: user.id,
      isActive: true
    };
    appData.addAnnouncement(announcement);
    UI.showAlert('Announcement created!', 'success');
    renderAdminAnnouncements();
  });

  document.getElementById('postForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mediaFile = document.getElementById('postMedia').files[0];
    let mediaUrl = null;
    let mediaType = null;

    if (mediaFile) {
      const reader = new FileReader();
      mediaUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(mediaFile);
      });
      mediaType = mediaFile.type;
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
    appData.addPost(post);
    UI.showAlert('Post created!', 'success');
    renderAdminAnnouncements();
  });
}

window.switchAnnouncementTab = (tabIndex) => {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach((t, i) => t.classList.toggle('active', i === tabIndex));
  contents.forEach((c, i) => c.classList.toggle('active', i === tabIndex));
};

window.toggleAnnouncement = (id) => {
  const announcements = appData.getAllAnnouncements();
  const ann = announcements.find(a => a.id === id);
  if (ann) {
    appData.updateAnnouncement(id, { isActive: !ann.isActive });
    UI.showAlert(`Announcement ${ann.isActive ? 'deactivated' : 'activated'}!`, 'success');
    renderAdminAnnouncements();
  }
};

window.deleteAnnouncement = (id) => {
  if (confirm('Are you sure you want to delete this announcement?')) {
    appData.deleteAnnouncement(id);
    UI.showAlert('Announcement deleted!', 'success');
    renderAdminAnnouncements();
  }
};

window.editAnnouncement = (id) => {
  const announcements = appData.getAllAnnouncements();
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

window.togglePost = (id) => {
  const posts = appData.getAllPosts();
  const post = posts.find(p => p.id === id);
  if (post) {
    appData.updatePost(id, { isActive: !post.isActive });
    UI.showAlert(`Post ${post.isActive ? 'deactivated' : 'activated'}!`, 'success');
    renderAdminAnnouncements();
  }
};

window.deletePost = (id) => {
  if (confirm('Are you sure you want to delete this post?')) {
    appData.deletePost(id);
    UI.showAlert('Post deleted!', 'success');
    renderAdminAnnouncements();
  }
};

window.editPost = (id) => {
  const posts = appData.getAllPosts();
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
        const reader = new FileReader();
        mediaUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(mediaFile);
        });
        mediaType = mediaFile.type;
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

window.removePostMedia = (id) => {
  appData.updatePost(id, { mediaType: null, mediaUrl: null });
  UI.showAlert('Media removed!', 'success');
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
  renderAdminAnnouncements();
};

// PAGE 22: ADMIN FEEDBACK
function renderAdminFeedback() {
  const user = appData.getCurrentUser();
  if (!user || user.role !== 'admin') {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const feedback = appData.getFeedback();

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
                <span>${new Date(fb.createdAt).toLocaleDateString()}</span>
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

window.respondToFeedback = (id) => {
  const feedback = appData.getFeedback();
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
    document.getElementById('feedbackResponseForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      appData.updateFeedbackStatus(id, 'resolved', document.getElementById('feedbackResponse').value);
      UI.showAlert('Response sent!', 'success');
      modal.remove();
      renderAdminFeedback();
    });
  }
};

window.resolveFeedback = (id) => {
  appData.updateFeedbackStatus(id, 'resolved');
  UI.showAlert('Feedback marked as resolved!', 'success');
  renderAdminFeedback();
};

window.deleteFeedback = (id) => {
  if (confirm('Are you sure you want to delete this feedback?')) {
    appData.deleteFeedback(id);
    UI.showAlert('Feedback deleted!', 'success');
    renderAdminFeedback();
  }
};

// PAGE 23: ADMIN MANAGE TUTORS
function renderAdminManageTutors() {
  const user = appData.getCurrentUser();
  if (!user || user.role !== 'admin') {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const tutors = appData.getTutors();

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
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Qualifications</label>
              <input type="text" class="form-input" id="tutorQualifications" required>
            </div>
            <div class="form-group">
              <label class="form-label">Hourly Rate ($)</label>
              <input type="number" class="form-input" id="tutorRate" required>
            </div>
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
                <span class="badge badge-${tutor.isAvailable ? 'success' : 'danger'}">${tutor.isAvailable ? 'Available' : 'Unavailable'}</span>
                <span>$${tutor.hourlyRate}/hr</span>
              </div>
              <p class="text-muted" style="margin-top: 0.5rem; font-size: 0.9rem;">${sanitize(tutor.bio)}</p>
              <div style="margin-top: 0.5rem;">
                ${tutor.subjects.map(s => `<span class="subject-tag">${sanitize(s)}</span>`).join('')}
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-direction: column;">
              <button class="btn btn-sm btn-outline" onclick="editTutor('${tutor.id}')">Edit</button>
              <button class="btn btn-sm btn-outline" onclick="toggleTutorAvailability('${tutor.id}')">${tutor.isAvailable ? 'Set Unavailable' : 'Set Available'}</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUser('${tutor.id}')">Delete</button>
            </div>
          </div>
        `).join('') : '<p class="text-muted">No tutors yet</p>'}
      </div>
    </div>
  `;
  UI.setContent(html);

  document.getElementById('addTutorForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const tutor = {
      name: document.getElementById('tutorName').value,
      email: document.getElementById('tutorEmail').value,
      bio: document.getElementById('tutorBio').value,
      qualifications: document.getElementById('tutorQualifications').value,
      hourlyRate: parseInt(document.getElementById('tutorRate').value),
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
    appData.addUser(tutor);
    UI.showAlert('Tutor added successfully!', 'success');
    renderAdminManageTutors();
  });
}

window.editTutor = (id) => {
  const tutor = appData.getTutorById(id);
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
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Qualifications</label>
              <input type="text" class="form-input" id="editTutorQualifications" value="${sanitize(tutor.qualifications)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Hourly Rate ($)</label>
              <input type="number" class="form-input" id="editTutorRate" value="${tutor.hourlyRate}" required>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Years of Experience</label>
              <input type="number" class="form-input" id="editTutorExperience" value="${tutor.yearsOfExperience}" required>
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
    document.getElementById('editTutorForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      appData.updateUser(id, {
        name: document.getElementById('editTutorName').value,
        email: document.getElementById('editTutorEmail').value,
        bio: document.getElementById('editTutorBio').value,
        qualifications: document.getElementById('editTutorQualifications').value,
        hourlyRate: parseInt(document.getElementById('editTutorRate').value),
        yearsOfExperience: parseInt(document.getElementById('editTutorExperience').value),
        experienceLevel: document.getElementById('editTutorLevel').value,
        subjects: document.getElementById('editTutorSubjects').value.split(',').map(s => s.trim())
      });
      UI.showAlert('Tutor updated!', 'success');
      modal.remove();
      renderAdminManageTutors();
    });
  }
};

window.toggleTutorAvailability = (id) => {
  const tutor = appData.getTutorById(id);
  if (tutor) {
    appData.updateUser(id, { isAvailable: !tutor.isAvailable });
    UI.showAlert(`Tutor ${tutor.isAvailable ? 'set to unavailable' : 'set to available'}!`, 'success');
    renderAdminManageTutors();
  }
};

window.deleteUser = (id) => {
  if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    appData.deleteUser(id);
    UI.showAlert('User deleted!', 'success');
    renderAdminManageTutors();
  }
};

// PAGE 24: ADMIN MANAGE STUDENTS
function renderAdminManageStudents() {
  const user = appData.getCurrentUser();
  if (!user || user.role !== 'admin') {
    UI.showAlert('Access Denied. Admins Only!', 'danger');
    router.navigate('/');
    return;
  }

  const students = appData.getStudents();

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
              <div class="session-title">${sanitize(student.name)}</div>
              <div class="session-meta">
                <span>${sanitize(student.email)}</span>
                <span class="badge badge-secondary">${student.gradeLevel}</span>
              </div>
              <div style="margin-top: 0.5rem;">
                ${student.interests.map(i => `<span class="subject-tag">${sanitize(i)}</span>`).join('')}
              </div>
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

  document.getElementById('addStudentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const student = {
      name: document.getElementById('studentName').value,
      email: document.getElementById('studentEmail').value,
      gradeLevel: document.getElementById('studentGrade').value,
      interests: document.getElementById('studentInterests').value.split(',').map(s => s.trim()),
      role: 'student',
      avatar: '👤'
    };
    appData.addUser(student);
    UI.showAlert('Student added successfully!', 'success');
    renderAdminManageStudents();
  });
}

window.editStudent = (id) => {
  const students = appData.getStudents();
  const student = students.find(s => s.id === id);
  if (student) {
    const html = `
      <div>
        <h3>Edit Student</h3>
        <form id="editStudentForm">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" class="form-input" id="editStudentName" value="${sanitize(student.name)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="editStudentEmail" value="${sanitize(student.email)}" required>
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
            <input type="text" class="form-input" id="editStudentInterests" value="${student.interests.join(', ')}" required>
          </div>
          <button type="submit" class="btn btn-primary">Update Student</button>
        </form>
      </div>
    `;
    const modal = UI.showModal(html, 'Edit Student');
    document.getElementById('editStudentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      appData.updateUser(id, {
        name: document.getElementById('editStudentName').value,
        email: document.getElementById('editStudentEmail').value,
        gradeLevel: document.getElementById('editStudentGrade').value,
        interests: document.getElementById('editStudentInterests').value.split(',').map(s => s.trim())
      });
      UI.showAlert('Student updated!', 'success');
      modal.remove();
      renderAdminManageStudents();
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

// Initialize WhatsApp
document.addEventListener('DOMContentLoaded', () => {
  window.whatsappComponent = new WhatsAppComponent({
    phoneNumber: '+1234567890'
  });
});

// ============================================================================
// 5. ROUTER REGISTRATION
// ============================================================================

router.register('/', renderHome);
router.register('/role-selection', renderRoleSelection);
router.register('/signup/student', renderStudentSignUp);
router.register('/signup/tutor', renderTutorSignUp);
router.register('/tutors', renderFindTutors);
router.register('/tutors/:id', (hash) => renderTutorProfile(hash));
router.register('/student-dashboard', renderStudentDashboard);
router.register('/tutor-dashboard', renderTutorDashboard);
router.register('/chat', renderChat);
router.register('/assignments', renderAssignments);
router.register('/schedule', renderSchedule);
router.register('/video-call', renderVideoCall);
router.register('/leaderboard', renderLeaderboard);
router.register('/ai-chatbot', renderAIChatbot);
router.register('/ai-tutor-matching', renderAITutorMatching);
router.register('/ai-grading', renderAIGrading);
router.register('/admin', renderAdminDashboard);
router.register('/admin/analytics', renderAdminAnalytics);
router.register('/admin/approvals', renderAdminApprovals);
router.register('/admin/disputes', renderAdminDisputes);
router.register('/admin/announcements', renderAdminAnnouncements);
router.register('/admin/feedback', renderAdminFeedback);
router.register('/admin/manage-tutors', renderAdminManageTutors);
router.register('/admin/manage-students', renderAdminManageStudents);

// ============================================================================
// 6. COLLAPSIBLE SIDEBAR MENU REDESIGNED
// ============================================================================

function renderSidebar() {
  const currentUser = appData.getCurrentUser();
  const role = currentUser?.role || 'guest';
  const currentHash = window.location.hash || '#/';

  const isActive = (hash) => {
    if (hash === '#/') {
      return currentHash === '#/' || currentHash === '';
    }
    return currentHash.startsWith(hash);
  };

  const guestLinks = [
    { label: 'Home', icon: '🏠', hash: '#/' },
    { label: 'Find Tutors', icon: '🔍', hash: '#/tutors' },
    { label: 'Sign In / Sign Up', icon: '🔐', hash: '#/role-selection' }
  ];

  const studentLinks = [
    { label: 'Home', icon: '🏠', hash: '#/' },
    { label: 'Find Tutors', icon: '🔍', hash: '#/tutors' },
    { label: 'My Sessions', icon: '📅', hash: '#/student-dashboard' },
    { label: 'Messages', icon: '💬', hash: '#/chat' },
    { label: 'Assignments', icon: '📝', hash: '#/assignments' },
    { label: 'Leaderboard', icon: '🏆', hash: '#/leaderboard' },
    { label: 'AI Chatbot', icon: '🤖', hash: '#/ai-chatbot' },
    { label: 'AI Tutor Match', icon: '🎯', hash: '#/ai-tutor-matching' },
    { label: 'AI Grading', icon: '📊', hash: '#/ai-grading' },
    { label: 'Video Classroom', icon: '📹', hash: '#/video-call' }
  ];

  const tutorLinks = [
    { label: 'Home', icon: '🏠', hash: '#/' },
    { label: 'Browse Tutors', icon: '👥', hash: '#/tutors' },
    { label: 'Schedule & Slots', icon: '📆', hash: '#/schedule' },
    { label: 'Messages', icon: '💬', hash: '#/chat' },
    { label: 'My Dashboard', icon: '📋', hash: '#/tutor-dashboard' },
    { label: 'Leaderboard', icon: '🏆', hash: '#/leaderboard' },
    { label: 'AI Chatbot', icon: '🤖', hash: '#/ai-chatbot' },
    { label: 'Video Classroom', icon: '📹', hash: '#/video-call' }
  ];

  const adminLinks = [
    { label: 'Home', icon: '🏠', hash: '#/' },
    { label: 'Admin Panel', icon: '🛡️', hash: '#/admin' },
    { label: 'Analytics', icon: '📊', hash: '#/admin/analytics' },
    { label: 'Approvals', icon: '✅', hash: '#/admin/approvals' },
    { label: 'Disputes & Refunds', icon: '⚖️', hash: '#/admin/disputes' },
    { label: 'Announcements & Posts', icon: '📢', hash: '#/admin/announcements' },
    { label: 'User Feedback', icon: '💬', hash: '#/admin/feedback' },
    { label: 'Manage Tutors', icon: '👨‍🏫', hash: '#/admin/manage-tutors' },
    { label: 'Manage Students', icon: '👨‍🎓', hash: '#/admin/manage-students' },
    { label: 'All Tutors List', icon: '👥', hash: '#/tutors' },
    { label: 'Leaderboard', icon: '🏆', hash: '#/leaderboard' }
  ];

  let activeLinks = [];
  if (role === 'student') activeLinks = studentLinks;
  else if (role === 'tutor') activeLinks = tutorLinks;
  else if (role === 'admin') activeLinks = adminLinks;
  else activeLinks = guestLinks;

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

  const avatar = currentUser?.avatar || (role === 'tutor' ? '👨‍🏫' : role === 'admin' ? '🛡️' : '👤');
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
      <div class="sidebar-logo">
        <span class="logo-main" style="color: var(--color-primary);">Aroosh</span>
        <span class="logo-sub" style="color: var(--color-text-secondary); font-weight: 400; font-size: var(--font-size-sm);">Tutors</span>
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
      <div class="sidebar-avatar">${avatar}</div>
      <div class="sidebar-profile-info">
        <div class="sidebar-name">${name}</div>
        <span class="sidebar-role badge badge-${badgeClass}">${roleDisplay}</span>
      </div>
    </div>

    <ul class="sidebar-menu">
      ${menuHtml}
    </ul>

    <div class="sidebar-footer">
      <div class="role-switcher-container">
        <label class="switcher-label">Switch Role:</label>
        <select id="sidebarRoleSwitch" class="role-select" onchange="switchRole(this.value)">
          <option value="guest" ${role === 'guest' ? 'selected' : ''}>Guest</option>
          <option value="student" ${role === 'student' ? 'selected' : ''}>Student</option>
          <option value="tutor" ${role === 'tutor' ? 'selected' : ''}>Tutor</option>
          <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
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

window.switchRole = (role) => {
  if (role === 'guest') {
    appData.setCurrentUser(null);
    router.navigate('/');
  } else if (role === 'student') {
    appData.setCurrentUser({ name: 'Rahul Kumar', role: 'student', id: 'user1', avatar: '👤' });
    router.navigate('/student-dashboard');
  } else if (role === 'tutor') {
    appData.setCurrentUser({ name: 'Priya Singh', role: 'tutor', id: 'tutor1', avatar: '👨‍🏫' });
    router.navigate('/tutor-dashboard');
  } else if (role === 'admin') {
    appData.setCurrentUser({ name: 'Admin User', role: 'admin', id: 'admin1', avatar: '🛡️' });
    router.navigate('/admin');
  }
  renderSidebar();
};

window.logout = () => {
  appData.setCurrentUser(null);
  renderSidebar();
  router.navigate('/');
};

// ============================================================================
// 7. APP INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  router.start();
});
