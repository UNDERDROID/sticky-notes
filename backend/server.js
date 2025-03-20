const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config(); 


const app = express();
const corsOptions = {
    origin: 'http://127.0.0.1:5500',
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));
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

async function getDBConnection() {
    try{
        return await sql.connect(dbconfig);
    }catch(err){
        console.error("DB Connection Error:", err);
        throw err;
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//Register route
app.post('/register', async (req,res) => {
    try{
        const { username, email, password } =req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const pool = await getDBConnection();

        const existingUser = await pool
        .request()
        .input("username", sql.VarChar, username)
        .input("email", sql.VarChar, email)
        .query(
            `SELECT * FROM Users WHERE username = @username OR email = @email`
        );

        if(existingUser.recordset.length > 0){
            const existing = existingUser.recordset[0];

            if (existing.username === username || existing.email === email){
                return res.status(400).json({ user_error: "Username already exists", email_error: "Email already exists"})
            }

            if(existing.user === user){
                return res.status(400).json({user_error: "Username already exists"})
            }

            if (existing.email === email){
                return res.status(400).json({ email_error: "Email already exists"})
            }
        }

        const result = await pool
        .request()
        .input("username", sql.VarChar, username)
        .input("email", sql.VarChar, email)
        .input("password", sql.VarChar, hashedPassword)
        .query(
            `INSERT INTO Users (username, email, password) VALUES(@username, @email, @password)`
        );

        res.status(201).send(result);
    }catch(error){
        res.status(500).send({error: 'Error creating user', message:error.message})
    }
})


//Login
app.post('/login', async (req, res) => {
    try{
        const {username, password} = req.body;

        //Check if user exists
        const pool = await getDBConnection();
        const result = await pool.request()
        .input("username", sql.VarChar, username)
        .query(`SELECT * FROM Users WHERE username = @username`);

        const user = result.recordset[0];

        if(!user){
            return res.status(401).json({error:"Invalid username or password"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({error: "Invalid username or password"});
        }

        const accessToken = jwt.sign(
            {userId: user.id, username: user.username, email: user.email },
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: "15s"}
        );

        const refreshToken = jwt.sign(
            {userId: user.id, username: user.username, email: user.email },
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn: "7d"}
        );

        await pool.request()
        .input("userId", sql.Int, user.id)
        .input("refreshToken", sql.NVarChar, refreshToken)
        .query("UPDATE users SET refreshToken = @refreshToken WHERE id = @userId");

        res.json({access_token: accessToken, refresh_token: refreshToken});

    }catch(error){
        res.status(500).json({error: 'Error logging in', message: error.message});
    }
})

//REFRESH TOKEN API 
app.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
    }

    try {

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const pool = await getDBConnection();
        const result = await pool.request()
            .input("refreshToken", sql.NVarChar, refreshToken)
            .query("SELECT * FROM Users WHERE refreshToken = @refreshToken");

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }


            // Generate new access token
            const newAccessToken = jwt.sign(
                { userId: user.id, email: user.email }, 
                process.env.ACCESS_TOKEN_SECRET, 
                { expiresIn: '15s' }
            );

            const newRefreshToken = jwt.sign(
                { userId: user.id, email: user.email},
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            )

            await pool.request()
            .input("userId", sql.Int, user.id)
            .input("newRefreshToken", sql.NVarChar, newRefreshToken)
            .query("UPDATE Users SET refreshToken = @newRefreshToken WHERE id = @userId");

            res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        
    } catch (error) {
        res.status(403).json({ error: "Token refresh failed", message: error.message });
    }
});

//Logout
app.post('/logout', async(req, res) => {
    const { refreshToken } = req.body;

    if(!refreshToken){
        return res.status(400).json({error: 'No refresh token provided'});
    }

    try{
        const pool = await getDBConnection();
        await pool.request()
        .input("refreshToken", sql.NVarChar, refreshToken)
        .query("UPDATE Users SET refreshToken = NULL where refreshToken = @refreshToken");

        res.json({message: "Logged out successfully"});
    }catch(error){
        res.status(500).json({error: 'Logout failed', message: error.message});
    }
});


//Get all notes
app.get('/notes', async (req, res) => {
    try{
        const token = req.headers.authorization?.split(" ")[1];
        if(!token) return res.status(401).json({error: 'Unauthorized'})
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user_id = decoded.userId;
        const pool = await getDBConnection();

        const result = await pool.query(`SELECT * FROM Notes WHERE user_id = ${user_id}`);
        res.json(result.recordset);
    }catch(error){
        res.status(500).json({error: error.message});
    }
})

//Post notes
app.post('/notes', async(req, res) => {
    const{title, content, cardcolor, textcolor, positionLeft, positionTop } = req.body;
    if(!title || !content){
        res.status(400).json({error: 'Title and content are required'});
    }

    try{
        const token = req.headers.authorization?.split(" ")[1];
        if(!token) return res.status(401).json({error: 'Unauthorized'})
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user_id = decoded.userId;
        
        const id = Date.now().toString();
        const pool = await getDBConnection();
        const request = pool.request();

        const noteData = {
            id, 
            title, 
            content, 
            cardcolor, 
            textcolor, 
            positionLeft, 
            positionTop,
            user_id
        };

        request.input('id', sql.NVarChar, id);
        request.input('title', sql.NVarChar, title);
        request.input('content', sql.NVarChar, content);
        request.input('cardcolor', sql.NVarChar, cardcolor);
        request.input('textcolor', sql.NVarChar, textcolor);
        request.input('positionLeft', sql.Float, positionLeft);
        request.input('positionTop', sql.Float, positionTop);
        request.input('user_id', sql.Int, user_id);

        await request.query(`
           INSERT INTO Notes(id, title, content, cardcolor, textcolor, positionLeft, positionTop, user_id)
           VALUES (@id, @title, @content, @cardcolor, @textcolor, @positionLeft, @positionTop, @user_id) 
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
            return res.status(201).json('Content updated');
    }catch(error){
        return res.status(500).send(error.message);
    }
})

//Update note position
app.put('/notes/position/:id', async(req, res) => {
    const{id} = req.params;
    const{positionLeft, positionTop} = req.body;

    try{
        const result = await sql.query `
        UPDATE Notes SET
        positionLeft = ${positionLeft},
        positionTop = ${positionTop}
        WHERE id = ${id}
        `;

        if(result.rowsAffected[0] === 0){
            return res.status(404).json('Notes not found');
        }
        return res.status(201).json('Position updated');
    }catch(error){
        return res.status(500).send(error.message);
    }
})