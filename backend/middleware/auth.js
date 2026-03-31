/* ========================================
   AUTH MIDDLEWARE — JWT Token Verification
   ======================================== */

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Autentifikatsiya talab qilinadi. Token topilmadi.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token muddati tugagan. Qayta tizimga kiring.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Yaroqsiz token.'
    });
  }
}

module.exports = authMiddleware;
