function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
    }
    return null;
}

// تحديد الصفحة الحالية
const currentPage = window.location.pathname.split("/").pop(); // final1.html أو final2.html

// إعداد pdfId و targetUrl حسب الصفحة
let pdfId = '';
let targetUrl = currentPage;
let courseValue = '30'; // ممكن تغييره لو كل مادة كورس مختلف

if (currentPage === 'term_2.html') {
    pdfId = 'term_2';
} 

// التحقق من الكوكيز
if (pdfId) {
    const cookieName = 'pdf_' + pdfId.replace(/\s+/g, '_') + '_key';
    const storedKey = getCookie(cookieName);

    if (!storedKey) {
        console.log("No activation key found. Redirecting...");
        window.location.href = 'activation-code/activation-key.html?course=' 
            + courseValue 
            + '&pdf_id=' + encodeURIComponent(pdfId) 
            + '&targetUrl=' + encodeURIComponent(targetUrl);
    } else {
        console.log("Valid activation key found for " + pdfId + ". Access granted.");
    }
}

