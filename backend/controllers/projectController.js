/* ========================================
   PROJECTS CONTROLLER — Portfolio Projects CRUD
   ======================================== */

const { db } = require('../models/database');
const path = require('path');
const fs = require('fs');

// GET /api/projects — Public: Get visible projects
exports.getPublic = (req, res) => {
  try {
    const category = req.query.category;
    let query = 'SELECT * FROM projects WHERE is_visible = 1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const projects = db.prepare(query).all(...params);
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Get public projects error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/projects/featured — Public: Get featured projects
exports.getFeatured = (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT * FROM projects 
      WHERE is_visible = 1 AND is_featured = 1 
      ORDER BY sort_order ASC
    `).all();

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Get featured projects error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/projects/categories — Public: Get unique categories
exports.getCategories = (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category FROM projects 
      WHERE is_visible = 1 AND category IS NOT NULL AND category != ''
      ORDER BY category ASC
    `).all();

    res.json({ success: true, data: categories.map(c => c.category) });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/projects — Admin: Get all projects
exports.getAll = (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC').all();
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/projects/:id — Admin: Get single project
exports.getById = (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Loyiha topilmadi' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// POST /api/admin/projects — Admin: Create project
exports.create = (req, res) => {
  try {
    const { title, description, category, image_url, link, technologies, is_featured, sort_order } = req.body;

    // If file was uploaded via multer
    let finalImageUrl = image_url || null;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const result = db.prepare(`
      INSERT INTO projects (title, description, category, image_url, link, technologies, is_featured, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, description || null, category || null,
      finalImageUrl, link || null, technologies || null,
      is_featured ? 1 : 0, sort_order || 0
    );

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Loyiha yaratildi', data: project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PUT /api/admin/projects/:id — Admin: Update project
exports.update = (req, res) => {
  try {
    const { title, description, category, image_url, link, technologies, is_featured, is_visible, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Loyiha topilmadi' });
    }

    let finalImageUrl = image_url;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
      // Delete old image if exists
      if (existing.image_url && existing.image_url.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', '..', 'public', existing.image_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    db.prepare(`
      UPDATE projects SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        image_url = COALESCE(?, image_url),
        link = COALESCE(?, link),
        technologies = COALESCE(?, technologies),
        is_featured = COALESCE(?, is_featured),
        is_visible = COALESCE(?, is_visible),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || null, description, category,
      finalImageUrl || null, link, technologies,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      is_visible !== undefined ? (is_visible ? 1 : 0) : null,
      sort_order !== undefined ? sort_order : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Loyiha yangilandi', data: updated });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// DELETE /api/admin/projects/:id — Admin: Delete project
exports.delete = (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Loyiha topilmadi' });
    }

    // Delete image if exists
    if (project.image_url && project.image_url.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', '..', 'public', project.image_url);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Loyiha o\'chirildi' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
