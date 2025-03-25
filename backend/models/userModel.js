const { pool, sql } = require("../config/db");

async function createUser(username, email, hashedPassword) {
    const request = (await pool).request();
    request.input("username", sql.NVarChar, username);
    request.input("email", sql.NVarChar, email);
    request.input("password", sql.NVarChar, hashedPassword);
    return request.query("INSERT INTO Users(username, email, password) VALUES(@username, @email, @password)")
}

async function getUserByUsernameOrEmail(username, email){
    const request = (await pool).request();
    request.input("username", sql.NVarChar, username)
    request.input("email", sql.NVarChar, email);
    return request.query(`
                        SELECT * FROM Users WHERE username = @username OR email = @email
        `);
}

async function getUserByUsername(username){
    const request = (await pool).request();
    request.input("username", sql.NVarChar, username)
    return request.query(`
        SELECT * FROM Users WHERE username = @username
        `);
}

async function updateRefreshToken(refreshToken, userId){
    const request = (await pool).request()
    request.input("UserId", sql.Int, userId)
    request.input("refreshToken", sql.NVarChar, refreshToken);
    return request.query(`
        UPDATE Users SET refreshToken = @refreshToken WHERE id = @userId
        `)
}

module.exports = {
    createUser,
    getUserByUsernameOrEmail,
    getUserByUsername,
    updateRefreshToken
}