require('dotenv').config();
const assistantService = require('./assistant.service');
const sessionService = require('./session.service');
const messageService = require('./message.service');
const { BusinessError } = require('../errors/businessError');
const { createChatCompletion } = require('../intergrations/openai.client');
const {
    createSession: ragflowCreateChatSession,
    chatCompletion: ragflowSendChatMessage
} = require('../intergrations/ragflow.client');
const { pool } = require('../config/database');

/* Get chat overview for a space (auto-create default sessions) */
async function getChatOverview(userId, spaceId) {
    // Get assistants
    let ragflow = await assistantService.getAssistantBySpaceAndType(spaceId, 'RagFlow');
    const openai = await assistantService.getAssistantBySpaceAndType(spaceId, 'OpenAI');

    // If RagFlow assistant exists but is stuck in 'creating' status, try to activate it
    if (ragflow && ragflow.status === 'creating' && !ragflow.assistant_id) {
        try {
            // Get space owner_id to activate the assistant
            const [spaceRows] = await pool.execute(
                `SELECT owner_id FROM spaces WHERE id = ? AND isdeleted = FALSE LIMIT 1`,
                [spaceId]
            );
            
            if (spaceRows.length > 0) {
                const ownerId = spaceRows[0].owner_id;
                console.log(`Attempting to activate stuck RagFlow assistant for space ${spaceId} (owner: ${ownerId})`);
                try {
                    await assistantService.activateRagflowAssistant(spaceId, ownerId);
                    // Re-fetch the assistant to get updated status
                    ragflow = await assistantService.getAssistantBySpaceAndType(spaceId, 'RagFlow');
                    console.log(`Successfully activated RagFlow assistant for space ${spaceId}`);
                } catch (activationError) {
                    console.error(`Failed to activate RagFlow assistant for space ${spaceId}:`, activationError.message);
                    // Continue with existing ragflow object - status will be 'error' now
                    ragflow = await assistantService.getAssistantBySpaceAndType(spaceId, 'RagFlow');
                }
            }
        } catch (err) {
            console.error(`Error while checking/activating RagFlow assistant for space ${spaceId}:`, err.message);
            // Continue with existing ragflow object
        }
    }

    let ragflowSessions = [];

    // Load RagFlow sessions
    if (ragflow) {
        ragflowSessions = await sessionService.listSessionsByUserAndAssistant(
            userId, spaceId, ragflow.id
        );

        // Auto-create default RagFlow session if none exists
        if (ragflowSessions.length === 0 && ragflow.status === 'ready') {
            const newSession = await sessionService.createSession({
                spaceId,
                userId,
                chatAssistantId: ragflow.id,
                ragflowSessionId: null,  // RagFlow real session can be created lazily on first user message
                title: "New RAG Session"
            });
            ragflowSessions = [newSession];
        }
    }

    // Load OpenAI sessions and separate into General and Study
    let openaiSessions = [];
    let studySessions = [];

    if (openai) {
        const allOpenAISessions = await sessionService.listSessionsByUserAndAssistant(
            userId, spaceId, openai.id
        );

        // Separate sessions into General and Study based on title and message metadata
        for (const sess of allOpenAISessions) {
            const isStudyByTitle = /study/i.test(sess.title || '');
            
            // Also check message metadata to identify study sessions more reliably
            let isStudyByMetadata = false;
            try {
                const messages = await messageService.getMessagesBySession(sess.id);
                isStudyByMetadata = messages.some(msg => 
                    msg.metadata && 
                    (msg.metadata.studyMode === true || msg.metadata.waitingForTopic === true || msg.metadata.topic)
                );
            } catch (err) {
                // If we can't check messages, just use title
                console.warn(`Could not check messages for session ${sess.id} to determine if it's a study session:`, err);
            }
            
            const isStudy = isStudyByTitle || isStudyByMetadata;
            if (isStudy) {
                studySessions.push(sess);
            } else {
                openaiSessions.push(sess);
            }
        }

        // Auto-create default OpenAI session if none exists
        if (openaiSessions.length === 0 && openai.status === 'ready') {
            const newSession = await sessionService.createSession({
                spaceId,
                userId,
                chatAssistantId: openai.id,
                ragflowSessionId: null,
                title: "New Chat"
            });
            openaiSessions = [newSession];
        }
    }

    return {
        spaceId,
        assistants: {
            RagFlow: ragflow
                ? {
                    assistantId: ragflow.assistant_id,
                    status: ragflow.status,
                    sessions: ragflowSessions,
                }
                : null,

            OpenAI: openai
                ? {
                    assistantId: openai.assistant_id,
                    status: openai.status,
                    sessions: openaiSessions,
                }
                : null,

            Study: openai
                ? {
                    assistantId: openai.assistant_id,
                    status: openai.status,
                    sessions: studySessions,
                }
                : null,
        },
    };
}

/* Create a new chat session for a user in a space */
async function createSession(userId, { spaceId, mode }) {
    if (!spaceId) {
        throw new BusinessError('spaceId is required', '6002');
    }
    if (!mode) {
        throw new BusinessError('mode is required', '6002');
    }

    const normalizedMode = String(mode).toUpperCase();
    let assistantType;

    if (normalizedMode === 'RAG') {
        assistantType = 'RagFlow';
    } else if (normalizedMode === 'GENERAL') {
        assistantType = 'OpenAI';
    } else if (normalizedMode === 'STUDY') {
        assistantType = 'OpenAI'; // Study mode uses OpenAI
    } else {
        throw new BusinessError('Invalid chat mode', '6003');
    }

    const assistant = await assistantService.getAssistantBySpaceAndType(spaceId, assistantType);

    if (!assistant || assistant.isdeleted) {
        throw new BusinessError('Assistant not found for space', '6004');
    }

    if (assistant.status !== 'ready') {
        throw new BusinessError('Assistant is not ready', '6005');
    }

    let title = null;
    let ragflowSessionId = null;
    if (assistantType === 'RagFlow') {
        title = 'New RAG Session';
        let ragflowAssistantId = assistant.assistant_id;

        // delay 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        const created = await ragflowCreateChatSession({
            chat_id: ragflowAssistantId,
            name: title
        });
        let newId = null;
        if (created?.id) {
            newId = created.id;
        } else if (created?.data?.id) {
        newId = created.data.id;
        } else if (typeof created === 'string') {
            newId = created;
        }

        console.log('newId', newId);
        console.log('created', created);
        if (!newId) {
            throw new BusinessError('Failed to create RagFlow session', '6016');
        }
        ragflowSessionId = newId;

    } else if (assistantType === 'OpenAI') {
        if (normalizedMode === 'STUDY') {
            title = 'New Study Session';
        } else {
            title = 'New chat';
        }
    }

    const session = await sessionService.createSession({
        spaceId,
        userId,
        chatAssistantId: assistant.id,
        ragflowSessionId,
        title,
    });

    // If this is a Study session, create initial welcome message
    if (normalizedMode === 'STUDY') {
        await messageService.createAssistantMessage({
            sessionId: session.id,
            provider: assistantType,
            content: "Welcome to Study Mode! What topic would you like the questions to be about?",
            model: assistant.assistant_id,
            externalMessageId: null,
            promptTokens: null,
            completionTokens: null,
            totalTokens: null,
            metadata: { studyMode: true, waitingForTopic: true }
        }).catch(err => {
            console.error(`Failed to create initial Study mode message for session ${session.id}:`, err);
            // Don't fail session creation if message creation fails
        });
    }

    return {
        ...session,
        assistantType,
        mode: normalizedMode,
    };
}

/* Rename a chat session for a user */
async function renameChatSession(userId, sessionId, title) {
    if (!sessionId) {
        throw new BusinessError('sessionId is required', '6006');
    }
    if (!title || !title.trim()) {
        throw new BusinessError('title is required', '6007');
    }

    const updated = await sessionService.renameSession(userId, sessionId, title.trim());
    return updated;
}

/* Delete a chat session for a user */
async function deleteChatSession(userId, sessionId) {
    if (!sessionId) {
        throw new BusinessError('sessionId is required', '6008');
    }

    await sessionService.softDeleteSession(userId, sessionId);

    return true;
}

/* Get messages of a session for a user */
async function getSessionMessages(userId, sessionId) {
    const sid = Number(sessionId);
    if (!sid || !Number.isFinite(sid)) {
        throw new BusinessError('sessionId is required', '6010');
    }

    await sessionService.getSessionForUser(sid, userId);

    const messages = await messageService.getMessagesBySession(sid);

    return messages;
}

/* Send a message in a session */
async function sendSessionMessage(userId, sessionId, content) {
    if (!sessionId) {
        throw new BusinessError('sessionId is required', '6011');
    }
    if (!content || !content.trim()) {
        throw new BusinessError('content is required', '6012');
    }

    const session = await sessionService.getSessionForUser(sessionId, userId);

    const assistant = await assistantService.getAssistantById(session.chat_assistant_id);
    if (!assistant || assistant.isdeleted) {
        throw new BusinessError('Assistant not found for session', '6013');
    }
    if (assistant.status !== 'ready') {
        throw new BusinessError('Assistant is not ready', '6014');
    }

    const provider = assistant.assistant_type;

    // Check if this is a Study mode session (by checking session title and message metadata)
    const isStudyByTitle = /study/i.test(session.title || '');
    let isStudyByMetadata = false;
    try {
        const messages = await messageService.getMessagesBySession(session.id);
        isStudyByMetadata = messages.some(msg => 
            msg.metadata && 
            (msg.metadata.studyMode === true || msg.metadata.waitingForTopic === true || msg.metadata.topic)
        );
    } catch (err) {
        console.warn(`Could not check messages for session ${session.id} to determine if it's a study session:`, err);
    }
    const isStudyMode = isStudyByTitle || isStudyByMetadata;

    if (provider === 'OpenAI' && isStudyMode) {
        return await handleStudySessionMessage({ session, assistant, content });
    } else if (provider === 'OpenAI') {
        return await handleOpenAISessionMessage({ session, assistant, content });
    } else if (provider === 'RagFlow') {
        return await handleRagflowSessionMessage({ session, assistant, content });
    } else {
        throw new BusinessError('Unsupported assistant type', '6015');
    }
}

/* Handle message for OpenAI session */
async function handleOpenAISessionMessage({ session, assistant, content }) {
    const sessionId = session.id;

    // Get previous messages for context (without current user message)
    const history = await messageService.getMessagesForContext(sessionId, { maxMessages: 20 });

    const messages = history.map((m) => ({
        role: m.role,
        content: m.content
    }));
    messages.push({ role: 'user', content });

    const completion = await createChatCompletion({
        model: assistant.assistant_id,
        messages,
        temperature: 0.2
    });

    const userMessage = await messageService.createUserMessage({
        sessionId,
        provider: assistant.assistant_type,
        content,
        model: completion.model
    });

    const assistantMessage = await messageService.createAssistantMessage({
        sessionId,
        provider: assistant.assistant_type,
        content: completion.content,
        model: completion.model,
        externalMessageId: null,
        promptTokens: completion.usage.promptTokens,
        completionTokens: completion.usage.completionTokens,
        totalTokens: completion.usage.totalTokens,
        metadata: completion.raw
    });

    await sessionService.touchSession(sessionId);

    return {
        sessionId,
        provider: assistant.assistant_type,
        userMessage,
        assistantMessage
    };
}

/* Handle message for Study session */
async function handleStudySessionMessage({ session, assistant, content }) {
    const sessionId = session.id;
    
    // Get all messages to check if this is the first message
    const messages = await messageService.getMessagesBySession(sessionId);
    
    // Check if we're waiting for topic (find the most recent assistant message)
    let lastAssistantMessage = null;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
            lastAssistantMessage = messages[i];
            break;
        }
    }
    const isWaitingForTopic = lastAssistantMessage?.metadata?.waitingForTopic === true;
    
    // If we're waiting for topic, user is providing their topic choice
    if (isWaitingForTopic) {
        // User provided topic - generate feedback and first question using OpenAI
        const topic = content.trim();
        
        const userMessage = await messageService.createUserMessage({
            sessionId,
            provider: assistant.assistant_type,
            content,
            model: assistant.assistant_id
        });

        // Use OpenAI to provide feedback on the topic
        const feedbackPrompt = `The user wants to study about the topic: "${topic}". 
Please provide a brief, encouraging response acknowledging their topic choice (1-2 sentences).
Then, ask them a question about this topic to test their knowledge. 
Make the question clear and relevant to the topic. Once user has responded with the answer to the question prompted to them, evaluate their response and end your response with another question on the same topic.`;

        const completion = await createChatCompletion({
            model: assistant.assistant_id,
            messages: [
                { role: 'system', content: 'You are a helpful educational assistant that encourages students in their learning journey by asking them questions on a particular topic and evaluating their responses.' },
                { role: 'user', content: feedbackPrompt }
            ],
            temperature: 0.7
        });

        const assistantMessage = await messageService.createAssistantMessage({
            sessionId,
            provider: assistant.assistant_type,
            content: completion.content,
            model: completion.model,
            externalMessageId: null,
            promptTokens: completion.usage.promptTokens,
            completionTokens: completion.usage.completionTokens,
            totalTokens: completion.usage.totalTokens,
            metadata: { studyMode: true, topic: topic, waitingForAnswer: true }
        });

        await sessionService.touchSession(sessionId);

        return {
            sessionId,
            provider: assistant.assistant_type,
            userMessage,
            assistantMessage
        };
    } else {
        // Check if we're in a study conversation (topic has been set)
        // Get topic from metadata of previous messages
        let studyTopic = null;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'assistant' && messages[i].metadata?.topic) {
                studyTopic = messages[i].metadata.topic;
                break;
            }
        }

        // Check if we're waiting for an answer to a question
        const isWaitingForAnswer = lastAssistantMessage?.metadata?.waitingForAnswer === true;

        // Check if user wants to change topic (look for topic change keywords)
        const topicChangePatterns = [
            /change (topic|subject)/i,
            /new (topic|subject)/i,
            /switch (to|topic)/i,
            /let'?s (talk|discuss|study) (about )?/i,
            /i want (to study|to learn|to talk) (about )?/i,
            /^(how )?about (we study|studying|learning about)?/i,
        ];
        
        const userMessageLower = content.trim().toLowerCase();
        const isTopicChangeRequest = topicChangePatterns.some(pattern => pattern.test(userMessageLower));
        
        // If user wants to change topic, suggest creating a new session
        if (isTopicChangeRequest) {
            const userMessage = await messageService.createUserMessage({
                sessionId,
                provider: assistant.assistant_type,
                content,
                model: assistant.assistant_id
            });

            const assistantMessage = await messageService.createAssistantMessage({
                sessionId,
                provider: assistant.assistant_type,
                content: "I understand you'd like to change the topic! To start studying a new topic, please create a new study-mode session using the '+' button. This will help keep your conversations organized by topic.",
                model: assistant.assistant_id,
                externalMessageId: null,
                promptTokens: null,
                completionTokens: null,
                totalTokens: null,
                metadata: { studyMode: true, topic: studyTopic, waitingForAnswer: isWaitingForAnswer }
            });

            await sessionService.touchSession(sessionId);

            return {
                sessionId,
                provider: assistant.assistant_type,
                userMessage,
                assistantMessage
            };
        }

        if (studyTopic && isWaitingForAnswer) {
            // User provided an answer - review it and ask next question
            const userAnswer = content.trim();
            
            const userMessage = await messageService.createUserMessage({
                sessionId,
                provider: assistant.assistant_type,
                content,
                model: assistant.assistant_id
            });

            // Get the last question from the conversation history
            const lastQuestion = lastAssistantMessage.content;

            // Use OpenAI to review the answer and ask next question
            const reviewPrompt = `You are helping a student learn about "${studyTopic}".

The student was asked: "${lastQuestion}"

The student's answer: "${userAnswer}"

Please:
1. Briefly review and provide feedback on the student's answer (1-2 sentences)
2. Then ask them another question about "${studyTopic}" to continue testing their knowledge
End your response with the new question.`;

            const completion = await createChatCompletion({
                model: assistant.assistant_id,
                messages: [
                    { role: 'system', content: 'You are a helpful educational assistant that encourages students in their learning journey by asking them questions on a particular topic and evaluating their responses.' },
                    { role: 'user', content: reviewPrompt }
                ],
                temperature: 0.7
            });

            const assistantMessage = await messageService.createAssistantMessage({
                sessionId,
                provider: assistant.assistant_type,
                content: completion.content,
                model: completion.model,
                externalMessageId: null,
                promptTokens: completion.usage.promptTokens,
                completionTokens: completion.usage.completionTokens,
                totalTokens: completion.usage.totalTokens,
                metadata: { studyMode: true, topic: studyTopic, waitingForAnswer: true }
            });

            await sessionService.touchSession(sessionId);

            return {
                sessionId,
                provider: assistant.assistant_type,
                userMessage,
                assistantMessage
            };
        } else {
            // Regular conversation - use OpenAI like normal
            return await handleOpenAISessionMessage({ session, assistant, content });
        }
    }
}

/* Handle message for RagFlow session */
async function handleRagflowSessionMessage({ session, assistant, content }) {
    const sessionId = session.id;
    let ragflowSessionId = session.ragflow_session_id;

    if (!ragflowSessionId) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const created = await ragflowCreateChatSession({
            chat_id: assistant.assistant_id,
            name: session.title
        });

        let newId = null;
        if (created?.id) {
            newId = created.id;
        } else if (created?.data?.id) {
        newId = created.data.id;
        } else if (typeof created === 'string') {
            newId = created;
        }

        console.log('newId', newId);
        console.log('created', created);
        if (!newId) {
            throw new BusinessError('Failed to create RagFlow session', '6016');
        }

        ragflowSessionId = newId;

        await updateRagflowSessionIdOnSession(sessionId, ragflowSessionId);
    }

    const reply = await ragflowSendChatMessage({
        chat_id: assistant.assistant_id,    
        session_id: ragflowSessionId,       
        question: content                   
    });

    const userMessage = await messageService.createUserMessage({
        sessionId,
        provider: assistant.assistant_type,
        content,
        model: null
    });

    const assistantMessage = await messageService.createAssistantMessage({
        sessionId,
        provider: assistant.assistant_type,
        content: reply?.answer || null,
        model: null,
        externalMessageId: reply?.externalMessageId || null,
        promptTokens: reply?.usage?.promptTokens || null,
        completionTokens: reply?.usage?.completionTokens || null,
        totalTokens: reply?.usage?.totalTokens || null,
        metadata: reply?.reference || null
    });

    await sessionService.touchSession(sessionId);

    return {
        sessionId,
        provider: assistant.assistant_type,
        ragflowSessionId,
        userMessage,
        assistantMessage
    };
}

/* Update ragflow_session_id on chat_sessions */
async function updateRagflowSessionIdOnSession(sessionId, ragflowSessionId) {
    await pool.execute(
        `
        UPDATE chat_sessions
        SET ragflow_session_id = ?
        WHERE id = ?
        `,
        [ragflowSessionId, sessionId]
    );
}

/* Get RagFlow assistant status for a space */
async function getRagflowStatus(userId, spaceId) {
    if (!spaceId) {
        throw new BusinessError('spaceId is required', '6009');
    }

    const info = await assistantService.getRagflowAssistantStatus(spaceId);

    return {
        ...info,
        enabled: info.status === 'ready',
    };
}

module.exports = {
    getChatOverview,
    createSession,
    renameChatSession,
    deleteChatSession,
    getSessionMessages,
    sendSessionMessage,
    getRagflowStatus,
};