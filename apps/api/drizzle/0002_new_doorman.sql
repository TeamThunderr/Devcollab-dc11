CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "code_snippets" ADD COLUMN "embedding" vector(768);--> statement-breakpoint
ALTER TABLE "docs" ADD COLUMN "embedding" vector(768);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "embedding" vector(768);