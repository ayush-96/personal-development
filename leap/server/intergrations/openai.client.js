require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

/* Create a chat completion with OpenAI */
async function createChatCompletion({ model, messages, temperature = 0.2, maxTokens = null }) {
    const finalModel = model || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o';

    const response = await client.chat.completions.create({
        model: finalModel,
        messages,
        temperature,
        max_tokens: maxTokens || undefined,
    });

    const choice = response.choices && response.choices[0];
    const content = choice?.message?.content || '';

    const usage = response.usage || {};
    const promptTokens = usage.prompt_tokens || null;
    const completionTokens = usage.completion_tokens || null;
    const totalTokens = usage.total_tokens || null;

    return {
        content,
        model: finalModel,
        usage: {
            promptTokens,
            completionTokens,
            totalTokens,
        },
        raw: response,
    };
}

module.exports = {
    createChatCompletion,
};