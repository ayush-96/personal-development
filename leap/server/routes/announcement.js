const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const announcementController = require('../controllers/announcement.controller');

// Get all announcements (published for students, all for teachers)
router.get('/', authMiddleware.verifyToken, announcementController.getAnnouncements);

// Get a single announcement by ID
router.get('/:id', authMiddleware.verifyToken, announcementController.getAnnouncementById);

// Create a new announcement (teachers only)
router.post('/', authMiddleware.verifyToken, announcementController.createAnnouncement);

// Update an announcement (teachers only, their own)
router.put('/:id', authMiddleware.verifyToken, announcementController.updateAnnouncement);

// Delete an announcement (teachers only, their own)
router.delete('/:id', authMiddleware.verifyToken, announcementController.deleteAnnouncement);

module.exports = router;

