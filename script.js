

// DOM Elements using jQuery
const $notesContainer = $('#notes-container');
const $addContainer = $('#add-container');
const API_URL = 'http://localhost:3000';
const REFRESH_URL = `${API_URL}/refresh`;
const GET_NOTES_URL = `${API_URL}/api/notes/getNotes`;
const CREATE_NOTE_URL = `${API_URL}/api/notes/createNote`;
const UPDATE_TITLE_URL = `${API_URL}/api/notes/updateTitle`;
const UPDATE_CONTENT_URL = `${API_URL}/api/notes/updateContent`;
const UPDATE_POSITION_URL = `${API_URL}/api/notes/updatePosition`;
const DELETE_NOTE_URL = `${API_URL}/api/notes/deleteNote`;

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
        const accessToken = localStorage.getItem('accessToken');

        window.addEventListener('offline', () => {
            showToast('Connection Lost', 'error');
        });
          
        window.addEventListener('online', () => {
            showToast('<i class="fa-solid fa-wifi" style="margin-right: 8px;"></i> Back Online', 's');
        });

        if(!accessToken){
            window.location.href='login.html';
        }
        // Initialize the database
        await initDB();
        
        // Load saved notes
        await loadNotes();

        // Sync notes
        window.addEventListener('online', syncNotes);

        await syncNotes();

        setupPreviewNote();
        $('.validation-icon-title-validation').hide();
        $('.validation-icon-content-validation').hide();   
        
        $('#create').on('touchstart click', ()=>{
        $('#add-container').css('display', 'flex');
        })

        $('#notes-container').on('touchstart', ()=>{
            $('#add-container').css('display', 'none');
            setupPreviewNote();
            $('.validation-icon-title-validation').hide();
            $('.validation-icon-content-validation').hide();   
        })

        $notesContainer.droppable();
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

async function fetchWithAuth(url, options = {}){
    let accessToken = localStorage.getItem('accessToken');

    options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${accessToken}`,
        'ngrok-skip-browser-warning': 'true'

    };

    let response = await fetch(url, options);

    //If access token is expired
    if(response.status === 401 || response.status === 500){
        console.log('Access token expired. Refreshing...');

        const refreshSuccess = await refreshAccessToken();
        if(!refreshSuccess){
            return Promise.reject("Session expired. Login again");
        }

        //retry with new token
        accessToken = localStorage.getItem("accessToken");
        options = {
            ...options,
            headers: {
                ...options.headers,
                "Authorization": `Bearer ${accessToken}`
            }
        };
        response = await fetch(url, options);
    }
    return response;
}

async function refreshAccessToken(){
    console.log("==refreshAccessToken==");
    try{
        const refreshToken = localStorage.getItem('refreshToken');
        
        const response = await fetch(REFRESH_URL,{
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            // credentials: 'include',
            body: JSON.stringify({refreshToken})
        });

        const data = await response.json();
        if (response.ok){
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            console.log('access token refreshed');
            return true;
        } else{
            console.log('refresh token expired. redirecting to login');
            localStorage.removeItem("accessToken");
            // window.location.href = "login.html";
            return false;
        }
    }catch(error){
        console.error("Error refreshing access token:", error);
        // window.location.href = "login.html";
        return false;
    }
}

$('#logoutBtn').click(function () {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "login.html"; // Redirect to login page
});


async function loadNotes() {
    try{
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetchWithAuth(GET_NOTES_URL);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', response.status, errorText);
            throw new Error(`Server returned ${response.status}: ${errorText.substring(0, 100)}...`);
        }
        
        const responseText = await response.text();
        try {
            notes = JSON.parse(responseText);
            $.each(notes, (index, note) => {
                renderNote(note);
            });
        } catch (e) {
            console.error('Failed to parse response as JSON:', responseText.substring(0, 200));
            throw new Error('Invalid JSON response');
        }
    } catch(error) {
        console.error('Error loading notes', error);
        showToast("Error loading notes", "error");
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
                <textarea class="pre-sticky-note-title" placeholder="Title" style="color: ${previewNoteData.textcolor}"></textarea>
                <span class="validation-icon-title-validation" title="Title cannot be empty">
                <i class="fas fa-exclamation-circle" id="title-error" style="color: red;"></i>
</span>
            </div>
            <textarea class="pre-sticky-note-content" placeholder="Content"></textarea>
            <span class="validation-icon-content-validation" title="Content cannot be empty">
            <i class="fas fa-exclamation-circle" style="color: red;"></i></span>
        </div>
        <div class="button-container">
            <input type="text" id="card-color-picker" class="color-picker">
            <label for="card-color-picker">Card Color</label><br>
     
            <input type="text" id="text-color-picker" class="color-picker">
            <label for="card-color-picker">Text Color</label><br>   

            <button class="save-note">Add Note</button>
        </div>  
            <p id="error-message-title" style="color: red; display: none; text-align: left; margin-top: 5px;"></p>
            <p id="error-message-content" style="color: red; display: none; text-align: left; margin-top: 5px;"></p>
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
                $('.pre-sticky-note-title').css('color', previewNoteData.textcolor);
                $('.pre-sticky-note-content').css('color', previewNoteData.textcolor);
            }
        });

        $addContainer.find('.pre-sticky-note-title').on('input', function(){
            previewNoteData.title = $(this).val();
            $('.validation-icon-title-validation').hide();
            $('#error-message-title').text('').hide();
            $('.pre-sticky-note-title').css({
                "border": "none"
            })
        });

        $addContainer.find('.pre-sticky-note-content').on('input', function(){
            previewNoteData.content = $(this).val();
            $('.validation-icon-content-validation').hide();
            $('#error-message-content').text('').hide();
            $('.pre-sticky-note-content').css({
                "border": "none"
            })
        })

        $addContainer.find('.save-note').on('click', function()
        {
            if(previewNoteData.title.trim()==''){
                $('#error-message-title').text('Title must not be empty').show();
                $('.validation-icon-title-validation').show().css({
                    "margin-left": "4px"
                });
                $('.pre-sticky-note-title').css({
                    "border": "1px solid red",
                    "width": "100%",
                    "height": "25px",
                    "border-radius": "5px",
                    "padding-left": "5px"
                });

            }
            if(previewNoteData.content.trim()==''){
                $('#error-message-content').text('content must not be empty').show();
                $('.validation-icon-content-validation').show().css({
                    "margin-top": "2px"
                });
                $('.pre-sticky-note-content').css({
                    "border": "1px solid red",
                    "border-radius": "5px",
                    "padding": "revert"
                })
            }
        if(previewNoteData.title.trim()!=='' && previewNoteData.content.trim()!==''){
           
            addNewNote(previewNoteData);
            setupPreviewNote();
            $('.validation-icon-title-validation').hide();
            $('.validation-icon-content-validation').hide(); 
        }else{
        }
        })

}

async function addNewNote(note){
    const id = Date.now().toString();
    const noteData = {
        id: id,
        title: note.title,
        content: note.content,
        positionLeft: Math.random() * (90 - 5) + 5,
        positionTop: Math.random() * (90 - 5) + 5,
        cardcolor: note.cardcolor,
        textcolor: note.textcolor,
        isSynced: navigator.onLine
    };

    try{ 
    
        await saveNote(noteData).then(()=>{
            renderNote(noteData);
        });
    
        const response = await fetchWithAuth(CREATE_NOTE_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(noteData)
        });

        if(!response.ok){
            throw new Error(`Failed to save note: ${response.statusText}`);
        }
        
        notes.push(savedNote);
        console.log('Saved Note:', savedNote);
        renderNote(savedNote);

        return response;
    }catch(error){
        console.log('Error saving note:', error);
        return {ok: false, reason: 'error', error};
    }
}

async function syncNotes() {
    if(!navigator.onLine) return;
    try{
        const localNotes = await getAllNotes();

        const response = await fetchWithAuth(GET_NOTES_URL);

        let serverNotes = [];
        if(response.ok){
        serverNotes = await response.json();
        }

        const localMap = new Map(localNotes.map(note => [note.id, note]));
        const serverMap = new Map(serverNotes.map(note => [note.id, note]));

        for(const localNote of localNotes){
            if(!serverMap.has(localNote.id)){
                await fetchWithAuth(CREATE_NOTE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(localNote),
                })
            }
        }

        for(const localNote of localNotes){
            const serverNote = serverMap.get(localNote.id);
            if(!serverNote) continue;

            if(localNote.title!==serverNote.title){
                updateNoteTitle(localNote.id, localNote.title);
            }

            if(localNote.content!==serverNote.content){
                updateNoteContent(localNote.id, localNote.content);
            }

            if(localNote.positionLeft!==serverNote.positionLeft || localNote.positionTop!==serverNote.positionTop){
                console.log("left:", localNote.positionLeft);
                console.log("top:", localNote.positionTop);
                updateNotePosition(localNote.id, localNote.positionLeft, localNote.positionTop);
            }
        }

        const deletedIds = await getDeletedNoteIds();
        for(const id of deletedIds){
            await removeNote(id)
        }

        console.log("localNotes:", localNotes);
        console.log("serverNotes:",serverNotes)
    }catch(error){
        console.log("Error syncing notes", error);
    }
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

function renderNote(note){
    if($(`#note-${note.id}`).length>0){
        return;
    }

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
            'left': `${note.positionLeft}%`,
            'top': `${note.positionTop}%`
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
        });

        $noteElement.find('.sticky-note-title').on('input', function(){
            const id = $(this).data('id').toString();
            updateNoteTitle(id, $(this).val());
        })

        $noteElement.find('.sticky-note-content').on('input',function(){
            const id = $(this).data('id').toString();
            updateNoteContent(id, $(this).val());
        })

        $noteElement.find('.delete-note').on('click touchstart', function(){
            removeNote(note.id);
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
        saveNote(notes[noteIndex]);

        const response = await fetch(`${UPDATE_TITLE_URL}/${id}`, {
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
}, 3000);
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
            saveNote(notes[noteIndex]);

            const response = await fetch(`${UPDATE_CONTENT_URL}/${id}`, {
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
    }, 3000);
}
}

 function updateNotePosition(id, left, top){
 const timerKey = `${id}_position`;
 const containerWidth = $notesContainer.width();
 const containerHeight = $notesContainer.height();
 const leftPercent = (left / containerWidth) * 100;
 const topPercent = (top / containerHeight) * 100;

 const noteIndex = notes.findIndex(note => note.id === id);
 if(noteIndex!==-1){
    notes[noteIndex].positionLeft = leftPercent;
    notes[noteIndex].positionTop = topPercent;

    if(debounceTimers[timerKey]){
        clearTimeout(debounceTimers[timerKey])
    }

    debounceTimers[timerKey] = setTimeout (async() =>{
        try{
            saveNote(notes[noteIndex]);
    const response = await fetch(`${UPDATE_POSITION_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({positionLeft: leftPercent, positionTop: topPercent})
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
    await deleteNote(id);
    const removedNote = $(`#note-${id}`);
if(removedNote){
    await addDeletedNoteId(id);
    removedNote.remove();
}
        
 const response = await fetch(`${DELETE_NOTE_URL}/${id}`,{
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

function showToast(html, type = "error"){
    const div = document.createElement("div");
    div.innerHTML=html;
    Toastify({
        node: div,
        duration: 3000,
        gravity: "top", //position top
        position: "left",
        style: {
            background: type === "error" ? "#ff3e3e" : "#28a745",
            borderRadius: "5px"
        },
        stopOnFocus: true, //Stop if user hovers over error
    }).showToast();
}

$(document).ready(initApp);
