const OpenAI = require("openai");
const fs = require('fs');
const path = require('path');
const { log } = require("console");
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// generate quiz from file
// process:
// 1. generate flashcards from file
// 2. generate question from flashcard content
// 3. generate answer from question and flashcard content
// 4. generate incorrect answers from correct choice, question and flashcard content
// 5. assemble question object
// 6. return questions


// shuffle array
function shuffleArray(arr) {
    const array = [...arr]; // copy the array
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // random index between 0 and i
      [array[i], array[j]] = [array[j], array[i]]; // swap elements
    }
    return array;
}

// generate flashcards from file
async function flashCardGenerator(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        throw new Error(`Error reading file: ${error}`);
    }
    const prompt = `
        Please read the entire given content and generate as many flashcards as possible.
        Instructions:
        1.Flashcard Front: A simple, clear, and memorable topic.
        2.Flashcard Back: A piece of given content (a relevant excerpt, explanation, or guideline) that covers or explains the topic on the front.
        3.Focus on all major sections and important details of the given content. Ensure that each flashcard has a concise overview on the front and a detailed, accurate, unedited explanation on the back.

        Output Examples:
        {"flashcards": [{"topic": GeneratedTopic,"content": GeneratedContent},{"topic": GeneratedTopic,"content": GeneratedContent},...]}

        Content:${content}`;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_KEY,
    });

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: prompt }
            ]
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        throw new Error(`Error calling OpenAI API: ${error}`);
    }
}

// generate question from content
async function questionGenerator(content, difficulty = 'Hard') {
    const prompt = `
        You are an AI assistant that generates **only** a question (no answers) that can be answered from the given content and is suitable for a multiple-choice format.
        Instructions:
        1. Generate a single question that:
        - Directly relates to the content
        - Can be answered by information in the content
        - Is phrased in a manner suitable for a multiple-choice question
        2. Make sure the question difficulty matches the questionDifficulty parameter:
        -"Easy": straightforward factual recall
        -"Medium": some interpretation or context
        -"Hard": deeper analysis or inference
        3. Do NOT include any references to external documents, guidelines, or the given content in the question itself.

        Output Format:
        {"question": GeneratedQuestion}

        Content: ${content}
        QuestionDifficulty: ${difficulty}`;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_KEY,
    });

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: prompt }
            ]
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        throw new Error(`Error calling OpenAI API: ${error}`);
    }
}

// generate answer from question and content
async function answerGenerator(question, content, difficulty = 'Hard') {
    const prompt = `
        You are an AI assistant that generates **only the correct answer** to a given question, based on the given content.
        Instructions:
        1. Read the question and the content carefully.
        2. Produce a single correct answer suitable for a multiple-choice quiz.
        3. Produce a answer reference that is directly related to the generated answer. The answer reference is coming from the given content.
        4. Make sure the output difficulty matches the difficulty parameter:
        -"Easy": straightforward factual recall
        -"Medium": some interpretation or context
        -"Hard": deeper analysis or inference

        Output Format:
        {"choice": GeneratedChoice, "reference": GeneratedReference}

        Question: ${question}
        Content: ${content}
        QuestionDifficulty: ${difficulty}`;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_KEY,
    });

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: prompt }
            ]
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        throw new Error(`Error calling OpenAI API: ${error}`);
    }
}

// generate incorrect answers from correct choice, question and content
async function incorrectAnswerGenerator(correctChoice, question, content, difficulty = 'Hard') {
    const prompt = `
        You are an AI assistant that generates exactly three incorrect distractor options for a multiple-choice question.
        Instructions:
        1. Carefully read the given question, content and correct choice.
        2. Based on the question, content and correct choice, produce three *incorrect* choices only (no correct answer).
        3. Make sure the output difficulty matches the difficulty parameter:
        -"Easy": straightforward factual recall
        -"Medium": some interpretation or context
        -"Hard": deeper analysis or inference

        Output Format:
        {"choices": [GeneratedChoice-1, GeneratedChoice-2, GeneratedChoice-3]}

        CorrectChoice: ${correctChoice}
        Question: ${question}
        Content: ${content}
        QuestionDifficulty: ${difficulty}`;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_KEY,
    });

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: prompt }
            ]
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        throw new Error(`Error calling OpenAI API: ${error}`);
    }
}

// Combined function: Generate question, answer, and incorrect answers in ONE API call (much faster)
async function generateCompleteQuestion(content, difficulty = 'Hard') {
    const prompt = `
        You are an AI assistant that generates a complete multiple-choice question from given content.
        Instructions:
        1. Generate a single question that:
        - Directly relates to the content
        - Can be answered by information in the content
        - Is phrased in a manner suitable for a multiple-choice question
        2. Generate ONE correct answer choice suitable for a multiple-choice quiz.
        3. Generate exactly THREE incorrect distractor options.
        4. Generate an answer reference that is directly related to the correct answer and comes from the given content.
        5. Make sure the difficulty matches the difficulty parameter:
        -"Easy": straightforward factual recall
        -"Medium": some interpretation or context
        -"Hard": deeper analysis or inference
        6. Do NOT include any references to external documents, guidelines, or the given content in the question itself.

        Output Format:
        {
            "question": "Generated question text",
            "choice": "Correct answer choice",
            "choices": ["Incorrect choice 1", "Incorrect choice 2", "Incorrect choice 3"],
            "reference": "Answer reference from content"
        }

        Content: ${content}
        QuestionDifficulty: ${difficulty}`;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_KEY,
    });

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: prompt }
            ],
            temperature: 0.7
        });
        const result = JSON.parse(completion.choices[0].message.content);
        return {
            question: result.question,
            choice: result.choice,
            reference: result.reference,
            choices: result.choices
        };
    } catch (error) {
        throw new Error(`Error calling OpenAI API: ${error}`);
    }
}

//let filePath = path.resolve(__dirname, '../files/pgr.md');

// async function generateQuiz(filePath) {
//     try {
//         const questions = [];
//         const { flashcards } = await flashCardGenerator(filePath);

//         await Promise.all(flashcards.map(async (element) => {

//             const { question } = await questionGenerator(element.content);

//             const { choice, reference } = await answerGenerator(question, element.content);

//             const { choices } = await incorrectAnswerGenerator(choice, question, element.content);

//             // assemble question object
//             questions.push({
//                 question: question,
//                 options: shuffleArray([choice, ...choices]), // shuffle options
//                 correctAnswer: choice,
//                 answerReference: reference,
//             });
//         }));

//         return { flashcards, questions };
//     } catch (error) {
//         throw new Error(`Error generating quiz: ${error}`);
//     }
// }

// generateQuiz(filePath)
//     .then(response => {
//         const {flashcards, questions} = response;
//         console.log('Flashcards:', flashcards);
//         console.log('------------------------------------------------------------------------');
//         console.log('Questions:', questions);
//     })
//     .catch(err => {
//         console.error('Error:', err);
//     });

module.exports = {flashCardGenerator, questionGenerator, answerGenerator, incorrectAnswerGenerator, generateCompleteQuestion, shuffleArray};