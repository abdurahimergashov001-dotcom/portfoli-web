/* ========================================
   VALIDATION MIDDLEWARE — Request Validators
   ======================================== */

const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validatsiya xatosi',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Contact form validation
const contactValidation = [
  body('email')
    .isEmail().withMessage('Email noto\'g\'ri formatda')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email juda uzun'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Ism 2-100 belgi bo\'lishi kerak'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Telefon raqam juda uzun'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Xabar juda uzun'),
  body('plan')
    .optional()
    .trim()
    .isIn(['Basic', 'Professional', 'Premium', '']).withMessage('Noto\'g\'ri tarif reja'),
  validate
];

// Review validation
const reviewValidation = [
  body('author_name')
    .trim()
    .notEmpty().withMessage('Muallif ismi kiritilishi kerak')
    .isLength({ max: 100 }).withMessage('Ism juda uzun'),
  body('author_role')
    .optional().trim()
    .isLength({ max: 100 }),
  body('author_company')
    .optional().trim()
    .isLength({ max: 100 }),
  body('author_initials')
    .optional().trim()
    .isLength({ max: 5 }),
  body('author_color')
    .optional().trim()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Rang HEX formatida bo\'lishi kerak'),
  body('text')
    .trim()
    .notEmpty().withMessage('Sharh matni kiritilishi kerak')
    .isLength({ max: 1000 }).withMessage('Sharh juda uzun'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Baho 1-5 orasida bo\'lishi kerak'),
  validate
];

// Pricing plan validation
const pricingValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tarif reja nomi kiritilishi kerak')
    .isLength({ max: 100 }),
  body('description')
    .optional().trim()
    .isLength({ max: 500 }),
  body('price_monthly')
    .isInt({ min: 0 }).withMessage('Oylik narx musbat son bo\'lishi kerak'),
  body('price_yearly')
    .isInt({ min: 0 }).withMessage('Yillik narx musbat son bo\'lishi kerak'),
  body('is_popular')
    .optional()
    .isIn([0, 1, true, false]),
  validate
];

// FAQ validation
const faqValidation = [
  body('question')
    .trim()
    .notEmpty().withMessage('Savol kiritilishi kerak')
    .isLength({ max: 500 }),
  body('answer')
    .trim()
    .notEmpty().withMessage('Javob kiritilishi kerak')
    .isLength({ max: 2000 }),
  validate
];

// Advantage validation
const advantageValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Sarlavha kiritilishi kerak')
    .isLength({ max: 200 }),
  body('description')
    .trim()
    .notEmpty().withMessage('Tavsif kiritilishi kerak')
    .isLength({ max: 1000 }),
  body('icon_color')
    .optional().trim()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Rang HEX formatida bo\'lishi kerak'),
  validate
];

// Stats validation
const statsValidation = [
  body('label')
    .trim()
    .notEmpty().withMessage('Sarlavha kiritilishi kerak')
    .isLength({ max: 100 }),
  body('value')
    .isInt({ min: 0 }).withMessage('Qiymat musbat son bo\'lishi kerak'),
  body('suffix')
    .optional().trim()
    .isLength({ max: 10 }),
  validate
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail().withMessage('Email noto\'g\'ri formatda')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Parol kiritilishi kerak')
    .isLength({ min: 6 }).withMessage('Parol kamida 6 belgidan iborat bo\'lishi kerak'),
  validate
];

// Settings validation
const settingsValidation = [
  body('key')
    .trim()
    .notEmpty().withMessage('Kalit kiritilishi kerak')
    .isLength({ max: 100 }),
  body('value')
    .optional({ nullable: true })
    .isLength({ max: 5000 }),
  validate
];

// Project validation
const projectValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Loyiha nomi kiritilishi kerak')
    .isLength({ max: 200 }),
  body('description')
    .optional().trim()
    .isLength({ max: 2000 }),
  body('category')
    .optional().trim()
    .isLength({ max: 100 }),
  body('link')
    .optional().trim()
    .isURL().withMessage('Havola URL formatida bo\'lishi kerak'),
  body('technologies')
    .optional().trim()
    .isLength({ max: 500 }),
  validate
];

// ID param validation
const idParamValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID musbat butun son bo\'lishi kerak'),
  validate
];

// Pagination query validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Sahifa raqami musbat son bo\'lishi kerak'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit 1-100 orasida bo\'lishi kerak'),
  validate
];

module.exports = {
  validate,
  contactValidation,
  reviewValidation,
  pricingValidation,
  faqValidation,
  advantageValidation,
  statsValidation,
  loginValidation,
  settingsValidation,
  projectValidation,
  idParamValidation,
  paginationValidation
};
