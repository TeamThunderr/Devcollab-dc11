import { GoogleGenerativeAI } from '@google/generative-ai'
import { env as config } from '../../config/env.js'

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY)

export const embeddingsService = {
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim() === '') {
      return []
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' })
      const result = await model.embedContent(text)
      return result.embedding.values
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      return []
    }
  },

  async generateTaskEmbedding(title: string, description?: string | null): Promise<number[]> {
    const text = `Title: ${title}\nDescription: ${description || 'N/A'}`
    return this.generateEmbedding(text)
  },

  async generateDocEmbedding(title: string, content: string): Promise<number[]> {
    const text = `Title: ${title}\nContent:\n${content}`
    return this.generateEmbedding(text)
  },

  async generateSnippetEmbedding(title: string, language: string, description?: string | null, code?: string): Promise<number[]> {
    const text = `Title: ${title}\nLanguage: ${language}\nDescription: ${description || 'N/A'}\nCode:\n${code || ''}`
    return this.generateEmbedding(text)
  }
}
