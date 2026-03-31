/* ========================================
   ADVANTAGES CONTROLLER — Features/Benefits CRUD
   ======================================== */

const { db } = require('../models/database');

// GET /api/advantages — Public: Get visible advantages
exports.getPublic = (req, res) => {
  try {
    const advantages = db.prepare(`
      SELECT id, title, description, icon_svg, icon_color, sort_order 
      FROM advantages 
      WHERE is_visible = 1 
      ORDER BY sort_order ASC
    `).all();

    res.json({ success: true, data: advantages });
  } catch (error) {
    console.error('Get public advantages error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/advantages — Admin: Get all
exports.getAll = (req, res) => {
  try {
    const advantages = db.prepare('SELECT * FROM advantages ORDER BY sort_order ASC').all();
    res.json({ success: true, data: advantages });
  } catch (error) {
    console.error('Get all advantages error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// POST /api/admin/advantages — Admin: Create
exports.create = (req, res) => {
  try {
    const { title, description, icon_svg, icon_color, sort_order } = req.body;

    const result = db.prepare(`
      INSERT INTO advantages (title, description, icon_svg, icon_color, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, description, icon_svg || null, icon_color || '#6C63FF', sort_order || 0);

    const adv = db.prepare('SELECT * FROM advantages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Afzallik yaratildi', data: adv });
  } catch (error) {
    console.error('Create advantage error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PUT /api/admin/advantages/:id — Admin: Update
exports.update = (req, res) => {
  try {
    const { title, description, icon_svg, icon_color, is_visible, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM advantages WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Afzallik topilmadi' });
    }

    db.prepare(`
      UPDATE advantages SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        icon_svg = COALESCE(?, icon_svg),
        icon_color = COALESCE(?, icon_color),
        is_visible = COALESCE(?, is_visible),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || null, description || null, icon_svg, icon_color || null,
      is_visible !== undefined ? (is_visible ? 1 : 0) : null,
      sort_order !== undefined ? sort_order : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM advantages WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Afzallik yangilandi', data: updated });
  } catch (error) {
    console.error('Update advantage error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// DELETE /api/admin/advantages/:id — Admin: Delete
exports.delete = (req, res) => {
  try {
    const result = db.prepare('DELETE FROM advantages WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Afzallik topilmadi' });
    }
    res.json({ success: true, message: 'Afzallik o\'chirildi' });
  } catch (error) {
    console.error('Delete advantage error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
