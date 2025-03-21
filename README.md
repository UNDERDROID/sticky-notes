# Sticky Notes+ Phase-2
Sticky Notes+ is a simple sticky note site that allows user to create, edit, delete and manage their notes.  With features like customizable colors, persistent storage, and user authentication, StickyNotes+ provides an efficient way to organize your thoughts and tasks.

## Features:
- **Create, Edit, and Delete Notes:** Users can easily create, edit, or delete sticky notes.
- **Customizable Colors:** Choose from a variety of colors using spectrum color-picker to customize the appearance of your notes.
- **Persistent Storage:** Notes are saved in the Microsoft SQL Server so that users can access them anytime.
- **User Authentication:** Each user has their own account, so their notes are private and secure. Users can also sign in with google.

## Technologies Used
**Frontend:**  
- jQuery
- HTML/CSS
  
**Backend:**  
- Node.js
- Express.js
- Microsoft SQL Server
  
**Authentication:** JWT (JSON Web Tokens)

# Getting Started
## Prerequisites  
Node.js (Version 14+)  
Microsoft SQL Server (For database management)  

## Installation  
**Clone the repository:**
```bash
git clone --branch Phase-2 --single-branch https://github.com/UNDERDROID/sticky-notes.git
cd Sticky Notes+
```
**Install dependencies:**
```bash
npm install
```
**Set up the database:**
Create a database in SQL named StickyNotesDB. 
In the database, create these tables:  

**Notes**
```SQL
CREATE TABLE Notes (
    id NVARCHAR IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    cardcolor NVARCHAR(20),
    textcolor NVARCHAR(20),
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);
```

**Users**
```SQL
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    refreshToken NVARCHAR NOT NULL
);
```


Example:   
**.env:**
```javascript
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SERVER=localhost
DB_DATABASE=sticky_notes_db
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
PORT=3000
ACCESS_TOKEN_SECRET = your_access_token_secret
REFRESH_TOKEN_SECRET = your_refresh_token_secret

GOOGLE_CLIENT_ID = your_google_client_id
GOOGLE_CLIENT_SECRET = your_google_client_secret
```

Start the backend server:
```
cd backend
npm start server.js
```

## Usage:
**Sign up:**   
Create a new account by providing a username and password. 

**Login:**   
Log in with your credentials to access your notes.  

**Manage Notes:**  
- Create new notes with custom colors.  
- Edit or delete existing notes.  
- Persistent Data: Your notes will be stored and persisted in the database even after you log out or refresh the page.

