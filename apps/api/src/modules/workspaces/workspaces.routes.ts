import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import {
  addMemberHandler,
  createWorkspaceHandler,
  deleteWorkspaceHandler,
  getWorkspacesHandler,
  getWorkspacesMyHandler,
  getWorkspaceStatsHandler,
  getWorkspaceTasksHandler,
  getWorkspaceMembersHandler,
  removeMemberHandler,
  updateMemberRoleHandler,
  updateWorkspaceHandler,
  joinWorkspaceHandler,
  inviteMemberHandler,
  rejectInvitationHandler,
} from './workspaces.controller.js'
import {
  addMemberSchema,
  createWorkspaceSchema,
  memberResponseSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
  workspaceListResponseSchema,
  workspaceMyListResponseSchema,
  workspaceResponseSchema,
  workspaceStatsResponseSchema,
  workspaceMemberListResponseSchema,
  inviteMemberSchema,
  joinWorkspaceSchema,
  joinWorkspaceBodySchema,
  rejectInvitationBodySchema,
} from './workspaces.schema.js'
import { taskListResponseSchema } from '../tasks/tasks.schema.js'
import { requireAuth } from '../../middlewares/auth.js'
import { z } from 'zod'

export const workspacesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', requireAuth)

  app.post(
    '/',
    {
      schema: {
        body: createWorkspaceSchema,
        response: {
          201: workspaceResponseSchema,
        },
      },
    },
    createWorkspaceHandler
  )

  app.get(
    '/',
    {
      schema: {
        response: {
          200: workspaceListResponseSchema,
        },
      },
    },
    getWorkspacesHandler
  )

  app.get(
    '/my',
    {
      schema: {
        response: {
          200: workspaceMyListResponseSchema,
        },
      },
    },
    getWorkspacesMyHandler
  )

  app.get(
    '/:id/stats',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          200: workspaceStatsResponseSchema,
        },
      },
    },
    getWorkspaceStatsHandler
  )

  app.get(
    '/:id/tasks',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          200: taskListResponseSchema,
        },
      },
    },
    getWorkspaceTasksHandler
  )

  app.get(
    '/:id/members',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          200: workspaceMemberListResponseSchema,
        },
      },
    },
    getWorkspaceMembersHandler
  )

  app.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: updateWorkspaceSchema,
        response: {
          200: workspaceResponseSchema,
        },
      },
    },
    updateWorkspaceHandler
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
    deleteWorkspaceHandler
  )

  app.post(
    '/:id/members',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: addMemberSchema,
        response: {
          201: memberResponseSchema,
        },
      },
    },
    addMemberHandler
  )

  app.patch(
    '/:id/members/:userId',
    {
      schema: {
        params: z.object({ id: z.string(), userId: z.string() }),
        body: updateMemberRoleSchema,
        response: {
          200: memberResponseSchema,
        },
      },
    },
    updateMemberRoleHandler
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
    removeMemberHandler
  )

  app.post(
    '/:id/invite',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: inviteMemberSchema,
        response: {
          201: z.union([
            memberResponseSchema,
            z.object({ success: z.boolean(), message: z.string(), status: z.string().optional() })
          ]),
        },
      },
    },
    inviteMemberHandler
  )

  app.post(
    '/join/:slug',
    {
      schema: {
        params: joinWorkspaceSchema,
        body: joinWorkspaceBodySchema,
        response: {
          200: z.object({ workspaceId: z.number(), joined: z.boolean() }),
        },
      },
    },
    joinWorkspaceHandler
  )

  app.post(
    '/join/:slug/reject',
    {
      schema: {
        params: joinWorkspaceSchema,
        body: rejectInvitationBodySchema,
        response: {
          200: z.object({ success: z.boolean() }),
        },
      },
    },
    rejectInvitationHandler
  )
}
