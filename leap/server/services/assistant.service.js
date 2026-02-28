require('dotenv').config();
const { pool } = require('../config/database');
const { BusinessError } = require('../errors/businessError');
const { createChatAssistant: ragflowCreateChatAssistant, listFile: ragflowListFile } = require('../intergrations/ragflow.client');
const { v7 } = require('uuid');

async function initAssistantsForSpace(spaceId) {
    // Create assistant records but don't activate RAG assistant yet
    // RAG assistant will be activated when the first file is uploaded
    const ragflowAssistant = await createRagflowAssistantForSpace(spaceId);
    await createOpenAIAssistantForSpace(spaceId);
    
    console.log(`Initialized assistants for space ${spaceId}. RAG assistant will be activated when first file is uploaded.`);
}

async function createRagflowAssistantForSpace(spaceId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `
            SELECT id, assistant_id, status
            FROM chat_assistants
            WHERE space_id = ? AND assistant_type = 'RagFlow' AND isdeleted = FALSE
            LIMIT 1
            `,
            [spaceId]
        );

        let assistant = rows[0];

        if (!assistant) {
            const [result] = await connection.execute(
                `
                INSERT INTO chat_assistants (space_id, assistant_type, status, isdeleted)
                VALUES (?, 'RagFlow', 'creating', FALSE)
                `,
                [spaceId]
            );
            assistant = { id: result.insertId, assistant_id: null, status: 'creating' };
        }

        await connection.commit();
        return assistant;
    } catch (err) {
        try {
            await pool.execute(
                `
                UPDATE chat_assistants
                SET status = 'error'
                WHERE space_id = ? AND assistant_type = 'RagFlow'
                `,
                [spaceId]
            );
        } catch (e) { }
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

async function createOpenAIAssistantForSpace(spaceId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const DEFAULT_OPENAI_MODEL = process.env.OPENAI_DEFAULT_MODEL || "gpt-4o";

        const [rows] = await connection.execute(
            `
            SELECT id, assistant_id, status
            FROM chat_assistants
            WHERE space_id = ? AND assistant_type = 'OpenAI' AND isdeleted = FALSE
            LIMIT 1
            `,
            [spaceId]
        );
        let assistant = rows[0];

        if (!assistant) {
            const [result] = await connection.execute(
                `
                INSERT INTO chat_assistants (space_id, assistant_type, status, assistant_id, isdeleted)
                VALUES (?, 'OpenAI', 'ready', ?, FALSE)
                `,
                [spaceId, DEFAULT_OPENAI_MODEL]
            );
            await connection.commit();
            return DEFAULT_OPENAI_MODEL;
        }

        if (assistant.assistant_id && assistant.status === 'ready') {
            await connection.commit();
            return assistant.assistant_id;
        }

        const newAssistantId = DEFAULT_OPENAI_MODEL;

        await connection.execute(
            `
            UPDATE chat_assistants
            SET assistant_id = ?, status = 'ready', isdeleted = FALSE
            WHERE id = ?
            `,
            [newAssistantId, assistant.id]
        );

        await connection.commit();
        return newAssistantId;

    } catch (err) {
        try {
            await pool.execute(
                `
                UPDATE chat_assistants
                SET status = 'error'
                WHERE space_id = ? AND assistant_type = 'OpenAI'
                `,
                [spaceId]
            );
        } catch (e) { }
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

async function getRagflowAssistantStatus(spaceId) {
    const [rows] = await pool.execute(
        `
        SELECT id,
               space_id,
               assistant_type,
               assistant_id,
               status,
               created_at,
               updated_at
        FROM chat_assistants
        WHERE space_id = ?
          AND assistant_type = 'RagFlow'
          AND isdeleted = FALSE
        LIMIT 1
        `,
        [spaceId]
    );

    if (rows.length === 0) {
        throw new BusinessError('Ragflow assistant not found for space', '6001');
    }

    const assistant = rows[0];

    return {
        id: assistant.id,
        spaceId: assistant.space_id,
        assistantType: assistant.assistant_type,
        assistantId: assistant.assistant_id,
        status: assistant.status,
        createdAt: assistant.created_at,
        updatedAt: assistant.updated_at
    };
}

async function activateRagflowAssistant(spaceId, userId) {
    const connection = await pool.getConnection();
    let ragflowAssistantId = null;

    try {
        await connection.beginTransaction();

        // Check if assistant exists, create if it doesn't
        const [existingAssistant] = await connection.execute(
            `SELECT assistant_id, status FROM chat_assistants WHERE space_id = ? AND assistant_type = 'RagFlow' AND isdeleted = FALSE LIMIT 1`,
            [spaceId]
        );

        // If assistant doesn't exist, create it first
        if (existingAssistant.length === 0) {
            console.log(`RagFlow assistant for space ${spaceId} doesn't exist, creating it first`);
            await connection.execute(
                `INSERT INTO chat_assistants (space_id, assistant_type, status, isdeleted) VALUES (?, 'RagFlow', 'creating', FALSE)`,
                [spaceId]
            );
        }

        // If assistant is already ready and has an ID, no need to reactivate
        if (existingAssistant.length > 0 && existingAssistant[0].assistant_id && existingAssistant[0].status === 'ready') {
            console.log(`RagFlow assistant for space ${spaceId} is already activated`);
            await connection.commit();
            return true;
        }
        
        // If assistant is in error state, reset it to 'creating' before retrying
        if (existingAssistant.length > 0 && existingAssistant[0].status === 'error') {
            console.log(`RagFlow assistant for space ${spaceId} is in error state, resetting to 'creating' and retrying activation`);
            await connection.execute(
                `UPDATE chat_assistants SET status = 'creating', assistant_id = NULL WHERE space_id = ? AND assistant_type = 'RagFlow' AND isdeleted = FALSE`,
                [spaceId]
            );
        }

        // verify space user
        const [spaceRows] = await connection.execute(
            `SELECT * FROM spaces WHERE id = ? AND owner_id = ? AND isdeleted = 0`,
            [spaceId, userId]
        );

        if (!spaceRows.length) {
            const error = new Error('Space not found or access denied');
            error.statusCode = 404;
            throw error;
        }

        const space = spaceRows[0];

        // Verify space has a ragflow_dataset_id
        if (!space.ragflow_dataset_id) {
            const error = new Error('Space does not have a RAGFlow dataset. Please ensure the space was created properly.');
            error.statusCode = 400;
            throw error;
        }

        console.log(`Creating RagFlow chat assistant for space ${spaceId} with dataset ${space.ragflow_dataset_id}`);
        
        // Verify that the dataset has at least one document before creating the assistant
        // We'll check for documents and wait for them to be parsed
        console.log(`Verifying dataset ${space.ragflow_dataset_id} has documents...`);
        let hasDocuments = false;
        let retryCount = 0;
        const maxRetries = 20; // Wait up to 100 seconds (20 * 5 seconds) - parsing can take time
        
        while (!hasDocuments && retryCount < maxRetries) {
            try {
                const documentsResponse = await ragflowListFile(space.ragflow_dataset_id);
                console.log(`[Document Check] Response structure:`, JSON.stringify(Object.keys(documentsResponse || {})));
                
                // Handle different possible response structures
                // listFile returns response.data.data, which might be { data: { docs: [...] } } or { docs: [...] }
                const docs = documentsResponse?.data?.docs || documentsResponse?.docs || [];
                console.log(`[Document Check] Found ${docs.length} document(s) in dataset`);
                
                if (docs.length > 0) {
                    // Log document statuses for debugging
                    docs.forEach((doc, idx) => {
                        console.log(`[Document Check] Doc ${idx + 1}: id=${doc.id}, run=${doc.run}, status=${doc.status || 'N/A'}`);
                    });
                    
                    // Check document status more carefully
                    // RAGFlow document status: RUNNING (parsing), PENDING (queued), or null/undefined (completed)
                    // We also check if the document has been indexed (chunked)
                    const completedDocs = docs.filter(doc => {
                        const runStatus = doc.run?.toUpperCase();
                        // Document is completed if it's not RUNNING or PENDING
                        // Also check if it has an index_status or similar field indicating it's ready
                        const isCompleted = runStatus !== 'RUNNING' && runStatus !== 'PENDING';
                        const hasIndexStatus = doc.index_status !== undefined && doc.index_status !== null;
                        return isCompleted || hasIndexStatus;
                    });
                    
                    // Also check for documents that might be in a different state format
                    const allDocsStatus = docs.map(doc => ({
                        id: doc.id,
                        name: doc.name || doc.file_name || 'unknown',
                        run: doc.run,
                        status: doc.status,
                        index_status: doc.index_status,
                        chunk_num: doc.chunk_num
                    }));
                    console.log(`[Document Check] All documents status:`, JSON.stringify(allDocsStatus, null, 2));
                    
                    console.log(`[Document Check] Found ${completedDocs.length} completed document(s) out of ${docs.length} total`);
                    
                    // If we have completed documents, proceed
                    if (completedDocs.length > 0) {
                        hasDocuments = true;
                        console.log(`Found ${completedDocs.length} completed document(s) - proceeding with assistant creation`);
                    } else if (docs.length > 0) {
                        // We have documents but they're still processing
                        // Check if any document has chunks (indicating it's been processed)
                        const docsWithChunks = docs.filter(doc => doc.chunk_num && doc.chunk_num > 0);
                        if (docsWithChunks.length > 0) {
                            console.log(`Found ${docsWithChunks.length} document(s) with chunks - proceeding with assistant creation`);
                            hasDocuments = true;
                        } else {
                            retryCount++;
                            console.log(`Documents are still processing (attempt ${retryCount}/${maxRetries}), waiting 5 seconds...`);
                            if (retryCount < maxRetries) {
                                await new Promise(resolve => setTimeout(resolve, 5000));
                            }
                        }
                    } else {
                        retryCount++;
                        console.log(`No documents found yet (attempt ${retryCount}/${maxRetries}), waiting 5 seconds...`);
                        if (retryCount < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                    }
                } else {
                    retryCount++;
                    console.log(`No documents found yet (attempt ${retryCount}/${maxRetries}), waiting 5 seconds...`);
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            } catch (listError) {
                console.error(`[Document Check] Error checking documents in dataset:`, listError.message);
                console.error(`[Document Check] Full error:`, listError);
                // Continue to retry
                retryCount++;
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }
        
        // Even if we didn't find completed documents, if we have any documents at all, try to create the assistant
        // This handles edge cases where the status check might be wrong
        if (!hasDocuments) {
            try {
                const finalCheck = await ragflowListFile(space.ragflow_dataset_id);
                const finalDocs = finalCheck?.data?.docs || finalCheck?.docs || [];
                if (finalDocs.length > 0) {
                    console.log(`[Document Check] Found ${finalDocs.length} document(s) after retries - attempting assistant creation anyway`);
                    hasDocuments = true; // Proceed with creation
                }
            } catch (finalCheckError) {
                console.error(`[Document Check] Final check failed:`, finalCheckError.message);
            }
        }
        
        if (!hasDocuments) {
            throw new Error(`Cannot create chat assistant: Dataset ${space.ragflow_dataset_id} has no documents. Please upload and wait for files to be processed.`);
        }

        // Add a delay before creating assistant to ensure RAGFlow has fully processed documents
        // Longer delay to give RAGFlow time to complete chunking/indexing
        console.log(`Waiting 5 seconds before creating assistant to ensure documents are fully processed and chunked...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        let chatAssistantResponse;
        let assistantCreationRetries = 0;
        const maxAssistantRetries = 5; // Increased retries
        
        while (assistantCreationRetries < maxAssistantRetries) {
            try {
                console.log(`[Assistant Creation] Attempt ${assistantCreationRetries + 1}/${maxAssistantRetries}: Creating RagFlow chat assistant...`);
                chatAssistantResponse = await ragflowCreateChatAssistant({
                    name: v7(),
                    dataset_ids: [space.ragflow_dataset_id]
                });
                console.log(`[Assistant Creation] Successfully created assistant on attempt ${assistantCreationRetries + 1}`);
                break; // Success, exit retry loop
            } catch (createError) {
                assistantCreationRetries++;
                const errorMessage = createError.message || createError.toString();
                const errorResponse = createError.body || createError.response?.data || {};
                
                console.error(`[Assistant Creation] Attempt ${assistantCreationRetries} failed:`, errorMessage);
                console.error(`[Assistant Creation] Error response:`, JSON.stringify(errorResponse, null, 2));
                
                // Check for various error types that indicate documents aren't ready
                const isNoParsedFileError = errorMessage.includes("doesn't own parsed file") || 
                                          errorMessage.includes("no parsed file") ||
                                          errorMessage.includes("parsed file") ||
                                          (errorResponse.code === 102) ||
                                          (errorResponse.message && errorResponse.message.includes("parsed"));
                
                if (isNoParsedFileError && assistantCreationRetries < maxAssistantRetries) {
                    // Re-check documents before retrying
                    try {
                        const retryCheck = await ragflowListFile(space.ragflow_dataset_id);
                        const retryDocs = retryCheck?.data?.docs || retryCheck?.docs || [];
                        console.log(`[Assistant Creation] Re-checking documents before retry: found ${retryDocs.length} document(s)`);
                        retryDocs.forEach((doc, idx) => {
                            console.log(`[Assistant Creation] Doc ${idx + 1}: id=${doc.id}, run=${doc.run}, chunk_num=${doc.chunk_num || 0}`);
                        });
                    } catch (checkErr) {
                        console.error(`[Assistant Creation] Error re-checking documents:`, checkErr.message);
                    }
                    
                    const waitTime = 10 + (assistantCreationRetries * 5); // Increasing wait time
                    console.log(`[Assistant Creation] Waiting ${waitTime} seconds before retry (attempt ${assistantCreationRetries}/${maxAssistantRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                } else {
                    // Not a retryable error or max retries reached
                    console.error(`[Assistant Creation] Non-retryable error or max retries reached. Throwing error.`);
                    throw createError;
                }
            }
        }
        
        if (!chatAssistantResponse) {
            throw new Error(`Failed to create chat assistant after ${maxAssistantRetries} attempts`);
        }

        // Handle different possible response structures
        // Ragflow may return: { id: "..." } or { data: { id: "..." } } or nested structure
        let assistantId = null;
        if (chatAssistantResponse?.id) {
            assistantId = chatAssistantResponse.id;
        } else if (chatAssistantResponse?.data?.id) {
            assistantId = chatAssistantResponse.data.id;
        } else if (typeof chatAssistantResponse === 'string') {
            // Sometimes Ragflow returns just the ID as a string
            assistantId = chatAssistantResponse;
        } else if (Array.isArray(chatAssistantResponse) && chatAssistantResponse.length > 0) {
            // Sometimes Ragflow returns an array with the assistant object
            assistantId = chatAssistantResponse[0]?.id || chatAssistantResponse[0];
        }

        if (!assistantId) {
            console.error('RagFlow createChatAssistant response:', JSON.stringify(chatAssistantResponse, null, 2));
            throw new Error(`Failed to create chat assistant: Invalid response from Ragflow. Response: ${JSON.stringify(chatAssistantResponse)}`);
        }

        ragflowAssistantId = assistantId;
        console.log(`RagFlow chat assistant created successfully with ID: ${ragflowAssistantId}`);

        const [updateResult] = await connection.execute(
            `UPDATE chat_assistants SET assistant_id = ?, status = 'ready' WHERE space_id = ? AND assistant_type = 'RagFlow' AND isdeleted = FALSE`,
            [ragflowAssistantId, spaceId]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error('Failed to update chat assistant record');
        }

        await connection.commit();
        console.log(`RagFlow assistant activated successfully for space ${spaceId}`);

        return true;

    } catch (err) {
        await connection.rollback();
        console.error(`Error activating RagFlow assistant for space ${spaceId}:`, err.message);
        console.error('Full error:', err);
        
        // Check if this is a retryable error (documents not ready yet)
        const errorMessage = err.message || err.toString();
        const errorResponse = err.body || err.response?.data || {};
        const isRetryableError = errorMessage.includes("doesn't own parsed file") || 
                                errorMessage.includes("no parsed file") ||
                                errorMessage.includes("parsed file") ||
                                (errorResponse.code === 102) ||
                                (errorResponse.message && errorResponse.message.includes("parsed"));
        
        // Only set to 'error' if it's not a retryable error
        // For retryable errors, keep status as 'creating' so it can be retried later
        const statusToSet = isRetryableError ? 'creating' : 'error';
        const statusMessage = isRetryableError 
            ? 'Documents may still be processing. Will retry on next file upload or manual activation.'
            : 'Activation failed with non-retryable error.';
        
        console.log(`Setting assistant status to '${statusToSet}': ${statusMessage}`);
        
        try {
            const errorConnection = await pool.getConnection();
            await errorConnection.execute(
                `UPDATE chat_assistants SET status = ? WHERE space_id = ? AND assistant_type = 'RagFlow' AND isdeleted = FALSE`,
                [statusToSet, spaceId]
            );
            errorConnection.release();
        } catch (updateErr) {
            console.error('Failed to update RagFlow assistant status:', updateErr);
        }
        
        // For retryable errors, don't throw - allow the process to continue
        // The assistant will be retried on next file upload
        if (!isRetryableError) {
            throw err;
        } else {
            console.log(`Retryable error detected. Assistant will be retried later. Status set to 'creating'.`);
            return false; // Return false to indicate activation didn't succeed but is retryable
        }
    } finally {
        connection.release();
    }
}

async function getAssistantBySpaceAndType(spaceId, assistantType) {
    const [rows] = await pool.execute(
        `
        SELECT id,
               space_id,
               assistant_type,
               assistant_id,
               status,
               created_at,
               updated_at,
               isdeleted
        FROM chat_assistants
        WHERE space_id = ?
          AND assistant_type = ?
          AND isdeleted = FALSE
        LIMIT 1
        `,
        [spaceId, assistantType]
    );

    if (!rows.length) {
        return null;
    }

    return rows[0];
}

async function getAssistantById(assistantId) {
    if (!assistantId) return null;

    const [rows] = await pool.execute(
        `
        SELECT 
            id,
            space_id,
            assistant_type,
            assistant_id,
            status,
            isdeleted,
            created_at,
            updated_at
        FROM chat_assistants
        WHERE id = ?
          AND isdeleted = FALSE
        LIMIT 1
        `,
        [assistantId]
    );

    return rows[0] || null;
}

module.exports = {
    activateRagflowAssistant,
    getRagflowAssistantStatus,
    initAssistantsForSpace,
    createRagflowAssistantForSpace,
    createOpenAIAssistantForSpace,
    getAssistantBySpaceAndType,
    getAssistantById
};