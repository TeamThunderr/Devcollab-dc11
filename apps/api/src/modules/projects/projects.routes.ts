import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  getProjectsHandler,
  updateProjectHandler,
  getProjectMembersHandler,
  addProjectMemberHandler,
  updateProjectMemberRoleHandler,
  removeProjectMemberHandler,
} from './projects.controller.js'
import {
  createProjectSchema,
  projectListResponseSchema,
  projectResponseSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
  projectMemberListResponseSchema,
  projectMemberResponseSchema,
} from './projects.schema.js'
import { requireAuth } from '../../middlewares/auth.js'
import { z } from 'zod'

export const projectsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // Routes mounted under /workspaces/:workspaceId/projects
  app.post(
    '/',
    {
      schema: {
        params: z.object({ workspaceId: z.string() }),
        body: createProjectSchema,
        response: {
          201: projectResponseSchema,
        },
      },
    },
    createProjectHandler
  )

  app.get(
    '/',
    {
      schema: {
        params: z.object({ workspaceId: z.string() }),
        response: {
          200: projectListResponseSchema,
        },
      },
    },
    getProjectsHandler
  )
}

export const singleProjectRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  // Routes mounted under /projects/:id
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          200: projectResponseSchema,
        },
      },
    },
    getProjectHandler
  )

  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: updateProjectSchema,
        response: {
          200: projectResponseSchema,
        },
      },
    },
    updateProjectHandler
  )

  app.delete(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          204: z.undefined(),
        },
      },
    },
    deleteProjectHandler
  )

  app.get(
    '/:id/members',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          200: projectMemberListResponseSchema,
        },
      },
    },
    getProjectMembersHandler
  )

  app.post(
    '/:id/members',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: addProjectMemberSchema,
      },
    },
    addProjectMemberHandler
  )

  app.patch(
    '/:id/members/:userId',
    {
      schema: {
        params: z.object({ id: z.string(), userId: z.string() }),
        body: updateProjectMemberSchema,
      },
    },
    updateProjectMemberRoleHandler
  )

  app.delete(
    '/:id/members/:userId',
    {
      schema: {
        params: z.object({ id: z.string(), userId: z.string() }),
        response: {
          204: z.undefined(),
        },
      },
    },
    removeProjectMemberHandler
  )
}
