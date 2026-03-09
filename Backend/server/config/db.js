const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const con = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Allowing up to 20 concurrent connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

con.on('connect', () => {
    // console.log("✅ Database Connected via Pool");
});

con.on('error', (err) => {
    console.error('❌ Unexpected DB Error', err);
});

module.exports = con;
