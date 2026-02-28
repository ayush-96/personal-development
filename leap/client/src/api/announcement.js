import { http } from "./http";

export const getAnnouncements = async () => {
    return http.get('/api/v1/announcement');
};

export const getAnnouncementById = async (id) => {
    return http.get(`/api/v1/announcement/${id}`);
};

export const createAnnouncement = async (title, content, is_published = true) => {
    const body = {
        title,
        content,
        is_published
    };
    return http.post('/api/v1/announcement', body);
};

export const updateAnnouncement = async (id, title, content, is_published) => {
    const body = {};
    if (title !== undefined) body.title = title;
    if (content !== undefined) body.content = content;
    if (is_published !== undefined) body.is_published = is_published;
    return http.put(`/api/v1/announcement/${id}`, body);
};

export const deleteAnnouncement = async (id) => {
    return http.delete(`/api/v1/announcement/${id}`);
};

