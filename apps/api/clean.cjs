const { Client } = require('pg');

async function clean() {
  const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/devcollab' });
  await client.connect();
  await client.query('TRUNCATE workspaces CASCADE;');
  console.log('Truncated');
  await client.end();
}
clean();
