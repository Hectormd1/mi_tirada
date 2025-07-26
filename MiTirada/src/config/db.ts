import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(false);

const db = SQLite.openDatabase(
  { name: 'tiradas.db', location: 'default' },
  () => console.log('📦 Base de datos abierta correctamente'),
  error => console.error('❌ Error abriendo la base de datos:', error)
);

// Al abrir, creamos la tabla con columna fecha DEFAULT CURRENT_TIMESTAMP
db.transaction(tx => {
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS tiradas (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre     TEXT,
      resultados TEXT,
      fecha      TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );
});

export default db;
