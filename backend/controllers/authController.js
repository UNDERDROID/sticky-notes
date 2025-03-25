const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, getUserByUsernameOrEmail, getUserByUsername, updateRefreshToken } = require("../models/userModel");
require("dotenv").config();

async function register(req, res){

        try{
            const { username, email, password } =req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
        
            const existingUser = await getUserByUsernameOrEmail(username, email);
    
            if(existingUser.recordset.length > 0){
                const existing = existingUser.recordset[0];
    
                if (existing.username === username && existing.email === email){
                    return res.status(400).json({ user_error: "Username already exists", email_error: "Email already exists"})
                }
    
                if(existing.username === username){
                    return res.status(400).json({user_error: "Username already exists"})
                }
    
                if (existing.email === email){
                    return res.status(400).json({ email_error: "Email already exists"})
                }
            }
    
            const result = await createUser(username, email, hashedPassword);
    
            res.status(201).send(result);
        }catch(error){
            res.status(500).send({error: 'Error creating user', message:error.message})
        }
}

async function login(req, res){
     try{
            const {username, password} = req.body;
    
            //Check if user exists
            const result = await getUserByUsername(username);
    
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
                {expiresIn: "1h"}
            );
    
            const refreshToken = jwt.sign(
                {userId: user.id, username: user.username, email: user.email },
                process.env.REFRESH_TOKEN_SECRET,
                {expiresIn: "7d"}
            );
    
            await updateRefreshToken(refreshToken, user.id);
    
            res.json({access_token: accessToken, refresh_token: refreshToken});
    
        }catch(error){
            res.status(500).json({error: 'Error logging in', message: error.message});
        }
}

module.exports = {
    register,
    login
}