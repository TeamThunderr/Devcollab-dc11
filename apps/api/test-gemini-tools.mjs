import 'dotenv/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env } from './src/config/env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: env.GEMINI_MODEL,
  tools: [
    {
      functionDeclarations: [
        {
          name: 'createCodeSnippet',
          description: 'Create a new reusable code snippet in a project.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              projectId: { type: SchemaType.INTEGER, description: 'The ID of the project.' },
              title: { type: SchemaType.STRING, description: 'The title of the snippet.' },
              description: { type: SchemaType.STRING, description: 'Optional description of the snippet.' },
              language: { type: SchemaType.STRING, description: 'The programming language of the snippet (e.g., typescript, python).' },
              code: { type: SchemaType.STRING, description: 'The actual code content.' },
            },
            required: ['projectId', 'title', 'language', 'code'],
          },
        },
        {
          name: 'createTaskComment',
          description: 'Add a comment to an existing task.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              taskId: { type: SchemaType.INTEGER, description: 'The ID of the task to comment on.' },
              content: { type: SchemaType.STRING, description: 'The markdown content of the comment.' },
            },
            required: ['taskId', 'content'],
          },
        }
      ]
    }
  ]
});

async function run() {
  try {
    const chat = model.startChat();
    const res = await chat.sendMessage("Create a task comment with taskId 1 and content 'test'.");
    console.log(res.response.text());
  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
