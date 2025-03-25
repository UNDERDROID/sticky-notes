const sql = require("mssql");
require('dotenv').config(); 

async function initializeTable(){
    try {
        console.log('Checking tables..');
        
        const dbconfig = {
            user: process.env.DB_USER,  // Change to your SQL Server username
            password: process.env.DB_PASSWORD, 
            server: process.env.DB_SERVER,
            database: process.env.DB_DATABASE,
            options: {
                encrypt: process.env.DB_ENCRYPT === 'true',  // Disables SSL encryption
                trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'  // Bypasses untrusted certificate error
            }
        };

         const pool = await sql.connect(dbconfig);

        //Create Users table
         await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name ='users' AND xtype = 'U')
                CREATE TABLE Users (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    refreshToken NVARCHAR(1000)
                );            
        `)

        //Create Notes table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name ='notes' AND xtype = 'U')
            CREATE TABLE Notes (
            id NVARCHAR(50) PRIMARY KEY,
            user_id INT NOT NULL,
            title NVARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            cardcolor NVARCHAR(20),
            textcolor NVARCHAR(20),
            positionLeft FLOAT(50),
            positionTop FLOAT(50),
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        );
            `)
    }catch(error){
        console.error('Table Initialization error', error.message);
    }
}

module.exports = initializeTable;