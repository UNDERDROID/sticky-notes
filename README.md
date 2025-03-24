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
**Steps to connect to MSSQL**  
- Firstly connect using Windows Authentication.
- Right click the server and head to properties. In the properties go to security and select SQL Server and Windows Authentication mode in the Server Authentication and click OK.
- In the object explorer navigate to Security and Right click the Logins folder and click New Login then select SQL Server authentication and enter Login name and password then click OK.
- Now connect using SQL authentication using the login name and password you just created.


Create a database in SQL named StickyNotesDB. 



Example:   
**.env:**
```javascript
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SERVER=localhost
DB_DATABASE=StickyNotesDB
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

