const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const chatController = require('../controllers/chat.controller');

/* Get chat overview for a space */
router.get('/:spaceId/overview', auth.verifyToken, chatController.getChatOverview);

/* Create a new chat session */
router.post('/sessions', auth.verifyToken, chatController.createChatSession);

/* Rename a chat session */
router.put('/sessions/:sessionId', auth.verifyToken, chatController.renameChatSession);

/* Delete a chat session */
router.delete('/sessions/:sessionId', auth.verifyToken, chatController.deleteChatSession);

/* Get messages of a session */
router.get('/sessions/:sessionId/messages', auth.verifyToken, chatController.getSessionMessages);

/* Send a message in a session */
router.post('/sessions/:sessionId/messages', auth.verifyToken, chatController.sendSessionMessage);

/* Get RagFlow assistant status for a space */
router.get('/:spaceId/ragflow-status', auth.verifyToken, chatController.getRagflowStatus);

module.exports = router;