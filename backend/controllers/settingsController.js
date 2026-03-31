/* ========================================
   SETTINGS CONTROLLER — Site Settings Key-Value Store
   ======================================== */

const { db } = require('../models/database');

// GET /api/settings — Public: Get all settings
exports.getPublic = (req, res) => {
  try {
    const settings = db.prepare('SELECT key, value FROM settings').all();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/settings/:key — Public: Get single setting
exports.getByKey = (req, res) => {
  try {
    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Sozlama topilmadi' });
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PUT /api/admin/settings — Admin: Update/Create setting
exports.upsert = (req, res) => {
  try {
    const { key, value } = req.body;

    db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `).run(key, value, value);

    res.json({
      success: true,
      message: 'Sozlama saqlandi',
      data: { key, value }
    });
  } catch (error) {
    console.error('Upsert setting error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PUT /api/admin/settings/bulk — Admin: Update multiple settings
exports.bulkUpdate = (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: 'Sozlamalar obyekt formatida bo\'lishi kerak' 
      });
    }

    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);

    const bulkUpsert = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        upsert.run(key, value, value);
      }
    });
    bulkUpsert();

    res.json({
      success: true,
      message: `${Object.keys(settings).length} ta sozlama saqlandi`
    });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// DELETE /api/admin/settings/:key — Admin: Delete setting
exports.delete = (req, res) => {
  try {
    const result = db.prepare('DELETE FROM settings WHERE key = ?').run(req.params.key);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Sozlama topilmadi' });
    }
    res.json({ success: true, message: 'Sozlama o\'chirildi' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
