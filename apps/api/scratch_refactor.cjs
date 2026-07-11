const fs = require('fs');
let content = fs.readFileSync('src/modules/ai/ai.service.ts', 'utf8');

if (!content.includes('getAITools')) {
  content = content.replace("import type { ChatInput } from './ai.schema.js'", "import type { ChatInput } from './ai.schema.js'\nimport { getAITools, getAIToolHandlers } from './ai.tools.js'");
}

const toolsRegex1 = /    const tools: any = \[\s*\{\s*functionDeclarations: \[\s*\{\s*name: 'createTask'[\s\S]*?    const startTime = Date\.now\(\)\n    const \{ text: replyText/m;
content = content.replace(toolsRegex1, `    const tools = getAITools()
    const toolHandlers = getAIToolHandlers(data as ChatInput, userId)

    const startTime = Date.now()
    const { text: replyText`);

const toolsRegex2 = /    const tools: any = \[\s*\{\s*functionDeclarations: \[\s*\{\s*name: 'createTask'[\s\S]*?    const startTime = Date\.now\(\)\n    const stream = generateAIResponseStream/m;
content = content.replace(toolsRegex2, `    const tools = getAITools()
    const toolHandlers = getAIToolHandlers(data as ChatInput, userId)

    const startTime = Date.now()
    const stream = generateAIResponseStream`);

fs.writeFileSync('src/modules/ai/ai.service.ts', content, 'utf8');
