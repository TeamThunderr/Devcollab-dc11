-- Step 1: Create new context type enum
CREATE TYPE "public"."notification_context_type" AS ENUM('chat', 'project', 'task');--> statement-breakpoint

-- Step 2: Alter notification_type enum values from MENTION/ASSIGNMENT/SYSTEM to mention/task_assigned/role_changed/system
ALTER TYPE "public"."notification_type" RENAME TO "notification_type_old";--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('mention', 'task_assigned', 'role_changed', 'system');--> statement-breakpoint

-- Step 3: Add new columns as nullable first
ALTER TABLE "notifications" ADD COLUMN "workspace_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "recipient_user_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "actor_user_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "context_type" "public"."notification_context_type";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "context_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "type_new" "public"."notification_type" DEFAULT 'mention';--> statement-breakpoint

-- Step 4: Data migration UPDATE for existing rows
UPDATE "notifications" SET "recipient_user_id" = "user_id";--> statement-breakpoint
UPDATE "notifications" SET "workspace_id" = (
  SELECT "workspace_id" FROM "workspace_members" WHERE "user_id" = "notifications"."user_id" LIMIT 1
);--> statement-breakpoint
DELETE FROM "notifications" WHERE "workspace_id" IS NULL OR "recipient_user_id" IS NULL;--> statement-breakpoint

UPDATE "notifications" SET "type_new" = CASE
  WHEN "type"::text = 'MENTION' THEN 'mention'::"public"."notification_type"
  WHEN "type"::text = 'ASSIGNMENT' THEN 'task_assigned'::"public"."notification_type"
  WHEN "type"::text = 'SYSTEM' THEN 'system'::"public"."notification_type"
  ELSE 'mention'::"public"."notification_type"
END;--> statement-breakpoint

-- Step 5: Replace type column and drop old user_id column
ALTER TABLE "notifications" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "notifications" RENAME COLUMN "type_new" TO "type";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'mention'::"public"."notification_type";--> statement-breakpoint

DROP TYPE "public"."notification_type_old";--> statement-breakpoint

ALTER TABLE "notifications" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "recipient_user_id" SET NOT NULL;--> statement-breakpoint

-- Step 6: Add foreign keys and indexes
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_ws_recipient_is_read_idx" ON "notifications" USING btree ("workspace_id","recipient_user_id","is_read");
