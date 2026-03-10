# PapirVault

PapirVault is a Firebase-backed web application for document upload, issuer verification, and secure verification workflows for both client and issuer users.

## Changelog

Use this format for future updates:

```md
## [vX.Y.Z] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Pending
- ...
```

## [v0.1.0] - 2026-03-10

### Added
- Issuer verification-code modal with search, copy, and proper empty states.
- Legal receipt flow with preview, print, HTML download, and PDF export.
- Shared password reset page (`App/Body/PasswordReset.html`).
- Issuer support `mailto:` compose flow in `App/Body/IssuerHelp.html`.
- Client support `mailto:` compose flow in `App/Body/HelpCenter.html`.

### Changed
- Issuer documents page now starts with real empty state for new issuers (no demo rows).
- Client and issuer forgot pages now use Firebase reset request flow.

### Fixed
- Runtime expiration/status and QR payload synchronization on document fetch in `App/Main/firebase-documents.js`.
- Prevented legacy simulated forgot handlers from conflicting with Firebase reset flow.

### Pending
- Firebase email/password reset-link delivery validation and provider configuration.

## Update Log (March 10, 2026)

This section records the working changes completed today, including how each feature was implemented and the resulting behavior.

### 1) Issuer verification codes modal (working)

What was done:
- In `App/Body/IssuerDocuments.html`, the quick action was improved to show a real "View Verification Codes" modal.
- Added search/filter support and copy action for code entries.
- Added correct empty states when no records exist.

Result:
- Issuers can open a dedicated modal to view and manage verification codes.
- New issuers with no uploads see a clean empty state (no fake/demo data).

### 2) Legal receipt generation + export (working)

What was done:
- In `App/Body/IssuerDocuments.html`, implemented receipt workflow:
- Select document -> preview legal receipt -> print / download HTML / download PDF.
- Added row-level "Receipt" shortcut in recent uploads to open receipt flow with preselected document.

Result:
- Issuers can generate and export legal receipts directly from the page.
- Receipt access is faster via row-level shortcut.

### 3) New issuer empty-state behavior (working)

What was done:
- Removed static sample rows and demo placeholders from issuer document listings.
- Enforced real-data-first rendering in `App/Body/IssuerDocuments.html`.

Result:
- New issuer accounts do not see fake records before first upload.
- Table state accurately reflects actual account data.

### 4) Expiration status + QR sync on read (working)

What was done:
- In `App/Main/firebase-documents.js`, added runtime status re-evaluation when documents are fetched.
- Added read-time synchronization of status, reason, and QR payload when drift is detected.

Result:
- Expired documents are consistently reflected even if time passes after upload.
- Verification/QR payload stays aligned with current document validity.

### 5) Password reset flow pages and logic (working in app flow)

What was done:
- Added reset request and reset confirmation initializers in `App/Main/firebase-auth.js`.
- Updated `App/Body/ClientForgot.html` and `App/Body/IssuerForgot.html` to use Firebase reset request flow.
- Added shared reset page: `App/Body/PasswordReset.html`.
- Guarded legacy simulated forgot handlers in `App/Main/script.js` to avoid conflict.

Result:
- App-side forgot/reset flow is wired for both roles.
- Reset page correctly requires a valid Firebase `oobCode` from email link.

### 6) Issuer support form mailto flow (working)

What was done:
- In `App/Body/IssuerHelp.html`, replaced simulated submit behavior with real `mailto:` compose flow.
- Added topic, optional reference ID, request ID generation, and prefilled email body.
- Added fallback notice if local mail app does not auto-open.

Result:
- Issuer support requests now open user email client addressed to support mailbox.
- No insecure fake "admin inbox" behavior in frontend-only flow.

### 7) Client support form mailto flow (working)

What was done:
- In `App/Body/HelpCenter.html`, wired the contact form to `mailto:`.
- Added required topic/message inputs, request ID generation, and prefilled subject/body.
- Added fallback notice if mail app does not auto-open.

Result:
- Client support requests now use real email client workflow.
- `ClientUpgrade` -> `HelpCenter` support path now lands on functional contact flow.

## Pending / Next Step

### Email link delivery and provider configuration (pending)

Status:
- Pending Firebase-side configuration and account-provider validation.

Notes:
- Password reset email delivery can fail or appear inconsistent when account provider is Google-only (not email/password).
- `PasswordReset.html` directly opened without `oobCode` is expected to show "invalid/missing link".
- Next session should finalize Firebase Auth provider/email action settings and test end-to-end on a true email/password account.

## Operational Notes

- Support destination emails are currently placeholders and should be replaced with real mailboxes:
- `App/Body/IssuerHelp.html`: `SUPPORT_EMAIL`
- `App/Body/HelpCenter.html`: `SUPPORT_EMAIL`

- Latest diagnostics for edited files during this session returned no syntax/lint errors in VS Code problems check.
