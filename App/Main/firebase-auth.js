import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const config = window.PAPIRVAULT_FIREBASE_CONFIG;

const isValidFirebaseConfig = (value) => {
    if (!value) return false;

    const requiredFields = ["apiKey", "authDomain", "projectId", "appId"];
    const hasAllFields = requiredFields.every((field) => typeof value[field] === "string" && value[field].trim().length > 0);
    if (!hasAllFields) return false;

    const placeholderMarkers = ["YOUR_API_KEY", "YOUR_PROJECT_ID", "YOUR_APP_ID", "YOUR_"];
    const combined = `${value.apiKey} ${value.authDomain} ${value.projectId} ${value.appId}`.toUpperCase();
    return !placeholderMarkers.some((marker) => combined.includes(marker));
};

let auth = null;
let provider = null;

if (isValidFirebaseConfig(config)) {
    const appConfig = {
        ...config,
        storageBucket: config.storageBucket || `${config.projectId}.appspot.com`
    };
    const app = initializeApp(appConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
}

const showMessage = (selector, message) => {
    const element = document.querySelector(selector);
    if (!element) return;
    element.textContent = message;
    element.classList.remove("d-none");
};

const friendlyAuthMessage = (error, context = "generic") => {
    const code = error?.code || "";

    const messages = {
        "auth/email-already-in-use": "This email already has an account. Please login instead.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password is too weak. Use at least 6 characters.",
        "auth/user-not-found": "No account found with this email. Please sign up first.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential": "Invalid credentials. Please check your email and password.",
        "auth/operation-not-allowed": "This login method is currently disabled. Please contact support.",
        "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
        "auth/network-request-failed": "Network issue detected. Check your connection and try again."
    };

    if (messages[code]) return messages[code];

    if (context === "signup") return "Signup failed. Please check your details and try again.";
    if (context === "login") return "Login failed. Please check your credentials and try again.";
    if (context === "resend") return "Unable to resend verification email right now. Please try again.";
    return "Something went wrong. Please try again.";
};

const hideMessage = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return;
    element.classList.add("d-none");
    element.textContent = "";
};

const initGoogleLogin = ({
    buttonSelector = "#googleSignInBtn",
    errorSelector = "#googleAuthError",
    successRedirect = "ClientDashboard.html"
} = {}) => {
    const button = document.querySelector(buttonSelector);
    if (!button) return;

    if (!auth || !provider) {
        showMessage(errorSelector, "Google sign-in is not configured. Add real Firebase values in Main/firebase-env.js");
        return;
    }

    hideMessage(errorSelector);

    getRedirectResult(auth)
        .then((result) => {
            if (result && result.user) {
                window.location.href = successRedirect;
            }
        })
        .catch((error) => {
            showMessage(errorSelector, error.message || "Google sign-in failed. Please try again.");
        });

    button.addEventListener("click", async (event) => {
        event.preventDefault();
        hideMessage(errorSelector);

        try {
            button.setAttribute("disabled", "true");
            await setPersistence(auth, browserLocalPersistence);
            await signInWithPopup(auth, provider);
            window.location.href = successRedirect;
        } catch (error) {
            const popupBlocked = error && (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request");
            if (popupBlocked) {
                await signInWithRedirect(auth, provider);
                return;
            }

            showMessage(errorSelector, error.message || "Google sign-in failed. Please try again.");
        } finally {
            button.removeAttribute("disabled");
        }
    });
};

const initEmailPasswordSignup = ({
    formSelector = "#clientSignUpForm",
    emailSelector = "#signupEmail",
    passwordSelector = "#signupPassword",
    errorSelector = "#signupAuthError",
    successSelector = "#signupAuthSuccess",
    redirectTo = "ClientLogin.html"
} = {}) => {
    const form = document.querySelector(formSelector);
    if (!form || !auth) return;

    const emailInput = document.querySelector(emailSelector);
    const passwordInput = document.querySelector(passwordSelector);
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideMessage(errorSelector);
        hideMessage(successSelector);

        if (!emailInput || !passwordInput) {
            showMessage(errorSelector, "Missing signup fields. Please reload and try again.");
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.setAttribute("disabled", "true");
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';
            }

            await setPersistence(auth, browserLocalPersistence);
            const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
            await sendEmailVerification(userCredential.user);

            showMessage(successSelector, "Account created. Verification email sent. Please verify your email before login.");
            await signOut(auth);

            setTimeout(() => {
                window.location.href = redirectTo;
            }, 1500);
        } catch (error) {
            showMessage(errorSelector, friendlyAuthMessage(error, "signup"));
        } finally {
            if (submitBtn) {
                submitBtn.removeAttribute("disabled");
                submitBtn.innerHTML = 'Create Free Vault';
            }
        }
    });
};

const initEmailPasswordLogin = ({
    formSelector = "#clientLoginForm",
    emailSelector = "#loginEmail",
    passwordSelector = "#loginPassword",
    submitButtonSelector = "#signInBtn",
    errorSelector = "#emailAuthError",
    successSelector = "#emailAuthSuccess",
    resendButtonSelector = "#resendVerificationBtn",
    successRedirect = "ClientDashboard.html"
} = {}) => {
    const form = document.querySelector(formSelector);
    if (!form || !auth) return;

    const emailInput = document.querySelector(emailSelector);
    const passwordInput = document.querySelector(passwordSelector);
    const submitBtn = document.querySelector(submitButtonSelector);
    const resendBtn = document.querySelector(resendButtonSelector);

    if (resendBtn) resendBtn.classList.add("d-none");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideMessage(errorSelector);
        hideMessage(successSelector);
        if (resendBtn) resendBtn.classList.add("d-none");

        if (!emailInput || !passwordInput) {
            showMessage(errorSelector, "Missing login fields. Please reload and try again.");
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.setAttribute("disabled", "true");
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Authenticating...';
            }

            await setPersistence(auth, browserLocalPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);

            showMessage(successSelector, "Login successful. Redirecting...");
            window.location.href = successRedirect;
        } catch (error) {
            showMessage(errorSelector, friendlyAuthMessage(error, "login"));
        } finally {
            if (submitBtn) {
                submitBtn.removeAttribute("disabled");
                submitBtn.innerHTML = 'Sign In to Vault';
            }
        }
    });
};

const initResendVerification = ({
    buttonSelector = "#resendVerificationBtn",
    errorSelector = "#emailAuthError",
    successSelector = "#emailAuthSuccess"
} = {}) => {
    const button = document.querySelector(buttonSelector);
    if (!button || !auth) return;

    button.addEventListener("click", async (event) => {
        event.preventDefault();
        hideMessage(errorSelector);
        hideMessage(successSelector);

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showMessage(errorSelector, "Sign in with your email/password first, then click resend.");
                return;
            }

            await sendEmailVerification(currentUser);
            showMessage(successSelector, "Verification email resent. Please check your inbox.");
        } catch (error) {
            showMessage(errorSelector, friendlyAuthMessage(error, "resend"));
        }
    });
};

const protectPage = ({ redirectTo = "ClientLogin.html", requireVerified = false } = {}) => {
    if (!auth) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = redirectTo;
            return;
        }

        if (requireVerified && !user.emailVerified) {
            await signOut(auth);
            window.location.href = redirectTo;
        }
    });
};

const attachLogout = ({ selector = ".logout-btn", redirectTo = "ClientLogin.html" } = {}) => {
    if (!auth) return;

    document.querySelectorAll(selector).forEach((element) => {
        element.addEventListener("click", async (event) => {
            event.preventDefault();
            await signOut(auth);
            window.location.href = redirectTo;
        });
    });
};

window.PapirVaultAuth = {
    initGoogleLogin,
    initEmailPasswordSignup,
    initEmailPasswordLogin,
    initResendVerification,
    protectPage,
    attachLogout
};
