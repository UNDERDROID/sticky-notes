const sql = require("mssql");
require("dotenv").config();

const dbconfig = {
    user: process.env.DB_USER,  
    password: process.env.DB_PASSWORD, 
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',  
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    }
};

const pool = new sql.ConnectionPool(dbconfig)
    .connect()
    .then(pool => {
        console.log("Connected to the database");
        return pool;
    })
    .catch(err => {
        console.error("Database connection failed! ", err);
        process.exit(1); // Exit process if DB connection fails
    });

module.exports = { pool, sql }; // ✅ Ensure sql is exported
