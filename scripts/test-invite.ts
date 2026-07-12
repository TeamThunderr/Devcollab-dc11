import { db } from './apps/api/src/db/client.js'
import { workspaces, workspaceInvitations, users } from './apps/api/src/db/schema.js'

async function run() {
  const allUsers = await db.select().from(users).limit(1);
  if (!allUsers.length) return console.log("No users");
  const user = allUsers[0];

  const allWorkspaces = await db.select().from(workspaces).limit(1);
  if (!allWorkspaces.length) return console.log("No workspaces");
  const workspace = allWorkspaces[0];

  const code = "DEV-TESTCODE";

  await db.insert(workspaceInvitations).values({
    workspaceId: workspace.id,
    email: "test@example.com",
    code,
    role: "MEMBER",
    status: "PENDING",
    expiresAt: new Date(Date.now() + 100000000)
  });

  console.log(`Created invite code: ${code}`);
}

run().catch(console.error).finally(() => process.exit(0));
