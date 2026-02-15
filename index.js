const form = document.getElementById('form');
const username = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const password2 = document.getElementById('password2');

form.addEventListener('submit', e => {
    e.preventDefault();
    if(password.value !== password2.value) {
        alert("Passwords do not match.");
        return;
    }
    const user = {
        username: username.value,
        email: email.value,
        password: password.value
    };

    window.location.href = "home.html";
});