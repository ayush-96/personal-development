import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SpaceCard = ({ space, onEnter, onDeleteClick, onRenameClick, onStatusClick, isReadOnly = false }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Card 
            className="flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer group border-muted relative w-full min-w-[250px] max-w-[320px] mx-auto"
            onClick={() => onEnter(space.id)}
        >
            <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-start justify-between space-y-0">
                <div className="flex-1 min-w-0 pr-2">
                    <CardTitle className="text-xl font-semibold truncate leading-tight" title={space.name}>
                        {space.name}
                    </CardTitle>
                </div>
                
                {!isReadOnly && (onDeleteClick || onRenameClick) && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {onRenameClick && (
                                    <DropdownMenuItem
                                        onClick={() => onRenameClick(space)}
                                    >
                                        Rename
                                    </DropdownMenuItem>
                                )}
                                {onStatusClick && (
                                    <DropdownMenuItem
                                        onClick={() => onStatusClick(space)}
                                    >
                                        Change Visibility
                                    </DropdownMenuItem>
                                )}
                                {onDeleteClick && (
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        onClick={() => onDeleteClick(space)}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                {isReadOnly && (
                    <Badge variant="outline" className="text-xs">
                        Read Only
                    </Badge>
                )}
            </CardHeader>
            
            <CardContent className="flex-1 py-0">
            </CardContent>

            <CardFooter className="pt-2 pb-4 px-5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDate(space.updatedAt)}</span>
                    <span>-</span>
                    <span>{space.filesCount || (space.files ? space.files.length : 0)} Sources</span>
                </div>
                <Badge 
                    variant={space.status === 'private' ? 'secondary' : 'outline'} 
                    className="capitalize text-xs font-normal"
                >
                    {space.status}
                </Badge>
            </CardFooter>
        </Card>
    );
};

export default SpaceCard;