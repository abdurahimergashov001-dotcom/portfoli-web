/* ========================================
   CONTACT CONTROLLER — Contact Form Submissions
   ======================================== */

const { db } = require('../models/database');

// POST /api/contacts — Public: Submit contact form
exports.create = (req, res) => {
  try {
    const { email, name, phone, message, plan } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;

    const result = db.prepare(`
      INSERT INTO contacts (email, name, phone, message, plan, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(email, name || null, phone || null, message || null, plan || null, ip_address);

    // Also add to subscribers if not exists
    try {
      db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email);
    } catch (e) { /* ignore duplicate */ }

    res.status(201).json({
      success: true,
      message: 'Xabaringiz muvaffaqiyatli yuborildi! Tez orada javob beramiz.',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Contact create error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/contacts — Admin: Get all contacts with pagination
exports.getAll = (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM contacts ${whereClause}`).get(...params);
    const contacts = db.prepare(`
      SELECT * FROM contacts ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total: total.count,
          pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/contacts/:id — Admin: Get single contact
exports.getById = (req, res) => {
  try {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Kontakt topilmadi' });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PATCH /api/contacts/:id/status — Admin: Update contact status
exports.updateStatus = (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'read', 'replied', 'archived'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status quyidagilardan biri bo'lishi kerak: ${validStatuses.join(', ')}`
      });
    }

    const result = db.prepare('UPDATE contacts SET status = ? WHERE id = ?')
      .run(status, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Kontakt topilmadi' });
    }

    res.json({
      success: true,
      message: 'Status muvaffaqiyatli yangilandi'
    });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// DELETE /api/contacts/:id — Admin: Delete contact
exports.delete = (req, res) => {
  try {
    const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Kontakt topilmadi' });
    }
    res.json({ success: true, message: 'Kontakt o\'chirildi' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/contacts/stats — Admin: Contact statistics
exports.getStats = (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_count,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_count
      FROM contacts
    `).get();

    const today = db.prepare(`
      SELECT COUNT(*) as count FROM contacts 
      WHERE DATE(created_at) = DATE('now')
    `).get();

    const thisWeek = db.prepare(`
      SELECT COUNT(*) as count FROM contacts 
      WHERE created_at >= DATE('now', '-7 days')
    `).get();

    res.json({
      success: true,
      data: {
        ...stats,
        today: today.count,
        this_week: thisWeek.count
      }
    });
  } catch (error) {
    console.error('Contact stats error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
