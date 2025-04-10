const { NVarChar } = require("mssql");
const {pool, sql} = require("../config/db");

async function getNotesByUser(user_id) {
    const request = (await pool).request();
    request.input("user_id", sql.Int, user_id);
    return request.query("SELECT * FROM Notes WHERE user_id = @user_id");
}

async function postNote(id, title, content, card_color, text_color, positionLeft, positionTop, user_id){
    const request = (await pool).request();
    request.input("id", sql.NVarChar, id);
    request.input("title", sql.NVarChar, title);
    request.input("content", sql.NVarChar, content);
    request.input("cardColor", sql.NVarChar, card_color);
    request.input("textColor", sql.NVarChar, text_color);
    request.input("positionLeft", sql.Float, positionLeft);
    request.input("positionTop", sql.Float, positionTop);
    request.input('userId', sql.Int, user_id);

    return request.query
        (`
        INSERT INTO Notes(id, title, content, cardcolor, textcolor, positionLeft, positionTop, user_id) 
        VALUES(@id, @title, @content, @cardColor, @textColor, @positionLeft, @positionTop, @userId);
        `)
}

async function updateNoteTitle(noteTitle, id){
    const request = (await pool).request();
    request.input("noteTitle", sql.NVarChar, noteTitle);
    request.input("noteId", sql.NVarChar, id);
    return request.query(`
        UPDATE Notes SET title = @noteTitle WHERE id = @noteId   
        `)
}

async function updateNoteContent(noteContent, id){
    const request = (await pool).request();
    request.input("noteContent", sql.NVarChar, noteContent);
    request.input("noteId", sql.NVarChar, id);
    return request.query(`
        UPDATE Notes SET content =@noteContent WHERE id = @noteId
        `)
}

async function updateNotePosition(positionLeft, positionTop, id){
    const request = (await pool).request();
    request.input("positionLeft", sql.Float, positionLeft);
    request.input("positionTop",sql.Float, positionTop);
    request.input("noteId", sql.NVarChar, id);
    return request.query(`
            UPDATE Notes SET positionLeft = @positionLeft, positionTop = @positionTop WHERE id = @noteId
        `)
}

async function deleteNoteById(noteId){
    const request = (await pool).request();
    request.input("id", sql.NVarChar, noteId);

    return request.query
    (`
        DELETE FROM Notes WHERE id=@id
    `)
}

module.exports = {
    getNotesByUser,
    postNote,
    updateNoteTitle,
    updateNoteContent,
    updateNotePosition,
    deleteNoteById
}