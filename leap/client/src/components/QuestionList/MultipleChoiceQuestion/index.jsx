import { useState } from 'react';

const MultipleChoiceQuestion = ({ question, options, correctAnswer, answerReference, onAnswered }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOptionSelect = (option) => {
    if (!isSubmitted) {
      setSelectedOption(option);
    }
  };

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setIsSubmitted(true);
      if (onAnswered) {
        onAnswered(selectedOption === correctAnswer);
      }
    }
  };

  // Letters for option labels
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="w-full p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-base font-semibold mb-3 text-gray-800">{question}</h2>
      
      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={index}
            className="border-0 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
            onClick={() => handleOptionSelect(option)}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 w-4 h-4 mr-3 rounded-full border border-gray-400 flex items-center justify-center">
                {selectedOption === option && (
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                )}
              </div>
              <span className="font-medium mr-2 text-gray-700">{optionLetters[index]})</span>
              <span className="text-gray-700">{option}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Feedback paragraph - hidden until submitted rounded-lg border-l-4 border-l-green-500*/}
      {isSubmitted && (
        <div className="mt-4">
          <p className="font-medium text-lg">
            {selectedOption === correctAnswer ? (
              <span className="text-green-600 font-bold">Correct!</span>
            ) : (
              <span className="text-red-600 font-bold">Incorrect!</span>
            )}
          </p>
          <p className="mt-2 text-gray-700 italic">
            {answerReference || "This is a correct answer."}
          </p>
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        <button
          className={`w-32 h-10 px-6 py-2 rounded-md ${
            selectedOption === null
              ? 'bg-gray-300 cursor-not-allowed'
              : isSubmitted
              ? 'bg-gray-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          onClick={handleSubmit}
          disabled={selectedOption === null || isSubmitted}
        >
          {isSubmitted ? 'Submitted' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default MultipleChoiceQuestion; 