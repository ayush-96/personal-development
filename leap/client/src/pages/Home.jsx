import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpace } from '@/contexts/SpaceContext';
import { useUser } from '@/contexts/UserContext';
import SpaceCard from '@/components/SpaceCard';
import { Button } from '@/components/ui/button';
import { updateSpaceStatus as updateStatusApi } from '@/api/space';
import {
    IconFolder,
    IconPlus
} from '@/components/ui/icons';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const Home = () => {
    const { spaces, loading, selectSpace, deleteSpace, renameSpace, fetchSpaces, createSpace } = useSpace();
    const { user } = useUser();
    const navigate = useNavigate();
    
    // Separate spaces into common and personal for students
    const isStudent = user?.role === 'student';
    const commonSpaces = isStudent ? spaces.filter(s => s.isCommonSpace) : [];
    const personalSpaces = isStudent ? spaces.filter(s => !s.isCommonSpace) : spaces;

    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [newName, setNewName] = useState("");
    const [newStatus, setNewStatus] = useState("private");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState("");
    const [newSpaceStatus, setNewSpaceStatus] = useState("private");

    useEffect(() => {
        fetchSpaces();
    }, []);

    const handleEnterSpace = async (spaceId) => {
        await selectSpace(spaceId);
        navigate(`/chat/${spaceId}`);
    };

    const openRenameDialog = (space) => {
        setSelectedSpace(space);
        setNewName(space.name);
        setRenameDialogOpen(true);
    };

    const handleRenameSubmit = async () => {
        if (selectedSpace && newName && newName.trim() !== "" && newName !== selectedSpace.name) {
            await renameSpace(selectedSpace.id, newName);
        }
        setRenameDialogOpen(false);
        setSelectedSpace(null);
    };

    const openDeleteDialog = (space) => {
        setSelectedSpace(space);
        setDeleteDialogOpen(true);
    };

    const openStatusDialog = (space) => {
        setSelectedSpace(space);
        setNewStatus(space.status || 'private');
        setStatusDialogOpen(true);
    };

    const updateSpaceStatus = async (spaceId, status) => {
        try {
            const res = await updateStatusApi(spaceId, status);
            if (res.success) {
                await fetchSpaces();
                return true;
            }
            return false;
        } catch (error) {
            console.error("Update space status failed:", error);
            return false;
        }
    };

    const handleStatusSubmit = async () => {
        if (selectedSpace && newStatus && newStatus !== selectedSpace.status) {
            const success = await updateSpaceStatus(selectedSpace.id, newStatus);
            if (success) {
                setStatusDialogOpen(false);
                setSelectedSpace(null);
            }
        }
    };

    const handleDeleteSubmit = async () => {
        if (selectedSpace) {
            await deleteSpace(selectedSpace.id);
        }
        setDeleteDialogOpen(false);
        setSelectedSpace(null);
    };

    const openCreateDialog = () => {
        setNewSpaceName("");
        setCreateDialogOpen(true);
    };

    const handleCreateSubmit = async () => {
        if (newSpaceName && newSpaceName.trim() !== "") {
            const success = await createSpace(newSpaceName, newSpaceStatus);
            if (success) {
                setCreateDialogOpen(false);
                setNewSpaceName("");
                setNewSpaceStatus("private");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Spaces</h1>
                    <p className="text-muted-foreground mt-1">
                        {isStudent 
                            ? "View common spaces and manage your personal spaces"
                            : "Manage and view all your knowledge base spaces"}
                    </p>
                </div>
                <Button onClick={openCreateDialog}>
                    <span className="mr-2 flex items-center"><IconPlus /></span>
                    Create New Space
                </Button>
            </div>

            {/* Common Spaces Section (for students only) */}
            {isStudent && commonSpaces.length > 0 && (
                <div className="mb-12">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold tracking-tight mb-2">Common Spaces</h2>
                        <p className="text-muted-foreground text-sm">
                            Shared spaces created by teachers. You can view and use these spaces, but cannot edit them.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {commonSpaces.map((space) => (
                            <SpaceCard
                                key={space.id}
                                space={space}
                                onEnter={handleEnterSpace}
                                onDeleteClick={null} // Disable delete for common spaces
                                onRenameClick={null} // Disable rename for common spaces
                                isReadOnly={true}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Personal Spaces Section */}
            <div className={isStudent && commonSpaces.length > 0 ? "" : ""}>
                {isStudent && personalSpaces.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold tracking-tight mb-2">My Spaces</h2>
                        <p className="text-muted-foreground text-sm">
                            Your personal spaces where you can add, edit, and manage files.
                        </p>
                    </div>
                )}
                {personalSpaces.length === 0 && commonSpaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="text-muted-foreground mb-4">
                        <IconFolder /> 
                    </div>
                    <h3 className="text-lg font-semibold">No Space</h3>
                    <p className="text-muted-foreground text-sm mt-2 mb-6">
                        You haven't created any Space yet, click the button above to create one.
                    </p>
                </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {personalSpaces.map((space) => (
                        <SpaceCard
                            key={space.id}
                            space={space}
                            onEnter={handleEnterSpace}
                            onDeleteClick={openDeleteDialog}
                            onRenameClick={openRenameDialog}
                            onStatusClick={user?.role === 'teacher' ? openStatusDialog : null}
                            isReadOnly={false}
                        />
                    ))}
                    </div>
                )}
            </div>

            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Space</DialogTitle>
                        <DialogDescription>
                            Enter a new name for your space.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Space name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleRenameSubmit();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRenameSubmit}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the space
                            {selectedSpace && <strong> "{selectedSpace.name}" </strong>}
                            and all its contents.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteSubmit}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Space</DialogTitle>
                        <DialogDescription>
                            Enter a name for your new knowledge base space.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Space Name</label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newSpaceName}
                                onChange={(e) => setNewSpaceName(e.target.value)}
                                placeholder="Space name"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreateSubmit();
                                    }
                                }}
                            />
                        </div>
                        {user?.role === 'teacher' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Visibility</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={newSpaceStatus}
                                    onChange={(e) => setNewSpaceStatus(e.target.value)}
                                >
                                    <option value="private">Private (Only you)</option>
                                    <option value="public">Public (All students can view)</option>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    {newSpaceStatus === 'public' 
                                        ? 'This space will be visible to all students as a common space.'
                                        : 'This space will only be visible to you.'}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateSubmit} disabled={!newSpaceName.trim()}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Space Visibility</DialogTitle>
                        <DialogDescription>
                            Change the visibility of "{selectedSpace?.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Visibility</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <option value="private">Private (Only you)</option>
                                <option value="public">Public (All students can view)</option>
                            </select>
                            <p className="text-xs text-muted-foreground">
                                {newStatus === 'public' 
                                    ? 'This space will be visible to all students as a common space.'
                                    : 'This space will only be visible to you.'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleStatusSubmit} disabled={newStatus === selectedSpace?.status}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Home;