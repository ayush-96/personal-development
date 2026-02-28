const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

const userController = require('../controllers/user.controller');

// user registration
router.post('/register', userController.register);

// user login
router.post('/login', userController.login);

// get current logged-in user's info (requires token)
router.get('/me', authMiddleware.verifyToken, userController.getMe);

module.exports = router;