const spaceService = require('../services/space.service');
const response = require('../utils/response');


async function createSpace(req, res, next) {
    const userId = req.user.userId;
    try {
        const { name, description, icon, status } = req.body;

        if (!name) { return res.status(400).json(response.error('Missing or invalid name', 3001)); }

        const spaceData = {
            userId,
            name,
            ...(description && { description }),
            ...(icon && { icon }),
            status: status || 'private' // Always include status, default to 'private' if not provided
        };
        const result = await spaceService.createSpace(spaceData);
        
        res.status(201).json(response.success(result, 'Space created successfully'));
    } catch (error) {
        res.status(500).json(response.error(error.message));
    }
}

async function getSpacesWithFilesByUserId(req, res, next) {
    const userId = req.user.userId;
    try {
        const result = await spaceService.getSpacesWithFilesByUserId(userId);
        res.status(200).json(response.success(result, 'Spaces listed successfully'));
    } catch (error) {
        res.status(500).json(response.error(error.message));
    }
}

async function getSpaceById(req, res, next) {
    const userId = req.user.userId;
    const spaceId = req.params.id;

    if (!spaceId) { return res.status(400).json(response.error('Space ID is invalid', 3003)); }

    try {
        const result = await spaceService.getSpaceById(spaceId, userId);
        res.status(200).json(response.success(result, 'Space retrieved successfully'));
    } catch (error) {
        res.status(500).json(response.error(error.message));
    }
}

async function updateSpace(req, res, next) {
    const userId = req.user.userId;
    const spaceId = req.params.id;
    const { name, description, icon, status } = req.body;

    if (!spaceId) { return res.status(400).json(response.error('Space ID is invalid', 3003)); }

    try {
        // Log the request for debugging
        console.log(`[UpdateSpace] SpaceId: ${spaceId}, UserId: ${userId}, Status: ${status}, Name: ${name}`);
        const result = await spaceService.updateSpace(spaceId, userId, name, description, icon, status);
        console.log(`[UpdateSpace] Success for space ${spaceId}`);
        res.status(200).json(response.success(result, 'Space updated successfully'));
    } catch (error) {
        console.error(`[UpdateSpace] Error for space ${spaceId}:`, error.message);
        console.error('Full error:', error);
        // Return proper error code if it's a BusinessError
        const statusCode = error.code >= 3000 && error.code < 4000 ? 400 : 500;
        res.status(statusCode).json(response.error(error.message, error.code || 5000));
    }
}

async function deleteSpace(req, res, next) {
    const userId = req.user.userId;
    const spaceId = req.params.id;

    if (!spaceId) { return res.status(400).json(response.error('Space ID is required')); }

    try {
        const result = await spaceService.deleteSpace(spaceId, userId);
        res.status(200).json(response.success(result, 'Space deleted successfully'));
    } catch (error) {
        res.status(500).json(response.error(error.message));
    }
}

module.exports = {
    createSpace,
    getSpacesWithFilesByUserId,
    getSpaceById,
    updateSpace,
    deleteSpace
};