require('dotenv').config();
const { pool } = require('../config/database');

/* Create a user message */
async function createUserMessage({ sessionId, provider, content, model = null }) {
    const [insertResult] = await pool.execute(
        `
        INSERT INTO chat_messages (session_id, provider, role, content, model)
        VALUES (?, ?, 'user', ?, ?)
        `,
        [sessionId, provider, content, model]
    );

    const messageId = insertResult.insertId;

    const [rows] = await pool.execute(
        `
        SELECT id, session_id, provider, role, content, model,
               external_message_id, tool_name, tool_call_id,
               prompt_tokens, completion_tokens, total_tokens,
               metadata, created_at
        FROM chat_messages
        WHERE id = ?
        LIMIT 1
        `,
        [messageId]
    );

    return rows[0];
}

/* Create an assistant message */
async function createAssistantMessage({
    sessionId,
    provider,
    content,
    model = null,
    externalMessageId = null,
    promptTokens = null,
    completionTokens = null,
    totalTokens = null,
    metadata = null
}) {
    const [insertResult] = await pool.execute(
        `
        INSERT INTO chat_messages (
            session_id,
            provider,
            role,
            content,
            model,
            external_message_id,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            metadata
        )
        VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            sessionId,
            provider,
            content,
            model,
            externalMessageId,
            promptTokens,
            completionTokens,
            totalTokens,
            metadata ? JSON.stringify(metadata) : null
        ]
    );

    const messageId = insertResult.insertId;

    const [rows] = await pool.execute(
        `
        SELECT id, session_id, provider, role, content, model,
               external_message_id, tool_name, tool_call_id,
               prompt_tokens, completion_tokens, total_tokens,
               metadata, created_at
        FROM chat_messages
        WHERE id = ?
        LIMIT 1
        `,
        [messageId]
    );

    // Parse metadata JSON if needed
    const msg = rows[0];
    if (msg && msg.metadata) {
        try {
            msg.metadata = JSON.parse(msg.metadata);
        } catch (e) {
            // ignore parse error
        }
    }

    return msg;
}

/* Get messages by session with optional pagination */
async function getMessagesBySession(sessionId) {
    const [rows] = await pool.execute(
        `
        SELECT 
            id,
            session_id,
            provider,
            role,
            content,
            model,
            external_message_id,
            tool_name,
            tool_call_id,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            metadata,
            created_at
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at ASC
        `,
        [sessionId]
    );

    return rows.map((msg) => {
        if (msg.metadata) {
            try {
                msg.metadata = JSON.parse(msg.metadata);
            } catch (e) { }
        }
        return msg;
    });
}

/* Get messages for LLM context */
/* Get messages for LLM context */
async function getMessagesForContext(sessionId, options = {}) {
    // 处理 sessionId，确保是合法数字
    const sid = Number(sessionId);
    if (!Number.isFinite(sid) || sid <= 0) {
        throw new Error('Invalid sessionId for getMessagesForContext');
    }

    // 处理 maxMessages，并限制在 1~50 之间
    let maxMessages = options.maxMessages;
    maxMessages = Number(
        maxMessages !== undefined && maxMessages !== null ? maxMessages : 20
    );

    if (!Number.isFinite(maxMessages) || maxMessages <= 0) {
        maxMessages = 20;
    }
    if (maxMessages > 50) {
        maxMessages = 50;
    }

    // ⚠️ 不再在 LIMIT 里用占位符，而是直接插入“消毒后”的整数
    const sql = `
        SELECT id, session_id, provider, role, content, model,
               external_message_id, tool_name, tool_call_id,
               prompt_tokens, completion_tokens, total_tokens,
               metadata, created_at
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at DESC
        LIMIT ${maxMessages}
    `;

    const [rows] = await pool.execute(sql, [sid]);  // 这里只有一个占位符：session_id

    const reversed = rows.reverse().map((msg) => {
        if (msg.metadata) {
            try {
                msg.metadata = JSON.parse(msg.metadata);
            } catch (e) {}
        }
        return msg;
    });

    return reversed;
}

module.exports = {
    createUserMessage,
    createAssistantMessage,
    getMessagesBySession,
    getMessagesForContext
};