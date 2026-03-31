/* ========================================
   AUTH ROUTES
   ======================================== */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { loginValidation } = require('../middleware/validate');

// Public
router.post('/login', loginValidation, authController.login);

// Protected
router.get('/me', authMiddleware, authController.getMe);
router.put('/password', authMiddleware, authController.changePassword);

module.exports = router;
