const fileService = require('../services/file.service');
const response = require('../utils/response');
const { Formidable } = require('formidable');
const { BusinessError } = require('../errors/businessError');
const path = require('path');

const uploadFolderPath = path.join(__dirname, '../public/upload');
const filesPath = path.join(__dirname, '../files');

async function uploadFile(req, res, next) {
    const form = new Formidable({
        uploadDir: uploadFolderPath,
        keepExtensions: true,
        multiples: false,
        maxFileSize: 200 * 1024 * 1024, // Allow files up to 200 MB (we'll enforce 100 MB per user limit in our code)
    });
    try {
        form.parse(req, async (err, fields, files) => {
            if (err) {
                // Handle Formidable errors (e.g., file too large)
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json(response.error('File size exceeds the maximum allowed size', 4002));
                }
                next(err);
                return;
            }

            try {
                const userId = req.user.userId;
                const spaceId = req.params.spaceId;

                if (!spaceId) { throw new BusinessError('Space ID is invalid', 3003); }

                const uploadedFile = (files.file && Array.isArray(files.file))
                    ? files.file[0]
                    : files.file;

                if (!uploadedFile) { throw new BusinessError('Missing or invalid file', 4001); }
                const { newFilename, originalFilename, mimetype, size } = uploadedFile;

                const { name, ext } = path.parse(originalFilename);

                const fileData = {
                    userId,
                    spaceId: spaceId,
                    title: name,
                    originalName: originalFilename,
                    storageKey: newFilename,
                    mimetype,
                    size
                };

                const result = await fileService.uploadFile(fileData);
                res.status(200).json(response.success(result, 'File uploaded successfully'));

                fileData.fileId = result.id;
                fileService.processFile({ uploadFolderPath, filesPath, fileData })
                    .catch(err => {
                        console.error(`[Background Task] File processing failed for fileId ${fileData.fileId}:`, err);
                    });
            } catch (innerError) {
                // Handle BusinessError instances with appropriate status codes
                if (innerError instanceof BusinessError || innerError.code) {
                    const statusCode = innerError.code >= 4000 && innerError.code < 5000 ? 400 : 500;
                    return res.status(statusCode).json(response.error(innerError.message, innerError.code));
                }
                // Handle other errors
                console.error('File upload error:', innerError);
                res.status(500).json(response.error(innerError.message || 'Internal server error'));
            }
        });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).json(response.error(err.message || 'Internal server error'));
    }
}

async function getFilesByUserId(req, res) {
    try {
        const userId = req.user.userId;
        const result = await fileService.getFilesByUserId(userId);
        res.status(200).json(response.success(result, 'Files fetched successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

async function getFileStatus(req, res) {
    try {
        const fileId = req.params.fileId;
        const userId = req.user.userId;
        const result = await fileService.getFileStatus(fileId, userId);
        res.status(200).json(response.success(result, 'File status retrieved'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

async function deleteFile(req, res) {
    try {
        const userId = req.user.userId;
        const fileIdToDelete = req.params.fileId;

        // Delete file (service handles all permission checks)
        const result = await fileService.deleteFile(fileIdToDelete, userId);

        res.status(200).json(response.success(result, 'File deleted successfully'));
    } catch (err) {
        // Handle BusinessError instances with appropriate status codes
        if (err instanceof BusinessError || err.code) {
            const statusCode = err.code >= 4000 && err.code < 5000 ? 400 : 500;
            return res.status(statusCode).json(response.error(err.message, err.code));
        }
        // Handle other errors
        console.error('File delete error:', err);
        res.status(500).json(response.error(err.message || 'Internal server error'));
    }
}

async function renameFile(req, res) {
    try {
        const userId = req.user.userId;
        const fileId = req.params.fileId;
        const { title } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json(response.error("Invalid title", 4004));
        }

        // Verify file belongs to user
        const verify = await fileService.verifyFileByUserId(fileId, userId);
        if (verify.length === 0) {
            return res.status(404).json(response.error("Permission denied", 4006));
        }
    
        // Rename it
        const result = await fileService.renameFile(fileId, userId, title);

        res.status(200).json(response.success(result, 'File renamed successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

module.exports = {
    uploadFile,
    getFilesByUserId,
    getFileStatus,
    deleteFile,
    renameFile
};