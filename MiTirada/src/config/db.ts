import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(false); // Opcional: puedes usar true si prefieres Promises

const db = SQLite.openDatabase(
  {
    name: 'tiradas.db',
    location: 'default',
  },
  () => {
    console.log('📦 Base de datos abierta correctamente');
  },
  error => {
    console.error('❌ Error abriendo la base de datos:', error);
  }
);

export default db;
