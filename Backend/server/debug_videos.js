const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function debug() {
    const con = new Client({ connectionString: process.env.DATABASE_URL });
    await con.connect();

    console.log('--- DATABASE VIDEOS ---');
    const res = await con.query('SELECT id, video_url FROM lectures WHERE video_url IS NOT NULL');
    res.rows.forEach(r => console.log(`${r.id}: ${r.video_url}`));

    console.log('\n--- FILES ON DISK ---');
    const files = fs.readdirSync(path.join(__dirname, 'upload', 'videos'));
    files.forEach(f => console.log(f));

    await con.end();
}

debug();
