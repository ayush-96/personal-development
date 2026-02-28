import React, { createContext, useContext, useState, useCallback } from 'react';
import * as chatApi from '../api/chat';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false); // 发送消息时的加载状态
    const [ragflowStatus, setRagflowStatus] = useState(null);

    // 获取会话列表 (Space 概览)
    const fetchSessions = useCallback(async (spaceId) => {
        setLoading(true);
        try {
            const res = await chatApi.getChatOverview(spaceId);
            if (res.success) {
                // 假设 res.data 包含了会话列表，具体结构需根据后端调整
                // 如果 res.data 直接是数组:
                setSessions(res.data.sessions || []); 
                return res.data;
            }
        } catch (error) {
            console.error("Failed to fetch chat sessions:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 创建新会话
    const createNewSession = async (spaceId, title) => {
        try {
            const res = await chatApi.createChatSession(spaceId, title);
            if (res.success) {
                const newSession = res.data;
                setSessions(prev => [newSession, ...prev]);
                // 创建后自动选中
                setCurrentSession(newSession);
                setMessages([]); 
                return newSession;
            }
        } catch (error) {
            console.error("Failed to create chat session:", error);
        }
        return null;
    };

    // 重命名会话
    const updateSessionTitle = async (sessionId, title) => {
        try {
            const res = await chatApi.renameChatSession(sessionId, title);
            if (res.success) {
                setSessions(prev => prev.map(s => 
                    s.id === sessionId ? { ...s, title } : s
                ));
                if (currentSession?.id === sessionId) {
                    setCurrentSession(prev => ({ ...prev, title }));
                }
                return true;
            }
        } catch (error) {
            console.error("Failed to rename chat session:", error);
        }
        return false;
    };

    // 删除会话
    const removeSession = async (sessionId) => {
        try {
            const res = await chatApi.deleteChatSession(sessionId);
            if (res.success) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                if (currentSession?.id === sessionId) {
                    setCurrentSession(null);
                    setMessages([]);
                }
                return true;
            }
        } catch (error) {
            console.error("Failed to delete chat session:", error);
        }
        return false;
    };

    // 选中会话并获取消息
    const selectSession = useCallback(async (session) => {
        setCurrentSession(session);
        setMessages([]); // 切换前清空旧消息
        setLoading(true);
        try {
            const res = await chatApi.getSessionMessages(session.id, {});
            if (res.success) {
                setMessages(res.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch session messages:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 发送消息
    const sendMessage = async (sessionId, content) => {
        setSending(true);
        // 乐观更新：先在 UI 上显示用户的消息
        const tempUserMsg = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: content,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const res = await chatApi.sendSessionMessage(sessionId, { content });
            if (res.success) {
                // 假设后端返回完整的消息列表或最新的 AI 回复
                // 这里假设返回的是最新的 AI 回复对象 或 包含用户和AI的消息对
                // 根据实际接口调整，这里做通用处理：重新拉取或追加
                
                // 如果返回的是追加的消息 (例如 AI 的回复)
                if (res.data) {
                    setMessages(prev => {
                        // 移除临时消息，加入正式返回的消息（如果包含用户消息的话）
                        const realMessages = prev.filter(m => m.id !== tempUserMsg.id);
                        // 如果 res.data 是数组则展开，如果是单个对象则追加
                        const newMsgs = Array.isArray(res.data) ? res.data : [res.data];
                        return [...realMessages, ...newMsgs];
                    });
                } else {
                    // 如果没返回数据，重新拉取（兜底）
                    const msgsRes = await chatApi.getSessionMessages(sessionId);
                    if (msgsRes.success) {
                        setMessages(msgsRes.data);
                    }
                }
                return true;
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            // 发送失败，移除临时消息或标记错误
            // setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
        } finally {