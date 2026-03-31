/* ========================================
   AUTH CONTROLLER — Login & Admin Management
   ======================================== */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

// POST /api/auth/login
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email yoki parol noto\'g\'ri'
      });
    }

    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email yoki parol noto\'g\'ri'
      });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Tizimga muvaffaqiyatli kirdingiz',
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// GET /api/auth/me
exports.getMe = (req, res) => {
  try {
    const admin = db.prepare('SELECT id, email, name, created_at FROM admins WHERE id = ?').get(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin topilmadi' });
    }
    res.json({ success: true, data: admin });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// PUT /api/auth/password
exports.changePassword = (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Joriy va yangi parol kiritilishi kerak'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yangi parol kamida 6 belgidan iborat bo\'lishi kerak'
      });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
    const isMatch = bcrypt.compareSync(current_password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Joriy parol noto\'g\'ri'
      });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 12);
    db.prepare('UPDATE admins SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hashedPassword, req.admin.id);

    res.json({
      success: true,
      message: 'Parol muvaffaqiyatli o\'zgartirildi'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};
