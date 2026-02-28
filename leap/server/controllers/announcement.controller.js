const announcementService = require('../services/announcement.service');
const response = require('../utils/response');

// Create a new announcement (teachers only)
// body: { title, content, is_published = true }
async function createAnnouncement(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only teachers can create announcements
        if (userRole !== 'teacher') {
            return res.status(403).json(response.error('Only teachers can create announcements', 4001));
        }

        const { title, content, is_published = true } = req.body;

        if (!title || !content) {
            return res.status(400).json(response.error('Title and content are required'));
        }

        const announcement = await announcementService.createAnnouncement(
            { title, content, is_published },
            userId
        );

        res.status(201).json(response.success(announcement, 'Announcement created successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Get all published announcements (for students)
// Get all announcements (for teachers - includes their own unpublished ones)
async function getAnnouncements(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        let announcements;

        if (userRole === 'student') {
            // Students can only see published announcements
            announcements = await announcementService.getPublishedAnnouncements();
        } else if (userRole === 'teacher') {
            // Teachers can see all their announcements (published and unpublished)
            announcements = await announcementService.getAllAnnouncements(userId);
        } else {
            return res.status(403).json(response.error('Unauthorized access', 4001));
        }

        res.status(200).json(response.success(announcements, 'Announcements retrieved successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Get a single announcement by ID
async function getAnnouncementById(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { id } = req.params;

        const announcement = await announcementService.getAnnouncementById(id, userId, userRole);

        if (!announcement) {
            return res.status(404).json(response.error('Announcement not found'));
        }

        res.status(200).json(response.success(announcement, 'Announcement retrieved successfully'));
    } catch (err) {
        res.status(500).json(response.error(err.message));
    }
}

// Update an announcement (teachers only, their own announcements)
// body: { title?, content?, is_published? }
async function updateAnnouncement(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only teachers can update announcements
        if (userRole !== 'teacher') {
            return res.status(403).json(response.error('Only teachers can update announcements', 4001));
        }

        const { id } = req.params;
        const { title, content, is_published } = req.body;

        const announcement = await announcementService.updateAnnouncement(
            id,
            { title, content, is_published },
            userId
        );

        res.status(200).json(response.success(announcement, 'Announcement updated successfully'));
    } catch (err) {
        if (err.message.includes('not found') || err.message.includes('only update')) {
            return res.status(404).json(response.error(err.message));
        }
        res.status(500).json(response.error(err.message));
    }
}

// Delete an announcement (teachers only, their own announcements)
async function deleteAnnouncement(req, res) {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Only teachers can delete announcements
        if (userRole !== 'teacher') {
            return res.status(403).json(response.error('Only teachers can delete announcements', 4001));
        }

        const { id } = req.params;

        const result = await announcementService.deleteAnnouncement(id, userId);

        res.status(200).json(response.success(result, 'Announcement deleted successfully'));
    } catch (err) {
        if (err.message.includes('not found') || err.message.includes('only delete')) {
            return res.status(404).json(response.error(err.message));
        }
        res.status(500).json(response.error(err.message));
    }
}

module.exports = {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement
};

