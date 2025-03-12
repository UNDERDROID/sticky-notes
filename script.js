// DOM Elements using jQuery
const $addNoteBtn = $('#add-note');
const $defaultColorSelect = $('#default-color');
const $notesContainer = $('#notes-container');
const $addContainer = $('#add-container');

// State
let notes = [];
let previewNoteData = null;

// Initialize the application
async function initApp() {
    try {
        // Initialize the database
        await initDB();
        
        // Load saved notes
        await loadNotes();
        
        $('#add-container').hide();
        // Set up event listeners
        $addNoteBtn.on('click', previewNote);
        
        $notesContainer.droppable();
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

async function loadNotes() {
    try{
        notes = await getAllNotes();
    
    $.each(notes, (index, note)=>{
        renderNote(note);
    })
    }catch(error){
        console.error('Error loading notes', error);
    }   
}

function previewNote(){
    $addContainer.show();

    previewNoteData = {
        title: '',
        content: '',
        color: $defaultColorSelect.val()
    }

    $addContainer.html(`<div class="sticky-note ${previewNoteData.color}" id="preview-note">
            <div class="sticky-note-header">
                <textarea class="sticky-note-title" placeholder="Title"></textarea>
            </div>
            <textarea class="sticky-note-content" placeholder="Content"></textarea>
        </div>
        <div class="button-container">
        <button class="save-note">Add Note</button>
        <button class="cancel-note">Cancel</button>
        </div>
        `);

        $addContainer.find('.sticky-note-title').on('input', function(){
            previewNoteData.title = $(this).val();
        });

        $addContainer.find('.sticky-note-content').on('input', function(){
            previewNoteData.content = $(this).val();
        })

        $addContainer.find('.save-note').on('click', function(){
            addNewNote(previewNoteData);

            if(addNewNote){
            previewNoteData = null;
            $addContainer.hide();
        }
        })

        $addContainer.find('.cancel-note').on('click', function(){
            previewNoteData = null;
            $addContainer.hide();
        })
}

function addNewNote(note){
    $('#add-container').show();
    const color = $defaultColorSelect.val();
    console.log(color);
    const noteData = {
        id: Date.now().toString(),
        title: note.title,
        content: note.content,
        position: {
            left: Math.random() * ($notesContainer.width() - 220) + 10,
            top: Math.random() * (400 - 220) + 10
        },
        color: note.color
    }
    notes.push(noteData);
    saveNote(noteData).then(()=>{
        renderNote(noteData);
    })
}

function renderNote(note){
    const $noteElement = $(`
        <div class="sticky-note ${note.color}" id="note-${note.id}">
        <div class="sticky-note-header">
        <textarea class="sticky-note-title" data-id="${note.id}" placeholder="Title">${note.title}</textarea>
        <button class="delete-note" data-id="${note.id}">x</button>
        </div>
        <textarea class="sticky-note-content" placeholder="content" data-id="${note.id}">${note.content}</textarea>
        </div>
        `)
        
        $noteElement.css({
            'left': `${note.position.left}px`,
            'top': `${note.position.top}px`
        });

        $notesContainer.append($noteElement);

        $noteElement.draggable({
            containment: 'parent',
            stack: '.sticky-note',
            stop: function(event, ui){
                const id =$(this).attr('id').replace('note-', '');
                updateNotePosition(id, ui.position.left, ui.position.top);
            }
        });

        $noteElement.find('.sticky-note-title').on('input', function(){
            const id = $(this).data('id').toString();
            updateNoteTitle(id, $(this).val());
        })

        $noteElement.find('.sticky-note-content').on('input',function(){
            const id = $(this).data('id').toString();
            updateNoteContent(id, $(this).val());
        })

        $noteElement.find('.delete-note').on('click', function(){
            const id = $(this).data('id');
            removeNote(id);
        })
}

function updateNoteTitle(id, title){
    const noteIndex = notes.findIndex(note => note.id === id)
    if(noteIndex!==-1){
        notes[noteIndex].title=title;
        saveNote(notes[noteIndex]);
    }
}

function updateNoteContent(id, content){
const noteIndex = notes.findIndex(note => note.id === id);
if(noteIndex!==-1){
    notes[noteIndex].content=content;
    saveNote(notes[noteIndex]);
    }
}


function updateNotePosition(id, left, top){
 const noteIndex = notes.findIndex(note => note.id === id);
 if(noteIndex!==-1){
    notes[noteIndex].position.left = left;
    notes[noteIndex].position.top = top;
    saveNote(notes[noteIndex]);
 }   
}

function removeNote(id){
    console.log('Attempting to remove note');
    console.log(notes);
    const noteId=id.toString();
    const noteIndex = notes.findIndex(note => note.id === noteId);
    console.log('Note index in array:', noteIndex);

    if(noteIndex!==-1){
        notes.splice(noteIndex, 1);
        deleteNote(noteId).then(()=>{
            console.log('Note removed from DB, now removing from DOM:', noteId);
            $(`#note-${id}`).remove();
        }).catch(error => {
            console.error('Error in delete note', error);
        });
    }else{
        console.error('Note not found in array:',id);
    }
}



$(document).ready(initApp);
