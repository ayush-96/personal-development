import React, { createContext, useContext, useState, useEffect } from 'react';
import * as spaceApi from '../api/space';
import * as fileApi from '../api/files';
import { useUser } from './UserContext';

const SpaceContext = createContext();

export const SpaceProvider = ({ children }) => {
    const { user } = useUser();
    const [spaces, setSpaces] = useState([]);
    const [currentSpace, setCurrentSpace] = useState(null);
    const [currentFile, setCurrentFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSpaces();
        } else {
            setSpaces([]);
            setCurrentSpace(null);
        }
    }, [user]);

    // watch currentSpace change, set default currentFile
    useEffect(() => {
        if (currentSpace && currentSpace.files && currentSpace.files.length > 0) {
            const fileInSpace = currentFile ? currentSpace.files.find(f => f.id === currentFile.id) : null;
            
            if (!fileInSpace) {
                setCurrentFile(currentSpace.files[0]);
            }
        } else if (currentSpace && (!currentSpace.files || currentSpace.files.length === 0)) {
            setCurrentFile(null);
        }
    }, [currentSpace?.id]);

    const fetchSpaces = async () => {
        setLoading(true);
        try {
            const res = await spaceApi.listSpacesWithFiles();
            if (res.success) {
                setSpaces(res.data);
                setCurrentSpace(prev => {
                    if (!prev && res.data && res.data.length > 0) {
                        return res.data[0];
                    }
                    return prev;
                });
                return res.data;
            }
        } catch (error) {
            console.error("Failed to fetch spaces:", error);
        } finally {
            setLoading(false);
        }
    };

    const createSpace = async (name, status = 'private') => {
        try {
            const res = await spaceApi.createSpace(name, status);
            if (res.success) {
                const updatedSpaces = await fetchSpaces();
                if (updatedSpaces && res.data && res.data.id) {
                    const newSpace = updatedSpaces.find(s => s.id === res.data.id);
                    if (newSpace) {
                        setCurrentSpace(newSpace);
                    }
                }
                return true;
            }
        } catch (error) {
            console.error("Create space failed:", error);
            return false;
        }
    };

    const deleteSpace = async (spaceId) => {
        try {
            const res = await spaceApi.deleteSpace(spaceId);
            if (res.success) {
                const remainingSpaces = spaces.filter(s => s.id !== spaceId);
                setSpaces(remainingSpaces);

                if (currentSpace?.id === spaceId) {
                    if (remainingSpaces.length > 0) {
                        setCurrentSpace(remainingSpaces[0]);
                    } else {
                        setCurrentSpace(null);
                    }
                }
                return true;
            }
        } catch (error) {
            console.error("Delete space failed:", error);
            return false;
        }
    };

    const selectSpace = async (spaceId) => {
        const localSpace = spaces.find(s => s.id === spaceId);
        if (localSpace) {
            setCurrentSpace(localSpace);
            setCurrentFile(null);
        }

        // 可选：如果列表接口没有返回完整详情，这里可以再调一次 getSpace
        // const res = await spaceApi.getSpace(spaceId);
        // if (res.success) setCurrentSpace(res.data);
    };

    const renameSpace = async (spaceId, name) => {
        try {
            const res = await spaceApi.renameSpace(spaceId, name);
            if (res.success) {
                const updatedSpace = res.data;

                setSpaces(prev =>
                    prev.map(s =>
                        s.id === spaceId
                            ? { ...s, ...updatedSpace }
                            : s
                    )
                );

                if (currentSpace?.id === spaceId) {
                    setCurrentSpace(prev => ({
                        ...prev,
                        ...updatedSpace,
                    }));
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Rename space failed:', error);
            return false;
        }

    }

    const uploadFile = async (file) => {
        if (!currentSpace) return;
        const res = await fileApi.uploadFile(currentSpace.id, file);
        if (res.success) {
            const newFile = res.data;
            setCurrentSpace(prev => ({
                ...prev,
                files: [...(prev.files || []), newFile]
            }));
            setSpaces(prev => prev.map(s =>
                s.id === currentSpace.id
                    ? { ...s, files: [...(s.files || []), newFile] }
                    : s
            ));
            setCurrentFile(newFile);
            return true;
        }
        throw new Error('Upload failed');
    };

    const deleteFile = async (fileId) => {
        if (!currentSpace) return;
        try {
            const res = await fileApi.deleteFile(fileId);
            if (res.success) {
                const remainingFiles = currentSpace.files.filter(f => f.id !== fileId);

                setCurrentSpace(prev => ({
                    ...prev,
                    files: remainingFiles
                }));
                setSpaces(prev => prev.map(s =>
                    s.id === currentSpace.id
                        ? { ...s, files: s.files.filter(f => f.id !== fileId) }
                        : s
                ));

                if (currentFile?.id === fileId) {
                    if (remainingFiles.length > 0) {
                        setCurrentFile(remainingFiles[0]);
                    } else {
                        setCurrentFile(null);
                    }
                }
                return true;
            }
        } catch (error) {
            console.error("Delete file failed:", error);
            return false;
        }
    };

    const selectFile = (fileId) => {
        console.log("selectFile called with:", fileId);
        if (!currentSpace) {
            console.log("No current space selected");
            return;
        }
        const file = currentSpace.files?.find(f => f.id === fileId);
        console.log("Found file:", file);
        if (file) {
            setCurrentFile(file);
        } else {
            console.log("File not found in current space files:", currentSpace.files);
        }
    };

    const renameFile = async (fileId, newTitle) => {
        if (!currentSpace) return false;
    
        try {
            const res = await fileApi.renameFile(fileId, newTitle);
            console.log('[renameFile] api result:', res);
    
            if (!res.success) {
                return false;
            }
    
            const updatedFile = res.data;
    
            // 1) 更新 spaces 列表
            setSpaces(prev =>
                prev.map(space => {
                    if (space.id !== currentSpace.id) return space;
    
                    const oldFiles = space.files || [];
                    return {
                        ...space,
                        files: oldFiles.map(f =>
                            f.id === fileId ? { ...f, ...updatedFile } : f
                        ),
                    };
                })
            );
    
            // 2) 更新 currentSpace
            setCurrentSpace(prev => {
                if (!prev) return prev;
                const oldFiles = prev.files || [];
                return {
                    ...prev,
                    files: oldFiles.map(f =>
                        f.id === fileId ? { ...f, ...updatedFile } : f
                    ),
                };
            });
    
            // 3) 如果当前选中的文件就是这个，也更新
            if (currentFile?.id === fileId) {
                setCurrentFile(prev => (prev ? { ...prev, ...updatedFile } : prev));
            }
    
            return true;
        } catch (error) {
            console.error("Rename file failed:", error);
            return false;
        }
    };

    // watch spaces change, if there are queued files, start polling
    useEffect(() => {
        let intervalId = null;

        const processingFiles = [];
        spaces.forEach(space => {
            space.files?.forEach(file => {
                if (file.status === 'queued' || file.status === 'processing') {
                    processingFiles.push({ spaceId: space.id, fileId: file.id });
                }
            });
        });

        if (processingFiles.length > 0) {
            console.log("检测到处理中的文件，启动轮询...", processingFiles);

            intervalId = setInterval(async () => {
                const checkPromises = processingFiles.map(async ({ spaceId, fileId }) => {
                    try {
                        const res = await fileApi.getFileStatus(fileId);
                        if (res.success && res.data.status !== 'queued' && res.data.status !== 'processing') {
                            updateFileStatus(spaceId, fileId, res.data.status, res.data);
                        }
                    } catch (error) {
                        console.error(`轮询文件状态失败 [${fileId}]:`, error);
                    }
                });

                await Promise.all(checkPromises);
            }, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [spaces, currentSpace]);


    const updateFileStatus = (spaceId, fileId, newStatus, extraData = {}) => {
        setSpaces(prevSpaces => prevSpaces.map(space => {
            if (space.id !== spaceId) return space;

            return {
                ...space,
                files: space.files.map(file => {
                    if (file.id !== fileId) return file;
                    return { ...file, status: newStatus, ...extraData };
                })
            };
        }));

        if (currentSpace && currentSpace.id === spaceId) {
            setCurrentSpace(prev => ({
                ...prev,
                files: prev.files.map(f => {
                    if (f.id !== fileId) return f;
                    return { ...f, status: newStatus, ...extraData };
                })
            }));
        }
    };

    return (
        <SpaceContext.Provider value={{
            spaces,
            currentSpace,
            currentFile,
            selectFile,
            loading,
            fetchSpaces,
            createSpace,
            deleteSpace,
            selectSpace,
            renameSpace,
            uploadFile,
            deleteFile,
            renameFile
        }}>
            {children}
        </SpaceContext.Provider>
    );
};

export const useSpace = () => useContext(SpaceContext);