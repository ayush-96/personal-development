import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { getAnnouncements } from '@/api/announcement';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

const DISMISSED_ANNOUNCEMENTS_KEY = 'dismissed_announcements';

export function AnnouncementBar() {
    const [announcements, setAnnouncements] = useState([]);
    const [dismissedIds, setDismissedIds] = useState(new Set());
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useUser();

    // Only show for students
    if (user?.role !== 'student') {
        return null;
    }

    useEffect(() => {
        loadDismissedAnnouncements();
        loadAnnouncements();
    }, []);

    const loadDismissedAnnouncements = () => {
        try {
            const dismissed = JSON.parse(localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY) || '[]');
            setDismissedIds(new Set(dismissed));
        } catch (error) {
            console.error('Error loading dismissed announcements:', error);
            setDismissedIds(new Set());
        }
    };

    const saveDismissedAnnouncements = (dismissedSet) => {
        try {
            const dismissedArray = Array.from(dismissedSet);
            localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(dismissedArray));
            setDismissedIds(dismissedSet);
        } catch (error) {
            console.error('Error saving dismissed announcements:', error);
        }
    };

    const handleDismissAnnouncement = (announcementId) => {
        const newDismissedIds = new Set(dismissedIds);
        newDismissedIds.add(announcementId);
        saveDismissedAnnouncements(newDismissedIds);
    };

    const handleClearAll = () => {
        const allIds = announcements.map(a => a.id);
        const newDismissedIds = new Set([...dismissedIds, ...allIds]);
        saveDismissedAnnouncements(newDismissedIds);
    };

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

    // Filter out dismissed announcements
    const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

    if (isLoading) {
        return null; // Don't show anything while loading
    }

    if (error || visibleAnnouncements.length === 0) {
        return null; // Don't show bar if no announcements
    }

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

    return (
        <div className="w-full border-b bg-blue-50 dark:bg-blue-950/20">
            <div className="container mx-auto px-4 py-2">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            {!isExpanded ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        {visibleAnnouncements.length} new announcement{visibleAnnouncements.length !== 1 ? 's' : ''}
                                    </span>
                                    {visibleAnnouncements[0] && (
                                        <>
                                            <span className="text-sm text-blue-700 dark:text-blue-300 truncate">
                                                • {visibleAnnouncements[0].title}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                                                onClick={() => handleDismissAnnouncement(visibleAnnouncements[0].id)}
                                                title="Dismiss this announcement"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <ScrollArea className="max-h-[400px] w-full">
                                    <div className="space-y-3 pr-4">
                                        {visibleAnnouncements.map((announcement) => (
                                            <Card key={announcement.id} className="bg-white dark:bg-gray-800 relative">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <CardTitle className="text-base font-semibold pr-6">
                                                            {announcement.title}
                                                        </CardTitle>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                {formatDate(announcement.created_at)}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                                onClick={() => handleDismissAnnouncement(announcement.id)}
                                                                title="Dismiss announcement"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                        {announcement.content}
                                                    </p>
                                                    {announcement.created_by_email && (
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            By {announcement.created_by_email}
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isExpanded && visibleAnnouncements.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAll}
                                className="h-8 px-2 text-xs"
                                title="Dismiss all announcements"
                            >
                                Clear All
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-8 px-2"
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

