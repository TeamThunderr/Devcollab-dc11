# DevCollab v2

**Real-Time Project Collaboration Platform for Developers**

The Vision: Build a GitHub-meets-Notion-meets-Slack platform designed for student developer teams — where they can manage projects, write documentation, review code snippets, track tasks, and communicate — all in one place, with AI acting as a project assistant.

---

## Core Features

### Workspace & Projects
- Users create a workspace (like a team/organisation).
- Inside a workspace: multiple projects, each with their own members, tasks, docs, and snippets.
- Invite members via email link.
- Role system: Owner, Admin, Member, Viewer — each with different permissions.

### Task Management
- Kanban board: To Do → In Progress → In Review → Done.
- Each task: title, description, assignee, priority (P0/P1/P2), due date, labels, attachments.
- List view and calendar view of tasks.
- Drag and drop tasks across columns.
- Task comments with @mentions — notify the mentioned user.

### Real-Time Collaboration
- Multiple users can view and update the same board simultaneously (using WebSockets/Socket.IO).
- Live presence indicators: show who is currently viewing the board ("Ankush is viewing this task").
- Real-time notifications: "Riya moved your task to In Review".

### Code Snippet Manager
- Save reusable code snippets inside a project.
- Each snippet: title, language, code, tags, description.
- Syntax highlighted display.
- Search snippets by title or tag.
- "Copy to clipboard" button.

### Documentation Wiki
- Each project has a wiki section — like Notion pages.
- Rich text editor: headings, bullet points, code blocks, tables, image uploads.
- Pages linked to each other.
- Version history: see previous versions of any page.

### AI Project Assistant
- "Summarise this project" — AI reads task titles and statuses and gives a progress summary.
- "What's blocking us?" — AI identifies tasks that have been in "In Progress" for too long.
- "Generate a standup report" — AI creates a daily standup format based on task movement in the last 24 hours.
- AI can generate a task breakdown from a feature description: "User types: Build a login system → AI creates 6 subtasks automatically".

### AI Code Reviewer
- Paste a code snippet → AI reviews it: bugs, performance issues, readability suggestions, security concerns.
- Gives a quality score (1–10) with actionable comments.
- Supports JS, Python, Java, C++, Go.

### Activity Feed
- Global feed showing all actions across the workspace: task moved, comment added, doc updated, member joined.
- Filter by project or by member.

### User System
- Profile with avatar, bio, skills, GitHub link.
- Notification centre: in-app notifications for all @mentions and task assignments.

### Payments
- **Free:** 1 workspace, 3 projects, 5 members.
- **Pro:** Unlimited workspaces, projects, members, AI features.

---

## Tech Stack Overview

- **Frontend:** React 18, Vite, Tailwind CSS, Zustand, React Query, Radix UI.
- **Backend:** Node.js, Fastify, Drizzle ORM, Zod, Socket.IO.
- **Database:** PostgreSQL.
- **Caching/Queues:** Redis, BullMQ.

---

## Quick start

```bash
npm install
npm run docker:dev     # Starts Postgres + Redis locally
npm run db:push        # Pushes Drizzle schema to PostgreSQL
npm run dev            # Starts the Web + API concurrently
```

## Local Testing Credentials

For local testing without a backend, you can use the following mock credentials to test different user roles in the frontend:

- **Admin/Owner**: `admin@gmail.com` or `admin` (Password: `1234`)
- **Team Member**: `member@gmail.com` or `member` (Password: `1234`)
- **Viewer**: `viewer@gmail.com` or `viewer` (Password: `1234`)
