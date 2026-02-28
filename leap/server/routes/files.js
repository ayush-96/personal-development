const express = require('express');
const router = express.Router();

const fileController = require('../controllers/file.controller');
const auth = require('../middlewares/auth.middleware');

// Upload a PDF
router.post('/:spaceId/upload', auth.verifyToken, fileController.uploadFile);

// List current user's files
router.get('/', auth.verifyToken, fileController.getFilesByUserId);

// Get processing status of a specific file
router.get('/:fileId/status', auth.verifyToken, fileController.getFileStatus);

// Rename file, just update the title in the database
router.post('/:fileId/rename', auth.verifyToken, fileController.renameFile);

// Delete file, just update the isdeleted flag in the database
router.delete('/:fileId', auth.verifyToken, fileController.deleteFile);

module.exports = router;