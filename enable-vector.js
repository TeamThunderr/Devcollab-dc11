import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://devcollab:cHdAr7glK8EiVbvjcCoXk7ax8tDtFcch@dpg-d997uji8qa3s73eeeuig-a.singapore-postgres.render.com/devcollab_k6qe?sslmode=require',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Render database.");
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log("Successfully enabled pgvector extension!");
  } catch (err) {
    console.error("Error enabling pgvector:", err);
  } finally {
    await client.end();
  }
}

run();
