const noteModel = require("../models/noteModel");
const jwt = require("jsonwebtoken");

async function getAllNotes(req, res){
      try{
            const token = req.headers.authorization?.split(" ")[1];
            if(!token) return res.status(401).json({error: 'Unauthorized'})
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user_id = decoded.userId;
    
            const result = await noteModel.getNotesByUser(user_id);
            res.json(result.recordset);
        }catch(error){
            res.status(500).json({error: error.message});
        }
}

 async function createNote(req, res) {
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

       await noteModel.postNote(id, title, content, cardcolor, textcolor, positionLeft, positionTop, user_id);

            res.status(201).json(noteData);
    }catch(error){
        res.status(500).send(error.message);
    }
};

async function updateTitle(req, res){
    const { id } = req.params;
    const { title } =req.body;
     try{
            const updatedData = {title}
            const result = await noteModel.updateNoteTitle(title, id);
                if(result.rowsAffected[0] === 0){
                    return res.status(404).send('Note not found');
                }
    
                res.status(201).json(updatedData);
        }catch(error){
            res.status(500).send(error.message);
        }
}


//Update note content
async function updateContent(req, res){
    const { id } = req.params;
    const { content } = req.body;
    try{
        const result = await noteModel.updateNoteContent(content, id);
            if(result.rowsAffected[0] === 0){
                return res.status(404).send('Note not found');
            }
            return res.status(201).json('Content updated');
    }catch(error){
        return res.status(500).send(error.message);
    }
}

//Update note position
async function updateNotePosition(req, res){
    const{id} = req.params;
    const{positionLeft, positionTop} = req.body;

    try{
        const result = await noteModel.updateNotePosition(positionLeft, positionTop, id);

        if(result.rowsAffected[0] === 0){
            return res.status(404).json('Notes not found');
        }
        return res.status(201).json('Position updated');
    }catch(error){
        return res.status(500).send(error.message);
    }
}

async function deleteNote(req, res){
            const { id } = req.params;
            try{
            await noteModel.deleteNoteById(id);
            res.status(200).json({message: 'Note deleted successfully'});
        }catch(error){
            res.status(500).send(error.message);
        }
}

module.exports = {
    createNote,
    getAllNotes,
    updateTitle,
    updateContent,
    updateNotePosition,
    deleteNote
}