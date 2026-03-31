/* ========================================
   PUBLIC API ROUTES — No authentication required
   ======================================== */

const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contactController');
const reviewController = require('../controllers/reviewController');
const pricingController = require('../controllers/pricingController');
const faqController = require('../controllers/faqController');
const advantageController = require('../controllers/advantageController');
const statsController = require('../controllers/statsController');
const settingsController = require('../controllers/settingsController');
const projectController = require('../controllers/projectController');
const subscriberController = require('../controllers/subscriberController');

const { contactValidation } = require('../middleware/validate');

// Contact form
router.post('/contacts', contactValidation, contactController.create);

// Reviews
router.get('/reviews', reviewController.getPublic);

// Pricing
router.get('/pricing', pricingController.getPublic);

// FAQs
router.get('/faqs', faqController.getPublic);

// Advantages
router.get('/advantages', advantageController.getPublic);

// Stats
router.get('/stats', statsController.getPublic);

// Settings
router.get('/settings', settingsController.getPublic);
router.get('/settings/:key', settingsController.getByKey);

// Projects
router.get('/projects', projectController.getPublic);
router.get('/projects/featured', projectController.getFeatured);
router.get('/projects/categories', projectController.getCategories);

// Newsletter
router.post('/subscribe', subscriberController.subscribe);
router.post('/unsubscribe', subscriberController.unsubscribe);

module.exports = router;
