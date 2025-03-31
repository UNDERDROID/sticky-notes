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

            //Sync unsaved notes when online
            if(navigator.onLine){
                syncOfflineNotes();
            }
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

// Cache unsaved notes locally (for offline mode)
function cacheNoteOffline(note) {
    let offlineNotes = JSON.parse(localStorage.getItem('offlineNotes')) || [];
    offlineNotes.push(note);
    localStorage.setItem('offlineNotes', JSON.stringify(offlineNotes));
}

// Cache deleted note IDs locally (for offline mode)
function cacheDeleteOffline(id) {
    let offlineDeletes = JSON.parse(localStorage.getItem('offlineDeletes')) || [];
    offlineDeletes.push(id);
    localStorage.setItem('offlineDeletes', JSON.stringify(offlineDeletes));
}

// Sync offline notes when online
function syncOfflineNotes() {
    let offlineNotes = JSON.parse(localStorage.getItem('offlineNotes')) || [];
    let offlineDeletes = JSON.parse(localStorage.getItem('offlineDeletes')) || [];

    offlineNotes.forEach((note) => saveNote(note));
    offlineDeletes.forEach((id) => deleteNote(id));

    localStorage.removeItem('offlineNotes');
    localStorage.removeItem('offlineDeletes');
}

// Listen for online status to sync data
window.addEventListener('online', syncOfflineNotes);