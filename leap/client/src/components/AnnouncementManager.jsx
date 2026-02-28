import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    MoreHorizontal, 
    Bell,
    Eye,
    EyeOff
} from 'lucide-react';
import { 
    getAnnouncements, 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement 
} from '@/api/announcement';
import { useUser } from '@/contexts/UserContext';
import { Spinner } from '@/components/ui/spinner';

export function AnnouncementManager() {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', is_published: true });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();

    // Only show for teachers
    if (user?.role !== 'teacher') {
        return null;
    }

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await getAnnouncements();
            if (response.success && response.data) {
                setAnnouncements(response.data);
            }
        } catch (err) {
            console.error('Failed to load announcements:', err);
            setError(err.message || 'Failed to load announcements');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClick = () => {
        setEditingAnnouncement(null);
        setFormData({ title: '', content: '', is_published: true });
        setIsDialogOpen(true);
    };

    const handleEditClick = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            is_published: announcement.is_published
        });
        setIsDialogOpen(true);
    };

    const handleDeleteClick = async (announcementId) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        try {
            await deleteAnnouncement(announcementId);
            await loadAnnouncements();
        } catch (err) {
            console.error('Failed to delete announcement:', err);
            alert(err.message || 'Failed to delete announcement');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Title and content are required');
            return;
        }

        try {
            setIsSubmitting(true);
            
            if (editingAnnouncement) {
                await updateAnnouncement(
                    editingAnnouncement.id,
                    formData.title,
                    formData.content,
                    formData.is_published
                );
            } else {
                await createAnnouncement(
                    formData.title,
                    formData.content,
                    formData.is_published
                );
            }

            setIsDialogOpen(false);
            setEditingAnnouncement(null);
            setFormData({ title: '', content: '', is_published: true });
            await loadAnnouncements();
        } catch (err) {
            console.error('Failed to save announcement:', err);
            alert(err.message || 'Failed to save announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Spinner />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle>Announcements</CardTitle>
                        </div>
                        <Button onClick={handleCreateClick} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Announcement
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}
                    
                    {announcements.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No announcements yet. Create your first announcement!</p>
                        </div>
                    ) : (
                        <ScrollArea className="max-h-[600px]">
                            <div className="space-y-3 pr-4">
                                {announcements.map((announcement) => (
                                    <Card key={announcement.id} className="bg-muted/50">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CardTitle className="text-base font-semibold">
                                                            {announcement.title}
                                                        </CardTitle>
                                                        {announcement.is_published ? (
                                                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                                <Eye className="h-3 w-3" />
                                                                Published
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                <EyeOff className="h-3 w-3" />
                                                                Draft
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(announcement.created_at)}
                                                        {announcement.updated_at !== announcement.created_at && (
                                                            <span> • Updated {formatDate(announcement.updated_at)}</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditClick(announcement)}>
                                                            <Edit2 className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDeleteClick(announcement.id)}
                                                            className="text-red-600 dark:text-red-400"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-foreground whitespace-pre-wrap">
                                                {announcement.content}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingAnnouncement 
                                ? 'Update the announcement details below.'
                                : 'Fill in the details to create a new announcement for students.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter announcement title"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Content *</Label>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Enter announcement content"
                                    rows={6}
                                    required
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_published"
                                    checked={formData.is_published}
                                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="is_published" className="text-sm font-normal cursor-pointer">
                                    Publish immediately (students will see this announcement)
                                </Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setEditingAnnouncement(null);
                                    setFormData({ title: '', content: '', is_published: true });
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Saving...
                                    </>
                                ) : (
                                    editingAnnouncement ? 'Update' : 'Create'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

