const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://devcollab:devcollab@localhost:5434/devcollab' });

async function run() {
  try {
    const users = await pool.query('SELECT * FROM users');
    console.log('Users:', users.rows);

    const wsm = await pool.query('SELECT * FROM workspace_members');
    console.log('Workspace Members:', wsm.rows);
    
    const invites = await pool.query('SELECT * FROM workspace_invitations');
    console.log('Workspace Invitations:', invites.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
