import postgres from 'postgres';
const sql = postgres('postgresql://devcollab:devcollab@127.0.0.1:5433/devcollab');
try {
  await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
  console.log('Extension created');
} catch(e) {
  console.error(e);
}
process.exit(0);
