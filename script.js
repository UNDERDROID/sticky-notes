// DOM Elements using jQuery
const $addNoteBtn = $('#add-note');
const $defaultColorSelect = $('#default-color');
const $notesContainer = $('#notes-container');

// State
let notes = [];

// Initialize the application
async function initApp() {
    try {
        // Initialize the database
        await initDB();
        
        // Load saved notes
        await loadNotes();
        
        // Set up event listeners
        $addNoteBtn.on('click', addNewNote);
        
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

function addNewNote(){
    const color = $defaultColorSelect.val();
    console.log(color);
    const note = {
        id: Date.now().toString(),
        content: '',
        position: {
            left: Math.random() * ($notesContainer.width() - 220) + 10,
            top: Math.random() * (400 - 220) + 10
        },
        color: color
    }
    notes.push(note);
    saveNote(note).then(()=>{
        renderNote(note);
    })
}

function renderNote(note){
    const $noteElement = $(`
        <div class="sticky-note ${note.color}" id="note-${note.id}">
        <div class="sticky-note-header">
        <input type="text" class="sticky-note-title" placeholder="Title"></input>
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

        $noteElement.find('.delete-note').on('click', function(){
            const id = $(this).data('id');
            removeNote(id);
        })
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
