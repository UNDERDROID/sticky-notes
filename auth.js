$(document).ready(function(){
const API_URL = "http://localhost:3000";

//Login
$('#loginForm').submit( async function (e){
    e.preventDefault();
    const username = $('#loginUsername').val();
    const password = $('#loginPassword').val();

    try{
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        const data = await response.json();
        if(response.ok){
            localStorage.setItem('accessToken',data.access_token);
            localStorage.setItem('refreshToken',data.refresh_token);
            window.location.href = 'index.html';
        }else{
            alert('Login failed');
        }
    }catch(error){
        console.error(error);
    }
})
})