const DB_NAME = 'StickyNotesDB';
const DB_VERSION = 3;
const NOTES_STORE = 'notes';
const DELETED_NOTES_STORE = 'deletedNotes';
let db;

function initDB(){
    return new Promise((resolve, reject)=> {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) =>{
            console.error('Error opening database:', event);
            reject(event);
        };

        request.onsuccess = (event)=>{
            db= event.target.result;
            console.log('Database opened');
            resolve(db);
        };

        request.onupgradeneeded = (event)=>{
            const db = event.target.result;

            if(!db.objectStoreNames.contains(NOTES_STORE)){
                const store = db.createObjectStore(NOTES_STORE, { keyPath: 'id'});
                store.createIndex('id', 'id', {unique: true});
            }

            if(!db.objectStoreNames.contains(DELETED_NOTES_STORE)){
                db.createObjectStore(DELETED_NOTES_STORE, { keyPath: 'id'});
            }
        };
    });
}

// Save a note to the database
function saveNote(note) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([NOTES_STORE], 'readwrite');
        const store = transaction.objectStore(NOTES_STORE);
        const request = store.put(note);
        
        request.onsuccess = () => {
            resolve(note);
        };
        
        request.onerror = (event) => {
            console.error('Error saving note:', event);
            reject(event);
        };
    });
}


// Get all notes from the database
function getAllNotes() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([NOTES_STORE], 'readonly');
        const store = transaction.objectStore(NOTES_STORE);
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = (event) => {
            console.error('Error getting notes:', event);
            reject(event);
        };
    });
}


// Delete a note from the database
function deleteNote(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([NOTES_STORE], 'readwrite');
        const store = transaction.objectStore(NOTES_STORE);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            resolve(id);
        };
        
        request.onerror = (event) => {
            console.error('Error deleting note:', event);
            reject(event);
        };
    });
}

function addDeletedNoteId(id){
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DELETED_NOTES_STORE], 'readwrite');
        const store = transaction.objectStore(DELETED_NOTES_STORE);
        const request = store.put({id});

        request.onsuccess = ()=>resolve(id);
        request.onerror = (event)=>{
            console.error('Error adding deleted note ID:', event);
            reject(event);
        }
    })
}

// Get all deleted note IDs
function getDeletedNoteIds() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DELETED_NOTES_STORE], 'readonly');
        const store = transaction.objectStore(DELETED_NOTES_STORE);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const ids = event.target.result.map(entry => entry.id);
            resolve(ids);
        };
        request.onerror = (event) => {
            console.error('Error getting deleted note IDs:', event);
            reject(event);
        };
    });
}

// Remove an ID after successful deletion on server
function removeDeletedNoteId(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([DELETED_NOTES_STORE], 'readwrite');
        const store = transaction.objectStore(DELETED_NOTES_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve(id);
        request.onerror = (event) => {
            console.error('Error removing deleted note ID:', event);
            reject(event);
        };
    });
}