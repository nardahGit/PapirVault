import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    sendEmailVerification,
    sendPasswordResetEmail,
    verifyPasswordResetCode,
    confirmPasswordReset,
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

const toDisplayNameFromUser = (user) => {
    if (!user) return "Client";
    if (typeof user.displayName === "string" && user.displayName.trim()) return user.displayName.trim();

    const email = (user.email || "").trim();
    if (!email) return "Client";

    const local = email.split("@")[0] || "Client";
    return local
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || "Client";
};

const toInitials = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "CL";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const saveClientProfile = (user) => {
    if (!user) return;

    const displayName = toDisplayNameFromUser(user);
    const profile = {
        uid: user.uid || "",
        displayName,
        email: user.email || "",
        initials: toInitials(displayName)
    };

    sessionStorage.setItem("papirvaultClientProfile", JSON.stringify(profile));
    localStorage.setItem("papirvaultClientProfile", JSON.stringify(profile));
};

const clearClientProfile = () => {
    sessionStorage.removeItem("papirvaultClientProfile");
    localStorage.removeItem("papirvaultClientProfile");
};

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
                saveClientProfile(result.user);
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
            const userCredential = await signInWithPopup(auth, provider);
            saveClientProfile(userCredential.user);
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
            const normalizedEmail = emailInput.value.trim();
            const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
            if (!methods.length) {
                showMessage(errorSelector, "You don't have an account yet. Please sign up first.");
                return;
            }

            const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, passwordInput.value);
            saveClientProfile(userCredential.user);

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

const initPasswordResetRequest = ({
    formSelector,
    emailSelector,
    submitButtonSelector,
    successSelector,
    errorSelector,
    continueUrl,
    sendingLabel = "Sending...",
    idleLabel = "Send Reset Link",
    successMessage = "If the email is registered, a reset link has been sent. Please check your inbox."
} = {}) => {
    const form = document.querySelector(formSelector);
    if (!form || !auth) return;

    const emailInput = document.querySelector(emailSelector);
    const submitBtn = document.querySelector(submitButtonSelector) || form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        hideMessage(successSelector);
        hideMessage(errorSelector);

        const email = String(emailInput?.value || "").trim();
        if (!email) {
            showMessage(errorSelector, "Please enter your email address.");
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.setAttribute("disabled", "true");
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${sendingLabel}`;
            }

            const actionCodeSettings = continueUrl
                ? { url: continueUrl, handleCodeInApp: false }
                : undefined;

            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            showMessage(successSelector, successMessage);
            form.classList.add("opacity-50");
            form.style.pointerEvents = "none";
        } catch (error) {
            const code = error?.code || "";

            // Avoid account enumeration in UI.
            if (code === "auth/user-not-found") {
                showMessage(successSelector, successMessage);
                form.classList.add("opacity-50");
                form.style.pointerEvents = "none";
                return;
            }

            showMessage(errorSelector, friendlyAuthMessage(error, "generic"));
        } finally {
            if (submitBtn) {
                submitBtn.removeAttribute("disabled");
                submitBtn.innerHTML = idleLabel;
            }
        }
    }, true);
};

const initPasswordResetPage = ({
    formSelector = "#passwordResetForm",
    passwordSelector = "#newPassword",
    confirmSelector = "#confirmPassword",
    submitButtonSelector = "#resetSubmitBtn",
    errorSelector = "#resetError",
    successSelector = "#resetSuccess",
    statusSelector = "#resetStatus",
    emailHintSelector = "#resetEmailHint",
    clientLoginHref = "ClientLogin.html",
    issuerLoginHref = "IssuerLogin.html"
} = {}) => {
    if (!auth) return;

    const form = document.querySelector(formSelector);
    if (!form) return;

    const passwordInput = document.querySelector(passwordSelector);
    const confirmInput = document.querySelector(confirmSelector);
    const submitBtn = document.querySelector(submitButtonSelector);
    const statusEl = document.querySelector(statusSelector);
    const emailHintEl = document.querySelector(emailHintSelector);

    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get("oobCode") || "";
    const role = (params.get("role") || "client").toLowerCase();
    const loginHref = role === "issuer" ? issuerLoginHref : clientLoginHref;

    const setStatus = (text, type = "info") => {
        if (!statusEl) return;
        statusEl.className = `alert alert-${type} rounded-3 py-2 px-3 mb-3`;
        statusEl.textContent = text;
        statusEl.classList.remove("d-none");
    };

    hideMessage(errorSelector);
    hideMessage(successSelector);

    if (!oobCode) {
        setStatus("Reset link is invalid or missing. Please request a new password reset email.", "warning");
        form.classList.add("opacity-50");
        form.style.pointerEvents = "none";
        return;
    }

    verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
            if (emailHintEl) {
                emailHintEl.textContent = `Resetting password for ${email}`;
            }
        })
        .catch(() => {
            setStatus("This reset link has expired or has already been used. Request a new link.", "danger");
            form.classList.add("opacity-50");
            form.style.pointerEvents = "none";
        });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideMessage(errorSelector);
        hideMessage(successSelector);

        const newPassword = String(passwordInput?.value || "");
        const confirmPassword = String(confirmInput?.value || "");

        if (newPassword.length < 6) {
            showMessage(errorSelector, "Password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage(errorSelector, "Passwords do not match.");
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.setAttribute("disabled", "true");
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            }

            await confirmPasswordReset(auth, oobCode, newPassword);
            showMessage(successSelector, "Password updated successfully. Redirecting to login...");
            setTimeout(() => {
                window.location.href = loginHref;
            }, 1500);
        } catch (error) {
            showMessage(errorSelector, friendlyAuthMessage(error, "generic"));
        } finally {
            if (submitBtn) {
                submitBtn.removeAttribute("disabled");
                submitBtn.innerHTML = "Set New Password";
            }
        }
    });
};

const protectPage = ({ redirectTo = "ClientLogin.html", requireVerified = false } = {}) => {
    if (!auth) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            clearClientProfile();
            window.location.href = redirectTo;
            return;
        }

        saveClientProfile(user);

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
            clearClientProfile();
            window.location.href = redirectTo;
        });
    });
};

window.PapirVaultAuth = {
    initGoogleLogin,
    initEmailPasswordSignup,
    initEmailPasswordLogin,
    initResendVerification,
    initPasswordResetRequest,
    initPasswordResetPage,
    protectPage,
    attachLogout
};
