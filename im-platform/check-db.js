const sqlite3 = require('sqlite3').verbose();

// 连接SQLite数据库
const db = new sqlite3.Database('./im_platform.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
    checkTables();
  }
});

// 检查各表的数据
function checkTables() {
  const tables = [
    'users',
    'messages',
    'friends',
    'groups',
    'group_members',
    'group_messages'
  ];

  let index = 0;

  function checkNextTable() {
    if (index < tables.length) {
      const table = tables[index];
      db.all(`SELECT * FROM ${table}`, (err, rows) => {
        if (err) {
          console.error(`Error querying ${table}:`, err);
        } else {
          console.log(`\n${table} table has ${rows.length} records:`);
          if (rows.length > 0) {
            console.log(rows);
          }
        }
        index++;
        checkNextTable();
      });
    } else {
      db.close();
      console.log('\nDatabase check completed');
    }
  }

  checkNextTable();
}
