// filepath: /c:/Users/Artsy/OneDrive/Documents/mini_project_1/chatbot.js
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: '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', // Replace with your OpenAI API key
});
const openai = new OpenAIApi(configuration);

async function sendMessageToOpenAI(message) {
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: message,
        max_tokens: 150,
    });
    return response.data.choices[0].text.trim();
}

module.exports = { sendMessageToOpenAI };