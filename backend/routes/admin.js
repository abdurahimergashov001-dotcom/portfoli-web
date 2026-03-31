/* ========================================
   ADMIN API ROUTES — Authentication required
   ======================================== */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const authMiddleware = require('../middleware/auth');
const {
  reviewValidation,
  pricingValidation,
  faqValidation,
  advantageValidation,
  statsValidation,
  settingsValidation,
  projectValidation,
  idParamValidation
} = require('../middleware/validate');

const contactController = require('../controllers/contactController');
const reviewController = require('../controllers/reviewController');
const pricingController = require('../controllers/pricingController');
const faqController = require('../controllers/faqController');
const advantageController = require('../controllers/advantageController');
const statsController = require('../controllers/statsController');
const settingsController = require('../controllers/settingsController');
const projectController = require('../controllers/projectController');
const subscriberController = require('../controllers/subscriberController');
const dashboardController = require('../controllers/dashboardController');

// Apply auth middleware to all admin routes
router.use(authMiddleware);

/* ---------- FILE UPLOAD CONFIG ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Faqat rasm fayllari (JPEG, PNG, GIF, WebP, SVG) qabul qilinadi'));
  }
});

/* ---------- DASHBOARD ---------- */
router.get('/dashboard', dashboardController.getDashboard);

/* ---------- CONTACTS ---------- */
router.get('/contacts', contactController.getAll);
router.get('/contacts/stats', contactController.getStats);
router.get('/contacts/:id', idParamValidation, contactController.getById);
router.patch('/contacts/:id/status', idParamValidation, contactController.updateStatus);
router.delete('/contacts/:id', idParamValidation, contactController.delete);

/* ---------- REVIEWS ---------- */
router.get('/reviews', reviewController.getAll);
router.get('/reviews/:id', idParamValidation, reviewController.getById);
router.post('/reviews', reviewValidation, reviewController.create);
router.put('/reviews/:id', idParamValidation, reviewController.update);
router.delete('/reviews/:id', idParamValidation, reviewController.delete);
router.patch('/reviews/:id/visibility', idParamValidation, reviewController.toggleVisibility);

/* ---------- PRICING ---------- */
router.get('/pricing', pricingController.getAll);
router.post('/pricing', pricingValidation, pricingController.create);
router.put('/pricing/:id', idParamValidation, pricingController.update);
router.delete('/pricing/:id', idParamValidation, pricingController.delete);

/* ---------- FAQs ---------- */
router.get('/faqs', faqController.getAll);
router.post('/faqs', faqValidation, faqController.create);
router.put('/faqs/:id', idParamValidation, faqController.update);
router.delete('/faqs/:id', idParamValidation, faqController.delete);
router.patch('/faqs/:id/visibility', idParamValidation, faqController.toggleVisibility);

/* ---------- ADVANTAGES ---------- */
router.get('/advantages', advantageController.getAll);
router.post('/advantages', advantageValidation, advantageController.create);
router.put('/advantages/:id', idParamValidation, advantageController.update);
router.delete('/advantages/:id', idParamValidation, advantageController.delete);

/* ---------- STATS ---------- */
router.get('/stats', statsController.getAll);
router.post('/stats', statsValidation, statsController.create);
router.put('/stats/:id', idParamValidation, statsController.update);
router.delete('/stats/:id', idParamValidation, statsController.delete);

/* ---------- SETTINGS ---------- */
router.put('/settings', settingsValidation, settingsController.upsert);
router.put('/settings/bulk', settingsController.bulkUpdate);
router.delete('/settings/:key', settingsController.delete);

/* ---------- PROJECTS ---------- */
router.get('/projects', projectController.getAll);
router.get('/projects/:id', idParamValidation, projectController.getById);
router.post('/projects', upload.single('image'), projectController.create);
router.put('/projects/:id', idParamValidation, upload.single('image'), projectController.update);
router.delete('/projects/:id', idParamValidation, projectController.delete);

/* ---------- SUBSCRIBERS ---------- */
router.get('/subscribers', subscriberController.getAll);
router.get('/subscribers/export', subscriberController.exportCsv);
router.delete('/subscribers/:id', idParamValidation, subscriberController.delete);

module.exports = router;
