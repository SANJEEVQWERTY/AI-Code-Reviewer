const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

async function getResponse(code) {
    try {
        console.log('Received code for review:', code);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert code reviewer. Your task is to analyze the provided code and provide a detailed review in the following format:

# Code Review

## Code Quality
- [Your assessment of code quality]

## Issues Found
- [List of issues found in the code]

## Suggestions
- [List of improvement suggestions]

## Best Practices
- [List of best practices to follow]

Please review this code:
\`\`\`
${code}
\`\`\`

Please provide a detailed and constructive review. Focus on:
1. Code structure and organization
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Best practices and improvements
6. code is given c++, java, python, and javascript
7. link provide for learn about the problem
8. generated output is given main point highlighted
9. you give our code is running on online compiler correctly
10. give best time complexity and space complexity

Keep the response professional and helpful.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('AI Response:', text);
        return text;
    } catch (error) {
        console.error('AI service error:', error);
        return `# Code Review\n\n## Error\n- Unable to generate review at this time. Please try again later.\n\n## Code Quality\n- Unable to assess due to error\n\n## Issues Found\n- Unable to identify issues due to error\n\n## Suggestions\n- Please try again later\n\n## Best Practices\n- Unable to provide suggestions due to error`;
    }
}

module.exports = getResponse;