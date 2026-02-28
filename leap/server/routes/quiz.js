const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const quizController = require('../controllers/quiz.controller');

router.post('/generate', authMiddleware.verifyToken, quizController.generateQuiz);
router.post('/regenerate', authMiddleware.verifyToken, quizController.regenerateQuiz);
router.post('/edit', authMiddleware.verifyToken, quizController.editQuiz);
router.post('/publish', authMiddleware.verifyToken, quizController.publishQuiz);
router.post('/unpublish', authMiddleware.verifyToken, quizController.unpublishQuiz);
router.post('/attempt', authMiddleware.verifyToken, quizController.saveQuizAttempt);
router.get('/attempt/history', authMiddleware.verifyToken, quizController.getQuizAttemptHistory);
router.get('/attempt/stats', authMiddleware.verifyToken, quizController.getQuizAttemptStats);
router.get('/versions', authMiddleware.verifyToken, quizController.getQuizVersions);
router.post('/practice/generate', authMiddleware.verifyToken, quizController.generateEphemeralQuiz);
router.get('/', authMiddleware.verifyToken, quizController.getQuizByFileId);

module.exports = router;