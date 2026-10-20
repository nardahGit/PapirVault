/*index.html*/
document.addEventListener('DOMContentLoaded', () => {
    // Reveal animation on scroll for security panel
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const securityPanel = document.querySelector('.security-panel');
    if (securityPanel) {
        securityPanel.style.opacity = "0";
        observer.observe(securityPanel);
    }
});

/* --- Global Sidebar Identity Sync (Client + Issuer) --- */

document.addEventListener('DOMContentLoaded', () => {
    const readJsonStorage = (key) => {
        const raw = sessionStorage.getItem(key) || localStorage.getItem(key) || '';
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const toInitials = (name) => {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'CL';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    };

    const deriveNameFromEmail = (email) => {
        const local = String(email || '').split('@')[0] || 'Client';
        return local
            .split(/[._-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ') || 'Client';
    };

    const applyClientSidebar = (profile) => {
        const userCard = document.querySelector('.user-card');
        const classicCard = document.querySelector('.profile-card');

        const target = userCard || classicCard;
        if (!target || !profile) return;

        const name = profile.displayName || deriveNameFromEmail(profile.email) || 'Client';
        const emailOrMeta = profile.email || 'Client Account';
        const initials = profile.initials || toInitials(name);

        const nameEl = target.querySelector('.profile-details .fw-bold') || document.getElementById('clientSidebarName');
        const metaEl = target.querySelector('.profile-details .text-muted') || document.getElementById('clientSidebarMeta');
        const avatarEl = target.querySelector('.avatar, .avatar-circle') || document.getElementById('clientSidebarAvatar');

        if (nameEl) nameEl.textContent = name;
        if (metaEl) metaEl.textContent = emailOrMeta;
        if (avatarEl) avatarEl.textContent = initials;
    };

    const applyIssuerSidebar = (profile) => {
        const issuerCard = document.querySelector('.profile-card-modern');
        if (!issuerCard || !profile) return;

        const name = profile.issuerName || profile.displayName || deriveNameFromEmail(profile.email) || 'Issuer Admin';
        // Always prefer display value for sidebar
        const meta = profile.organizationType || profile.institutionType || profile.organizationTypeKey || profile.email || 'Official Issuer';

        // Prefer explicit IDs if present (for patch compatibility)
        const nameEl = document.getElementById('sidebarIssuerName') || issuerCard.querySelector('.profile-details .fw-bold');
        const metaEl = document.getElementById('sidebarIssuerOrgType') || issuerCard.querySelector('.profile-details .text-muted');
        const avatarEl = issuerCard.querySelector('.avatar-modern');

        if (nameEl) nameEl.textContent = name;
        if (metaEl) metaEl.textContent = meta;
        if (avatarEl && !avatarEl.querySelector('i')) {
            avatarEl.textContent = profile.initials || toInitials(name);
        }
    };

    const clientProfile = readJsonStorage('papirvaultClientProfile');
    const issuerProfile = readJsonStorage('papirvaultIssuerProfile');

    applyClientSidebar(clientProfile);
    applyIssuerSidebar(issuerProfile || clientProfile);

    window.addEventListener('papirvault:profile-updated', (event) => {
        const profile = event?.detail || readJsonStorage('papirvaultClientProfile');
        if (!profile) return;
        applyClientSidebar(profile);
        applyIssuerSidebar(profile);
    });
});
/*ClientLogin*/

function togglePassword() {
    const passwordInput = document.getElementById('passwordInput');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

// Optional: Fancy submit effect
/* --- ClientLogin Functionalies --- */

// ...existing code...
/*ClientLogin Functionality*/

document.addEventListener('DOMContentLoaded', () => {
    const passInput = document.getElementById('loginPassword');
    const eyeBtn = document.getElementById('eyeToggleBtn');
    const eyeIcon = document.getElementById('eyeIcon');

    if (eyeBtn) {
        eyeBtn.addEventListener('click', () => {
            // Toggle the type attribute
            const isPassword = passInput.getAttribute('type') === 'password';
            passInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            // Toggle the icon
            eyeIcon.classList.toggle('bi-eye');
            eyeIcon.classList.toggle('bi-eye-slash');
        });
    }
});

/* ClientSignUp Functionality */
document.addEventListener('DOMContentLoaded', () => {
    // Eye Toggle for Signup
    const signupPass = document.getElementById('signupPassword');
    const signupEyeBtn = document.getElementById('signupEyeToggle');
    const signupEyeIcon = document.getElementById('signupEyeIcon');

    if (signupEyeBtn) {
        signupEyeBtn.addEventListener('click', () => {
            const isPass = signupPass.getAttribute('type') === 'password';
            signupPass.setAttribute('type', isPass ? 'text' : 'password');
            signupEyeIcon.classList.toggle('bi-eye');
            signupEyeIcon.classList.toggle('bi-eye-slash');
        });
    }

    // Password Strength Visual Logic
    if (signupPass) {
        signupPass.addEventListener('input', (e) => {
            const val = e.target.value;
            const bar = document.getElementById('strengthBar');
            const txt = document.getElementById('strengthText');
            
            if (val.length === 0) {
                bar.style.width = "0%";
                txt.innerText = "Strength: None";
            } else if (val.length < 6) {
                bar.style.width = "33%";
                bar.className = "progress-bar bg-danger";
                txt.innerText = "Strength: Weak";
            } else if (val.length < 10) {
                bar.style.width = "66%";
                bar.className = "progress-bar bg-warning";
                txt.innerText = "Strength: Medium";
            } else {
                bar.style.width = "100%";
                bar.className = "progress-bar bg-success";
                txt.innerText = "Strength: Strong";
            }
        });
    }
});

/* --- ClientForgot Functionality --- */

document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const successMsg = document.getElementById('successMessage');

    if (forgotForm && forgotForm.dataset.firebaseReset === 'true') {
        return;
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('forgotEmail');
            const submitBtn = forgotForm.querySelector('button[type="submit"]');

            // 1. Show Loading State
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Sending...';
            submitBtn.disabled = true;

            // 2. Simulate API Call
            setTimeout(() => {
                // Hide the form slowly
                forgotForm.classList.add('opacity-50');
                
                // Show success alert
                successMsg.classList.remove('d-none');
                successMsg.classList.add('animate-up');
                
                // Reset button after success
                submitBtn.innerHTML = 'Link Sent <i class="bi bi-check2 ms-2"></i>';
                submitBtn.className = "btn btn-success w-100 py-3 fw-bold rounded-3 mb-4";
                
                console.log("Recovery email sent to:", emailInput.value);
            }, 2000);
        });
    }
});

/* --- IssuerLogin Functionalities --- */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Password Visibility Toggle
    const issuerEyeBtn = document.getElementById('issuerEyeToggle');
    const issuerPassField = document.getElementById('issuerPassword');
    const issuerEyeIcon = document.getElementById('issuerEyeIcon');

    if (issuerEyeBtn && issuerPassField) {
        issuerEyeBtn.addEventListener('click', () => {
            const isPassword = issuerPassField.type === 'password';
            issuerPassField.type = isPassword ? 'text' : 'password';
            
            issuerEyeIcon.classList.toggle('bi-eye');
            issuerEyeIcon.classList.toggle('bi-eye-slash');
        });
    }

    // 2. Form Submission Simulation & Redirect
    const issuerForm = document.getElementById('issuerLoginForm');

    if (issuerForm) {
        issuerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const issuerNameInput = document.getElementById('issuerOrganizationName');
            const issuerEmailInput = document.getElementById('issuerOfficialEmail');
            const issuerTypeInput = document.getElementById('issuerOrganizationType');
            const rememberInput = document.getElementById('issuerRem');
            const issuerAuthError = document.getElementById('issuerAuthError');

            const issuerName = issuerNameInput?.value?.trim() || '';
            const issuerEmail = issuerEmailInput?.value?.trim() || '';
            const issuerType = issuerTypeInput?.value?.trim() || '';

            if (issuerAuthError) {
                issuerAuthError.classList.add('d-none');
                issuerAuthError.textContent = '';
            }

            if (!issuerName || !issuerEmail || !issuerType) {
                alert('Please complete issuer name, organization type, and official email.');
                return;
            }

            const registeredRaw = localStorage.getItem('papirvaultIssuerAccounts') || '[]';
            let registeredAccounts = [];
            try {
                registeredAccounts = JSON.parse(registeredRaw);
            } catch {
                registeredAccounts = [];
            }

            const normalizedEmail = issuerEmail.toLowerCase();
            const matchedAccount = registeredAccounts.find((entry) => {
                return String(entry.email || '').toLowerCase() === normalizedEmail;
            });

            if (!matchedAccount) {

                if (issuerAuthError) {
                    issuerAuthError.textContent = "You don't have an account yet. Sign up first.";
                    issuerAuthError.classList.remove('d-none');
                }
                return;
            }

            // Strict validation: name and type must match stored account
            const storedName = String(matchedAccount.organizationName || '').trim();
            const storedType = String(matchedAccount.organizationType || matchedAccount.institutionType || '').trim();
            const inputName = String(issuerName).trim();
            const inputType = String(issuerType).trim();

            if (
                storedName.toLowerCase() !== inputName.toLowerCase() ||
                storedType.toLowerCase() !== inputType.toLowerCase()
            ) {
                if (issuerAuthError) {
                    issuerAuthError.textContent = "Organization name or type does not match our records for this email. Please check your details.";
                    issuerAuthError.classList.remove('d-none');
                }
                return;
            }

            const issuerProfile = {
                issuerName: storedName,
                issuerNameKey: storedName.toLowerCase().replace(/\s+/g, ' ').trim(),
                issuerEmail,
                organizationType: storedType,
                organizationTypeKey: storedType.trim().replace(/\s+/g, ' ').toLowerCase()
            };
            
            const loginBtn = issuerForm.querySelector('button[type="submit"]') || document.getElementById('issuerSignInBtn');
            if (!loginBtn) {
                window.location.href = 'IssuerDashboard.html';
                return;
            }
            
            // Show Simulation/Loading State
            loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Verifying Credentials...';
            loginBtn.disabled = true;

            // Simulate Administrative Security Check
            setTimeout(() => {
                loginBtn.innerHTML = 'Authorized. Entering Portal... <i class="bi bi-shield-check-fill ms-2"></i>';
                
                // Swap the theme class with success color
                loginBtn.classList.replace('btn-primary-purple', 'btn-success');

                // Final Redirect to the Issuer Dashboard
                setTimeout(() => {
                    sessionStorage.setItem('papirvaultIssuerSession', 'active');
                    sessionStorage.setItem('papirvaultIssuerProfile', JSON.stringify(issuerProfile));

                    if (rememberInput?.checked) {
                        localStorage.setItem('papirvaultIssuerSession', 'active');
                        localStorage.setItem('papirvaultIssuerProfile', JSON.stringify(issuerProfile));
                    } else {
                        localStorage.removeItem('papirvaultIssuerSession');
                        localStorage.removeItem('papirvaultIssuerProfile');
                    }

                    window.location.href = 'IssuerDashboard.html?issuer=1';
                }, 1000); 
                
            }, 2000);
        });
    }
});
/* --- IssuerSignUp Functionality --- */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Eye Toggle for Issuer Signup
    const iSignupEyeBtn = document.getElementById('issuerSignupEyeToggle');
    const iSignupPassInput = document.getElementById('issuerSignupPassword');
    const iSignupIcon = document.getElementById('issuerSignupEyeIcon');

    if (iSignupEyeBtn && iSignupPassInput) {
        iSignupEyeBtn.addEventListener('click', () => {
            const isPass = iSignupPassInput.type === 'password';
            iSignupPassInput.type = isPass ? 'text' : 'password';
            iSignupIcon.classList.toggle('bi-eye');
            iSignupIcon.classList.toggle('bi-eye-slash');
        });
    }

    // 2. Password Strength Color Logic for Issuer
    if (iSignupPassInput) {
        iSignupPassInput.addEventListener('input', (e) => {
            const val = e.target.value;
            const bar = document.getElementById('issuerStrengthBar');
            const txt = document.getElementById('issuerStrengthText');
            
            if (val.length === 0) {
                bar.style.width = "0%";
                txt.innerText = "Strength: None";
                txt.style.color = "gray";
            } else if (val.length < 6) {
                bar.style.width = "33%";
                bar.className = "progress-bar bg-danger";
                txt.innerText = "Strength: Weak";
                txt.style.color = "#dc3545"; 
            } else if (val.length < 10) {
                bar.style.width = "66%";
                bar.className = "progress-bar bg-warning";
                txt.innerText = "Strength: Medium";
                txt.style.color = "#ffc107";
            } else {
                bar.style.width = "100%";
                bar.className = "progress-bar bg-success";
                txt.innerText = "Strength: Strong";
                txt.style.color = "#198754";
            }
        });
    }

    // 3. Form Submission Handling
    const iSignUpForm = document.getElementById('issuerSignUpForm');
    if (iSignUpForm) {
        iSignUpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = iSignUpForm.querySelector('button[type="submit"]');
            const feedback = document.getElementById('issuerSignupFeedback');
            const orgNameInput = document.getElementById('issuerSignupOrganizationName');
            const institutionTypeInput = document.getElementById('issuerSignupInstitutionType');
            const licenseIdInput = document.getElementById('issuerSignupLicenseId');
            const workEmailInput = document.getElementById('issuerSignupEmail');

            const organizationName = orgNameInput?.value?.trim() || '';
            const institutionType = institutionTypeInput?.value?.trim() || '';
            const licenseId = licenseIdInput?.value?.trim() || '';
            const workEmail = workEmailInput?.value?.trim().toLowerCase() || '';

            if (!organizationName || !institutionType || !licenseId || !workEmail) {
                if (feedback) {
                    feedback.className = 'small mt-2 text-danger';
                    feedback.textContent = 'Please complete all required registration fields.';
                    feedback.classList.remove('d-none');
                }
                return;
            }

            const raw = localStorage.getItem('papirvaultIssuerAccounts') || '[]';
            let accounts = [];
            try {
                accounts = JSON.parse(raw);
            } catch {
                accounts = [];
            }

            const existingIndex = accounts.findIndex((entry) => String(entry.email || '').toLowerCase() === workEmail);

            // Normalize organizationTypeKey for issuer accounts
            const organizationTypeKey = institutionType.trim().replace(/\s+/g, ' ').toLowerCase();
            const accountRecord = {
                organizationName,
                institutionType, // display value
                organizationType: institutionType, // for consistency
                organizationTypeKey, // normalized key
                licenseId,
                email: workEmail,
                updatedAt: Date.now()
            };

            if (existingIndex >= 0) {
                accounts[existingIndex] = { ...accounts[existingIndex], ...accountRecord };
            } else {
                accounts.push({ ...accountRecord, createdAt: Date.now() });
            }

            localStorage.setItem('papirvaultIssuerAccounts', JSON.stringify(accounts));

            if (feedback) {
                feedback.className = 'small mt-2 text-success';
                feedback.textContent = 'Registration saved. You can now log in with your work email.';
                feedback.classList.remove('d-none');
            }

            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting Request...';
            btn.disabled = true;

            setTimeout(() => {
                alert("Registration submitted! Our team will verify your organization within 24-48 hours.");
                window.location.href = "IssuerLogin.html";
            }, 2000);
        });
    }
});


/* --- IssuerForgot Functionality --- */

document.addEventListener('DOMContentLoaded', () => {
    const iForgotForm = document.getElementById('issuerForgotForm');
    const iSuccessMsg = document.getElementById('issuerSuccessMessage');

    if (iForgotForm && iForgotForm.dataset.firebaseReset === 'true') {
        return;
    }

    if (iForgotForm) {
        iForgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = iForgotForm.querySelector('button[type="submit"]');
            const emailVal = document.getElementById('issuerRecoveryEmail').value;

            // 1. Loading State
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Verifying Identity...';
            submitBtn.disabled = true;

            // 2. Simulate Secure API call
            setTimeout(() => {
                // Dim form
                iForgotForm.style.opacity = "0.4";
                iForgotForm.style.pointerEvents = "none";
                
                // Show Success
                iSuccessMsg.classList.remove('d-none');
                iSuccessMsg.classList.add('animate-up');
                
                // Finalize Button
                submitBtn.innerHTML = 'Link Requested <i class="bi bi-check-all ms-2"></i>';
                submitBtn.className = "btn btn-success w-100 py-3 fw-bold rounded-3 mb-4";
                
                console.log("Issuer recovery log: Request for " + emailVal);
            }, 2000);
        });
    }
});


/* --- PapirVault Unified Logic (mmmvn) --- */

document.addEventListener('DOMContentLoaded', () => {
    // 1. SELECT ELEMENTS
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainContent = document.getElementById('mainContent');
    const header = document.querySelector('.dashboard-header'); // Matches your HTML classes
    const viewAllBtn = document.getElementById('viewAllDocs') || document.getElementById('viewAllBtn');

    // 2. SIDEBAR TOGGLE (Desktop & Mobile)
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth > 992) {
                sidebar.classList.toggle('collapsed');
                
                const icon = sidebarToggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('bi-list', !sidebar.classList.contains('collapsed'));
                    icon.classList.toggle('bi-x-lg', sidebar.classList.contains('collapsed'));
                }
            } else {
                // Mobile: Slide in/out
                sidebar.classList.toggle('mobile-active');
            }
        });
    }

    // 3. STICKY HEADER SHADOW ON SCROLL
    if (header) {
        const scrollHandler = () => {
            const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
            const containerScroll = mainContent ? mainContent.scrollTop : 0;
            header.classList.toggle('header-scrolled', (windowScroll > 0 || containerScroll > 0));
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });

        if (mainContent) {
            mainContent.addEventListener('scroll', scrollHandler, { passive: true });
        }

        scrollHandler();
    }

    // 4. AUTO SEARCH WIRING (tables/cards/faq blocks)
    const allTextInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"]'));
    const isSearchInput = (input) => {
        const id = String(input.id || '').toLowerCase();
        const name = String(input.name || '').toLowerCase();
        const placeholder = String(input.placeholder || '').toLowerCase();
        return id.includes('search') || name.includes('search') || placeholder.includes('search');
    };

    allTextInputs
        .filter(isSearchInput)
        .forEach((input) => {
            if (input.dataset.searchCustom === 'true' || input.dataset.searchSkip === 'true') return;

            const scopeSelector = input.dataset.searchScope || '.content-wrapper';
            const itemSelector = input.dataset.searchItems || 'table tbody tr';
            const root = input.closest('main') || document;
            const scope = root.querySelector(scopeSelector) || document.querySelector(scopeSelector) || root;
            if (!scope) return;

            const applyFilter = () => {
                const term = String(input.value || '').trim().toLowerCase();
                const items = Array.from(scope.querySelectorAll(itemSelector));
                if (!items.length) return;

                items.forEach((item) => {
                    const text = String(item.textContent || '').toLowerCase();
                    item.style.display = !term || text.includes(term) ? '' : 'none';
                });
            };

            input.addEventListener('input', applyFilter);
        });

    // 4. VIEW ALL DOCUMENTS TOGGLE
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            const extraRows = document.querySelectorAll('.extra-doc, .extra-row');
            if (extraRows.length > 0) {
                const isHidden = extraRows[0].classList.contains('d-none');
                extraRows.forEach(row => {
                    row.classList.toggle('d-none');
                });
                this.innerText = isHidden ? "Show Less" : "View All";
            }
        });
    }

    // 5. NAV LINK ACTIVE STATE
    const navLinks = document.querySelectorAll('.nav-link-custom, .nav-link-modern');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            
            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('mobile-active');
            }
        });
    });
});




document.addEventListener('DOMContentLoaded', () => {
    const notifTrigger = document.getElementById('notifDropdown');
    const notifDot = document.querySelector('.notification-dot');

    if (notifTrigger && notifDot) {
        notifTrigger.addEventListener('click', () => {
            // Removes the red dot when notifications are opened
            notifDot.style.display = 'none';
        });
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const expandBtn = document.getElementById('expandNotifs');
    const notifContainer = document.getElementById('notifContainer');

    if (expandBtn && notifContainer) {
        expandBtn.addEventListener('click', function(e) {
            // 1. Prevents the dropdown from closing
            e.preventDefault();
            e.stopPropagation();

            // 2. The "More Notifications" data
            const moreNotifs = `
                <li>
                    <a class="dropdown-item p-3 d-flex align-items-start gap-3 border-top" href="#" style="animation: fadeIn 0.3s ease;">
                        <div class="notif-icon bg-info-subtle text-info p-2 rounded-3">
                            <i class="bi bi-info-circle-fill"></i>
                        </div>
                        <div>
                            <div class="fw-bold small">System Update</div>
                            <div class="text-muted extra-small">New security patches applied successfully.</div>
                        </div>
                    </a>
                </li>
                <li>
                    <a class="dropdown-item p-3 d-flex align-items-start gap-3 border-top" href="#" style="animation: fadeIn 0.4s ease;">
                        <div class="notif-icon bg-success-subtle text-success p-2 rounded-3">
                            <i class="bi bi-check-circle-fill"></i>
                        </div>
                        <div>
                            <div class="fw-bold small">Verification Complete</div>
                            <div class="text-muted extra-small">Your Diploma has been verified by the Issuer.</div>
                        </div>
                    </a>
                </li>
            `;

            // 3. Insert the new notifications
            notifContainer.insertAdjacentHTML('beforeend', moreNotifs);

            // 4. Hide the "View More" button after expanding
            this.parentElement.style.display = 'none';
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Force-inject the Keyframes into the document head
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes fadeInUpNotif {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .force-animate {
            animation: fadeInUpNotif 0.5s ease forwards !important;
            display: block !important;
        }
    `;
    document.head.appendChild(styleSheet);

    const expandBtn = document.getElementById('expandNotifs');
    const notifContainer = document.getElementById('notifContainer');

    if (expandBtn && notifContainer) {
        expandBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const moreNotifs = `
                <li class="force-animate">
                    <a class="dropdown-item p-3 d-flex align-items-start gap-3 border-top" href="#">
                        <div class="notif-icon bg-info-subtle text-info p-2 rounded-3">
                            <i class="bi bi-info-circle-fill"></i>
                        </div>
                        <div>
                            <div class="fw-bold small">System Update</div>
                            <div class="text-muted extra-small">Security patches applied.</div>
                        </div>
                    </a>
                </li>
            `;

            notifContainer.insertAdjacentHTML('beforeend', moreNotifs);
            expandBtn.parentElement.style.display = 'none';
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link-custom');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        // 1. Get the 'href' attribute (e.g., 'ClientDocuments.html')
        const linkPath = link.getAttribute('href');

        // 2. Check if the current URL contains the link path
        if (currentPath.includes(linkPath) && linkPath !== "#") {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }

        // 3. Keep the click listener for manual "active" swapping on the same page
        link.addEventListener('click', function() {
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
    });
});




/* --- ClientDocument Logic --- */
document.addEventListener('DOMContentLoaded', () => {
    const copyButtons = document.querySelectorAll('.btn-white');

    copyButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const codeText = this.parentElement.querySelector('.text-primary').innerText;
            navigator.clipboard.writeText(codeText).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check"></i> Copied!';
                this.classList.replace('btn-white', 'btn-success');
                this.classList.add('text-white');
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.replace('btn-success', 'btn-white');
                    this.classList.remove('text-white');
                }, 2000);
            });
        });
    });
});



/* --- ClientVerification Page --- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Copy Verification Code Logic
    const copyTriggers = document.querySelectorAll('.copy-trigger');
    
    copyTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const codeText = this.parentElement.querySelector('.verif-code').innerText;
            navigator.clipboard.writeText(codeText).then(() => {
                const originalIcon = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg text-success"></i>';
                
                setTimeout(() => {
                    this.innerHTML = originalIcon;
                }, 2000);
            });
        });
    });

    // 2. Ensure Sidebar Active State Detection (from previous instruction)
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link-custom');
    navLinks.forEach(link => {
        if (currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });
});

/*ClientVerification Page*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Modal QR Trigger Logic
    const shareButtons = document.querySelectorAll('.share-qr-trigger');
    const qrModalElement = document.getElementById('shareQRModal');
    const verificationResult = document.getElementById('verificationResult');
    const saveQrBtn = document.getElementById('saveQrBtn');
    const qrImage = document.getElementById('qrImage');
    const params = new URLSearchParams(window.location.search);
    const customPublicVerifyBase = (window.PAPIRVAULT_PUBLIC_VERIFY_BASE_URL || '').trim();

    const resolveVerifyBaseUrl = () => {
        if (customPublicVerifyBase) {
            return customPublicVerifyBase;
        }

        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            const current = new URL(window.location.href);
            current.pathname = current.pathname.replace(/ClientVerification\.html$/, 'VerifyStatus.html');
            current.search = '';
            current.hash = '';
            return current.toString();
        }

        return '';
    };

    if (verificationResult && params.has('verify')) {
        const doc = params.get('doc') || 'Document';
        const issuer = params.get('issuer') || 'Unknown issuer';
        const validUntil = params.get('validUntil') || 'Unknown';
        const status = (params.get('status') || '').toLowerCase();

        if (status === 'verified') {
            verificationResult.className = 'alert alert-success rounded-4 shadow-sm mb-4';
            verificationResult.innerHTML = `<strong>${doc}</strong> is verified by <strong>${issuer}</strong> and is valid until <strong>${validUntil}</strong>.`;
        } else {
            verificationResult.className = 'alert alert-warning rounded-4 shadow-sm mb-4';
            verificationResult.innerHTML = `<strong>${doc}</strong> is currently <strong>${status || 'not verified'}</strong>. Please contact <strong>${issuer}</strong> for confirmation.`;
        }
    }
    
    // Check if Bootstrap is loaded and modal exists
    if (qrModalElement && typeof bootstrap !== 'undefined') {
        const qrModal = new bootstrap.Modal(qrModalElement);

        shareButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                const docName = row.querySelector('.fw-bold.small').innerText;
                const verifCode = row.querySelector('.verif-code').innerText;
                const status = row.querySelector('td:nth-child(4) .badge').innerText.trim();
                const issuer = row.getAttribute('data-issuer') || 'Unknown issuer';
                const validUntil = row.getAttribute('data-valid-until') || 'Unknown';

                const verifyBase = resolveVerifyBaseUrl();
                if (!verifyBase) {
                    alert('Set window.PAPIRVAULT_PUBLIC_VERIFY_BASE_URL in Main/firebase-env.js with your hosted VerifyStatus.html URL before sharing QR.');
                    return;
                }

                const verifyUrl = new URL(verifyBase);
                verifyUrl.searchParams.set('verify', '1');
                verifyUrl.searchParams.set('doc', docName);
                verifyUrl.searchParams.set('issuer', issuer);
                verifyUrl.searchParams.set('validUntil', validUntil);
                verifyUrl.searchParams.set('status', status);
                verifyUrl.searchParams.set('code', verifCode);

                // Update Modal Content
                document.getElementById('qrDocName').innerText = docName;
                document.getElementById('qrCodeDisplay').innerText = verifCode;
                
                // Update QR Image using the code
                const qrImg = document.getElementById('qrImage');
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl.toString())}`;

                if (saveQrBtn) {
                    saveQrBtn.onclick = () => {
                        const link = document.createElement('a');
                        link.href = qrImg.src;
                        link.download = `${docName.replace(/\s+/g, '_')}_verification_qr.png`;
                        link.click();
                    };
                }

                qrModal.show();
            });
        });
    }

    if (saveQrBtn && qrImage) {
        saveQrBtn.addEventListener('click', () => {
            if (!qrImage.src) return;
            const link = document.createElement('a');
            link.href = qrImage.src;
            link.download = 'verification_qr.png';
            link.click();
        });
    }

    // 2. Copy Code Logic
    const copyTriggers = document.querySelectorAll('.copy-trigger');
    copyTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const codeText = this.parentElement.querySelector('.verif-code').innerText;
            navigator.clipboard.writeText(codeText).then(() => {
                const icon = this.querySelector('i');
                icon.classList.replace('bi-copy', 'bi-check-lg');
                icon.classList.add('text-success');
                
                setTimeout(() => {
                    icon.classList.replace('bi-check-lg', 'bi-copy');
                    icon.classList.remove('text-success');
                }, 2000);
            });
        });
    });
});




/*HelpCenter Page*/
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Visual feedback
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Message Sent!';
            btn.classList.replace('btn-primary', 'btn-success');
            contactForm.reset();
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.replace('btn-success', 'btn-primary');
            }, 3000);
        });
    }
});



/*IssuerSettings Page*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. API Key Copy Feature
    const copyBtn = document.getElementById('copyKeyBtn');
    const keyInput = document.getElementById('apiKeyInput');

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            // Show the key temporarily to copy
            keyInput.type = 'text';
            keyInput.select();
            document.execCommand('copy');
            keyInput.type = 'password';

            // Visual feedback
            const icon = copyBtn.querySelector('i');
            icon.classList.replace('bi-copy', 'bi-check-lg');
            copyBtn.classList.replace('btn-purple', 'btn-success');

            setTimeout(() => {
                icon.classList.replace('bi-check-lg', 'bi-copy');
                copyBtn.classList.replace('btn-success', 'btn-purple');
            }, 2000);
        });
    }
});


document.addEventListener('DOMContentLoaded', () => {
    // API Key Copy Feature (Settings Page)
    const copyKeyBtn = document.getElementById('copyKeyBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');

    if (copyKeyBtn) {
        copyKeyBtn.addEventListener('click', () => {
            apiKeyInput.type = 'text'; // Reveal
            apiKeyInput.select();
            document.execCommand('copy');
            apiKeyInput.type = 'password'; // Hide again

            // Feedback
            const originalIcon = copyKeyBtn.innerHTML;
            copyKeyBtn.innerHTML = '<i class="bi bi-check2"></i>';
            copyKeyBtn.classList.replace('btn-primary', 'btn-success');

            setTimeout(() => {
                copyKeyBtn.innerHTML = originalIcon;
                copyKeyBtn.classList.replace('btn-success', 'btn-primary');
            }, 2000);
        });
    }
});
