import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploadDialog } from "./FileUploadDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
    FileText, 
    MoreHorizontal, 
    Trash2, 
    Edit2,
    PanelLeftClose,
    PanelLeftOpen,
    Plus
} from 'lucide-react';
import { Spinner } from "@/components/ui/spinner"; 

const FileList = ({ 
    files = [], 
    currentFile, 
    onCollapseChange, 
    onSelectFile, 
    onRenameClick, 
    onDeleteClick,
    onUpload,
    canEdit = true
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    useEffect(() => {
        if (onCollapseChange) {
            onCollapseChange(isCollapsed);
        }
    }, [isCollapsed, onCollapseChange]);

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    return (
        <div 
            className={cn(
                "fixed top-16 left-0 bottom-0 z-30 flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
                isCollapsed ? "w-14" : "w-64"
            )}
        >
            {/* Header */}
            <div className={cn(
                "flex h-14 items-center border-b px-3",
                isCollapsed ? "justify-center" : "justify-between"
            )}>
                {!isCollapsed && (
                    <span className="font-semibold text-sm truncate animate-in fade-in duration-300">
                        Sources
                    </span>
                )}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={toggleCollapse}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
            </div>

            {canEdit && (
                <div className={cn("px-2 py-2", isCollapsed && "flex justify-center")}>
                    <Button
                        variant="outline"
                        size={isCollapsed ? "icon" : "default"}
                        className={cn(
                            "rounded-full border-dashed border-primary/50 hover:border-primary hover:bg-primary/5",
                            isCollapsed ? "h-9 w-9" : "w-full justify-start gap-2"
                        )}
                        onClick={() => setIsUploadOpen(true)}
                        title="Upload File"
                    >
                        <Plus className="h-4 w-4" />
                        {!isCollapsed && <span>Upload File</span>}
                    </Button>
                </div>
            )}
            {!canEdit && !isCollapsed && (
                <div className="px-2 py-2">
                    <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded-md">
                        This is a read-only space. Only the teacher owner can make changes.
                    </div>
                </div>
            )}

            <ScrollArea className="flex-1">
                <div className="p-2 gap-1 flex flex-col">
                    <TooltipProvider>
                        {files.map((file) => {
                            const isProcessing = file.status && file.status !== 'ready';

                            const FileItemContent = (
                                <div 
                                    className={cn(
                                        "group relative flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                                        currentFile?.id === file.id && "bg-accent text-accent-foreground",
                                        isCollapsed ? "justify-center px-0 h-9 w-9 mx-auto" : "justify-between"
                                    )}
                                    onClick={() => onSelectFile(file.id)}
                                >
                                    <div className={cn("flex items-center gap-2 overflow-hidden flex-1", isCollapsed && "justify-center w-full")}>
                                        {/* Delete button on left */}
                                        {!isCollapsed && canEdit && onDeleteClick && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteClick(file);
                                                }}
                                                title="Delete file"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        
                                        {/* Icon Section */}
                                        {isProcessing ? (
                                            <div className="size-4 shrink-0 flex items-center justify-center">
                                                <Spinner className="text-primary" />
                                            </div>
                                        ) : (
                                            <FileText className="size-4 shrink-0 text-muted-foreground" />
                                        )}
                                        
                                        {!isCollapsed && (
                                            <span className="truncate">{file.title}</span>
                                        )}
                                    </div>

                                    {!isCollapsed && canEdit && onRenameClick && (
                                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="More options"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRenameClick(file);
                                                    }}>
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        Rename
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    )}
                                </div>
                            );

                            if (isCollapsed) {
                                return (
                                    <Tooltip key={file.id} delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            {FileItemContent}
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={10}>
                                            <p>{file.title}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return <React.Fragment key={file.id}>{FileItemContent}</React.Fragment>;
                        })}
                    </TooltipProvider>
                    
                    {files.length === 0 && !isCollapsed && (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                            No files in this space.
                        </div>
                    )}
                </div>
            </ScrollArea>

            <FileUploadDialog 
                open={isUploadOpen} 
                onOpenChange={setIsUploadOpen} 
                onUpload={onUpload} 
            />
        </div>
    );
};

export default FileList;
