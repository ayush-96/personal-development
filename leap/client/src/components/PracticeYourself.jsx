import { useState, useEffect } from 'react';
import { useSpace } from '@/contexts/SpaceContext';
import QuestionList from './QuestionList';
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Loader2, RotateCcw, History, Trophy } from "lucide-react";
import { generateEphemeralQuiz } from '@/api/quiz';

const STORAGE_KEY_PREFIX = 'practice_quiz_';

export default function PracticeYourself() {
    const {
        currentSpace,
        currentFile,
        selectFile
    } = useSpace();

    const [isGenerating, setIsGenerating] = useState(false);
    const [quiz, setQuiz] = useState([]);
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [practiceHistory, setPracticeHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [currentScore, setCurrentScore] = useState(null);
    const [restartKey, setRestartKey] = useState(0); // Key to force remount questions on restart

    // Load practice history from localStorage on mount
    useEffect(() => {
        loadPracticeHistory();
    }, []);

    const loadPracticeHistory = () => {
        try {
            const history = JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}history`) || '[]');
            setPracticeHistory(history);
        } catch (error) {
            console.error('Error loading practice history:', error);
            setPracticeHistory([]);
        }
    };

    const savePracticeAttempt = (score, totalQuestions, fileName) => {
        try {
            const attempt = {
                id: Date.now(),
                fileName: fileName || currentFile?.title || 'Unknown',
                score,
                totalQuestions,
                percentage: ((score / totalQuestions) * 100).toFixed(1),
                completedAt: new Date().toISOString(),
            };

            const history = JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}history`) || '[]');
            history.unshift(attempt); // Add to beginning
            
            // Keep only last 50 attempts
            const limitedHistory = history.slice(0, 50);
            localStorage.setItem(`${STORAGE_KEY_PREFIX}history`, JSON.stringify(limitedHistory));
            setPracticeHistory(limitedHistory);
        } catch (error) {
            console.error('Error saving practice attempt:', error);
        }
    };

    const handleGenerateQuiz = async () => {
        if (!currentFile) return;

        setIsGenerating(true);
        setQuiz([]);
        setAllQuestionsAnswered(false);
        setCurrentScore(null);
        setRestartKey(prev => prev + 1); // Increment key to force remount

        try {
            const storageKey = currentFile.url.replace(/^\/upload\//, '');
            const response = await generateEphemeralQuiz(currentFile.id, storageKey);
            if (response.success && response.data) {
                setQuiz(response.data);
            } else {
                throw new Error(response.message || 'Failed to generate quiz');
            }
        } catch (error) {
            console.error("Failed to generate practice quiz", error);
            alert(error.message || 'Failed to generate quiz. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRestartQuiz = () => {
        setAllQuestionsAnswered(false);
        setCurrentScore(null);
        setRestartKey(prev => prev + 1); // Increment key to force remount questions
    };

    const handleRegenerateQuiz = async () => {
        if (!currentFile || !allQuestionsAnswered) return;
        await handleGenerateQuiz();
    };

    const handleQuizCompleted = (score, totalQuestions) => {
        setCurrentScore({ score, totalQuestions });
        savePracticeAttempt(score, totalQuestions, currentFile?.title);
    };

    const handleAllQuestionsAnswered = (answered) => {
        setAllQuestionsAnswered(answered);
    };

    const getPracticeStats = () => {
        if (practiceHistory.length === 0) {
            return {
                totalAttempts: 0,
                bestScore: null,
                bestPercentage: null,
                averageScore: null,
            };
        }

        const scores = practiceHistory.map(h => h.score);
        const totals = practiceHistory.map(h => h.totalQuestions);
        const bestAttempt = practiceHistory.reduce((best, current) => {
            const bestPercentage = (best.score / best.totalQuestions) * 100;
            const currentPercentage = (current.score / current.totalQuestions) * 100;
            return currentPercentage > bestPercentage ? current : best;
        });

        const totalScore = scores.reduce((sum, score, idx) => sum + (score / totals[idx]), 0);
        const averagePercentage = (totalScore / practiceHistory.length) * 100;

        return {
            totalAttempts: practiceHistory.length,
            bestScore: bestAttempt.score,
            bestTotal: bestAttempt.totalQuestions,
            bestPercentage: bestAttempt.percentage,
            averageScore: averagePercentage.toFixed(1),
        };
    };

    const stats = getPracticeStats();

    if (!currentSpace) {
        return <div className="p-8 text-center text-muted-foreground">Loading space...</div>;
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header with Stats */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Practice</h2>
                            <p className="text-muted-foreground text-sm">
                                Select a file from the sidebar to generate a practice quiz. Your attempts won't be saved to the database.
                            </p>
                        </div>
                        {practiceHistory.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                <History className="mr-2 h-4 w-4" />
                                {showHistory ? 'Hide' : 'Show'} History
                            </Button>
                        )}
                    </div>

                    {/* Practice Stats */}
                    {practiceHistory.length > 0 && (
                        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">Your Practice Stats</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.totalAttempts}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Best Score</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {stats.bestScore !== null 
                                            ? `${stats.bestScore}/${stats.bestTotal} (${stats.bestPercentage}%)`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Average Score</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {stats.averageScore !== null ? `${stats.averageScore}%` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Current File</p>
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {currentFile?.title || 'None'}
                                    </p>
                                </div>
                            </div>

                            {showHistory && practiceHistory.length > 0 && (
                                <div className="mt-4 border-t border-border pt-4">
                                    <h4 className="font-semibold mb-3 text-foreground">Recent Attempts</h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {practiceHistory.map((attempt) => (
                                            <div key={attempt.id} className="flex justify-between items-center p-2 bg-muted rounded border border-border">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-foreground">{attempt.fileName}</span>
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
                                                    {attempt.score === attempt.totalQuestions && (
                                                        <Trophy className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No File Selected */}
                    {!currentFile && !isGenerating && quiz.length === 0 && (
                        <div className="flex flex-col items-center justify-center mt-32 text-center space-y-6">
                            <div className="p-6 bg-primary/5 rounded-full">
                                <span className="text-4xl">👈</span>
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-xl font-semibold">No File Selected</h3>
                                <p className="text-muted-foreground mt-2">
                                    Please select a file from the sidebar to generate a practice quiz. Practice quizzes are ephemeral and won't be saved to the database.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* File Selected but No Quiz */}
                    {currentFile && !isGenerating && quiz.length === 0 && (
                        <div className="flex flex-col items-center justify-center mt-32 text-center space-y-6">
                            <div className="p-6 bg-primary/5 rounded-full">
                                <span className="text-4xl">📝</span>
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-xl font-semibold">Ready to Practice</h3>
                                <p className="text-muted-foreground mt-2">
                                    Generate a practice quiz from <span className="font-medium text-foreground">{currentFile.title}</span>. Practice quizzes are ephemeral and won't be saved to the database.
                                </p>
                            </div>
                            <Button
                                size="lg"
                                onClick={handleGenerateQuiz}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Generate Practice Quiz"
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Loading State */}
                    {isGenerating && (
                        <div className="flex flex-col items-center justify-center mt-32 gap-4">
                            <Spinner className="h-8 w-8 text-primary" />
                            <p className="text-muted-foreground">Generating practice quiz...</p>
                        </div>
                    )}

                    {/* Quiz Display */}
                    {!isGenerating && quiz.length > 0 && (
                        <div className="space-y-6">
                            <QuestionList
                                key={restartKey}
                                questions={quiz}
                                onAllQuestionsAnswered={handleAllQuestionsAnswered}
                                onRegenerate={handleRegenerateQuiz}
                                onQuizCompleted={handleQuizCompleted}
                                onRestart={handleRestartQuiz}
                                fileId="practice" // Use a truthy value so onQuizCompleted is called
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
