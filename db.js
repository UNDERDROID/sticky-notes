const DB_NAME = 'StickyNotesDB';
const DB_VERSION = 1;
const NOTES_STORE = 'notes';
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
        };
    });
}

// Save a note to the database
function saveNote(note) {
    return new Promise((resolve, reject) => {
        note.updatedAt = new Date().toISOString();

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

function getUnsyncedNotes(){
    return new Promise((resolve, reject)=>{
        const transaction = db.transaction([NOTES_STORE], 'readonly');
        const store = transaction.objectStore(NOTES_STORE);
        const unsyncedNotes = [];

        const request = store.openCursor();

        request.onsuccess = (event)=>{
            const cursor = event.target.result;
            
            if(cursor){
                const note = cursor.value;
                if(note.isSynced===false){
                    unsyncedNotes.push(note);
                }
                cursor.continue();
            }else{
                resolve(unsyncedNotes);
            }
        }
        request.onerror = (event) =>{
            console.error('Error while getting unsynced notes:', event);
            reject(event);
        }
    })
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
