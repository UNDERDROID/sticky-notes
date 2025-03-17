

// DOM Elements using jQuery
const $notesContainer = $('#notes-container');
const $addContainer = $('#add-container');


// State
let notes = [];
let previewNoteData = null;
let colorPalette = [
    ['#fff9c4', '#bbdefb', '#c8e6c9'],
    ['#f8bbd0', '#e1bee7', '#ffe0b2'],
    ['#ffccbc', '#d7ccc8', '#cfd8dc']
];
const debounceTimers = {};

// Initialize the application
async function initApp() {
    try {
        // Initialize the database
        await initDB();
        
        // Load saved notes
        await loadNotes();

        setupPreviewNote();
        

        $notesContainer.droppable();
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

async function loadNotes() {
    try{
        const response = await fetch('http://localhost:3000/notes');
        notes = await response.json();
         console.log(notes);
        // notes = await getAllNotes();
    
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

function previewNote(){


    $addContainer.html(`<div class="sticky-note" id="preview-note" style="background-color: ${previewNoteData.cardcolor}">
            <div class="sticky-note-header">
                <textarea class="sticky-note-title" placeholder="Title" style="color: ${previewNoteData.textcolor}"></textarea>
            </div>
            <textarea class="sticky-note-content" placeholder="Content"></textarea>
        </div>
        <div class="button-container">
            <input type="text" id="card-color-picker" class="color-picker">
            <label for="card-color-picker">Card Color</label><br>
     
            <input type="text" id="text-color-picker" class="color-picker">
            <label for="card-color-picker">Text Color</label><br>

            <button class="save-note">Add Note</button>
        </div>
        `);

    

        $addContainer.find('.sticky-note-title').val(previewNoteData.title);
        $addContainer.find('.sticky-note-content').val(previewNoteData.content);

        $('#card-color-picker').spectrum({
            color: previewNoteData.cardcolor,
            showInput: true,
            showInitial: true,
            showPalette: true,
            showAlpha: false,
            preferredFormat: "hex",
            palette: colorPalette,
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
            palette: colorPalette,
            change: function(color){
                previewNoteData.textcolor = color.toHexString();
                $('.sticky-note-title, .sticky-note-content').css('color', previewNoteData.textcolor);
            }
        });

        $addContainer.find('.sticky-note-title').on('input', function(){
            previewNoteData.title = $(this).val();
        });

        $addContainer.find('.sticky-note-content').on('input', function(){
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

async function addNewNote(note){
    const noteData = {
        id: Date.now().toString(),
        title: note.title,
        content: note.content,
        positionLeft: Math.random() * ($notesContainer.width() - 220) + 10,
        positionTop: Math.random() * (400 - 220) + 10,
        cardcolor: note.cardcolor,
        textcolor: note.textcolor
    }
    
    try{
        const response = await fetch('http://localhost:3000/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noteData)
        });
        if(!response.ok){
            throw new Error(`Failed to save note: ${response.statusText}`);
        }
        const savedNote = await response.json();
        
        notes.push(savedNote);
        console.log('Saved Note:', savedNote);
        renderNote(savedNote);
    }catch(error){
        console.log('Error saving note:', error);
    }
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
            'left': `${note.positionLeft}px`,
            'top': `${note.positionTop}px`
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

 function updateNoteTitle(id, newTitle){
    const timerKey = `${id}_title`;
    const noteIndex = notes.findIndex(note => note.id === id);

    if(noteIndex!==-1){
        notes[noteIndex].title=newTitle;

        //Clear any existing timeouts for this note
        if(debounceTimers[timerKey]){
            clearTimeout(debounceTimers[timerKey]);
        }

        debounceTimers[timerKey] = setTimeout(async() => {
            try{
        const response = await fetch(`http://localhost:3000/notes/title/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({title: newTitle})
        })
        if(!response.ok){
            throw new Error(`Failed to update title: ${response.statusText}`);
        }
        delete debounceTimers[timerKey];

    }catch(error){
        console.error('Error updating title:', error);
    }
}, 5000);
}
}

function updateNoteContent(id, newContent){
const timerKey = `${id}_content`;
const noteIndex = notes.findIndex(note => note.id === id);

if(noteIndex!==-1){
    notes[noteIndex].content=newContent;

    if(debounceTimers[timerKey]){
        clearTimeout(debounceTimers[timerKey]);
    }

    debounceTimers[timerKey] = setTimeout(async()=>{
        try{
            const response = await fetch(`http://localhost:3000/notes/content/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({content: newContent})
            });

            if(!response.ok){
                throw new Error(`Failed to update note: ${response.statusText}`);
            }
            delete debounceTimers[timerKey];
        }catch(error){
            console.error('Error updating content', error);
        }
    }, 5000);
}
}


 function updateNotePosition(id, left, top){
 const timerKey = `${id}_position`;
 const noteIndex = notes.findIndex(note => note.id === id);
 if(noteIndex!==-1){
    notes[noteIndex].positionLeft = left;
    notes[noteIndex].positionTop = top;

    if(debounceTimers[timerKey]){
        clearTimeout(debounceTimers[timerKey])
    }

    debounceTimers[timerKey] = setTimeout (async() =>{
        try{
    const response = await fetch(`http://localhost:3000/notes/position/${id}`, {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({positionLeft: left, positionTop: top})
    });

    if(!response.ok){
        throw new Error(`Error updating position: ${response.statusText}`);
    }
    delete debounceTimers[timerKey];
}catch(error){
    console.error('Error updating position', error)
}
 }, 3000);
}   
}

async function removeNote(id){
try{
 const response = await fetch(`http://localhost:3000/notes/${id}`,{
    method: 'DELETE'
 });
 if(!response.ok) throw new Error('Failed to delete note')
const noteElement = $(`#note-${id}`);
 if(noteElement){
    noteElement.remove();
    console.log('Removed ')
 }
}catch(error){
    console.error('Error deleting note', error);
}
}



$(document).ready(initApp);
