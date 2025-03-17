const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); 


const app = express();
app.use(cors());
app.use(bodyParser.json());

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

sql.connect(dbconfig)
    .then(() => console.log('Connected to SQL Server'))
    .catch(err => console.error('DB Connection Error:', err));

    const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})