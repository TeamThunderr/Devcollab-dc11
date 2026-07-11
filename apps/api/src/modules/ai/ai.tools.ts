import { SchemaType } from '@google/generative-ai'
import { tasksService } from '../tasks/tasks.service.js'
import { docsService } from '../docs/docs.service.js'
import { snippetsService } from '../snippets/snippets.service.js'
import type { ChatInput } from './ai.schema.js'

export function getAITools(): any {
  return [
    {
      functionDeclarations: [
        {
          name: 'createTask',
          description: 'Create a single new task in a project and assign it to a member.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              projectId: { type: SchemaType.INTEGER, description: 'The ID of the project to create the task in. If not specified by the user, ask for it.' },
              title: { type: SchemaType.STRING, description: 'The title of the task.' },
              description: { type: SchemaType.STRING, description: 'The detailed description of the task.' },
              priority: { type: SchemaType.STRING, description: 'Priority of the task (P0, P1, P2).' },
              assigneeId: { type: SchemaType.INTEGER, description: 'The ID of the user to assign the task to.' },
            },
            required: ['projectId', 'title'],
          },
        },
        {
          name: 'createMultipleTasks',
          description: 'Create multiple tasks in bulk for a project.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              projectId: { type: SchemaType.INTEGER, description: 'The ID of the project.' },
              tasks: {
                type: SchemaType.ARRAY,
                description: 'A list of tasks to create.',
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    title: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                    priority: { type: SchemaType.STRING, description: 'P0, P1, or P2' },
                    assigneeId: { type: SchemaType.INTEGER },
                  },
                  required: ['title'],
                },
              },
            },
            required: ['projectId', 'tasks'],
          },
        },
        {
          name: 'getTasks',
          description: 'Retrieve and filter tasks in a project. Use this to find unassigned tasks, completed tasks, or tasks for a specific user.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              projectId: { type: SchemaType.INTEGER, description: 'The ID of the project.' },
              unassigned: { type: SchemaType.BOOLEAN, description: 'Set to true to only return tasks that have no assignee.' },
              status: { type: SchemaType.STRING, description: 'Filter by exact status (e.g., TO_DO, IN_PROGRESS, IN_REVIEW, DONE).' },
              completedAfter: { type: SchemaType.STRING, description: 'ISO date string. If provided, returns only tasks completed (status DONE) on or after this date. Useful for generating release notes.' },
            },
            required: ['projectId'],
          },
        },
        {
          name: 'updateTask',
          description: 'Update an existing task. Use this to assign a task to a user, change its priority, or mark it as done.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              taskId: { type: SchemaType.INTEGER, description: 'The ID of the task to update.' },
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              status: { type: SchemaType.STRING, description: 'TO_DO, IN_PROGRESS, IN_REVIEW, DONE' },
              priority: { type: SchemaType.STRING, description: 'P0, P1, P2' },
              assigneeId: { type: SchemaType.INTEGER, description: 'ID of the user to assign.' },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'createDoc',
          description: 'Create a new wiki document in a project. Useful for generating release notes, project summaries, or technical specs.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              projectId: { type: SchemaType.INTEGER, description: 'The ID of the project.' },
              title: { type: SchemaType.STRING, description: 'The title of the document.' },
              content: { type: SchemaType.STRING, description: 'The markdown content of the document.' },
            },
            required: ['projectId', 'title', 'content'],
          },
        },
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
        },
      ],
    },
  ]
}

export function getAIToolHandlers(data: ChatInput, userId: number): Record<string, (args: any) => Promise<any>> {
  const resolveProjectId = (providedId?: number) => {
    let projectId = providedId
    if (!projectId && data.scope === 'project') {
      projectId = data.scopeId
    }
    if (!projectId) throw new Error('projectId is required')
    return projectId
  }

  return {
    createTask: async (args: any) => {
      const projectId = resolveProjectId(args.projectId)
      const taskData = {
        title: args.title,
        description: args.description || null,
        priority: args.priority || 'P2',
        status: 'TO_DO' as const,
        assigneeId: args.assigneeId || null,
        dueDate: null,
      }
      
      const task = await tasksService.createTask(projectId, userId, taskData)
      return { success: true, taskId: task.id, title: task.title }
    },
    
    createMultipleTasks: async (args: any) => {
      const projectId = resolveProjectId(args.projectId)
      const createdTasks = []
      
      for (const t of args.tasks) {
        const taskData = {
          title: t.title,
          description: t.description || null,
          priority: t.priority || 'P2',
          status: 'TO_DO' as const,
          assigneeId: t.assigneeId || null,
          dueDate: null,
        }
        const task = await tasksService.createTask(projectId, userId, taskData)
        createdTasks.push({ id: task.id, title: task.title })
      }
      return { success: true, createdTasks }
    },

    getTasks: async (args: any) => {
      const projectId = resolveProjectId(args.projectId)
      let tasks = await tasksService.getTasks(projectId, userId)

      // Apply in-memory filters
      if (args.unassigned) {
        tasks = tasks.filter((t: any) => !t.assigneeId)
      }
      if (args.status) {
        tasks = tasks.filter((t: any) => t.status === args.status)
      }
      if (args.completedAfter) {
        const afterDate = new Date(args.completedAfter).getTime()
        tasks = tasks.filter((t: any) => t.status === 'DONE' && new Date(t.updatedAt).getTime() >= afterDate)
      }

      // Return a simplified schema to avoid exceeding token limits
      return {
        success: true,
        tasks: tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assigneeId: t.assigneeId,
          updatedAt: t.updatedAt
        }))
      }
    },

    updateTask: async (args: any) => {
      if (!args.taskId) throw new Error('taskId is required')
      
      const updateData: any = {}
      if (args.title !== undefined) updateData.title = args.title
      if (args.description !== undefined) updateData.description = args.description
      if (args.status !== undefined) updateData.status = args.status
      if (args.priority !== undefined) updateData.priority = args.priority
      if (args.assigneeId !== undefined) updateData.assigneeId = args.assigneeId

      const task = await tasksService.updateTask(args.taskId, userId, updateData)
      if (!task) throw new Error('Task not found')
      return { success: true, taskId: task.id, status: task.status, assigneeId: task.assigneeId }
    },

    createDoc: async (args: any) => {
      const projectId = resolveProjectId(args.projectId)
      const doc = await docsService.createDoc(projectId, userId, {
        title: args.title,
        content: args.content
      })
      return { success: true, docId: doc.id, title: doc.title }
    },

    createCodeSnippet: async (args: any) => {
      const projectId = resolveProjectId(args.projectId)
      const snippet = await snippetsService.createSnippet(projectId, userId, {
        title: args.title,
        description: args.description || null,
        language: args.language,
        code: args.code,
      })
      return { success: true, snippetId: snippet.id, title: snippet.title }
    },

    createTaskComment: async (args: any) => {
      if (!args.taskId) throw new Error('taskId is required')
      const comment = await tasksService.addComment(args.taskId, userId, {
        content: args.content
      })
      return { success: true, commentId: comment.id }
    }
  }
}
