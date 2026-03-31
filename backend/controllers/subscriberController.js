/* ========================================
   SUBSCRIBERS CONTROLLER — Newsletter Management
   ======================================== */

const { db } = require('../models/database');

// POST /api/subscribe — Public: Subscribe to newsletter
exports.subscribe = (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email kiritilishi kerak' });
    }

    const existing = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);
    if (existing) {
      if (existing.is_active) {
        return res.json({ success: true, message: 'Siz allaqachon obuna bo\'lgansiz!' });
      }
      // Reactivate
      db.prepare('UPDATE subscribers SET is_active = 1 WHERE id = ?').run(existing.id);
      return res.json({ success: true, message: 'Obuna qayta faollashtirildi!' });
    }

    db.prepare('INSERT INTO subscribers (email) VALUES (?)').run(email);
    res.status(201).json({ success: true, message: 'Obuna muvaffaqiyatli!' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// POST /api/unsubscribe — Public: Unsubscribe
exports.unsubscribe = (req, res) => {
  try {
    const { email } = req.body;
    const result = db.prepare('UPDATE subscribers SET is_active = 0 WHERE email = ?').run(email);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Email topilmadi' });
    }
    res.json({ success: true, message: 'Obunadan chiqarildi' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/subscribers — Admin: Get all subscribers
exports.getAll = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) as count FROM subscribers').get();
    const activeCount = db.prepare('SELECT COUNT(*) as count FROM subscribers WHERE is_active = 1').get();
    
    const subscribers = db.prepare(`
      SELECT * FROM subscribers ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);

    res.json({
      success: true,
      data: {
        subscribers,
        stats: {
          total: total.count,
          active: activeCount.count
        },
        pagination: {
          page, limit,
          total: total.count,
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// DELETE /api/admin/subscribers/:id — Admin: Delete subscriber
exports.delete = (req, res) => {
  try {
    const result = db.prepare('DELETE FROM subscribers WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Obunachi topilmadi' });
    }
    res.json({ success: true, message: 'Obunachi o\'chirildi' });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/subscribers/export — Admin: Export subscribers as CSV
exports.exportCsv = (req, res) => {
  try {
    const subscribers = db.prepare('SELECT email, is_active, created_at FROM subscribers WHERE is_active = 1 ORDER BY created_at DESC').all();
    
    let csv = 'Email,Status,Subscribed Date\n';
    subscribers.forEach(s => {
      csv += `${s.email},${s.is_active ? 'Active' : 'Inactive'},${s.created_at}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Export subscribers error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
