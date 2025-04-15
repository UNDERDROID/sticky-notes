const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

router.post("/createNote", noteController.createNote);
router.get("/getNotes", noteController.getAllNotes);
router.patch("/updateTitle/:id", noteController.updateTitle);
router.patch("/updateContent/:id", noteController.updateContent);
router.patch("/updatePosition/:id", noteController.updateNotePosition);
router.patch("/deleteNote/:id", noteController.updateDeletedNote);
router.patch("/sync", noteController.syncNotes);

module.exports = router;