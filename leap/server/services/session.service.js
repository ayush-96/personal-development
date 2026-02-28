require('dotenv').config();
const { pool } = require('../config/database');

/* Create a new chat session */
async function createSession({ spaceId, userId, chatAssistantId, ragflowSessionId = null, title = null }) {
    const [insertResult] = await pool.execute(
        `
        INSERT INTO chat_sessions (space_id, user_id, chat_assistant_id, ragflow_session_id, title, isdeleted)
        VALUES (?, ?, ?, ?, ?, FALSE)
        `,
        [spaceId, userId, chatAssistantId, ragflowSessionId, title]
    );

    const sessionId = insertResult.insertId;

    const [rows] = await pool.execute(
        `
        SELECT id, space_id, user_id, chat_assistant_id, ragflow_session_id, title, created_at, updated_at, isdeleted
        FROM chat_sessions
        WHERE id = ?
        LIMIT 1
        `,
        [sessionId]
    );

    return rows[0];
}

/* Get a session by id for a given user */
async function getSessionForUser(sessionId, userId) {
    const [rows] = await pool.execute(
        `
        SELECT id, space_id, user_id, chat_assistant_id, ragflow_session_id, title, created_at, updated_at, isdeleted
        FROM chat_sessions
        WHERE id = ? AND user_id = ? AND isdeleted = FALSE
        LIMIT 1
        `,
        [sessionId, userId]
    );

    if (!rows.length) {
        const error = new Error('Session not found or access denied');
        error.statusCode = 404;
        throw error;
    }

    return rows[0];
}

/* List sessions by user, space and assistant */
async function listSessionsByUserAndAssistant(userId, spaceId, chatAssistantId) {
    const [rows] = await pool.execute(
        `
        SELECT id, space_id, user_id, chat_assistant_id, ragflow_session_id, title, created_at, updated_at, isdeleted
        FROM chat_sessions
        WHERE user_id = ?
          AND space_id = ?
          AND chat_assistant_id = ?
          AND isdeleted = FALSE
        ORDER BY updated_at DESC, created_at DESC
        `,
        [userId, spaceId, chatAssistantId]
    );

    return rows;
}

/* List sessions by user and space */
async function listSessionsByUserAndSpace(userId, spaceId) {
    const [rows] = await pool.execute(
        `
        SELECT id, space_id, user_id, chat_assistant_id, ragflow_session_id, title, created_at, updated_at, isdeleted
        FROM chat_sessions
        WHERE user_id = ?
          AND space_id = ?
          AND isdeleted = FALSE
        ORDER BY updated_at DESC, created_at DESC
        `,
        [userId, spaceId]
    );

    return rows;
}

/* Rename a session */
async function renameSession(userId, sessionId, title) {
    const [result] = await pool.execute(
        `
        UPDATE chat_sessions
        SET title = ?
        WHERE id = ? AND user_id = ? AND isdeleted = FALSE
        `,
        [title, sessionId, userId]
    );

    if (result.affectedRows === 0) {
        const error = new Error('Session not found or access denied');
        error.statusCode = 404;
        throw error;
    }

    const [rows] = await pool.execute(
        `
        SELECT id, space_id, user_id, chat_assistant_id, ragflow_session_id, title, created_at, updated_at, isdeleted
        FROM chat_sessions
        WHERE id = ?
        LIMIT 1
        `,
        [sessionId]
    );

    return rows[0];
}

/* Soft delete a session */
async function softDeleteSession(userId, sessionId) {
    const [result] = await pool.execute(
        `
        UPDATE chat_sessions
        SET isdeleted = TRUE
        WHERE id = ? AND user_id = ? AND isdeleted = FALSE
        `,
        [sessionId, userId]
    );

    if (result.affectedRows === 0) {
        const error = new Error('Session not found or access denied');
        error.statusCode = 404;
        throw error;
    }

    return true;
}

/* Update session updated_at */
async function touchSession(sessionId) {
    await pool.execute(
        `
        UPDATE chat_sessions
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [sessionId]
    );
}

module.exports = {
    createSession,
    getSessionForUser,
    listSessionsByUserAndAssistant,
    listSessionsByUserAndSpace,
    renameSession,
    softDeleteSession,
    touchSession
};