require('dotenv').config();
const { pool } = require('../config/database');
const { ragflow, deleteFile: ragflowDeleteFile } = require('../intergrations/ragflow.client');
const { minerU } = require('../intergrations/minerU.client');
const assistantService = require('./assistant.service');
const { BusinessError } = require('../errors/businessError');
const path = require('path');


// upload a file to the database
// body: { userId, spaceId, title, originalName, storageKey, mimetype, size, checksum }
// return { file: { id, title, originalName, storageKey } }
async function uploadFile(fileData) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { userId, spaceId, title, originalName, storageKey, mimetype, size, checksum } = fileData;

        const [rows] = await connection.execute(
            `SELECT 
                s.id, 
                s.ragflow_dataset_id,
                s.owner_id,
                s.status,
                sm.role,
                u.role AS userRole,
                owner_user.role AS ownerRole
             FROM spaces s
             JOIN space_members sm ON s.id = sm.space_id
             JOIN users u ON sm.user_id = u.id
             LEFT JOIN users owner_user ON s.owner_id = owner_user.id
             WHERE s.id = ?
               AND sm.user_id = ?
               AND s.isdeleted = FALSE
               AND sm.isdeleted = FALSE
             LIMIT 1`,
            [spaceId, userId]
        );

        if (rows.length === 0) { throw new BusinessError('Space not found', 3002); }
        const space = rows[0];

        // Check if this is a common space (teacher-owned, public) and user is a student
        const isCommonSpace = space.ownerRole === 'teacher' && 
                              space.status === 'public' &&
                              space.owner_id !== userId;
        
        if (isCommonSpace && space.userRole === 'student') {
            throw new BusinessError('Students cannot edit common spaces. Only the teacher owner can make changes.', 4007);
        }

        const allowedRoles = ['owner', 'admin', 'editor'];
        if (!allowedRoles.includes(space.role)) {
            throw new BusinessError('Permission denied', 4004);
        }

        // Check user's total file size limit (100 MB = 104857600 bytes)
        const MAX_USER_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes
        
        const [sizeRows] = await connection.execute(
            `SELECT COALESCE(SUM(size), 0) as total_size 
             FROM files 
             WHERE uploader_id = ? 
               AND isdeleted = FALSE`,
            [userId]
        );
        
        const currentTotalSize = parseInt(sizeRows[0].total_size) || 0;
        const newFileSize = parseInt(size) || 0;
        const newTotalSize = currentTotalSize + newFileSize;
        
        if (newTotalSize > MAX_USER_FILE_SIZE) {
            const currentMB = (currentTotalSize / (1024 * 1024)).toFixed(2);
            const maxMB = (MAX_USER_FILE_SIZE / (1024 * 1024)).toFixed(0);
            throw new BusinessError(
                `File upload limit exceeded. You have used ${currentMB} MB of ${maxMB} MB. Please delete some files before uploading new ones.`,
                4006
            );
        }

        // Check if this exact file already exists for this user in this space
        // (allow shared storage_keys across different users/spaces)
        const [existingFiles] = await connection.execute(
            `SELECT id FROM files 
             WHERE uploader_id = ? 
               AND space_id = ?
               AND storage_key = ? 
               AND isdeleted = FALSE 
             LIMIT 1`,
            [userId, spaceId, storageKey]
        );

        if (existingFiles.length > 0) { throw new BusinessError('File already exists in this space', 4005); }

        const [result] = await connection.execute(
            `INSERT INTO files (
                uploader_id, 
                space_id, 
                title, 
                original_name, 
                storage_key, 
                mime_type, 
                size,
                checksum_sha256,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued')`,
            [userId, spaceId, title, originalName, storageKey, mimetype, size, checksum || null]
        );

        await connection.commit();

        const storageKeyUrl = process.env.STORAGE_KEY_URL || 'http://localhost:3002';
        // Files are stored in public/upload/ and served via Express static middleware
        // So they're accessible at /upload/{filename}
        const fileUrl = storageKeyUrl.endsWith('/upload') 
            ? `${storageKeyUrl}/${storageKey}`
            : `${storageKeyUrl}/upload/${storageKey}`;

        return {
            id: result.insertId,
            spaceId,
            title,
            type: mimetype,
            url: fileUrl,
            status: 'queued',
            uploadedAt: new Date()
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// process a file
// body: { uploadFolderPath, filesPath, fileData }
// return { file: { id, storageKey, status } }
async function processFile({ uploadFolderPath, filesPath, fileData }) {
    const connection = await pool.getConnection();
    const { storageKey, fileId, spaceId, userId } = fileData;

    let shouldActivateRagflow = false;
    let result = null;
    let uploaderId = null; // Declare outside try block for use after finally

    try {
        // Get dataset_id and uploader_id
        const [spaceRows] = await connection.execute(
            `
            SELECT 
                s.ragflow_dataset_id,
                f.uploader_id
            FROM spaces s
            JOIN files f ON f.space_id = s.id
            WHERE s.id = ?
              AND f.id = ?
              AND s.isdeleted = FALSE
              AND f.isdeleted = FALSE
            LIMIT 1
            `,
            [spaceId, fileId]
        );

        if (!spaceRows.length || !spaceRows[0].ragflow_dataset_id) {
            throw new BusinessError('Internal server error: ragflow dataset not found', 1100);
        }

        const datasetId = spaceRows[0].ragflow_dataset_id;
        uploaderId = spaceRows[0].uploader_id; // Assign value, not declare

        // 1) MinerU parse PDF
        await minerU({
            localFilePath: path.join(uploadFolderPath, storageKey),
            displayName: storageKey,
            saveFilePath: `${filesPath}/${storageKey.replace(/\.pdf$/, '')}.zip`
        });

        // 2) Upload parsed result to RagFlow dataset
        const ragflowDocumentId = await ragflow(
            storageKey.replace(/\.pdf$/, ''),
            datasetId
        );

        await connection.beginTransaction();

        // 3) Update files status to ready
        await connection.execute(
            'UPDATE files SET status = ?, ragflow_document_id = ? WHERE id = ?',
            ['ready', ragflowDocumentId[0], fileId]
        );

        // 4) Count ready files in the space
        const [countRows] = await connection.execute(
            `
            SELECT COUNT(*) AS cnt
            FROM files
            WHERE space_id = ?
              AND status = 'ready'
              AND isdeleted = FALSE
            `,
            [spaceId]
        );

        const readyCount = countRows[0].cnt;
        
        // Check if assistant exists and its status
        const [assistantRows] = await connection.execute(
            `SELECT status FROM chat_assistants 
             WHERE space_id = ? AND assistant_type = 'RagFlow' AND isdeleted = FALSE 
             LIMIT 1`,
            [spaceId]
        );
        
        const assistantStatus = assistantRows.length > 0 ? assistantRows[0].status : null;
        
        console.log(`[File Processing] Space ${spaceId}: readyCount=${readyCount}, assistantStatus=${assistantStatus}`);
        
        // Activate RagFlow assistant if:
        // 1. This is the first ready file, OR
        // 2. Assistant is in error state (retry activation after new document upload), OR
        // 3. Assistant doesn't exist yet or is in 'creating' status (initial activation)
        if (readyCount === 1 || assistantStatus === 'error' || !assistantStatus || assistantStatus === 'creating') {
            shouldActivateRagflow = true;
            console.log(`[File Processing] Will activate RagFlow assistant for space ${spaceId} (readyCount=${readyCount}, assistantStatus=${assistantStatus})`);
        }

        await connection.commit();

        result = {
            file: {
                fileId,
                storageKey,
                status: 'ready'
            }
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    // 5) Activate RagFlow assistant after transaction commit to avoid occupying DB transaction
    if (shouldActivateRagflow && uploaderId) {
        try {
            console.log(`[File Processing] Attempting to activate RagFlow assistant for space ${spaceId} (uploader: ${uploaderId})`);
            // Ensure assistant record exists before activation
            await assistantService.createRagflowAssistantForSpace(spaceId);
            const activationResult = await assistantService.activateRagflowAssistant(spaceId, uploaderId);
            if (activationResult === true) {
                console.log(`[File Processing] RagFlow assistant activation succeeded for space ${spaceId}`);
            } else if (activationResult === false) {
                console.log(`[File Processing] RagFlow assistant activation deferred (retryable error) for space ${spaceId}. Will retry on next file upload.`);
            } else {
                console.log(`[File Processing] RagFlow assistant activation completed for space ${spaceId}`);
            }
        } catch (e) {
            console.error(
                `[File Processing] Failed to activate RagFlow assistant for space ${spaceId}:`,
                e?.message || e
            );
            console.error('Activation error details:', e);
            // Non-retryable errors will throw and be caught here
            // Status will be updated to 'error' by activateRagflowAssistant's error handler
            // Don't throw error, file processing still counts as successful, but RAG may be temporarily unavailable
        }
    } else {
        if (!shouldActivateRagflow) {
            console.log(`[File Processing] Skipping RagFlow activation for space ${spaceId} (shouldActivateRagflow=false)`);
        }
        if (!uploaderId) {
            console.log(`[File Processing] Skipping RagFlow activation for space ${spaceId} (uploaderId missing)`);
        }
    }

    return result;
}

async function getFilesByUserId(userId) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'SELECT id, title, storage_key, status, space_id FROM files WHERE uploader_id = ? AND isdeleted = FALSE;',
            [userId]
        );
        return result;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function getFileStatus(fileId, userId) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'SELECT status FROM files WHERE id = ? AND uploader_id = ? AND isdeleted = FALSE;',
            [fileId, userId]
        );
        if (result.length === 0) { throw new BusinessError('File not found', 4003); }
        return {status: result[0].status};
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}


// verify if the file belongs to the user
// body: { fileId, userId }
// return { file: { id, title, storageKey, status, ragflowAssistantId } }
async function verifyFileByUserId(fileId, userId) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'SELECT id FROM files WHERE id = ? AND uploader_id = ? AND isdeleted = FALSE;',
            [fileId, userId]
        );
        return result;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// get file by id (for checking quiz publish status)
async function getFileById(fileId) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'SELECT id, quiz_published, uploader_id FROM files WHERE id = ? AND isdeleted = FALSE;',
            [fileId]
        );
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// delete file from ragflow and database
async function deleteFile(fileId, userId) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Get file info with space and user details
        const [rows] = await connection.execute(
            `SELECT 
                s.ragflow_dataset_id, 
                s.owner_id,
                s.status,
                f.ragflow_document_id, 
                f.storage_key, 
                f.space_id,
                f.uploader_id,
                f.checksum_sha256,
                u.role AS userRole,
                owner_user.role AS ownerRole
             FROM files f 
             JOIN spaces s ON f.space_id = s.id 
             JOIN users u ON u.id = ?
             LEFT JOIN users owner_user ON s.owner_id = owner_user.id
             WHERE f.id = ? AND f.isdeleted = FALSE AND s.isdeleted = FALSE;`,
            [userId, fileId]
        );
        
        if (rows.length === 0) { 
            throw new BusinessError('File not found', 4003); 
        }

        const file = rows[0];
        const userRole = file.userRole;
        const isSpaceOwner = file.owner_id === userId;
        const isFileUploader = file.uploader_id === userId;
        const isCommonSpace = file.ownerRole === 'teacher' && 
                              file.status === 'public' &&
                              !isSpaceOwner;
        const isPrivateSpace = file.status === 'private';
        
        // Permission checks:
        // 1. Teachers can delete files in their spaces (space owner)
        // 2. Students can delete files in their private spaces (space owner)
        // 3. Users can delete files they uploaded (unless it's a common space and they're a student)
        let canDelete = false;
        
        if (userRole === 'teacher' && isSpaceOwner) {
            // Teachers can delete any file in their spaces
            canDelete = true;
        } else if (userRole === 'student' && isPrivateSpace && isSpaceOwner) {
            // Students can delete files in their private spaces
            canDelete = true;
        } else if (isFileUploader) {
            // Users can delete files they uploaded, unless it's a common space and they're a student
            if (isCommonSpace && userRole === 'student') {
                throw new BusinessError('Students cannot delete files from common spaces. Only the teacher owner can make changes.', 4007);
            }
            canDelete = true;
        }
        
        if (!canDelete) {
            throw new BusinessError('Permission denied. You can only delete files in spaces you own or files you uploaded.', 4004);
        }

        const { ragflow_dataset_id, ragflow_document_id, storage_key } = file;

        // Delete from RAGFlow dataset (this also removes chunks)
        if (ragflow_document_id && ragflow_dataset_id) {
            try {
                await ragflowDeleteFile({
                    document_ids: ragflow_document_id,
                    dataset_id: ragflow_dataset_id
                });
            } catch (error) {
                throw new BusinessError('Internal server error: Failed to delete file from RAGFlow', 1100);
            }
        }

        // Soft delete the file record
        const [result] = await connection.execute(
            'UPDATE files SET isdeleted = TRUE WHERE id = ?',
            [fileId]
        );

        // Check if any other non-deleted files reference the same storage_key
        // If not, the physical file could be deleted (currently we don't delete physical files,
        // but this check prepares for future physical deletion if needed)
        const [remainingFiles] = await connection.execute(
            `SELECT COUNT(*) as count FROM files 
             WHERE storage_key = ? AND isdeleted = FALSE`,
            [storage_key]
        );

        const referenceCount = remainingFiles[0]?.count || 0;
        
        // Note: Currently we don't delete physical files, but if we implement physical deletion
        // in the future, we should only delete when referenceCount === 0
        // Example:
        // if (referenceCount === 0) {
        //     const filePath = path.join(__dirname, '../public/upload', storage_key);
        //     try {
        //         await fs.unlink(filePath);
        //     } catch (err) {
        //         console.error(`Failed to delete physical file ${storage_key}:`, err);
        //     }
        // }

        return {
            id: fileId,
            deleted: true,
            deletedAt: new Date(),
            referenceCount: referenceCount // Return for logging/debugging
        };

    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function renameFile(fileId, userId, newTitle) {
    let connection;
    try {
        connection = await pool.getConnection();

        // Check if user can edit this file (check if it's in a common space)
        const [checkRows] = await connection.execute(
            `SELECT 
                s.owner_id,
                s.status,
                u.role AS userRole,
                owner_user.role AS ownerRole
             FROM files f
             JOIN spaces s ON f.space_id = s.id
             JOIN users u ON f.uploader_id = u.id
             LEFT JOIN users owner_user ON s.owner_id = owner_user.id
             WHERE f.id = ? AND f.uploader_id = ? AND f.isdeleted = FALSE AND s.isdeleted = FALSE`,
            [fileId, userId]
        );

        if (checkRows.length === 0) {
            throw new BusinessError('File not found', 4003);
        }

        const file = checkRows[0];
        // Check if this is a common space and user is a student
        const isCommonSpace = file.ownerRole === 'teacher' && 
                              file.status === 'public' &&
                              file.owner_id !== userId;
        
        if (isCommonSpace && file.userRole === 'student') {
            throw new BusinessError('Students cannot rename files in common spaces. Only the teacher owner can make changes.', 4007);
        }

        // Update the title for this user's file, only if not deleted
        const [result] = await connection.execute(
            `UPDATE files 
             SET title = ?
             WHERE id = ? AND uploader_id = ? AND isdeleted = FALSE`,
            [newTitle, fileId, userId]
        );

        const [rows] = await connection.execute(
            'SELECT mime_type, storage_key, status FROM files WHERE id = ? AND uploader_id = ? AND isdeleted = FALSE;',
            [fileId, userId]
        );

        const updated_file = rows[0]
        const storageKeyUrl = process.env.STORAGE_KEY_URL || 'http://localhost:3002';
        // Files are stored in public/upload/ and served via Express static middleware
        // So they're accessible at /upload/{filename}
        const fileUrl = storageKeyUrl.endsWith('/upload') 
            ? `${storageKeyUrl}/${updated_file.storage_key}`
            : `${storageKeyUrl}/upload/${updated_file.storage_key}`;

        return {
            id: fileId,
            title: newTitle,
            type: updated_file.mime_type,
            url: fileUrl,
            status: updated_file.status,
            uploadedAt: new Date()
        };
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}



module.exports = {
    uploadFile,
    processFile,
    getFilesByUserId,
    getFileStatus,
    verifyFileByUserId,
    getFileById,
    deleteFile,
    renameFile
};