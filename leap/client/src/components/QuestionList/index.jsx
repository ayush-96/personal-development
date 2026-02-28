import { useState, useEffect } from 'react';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const QuestionList = ({ questions, onAllQuestionsAnswered, onRegenerate, onQuizCompleted, onRestart, fileId }) => {
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const handleQuestionAnswered = (questionIndex, isCorrect) => {
    // Mark this question as answered
    if (!answeredQuestions.includes(questionIndex)) {
      const newAnsweredQuestions = [...answeredQuestions, questionIndex];
      const newScore = isCorrect ? score + 1 : score;
      
      setAnsweredQuestions(newAnsweredQuestions);
      setScore(newScore);

      // Check if all questions are answered
      if (newAnsweredQuestions.length === questions.length) {
        setQuizCompleted(true);
        // Notify parent that all questions are answered
        if (onAllQuestionsAnswered) {
          onAllQuestionsAnswered(true);
        }
        // Save score if callback provided and not already saved
        // For practice quizzes, fileId will be "practice" (truthy), for regular quizzes it's the actual fileId
        if (onQuizCompleted && !scoreSaved && fileId) {
          onQuizCompleted(newScore, questions.length);
          setScoreSaved(true);
        }
      }
    }
  };

  const restartQuiz = () => {
    setAnsweredQuestions([]);
    setScore(0);
    setQuizCompleted(false);
    setScoreSaved(false);
    if (onAllQuestionsAnswered) {
      onAllQuestionsAnswered(false);
    }
    // Call parent's restart handler if provided (for practice quizzes)
    if (onRestart) {
      onRestart();
    }
  };

  // Reset answered state when questions change (new quiz generated)
  useEffect(() => {
    setAnsweredQuestions([]);
    setScore(0);
    setQuizCompleted(false);
    setScoreSaved(false);
    if (onAllQuestionsAnswered) {
      onAllQuestionsAnswered(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]);

  return (
    <div className="space-y-8">
      {/* Question counter */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500">
          Answered: {answeredQuestions.length} of {questions.length}
        </span>
        <span className="text-sm font-medium text-gray-500">
          Score: {score} / {questions.length}
        </span>
      </div>

      {/* All questions displayed vertically */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={index} className="w-full">
            <MultipleChoiceQuestion
              question={`${index + 1}. ${question.question}`}
              options={question.options}
              correctAnswer={question.correctAnswer}
              answerReference={question.answerReference}
              onAnswered={(isCorrect) => handleQuestionAnswered(index, isCorrect)}
            />
          </div>
        ))}
      </div>
      
      {/* Quiz completion message */}
      {quizCompleted && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center mt-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Quiz Completed!</h2>
          <p className="text-xl mb-6 text-gray-700">Your score: {score} out of {questions.length}</p>
          <p className="text-lg mb-8 text-gray-700">
            {score === questions.length 
              ? "Perfect score! Excellent job!" 
              : score >= questions.length / 2 
                ? "Good job! You passed the quiz." 
                : "Keep practicing. You'll do better next time!"}
          </p>
          <button
            onClick={restartQuiz}
            className="w-32 h-10 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Restart
          </button>
        </div>
      )}

      {/* Regenerate Quiz Button - Only shown when all questions are answered */}
      {quizCompleted && onRegenerate && (
        <div className="mt-8 flex justify-center pb-8">
          <Button
            onClick={onRegenerate}
            size="lg"
            className="min-w-[200px]"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Regenerate Quiz
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionList; 