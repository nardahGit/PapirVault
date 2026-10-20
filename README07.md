# How to Access and Upload to PapirVault

## Website URLs

You can access the PapirVault website at:

- **Production:** https://nardev.web.app
- **Preview/Alternate:** https://nardahdev.firebaseapp.com

To use the website, simply open your web browser and enter one of the URLs above.

---

## How to Upload/Deploy Your Source Code

If you want to upload your source code and update the website, follow these steps:

1. **Make your code changes locally.**
2. **Commit and push** your changes to your remote repository (e.g., GitHub).
3. **Deploy to Firebase Hosting:**
   - Open your terminal in the project folder.
   - Run:

     firebase deploy

   - This command uploads your latest code to Firebase Hosting.

4. **Visit the website:**
   - After deployment, open https://nardev.web.app or https://nardahdev.firebaseapp.com in your browser to see your changes live.

---

### Notes for Users

- Make sure you have the Firebase CLI installed and are logged in (`firebase login`).
- The main URL for users is **https://nardev.web.app**.
- If you need to share the website, give others the above URL.
- For more details, see your `firebase.json` and Firebase Hosting documentation.
