import { http } from "./http";

/**
 * Status: To be implemented
 * Create a new space.
 *
 * Purpose:
 * - Create a new logical "space" (knowledge base) for organizing files and content.
 *
 * Endpoint:
 * - POST /api/v1/space
 *
 * Path params:
 * - none
 *
 * Query params:
 * - none
 *
 * Request body (JSON):
 * - name: string (required) – Human-readable name of the space.
 *
 * Authentication:
 * - Requires valid auth token (e.g. Bearer token in Authorization header).
 *
 * Expected success response (201 or 200):
 * {
 *   "code": "OK",
 *   "success": true,
 *   "message": "Space created successfully",
 *   "data": {
 *     "id": "1234567",
 *     "name": "My Knowledge Base",
 *     "description": "This is a description of the space",
 *     "icon": null,
 *     "status": "private", (private, public)
 *   }
 * }
 *
 * Expected error responses:
 * - 3001: Missing or invalid name
 * - 2001: Missing or invalid token
 * - 5000: Internal server error
 */
export const createSpace = async (name, status = 'private') => {
    const body = {
        name: name,
        ...(status && { status })
    };
    const res = await http.post("/api/v1/space", body);
    return res;
};


/**
 * Status: To be implemented
 * List all spaces with files for the current user.
 *
 * Purpose:
 * - Fetch all spaces with files (knowledge bases) that belong to the authenticated user.
 *
 * Endpoint:
 * - GET /api/v1/space/spaces-with-files
 *
 * Path params:
 * - none
 *
 * Query params:
 * - none (for now; can extend later for pagination/filtering).
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
 *   "message": "Spaces listed successfully",
 *   "data": [
 *     {
 *     "id": "1234567",
 *     "name": "My Knowledge Base",
 *     "description": "This is a description of the space",
 *     "filesCount": 0,
 *     "icon": null,
 *     "status": "private", (private, public)
 *     "createdAt": "2021-01-01T00:00:00Z",
 *     "updatedAt": "2021-01-01T00:00:00Z",
 *     
 *     "userRole": "owner", (Owner, Editor , Viewer, Admin),
 * 
 *     "files": [
 *       {
 *         "id": "1234567",
 *         "title": "example.pdf",
 *         "type": "application/pdf",
 *         "url": null,
 *         "status": "ready",
 *         "uploadedAt": "2021-01-01T00:00:00Z"
 *       }
 *     ]
 *     }
 *   ]
 * }
 *
 * Expected error responses:
 * - 2001: Missing or invalid token
 * - 5000: Internal server error
 */
export const listSpacesWithFiles = async () => {
    const res = await http.get("/api/v1/space/spaces-with-files");
    return res;
};


/**
 * Status: To be implemented
 * Get details of a specific space.
 *
 * Purpose:
 * - Retrieve metadata and details of a single space (knowledge base) by ID.
 *
 * Endpoint:
 * - GET /api/v1/space/:spaceId
 *
 * Path params:
 * - spaceId: string (required) – ID of the space to retrieve.
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
 *   "message": "Space retrieved successfully",
 *   "data": {
 *     "id": "1234567",
 *     "name": "My Knowledge Base",
 *     "description": "This is a description of the space",
 *     "filesCount": 0,
 *     "icon": null,
 *     "status": "private", (private, public)
 *     "createdAt": "2021-01-01T00:00:00Z",
 *     "updatedAt": "2021-01-01T00:00:00Z"
 *     }
 * }
 *
 * Expected error responses:
 * - 3002: Space not found
 * - 3003: Space ID is invalid
 * - 2001: Missing or invalid token
 * - 5000: Internal server error
 */
export const getSpace = async (spaceId) => {
    const res = await http.get(`/api/v1/space/${spaceId}`);
    return res;
};


/**
 * Status: To be implemented
 * Update the name of a space.
 *
 * Purpose:
 * - Rename an existing space (knowledge base).
 *
 * Endpoint:
 * - PUT /api/v1/space/:spaceId/rename
 *
 * Path params:
 * - spaceId: string (required) – ID of the space to update.
 *
 * Query params:
 * - none
 *
 * Request body (JSON):
 * - name: string (required) – The new name for the space.
 *   // Can be extended later:
 *   // description: string (optional) – The new description for the space.
 *
 * Authentication:
 * - Requires valid auth token (e.g. Bearer token in Authorization header).
 *
 * Expected success response (200):
 * {
 *   "code": "OK",
 *   "success": true,
 *   "message": "Space updated successfully",
 *   "data": {
 *     "id": "1234567",
 *     "name": "Renamed Space",
 *     "description": "This is a description of the space",
 *     "filesCount": 0,
 *     "icon": null,
 *     "status": "private", (private, public)
 *     "createdAt": "2021-01-01T00:00:00Z",
 *     "updatedAt": "2021-01-02T00:00:00Z"
 *   }
 * }
 *
 * Expected error responses:
 * - 3001: Missing or invalid name
 * - 2001: Missing or invalid token
 * - 3002: Space not found
 * - 3003: Space ID is invalid
 * - 3004: Permission denied
 * - 5000: Internal server error
 */
export const renameSpace = async (spaceId, name) => {
    const body = {
        name: name,
    };
    const res = await http.put(`/api/v1/space/${spaceId}`, body);
    return res;
};

export const updateSpaceStatus = async (spaceId, status) => {
    const body = {
        status: status,
    };
    const res = await http.put(`/api/v1/space/${spaceId}`, body);
    return res;
};


/**
 * Status: To be implemented
 * Delete a space.
 *
 * Purpose:
 * - Permanently delete a space (knowledge base) and its associated data.
 *
 * Endpoint:
 * - DELETE /api/v1/space/:spaceId
 *
 * Path params:
 * - spaceId: string (required) – ID of the space to delete.
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
 *   "message": "Space deleted successfully",
 *   "data": {
 *     "id": "1234567",
 *     "deleted": true,
 *     "deletedAt": "2021-01-02T00:00:00Z"
 *   }
 * }
 *
 * Expected error responses:
 * - 2001: Missing or invalid token
 * - 3002: Space not found
 * - 3004: Permission denied
 * - 5000: Internal server error
 */
export const deleteSpace = async (spaceId) => {
    const res = await http.delete(`/api/v1/space/${spaceId}`);
    return res;
};