const chatService = require('../services/chat.service');
const response = require('../utils/response');

/* Get chat overview for a space */
exports.getChatOverview = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const spaceId = Number(req.params.spaceId);

        const overview = await chatService.getChatOverview(userId, spaceId);

        return res.status(200).json(response.success(overview, 'Chat overview fetched'));
    } catch (err) {
        const status = err.statusCode || 500;
        const message = err.message || 'Internal server error';
        return res.status(status).json(response.error(message, status));
    }
};

/* Create a new chat session */
exports.createChatSession = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { spaceId, mode } = req.body;

        if (!spaceId || !mode) {
            return res.status(400).json(response.error('spaceId and mode are required', 6002));
        }

        const session = await chatService.createSession(userId, {
            spaceId: Number(spaceId),
            mode, // "RAG" | "GENERAL" | "STUDY"
        });

        return res.status(201).json(response.success(session, 'Session created'));
    } catch (err) {
        const status = err.statusCode || 500;
        const message = err.message || 'Internal server error';
        return res.status(status).json(response.error(message, status));
    }
};

/* Rename a chat session */
exports.renameChatSession = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const sessionId = Number(req.params.sessionId);
        const { title } = req.body;

        if (!title || !title.trim()) {
            const error = new Error('title is required');
            error.statusCode = 400;
            throw error;
        }

        const session = await chatService.renameChatSession(userId, sessionId, title.trim());

        return res.status(200).json(response.success(session, 'Session renamed'));
    } catch (err) {
        const status = err.statusCode || 500;
        const message = err.message || 'Internal server error';
        return res.status(status).json(response.error(message, status));
    }
};

/* Delete a chat session */
exports.deleteChatSession = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const sessionId = Number(req.params.sessionId);

        await chatService.deleteChatSession(userId, sessionId);

        return res.status(200).json(response.success(null, 'Session deleted'));
    } catch (err) {
        const status = err.statusCode || 500;
        const message = err.message || 'Internal server error';
        return res.status(status).json(response.error(message, status));
    }
};

/* Get messages of a session */
exports.getSessionMessages = async (req, res, next) => {
    try {
        const userId = req.user.userId;  
        const sessionId = Number(req.params.sessionId);

        const messages = await chatService.getSessionMessages(userId, sessionId);

        return res.status(200).json(response.success(messages, 'Session messages fetched'));
    } catch (err) {
        const status = err.statusCode || 500;
        const message = err.message || 'Internal server error';
        return res.status(status).json(response.error(message, status));
    }
};

/* Send a message in a session */
exports.sendSessionMessage = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const sessionId = Number(req.params.sessionId);
        const { content } = req.body;

        if (!content || !content.trim()) {
            const error = new Error('content is required');
            error.statusCode = 400;
            throw error;
        }

        const result = await chatService.sendSessionMessage(userId, sessionId, content.trim());

        // result can contain: { userMessage, assistantMessage, session }
        return res.status(200).json(response.success(result, 'Message sent'));
    } catch (err) {
        const status = err.statusCode || 500;
        const message = err.message || 'Internal server error';
        return res.status(status).json(response.error(message, status));
    }
};

/* Get RagFlow assistant status for a space */
exports.getRagflowStatus = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const spaceId = Number(req.params.spaceId);

        const ragflowStatus = await chatService.getRagflowStatus(userId, spaceId);

        return res.status(200).json(response.success(ragflowStatus, 'RagFlow assistant status fetched'));
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'Internal server error';
        return res.status(status).json(response.error(message, status));
    }
};