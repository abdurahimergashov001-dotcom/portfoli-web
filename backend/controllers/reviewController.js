/* ========================================
   REVIEWS CONTROLLER — Testimonials CRUD
   ======================================== */

const { db } = require('../models/database');

// GET /api/reviews — Public: Get visible reviews
exports.getPublic = (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT id, author_name, author_role, author_company, author_initials, 
             author_color, text, rating, sort_order
      FROM reviews 
      WHERE is_visible = 1 
      ORDER BY sort_order ASC, created_at DESC
    `).all();

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Get public reviews error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/reviews — Admin: Get all reviews
exports.getAll = (req, res) => {
  try {
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY sort_order ASC, created_at DESC').all();
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/reviews/:id — Admin: Get single review
exports.getById = (req, res) => {
  try {
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Sharh topilmadi' });
    }
    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// POST /api/admin/reviews — Admin: Create review
exports.create = (req, res) => {
  try {
    const { author_name, author_role, author_company, author_initials, author_color, text, rating, sort_order } = req.body;

    const initials = author_initials || author_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const result = db.prepare(`
      INSERT INTO reviews (author_name, author_role, author_company, author_initials, author_color, text, rating, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      author_name,
      author_role || null,
      author_company || null,
      initials,
      author_color || '#6C63FF',
      text,
      rating || 5,
      sort_order || 0
    );

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Sharh muvaffaqiyatli yaratildi',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PUT /api/admin/reviews/:id — Admin: Update review
exports.update = (req, res) => {
  try {
    const { author_name, author_role, author_company, author_initials, author_color, text, rating, is_visible, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sharh topilmadi' });
    }

    db.prepare(`
      UPDATE reviews SET 
        author_name = COALESCE(?, author_name),
        author_role = COALESCE(?, author_role),
        author_company = COALESCE(?, author_company),
        author_initials = COALESCE(?, author_initials),
        author_color = COALESCE(?, author_color),
        text = COALESCE(?, text),
        rating = COALESCE(?, rating),
        is_visible = COALESCE(?, is_visible),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      author_name || null, author_role, author_company,
      author_initials || null, author_color || null,
      text || null, rating || null,
      is_visible !== undefined ? (is_visible ? 1 : 0) : null,
      sort_order !== undefined ? sort_order : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);

    res.json({
      success: true,
      message: 'Sharh muvaffaqiyatli yangilandi',
      data: updated
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// DELETE /api/admin/reviews/:id — Admin: Delete review
exports.delete = (req, res) => {
  try {
    const result = db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Sharh topilmadi' });
    }
    res.json({ success: true, message: 'Sharh o\'chirildi' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PATCH /api/admin/reviews/:id/visibility — Admin: Toggle visibility
exports.toggleVisibility = (req, res) => {
  try {
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Sharh topilmadi' });
    }

    db.prepare('UPDATE reviews SET is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(review.is_visible ? 0 : 1, req.params.id);

    res.json({
      success: true,
      message: review.is_visible ? 'Sharh yashirildi' : 'Sharh ko\'rsatildi'
    });
  } catch (error) {
    console.error('Toggle review visibility error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
