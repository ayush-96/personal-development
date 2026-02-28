import { http } from "./http";

/**
 * Status: To be implemented
 * Upload a file to a space.
 *
 * Purpose:
 * - Upload a new file to a specific space.
 *
 * Endpoint:
 * - POST /api/v1/files/:spaceId/upload
 *
 * Path params:
 * - spaceId: string (required) – ID of the space.
 *
 * Query params:
 * - none
 *
 * Request body:
 * - FormData:
 *   - file: File (required) – The file binary to upload.
 *
 * Authentication:
 * - Requires valid auth token (e.g. Bearer token in Authorization header).
 *
 * Expected success response (200/201):
 * {
 *   "code": "OK",
 *   "success": true,
 *   "message": "File uploaded successfully",
 *   "data": {
 *     "id": "124",
 *     "spaceId": "123",
 *     "title": "new-doc.pdf",
 *     "type": "application/pdf",
 *     "url": null,
 *     "status": "processing",
 *     "uploadedAt": "2021-01-01T00:00:00Z"
 *   }
 * }
 *
 * Expected error responses:
 * - 4001: Missing or invalid file
 * - 2001: Missing or invalid token
 * - 3002: Space not found
 * - 3003: Space ID is invalid
 * - 4002: File size exceeds limit
 * - 4004: Access denied
 * - 4005: File already exists
 * - 5000: Internal server error
 */
export const uploadFile = async (spaceId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await http.post(`/api/v1/files/${spaceId}/upload`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res;
};


/**
 * Status: To be implemented
 * Get the processing status of a file.
 *
 * Purpose:
 * - Check if a file has finished processing.
 *
 * Endpoint:
 * - GET /api/v1/files/:fileId/status
 *
 * Path params:
 * - spaceId: string (required) – ID of the space.
 * - fileId: string (required) – ID of the file.
 *
 * Query params:
 * - none
 *
 * Request body:
 * - none
 *
 * Authentication:
 * - Requires valid auth token.
 *
 * Expected success response (200):
 * {
 *   "code": "OK",
 *   "success": true,
 *   "message": "File status retrieved",
 *   "data": {
 *       "status": "ready",
 *    }
 * }
 *
 * Expected error responses:
 * - 2001: Missing or invalid token
 * - 4003: File not found
 * - 5000: Internal server error
 */
export const getFileStatus = async (fileId) => {
    const res = await http.get(`/api/v1/files/${fileId}/status`);
    return res;
};


/**
 * Status: To be implemented
 * Rename a file in a space.
 *
 * Purpose:
 * - Update the title of an existing file.
 *
 * Endpoint:
 * - POST /api/v1/files/:fileId/rename
 *
 * Path params:
 * - fileId: string (required) – ID of the file to rename.
 *
 * Query params:
 * - none
 *
 * Request body:
 * - title: string (required) – The new title for the file.
 *
 * Authentication:
 * - Requires valid auth token (e.g. Bearer token in Authorization header).
 *
 * Expected success response (200):
 * {
 *   "code": "OK",
 *   "success": true,
 *   "message": "File renamed successfully",
 *   "data": {
 *     "id": "123",
 *     "title": "renamed-file.pdf",
 *     "type": "application/pdf",
 *     "url": null,
 *     "status": "ready",
 *     "uploadedAt": "2021-01-01T00:00:00Z",
 *   }
 * }
 *
 * Expected error responses:
 * - 4004: Invalid title
 * - 2001: Missing or invalid token
 * - 3002: Space not found
 * - 4003: File not found
 * - 4006: Permission denied
 * - 5000: Internal server error
 */
export const renameFile = async (fileId, title) => {
    const body = {
        title: title,
    };
    const res = await http.post(`/api/v1/files/${fileId}/rename`, body);    
    return res;
};


/**
 * Status: To be implemented
 * Delete a file from a space.
 *
 * Purpose:
 * - Permanently remove a file from a specific space.
 *
 * Endpoint:
 * - DELETE /api/v1/files/:fileId
 *
 * Path params:
 * - spaceId: string (required) – ID of the space.
 * - fileId: string (required) – ID of the file to delete.
 *
 * Query params:
 * - none
 *
 * Request body:
 * - none
 *
 * Authentication:
 * - Requires valid auth token (e.g. Bearer token in Authorization header).
 *
 * Expected success response (200):
 * {
 *   "code": "OK",
 *   "success": true,
 *   "message": "File deleted successfully",
 *   "data": {
 *     "id": "123",
 *     "deleted": true,
 *     "deletedAt": "2021-01-02T00:00:00Z"
 *   }
 * }
 *
 * Expected error responses:
 * - 2001: Missing or invalid token
 * - 3002: Space not found
 * - 4003: File not found
 * - 4006: Permission denied
 * - 5000: Internal server error
 */
export const deleteFile = async (fileId) => {
    const res = await http.delete(`/api/v1/files/${fileId}`);
    return res;
};