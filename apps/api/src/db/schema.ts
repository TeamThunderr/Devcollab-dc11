import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
  primaryKey,
  index,
  customType,

} from 'drizzle-orm/pg-core'

export const vector = customType<{ data: number[]; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 768})`;
  },
  toDriver(value) {
    return JSON.stringify(value);
  },
  fromDriver(value) {
    return typeof value === 'string' ? JSON.parse(value) : value;
  },
});

// --- ENUMS ---
export const planEnum = pgEnum('plan', ['FREE', 'PRO'])
export const roleEnum = pgEnum('role', ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])
export const projectRoleEnum = pgEnum('project_role', ['OWNER', 'ADMIN', 'TEAM_LEAD', 'MEMBER', 'VIEWER'])
export const taskStatusEnum = pgEnum('task_status', ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
export const taskPriorityEnum = pgEnum('task_priority', ['P0', 'P1', 'P2'])
export const notificationTypeEnum = pgEnum('notification_type', ['mention', 'task_assigned', 'role_changed', 'system'])
export const notificationContextTypeEnum = pgEnum('notification_context_type', ['chat', 'project', 'task'])
export const attachmentTypeEnum = pgEnum('attachment_type', ['TASK', 'COMMENT', 'DOC', 'SNIPPET'])
export const taskRelationEnum = pgEnum('task_relation', ['BLOCKS', 'IS_BLOCKED_BY', 'RELATES_TO', 'DUPLICATES'])
export const reactionEntityTypeEnum = pgEnum('reaction_entity_type', ['COMMENT', 'DOC'])
export const oauthProviderEnum = pgEnum('oauth_provider', ['GOOGLE', 'GITHUB'])
export const aiMessageRoleEnum = pgEnum('ai_message_role', ['user', 'model'])
export const sprintStatusEnum = pgEnum('sprint_status', ['PLANNED', 'ACTIVE', 'COMPLETED'])


export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  skills: jsonb('skills').$type<string[]>(),
  githubLink: text('github_link'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  plan: planEnum('plan').default('FREE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const oauthAccounts = pgTable('oauth_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: oauthProviderEnum('provider').notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const passwordResetOtps = pgTable('password_reset_otps', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  otpHash: text('otp_hash').notNull(),
  attemptCount: integer('attempt_count').default(0).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const signupOtps = pgTable('signup_otps', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  otpHash: text('otp_hash').notNull(),
  attemptCount: integer('attempt_count').default(0).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- WORKSPACES ---
export const workspaces = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  ownerId: integer('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const workspaceMembers = pgTable('workspace_members', {
  workspaceId: integer('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: roleEnum('role').default('MEMBER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.workspaceId, t.userId] }),
}))

export const workspaceInvitations = pgTable('workspace_invitations', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 255 }).notNull().unique(),
  role: roleEnum('role').default('MEMBER').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- PROJECTS ---
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  priority: varchar('priority', { length: 20 }).default('P2').notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  visibility: varchar('visibility', { length: 50 }).default('PUBLIC').notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  workspaceIdx: index('projects_workspace_id_idx').on(t.workspaceId),
  createdByIdx: index('projects_created_by_idx').on(t.createdBy),
}))

export const projectMembers = pgTable('project_members', {
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: projectRoleEnum('role').default('MEMBER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.projectId, t.userId] }),
  projectIdx: index('project_members_project_id_idx').on(t.projectId),
  userIdx: index('project_members_user_id_idx').on(t.userId),
}))

// --- SPRINTS ---
export const sprints = pgTable('sprints', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: sprintStatusEnum('status').default('PLANNED').notNull(),
  goal: text('goal'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectIdx: index('sprints_project_id_idx').on(t.projectId),
}))

// --- TASKS ---
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('TO_DO').notNull(),
  priority: taskPriorityEnum('priority').default('P2').notNull(),
  assigneeId: integer('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  sprintId: integer('sprint_id').references(() => sprints.id, { onDelete: 'set null' }),
  dueDate: timestamp('due_date'),
  embedding: vector('embedding', { dimensions: 768 }),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectIdx: index('tasks_project_id_idx').on(t.projectId),
  assigneeIdx: index('tasks_assignee_id_idx').on(t.assigneeId),
  sprintIdx: index('tasks_sprint_id_idx').on(t.sprintId),
  createdByIdx: index('tasks_created_by_idx').on(t.createdBy),
}))

export const taskComments = pgTable('task_comments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  taskIdx: index('task_comments_task_id_idx').on(t.taskId),
  userIdx: index('task_comments_user_id_idx').on(t.userId),
}))

// --- CHAT MESSAGES ---
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  channel: varchar('channel', { length: 100 }).default('general').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectIdx: index('chat_messages_project_id_idx').on(t.projectId),
  userIdx: index('chat_messages_user_id_idx').on(t.userId),
  channelIdx: index('chat_messages_channel_idx').on(t.channel),
}))


// --- CODE SNIPPETS ---
export const codeSnippets = pgTable('code_snippets', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  language: varchar('language', { length: 50 }).notNull(),
  code: text('code').notNull(),
  tags: jsonb('tags').$type<string[]>(),
  embedding: vector('embedding', { dimensions: 768 }),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  projectIdx: index('code_snippets_project_id_idx').on(t.projectId),
}))

// --- DOCS (WIKI) ---
export const docs = pgTable('docs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => ({
  projectIdx: index('docs_project_id_idx').on(t.projectId),
}))

export const docVersions = pgTable('doc_versions', {
  id: serial('id').primaryKey(),
  docId: integer('doc_id').references(() => docs.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- ACTIVITY & NOTIFICATIONS ---
export const activityFeed = pgTable('activity_feed', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actionType: varchar('action_type', { length: 100 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  workspaceIdx: index('activity_feed_workspace_id_idx').on(t.workspaceId),
  projectIdx: index('activity_feed_project_id_idx').on(t.projectId),
  userIdx: index('activity_feed_user_id_idx').on(t.userId),
}))

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  recipientUserId: integer('recipient_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actorUserId: integer('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  type: notificationTypeEnum('type').default('mention').notNull(),
  contextType: notificationContextTypeEnum('context_type'),
  contextId: integer('context_id'),
  message: text('message').notNull(),
  link: text('link'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  workspaceRecipientUnreadIdx: index('notifications_ws_recipient_is_read_idx').on(t.workspaceId, t.recipientUserId, t.isRead),
}))

// --- ATTACHMENTS ---
export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  uploaderId: integer('uploader_id').references(() => users.id, { onDelete: 'set null' }),
  entityType: attachmentTypeEnum('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- TASK DEPENDENCIES ---
export const taskRelations = pgTable('task_relations', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  relatedTaskId: integer('related_task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  relationType: taskRelationEnum('relation_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  taskIdx: index('task_relations_task_id_idx').on(t.taskId),
  relatedTaskIdx: index('task_relations_related_task_id_idx').on(t.relatedTaskId),
}))

// --- LABELS ---
export const labels = pgTable('labels', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const taskLabels = pgTable('task_labels', {
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  labelId: integer('label_id').references(() => labels.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.taskId, t.labelId] }),
}))

// --- REACTIONS ---
export const reactions = pgTable('reactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  entityType: reactionEntityTypeEnum('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  emoji: varchar('emoji', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- AI CONVERSATIONS ---
export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  workspaceId: integer('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull().default('New conversation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('ai_conversations_user_id_idx').on(table.userId),
  workspaceIdIdx: index('ai_conversations_workspace_id_idx').on(table.workspaceId),
}))

export const aiMessages = pgTable('ai_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => aiConversations.id, { onDelete: 'cascade' }).notNull(),
  role: aiMessageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index('ai_messages_conversation_id_idx').on(table.conversationId),
}))
