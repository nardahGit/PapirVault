// --- ISSUER PROFILE HELPERS ---
const saveIssuerProfile = (user, extra = {}) => {
	if (!user) return;
	const displayName = toDisplayNameFromUser(user);
	const profile = {
		uid: user.uid || "",
		displayName,
		email: user.email || "",
		initials: toInitials(displayName),
		...extra
	};
	sessionStorage.setItem("papirvaultIssuerProfile", JSON.stringify(profile));
	localStorage.setItem("papirvaultIssuerProfile", JSON.stringify(profile));
};
const clearIssuerProfile = () => {
	sessionStorage.removeItem("papirvaultIssuerProfile");
	localStorage.removeItem("papirvaultIssuerProfile");
};

const getStoredIssuerProfile = () => {
	const fromSession = sessionStorage.getItem("papirvaultIssuerProfile") || "";
	const fromLocal = localStorage.getItem("papirvaultIssuerProfile") || "";
	const raw = fromSession || fromLocal;
	if (!raw) return null;
	try { return JSON.parse(raw); } catch { return null; }
};

// --- ISSUER SIGNUP ---
const initIssuerSignUp = ({
	formSelector = "#issuerSignUpForm",
	orgNameSelector = "#issuerSignupOrganizationName",
	orgTypeSelector = "#issuerSignupInstitutionType",
	licenseIdSelector = "#issuerSignupLicenseId",
	emailSelector = "#issuerSignupEmail",
	passwordSelector = "#issuerSignupPassword",
	errorSelector = "#issuerSignupFeedback",
	successSelector = "#issuerSignupFeedback",
	redirectTo = "IssuerLogin.html"
} = {}) => {
	const form = document.querySelector(formSelector);
	if (!form) {
		console.error('[IssuerSignup] Signup form not found:', formSelector);
		return;
	}
	if (!auth) {
		console.error('[IssuerSignup] Firebase Auth not initialized.');
		return;
	}
	const orgNameInput = document.querySelector(orgNameSelector);
	const orgTypeInput = document.querySelector(orgTypeSelector);
	const licenseIdInput = document.querySelector(licenseIdSelector);
	const emailInput = document.querySelector(emailSelector);
	const passwordInput = document.querySelector(passwordSelector);
	const submitBtn = form.querySelector('button[type="submit"]');

	console.log('[IssuerSignup] Attaching submit handler to issuer signup form.');
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		console.log('[IssuerSignup] Submit event fired.');
		hideMessage(errorSelector);
		hideMessage(successSelector);
		if (!orgNameInput || !orgTypeInput || !licenseIdInput || !emailInput || !passwordInput) {
			showMessage(errorSelector, "Missing signup fields. Please reload and try again.");
			return;
		}
		try {
			console.log('[IssuerSignup] Attempting signup for email:', emailInput.value);
			if (submitBtn) {
				submitBtn.setAttribute("disabled", "true");
				submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';
			}
			await setPersistence(auth, browserLocalPersistence);
			const normalizedEmail = emailInput.value.trim().toLowerCase();
			// Check if email already exists in Firebase Auth
			try {
				await createUserWithEmailAndPassword(auth, normalizedEmail, passwordInput.value);
			} catch (error) {
				console.error('[IssuerSignup] Firebase error:', error);
				if (error.code === 'auth/email-already-in-use') {
					showMessage(errorSelector, "This email already has an account. Please login instead.");
					if (submitBtn) {
						submitBtn.removeAttribute("disabled");
						submitBtn.innerHTML = 'Register Organization';
					}
					return;
				} else if (error.code === 'auth/weak-password') {
					showMessage(errorSelector, "Password is too weak. Please use at least 6 characters.");
					if (submitBtn) {
						submitBtn.removeAttribute("disabled");
						submitBtn.innerHTML = 'Register Organization';
					}
					return;
				} else {
					showMessage(errorSelector, friendlyAuthMessage(error, "signup"));
					if (submitBtn) {
						submitBtn.removeAttribute("disabled");
						submitBtn.innerHTML = 'Register Organization';
					}
					return;
				}
			}
			// If we reach here, user was created in Firebase Auth
			const user = auth.currentUser;
			await updateProfile(user, { displayName: orgNameInput.value.trim() });
			saveIssuerProfile(user, {
				orgName: orgNameInput.value.trim(),
				orgType: orgTypeInput.value,
				licenseId: licenseIdInput.value.trim()
			});
			await sendEmailVerification(user);
			showMessage(successSelector, "Account created. Verification email sent. Please verify your email before login.");
			await signOut(auth);
			console.log('[IssuerSignup] Signup successful, redirecting to login.');
			setTimeout(() => { window.location.href = redirectTo; }, 2000);
		} finally {
			if (submitBtn) {
				submitBtn.removeAttribute("disabled");
				submitBtn.innerHTML = 'Register Organization';
			}
		}
	});
};

// --- ISSUER LOGIN ---
const initIssuerLogin = ({
	formSelector = "#issuerLoginForm",
	orgNameSelector = "#issuerOrganizationName",
	orgTypeSelector = "#issuerOrganizationType",
	emailSelector = "#issuerOfficialEmail",
	passwordSelector = "#issuerPassword",
	errorSelector = "#issuerAuthError",
	successRedirect = "IssuerDashboard.html"
} = {}) => {
	const form = document.querySelector(formSelector);
	if (!form) {
		console.error('[IssuerLogin] Login form not found:', formSelector);
		return;
	}
	if (!auth) {
		console.error('[IssuerLogin] Firebase Auth not initialized.');
		return;
	}
	const orgNameInput = document.querySelector(orgNameSelector);
	const orgTypeInput = document.querySelector(orgTypeSelector);
	const emailInput = document.querySelector(emailSelector);
	const passwordInput = document.querySelector(passwordSelector);
	const submitBtn = form.querySelector('button[type="submit"]');

	console.log('[IssuerLogin] Attaching submit handler to issuer login form.');
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		console.log('[IssuerLogin] Submit event fired.');
		hideMessage(errorSelector);
		if (!orgNameInput || !orgTypeInput || !emailInput || !passwordInput) {
			showMessage(errorSelector, "Missing login fields. Please reload and try again.");
			return;
		}
		try {
			console.log('[IssuerLogin] Attempting login for email:', emailInput.value);
			if (submitBtn) {
				submitBtn.setAttribute("disabled", "true");
				submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Authenticating...';
			}
			await setPersistence(auth, browserLocalPersistence);
			const normalizedEmail = emailInput.value.trim().toLowerCase();
			const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, passwordInput.value);
			if (!userCredential.user.emailVerified) {
				showMessage(errorSelector, "Please verify your email before logging in.");
				await signOut(auth);
				return;
			}
			// Save issuer profile with extra info
			saveIssuerProfile(userCredential.user, {
				orgName: orgNameInput.value.trim(),
				orgType: orgTypeInput.value
			});
			window.location.href = successRedirect;
		} catch (error) {
			console.error('[IssuerLogin] Firebase error:', error);
			if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
				showMessage(errorSelector, "Invalid email or password. Please try again or sign up.");
			} else {
				showMessage(errorSelector, friendlyAuthMessage(error, "login"));
			}
		} finally {
			if (submitBtn) {
				submitBtn.removeAttribute("disabled");
				submitBtn.innerHTML = 'Sign In as Issuer <i class="bi bi-box-arrow-in-right ms-2"></i>';
			}
		}
	});
};
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

updateProfile,

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

			console.log('[IssuerLogin] Login successful, redirecting to dashboard.');
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

const normalizedEmail = emailInput.value.trim().toLowerCase();



// STEP 1: REMOVE the 'fetchSignInMethodsForEmail' block entirely.

// STEP 2: Just try to create the user immediately.

const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, passwordInput.value);



// STEP 3: Send verification and sign out (to force them to log in after verifying)

await sendEmailVerification(userCredential.user);



showMessage(successSelector, "Account created. Verification email sent. Please verify your email before login.");

await signOut(auth);



setTimeout(() => {

window.location.href = redirectTo;

}, 2000);



} catch (error) {

console.error("Signup Error:", error.code);


// STEP 4: Handle the "Already Exists" error here instead of the 'if' statement above

if (error.code === 'auth/email-already-in-use') {

showMessage(errorSelector, "This email already has an account. Please login instead.");

} else if (error.code === 'auth/weak-password') {

showMessage(errorSelector, "Password is too weak. Please use at least 6 characters.");

} else {

showMessage(errorSelector, friendlyAuthMessage(error, "signup"));

}

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

const normalizedEmail = emailInput.value.trim().toLowerCase();



// STEP 1: Skip the 'fetchMethods' check. Just try to sign in.

const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, passwordInput.value);



// STEP 2: Check if they verified their email

if (!userCredential.user.emailVerified) {

showMessage(errorSelector, "Please verify your email before logging in.");

if (resendBtn) resendBtn.classList.remove("d-none");

await signOut(auth); // Log them out if not verified

return;

}



saveClientProfile(userCredential.user);

showMessage(successSelector, "Login successful. Redirecting...");

window.location.href = successRedirect;



} catch (error) {

console.error("Login Error:", error.code);

// Handle the modern 'invalid-credential' error which covers user-not-found & wrong-password

if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {

showMessage(errorSelector, "Invalid email or password. Please try again or sign up.");

} else {

showMessage(errorSelector, friendlyAuthMessage(error, "login"));

}

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



const getStoredProfile = () => {

const fromSession = sessionStorage.getItem("papirvaultClientProfile") || "";

const fromLocal = localStorage.getItem("papirvaultClientProfile") || "";

const raw = fromSession || fromLocal;

if (!raw) return null;



try {

return JSON.parse(raw);

} catch {

return null;

}

};



const getCurrentUserProfile = () => {

const currentUser = auth?.currentUser;

if (currentUser) {

const displayName = toDisplayNameFromUser(currentUser);

return {

uid: currentUser.uid || "",

displayName,

email: currentUser.email || "",

initials: toInitials(displayName)

};

}



return getStoredProfile();

};



const updateCurrentUserDisplayName = async (displayName) => {

if (!auth?.currentUser) {

throw new Error("No active user session. Please sign in again.");

}



const trimmed = String(displayName || "").trim();

if (!trimmed) {

throw new Error("Display name cannot be empty.");

}



await updateProfile(auth.currentUser, { displayName: trimmed });

saveClientProfile(auth.currentUser);



const profile = getCurrentUserProfile();

window.dispatchEvent(new CustomEvent("papirvault:profile-updated", { detail: profile }));

return profile;

};



window.PapirVaultAuth = {

initGoogleLogin,

initEmailPasswordSignup,

initEmailPasswordLogin,

initResendVerification,

initPasswordResetRequest,

initPasswordResetPage,

protectPage,

attachLogout,
getCurrentUserProfile,
updateCurrentUserDisplayName,
initIssuerSignUp,
initIssuerLogin
};