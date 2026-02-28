import QuestionList from '@/components/QuestionList';
import { useState, useEffect } from 'react';
import { useSpace } from '@/contexts/SpaceContext';
import { useUser } from '@/contexts/UserContext';
import FileList from "@/components/FileList"
import { useQuiz } from '@/contexts/QuizContext';
import { saveQuizAttempt, getQuizAttemptStats, getQuizAttemptHistory, editQuiz as editQuizApi } from '@/api/quiz';
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Loader2, Send, X, History, Trophy, Edit } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PracticeYourself from '@/components/PracticeYourself';

export default function Quiz() {
    const {
        currentSpace,
        currentFile,
        selectFile,
        deleteFile,
        renameFile,
        uploadFile
    } = useSpace();

    const { user } = useUser();
    const isTeacher = user?.role === 'teacher';
    const isStudent = user?.role === 'student';

    const { 
        quiz, 
        publishStatus,
        fetchQuiz, 
        generateQuiz,
        regenerateQuiz,
        publishQuiz,
        unpublishQuiz,
        loading: quizLoading 
    } = useQuiz();

    const [isEditing, setIsEditing] = useState(false);

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [fileToRename, setFileToRename] = useState(null);
    const [newName, setNewName] = useState("");
    const [fileToDelete, setFileToDelete] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [quizStats, setQuizStats] = useState(null);
    const [quizHistory, setQuizHistory] = useState([]);
    const [loadingStats, setLoadingStats] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (currentFile) {
            console.log('currentFile', currentFile);
            fetchQuiz(currentFile.id);
            // Load quiz stats and history for students
            if (isStudent) {
                loadQuizStats();
            }
        }
    }, [currentFile]);

    const loadQuizStats = async () => {
        if (!currentFile) return;
        setLoadingStats(true);
        try {
            const [statsResponse, historyResponse] = await Promise.all([
                getQuizAttemptStats(currentFile.id),
                getQuizAttemptHistory(currentFile.id)
            ]);
            if (statsResponse.success) {
                setQuizStats(statsResponse.data);
            }
            if (historyResponse.success) {
                setQuizHistory(historyResponse.data);
            }
        } catch (error) {
            console.error("Failed to load quiz stats", error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleQuizCompleted = async (score, totalQuestions) => {
        if (!currentFile || !isStudent) return;
        try {
            await saveQuizAttempt(currentFile.id, score, totalQuestions);
            // Reload stats after saving
            await loadQuizStats();
        } catch (error) {
            console.error("Failed to save quiz attempt", error);
        }
    };

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

    const handleGenerateQuiz = async () => {
        if (!currentFile) return;
        setIsGenerating(true);
        try {
            const storageKey = currentFile.url.replace(/^\/upload\//, '');;
            await generateQuiz(currentFile.id, storageKey);
        } catch (error) {
            console.error("Failed to generate quiz", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateQuiz = async () => {
        if (!currentFile || !allQuestionsAnswered) return;
        setIsGenerating(true);
        try {
            const storageKey = currentFile.url.replace(/^\/upload\//, '');;
            await regenerateQuiz(currentFile.id, storageKey);
        } catch (error) {
            console.error("Failed to regenerate quiz", error);
            alert('Failed to regenerate quiz. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAllQuestionsAnswered = (answered) => {
        setAllQuestionsAnswered(answered);
    };

    const handlePublishQuiz = async () => {
        if (!currentFile) return;
        setIsPublishing(true);
        try {
            await publishQuiz(currentFile.id);
        } catch (error) {
            console.error("Failed to publish quiz", error);
            alert(error.message || 'Failed to publish quiz. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUnpublishQuiz = async () => {
        if (!currentFile) return;
        setIsPublishing(true);
        try {
            await unpublishQuiz(currentFile.id);
        } catch (error) {
            console.error("Failed to unpublish quiz", error);
            alert(error.message || 'Failed to unpublish quiz. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleEditQuiz = async () => {
        if (!currentFile) return;
        if (!window.confirm('Regenerating the quiz will create a new version and unpublish it. All student score history will be preserved. You will need to republish after regenerating. Continue?')) {
            return;
        }
        setIsEditing(true);
        try {
            const storageKey = currentFile.url.replace(/^\/upload\//, '');
            const response = await editQuizApi(currentFile.id, storageKey);
            if (response.success) {
                // Refresh quiz to show new version
                await fetchQuiz(currentFile.id);
                alert('Quiz regenerated successfully! A new version has been created. Please republish to make it available to students.');
            }
        } catch (error) {
            console.error("Failed to regenerate quiz", error);
            alert(error.message || 'Failed to regenerate quiz. Please try again.');
        } finally {
            setIsEditing(false);
        }
    };

    if (!currentSpace) {
        return <div className="p-8 text-center text-muted-foreground">Loading space...</div>;
    }

    // For students, show tabs. For teachers, show the regular quiz interface.
    const renderQuizContent = () => (
        <div className="max-w-4xl mx-auto">
                    {!currentFile ? (
                        <div className="flex flex-col items-center justify-center mt-32 text-center space-y-4">
                            <div className="p-4 bg-muted rounded-full">
                                <span className="text-4xl">👈</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">No File Selected</h3>
                                <p className="text-muted-foreground mt-2">
                                    Please select a file from the sidebar to view or generate a quiz.
                                </p>
                            </div>
                        </div>
                    ) : quizLoading ? (
                        <div className="flex flex-col items-center justify-center mt-32 gap-4">
                            <Spinner className="h-8 w-8 text-primary" />
                            <p className="text-muted-foreground">Loading quiz...</p>
                        </div>
                    ) : quiz && quiz.length > 0 ? (
                        <div className="space-y-6">
                            {/* Publish/Unpublish/Edit buttons for teachers */}
                            {isTeacher && (
                                <div className="flex justify-end items-center gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        {publishStatus?.published ? (
                                            <>
                                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Published</span>
                                                <Button 
                                                    variant="outline"
                                                    onClick={handleEditQuiz}
                                                    disabled={isEditing || isPublishing}
                                                    className="min-w-[120px]"
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Regenerating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Regenerate Quiz
                                                        </>
                                                    )}
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    onClick={handleUnpublishQuiz}
                                                    disabled={isPublishing || isEditing}
                                                    className="min-w-[140px]"
                                                >
                                                    {isPublishing ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Unpublishing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="mr-2 h-4 w-4" />
                                                            Unpublish Quiz
                                                        </>
                                                    )}
                                                </Button>
                                            </>
                                        ) : (
                                            <Button 
                                                onClick={handlePublishQuiz}
                                                disabled={isPublishing || isEditing}
                                                className="min-w-[140px]"
                                            >
                                                {isPublishing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Publishing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Publish Quiz
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Quiz Stats and History for Students */}
                            {isStudent && quizStats && (
                                <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md mb-6 border border-border">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-foreground">Your Quiz Performance</h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                                                    <p className="text-2xl font-bold text-foreground">{quizStats.totalAttempts}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Retries</p>
                                                    <p className="text-2xl font-bold text-foreground">{quizStats.retryCount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Best Score</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {quizStats.bestScore !== null 
                                                            ? `${quizStats.bestScore}/${quizStats.totalQuestions} (${quizStats.bestPercentage}%)`
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowHistory(!showHistory)}
                                        >
                                            <History className="mr-2 h-4 w-4" />
                                            {showHistory ? 'Hide' : 'Show'} History
                                        </Button>
                                    </div>
                                    
                                    {showHistory && quizHistory.length > 0 && (
                                        <div className="mt-4 border-t border-border pt-4">
                                            <h4 className="font-semibold mb-3 text-foreground">Attempt History</h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {quizHistory.map((attempt, index) => (
                                                    <div key={attempt.id} className="flex justify-between items-center p-2 bg-muted rounded border border-border">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-medium text-foreground">Attempt #{attempt.attemptNumber}</span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(attempt.completedAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-foreground">
                                                                {attempt.score}/{attempt.totalQuestions}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground">
                                                                ({attempt.percentage}%)
                                                            </span>
                                                            {index === 0 && attempt.score === attempt.totalQuestions && (
                                                                <Trophy className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {showHistory && quizHistory.length === 0 && (
                                        <div className="mt-4 text-center text-muted-foreground text-sm">
                                            No previous attempts found.
                                        </div>
                                    )}
                                </div>
                            )}

                            <QuestionList 
                                questions={quiz} 
                                onAllQuestionsAnswered={handleAllQuestionsAnswered}
                                onRegenerate={isTeacher ? handleRegenerateQuiz : undefined}
                                onQuizCompleted={isStudent ? handleQuizCompleted : undefined}
                                fileId={currentFile?.id}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center mt-32 text-center space-y-6">
                            <div className="p-6 bg-primary/5 rounded-full">
                                <span className="text-4xl">📝</span>
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-xl font-semibold">No Quiz Available</h3>
                                <p className="text-muted-foreground mt-2">
                                    {isStudent ? (
                                        <>
                                            There is no published quiz available for <span className="font-medium text-foreground">{currentFile.title}</span> yet.
                                            Please wait for your teacher to publish a quiz.
                                        </>
                                    ) : (
                                        <>
                                            There is no quiz generated for <span className="font-medium text-foreground">{currentFile.title}</span> yet.
                                            Generate a quiz to test your knowledge!
                                        </>
                                    )}
                                </p>
                            </div>
                            {isTeacher && (
                                <Button 
                                    size="lg" 
                                    onClick={handleGenerateQuiz} 
                                    disabled={isGenerating}
                                    className="min-w-[160px]"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate Quiz"
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
    );

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

            <div className="flex-1 overflow-y-auto h-full p-8 bg-gray-50/50">
                {isStudent ? (
                    <Tabs defaultValue="test" className="h-full flex flex-col">
                        <div className="mb-4">
                            <TabsList>
                                <TabsTrigger value="test">Test Yourself</TabsTrigger>
                                <TabsTrigger value="practice">Practice</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="test" className="flex-1 overflow-y-auto">
                            {renderQuizContent()}
                        </TabsContent>
                        <TabsContent value="practice" className="flex-1">
                            <PracticeYourself />
                        </TabsContent>
                    </Tabs>
                ) : (
                    renderQuizContent()
                )}
            </div>

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