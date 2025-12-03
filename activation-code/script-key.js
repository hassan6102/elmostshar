import { db } from "./firebase.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Global variables
let courseValue = null;
let pdfId = null;
let targetUrl = 'view-pdf.html';

window.setCourseValue = function (value) {
    courseValue = value;
};

window.setPdfId = function (value) {
    pdfId = value;
};

window.setTargetUrl = function (value) {
    // Strip 'activation-code/' prefix if present (since we're already in that folder)
    if (value.startsWith('activation-code/')) {
        targetUrl = value.substring('activation-code/'.length);
    } else {
        targetUrl = value;
    }
};

// Cookie helper functions
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

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

// Generate stable components (resistant to browser updates)
async function generateStableFingerprint() {
    const components = {};

    // 1. STABLE: Hardware-based (doesn't change with browser updates)
    components.cpuCores = navigator.hardwareConcurrency || "unknown";
    components.touchSupport = navigator.maxTouchPoints || 0;
    components.platform = navigator.platform || "";

    // 2. STABLE: Screen metrics (hardware-based)
    components.screenWidth = screen.width;
    components.screenHeight = screen.height;
    components.screenDepth = screen.colorDepth;
    components.pixelRatio = window.devicePixelRatio || 1;

    // 3. SEMI-STABLE: User agent (extract stable parts)
    const ua = navigator.userAgent || "";
    // Extract OS and major browser version only
    components.os = extractOS(ua);
    components.browserFamily = extractBrowserFamily(ua);

    // 4. STABLE: Timezone
    components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 5. STABLE: Language
    components.language = navigator.language || navigator.userLanguage;

    // 6. SEMI-STABLE: WebGL vendor (more stable than full renderer string)
    components.webglVendor = await getWebGLVendor();

    return components;
}

// Extract OS from user agent (stable across browser updates)
function extractOS(ua) {
    if (ua.indexOf("Win") !== -1) return "Windows";
    if (ua.indexOf("Mac") !== -1) return "MacOS";
    if (ua.indexOf("Linux") !== -1) return "Linux";
    if (ua.indexOf("Android") !== -1) return "Android";
    if (ua.indexOf("iOS") !== -1 || ua.indexOf("iPhone") !== -1) return "iOS";
    return "Unknown";
}

// Extract browser family (stable)
function extractBrowserFamily(ua) {
    if (ua.indexOf("Chrome") !== -1) return "Chrome";
    if (ua.indexOf("Firefox") !== -1) return "Firefox";
    if (ua.indexOf("Safari") !== -1) return "Safari";
    if (ua.indexOf("Edge") !== -1) return "Edge";
    return "Unknown";
}

// Get WebGL vendor only (more stable than full renderer)
async function getWebGLVendor() {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
            const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
                const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                return vendor || "unknown";
            }
        }
    } catch (e) {
        return "unknown";
    }
    return "unknown";
}

// Create fingerprint hash from components
async function hashFingerprint(components) {
    const fingerprintString = JSON.stringify(components);
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Calculate similarity score between two fingerprints (0-100)
function calculateSimilarity(fp1, fp2) {
    if (!fp1 || !fp2) return 0;

    let matches = 0;
    let total = 0;

    const keys = ['cpuCores', 'touchSupport', 'platform', 'screenWidth',
        'screenHeight', 'screenDepth', 'pixelRatio', 'os',
        'browserFamily', 'timezone', 'language', 'webglVendor'];

    keys.forEach(key => {
        total++;
        if (fp1[key] === fp2[key]) {
            matches++;
        }
    });

    return (matches / total) * 100;
}

// Show status message
function showStatus(message, type) {
    const status = document.getElementById("status");
    status.innerHTML = message;
    status.className = "";

    if (type === "success") {
        status.classList.add("status-success");
    } else if (type === "error") {
        status.classList.add("status-error");
    } else if (type === "warning") {
        status.classList.add("status-warning");
    } else if (type === "info") {
        status.classList.add("status-info");
    }
}

// Main verification function
window.verifyActivationKey = async function () {
    const enteredKey = document.getElementById("keyInput").value.trim();
    const verifyBtn = document.querySelector(".verify-btn");

    if (!enteredKey) {
        showStatus("⌚ الرجاء إدخال كود التنشيط", "error");
        return;
    }

    if (courseValue === null) {
        showStatus("⌚ خطأ: قيمة الدورة غير محددة. الرجاء المحاولة مرة أخرى من الصفحة الرئيسية.", "error");
        return;
    }

    if (!pdfId) {
        showStatus("⌚ خطأ: معرف PDF غير محدد. الرجاء المحاولة مرة أخرى من الصفحة الرئيسية.", "error");
        return;
    }

    verifyBtn.disabled = true;
    showStatus('⏳ جاري التحقق من الكود... <span class="loading-spinner"></span>', "info");

    try {
        const keyRef = doc(db, "keys", enteredKey);
        const docSnap = await getDoc(keyRef);

        // Case 1: Key not found
        if (!docSnap.exists()) {
            showStatus(" يرجى إدخال كود بشكل صحيح. ", "error");
            verifyBtn.disabled = false;
            return;
        }

        const data = docSnap.data();
        const currentComponents = await generateStableFingerprint();
        const currentHash = await hashFingerprint(currentComponents);

        // Case 2: First time activation
        if (data.isUsed === false && (!data.fingerprintComponents || !data.fingerprintHash)) {
            const storedCourseValue = data.courseValue || 0;
            const enteredCourseValueNum = parseInt(courseValue, 10);

            // Course validation
            if (enteredCourseValueNum > storedCourseValue) {
                showStatus("⌚ عذراً! أنت تحاول الوصول إلى دورة بقيمة أقل من قيمة المحتوى المسموح بها. الرجاء التواصل مع الإدارة.", "error");
                verifyBtn.disabled = false;
                return;
            }

            let successMessage = "✅ تم تفعيل الكود بنجاح! جاري تحويلك...";
            let messageType = "success";

            if (enteredCourseValueNum < storedCourseValue) {
                successMessage = "⚠️ تنبيه: لديك دورة بقيمة أكبر ولكن سيتم السماح بالدخول. جاري تحويلك...";
                messageType = "warning";
                //  verifyBtn.disabled = false;
                // return;
            }

            // Store BOTH hash and components for fuzzy matching
            await updateDoc(keyRef, {
                isUsed: true,
                fingerprintHash: currentHash,
                fingerprintComponents: currentComponents,
                activatedAt: new Date().toISOString()
            });

            showStatus(successMessage, messageType);

            const cookieName = 'pdf_' + pdfId.replace(/\s+/g, '_') + '_key';
            setCookie(cookieName, enteredKey, 365);

            setTimeout(() => {
                window.location.href = "../" + targetUrl + "?pdf_id=" + encodeURIComponent(pdfId) + "&course=" + courseValue;
            }, 2000);
            return;
        }

        // Case 3: Returning user - fuzzy matching
        if (data.fingerprintComponents) {
            const storedComponents = data.fingerprintComponents;
            const similarity = calculateSimilarity(currentComponents, storedComponents);

            console.log("Similarity score:", similarity + "%");

            // Allow if similarity is above 70% (adjust this threshold as needed)
            if (similarity >= 70) {
                // Update hash if it changed (browser update scenario)
                if (data.fingerprintHash !== currentHash) {
                    await updateDoc(keyRef, {
                        fingerprintHash: currentHash,
                        fingerprintComponents: currentComponents,
                        lastUpdatedAt: new Date().toISOString()
                    });
                }

                showStatus("✅ مرحباً بعودتك! تم التحقق من الكود. جاري تحويلك...", "success");

                const cookieName = 'pdf_' + pdfId.replace(/\s+/g, '_') + '_key';
                if (!getCookie(cookieName)) {
                    setCookie(cookieName, enteredKey, 365);
                }

                setTimeout(() => {
                    window.location.href = "../" + targetUrl + "?pdf_id=" + encodeURIComponent(pdfId) + "&course=" + courseValue;
                }, 1500);
                return;
            }
        }

        // Case 4: Exact hash match (fallback)
        if (data.fingerprintHash && data.fingerprintHash === currentHash) {
            showStatus("✅ مرحباً بعودتك! تم التحقق من الكود. جاري تحويلك...", "success");

            const cookieName = 'pdf_' + pdfId.replace(/\s+/g, '_') + '_key';
            if (!getCookie(cookieName)) {
                setCookie(cookieName, enteredKey, 365);
            }

            setTimeout(() => {
                window.location.href = "../" + targetUrl + "?pdf_id=" + encodeURIComponent(pdfId) + "&course=" + courseValue;
            }, 1500);
            return;
        }

        // Case 5: Device mismatch
        showStatus("⌚ هذا الكود مستخدم بالفعل على جهاز آخر! لا يمكن استخدامه على هذا الجهاز.", "error");
        verifyBtn.disabled = false;

    } catch (error) {
        console.error("Error verifying key:", error);
        showStatus("⌚ حدث خطأ في الاتصال: " + error.message + ". الرجاء التحقق من الاتصال بالإنترنت.", "error");
        verifyBtn.disabled = false;
    }
};

// Allow Enter key to submit
document.addEventListener("DOMContentLoaded", function () {
    const keyInput = document.getElementById("keyInput");
    if (keyInput) {
        keyInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                verifyActivationKey();
            }
        });
    }
});

// Check URL parameters
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('course')) {
    setCourseValue(urlParams.get('course'));
}
if (urlParams.has('pdf_id')) {
    setPdfId(urlParams.get('pdf_id'));
}
if (urlParams.has('targetUrl')) {
    setTargetUrl(urlParams.get('targetUrl'));
}
