const sqlite3 = require('sqlite3').verbose();

// 连接SQLite数据库
const db = new sqlite3.Database('./im_platform.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
    clearDatabase();
  }
});

// 清除数据库数据
function clearDatabase() {
  const tables = [
    'group_messages',
    'group_members',
    'groups',
    'friends',
    'messages',
    'users'
  ];

  let index = 0;

  function deleteNextTable() {
    if (index < tables.length) {
      const table = tables[index];
      db.run(`DELETE FROM ${table}`, (err) => {
        if (err) {
          console.error(`Error deleting from ${table}:`, err);
        } else {
          console.log(`Cleared ${table} table`);
        }
        index++;
        deleteNextTable();
      });
    } else {
      // 压缩数据库
      db.run('VACUUM', (err) => {
        if (err) {
          console.error('Error vacuuming database:', err);
        } else {
          console.log('Database vacuumed');
        }
        db.close();
        console.log('All data has been cleared from the database');
      });
    }
  }

  deleteNextTable();
}
