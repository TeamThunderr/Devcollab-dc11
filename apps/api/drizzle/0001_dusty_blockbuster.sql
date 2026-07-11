DROP INDEX "ai_conv_user_id_idx";--> statement-breakpoint
DROP INDEX "ai_conv_workspace_id_idx";--> statement-breakpoint
DROP INDEX "ai_msg_conv_id_idx";--> statement-breakpoint
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_workspace_id_idx" ON "ai_conversations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages" USING btree ("conversation_id");