/* ========================================
   FAQ CONTROLLER — Frequently Asked Questions CRUD
   ======================================== */

const { db } = require('../models/database');

// GET /api/faqs — Public: Get visible FAQs
exports.getPublic = (req, res) => {
  try {
    const faqs = db.prepare(`
      SELECT id, question, answer, sort_order 
      FROM faqs 
      WHERE is_visible = 1 
      ORDER BY sort_order ASC
    `).all();

    res.json({ success: true, data: faqs });
  } catch (error) {
    console.error('Get public FAQs error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/faqs — Admin: Get all FAQs
exports.getAll = (req, res) => {
  try {
    const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
    res.json({ success: true, data: faqs });
  } catch (error) {
    console.error('Get all FAQs error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// POST /api/admin/faqs — Admin: Create FAQ
exports.create = (req, res) => {
  try {
    const { question, answer, sort_order } = req.body;

    const result = db.prepare('INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)')
      .run(question, answer, sort_order || 0);

    const faq = db.prepare('SELECT * FROM faqs WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'FAQ yaratildi',
      data: faq
    });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PUT /api/admin/faqs/:id — Admin: Update FAQ
exports.update = (req, res) => {
  try {
    const { question, answer, is_visible, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM faqs WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'FAQ topilmadi' });
    }

    db.prepare(`
      UPDATE faqs SET
        question = COALESCE(?, question),
        answer = COALESCE(?, answer),
        is_visible = COALESCE(?, is_visible),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      question || null, answer || null,
      is_visible !== undefined ? (is_visible ? 1 : 0) : null,
      sort_order !== undefined ? sort_order : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM faqs WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'FAQ yangilandi', data: updated });
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// DELETE /api/admin/faqs/:id — Admin: Delete FAQ
exports.delete = (req, res) => {
  try {
    const result = db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'FAQ topilmadi' });
    }
    res.json({ success: true, message: 'FAQ o\'chirildi' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PATCH /api/admin/faqs/:id/visibility — Admin: Toggle visibility
exports.toggleVisibility = (req, res) => {
  try {
    const faq = db.prepare('SELECT * FROM faqs WHERE id = ?').get(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ topilmadi' });
    }

    db.prepare('UPDATE faqs SET is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(faq.is_visible ? 0 : 1, req.params.id);

    res.json({
      success: true,
      message: faq.is_visible ? 'FAQ yashirildi' : 'FAQ ko\'rsatildi'
    });
  } catch (error) {
    console.error('Toggle FAQ visibility error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
