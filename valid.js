// check if he enter in unusual way
// Activation Key Protection
// Check if user has valid activation key before allowing access to this page
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Check for valid activation key cookie
const pdfId = 'midterm_notes00';
const cookieName = 'pdf_' + pdfId.replace(/\s+/g, '_') + '_key';
const storedKey = getCookie(cookieName);

// If no valid key found, redirect to activation page
if (!storedKey) {
    console.log("No activation key found. Redirecting to activation page...");
    const courseValue = '30';
    const targetUrl = 'final1.html';
    window.location.href = 'activation-code/activation-key.html?course=' + courseValue + '&pdf_id=' + encodeURIComponent(pdfId) + '&targetUrl=' + encodeURIComponent(targetUrl);
} else {
    console.log("Valid activation key found. Access granted.");
}
