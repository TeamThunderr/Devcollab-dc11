import './config/env.js' // Must be first — boot fails on bad config
import { env } from './config/env.js'
import { createLogger } from './lib/logger.js'
import { AppError } from './lib/errors.js'
import { initSocket } from './socket/socket.js'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { ZodError } from 'zod'
import oauthPlugin from '@fastify/oauth2'
import { authRoutes } from './modules/auth/auth.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { workspacesRoutes } from './modules/workspaces/workspaces.routes.js'
import { projectsRoutes, singleProjectRoutes } from './modules/projects/projects.routes.js'
import { projectTasksRoutes, singleTaskRoutes } from './modules/tasks/tasks.routes.js'
import { projectLabelsRoutes, singleLabelRoutes, taskLabelsRoutes } from './modules/labels/labels.routes.js'
import { taskRelationsRoutes } from './modules/task-relations/task-relations.routes.js'
import { taskAttachmentsRoutes, singleAttachmentRoutes } from './modules/attachments/attachments.routes.js'
import { commentReactionsRoutes } from './modules/reactions/reactions.routes.js'
import { projectDocsRoutes, singleDocRoutes } from './modules/docs/docs.routes.js'
import { projectSnippetsRoutes, singleSnippetRoutes } from './modules/snippets/snippets.routes.js'
import { projectSprintsRoutes, singleSprintRoutes } from './modules/sprints/sprints.routes.js'
import { workspaceActivityRoutes, projectActivityRoutes, notificationsRoutes } from './modules/activity/activity.routes.js'
import { aiRoutes } from './modules/ai/ai.routes.js'
import multipart from '@fastify/multipart'

const logger = createLogger('server')

const app = Fastify({
  // Fastify uses pino internally — we pass our logger config
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

// ── Zod type provider for native Zod request/response validation in routes ──
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// ── Global error handler — Fault Control ─────────────────────────────────────
app.setErrorHandler((error, _request, reply) => {
  if (error instanceof AppError) {
    return reply.type('application/json; charset=utf-8').status(error.statusCode).send({
      error: error.code,
      message: error.message,
    })
  }

  if (error instanceof ZodError) {
    return reply.type('application/json; charset=utf-8').status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  // Unknown errors — log full stack internally, return generic 500 to client.
  // Never leak stack traces or internal details to the client.
  logger.error({ err: error }, 'Unhandled server error')
  return reply.type('application/json; charset=utf-8').status(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  })
})

// ── Plugin registration ──────────────────────────────────────────────────────
await app.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
})

await app.register(cookie)
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }) // 10 MB limit

// ── Register Feature Modules ──────────────────────────────────────────────────
await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(usersRoutes, { prefix: '/api/users' })
await app.register(workspacesRoutes, { prefix: '/api/workspaces' })
await app.register(projectsRoutes, { prefix: '/api/workspaces/:workspaceId/projects' })
await app.register(singleProjectRoutes, { prefix: '/api/projects' })
await app.register(projectTasksRoutes, { prefix: '/api/projects/:projectId/tasks' })
await app.register(singleTaskRoutes, { prefix: '/api/tasks/:taskId' })
// — Sprints —
await app.register(projectSprintsRoutes, { prefix: '/api/projects/:projectId/sprints' })
await app.register(singleSprintRoutes, { prefix: '/api/sprints/:sprintId' })
// — Labels —
await app.register(projectLabelsRoutes, { prefix: '/api/projects/:projectId/labels' })
await app.register(singleLabelRoutes, { prefix: '/api/labels/:labelId' })
await app.register(taskLabelsRoutes, { prefix: '/api/tasks/:taskId/labels' })
// — Task Relations —
await app.register(taskRelationsRoutes, { prefix: '/api/tasks/:taskId/relations' })
// — Attachments —
await app.register(taskAttachmentsRoutes, { prefix: '/api/tasks/:taskId/attachments' })
await app.register(singleAttachmentRoutes, { prefix: '/api/attachments/:attachmentId' })
// — Reactions —
await app.register(commentReactionsRoutes, { prefix: '/api/comments/:commentId/reactions' })
// — Docs/Wiki —
await app.register(projectDocsRoutes, { prefix: '/api/projects/:projectId/docs' })
await app.register(singleDocRoutes, { prefix: '/api/docs/:docId' })
// — Code Snippets —
await app.register(projectSnippetsRoutes, { prefix: '/api/projects/:projectId/snippets' })
await app.register(singleSnippetRoutes, { prefix: '/api/snippets/:snippetId' })
await app.register(workspaceActivityRoutes, { prefix: '/api/workspaces/:workspaceId/activity' })
await app.register(projectActivityRoutes, { prefix: '/api/projects/:projectId/activity' })
await app.register(notificationsRoutes, { prefix: '/api/me/notifications' })
// — AI —
await app.register(aiRoutes, { prefix: '/api/ai' })

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (_request, _reply) => {
  return { status: 'ok', uptime: process.uptime() }
})

// ── OAuth Plugins ────────────────────────────────────────────────────────────
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  await app.register(oauthPlugin, {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: env.GOOGLE_CLIENT_ID,
        secret: env.GOOGLE_CLIENT_SECRET
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/auth/google',
    callbackUri: `${env.BACKEND_URL}/auth/google/callback`,
    scope: ['profile', 'email']
  })
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  await app.register(oauthPlugin, {
    name: 'githubOAuth2',
    credentials: {
      client: {
        id: env.GITHUB_CLIENT_ID,
        secret: env.GITHUB_CLIENT_SECRET
      },
      auth: oauthPlugin.GITHUB_CONFIGURATION
    },
    startRedirectPath: '/auth/github',
    callbackUri: `${env.BACKEND_URL}/auth/github/callback`,
    scope: ['read:user', 'user:email']
  })
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.register(authRoutes, { prefix: '/auth' })

// ── Start server ─────────────────────────────────────────────────────────────
const address = await app.listen({ port: env.PORT, host: '0.0.0.0' })

// Attach Socket.IO to the underlying HTTP server
initSocket(app.server)

logger.info({ address, env: env.NODE_ENV }, 'DevCollab API started')
