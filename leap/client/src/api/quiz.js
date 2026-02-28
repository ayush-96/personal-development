import { http } from "./http";

export const generateQuiz = async (fileId, storage_key) => {
    const body = {
        fileId: fileId,
        storage_key: storage_key
    };
    return http.post(`/api/v1/quiz/generate`, body);
};

export const regenerateQuiz = async (fileId, storage_key) => {
    const body = {
        fileId: fileId,
        storage_key: storage_key
    };
    return http.post(`/api/v1/quiz/regenerate`, body);
};

export const publishQuiz = async (fileId) => {
    const body = {
        fileId: fileId
    };
    return http.post(`/api/v1/quiz/publish`, body);
};

export const unpublishQuiz = async (fileId) => {
    const body = {
        fileId: fileId
    };
    return http.post(`/api/v1/quiz/unpublish`, body);
};

export const getQuizByFileId = async (fileId) => {
    return http.get('/api/v1/quiz', {
        params: {
            fileId: fileId
        }
    });
};

export const saveQuizAttempt = async (fileId, score, totalQuestions) => {
    const body = {
        fileId: fileId,
        score: score,
        totalQuestions: totalQuestions
    };
    return http.post(`/api/v1/quiz/attempt`, body);
};

export const getQuizAttemptHistory = async (fileId) => {
    return http.get('/api/v1/quiz/attempt/history', {
        params: {
            fileId: fileId
        }
    });
};

export const getQuizAttemptStats = async (fileId) => {
    return http.get('/api/v1/quiz/attempt/stats', {
        params: {
            fileId: fileId
        }
    });
};

export const editQuiz = async (fileId, storage_key) => {
    const body = {
        fileId: fileId,
        storage_key: storage_key
    };
    return http.post(`/api/v1/quiz/edit`, body);
};

export const getQuizVersions = async (fileId) => {
    return http.get('/api/v1/quiz/versions', {
        params: {
            fileId: fileId
        }
    });
};

export const generateEphemeralQuiz = async (fileId, storage_key) => {
    const body = {
        fileId: fileId,
        storage_key: storage_key
    };
    return http.post('/api/v1/quiz/practice/generate', body);
};