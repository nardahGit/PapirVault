# PapirVault - Project Functionality Overview

This README explains what each page does, how the frontend behaves, how backend services are used, and how data is stored.
The goal is to make it easy for classmates to understand the app quickly.

## 1) Frontend Pages and What They Do

### Public / Entry
- `index.html`: Landing page for PapirVault.
- `HelpCenter.html`: Public help/contact style page.

### Client Side
- `ClientLogin.html`: Client sign in page.
- `ClientSignUp.html`: Client registration page.
- `ClientForgot.html`: Client password recovery page.
- `ClientDashboard.html`: Main client dashboard. Shows client documents, verification codes, search, copy code, and QR modal.
- `ClientDocuments.html`: Client document details/overview page.
- `ClientVerification.html`: Client verification center with QR-related actions.
- `ClientSettings.html`: Client account/settings page.
- `ClientUpgrade.html`: Client upgrade plan page.

### Issuer Side
- `IssuerLogin.html`: Issuer login page.
- `IssuerSignUp.html`: Issuer registration page.
- `IssuerForgot.html`: Issuer password recovery page.
- `IssuerDashboard.html`: Issuer summary page.
- `IssuerDocuments.html`: Issuer register/upload flow (currently demo-safe registration mode with auto verification code generation).
- `IssuerVerification.html`: Issuer verification checks page.
- `IssuerSettings.html`: Issuer settings page.
- `IssuerUpgrade.html`: Issuer upgrade plan page.
- `IssuerHelp.html`: Issuer help page.

### QR Verify Result Page
- `VerifyStatus.html`: Public page opened from QR scan. Shows if document is verified, issuer name, and valid-until date.

---

## 2) Frontend Behavior (How UI works)

- UI uses Bootstrap + custom styles (`App/Styles/style.css`, `themes.css`, `fonts.css`).
- `App/Main/script.js` handles interactions (sidebar toggle, search filtering, buttons, modal behavior, etc.).
- Client dashboard behavior:
	- Loads documents for logged-in client.
	- Search filters by title/category/issuer/code.
	- `Copy Code` copies verification code.
	- `QR` opens a modern modal and generates a scannable QR.
- QR scan opens `VerifyStatus.html` and displays verification details in a clean status card.

---

## 3) Backend Behavior (Service logic)

There is no custom server API yet. The app uses Firebase as backend services.

- Firebase Authentication:
	- Handles login/signup/session checks.
	- Used for protecting client pages.
- Firestore:
	- Stores document records and notifications.
- Firebase Storage:
	- Intended for file upload.
	- For demo reliability, issuer flow can still register document metadata/code even if file upload is unavailable.

Main data module:
- `App/Main/firebase-documents.js`
	- Generates automatic verification code (example: `HLT-2026-ABC123`).
	- Creates document record in Firestore.
	- Creates notification for client.
	- Supports listing and searching client documents.

---

## 4) Database Behavior (How data moves)

### Main Collections
- `documents`
	- Stores: owner UID, issuer name, title/category, status, verification code, dates, QR payload, and file metadata.
- `notifications`
	- Stores: target client UID, message/title, related document ID, read status.

### Data Flow
1. Issuer registers a document on `IssuerDocuments.html`.
2. App generates a unique verification code automatically.
3. Document record is saved to Firestore.
4. Notification is saved for the client.
5. Client logs in and sees the same document + same code in `ClientDashboard.html`.
6. Client can copy the code or show QR.
7. QR scan opens `VerifyStatus.html` with verification result details.

---

## 5) Current Demo Notes

- App is configured for demo-first reliability.
- If storage upload has issues, metadata + verification flow still works.
- Firestore/Storage security rules were temporarily relaxed for testing/demo.

Next task: Replace demo-open Firebase rules with secure production rules and add role-based access control (issuer/client) before final deployment.

---

## 6) Future Changes (Next Improvement Ideas)

### Security and Access
- Add strict Firestore and Storage rules (remove demo-open rules).
- Implement real role-based access control (`issuer`, `client`, `admin`).
- Restrict issuer document creation to verified issuer accounts only.
- Log security events (failed login, invalid verification attempts, unusual activity).

### Issuer Workflow
- Replace `Client UID` manual input with client email lookup.
- Add issuer-side document status flow: Draft -> Submitted -> Verified.
- Add upload progress bar and file validation (size/type checks with clear messages).
- Add bulk upload for multiple documents.

### Client Experience
- Add client notification center with read/unread status.
- Add document filters by category, status, and date.
- Add client timeline showing when a document was created and verified.
- Add "download verification receipt" (PDF summary only, not original file).

### Verification and QR
- Add QR expiration time for shared verification links.
- Add anti-tamper signature in QR payload.
- Add verification attempt logs (who scanned, when, result).
- Add support for revoking a verification code.

### Data and Performance
- Add Firestore indexes for search-heavy fields.
- Add pagination for dashboard tables.
- Cache recent document queries for faster page load.
- Add background cleanup job for expired records.

### Reliability and DevOps
- Add environment separation (`dev`, `staging`, `prod`).
- Add automated tests for register/search/verify flow.
- Add CI/CD pipeline for safe deployments.
- Add central error tracking and monitoring dashboard.

### Presentation-Ready Improvements
- Add one-click "Demo Seed Data" button.
- Add role switch helper for classroom demo.
- Add guided demo overlay (step-by-step hints on the UI).
- Add polished success/toast messages for every major action.


### FIDERANA NARDAH MAMELPHINA
