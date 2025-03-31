


// DOM Elements using jQuery
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

        setupPreviewNote();
        
        $notesContainer.droppable();
        
        $('#create').on('touchstart click', ()=>{
            $('#add-container').css('display', 'flex');
        })

        $('#notes-container').on('touchstart', ()=>{
            $('#add-container').css('display', 'none');
        })

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

function setupPreviewNote(){
    previewNoteData = {
        title: '',
        content: '',
        cardcolor: '#fff9c4',
        textcolor: '#000000'
    }
    previewNote();

}

// Improved mobile textarea interaction
$('body').on('touchstart', 'textarea', function(e) {
    // Ensure the textarea gets focus
    $(this).focus();

    // Prevent default touch behavior that might interfere with cursor placement
    e.preventDefault();

    // If text is already present, try to place cursor at touch point
    const textarea = this;
    const touch = e.originalEvent.touches[0];
    
    // Use setTimeout to ensure focus is set before attempting cursor placement
    setTimeout(() => {
        if (document.caretPositionFromPoint) {
            // Modern browsers
            const range = document.caretPositionFromPoint(touch.clientX, touch.clientY);
            if (range) {
                textarea.setSelectionRange(range.offset, range.offset);
            }
        } else if (document.caretRangeFromPoint) {
            // Webkit-based browsers
            const range = document.caretRangeFromPoint(touch.clientX, touch.clientY);
            if (range) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }, 0);
});

// Prevent scrolling when interacting with textareas
$('body').on('touchmove', 'textarea', function(e) {
    if ($(this).prop('scrollHeight') > $(this).prop('clientHeight')) {
        e.stopPropagation();
    }
});

function previewNote(){
    $addContainer.html(`<div class="sticky-note" id="preview-note" style="background-color: ${previewNoteData.cardcolor}">
            <div class="sticky-note-header">
                <textarea class="pre-sticky-note-title" placeholder="Title" style="color: ${previewNoteData.textcolor}"></textarea>
            </div>
            <textarea class="pre-sticky-note-content" placeholder="Content"></textarea>
        </div>
        <div class="button-container">
            <input type="text" id="card-color-picker" class="color-picker">
            <label for="card-color-picker">Card Color</label><br>
     
            <input type="text" id="text-color-picker" class="color-picker">
            <label for="card-color-picker">Text Color</label><br>

            <button class="save-note">Add Note</button>
        </div>
        `);

    

        $addContainer.find('.pre-sticky-note-title').val(previewNoteData.title);
        $addContainer.find('.pre-sticky-note-content').val(previewNoteData.content);

        $('#card-color-picker').spectrum({
            color: previewNoteData.cardcolor,
            showInput: true,
            showInitial: true,
            showPalette: true,
            showAlpha: false,
            preferredFormat: "hex",
            palette:[
                ['#fff9c4', '#bbdefb', '#c8e6c9'],
                ['#f8bbd0', '#e1bee7', '#ffe0b2'],
                ['#ffccbc', '#d7ccc8', '#cfd8dc']
            ],
            change: function(color){
                previewNoteData.cardcolor = color.toHexString();
                $('#preview-note').css('background-color', previewNoteData.cardcolor);
            }
        });

        $('#text-color-picker').spectrum({
            color: previewNoteData.textcolor,
            showInput: true,
            showInitial: true,
            showPalette: true,
            showAlpha: false,
            preferredFormat: "hex",
            palette:[
                ['#fff9c4', '#bbdefb', '#c8e6c9'],
                ['#f8bbd0', '#e1bee7', '#ffe0b2'],
                ['#ffccbc', '#d7ccc8', '#cfd8dc']
            ],
            change: function(color){
                previewNoteData.textcolor = color.toHexString();
                $('.pre-sticky-note-title').css('color', previewNoteData.textcolor);
                $('.pre-sticky-note-content').css('color', previewNoteData.textcolor);
            }
        });

        $addContainer.find('.pre-sticky-note-title').on('input', function(){
            previewNoteData.title = $(this).val();
        });

        $addContainer.find('.pre-sticky-note-content').on('input', function(){
            previewNoteData.content = $(this).val();
        })

        $addContainer.find('.save-note').on('click', function(){
            if(previewNoteData.title.trim()!=='' && previewNoteData.content.trim()!==''){
            addNewNote(previewNoteData);
           setupPreviewNote();
        }else{
            Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: 'Title and Content must not be empty',
                confirmButtonText: 'OK',
            })
        }
        })

}

function addNewNote(note){
    const noteData = {
        id: Date.now().toString(),
        title: note.title,
        content: note.content,
        position: {
            left: Math.random() * ($notesContainer.width() - 220) + 10,
            top: Math.random() * (400 - 220) + 10
        },
        cardcolor: note.cardcolor,
        textcolor: note.textcolor
    }
    notes.push(noteData);
    saveNote(noteData)
    .then(()=>{
        renderNote(noteData);
    })
}


function renderNote(note){
    const $noteElement = $(`
        <div class="sticky-note" id="note-${note.id}" style="background-color: ${note.cardcolor}">
        <div class="sticky-note-header">
        <textarea class="sticky-note-title" data-id="${note.id}" placeholder="Title" style="color: ${note.textcolor}">${note.title}</textarea>
        <button class="delete-note" data-id="${note.id}">x</button>
        </div>
        <textarea class="sticky-note-content" placeholder="content" data-id="${note.id}" style="color: ${note.textcolor}">${note.content}</textarea>
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
            cancel: 'textarea',
            stop: function(event, ui){
                $(this).css('cursor');
                const id =$(this).attr('id').replace('note-', '');
                updateNotePosition(id, ui.position.left, ui.position.top);
            }
        })

        $noteElement.find('.sticky-note-title').on('input', function(){
            const id = $(this).data('id').toString();
            updateNoteTitle(id, $(this).val());
        })

        $noteElement.find('.sticky-note-content').on('input',function(){
            const id = $(this).data('id').toString();
            updateNoteContent(id, $(this).val());
        })

        $noteElement.find('.delete-note').on('click touchstart', function(){
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