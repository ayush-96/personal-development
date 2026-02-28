require('dotenv').config();
const { flashCardGenerator, questionGenerator, answerGenerator, incorrectAnswerGenerator, shuffleArray } = require('../utils/quizGenerator');
const { pool } = require('../config/database');


// generate quiz
// body: { filePath }, example: { filePath: '/Users/lukeshuo/Develop/Github/LEAP/LEAP_V1.1/server/files/pgr.md' }
// return { flashcards, questions }
async function generateQuiz(fileId, filePath, difficulty='Hard', quizVersion=1) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const questions = [];
        const { flashcards } = await flashCardGenerator(filePath);

        // Step 1: Generate all questions in parallel (API calls only, no DB operations)
        const questionDataPromises = flashcards.map(async (flashcard) => {
            // Generate question, answer, and incorrect answers sequentially (they depend on each other)
            const { question } = await questionGenerator(flashcard.content, difficulty);
            const { choice, reference } = await answerGenerator(question, flashcard.content, difficulty);
            const { choices } = await incorrectAnswerGenerator(choice, question, flashcard.content, difficulty);
            
            return {
                flashcard,
                question,
                choice,
                reference,
                choices
            };
        });

        // Wait for all API calls to complete in parallel
        const questionDataResults = await Promise.all(questionDataPromises);

        // Step 2: Insert all data into database sequentially (to avoid transaction conflicts)
        for (const { flashcard, question, choice, reference, choices } of questionDataResults) {
            // Insert flashcard with version
            const [result] = await connection.execute(
                'INSERT INTO flashcards (file_id, topic, content, isdeleted, quiz_version) VALUES (?, ?, ?, FALSE, ?)',
                [fileId, flashcard.topic, flashcard.content, quizVersion]
            );
            const flashcardId = result.insertId;

            // Insert question with version
            await connection.execute(
                'INSERT INTO multiple_choice_question (flashcard_id, question_text, correct_option, incorrect_options, difficulty, answer_reference, isdeleted, quiz_version) VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)',
                [flashcardId, question, {choice}, {choices}, difficulty, reference, quizVersion]
            );

            // assemble question object
            questions.push({
                question: question,
                options: shuffleArray([choice, ...choices]), // shuffle options
                correctAnswer: choice,
                answerReference: reference,
            });
        }
        
        // Update file's quiz_version
        await connection.execute(
            'UPDATE files SET quiz_version = ? WHERE id = ?',
            [quizVersion, fileId]
        );
        
        await connection.commit();
        return { flashcards, questions, quizVersion };
    } catch (error) {
        await connection.rollback();
        throw new Error(`Error generating quiz: ${error}`);
    } finally {
        connection.release();
    }
}

async function getQuizByFileId(fileId, userId = null, userRole = null, quizVersion = null) {
    const connection = await pool.getConnection();
    try {
        // Get current quiz version if not specified
        if (quizVersion === null) {
            const [fileRows] = await connection.execute(
                'SELECT quiz_version FROM files WHERE id = ? AND isdeleted = FALSE',
                [fileId]
            );
            quizVersion = fileRows[0]?.quiz_version || 1;
        }
        
        // For students, only show published quizzes
        // For teachers, show all quizzes they own
        let query = `
            SELECT mcq.*, f.quiz_published, f.uploader_id, f.quiz_version
            FROM multiple_choice_question mcq
            JOIN flashcards fc ON mcq.flashcard_id = fc.id
            JOIN files f ON fc.file_id = f.id
            WHERE fc.file_id = ? 
              AND mcq.isdeleted = FALSE 
              AND fc.isdeleted = FALSE
              AND mcq.quiz_version = ?
              AND fc.quiz_version = ?
        `;
        
        const params = [fileId, quizVersion, quizVersion];
        
        // If user is a student, only show published quizzes
        if (userRole === 'student') {
            query += ` AND f.quiz_published = TRUE`;
        }
        // If user is a teacher, show quizzes they own (published or not)
        else if (userRole === 'teacher' && userId) {
            query += ` AND f.uploader_id = ?`;
            params.push(userId);
        }
        
        const [result] = await connection.execute(query, params);
        return result;
    } catch (error) {
        throw new Error(`Error getting quiz by file id: ${error}`);
    } finally {
        connection.release();
    }
}

// Delete existing quiz data for a file (soft delete)
async function deleteQuizByFileId(fileId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Get all flashcard IDs for this file
        const [flashcards] = await connection.execute(
            `SELECT id FROM flashcards WHERE file_id = ? AND isdeleted = FALSE`,
            [fileId]
        );
        
        if (flashcards.length === 0) {
            await connection.commit();
            return { deleted: false, message: 'No quiz found for this file' };
        }
        
        const flashcardIds = flashcards.map(fc => fc.id);
        const placeholders = flashcardIds.map(() => '?').join(',');
        
        // Soft delete multiple choice questions
        await connection.execute(
            `UPDATE multiple_choice_question 
             SET isdeleted = TRUE 
             WHERE flashcard_id IN (${placeholders}) AND isdeleted = FALSE`,
            flashcardIds
        );
        
        // Soft delete flashcards
        await connection.execute(
            `UPDATE flashcards 
             SET isdeleted = TRUE 
             WHERE file_id = ? AND isdeleted = FALSE`,
            [fileId]
        );
        
        await connection.commit();
        return { 
            deleted: true, 
            flashcardsDeleted: flashcards.length,
            message: `Deleted ${flashcards.length} flashcards and associated questions` 
        };
    } catch (error) {
        await connection.rollback();
        throw new Error(`Error deleting quiz by file id: ${error}`);
    } finally {
        connection.release();
    }
}

// Regenerate quiz: delete existing and generate new (preserves history by creating new version)
async function regenerateQuiz(fileId, filePath, difficulty = 'Hard') {
    const connection = await pool.getConnection();
    try {
        // Get current quiz version
        const [fileRows] = await connection.execute(
            'SELECT quiz_version FROM files WHERE id = ? AND isdeleted = FALSE',
            [fileId]
        );
        const currentVersion = fileRows[0]?.quiz_version || 0;
        const newVersion = currentVersion + 1;
        
        // Soft delete current version (preserve old versions for history)
        await deleteQuizByFileId(fileId);
        
        // Generate new quiz with incremented version
        return await generateQuiz(fileId, filePath, difficulty, newVersion);
    } catch (error) {
        throw new Error(`Error regenerating quiz: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Edit quiz: create new version while preserving old version (for editing published quizzes)
async function editQuiz(fileId, filePath, difficulty = 'Hard') {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Get current quiz version and publish status
        const [fileRows] = await connection.execute(
            'SELECT quiz_version, quiz_published FROM files WHERE id = ? AND isdeleted = FALSE',
            [fileId]
        );
        
        if (fileRows.length === 0) {
            throw new Error('File not found');
        }
        
        const currentVersion = fileRows[0].quiz_version || 0;
        const isPublished = fileRows[0].quiz_published;
        const newVersion = currentVersion + 1;
        
        // If quiz is published, unpublish it first (teacher needs to republish after editing)
        if (isPublished) {
            await connection.execute(
                'UPDATE files SET quiz_published = FALSE, quiz_published_by = NULL, quiz_published_at = NULL WHERE id = ?',
                [fileId]
            );
        }
        
        // Soft delete current version questions (preserve for history)
        const [flashcards] = await connection.execute(
            'SELECT id FROM flashcards WHERE file_id = ? AND quiz_version = ? AND isdeleted = FALSE',
            [fileId, currentVersion]
        );
        
        if (flashcards.length > 0) {
            const flashcardIds = flashcards.map(fc => fc.id);
            const placeholders = flashcardIds.map(() => '?').join(',');
            
            await connection.execute(
                `UPDATE multiple_choice_question SET isdeleted = TRUE WHERE flashcard_id IN (${placeholders}) AND isdeleted = FALSE`,
                flashcardIds
            );
            
            await connection.execute(
                'UPDATE flashcards SET isdeleted = TRUE WHERE file_id = ? AND quiz_version = ? AND isdeleted = FALSE',
                [fileId, currentVersion]
            );
        }
        
        await connection.commit();
        connection.release();
        
        // Generate new quiz with new version (this will get its own connection)
        return await generateQuiz(fileId, filePath, difficulty, newVersion);
    } catch (error) {
        await connection.rollback();
        connection.release();
        throw new Error(`Error editing quiz: ${error.message}`);
    }
}

// Publish quiz: mark quiz as published so students can see it
async function publishQuiz(fileId, userId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Check if quiz exists for this file
        const [quizExists] = await connection.execute(
            `SELECT COUNT(*) as count
            FROM multiple_choice_question mcq
            JOIN flashcards fc ON mcq.flashcard_id = fc.id
            WHERE fc.file_id = ? AND mcq.isdeleted = FALSE AND fc.isdeleted = FALSE`,
            [fileId]
        );
        
        if (quizExists[0].count === 0) {
            throw new Error('No quiz found for this file. Please generate a quiz first.');
        }
        
        // Update file to mark quiz as published
        await connection.execute(
            `UPDATE files 
             SET quiz_published = TRUE, 
                 quiz_published_by = ?, 
                 quiz_published_at = CURRENT_TIMESTAMP
             WHERE id = ? AND isdeleted = FALSE`,
            [userId, fileId]
        );
        
        await connection.commit();
        return { published: true, message: 'Quiz published successfully' };
    } catch (error) {
        await connection.rollback();
        throw new Error(`Error publishing quiz: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Unpublish quiz: mark quiz as unpublished
async function unpublishQuiz(fileId, userId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Update file to mark quiz as unpublished
        await connection.execute(
            `UPDATE files 
             SET quiz_published = FALSE, 
                 quiz_published_by = NULL, 
                 quiz_published_at = NULL
             WHERE id = ? AND isdeleted = FALSE`,
            [fileId]
        );
        
        await connection.commit();
        return { published: false, message: 'Quiz unpublished successfully' };
    } catch (error) {
        await connection.rollback();
        throw new Error(`Error unpublishing quiz: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Get quiz publishing status for a file
async function getQuizPublishStatus(fileId) {
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(
            `SELECT quiz_published, quiz_published_by, quiz_published_at
             FROM files
             WHERE id = ? AND isdeleted = FALSE`,
            [fileId]
        );
        
        if (result.length === 0) {
            return null;
        }
        
        return {
            published: result[0].quiz_published === 1,
            publishedBy: result[0].quiz_published_by,
            publishedAt: result[0].quiz_published_at
        };
    } catch (error) {
        throw new Error(`Error getting quiz publish status: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Save quiz attempt: record student's quiz completion with score
async function saveQuizAttempt(userId, fileId, score, totalQuestions) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Get current quiz version
        const [fileRows] = await connection.execute(
            'SELECT quiz_version FROM files WHERE id = ? AND isdeleted = FALSE',
            [fileId]
        );
        const quizVersion = fileRows[0]?.quiz_version || 1;
        
        // Get the next attempt number for this user and file
        const [attempts] = await connection.execute(
            `SELECT MAX(attempt_number) as max_attempt
             FROM quiz_attempts
             WHERE user_id = ? AND file_id = ? AND isdeleted = FALSE`,
            [userId, fileId]
        );
        
        const nextAttemptNumber = (attempts[0].max_attempt || 0) + 1;
        
        // Insert the quiz attempt with version
        const [result] = await connection.execute(
            `INSERT INTO quiz_attempts 
             (user_id, file_id, score, total_questions, attempt_number, quiz_version, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [userId, fileId, score, totalQuestions, nextAttemptNumber, quizVersion]
        );
        
        await connection.commit();
        return {
            id: result.insertId,
            attemptNumber: nextAttemptNumber,
            score,
            totalQuestions,
            quizVersion,
            message: 'Quiz attempt saved successfully'
        };
    } catch (error) {
        await connection.rollback();
        throw new Error(`Error saving quiz attempt: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Get quiz attempt history for a user and file
async function getQuizAttemptHistory(userId, fileId) {
    const connection = await pool.getConnection();
    try {
        const [attempts] = await connection.execute(
            `SELECT id, score, total_questions, attempt_number, quiz_version, started_at, completed_at
             FROM quiz_attempts
             WHERE user_id = ? AND file_id = ? AND isdeleted = FALSE
             ORDER BY attempt_number DESC`,
            [userId, fileId]
        );
        
        return attempts.map(attempt => ({
            id: attempt.id,
            score: attempt.score,
            totalQuestions: attempt.total_questions,
            attemptNumber: attempt.attempt_number,
            quizVersion: attempt.quiz_version,
            percentage: ((attempt.score / attempt.total_questions) * 100).toFixed(1),
            startedAt: attempt.started_at,
            completedAt: attempt.completed_at
        }));
    } catch (error) {
        throw new Error(`Error getting quiz attempt history: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Get quiz versions for a file (for teachers to see all versions)
async function getQuizVersions(fileId) {
    const connection = await pool.getConnection();
    try {
        const [versions] = await connection.execute(
            `SELECT DISTINCT quiz_version, 
                    COUNT(DISTINCT fc.id) as question_count,
                    COUNT(DISTINCT qa.id) as attempt_count,
                    MIN(fc.created_at) as created_at
             FROM flashcards fc
             LEFT JOIN quiz_attempts qa ON qa.file_id = ? AND qa.quiz_version = fc.quiz_version AND qa.isdeleted = FALSE
             WHERE fc.file_id = ? AND fc.isdeleted = FALSE
             GROUP BY quiz_version
             ORDER BY quiz_version DESC`,
            [fileId, fileId]
        );
        
        return versions.map(v => ({
            version: v.quiz_version,
            questionCount: v.question_count,
            attemptCount: v.attempt_count || 0,
            createdAt: v.created_at
        }));
    } catch (error) {
        throw new Error(`Error getting quiz versions: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Get quiz attempt statistics (retry count, best score, etc.)
async function getQuizAttemptStats(userId, fileId) {
    const connection = await pool.getConnection();
    try {
        const [stats] = await connection.execute(
            `SELECT 
                COUNT(*) as total_attempts,
                MAX(score) as best_score,
                MAX(total_questions) as total_questions,
                AVG(score) as average_score,
                MIN(completed_at) as first_attempt_at,
                MAX(completed_at) as last_attempt_at
             FROM quiz_attempts
             WHERE user_id = ? AND file_id = ? AND isdeleted = FALSE`,
            [userId, fileId]
        );
        
        if (stats[0].total_attempts === 0) {
            return {
                totalAttempts: 0,
                retryCount: 0,
                bestScore: null,
                totalQuestions: null,
                averageScore: null,
                bestPercentage: null,
                firstAttemptAt: null,
                lastAttemptAt: null
            };
        }
        
        const stat = stats[0];
        const retryCount = stat.total_attempts > 0 ? stat.total_attempts - 1 : 0;
        const bestPercentage = stat.total_questions > 0 
            ? ((stat.best_score / stat.total_questions) * 100).toFixed(1) 
            : null;
        const avgPercentage = stat.total_questions > 0 
            ? ((stat.average_score / stat.total_questions) * 100).toFixed(1) 
            : null;
        
        return {
            totalAttempts: stat.total_attempts,
            retryCount: retryCount,
            bestScore: stat.best_score,
            totalQuestions: stat.total_questions,
            averageScore: parseFloat(stat.average_score).toFixed(1),
            bestPercentage: bestPercentage,
            averagePercentage: avgPercentage,
            firstAttemptAt: stat.first_attempt_at,
            lastAttemptAt: stat.last_attempt_at
        };
    } catch (error) {
        throw new Error(`Error getting quiz attempt stats: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Generate ephemeral quiz: generate quiz without saving to database (for student practice)
async function generateEphemeralQuiz(filePath, difficulty = 'Hard') {
    try {
        const { flashCardGenerator, generateCompleteQuestion, shuffleArray } = require('../utils/quizGenerator');
        
        const questions = [];
        const { flashcards } = await flashCardGenerator(filePath);

        // Generate all questions in parallel
        const questionDataPromises = flashcards.map(async (flashcard) => {
            const { question, choice, reference, choices } = await generateCompleteQuestion(flashcard.content, difficulty);
            
            return {
                question: question,
                options: shuffleArray([choice, ...choices]),
                correctAnswer: choice,
                answerReference: reference,
            };
        });

        const questionResults = await Promise.all(questionDataPromises);
        questions.push(...questionResults);
        
        return { questions };
    } catch (error) {
        throw new Error(`Error generating ephemeral quiz: ${error.message}`);
    }
}

module.exports = {
    generateQuiz,
    getQuizByFileId,
    deleteQuizByFileId,
    regenerateQuiz,
    editQuiz,
    publishQuiz,
    unpublishQuiz,
    getQuizPublishStatus,
    saveQuizAttempt,
    getQuizAttemptHistory,
    getQuizAttemptStats,
    getQuizVersions,
    generateEphemeralQuiz
};