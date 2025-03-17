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

    const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

//Get all notes
app.get('/notes', async (req, res) => {
    try{
        const result = await sql.query('SELECT * FROM Notes');
        res.json(result.recordset);
    }catch(error){
        res.status(500).send(error.message);
    }
})

//Post notes
app.post('/notes', async(req, res) => {
    const{title, content, cardcolor, textcolor, positionLeft, positionTop } = req.body;
    if(!title || !content){
        res.status(400).json({error: 'Title and content are required'});
    }

    try{
        const id = Date.now().toString();
        const request = new sql.Request();

        const noteData = {
            id, title, content, cardcolor, textcolor, positionLeft, positionTop
        }

        request.input('id', sql.NVarChar, id);
        request.input('title', sql.NVarChar, title);
        request.input('content', sql.NVarChar, content);
        request.input('cardcolor', sql.NVarChar, cardcolor);
        request.input('textcolor', sql.NVarChar, textcolor);
        request.input('positionLeft', sql.Float, positionLeft);
        request.input('positionTop', sql.Float, positionTop);

        await request.query(`
           INSERT INTO Notes(id, title, content, cardcolor, textcolor, positionLeft, positionTop)
           VALUES (@id, @title, @content, @cardcolor, @textcolor, @positionLeft, @positionLeft ) 
            `);
            res.status(201).json(noteData);
    }catch(error){
        res.status(500).send(error.message);
    }
});

//Delete notes
app.delete('/notes/:id', async(req, res) => {
    const { id } = req.params;
    try{
    await sql.query(`DELETE FROM Notes WHERE id=${id}`);
    res.status(200).json({message: 'Note deleted successfully'});
}catch(error){
    res.status(500).send(error.message);
}
})

//Update note title
app.put('/notes/title/:id', async(req, res) => {
    const { id } = req.params;
    const {title} = req.body;
    try{
        const updatedData = {title}
        const result = await sql.query`
            UPDATE Notes SET
            title = ${title}
            WHERE id = ${id}
            `;

            if(result.rowsAffected[0] === 0){
                return res.status(404).send('Note not found');
            }

            res.status(201).json(updatedData);
    }catch(error){
        res.status(500).send(error.message);
    }
})

//Update note content
app.put('/notes/content/:id', async(req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    try{
        const result = await sql.query`
            UPDATE NOTES 
            SET content = ${content}
            WHERE id = ${id}
            `;

            if(result.rowsAffected[0] === 0){
                return res.status(404).send('Note not found');
            }
            res.status(201).json('Content updated');
    }catch(error){
        return res.status(500).send(error.message);
    }
})