/* ========================================
   PRICING CONTROLLER — Plans & Features CRUD
   ======================================== */

const { db } = require('../models/database');

// GET /api/pricing — Public: Get visible pricing plans with features
exports.getPublic = (req, res) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM pricing_plans 
      WHERE is_visible = 1 
      ORDER BY sort_order ASC
    `).all();

    const plansWithFeatures = plans.map(plan => {
      const features = db.prepare(`
        SELECT id, text, is_included, sort_order 
        FROM pricing_features 
        WHERE plan_id = ? 
        ORDER BY sort_order ASC
      `).all(plan.id);
      return { ...plan, features };
    });

    res.json({ success: true, data: plansWithFeatures });
  } catch (error) {
    console.error('Get public pricing error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/admin/pricing — Admin: Get all plans with features
exports.getAll = (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM pricing_plans ORDER BY sort_order ASC').all();
    const plansWithFeatures = plans.map(plan => {
      const features = db.prepare('SELECT * FROM pricing_features WHERE plan_id = ? ORDER BY sort_order ASC').all(plan.id);
      return { ...plan, features };
    });
    res.json({ success: true, data: plansWithFeatures });
  } catch (error) {
    console.error('Get all pricing error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// POST /api/admin/pricing — Admin: Create plan
exports.create = (req, res) => {
  try {
    const { name, description, price_monthly, price_yearly, is_popular, sort_order, features } = req.body;

    const result = db.prepare(`
      INSERT INTO pricing_plans (name, description, price_monthly, price_yearly, is_popular, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description || null, price_monthly, price_yearly, is_popular ? 1 : 0, sort_order || 0);

    const planId = result.lastInsertRowid;

    // Insert features if provided
    if (features && Array.isArray(features)) {
      const insertFeature = db.prepare('INSERT INTO pricing_features (plan_id, text, is_included, sort_order) VALUES (?, ?, ?, ?)');
      const insertFeatures = db.transaction(() => {
        features.forEach((f, i) => {
          insertFeature.run(planId, f.text, f.is_included !== undefined ? (f.is_included ? 1 : 0) : 1, f.sort_order || i + 1);
        });
      });
      insertFeatures();
    }

    const plan = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(planId);
    const planFeatures = db.prepare('SELECT * FROM pricing_features WHERE plan_id = ? ORDER BY sort_order ASC').all(planId);

    res.status(201).json({
      success: true,
      message: 'Tarif reja yaratildi',
      data: { ...plan, features: planFeatures }
    });
  } catch (error) {
    console.error('Create pricing error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PUT /api/admin/pricing/:id — Admin: Update plan
exports.update = (req, res) => {
  try {
    const { name, description, price_monthly, price_yearly, is_popular, is_visible, sort_order, features } = req.body;

    const existing = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tarif reja topilmadi' });
    }

    db.prepare(`
      UPDATE pricing_plans SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price_monthly = COALESCE(?, price_monthly),
        price_yearly = COALESCE(?, price_yearly),
        is_popular = COALESCE(?, is_popular),
        is_visible = COALESCE(?, is_visible),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || null, description, 
      price_monthly !== undefined ? price_monthly : null,
      price_yearly !== undefined ? price_yearly : null,
      is_popular !== undefined ? (is_popular ? 1 : 0) : null,
      is_visible !== undefined ? (is_visible ? 1 : 0) : null,
      sort_order !== undefined ? sort_order : null,
      req.params.id
    );

    // Update features if provided
    if (features && Array.isArray(features)) {
      db.prepare('DELETE FROM pricing_features WHERE plan_id = ?').run(req.params.id);
      const insertFeature = db.prepare('INSERT INTO pricing_features (plan_id, text, is_included, sort_order) VALUES (?, ?, ?, ?)');
      const updateFeatures = db.transaction(() => {
        features.forEach((f, i) => {
          insertFeature.run(req.params.id, f.text, f.is_included !== undefined ? (f.is_included ? 1 : 0) : 1, f.sort_order || i + 1);
        });
      });
      updateFeatures();
    }

    const plan = db.prepare('SELECT * FROM pricing_plans WHERE id = ?').get(req.params.id);
    const planFeatures = db.prepare('SELECT * FROM pricing_features WHERE plan_id = ? ORDER BY sort_order ASC').all(req.params.id);

    res.json({
      success: true,
      message: 'Tarif reja yangilandi',
      data: { ...plan, features: planFeatures }
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// DELETE /api/admin/pricing/:id — Admin: Delete plan
exports.delete = (req, res) => {
  try {
    const result = db.prepare('DELETE FROM pricing_plans WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Tarif reja topilmadi' });
    }
    res.json({ success: true, message: 'Tarif reja o\'chirildi' });
  } catch (error) {
    console.error('Delete pricing error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
