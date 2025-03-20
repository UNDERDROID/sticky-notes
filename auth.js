$(document).ready(function () {
    const API_URL = "http://localhost:3000";

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    $('.error-icon, .error-message').hide(); // Hide errors on load

    // Reset errors when user types
    $('#registerUsername, #registerEmail, #registerPassword').on('input', function () {
        $(this).css("border", "");
        $(this).siblings('.error-message').hide(); // Hide only the relevant error
    });

    // Login Form Submission
    $('#loginForm').submit(async function (e) {
        e.preventDefault();
        const username = $('#loginUsername').val();
        const password = $('#loginPassword').val();

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('accessToken', data.access_token);
                localStorage.setItem('refreshToken', data.refresh_token);
                window.location.href = 'index.html';
            } else {
                if(response.error = "Invalid username or password" ){
                    $('#invalid-error').show();
                }
                
            }
        } catch (error) {
            console.error(error);
        }
    });

    // Register Form Submission
    $('#registerForm').submit(async function (e) {
        e.preventDefault();
        let isValid = true;

        // Reset errors before validation
        $('.error-message').hide();
        $('#registerUsername, #registerEmail, #registerPassword').css("border", "");

        const username = $('#registerUsername').val().trim();
        const email = $('#registerEmail').val().trim();
        const password = $('#registerPassword').val().trim();
       
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = 'login.html';
            } else {
                // Show existing email or username errors together
                if (data.user_error === "Username already exists") {
                    $('#registerUsername').css("border", "1px solid red");
                    $('#username-exists-error').show();
                    isValid = false;
                }
                if (data.email_error === "Email already exists") {
                    $('#registerEmail').css("border", "1px solid red");
                    $('#email-exists-error').show();
                    isValid = false;
                }
            }
        } catch (error) {
            console.error('Error registering user', error);
        }
    });

    // Hide password error when user types a valid password
    $('#registerPassword').on('input', function () {
        const password = $(this).val();
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;

        if (passwordRegex.test(password)) {
            $('#password-invalid, #password-error').hide();
            $(this).css("border", "");
            $('#password-invalid-error').hide();

        } else {
            $('#registerPassword').css({ "border": "1px solid red" });
            $('#password-error, #password-invalid').show();
            $('#password-invalid-error').show();

        }
    });

     // Email Validation
     $('#registerEmail').on('input', function (){
        const email = $(this).val();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(email)) {
        $('#registerEmail').css("border", "");
        $('#email-error').hide();
        $('#email-invalid-error').hide();

    }else {
        $('#registerEmail').css({ "border": "1px solid red" });
        $('#email-error').show();
        $('#email-invalid-error').show();

    }
    })

    //Username validation
    $('#registerUsername').on('input', function (){
        const username = $(this).val();
        if(username.length < 3){
            $('#username-length-error').show()
            $('#username-error').show()
            $('#registerUsername').css({ "border": "1px solid red" });
        }else{
            $('#username-length-error').hide()
            $('#username-error').hide()
        }
    })
});
