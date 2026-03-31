/* ========================================
   STATS CONTROLLER — Statistics CRUD
   ======================================== */

const { db } = require('../models/database');

// GET /api/stats — Public: Get visible stats
exports.getPublic = (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT id, label, value, suffix, sort_order 
      FROM stats 
      WHERE is_visible = 1 
      ORDER BY sort_order ASC
    `).all();

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/stats — Admin: Get all stats
exports.getAll = (req, res) => {
  try {
    const stats = db.prepare('SELECT * FROM stats ORDER BY sort_order ASC').all();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get all stats error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// POST /api/admin/stats — Admin: Create stat
exports.create = (req, res) => {
  try {
    const { label, value, suffix, sort_order } = req.body;

    const result = db.prepare('INSERT INTO stats (label, value, suffix, sort_order) VALUES (?, ?, ?, ?)')
      .run(label, value, suffix || '+', sort_order || 0);

    const stat = db.prepare('SELECT * FROM stats WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Statistika yaratildi', data: stat });
  } catch (error) {
    console.error('Create stat error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PUT /api/admin/stats/:id — Admin: Update stat
exports.update = (req, res) => {
  try {
    const { label, value, suffix, is_visible, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM stats WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Statistika topilmadi' });
    }

    db.prepare(`
      UPDATE stats SET
        label = COALESCE(?, label),
        value = COALESCE(?, value),
        suffix = COALESCE(?, suffix),
        is_visible = COALESCE(?, is_visible),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      label || null, value !== undefined ? value : null,
      suffix !== undefined ? suffix : null,
      is_visible !== undefined ? (is_visible ? 1 : 0) : null,
      sort_order !== undefined ? sort_order : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM stats WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Statistika yangilandi', data: updated });
  } catch (error) {
    console.error('Update stat error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// DELETE /api/admin/stats/:id — Admin: Delete stat
exports.delete = (req, res) => {
  try {
    const result = db.prepare('DELETE FROM stats WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Statistika topilmadi' });
    }
    res.json({ success: true, message: 'Statistika o\'chirildi' });
  } catch (error) {
    console.error('Delete stat error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
