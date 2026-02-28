import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { AIChatWidget } from '@/components/chat/AIChatWidget';
import { useSpace } from '@/contexts/SpaceContext';
import FileList from "@/components/FileList"
import { PDFViewer } from "@/components/PDFViewer";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";


export default function ChatPage() {
    const {
        currentSpace,
        currentFile,
        selectFile,
        deleteFile,
        renameFile,
        uploadFile
    } = useSpace();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [fileToRename, setFileToRename] = useState(null);
    const [newName, setNewName] = useState("");
    const [fileToDelete, setFileToDelete] = useState(null);
    const { spaceId } = useParams();

    const handleRenameClick = (file) => {
        setFileToRename(file);
        setNewName(file.title);
    };

    const handleRenameSubmit = async (e) => {
        e.preventDefault();
        if (fileToRename && newName.trim() && newName !== fileToRename.title) {
            await renameFile(fileToRename.id, newName);
        }
        setFileToRename(null);
        setNewName("");
    };

    const handleDeleteConfirm = async () => {
        if (fileToDelete) {
            try {
                await deleteFile(fileToDelete.id);
                setFileToDelete(null);
            } catch (error) {
                console.error("Delete failed:", error);
                alert(error.message || 'Failed to delete file. Please try again.');
            }
        }
    };

    if (!currentSpace) {
        return <div className="p-8 text-center text-muted-foreground">Loading space...</div>;
    }

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="flex-none h-full transition-all duration-300 ease-in-out" style={{ width: isCollapsed ? '2.5rem' : '15rem' }}>
                <FileList
                    files={currentSpace.files}
                    currentFile={currentFile}
                    isCollapsed={isCollapsed}
                    toggleCollapse={() => setIsCollapsed(!isCollapsed)}
                    onSelectFile={selectFile}
                    onRenameClick={handleRenameClick}
                    onDeleteClick={setFileToDelete}
                    onUpload={uploadFile}
                    canEdit={currentSpace.canEdit !== false}
                />
            </div>

            <main className="flex-1 h-full min-w-0 transition-all duration-300 ease-in-out">
                <div className="flex h-full p-4 gap-4">

                    <ScrollArea className="w-1/2 h-full rounded-md border">
                        <PDFViewer fileUrl={ currentFile && currentFile.url ? currentFile.url : null } />
                    </ScrollArea>

                    <AIChatWidget spaceId={spaceId} className="flex-1 h-full w-full" />
                </div>
            </main>

            <Dialog open={!!fileToRename} onOpenChange={(open) => !open && setFileToRename(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Rename File</DialogTitle>
                        <DialogDescription>
                            Enter a new name for the file.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRenameSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="col-span-3"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setFileToRename(null)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete File</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-semibold">{fileToDelete?.title}</span>? This action cannot be undone and will also remove the file from the RAGFlow dataset along with all associated chunks.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFileToDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}