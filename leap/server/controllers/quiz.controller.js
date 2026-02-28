const quizService = require('../services/quiz.service');
const fileService = require('../services/file.service');
const response = require('../utils/response');
const { shuffleArray } = require('../utils/quizGenerator');
const path = require('path');
const fs = require('fs');

// generate quiz
// body: { fileId, storage_key }
// return {
//     "code": 0,
//     "success":true,
//     "message":"Quiz generated successfully",
//     "data":[
//         {
//             "question": "What are the potential consequences of large university class sizes on the student experience that require deeper analysis or inference?",
//             "options": [
//                 "Higher likelihood of students forming more meaningful connections with faculty.",
//                 "Large class sizes may lead to feelings of student isolation and lack of individualised support, potentially affecting student engagement and academic performance.",
//                 "Enhanced student autonomy and self-directed learning due to less structured environments.",
//                 "Increased opportunities for peer-to-peer learning that may mitigate isolation."
//             ],
//             "correctAnswer": "Large class sizes may lead to feelings of student isolation and lack of individualised support, potentially affecting student engagement and academic performance.",
//             "answerReference": "Universities often have large class sizes, making it challenging for educators to provide personalised attention, tailored feedback, and intimate interactions. This can lead to students feeling isolated and a lack of individualised support."
//         },
//         {
//             "question": "What complex issue related to student engagement could contribute to high drop-out rates in educational modules?",
//             "options": [
//                 "Overly challenging course material",
//                 "Inadequate financial resources for students",
//                 "Insufficient access to administrative support",
//                 "Limited student engagement with module content and forums"
//             ],
//             "correctAnswer": "Limited student engagement with module content and forums",
//             "answerReference": "There's a persistent challenge with limited student engagement with module content and forums, contributing to lower retention rates and an increased risk of student drop-out."
//         }
//     ]
// }
async function generateQuiz(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only teachers can generate quizzes
        if (userRole !== 'teacher') {
            return res.status(403).json(response.error('Only teachers can generate quizzes', 4001));
        }

        const { fileId, storage_key} = req.body;

        // verify if the file belongs to the user
        const file = await fileService.verifyFileByUserId(fileId, userId);
        if (!file) {
            return res.status(404).json(response.error('File not found'));
        }

        const {name, ext} = path.parse(storage_key);
        const filePath = path.join(__dirname, '../files', name, 'full.md');
        const { questions } = await quizService.generateQuiz(fileId, filePath);
        res.status(200).json(response.success(questions, 'Quiz generated successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

async function getQuizByFileId(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { fileId } = req.query;

        // For students, check if quiz is published
        // For teachers, check if file belongs to them
        if (userRole === 'student') {
            // Students can access published quizzes from any teacher
            const file = await fileService.getFileById(fileId);
            if (!file || !file.quiz_published) {
                return res.status(404).json(response.error('Quiz not found or not published'));
            }
        } else {
            // Teachers can only see quizzes from their own files
            const file = await fileService.verifyFileByUserId(fileId, userId);
            if (!file) {
                return res.status(404).json(response.error('File not found'));
            }
        }

        const mcqs = await quizService.getQuizByFileId(fileId, userId, userRole); // array of multiple choice questions
        const questions = mcqs.map(mcq => ({
            question: mcq.question_text,
            options: shuffleArray([mcq.correct_option.choice, ...mcq.incorrect_options.choices]),
            correctAnswer: mcq.correct_option.choice,
            answerReference: mcq.answer_reference
        }));
        
        // Also return publish status for teachers
        let publishStatus = null;
        if (userRole === 'teacher') {
            publishStatus = await quizService.getQuizPublishStatus(fileId);
        }
        
        res.status(200).json(response.success({
            questions,
            publishStatus
        }, 'Quiz fetched successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Regenerate quiz: delete existing and generate new (creates new version)
async function regenerateQuiz(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only teachers can regenerate quizzes
        if (userRole !== 'teacher') {
            return res.status(403).json(response.error('Only teachers can regenerate quizzes', 4001));
        }

        const { fileId, storage_key } = req.body;

        // verify if the file belongs to the user
        const file = await fileService.verifyFileByUserId(fileId, userId);
        if (!file) {
            return res.status(404).json(response.error('File not found'));
        }

        const {name, ext} = path.parse(storage_key);
        const filePath = path.join(__dirname, '../files', name, 'full.md');
        const { questions, quizVersion } = await quizService.regenerateQuiz(fileId, filePath);
        res.status(200).json(response.success({ questions, quizVersion }, 'Quiz regenerated successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Edit quiz: create new version while preserving old version (for editing published quizzes)
async function editQuiz(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only teachers can edit quizzes
        if (userRole !== 'teacher') {
            return res.status(403).json(response.error('Only teachers can edit quizzes', 4001));
        }

        const { fileId, storage_key } = req.body;

        // verify if the file belongs to the user
        const file = await fileService.verifyFileByUserId(fileId, userId);
        if (!file) {
            return res.status(404).json(response.error('File not found'));
        }

        const {name, ext} = path.parse(storage_key);
        const filePath = path.join(__dirname, '../files', name, 'full.md');
        const { questions, quizVersion } = await quizService.editQuiz(fileId, filePath);
        res.status(200).json(response.success({ 
            questions, 
            quizVersion,
            message: 'Quiz edited successfully. Old version preserved. Please republish to make it available to students.'
        }, 'Quiz edited successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

async function publishQuiz(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only teachers can publish quizzes
        if (userRole !== 'teacher') {
            return res.status(403).json(response.error('Only teachers can publish quizzes', 4001));
        }

        const { fileId } = req.body;

        // verify if the file belongs to the user
        const file = await fileService.verifyFileByUserId(fileId, userId);
        if (!file) {
            return res.status(404).json(response.error('File not found'));
        }

        const result = await quizService.publishQuiz(fileId, userId);
        res.status(200).json(response.success(result, 'Quiz published successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

async function unpublishQuiz(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only teachers can unpublish quizzes
        if (userRole !== 'teacher') {
            return res.status(403).json(response.error('Only teachers can unpublish quizzes', 4001));
        }

        const { fileId } = req.body;

        // verify if the file belongs to the user
        const file = await fileService.verifyFileByUserId(fileId, userId);
        if (!file) {
            return res.status(404).json(response.error('File not found'));
        }

        const result = await quizService.unpublishQuiz(fileId, userId);
        res.status(200).json(response.success(result, 'Quiz unpublished successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Save quiz attempt: record student's quiz completion
async function saveQuizAttempt(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only students can save quiz attempts
        if (userRole !== 'student') {
            return res.status(403).json(response.error('Only students can save quiz attempts', 4001));
        }

        const { fileId, score, totalQuestions } = req.body;

        if (!fileId || score === undefined || !totalQuestions) {
            return res.status(400).json(response.error('Missing required fields: fileId, score, totalQuestions'));
        }

        // Verify that the quiz is published and accessible
        const file = await fileService.getFileById(fileId);
        if (!file || !file.quiz_published) {
            return res.status(404).json(response.error('Quiz not found or not published'));
        }

        const result = await quizService.saveQuizAttempt(userId, fileId, score, totalQuestions);
        res.status(200).json(response.success(result, 'Quiz attempt saved successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Get quiz attempt history for a user and file
async function getQuizAttemptHistory(req, res) {
    try {
        const userId = req.user.userId;
        const { fileId } = req.query;

        if (!fileId) {
            return res.status(400).json(response.error('Missing required field: fileId'));
        }

        const history = await quizService.getQuizAttemptHistory(userId, fileId);
        res.status(200).json(response.success(history, 'Quiz attempt history retrieved successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Get quiz attempt statistics (retry count, best score, etc.)
async function getQuizAttemptStats(req, res) {
    try {
        const userId = req.user.userId;
        const { fileId } = req.query;

        if (!fileId) {
            return res.status(400).json(response.error('Missing required field: fileId'));
        }

        const stats = await quizService.getQuizAttemptStats(userId, fileId);
        res.status(200).json(response.success(stats, 'Quiz attempt statistics retrieved successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Get quiz versions for a file (for teachers)
async function getQuizVersions(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only teachers can view quiz versions
        if (userRole !== 'teacher') {
            return res.status(403).json(response.error('Only teachers can view quiz versions', 4001));
        }

        const { fileId } = req.query;

        if (!fileId) {
            return res.status(400).json(response.error('Missing required field: fileId'));
        }

        // verify if the file belongs to the user
        const file = await fileService.verifyFileByUserId(fileId, userId);
        if (!file) {
            return res.status(404).json(response.error('File not found'));
        }

        const versions = await quizService.getQuizVersions(fileId);
        res.status(200).json(response.success(versions, 'Quiz versions retrieved successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Generate ephemeral quiz: generate quiz from space file without saving to database (for student practice)
async function generateEphemeralQuiz(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only students can generate ephemeral quizzes
        if (userRole !== 'student') {
            return res.status(403).json(response.error('Only students can generate practice quizzes', 4001));
        }

        const { fileId, storage_key } = req.body;

        if (!fileId || !storage_key) {
            return res.status(400).json(response.error('Missing required fields: fileId, storage_key'));
        }

        // Verify that the file exists and is accessible (students can access files from spaces they're members of)
        const file = await fileService.getFileById(fileId);
        if (!file) {
            return res.status(404).json(response.error('File not found'));
        }

        // Get the file path (same as regular quiz generation)
        const { name, ext } = path.parse(storage_key);
        const filePath = path.join(__dirname, '../files', name, 'full.md');

        // Verify file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json(response.error('File content not found. File may still be processing.'));
        }

        // Generate ephemeral quiz (without saving to database)
        const { questions } = await quizService.generateEphemeralQuiz(filePath);
        res.status(200).json(response.success(questions, 'Practice quiz generated successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

module.exports = {
    generateQuiz,
    getQuizByFileId,
    regenerateQuiz,
    editQuiz,
    publishQuiz,
    unpublishQuiz,
    saveQuizAttempt,
    getQuizAttemptHistory,
    getQuizAttemptStats,
    getQuizVersions,
    generateEphemeralQuiz
};