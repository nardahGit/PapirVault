/**
 * Script to update all emails in the 'profiles' collection to lowercase.
 * Run this in a Node.js environment with Firebase Admin SDK configured.
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function lowercaseEmails() {
  const profilesRef = db.collection('profiles');
  const snapshot = await profilesRef.get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.email && data.email !== data.email.toLowerCase()) {
      await doc.ref.update({ email: data.email.toLowerCase() });
      updated++;
      console.log(`Updated: ${doc.id} -> ${data.email.toLowerCase()}`);
    }
  }
  console.log(`Done. Updated ${updated} profile(s).`);
}

lowercaseEmails().catch(console.error);