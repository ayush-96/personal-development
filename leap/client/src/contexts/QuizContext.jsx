import React, { createContext, useState, useContext, useEffect } from 'react';
import { getQuizByFileId, generateQuiz as generateQuizApi, regenerateQuiz as regenerateQuizApi, publishQuiz as publishQuizApi, unpublishQuiz as unpublishQuizApi } from '../api/quiz';
import { useParams } from 'react-router-dom';

const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
    const [quiz, setQuiz] = useState([]);
    const [publishStatus, setPublishStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { fileId: routeFileId } = useParams();

    const fetchQuiz = async (targetFileId) => {
        const id = targetFileId || routeFileId;
        
        if (!id) {
            setQuiz([]);
            setPublishStatus(null);
            return;
        }
        setLoading(true);
        setError(null); 
        try {
            const response = await getQuizByFileId(id);
            // Handle new response format with questions and publishStatus
            if (response.data && typeof response.data === 'object' && response.data.questions) {
                setQuiz(response.data.questions || []);
                setPublishStatus(response.data.publishStatus || null);
            } else if (Array.isArray(response.data)) {
                // Backward compatibility: if it's just an array
                setQuiz(response.data || []);
                setPublishStatus(null);
            } else {
                setQuiz([]);
                setPublishStatus(null);
            }
        } catch (error) {
            console.error("Fetch quiz error:", error);
            setError(error);
            setQuiz([]);
            setPublishStatus(null);
        } finally {
            setLoading(false);
        }
    }

    const generateQuiz = async (targetFileId, storageKey) => {
        const id = targetFileId || routeFileId;
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await generateQuizApi(id, storageKey);
            if (response.data && Array.isArray(response.data)) {
                 setQuiz(response.data);
            } else {
                 await fetchQuiz(id);
            }
            return response;
        } catch (error) {
            console.error("Generate quiz error:", error);
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const regenerateQuiz = async (targetFileId, storageKey) => {
        const id = targetFileId || routeFileId;
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await regenerateQuizApi(id, storageKey);
            if (response.data && Array.isArray(response.data)) {
                 setQuiz(response.data);
            } else {
                 await fetchQuiz(id);
            }
            return response;
        } catch (error) {
            console.error("Regenerate quiz error:", error);
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (routeFileId) {
            fetchQuiz(routeFileId);
        }
    }, [routeFileId]);

    const publishQuiz = async (targetFileId) => {
        const id = targetFileId || routeFileId;
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await publishQuizApi(id);
            // Refresh quiz to get updated publish status
            await fetchQuiz(id);
            return response;
        } catch (error) {
            console.error("Publish quiz error:", error);
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const unpublishQuiz = async (targetFileId) => {
        const id = targetFileId || routeFileId;
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await unpublishQuizApi(id);
            // Refresh quiz to get updated publish status
            await fetchQuiz(id);
            return response;
        } catch (error) {
            console.error("Unpublish quiz error:", error);
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value = { 
        quiz, 
        publishStatus,
        loading, 
        error, 
        fetchQuiz,
        generateQuiz,
        regenerateQuiz,
        publishQuiz,
        unpublishQuiz
    };

    return (
        <QuizContext.Provider value={value}>
            {children}
        </QuizContext.Provider>
    );
};

export const useQuiz = () => {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuiz must be used within a QuizProvider');
    }
    return context;
}