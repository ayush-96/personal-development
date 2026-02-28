require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../config/database');
const spaceService = require('./space.service');
const fileService = require('./file.service');
const { calculateFileChecksum } = require('../utils/checksum');

// Default space name for students
const DEFAULT_SPACE_NAME = 'Get Started Here';
const DEFAULT_SPACE_DESCRIPTION = 'Welcome! This space contains sample PDFs to help you get started with LEAP.';

// Path to default PDFs directory (PDFs should be placed here)
const DEFAULT_PDFS_DIR = path.join(__dirname, '../public/default-pdfs');
const UPLOAD_DIR = path.join(__dirname, '../public/upload');

/**
 * Set up default space with pre-uploaded PDFs for a student
 * This function is idempotent - it will only create the space once per user
 * @param {number} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<Object>} The created/default space object
 */
async function setupDefaultSpaceForStudent(userId, userRole) {
    // Only create default space for students
    if (userRole !== 'student') {
        return null;
    }

    const connection = await pool.getConnection();
    try {
        // Check if user already has a default space
        const [existingSpaces] = await connection.execute(
            `SELECT s.id 
             FROM spaces s
             JOIN space_members sm ON s.id = sm.space_id
             WHERE sm.user_id = ? 
               AND s.name = ?
               AND s.isdeleted = FALSE
               AND sm.isdeleted = FALSE
             LIMIT 1`,
            [userId, DEFAULT_SPACE_NAME]
        );

        // If default space already exists, return early
        if (existingSpaces.length > 0) {
            console.log(`Default space already exists for user ${userId}`);
            return { spaceId: existingSpaces[0].id, created: false };
        }

        // Create default space
        const space = await spaceService.createSpace({
            userId,
            name: DEFAULT_SPACE_NAME,
            description: DEFAULT_SPACE_DESCRIPTION,
            icon: null,
            status: 'private'
        });

        const spaceId = space.space.id;

        // Copy and register default PDFs
        await copyAndRegisterDefaultPDFs(userId, spaceId);

        return { spaceId, created: true };
    } catch (error) {
        console.error(`Error setting up default space for user ${userId}:`, error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Copy default PDFs from default-pdfs directory and register them in the database
 * @param {number} userId - User ID
 * @param {number} spaceId - Space ID
 */
async function copyAndRegisterDefaultPDFs(userId, spaceId) {
    try {
        // Check if default-pdfs directory exists
        try {
            await fs.access(DEFAULT_PDFS_DIR);
        } catch (error) {
            console.log(`Default PDFs directory not found at ${DEFAULT_PDFS_DIR}. Skipping default PDF setup.`);
            console.log(`Please create the directory and add PDF files to it if you want default PDFs for students.`);
            return;
        }

        // Read all PDF files from default-pdfs directory
        const files = await fs.readdir(DEFAULT_PDFS_DIR);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            console.log(`No PDF files found in ${DEFAULT_PDFS_DIR}. Skipping default PDF setup.`);
            return;
        }

        console.log(`Found ${pdfFiles.length} default PDF(s) to copy for user ${userId}`);

        // Ensure upload directory exists
        await fs.mkdir(UPLOAD_DIR, { recursive: true });

        // Copy each PDF and register it (with shared file support)
        for (const pdfFile of pdfFiles) {
            try {
                const sourcePath = path.join(DEFAULT_PDFS_DIR, pdfFile);
                const stats = await fs.stat(sourcePath);
                
                // Calculate checksum for file deduplication
                const checksum = await calculateFileChecksum(sourcePath);
                
                // Use checksum-based storage key for default files: default-{checksum}.pdf
                // This allows multiple students to share the same physical file
                const fileExtension = path.extname(pdfFile);
                const baseName = path.basename(pdfFile, fileExtension);
                const storageKey = `default-${checksum}${fileExtension}`;
                const destinationPath = path.join(UPLOAD_DIR, storageKey);

                // Check if file with this checksum already exists on disk
                let fileExists = false;
                try {
                    await fs.access(destinationPath);
                    fileExists = true;
                    console.log(`Shared file already exists for ${pdfFile}, reusing: ${storageKey}`);
                } catch (error) {
                    // File doesn't exist, need to copy it
                    fileExists = false;
                }

                // Only copy file if it doesn't already exist (shared file approach)
                if (!fileExists) {
                    await fs.copyFile(sourcePath, destinationPath);
                    console.log(`Copied default PDF to shared location: ${storageKey}`);
                }

                // Check if this exact file record already exists for this user/space
                // (to prevent duplicate registration if function is called multiple times)
                const connection = await pool.getConnection();
                try {
                    const [existingFileRecords] = await connection.execute(
                        `SELECT id FROM files 
                         WHERE uploader_id = ? 
                           AND space_id = ?
                           AND storage_key = ?
                           AND isdeleted = FALSE
                         LIMIT 1`,
                        [userId, spaceId, storageKey]
                    );

                    if (existingFileRecords.length > 0) {
                        console.log(`File record already exists for user ${userId}, space ${spaceId}, file ${pdfFile}. Skipping registration.`);
                        connection.release();
                        continue;
                    }
                } finally {
                    connection.release();
                }

                // Register file in database (with checksum for future reference)
                const fileData = {
                    userId,
                    spaceId,
                    title: baseName,
                    originalName: pdfFile,
                    storageKey: storageKey,
                    mimetype: 'application/pdf',
                    size: stats.size,
                    checksum: checksum // Store checksum for future deduplication
                };

                const result = await fileService.uploadFile(fileData);

                // Trigger file processing in background
                const uploadFolderPath = UPLOAD_DIR;
                const filesPath = path.join(__dirname, '../files');
                
                fileService.processFile({ 
                    uploadFolderPath, 
                    filesPath, 
                    fileData: { ...fileData, fileId: result.id } 
                }).catch(err => {
                    console.error(`[Background Task] Default PDF processing failed for fileId ${result.id}:`, err);
                });

                console.log(`Successfully registered default PDF: ${pdfFile} (storageKey: ${storageKey}, checksum: ${checksum})`);
            } catch (error) {
                console.error(`Error copying/registering default PDF ${pdfFile}:`, error);
                // Continue with other files even if one fails
            }
        }
    } catch (error) {
        console.error(`Error in copyAndRegisterDefaultPDFs for user ${userId}, space ${spaceId}:`, error);
        // Don't throw - default space is still created, just without PDFs
    }
}

module.exports = {
    setupDefaultSpaceForStudent,
    DEFAULT_SPACE_NAME
};

