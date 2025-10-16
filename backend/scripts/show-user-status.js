#!/usr/bin/env node
import 'dotenv/config';
import mysql from 'mysql2/promise';

(async function main(){
  try{
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dictionnaire_ch',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT,10) : 3306
    });
    const [rows] = await conn.execute("SHOW COLUMNS FROM users LIKE 'status'");
    console.log(rows);
    await conn.end();
  }catch(e){
    console.error('error:', e.message);
    process.exit(1);
  }
})();
