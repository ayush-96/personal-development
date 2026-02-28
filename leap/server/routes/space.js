const express = require('express');
const router = express.Router();

const spaceController = require('../controllers/space.controller');
const auth = require('../middlewares/auth.middleware');

// Create a new space
router.post('/', auth.verifyToken, spaceController.createSpace);

// Get all spaces
router.get('/spaces-with-files', auth.verifyToken, spaceController.getSpacesWithFilesByUserId);

// Get a space by id
router.get('/:id', auth.verifyToken, spaceController.getSpaceById);

// Update a space
router.put('/:id', auth.verifyToken, spaceController.updateSpace);

// Delete a space
router.delete('/:id', auth.verifyToken, spaceController.deleteSpace);

module.exports = router;