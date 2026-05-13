const { MongoClient } = require('mongodb');

let client;
let db;

async function connectDB(uri) {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();

  await db.collection('users').createIndex({ email: 1 }, { unique: true });

  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

module.exports = { connectDB, getDB };
