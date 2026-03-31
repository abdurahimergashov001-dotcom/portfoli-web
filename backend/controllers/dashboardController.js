/* ========================================
   DASHBOARD CONTROLLER — Admin Dashboard Stats
   ======================================== */

const { db } = require('../models/database');

// GET /api/admin/dashboard — Admin: Get dashboard overview
exports.getDashboard = (req, res) => {
  try {
    // Total contacts
    const contacts = db.prepare('SELECT COUNT(*) as total FROM contacts').get();
    const newContacts = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'new'").get();
    const todayContacts = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE DATE(created_at) = DATE('now')").get();

    // Subscribers
    const subscribers = db.prepare('SELECT COUNT(*) as total FROM subscribers WHERE is_active = 1').get();

    // Content counts
    const reviews = db.prepare('SELECT COUNT(*) as total FROM reviews').get();
    const projects = db.prepare('SELECT COUNT(*) as total FROM projects').get();
    const faqs = db.prepare('SELECT COUNT(*) as total FROM faqs').get();
    const plans = db.prepare('SELECT COUNT(*) as total FROM pricing_plans').get();

    // Recent contacts (last 5)
    const recentContacts = db.prepare(`
      SELECT id, email, name, plan, status, created_at 
      FROM contacts 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    // Weekly contact trend (last 7 days)
    const weeklyTrend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM contacts
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    res.json({
      success: true,
      data: {
        overview: {
          total_contacts: contacts.total,
          new_contacts: newContacts.count,
          today_contacts: todayContacts.count,
          active_subscribers: subscribers.total,
          total_reviews: reviews.total,
          total_projects: projects.total,
          total_faqs: faqs.total,
          total_plans: plans.total
        },
        recent_contacts: recentContacts,
        weekly_trend: weeklyTrend
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
