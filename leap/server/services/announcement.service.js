const { pool } = require('../config/database');
const { BusinessError } = require('../errors/businessError');

// Create a new announcement
// announcementData: { title, content, is_published = true }
// userId: ID of the teacher creating the announcement
// Returns: { id, title, content, created_by, is_published, created_at }
async function createAnnouncement(announcementData, userId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { title, content, is_published = true } = announcementData;

        if (!title || !content) {
            throw new BusinessError('Title and content are required', 5001);
        }

        // Insert announcement
        const [result] = await connection.execute(
            `INSERT INTO announcements (title, content, created_by, is_published)
             VALUES (?, ?, ?, ?)`,
            [title, content, userId, is_published]
        );

        await connection.commit();

        // Fetch the created announcement
        const [announcements] = await connection.execute(
            `SELECT a.id, a.title, a.content, a.created_by, a.is_published, 
                    a.created_at, a.updated_at,
                    u.email as created_by_email
             FROM announcements a
             JOIN users u ON a.created_by = u.id
             WHERE a.id = ? AND a.isdeleted = FALSE`,
            [result.insertId]
        );

        return announcements[0];
    } catch (error) {
        await connection.rollback();
        if (error instanceof BusinessError) {
            throw error;
        }
        throw new Error(`Error creating announcement: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Get all published announcements (for students)
// Returns: Array of announcements sorted by created_at DESC
async function getPublishedAnnouncements() {
    const connection = await pool.getConnection();
    try {
        const [announcements] = await connection.execute(
            `SELECT a.id, a.title, a.content, a.created_by, a.is_published,
                    a.created_at, a.updated_at,
                    u.email as created_by_email
             FROM announcements a
             JOIN users u ON a.created_by = u.id
             WHERE a.is_published = TRUE 
               AND a.isdeleted = FALSE
             ORDER BY a.created_at DESC`
        );

        return announcements;
    } catch (error) {
        throw new Error(`Error getting published announcements: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Get all announcements (for teachers - includes unpublished)
// userId: ID of the teacher (optional, if provided, only returns their announcements)
// Returns: Array of announcements sorted by created_at DESC
async function getAllAnnouncements(userId = null) {
    const connection = await pool.getConnection();
    try {
        let query = `
            SELECT a.id, a.title, a.content, a.created_by, a.is_published,
                   a.created_at, a.updated_at,
                   u.email as created_by_email
            FROM announcements a
            JOIN users u ON a.created_by = u.id
            WHERE a.isdeleted = FALSE
        `;

        const params = [];

        if (userId) {
            query += ` AND a.created_by = ?`;
            params.push(userId);
        }

        query += ` ORDER BY a.created_at DESC`;

        const [announcements] = await connection.execute(query, params);

        return announcements;
    } catch (error) {
        throw new Error(`Error getting announcements: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Get announcement by ID
// announcementId: ID of the announcement
// userId: Optional user ID for permission checking
// userRole: Optional user role for permission checking
// Returns: Announcement object or null
async function getAnnouncementById(announcementId, userId = null, userRole = null) {
    const connection = await pool.getConnection();
    try {
        let query = `
            SELECT a.id, a.title, a.content, a.created_by, a.is_published,
                   a.created_at, a.updated_at,
                   u.email as created_by_email
            FROM announcements a
            JOIN users u ON a.created_by = u.id
            WHERE a.id = ? AND a.isdeleted = FALSE
        `;

        const params = [announcementId];

        // Students can only see published announcements
        if (userRole === 'student') {
            query += ` AND a.is_published = TRUE`;
        }

        const [announcements] = await connection.execute(query, params);

        if (announcements.length === 0) {
            return null;
        }

        return announcements[0];
    } catch (error) {
        throw new Error(`Error getting announcement: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Update announcement
// announcementId: ID of the announcement
// announcementData: { title, content, is_published }
// userId: ID of the user updating (must be the creator)
// Returns: Updated announcement object
async function updateAnnouncement(announcementId, announcementData, userId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verify the announcement exists and belongs to the user
        const [existing] = await connection.execute(
            `SELECT created_by FROM announcements 
             WHERE id = ? AND isdeleted = FALSE`,
            [announcementId]
        );

        if (existing.length === 0) {
            throw new BusinessError('Announcement not found', 5002);
        }

        if (existing[0].created_by !== userId) {
            throw new BusinessError('You can only update your own announcements', 5003);
        }

        const { title, content, is_published } = announcementData;
        const updates = [];
        const params = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }

        if (content !== undefined) {
            updates.push('content = ?');
            params.push(content);
        }

        if (is_published !== undefined) {
            updates.push('is_published = ?');
            params.push(is_published);
        }

        if (updates.length === 0) {
            await connection.commit();
            return await getAnnouncementById(announcementId);
        }

        params.push(announcementId);

        await connection.execute(
            `UPDATE announcements 
             SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            params
        );

        await connection.commit();

        return await getAnnouncementById(announcementId);
    } catch (error) {
        await connection.rollback();
        if (error instanceof BusinessError) {
            throw error;
        }
        throw new Error(`Error updating announcement: ${error.message}`);
    } finally {
        connection.release();
    }
}

// Delete announcement (soft delete)
// announcementId: ID of the announcement
// userId: ID of the user deleting (must be the creator)
// Returns: { deleted: true, message: 'Announcement deleted successfully' }
async function deleteAnnouncement(announcementId, userId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verify the announcement exists and belongs to the user
        const [existing] = await connection.execute(
            `SELECT created_by FROM announcements 
             WHERE id = ? AND isdeleted = FALSE`,
            [announcementId]
        );

        if (existing.length === 0) {
            throw new BusinessError('Announcement not found', 5002);
        }

        if (existing[0].created_by !== userId) {
            throw new BusinessError('You can only delete your own announcements', 5003);
        }

        // Soft delete
        await connection.execute(
            `UPDATE announcements 
             SET isdeleted = TRUE, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [announcementId]
        );

        await connection.commit();

        return { deleted: true, message: 'Announcement deleted successfully' };
    } catch (error) {
        await connection.rollback();
        if (error instanceof BusinessError) {
            throw error;
        }
        throw new Error(`Error deleting announcement: ${error.message}`);
    } finally {
        connection.release();
    }
}

module.exports = {
    createAnnouncement,
    getPublishedAnnouncements,
    getAllAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement
};

