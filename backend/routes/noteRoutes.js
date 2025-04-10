const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

router.post("/createNote", noteController.createNote);
router.get("/getNotes", noteController.getAllNotes);
router.put("/updateTitle/:id", noteController.updateTitle);
router.put("/updateContent/:id", noteController.updateContent);
router.put("/updatePosition/:id", noteController.updateNotePosition);
router.put("/deleteNote/:id", noteController.updateDeletedNote);
router.post("/sync", noteController.syncNotes);

module.exports = router;