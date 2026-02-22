function toggleMenu() {
    console.log("CLICKED");
    const nav = document.getElementById("navLinks");
    nav.classList.toggle("active");
}
function togglePassword() {
    const input = document.getElementById("passwordInput");

    if (!input) return;

    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}