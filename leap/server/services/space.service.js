const { pool } = require('../config/database');
const { createDataset, deleteDataset } = require('../intergrations/ragflow.client');
const assistantService = require('./assistant.service');
const { v7 } = require('uuid');
const { BusinessError } = require('../errors/businessError');
require('dotenv').config();

// create a new space
// body: { userId, name, description, icon, status }
// return { space: { id, name, description, icon, status } }
async function createSpace({ userId, name, description = null, icon = null, status = 'private' }) {
    const connection = await pool.getConnection();
    let ragflowDatasetId = null;
    let spaceId = null;

    try {
        // Validate status - only teachers can create public/shared spaces
        const [userRows] = await connection.execute(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        const userRole = userRows[0]?.role || 'student';
        
        // Only teachers can set status to public
        if (status === 'public' && userRole !== 'teacher') {
            throw new BusinessError('Only teachers can create public spaces', 3005);
        }
        
        // Validate status value
        const validStatuses = ['private', 'public'];
        if (!validStatuses.includes(status)) {
            throw new BusinessError('Invalid status. Must be private or public', 3006);
        }

        await connection.beginTransaction();

        const ragflowDatasetName = v7();
        ragflowDatasetId = await createDataset(ragflowDatasetName);
        if (!ragflowDatasetId) { 
            throw new Error('Failed to create ragflow dataset'); 
        }

        const [result] = await connection.execute(
            `
            INSERT INTO spaces (owner_id, name, description, icon, ragflow_dataset_id, status)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [userId, name, description, icon, ragflowDatasetId, status]
        );
        spaceId = result.insertId;

        await connection.execute(
            `
            INSERT INTO space_members (user_id, space_id, role)
            VALUES (?, ?, ?)
            `,
            [userId, spaceId, 'owner']
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();

        if (ragflowDatasetId) {
            try {
                await deleteDataset(ragflowDatasetId);
                console.log(`Cleaned up orphaned Ragflow dataset: ${ragflowDatasetId}`);
            } catch (cleanupError) {
                console.error(
                    `Failed to clean up Ragflow dataset ${ragflowDatasetId}:`,
                    cleanupError.message
                );
            }
        }

        throw error;
    } finally {
        connection.release();
    }

    // Init assistants after space and dataset are fully created
    if (spaceId) {
        try {
            await assistantService.initAssistantsForSpace(spaceId);
        } catch (e) {
            console.error('Failed to init assistants for space', spaceId, e);
            // not throw error, space can still be used, but RAG mode may be temporarily unavailable
        }
    }

    return {
        space: {
            id: spaceId,
            name,
            description,
            icon,
            status,
        }
    };
}

async function getSpacesWithFilesByUserId(userId) {
    const connection = await pool.getConnection();
    try {
        // Get user role to determine if they're a student
        const [userRows] = await connection.execute(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        const userRole = userRows[0]?.role || 'student';

        // For students, also include public spaces owned by teachers (even if they're not members)
        // For other users, only show spaces where they are members
        const [spaces] = await connection.execute(`
            SELECT DISTINCT
                s.id, 
                s.name, 
                s.description, 
                s.icon,
                s.status,
                s.owner_id,
                s.created_at, 
                s.updated_at,
                COALESCE(sm.role, 'viewer') AS userRole,
                u.role AS ownerRole
            FROM spaces s
            LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = ? AND sm.isdeleted = FALSE
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE s.isdeleted = FALSE
              AND (
                  -- User is a member of the space
                  sm.user_id IS NOT NULL
                  OR
                  -- OR (for students only) space is public and owned by a teacher
                  (u.role = 'teacher' AND s.status = 'public' AND ? = 'student')
              )
            ORDER BY s.updated_at DESC
        `, [userId, userRole]);
        if (spaces.length === 0) { return []; }

        const spaceIds = spaces.map(space => space.id);
        const placeholders = spaceIds.map(() => '?').join(',');

        const [files] = await connection.execute(`
            SELECT 
                id, 
                space_id, 
                title, 
                mime_type,
                storage_key,                 
                status, 
                uploaded_at 
            FROM files 
            WHERE space_id IN (${placeholders}) 
              AND isdeleted = FALSE  
            ORDER BY uploaded_at DESC
        `, [...spaceIds]);

        const storageKeyUrl = process.env.STORAGE_KEY_URL || 'http://localhost:3002';
        // Files are stored in public/upload/ and served via Express static middleware
        // So they're accessible at /upload/{filename}
        const getFileUrl = (storageKey) => {
            return storageKeyUrl.endsWith('/upload') 
                ? `${storageKeyUrl}/${storageKey}`
                : `${storageKeyUrl}/upload/${storageKey}`;
        };

        const formattedData = spaces.map(space => {
            const currentSpaceFiles = files.filter(f => f.space_id === space.id);

            const formattedFiles = currentSpaceFiles.map(file => ({
                id: file.id,
                title: file.title,
                type: file.mime_type,
                url: getFileUrl(file.storage_key),
                status: file.status,
                uploadedAt: file.uploaded_at
            }));

            // Determine if this is a common space (teacher-owned, public)
            const isCommonSpace = space.ownerRole === 'teacher' && 
                                  space.status === 'public' &&
                                  space.owner_id !== userId;
            
            // Determine if user can edit (students cannot edit common spaces)
            const canEdit = userRole !== 'student' || !isCommonSpace;

            return {
                id: space.id,
                name: space.name,
                description: space.description || "",
                filesCount: formattedFiles.length,
                icon: space.icon,
                status: space.status,
                createdAt: space.created_at,
                updatedAt: space.updated_at,
                userRole: space.userRole,
                ownerId: space.owner_id,
                ownerRole: space.ownerRole,
                isCommonSpace: isCommonSpace,
                canEdit: canEdit,
                files: formattedFiles
            };
        });

        return formattedData;

    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

async function getSpaceById(spaceId, userId) {
    const connection = await pool.getConnection();
    try {
        // Get user role first
        const [userRows] = await connection.execute(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );
        const userRole = userRows[0]?.role || 'student';

        const [rows] = await connection.execute(`
            SELECT 
                s.id, 
                s.name, 
                s.description, 
                s.icon,
                s.status,
                s.owner_id,
                s.created_at, 
                s.updated_at,
                COALESCE(sm.role, 'viewer') AS userRole,
                u.role AS ownerRole
            FROM spaces s
            LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = ? AND sm.isdeleted = FALSE
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE s.id = ? 
              AND s.isdeleted = FALSE
              AND (
                  -- User is a member of the space
                  sm.user_id IS NOT NULL
                  OR
                  -- OR (for students only) space is public and owned by a teacher
                  (u.role = 'teacher' AND s.status = 'public' AND ? = 'student')
              )
            LIMIT 1
        `, [userId, spaceId, userRole]);

        if (rows.length === 0) {
            throw new BusinessError('Space not found', 3002);
        }

        const space = rows[0];

        const [countResult] = await connection.execute(`
            SELECT COUNT(*) as total 
            FROM files 
            WHERE space_id = ? 
              AND isdeleted = FALSE
        `, [spaceId]);

        const filesCount = countResult[0].total;

        // Determine if this is a common space (teacher-owned, public)
        const isCommonSpace = space.ownerRole === 'teacher' && 
                              space.status === 'public' &&
                              space.owner_id !== userId;
        
        // Determine if user can edit (students cannot edit common spaces)
        const canEdit = userRole !== 'student' || !isCommonSpace;

        return {
            id: space.id,
            name: space.name,
            description: space.description || "",
            filesCount: filesCount,
            icon: space.icon,
            status: space.status,
            createdAt: space.created_at,
            userRole: space.userRole || 'viewer',
            ownerId: space.owner_id,
            ownerRole: space.ownerRole,
            isCommonSpace: isCommonSpace,
            canEdit: canEdit,
            updatedAt: space.updated_at
        };
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

async function updateSpace(spaceId, userId, name, description = null, icon = null, status = null) {
    const connection = await pool.getConnection();
    try {
        console.log(`[updateSpace] Called with spaceId=${spaceId}, userId=${userId}, status=${status}, name=${name}`);
        
        // Get user role and space owner info
        const [memberRows] = await connection.execute(`
            SELECT sm.role, u.role AS userRole, s.owner_id
            FROM space_members sm
            JOIN users u ON sm.user_id = u.id
            JOIN spaces s ON sm.space_id = s.id
            WHERE sm.space_id = ? 
              AND sm.user_id = ? 
              AND sm.isdeleted = FALSE
        `, [spaceId, userId]);

        if (memberRows.length === 0) {
            throw new BusinessError('Space not found', 3002);
        }

        const member = memberRows[0];
        const userRole = member.role;
        const userAccountRole = member.userRole;

        console.log(`[updateSpace] User role in space: ${userRole}, User account role: ${userAccountRole}`);

        const allowedRoles = ['owner', 'admin'];
        if (!allowedRoles.includes(userRole)) {
            throw new BusinessError('Permission denied', 3004);
        }

        // Validate status if provided - only teachers can set public
        if (status !== null && status !== undefined) {
            console.log(`[updateSpace] Validating status: ${status}`);
            const validStatuses = ['private', 'public'];
            if (!validStatuses.includes(status)) {
                throw new BusinessError('Invalid status. Must be private or public', 3006);
            }
            
            // Only teachers can set status to public
            if (status === 'public' && userAccountRole !== 'teacher') {
                console.log(`[updateSpace] Rejected: User ${userId} (role: ${userAccountRole}) cannot set space to public`);
                throw new BusinessError('Only teachers can set spaces to public', 3005);
            }
            console.log(`[updateSpace] Status validation passed`);
        }

        // Build update query dynamically based on provided fields
        const updateFields = [];
        const updateValues = [];
        
        if (name !== undefined && name !== null) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (description !== undefined && description !== null) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (icon !== undefined && icon !== null) {
            updateFields.push('icon = ?');
            updateValues.push(icon);
        }
        if (status !== null && status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }

        if (updateFields.length === 0) {
            throw new BusinessError('No fields to update', 3007);
        }

        updateValues.push(spaceId);

        const [updateResult] = await connection.execute(`
            UPDATE spaces 
            SET ${updateFields.join(', ')}
            WHERE id = ? 
              AND isdeleted = FALSE
        `, updateValues);

        if (updateResult.affectedRows === 0) {
            throw new BusinessError('Space not found', 3002);
        }

        const [rows] = await connection.execute(`
            SELECT 
                id, name, description, icon, status, created_at, updated_at 
            FROM spaces 
            WHERE id = ? AND isdeleted = FALSE
        `, [spaceId]);

        if (rows.length === 0) {
            throw new BusinessError('Space not found after update', 3002);
        }

        const updatedSpace = rows[0];

        const [countResult] = await connection.execute(`
            SELECT COUNT(*) as total 
            FROM files 
            WHERE space_id = ? AND isdeleted = FALSE
        `, [spaceId]);

        const filesCount = countResult[0].total;

        return {
            id: updatedSpace.id,
            name: updatedSpace.name,
            description: updatedSpace.description || "",
            filesCount: filesCount,
            icon: updatedSpace.icon,
            status: updatedSpace.status,
            createdAt: updatedSpace.created_at,
            updatedAt: updatedSpace.updated_at
        };
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

async function deleteSpace(spaceId, userId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [memberRows] = await connection.execute(`
            SELECT role 
            FROM space_members 
            WHERE space_id = ? 
              AND user_id = ? 
              AND isdeleted = FALSE
            FOR UPDATE
        `, [spaceId, userId]);

        if (memberRows.length === 0) {
            await connection.rollback();
            throw new BusinessError('Space not found', 3002);
        }

        const userRole = memberRows[0].role;
        const allowedRoles = ['owner', 'admin'];

        if (!allowedRoles.includes(userRole)) {
            await connection.rollback();
            throw new BusinessError('Permission denied', 3004);
        }

        await connection.execute(`
            UPDATE spaces 
            SET isdeleted = TRUE 
            WHERE id = ?
        `, [spaceId]);

        await connection.execute(`
            UPDATE files 
            SET isdeleted = TRUE 
            WHERE space_id = ?
        `, [spaceId]);

        await connection.execute(`
            UPDATE space_members 
            SET isdeleted = TRUE 
            WHERE space_id = ?
        `, [spaceId]);

        await connection.commit();

        return {
            id: spaceId,
            deleted: true,
            deletedAt: new Date()
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    createSpace,
    getSpacesWithFilesByUserId,
    getSpaceById,
    updateSpace,
    deleteSpace
}