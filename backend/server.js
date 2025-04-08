const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const initializeTable = require("./tblinit");
const os = require("os");
const interfaces = os.networkInterfaces();
require('dotenv').config(); 

const app = express();

app.use(session({ secret: "your_secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const corsOptions = {
    origin: [
        'http://127.0.0.1:5500', 
        'http://localhost:5500', 
        'https://smooth-lizards-care.loca.lt',
        'https://a3f4-202-166-217-15.ngrok-free.app'
    ],
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");

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
    const pool = await sql.connect(dbconfig);
    console.log('Connected to the database');
    await initializeTable();
    return pool;
    }catch(err){
        console.error("DB Connection Error:", err);
        throw err;
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/callback",
        },
        //Check if user exists in DB if not create a new 
        async(accessToken, refreshToken, profile, done) =>{
       try{
        const pool = await getDBConnection();
        const email = profile.emails[0].value;
        const name = profile.displayName;
        
        //Check if user exists
        let result = await pool.request()
                    .input('email', sql.VarChar, email)
                    .query('SELECT id, email FROM Users WHERE email = @email');

                    if(result.recordset.length === 0){
                        await pool.request()
                        .input('username', sql.VarChar, email.split("@")[0])
                        .input('email',sql.VarChar, email)
                        .input('password' , sql.VarChar, '') //No password for google sign in
                        .query(`INSERT INTO Users (username, email, password) VALUES(@username, @email, @password)`);

                        result = await pool
                        .request()
                        .input("email", sql.VarChar, email)
                        .query("SELECT id, email FROM Users WHERE email = @email");
                    }
                    const user = result.recordset[0];
                    
                    done(null, user ); 
       }catch(error){
        done(error, null);
       }
    }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser(async (user, done) => {
    try {
      const pool = await getDBConnection();
      const result = await pool.request()
        .input('id', sql.Int, user.id)
        .query('SELECT id, email, username FROM Users WHERE id = @id');
      
      if (result.recordset.length === 0) {
        return done(new Error('User not found'), null);
      }
      
      done(null, result.recordset[0]);
    } catch (error) {
      done(error, null);
    }
  });
  
// Google Auth Route
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login", failureMessage: true,}),
    async (req, res) => {
        const user =req.user;
        const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15s" });  
        const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });  
        const pool= await getDBConnection();
        await pool.request()
        .input("refreshToken", sql.VarChar, refreshToken)
        .query(`UPDATE Users SET refreshToken = @refreshToken WHERE email = '${user.email}'`);

        console.log("Authenticated user:", req.user);
        console.log("Session data:", req.session.passport);
        res.redirect(`http://localhost:5500/login.html?accessToken=${accessToken}&refreshToken=${refreshToken}`); 
    }
);

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

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
                { expiresIn: '1h' }
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
